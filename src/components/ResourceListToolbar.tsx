import {
  CloseOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Drawer,
  Grid,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  type InputRef,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import { EntityPicker } from "./EntityPicker";
import type { ResourceFilterControl } from "./resources/resourceFilterControls";

export interface ResourceListToolbarProps {
  /** Mã định danh resource (ví dụ "trucks", "loads"). */
  resource: string;
  /** Tiêu đề hiển thị của resource (ví dụ "Xe tải", "Chuyến hàng"). */
  resourceLabel: string;
  /** Tổng số lượng bản ghi hiển thị trên badge. */
  totalCount?: number;
  /** Cấu hình các bộ lọc của resource. */
  controls: readonly ResourceFilterControl[];
  /** Giá trị bộ lọc đang áp dụng. */
  filterValues: Readonly<Record<string, string | undefined>>;
  /** Callback cập nhật một trường lọc. */
  onFilterChange: (field: string, value: string | undefined) => void;
  /** Callback xoá toàn bộ bộ lọc. */
  onFilterReset: () => void;
  /** Cờ trạng thái đang tải dữ liệu (isFetching từ react-query / Refine). */
  isFetching?: boolean;
  /** Callback làm mới dữ liệu từ bảng. */
  onRefresh?: () => void;
  /** Nút hành động bổ sung hoặc CreateButton từ Refine. */
  headerButtons?: ReactNode;
}

export const ResourceListToolbar = ({
  resource,
  resourceLabel,
  totalCount,
  controls,
  filterValues,
  onFilterChange,
  onFilterReset,
  isFetching = false,
  onRefresh,
  headerButtons,
}: ResourceListToolbarProps) => {
  const { t } = useTranslation();
  const screens = Grid.useBreakpoint();
  // Dưới md (768px) được coi là mobile / tablet hẹp
  const isMobile = screens.md === false;

  const searchInputRef = useRef<InputRef>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Tách control tìm kiếm và các control lọc khác
  const searchControl = useMemo(
    () => controls.find((c) => c.kind === "search" || c.field === "search"),
    [controls],
  );
  const otherControls = useMemo(
    () => controls.filter((c) => c.kind !== "search" && c.field !== "search"),
    [controls],
  );

  // Giá trị ô tìm kiếm hiện tại từ URL / Refine
  const appliedSearch = searchControl ? (filterValues[searchControl.field] ?? "") : "";
  const [draftSearch, setDraftSearch] = useState(appliedSearch);
  const debouncedSearch = useDebouncedSearch(draftSearch, 300);

  // Đồng bộ draft khi cha đổi appliedSearch (khi xoá chip hoặc back/forward URL)
  const [lastAppliedSearch, setLastAppliedSearch] = useState(appliedSearch);
  if (appliedSearch !== lastAppliedSearch) {
    setLastAppliedSearch(appliedSearch);
    setDraftSearch(appliedSearch);
  }

  const appliedSearchRef = useRef(appliedSearch);
  useEffect(() => {
    appliedSearchRef.current = appliedSearch;
  }, [appliedSearch]);

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  // Đẩy giá trị tìm kiếm sau khi hết 300ms debounce
  useEffect(() => {
    if (!searchControl) return;
    if (debouncedSearch === appliedSearchRef.current) return;
    onFilterChangeRef.current(
      searchControl.field,
      debouncedSearch === "" ? undefined : debouncedSearch,
    );
  }, [debouncedSearch, searchControl]);

  // Phím tắt "/": Focus ô tìm kiếm khi không ở trong ô nhập liệu khác
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const activeElement = document.activeElement;
        const isInputField =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute("contenteditable") === "true";

        if (!isInputField) {
          event.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tính toán danh sách chip lọc đang áp dụng
  const activeChips = useMemo(() => {
    const chips: Array<{
      field: string;
      label: string;
      displayValue: string;
    }> = [];

    // Chip tìm kiếm
    if (searchControl && filterValues[searchControl.field]) {
      const val = filterValues[searchControl.field];
      if (val && val.trim() !== "") {
        chips.push({
          field: searchControl.field,
          label: t(searchControl.labelKey, { defaultValue: t("filters.search") }),
          displayValue: `"${val}"`,
        });
      }
    }

    // Các chip lọc khác
    for (const control of otherControls) {
      const val = filterValues[control.field];
      if (val !== undefined && val !== "") {
        let displayValue = val;
        if (control.kind === "select") {
          displayValue = t(`forms.options.${val}`, { defaultValue: val });
        }
        chips.push({
          field: control.field,
          label: t(control.labelKey),
          displayValue,
        });
      }
    }

    return chips;
  }, [searchControl, filterValues, otherControls, t]);

  // Số lượng bộ lọc non-search đang active (để hiện badge trên nút Mobile Filter)
  const activeOtherCount = useMemo(() => {
    return otherControls.filter((c) => {
      const val = filterValues[c.field];
      return val !== undefined && val !== "";
    }).length;
  }, [otherControls, filterValues]);

  // State tạm thời cho bộ lọc bên trong Drawer trên mobile
  const [drawerDraftValues, setDrawerDraftValues] = useState<
    Record<string, string | undefined>
  >({});

  const handleOpenMobileFilter = useCallback(() => {
    setDrawerDraftValues({ ...filterValues });
    setMobileFilterOpen(true);
  }, [filterValues]);

  const handleDrawerClose = useCallback(() => {
    setDrawerDraftValues({ ...filterValues });
    setMobileFilterOpen(false);
  }, [filterValues]);

  const handleDrawerApply = useCallback(() => {
    for (const control of otherControls) {
      const nextVal = drawerDraftValues[control.field];
      if (nextVal !== filterValues[control.field]) {
        onFilterChange(control.field, nextVal);
      }
    }
    setMobileFilterOpen(false);
  }, [drawerDraftValues, filterValues, onFilterChange, otherControls]);

  const handleDrawerReset = useCallback(() => {
    setDrawerDraftValues({});
    onFilterReset();
    setMobileFilterOpen(false);
  }, [onFilterReset]);

  // Render các control lọc dạng Select hoặc EntityPicker trên Desktop
  const renderFilterControls = useCallback(
    (isVertical = false) => {
      return otherControls.map((control) => {
        const label = t(control.labelKey);
        const currentValue = filterValues[control.field];

        if (control.kind === "select") {
          return (
            <Select
              allowClear
              aria-label={label}
              className="resource-list-toolbar__select"
              key={control.field}
              onChange={(next: string | undefined) =>
                onFilterChange(control.field, next)
              }
              options={(control.options ?? []).map((option) => ({
                label: t(`forms.options.${option}`, { defaultValue: option }),
                value: option,
              }))}
              placeholder={label}
              style={{ width: isVertical ? "100%" : 160 }}
              value={currentValue}
            />
          );
        }

        return (
          <div
            className="resource-list-toolbar__picker"
            key={control.field}
            style={{ width: isVertical ? "100%" : 170 }}
          >
            <EntityPicker
              onChange={(next) => onFilterChange(control.field, next)}
              placeholder={label}
              resource={control.relationResource ?? ""}
              value={currentValue}
            />
          </div>
        );
      });
    },
    [otherControls, filterValues, onFilterChange, t],
  );

  // Render các control lọc dạng dọc bên trong Drawer Mobile
  const renderDrawerFilterControls = useCallback(() => {
    return otherControls.map((control) => {
      const label = t(control.labelKey);
      const currentValue = drawerDraftValues[control.field];

      if (control.kind === "select") {
        return (
          <div key={control.field} style={{ width: "100%" }}>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              {label}
            </div>
            <Select
              allowClear
              aria-label={label}
              onChange={(next: string | undefined) =>
                setDrawerDraftValues((prev) => ({
                  ...prev,
                  [control.field]: next,
                }))
              }
              options={(control.options ?? []).map((option) => ({
                label: t(`forms.options.${option}`, { defaultValue: option }),
                value: option,
              }))}
              placeholder={label}
              style={{ width: "100%" }}
              value={currentValue}
            />
          </div>
        );
      }

      return (
        <div key={control.field} style={{ width: "100%" }}>
          <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
            {label}
          </div>
          <EntityPicker
            onChange={(next) =>
              setDrawerDraftValues((prev) => ({
                ...prev,
                [control.field]: next,
              }))
            }
            placeholder={label}
            resource={control.relationResource ?? ""}
            value={currentValue}
          />
        </div>
      );
    });
  }, [otherControls, drawerDraftValues, t]);

  return (
    <div
      aria-label={t("filters.ariaLabel")}
      className="resource-list-toolbar"
      data-resource={resource}
      role="group"
    >
      {/* KHUNG THANH CÔNG CỤ CHÍNH (DESKTOP 1 HÀNG / MOBILE 2 HÀNG) */}
      <div className="resource-list-toolbar__main">
        {/* Cụm Tiêu đề & Badge */}
        <div className="resource-list-toolbar__left">
          <Typography.Title
            className="resource-list-toolbar__title"
            level={4}
          >
            {resourceLabel}
          </Typography.Title>
          {totalCount !== undefined ? (
            <Tag
              aria-label={`${totalCount} ${t("filters.totalCount", { defaultValue: "bản ghi" })}`}
              className="resource-list-toolbar__badge"
            >
              {totalCount.toLocaleString()}
            </Tag>
          ) : null}
        </div>

        {/* Cụm Công cụ & Thao tác */}
        <div className="resource-list-toolbar__right">
          {/* Ô tìm kiếm */}
          {searchControl ? (
            <div className="resource-list-toolbar__search-wrapper">
              <Input
                allowClear
                aria-label={t(searchControl.labelKey, { defaultValue: t("filters.search") })}
                className="resource-list-toolbar__search"
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                prefix={<SearchOutlined className="resource-list-toolbar__search-icon" />}
                ref={searchInputRef}
                suffix={
                  !draftSearch && !isMobile ? (
                    <Tooltip title={t("filters.shortcutSearch", { defaultValue: "Nhấn / để tìm kiếm" })}>
                      <kbd className="resource-list-toolbar__kbd">/</kbd>
                    </Tooltip>
                  ) : undefined
                }
                value={draftSearch}
              />
            </div>
          ) : null}

          {/* Trên Desktop: Hiển thị các Select lọc trực tiếp trên hàng */}
          {otherControls.length > 0 ? (
            <Space className="resource-list-toolbar__filters" size={8}>
              {renderFilterControls(false)}
            </Space>
          ) : null}

          {/* Trên Mobile: Nút mở ngăn kéo / bộ lọc nếu có control khác ngoài search */}
          {otherControls.length > 0 ? (
            <Badge
              className="resource-list-toolbar__filter-badge-mobile"
              count={activeOtherCount}
              offset={[-2, 2]}
              size="small"
            >
              <Button
                aria-label={t("filters.filterButton", { defaultValue: "Bộ lọc" })}
                className="resource-list-toolbar__filter-btn"
                icon={<FilterOutlined />}
                onClick={handleOpenMobileFilter}
              >
                {t("filters.filterButton", { defaultValue: "Bộ lọc" })}
              </Button>
            </Badge>
          ) : null}

          {/* Nút Làm mới (Refresh) */}
          {onRefresh ? (
            <Tooltip title={t("actions.refresh")}>
              <Button
                aria-label={t("actions.refresh")}
                className="resource-list-toolbar__refresh-btn"
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={onRefresh}
              />
            </Tooltip>
          ) : null}

          {/* Nút Tạo mới hoặc cụm nút hành động bổ sung */}
          {headerButtons ? (
            <div className="resource-list-toolbar__primary-action">
              {headerButtons}
            </div>
          ) : null}
        </div>
      </div>

      {/* DẢI CHIP BỘ LỌC ĐANG ÁP DỤNG (Ẩn hoàn toàn khi không có filter nào active) */}
      {activeChips.length > 0 ? (
        <div className="resource-list-toolbar__chips-bar">
          <span className="resource-list-toolbar__chips-label">
            {t("filters.activeFilters", { defaultValue: "Đang lọc:" })}
          </span>
          <div className="resource-list-toolbar__chips-list">
            {activeChips.map((chip) => (
              <Tag
                className="resource-list-toolbar__chip"
                closable
                closeIcon={<CloseOutlined aria-label={t("actions.delete")} />}
                key={chip.field}
                onClose={(e) => {
                  e.preventDefault();
                  onFilterChange(chip.field, undefined);
                }}
              >
                <span className="resource-list-toolbar__chip-key">{chip.label}:</span>
                <span className="resource-list-toolbar__chip-value">{chip.displayValue}</span>
              </Tag>
            ))}

            {/* Nút Xoá tất cả bộ lọc */}
            <Button
              aria-label={t("filters.clear")}
              className="resource-list-toolbar__clear-all"
              onClick={onFilterReset}
              size="small"
              type="link"
            >
              {t("filters.clear")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* DRAWER BỘ LỌC TRÊN MOBILE */}
      {otherControls.length > 0 ? (
        <Drawer
          className="resource-list-toolbar__drawer"
          destroyOnClose
          extra={
            <Button
              aria-label={t("actions.close", { defaultValue: "Đóng" })}
              icon={<CloseOutlined />}
              onClick={handleDrawerClose}
              type="text"
            />
          }
          footer={
            <div className="resource-list-toolbar__drawer-footer">
              <Button
                className="resource-list-toolbar__drawer-reset-btn"
                disabled={activeOtherCount === 0 && Object.values(drawerDraftValues).every((v) => !v)}
                onClick={handleDrawerReset}
              >
                {t("filters.clear", { defaultValue: "Xóa bộ lọc" })}
              </Button>
              <Button
                className="resource-list-toolbar__drawer-apply-btn"
                onClick={handleDrawerApply}
                type="primary"
              >
                {t("filters.apply", { defaultValue: "Áp dụng" })}
              </Button>
            </div>
          }
          onClose={handleDrawerClose}
          open={mobileFilterOpen}
          placement="bottom"
          styles={{
            body: { padding: "16px 20px" },
            footer: { padding: "12px 16px" },
          }}
          title={
            <Space align="center" size={8}>
              <FilterOutlined />
              <span>{t("filters.filterButton", { defaultValue: "Bộ lọc" })}</span>
              {activeOtherCount > 0 ? (
                <Tag color="blue">{activeOtherCount}</Tag>
              ) : null}
            </Space>
          }
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {renderDrawerFilterControls()}
          </Space>
        </Drawer>
      ) : null}
    </div>
  );
};
