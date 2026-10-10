/**
 * FilterBar — thanh lọc phía trên bảng list dùng chung cho các màn hình.
 *
 * Bố cục sắp xếp theo vector (hàng ngang) với khả năng tự động xuống dòng (wrap).
 * Mỗi input chia ra theo tỷ lệ 1/3 màn hình (8/24 col trong hệ thống grid của Ant Design),
 * đảm bảo tính nhất quán trên tất cả các màn hình danh sách.
 *
 * Hỗ trợ 2 chế độ:
 * 1. Khai báo (Declarative): truyền `controls`, `value`, `onChange`, `onReset`
 *    (được dùng tự động bởi `ResourceListPage` cho hàng loạt màn hình CRUD).
 * 2. Ghép nối (Children / Compound): truyền `<FilterBar.Item>` hoặc children
 *    cho các màn hình có bộ lọc tuỳ biến.
 */
import { Button, Col, Input, Row, Select, type ColProps } from "antd";
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import { EntityPicker } from "./EntityPicker";
import type { ResourceFilterControl } from "./resources/resourceFilterControls";

export interface FilterBarProps {
  /** Danh sách cấu hình control lọc chuẩn (dùng với Refine/resourceFilterControls). */
  controls?: readonly ResourceFilterControl[];
  /** Gọi khi một filter đổi; `undefined` nghĩa là bỏ filter đó. */
  onChange?: (field: string, value: string | undefined) => void;
  /** Callback xoá tất cả bộ lọc. */
  onReset?: () => void;
  /** Giá trị đang áp dụng, khoá theo `field` (tên query param). */
  value?: Readonly<Record<string, string | undefined>>;
  /** Các phần tử lọc tuỳ biến được truyền trực tiếp (children mode). */
  children?: ReactNode;
  /** Tuỳ chỉnh colProps cho mỗi ô input (mặc định xs={24} sm={8} md={8} = 1/3 màn hình). */
  colProps?: ColProps;
  /** Xác định có filter đang hoạt động hay không (khi dùng children mode mà không có controls). */
  hasActiveFilter?: boolean;
  className?: string;
  style?: CSSProperties;
}

export interface FilterItemProps extends ColProps {
  children: ReactNode;
}

export const FilterItem = ({
  children,
  xs = 24,
  sm = 8,
  md = 8,
  style,
  ...rest
}: FilterItemProps) => (
  <Col xs={xs} sm={sm} md={md} style={style} {...rest}>
    {children}
  </Col>
);

interface SearchFieldProps {
  control: ResourceFilterControl;
  onChange: (value: string | undefined) => void;
  value: string | undefined;
}

const SearchField = ({ control, onChange, value }: SearchFieldProps) => {
  const { t } = useTranslation();
  const applied = value ?? "";
  const [draft, setDraft] = useState(applied);
  const debounced = useDebouncedSearch(draft);

  // Điều chỉnh state ngay trong lúc render khi cha đổi giá trị từ bên ngoài
  const [lastApplied, setLastApplied] = useState(applied);
  if (applied !== lastApplied) {
    setLastApplied(applied);
    setDraft(applied);
  }

  const appliedRef = useRef(applied);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    appliedRef.current = applied;
  }, [applied]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (debounced === appliedRef.current) {
      return;
    }
    onChangeRef.current(debounced === "" ? undefined : debounced);
  }, [debounced]);

  const label = t(control.labelKey);

  return (
    <Input
      allowClear
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={control.kind === "search" ? t("filters.searchPlaceholder") : label}
      style={{ width: "100%" }}
      value={draft}
    />
  );
};

export function FilterBar({
  className,
  colProps,
  controls,
  hasActiveFilter: customHasActiveFilter,
  onChange,
  onReset,
  style,
  value = {},
  children,
}: FilterBarProps) {
  const { t } = useTranslation();

  const hasControls = Boolean(controls && controls.length > 0);
  const hasChildren = Boolean(children);

  if (!hasControls && !hasChildren) {
    return null;
  }

  // Tỷ lệ 1/3 màn hình: xs=24 (mobile 1 cột), sm=8, md=8 (8/24 col = 1/3 màn hình)
  const defaultColProps: ColProps = {
    xs: 24,
    sm: 8,
    md: 8,
    ...colProps,
  };

  const isResetActive =
    customHasActiveFilter ??
    (controls
      ? controls.some((control) => {
          const current = value[control.field];
          return current !== undefined && current !== "";
        })
      : false);

  return (
    <Row
      align="middle"
      aria-label={t("filters.ariaLabel")}
      className={className}
      gutter={[16, 12]}
      role="group"
      style={{ marginBottom: 16, width: "100%", ...style }}
      wrap
    >
      {controls?.map((control) => {
        if (control.kind === "search" || control.kind === "text") {
          return (
            <Col {...defaultColProps} key={control.field}>
              <SearchField
                control={control}
                onChange={(next) => onChange?.(control.field, next)}
                value={value[control.field]}
              />
            </Col>
          );
        }

        const label = t(control.labelKey);

        if (control.kind === "select") {
          return (
            <Col {...defaultColProps} key={control.field}>
              <Select
                allowClear
                aria-label={label}
                onChange={(next: string | undefined) =>
                  onChange?.(control.field, next)
                }
                options={(control.options ?? []).map((option) => ({
                  label: t(`forms.options.${option}`, { defaultValue: option }),
                  value: option,
                }))}
                placeholder={label}
                style={{ width: "100%" }}
                value={value[control.field]}
              />
            </Col>
          );
        }

        return (
          <Col {...defaultColProps} key={control.field}>
            <EntityPicker
              onChange={(next) => onChange?.(control.field, next)}
              placeholder={label}
              resource={control.relationResource ?? ""}
              value={value[control.field]}
            />
          </Col>
        );
      })}

      {Children.map(children, (child) => {
        if (!child) return null;
        if (
          isValidElement(child) &&
          (child.type === FilterItem ||
            (child.type as { displayName?: string })?.displayName === "Col")
        ) {
          return child;
        }
        return <Col {...defaultColProps}>{child}</Col>;
      })}

      {isResetActive && onReset ? (
        <Col
          {...defaultColProps}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Button onClick={onReset} type="link" style={{ paddingLeft: 0 }}>
            {t("filters.clear")}
          </Button>
        </Col>
      ) : null}
    </Row>
  );
}

FilterBar.Item = FilterItem;
