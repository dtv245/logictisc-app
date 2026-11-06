/**
 * EntityPicker
 *
 * Ô chọn một bản ghi quan hệ (khách hàng, xe, tài xế…) có tìm kiếm phía server.
 *
 * Danh mục có thể lên tới hàng nghìn bản ghi nên **không** tải hết về client:
 * antd `Select` bật `showSearch` + `filterOption={false}` để việc lọc do server
 * làm, và Refine `useSelect` tự gắn `search` vào query. `debounce: 300` chặn
 * request theo từng phím gõ.
 *
 * Hai chế độ nạp dữ liệu:
 *
 * - Mặc định (`infiniteScroll` tắt): `useSelect` của Refine giữ **một** trang
 *   (tối đa 50 bản ghi). Đủ cho danh mục nhỏ như bến bãi, loại xe.
 * - `infiniteScroll`: cuộn xuống đáy dropdown thì nạp thêm trang kế tiếp. Dùng cho
 *   resource lớn như `loads`, nơi bản ghi cần chọn thường nằm ngoài 50 dòng đầu.
 *   Chế độ này vẫn gửi tìm kiếm lên server và vẫn dựng nhãn cho giá trị đang chọn
 *   bằng `useOne`, nên form sửa không hiện id thô.
 *
 * Component này cố tình **không** nhận `ResourceFormField`: nó là component dùng
 * chung, không nên biết đến hình dạng khai báo form. Call site truyền thẳng
 * `resource` và cách hiển thị nhãn.
 */
import { useSelect } from "@refinedev/antd";
import { useOne, type BaseRecord } from "@refinedev/core";
import { Select, Spin, type SelectProps } from "antd";
import { useCallback, useMemo, useState, type UIEvent } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useInfiniteRelationOptions } from "@/hooks/useInfiniteRelationOptions";
import { orderByPreference } from "@/utils/recentSelections";
import type { RelationRecord } from "./resources/resourceForms";

export interface EntityPickerProps {
  disabled?: boolean;
  /** Trả về nhãn hiển thị cho một bản ghi; bỏ trống thì dùng `labelField`. */
  labelFormat?: (record: RelationRecord) => string | undefined;
  /** Field dùng làm nhãn khi không có `labelFormat`. Mặc định `name`. */
  labelField?: string;
  /**
   * Dùng khi điều khiển từ ngoài (FilterBar). Bỏ trống thì `useSelect` tự quản state,
   * đúng cho trường hợp nằm trong `Form.Item`.
   */
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  /** Bỏ trống thì cho phép xoá lựa chọn. */
  required?: boolean;
  /** Tên resource của Refine, ví dụ `customers`. */
  resource: string;
  value?: string;
  /** Danh sách các ID giá trị cần loại trừ khỏi options (ví dụ tài xế chính đã chọn) */
  excludeValues?: readonly (string | number)[];
  /** Số bản ghi mỗi trang; luôn giới hạn tối đa 50. */
  pageSize?: number;
  /**
   * ID cần ưu tiên lên đầu (ví dụ bến bãi dùng gần đây). Chỉ sắp xếp trong
   * trang hiện tại của dropdown; không tải thêm bản ghi ngoài trang.
   */
  preferredValues?: readonly string[];
  /**
   * Nạp thêm option khi cuộn tới đáy dropdown. Bật cho resource có nhiều bản ghi
   * (loads); để tắt ở danh mục nhỏ để giữ hành vi một trang của `useSelect`.
   */
  infiniteScroll?: boolean;
}

interface PickerOption {
  label: string;
  value: string;
}

const resolveLabel = (
  record: BaseRecord,
  labelField?: string,
  labelFormat?: (record: RelationRecord) => string | undefined,
): string =>
  (labelFormat ? labelFormat(record as RelationRecord) : undefined) ??
  String(record[labelField ?? "name"] ?? record.id ?? "");

const toOption = (
  record: BaseRecord,
  labelField?: string,
  labelFormat?: (record: RelationRecord) => string | undefined,
): PickerOption => ({
  label: resolveLabel(record, labelField, labelFormat),
  value: String(record.id ?? ""),
});

const applyOptionFilters = (
  options: PickerOption[] | undefined,
  excludeValues?: readonly (string | number)[],
  preferredValues?: readonly string[],
): PickerOption[] | undefined => {
  const filtered =
    excludeValues && excludeValues.length > 0
      ? options?.filter(
          (opt) => !excludeValues.map(String).includes(String(opt.value)),
        )
      : options;
  return preferredValues && preferredValues.length > 0 && filtered
    ? orderByPreference(filtered, preferredValues, (option) => String(option.value ?? ""))
    : filtered;
};

export function EntityPicker(props: EntityPickerProps) {
  return props.infiniteScroll ? (
    <InfiniteEntityPicker {...props} />
  ) : (
    <PagedEntityPicker {...props} />
  );
}

function PagedEntityPicker({
  disabled,
  excludeValues,
  labelField,
  labelFormat,
  onChange,
  pageSize,
  placeholder,
  preferredValues,
  required,
  resource,
  value,
}: EntityPickerProps) {
  const safePageSize = Math.min(50, Math.max(1, Math.trunc(pageSize ?? 50)));
  const { selectProps } = useSelect<BaseRecord>({
    resource,
    optionLabel: (item: BaseRecord) => resolveLabel(item, labelField, labelFormat),
    optionValue: (item: BaseRecord) => String(item.id ?? ""),
    debounce: 300,
    pagination: { pageSize: safePageSize },
    onSearch: (value) => [
      {
        field: "search",
        operator: "contains",
        value,
      },
    ],
    // Chỉ truyền khi có giá trị: `defaultValue` khiến Refine nạp bản ghi theo id để
    // dựng nhãn, nhờ đó filter khôi phục từ URL hiện tên thay vì id thô.
    ...(value === undefined ? {} : { defaultValue: value }),
  });

  const options = applyOptionFilters(
    selectProps.options as PickerOption[] | undefined,
    excludeValues,
    preferredValues,
  );

  return (
    <Select<string>
      // `useSelect` khai `selectProps.value` là **option object**, nhưng `optionValue`
      // ở trên khiến giá trị thật khi chạy là id dạng chuỗi. Ép kiểu tại đúng chỗ này
      // thay vì để kiểu sai lan ra props của component.
      {...(selectProps as SelectProps<string>)}
      options={options}
      {...(value === undefined ? {} : { value })}
      {...(onChange === undefined ? {} : { onChange })}
      allowClear={!required}
      disabled={disabled}
      filterOption={false}
      placeholder={placeholder}
      showSearch
      style={{ width: "100%" }}
    />
  );
}

function InfiniteEntityPicker({
  disabled,
  excludeValues,
  labelField,
  labelFormat,
  onChange,
  pageSize,
  placeholder,
  preferredValues,
  required,
  resource,
  value,
}: EntityPickerProps) {
  const { t } = useTranslation();
  const safePageSize = Math.min(50, Math.max(1, Math.trunc(pageSize ?? 50)));
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedSearch(searchInput.trim(), 300);
  const relation = useInfiniteRelationOptions({
    resource,
    pageSize: safePageSize,
    search,
  });

  const fetchedOptions = useMemo(
    () => relation.options.map((record) => toOption(record, labelField, labelFormat)),
    [relation.options, labelField, labelFormat],
  );

  const hasResource = resource.trim().length > 0;
  const valueString = value === undefined ? undefined : String(value).trim();
  const isMissing = hasResource && valueString !== undefined && valueString.length > 0 &&
    !fetchedOptions.some((option) => option.value === valueString);

  // Giá trị đang chọn có thể nằm ngoài trang đầu (form sửa, filter khôi phục từ
  // URL). Nạp riêng bản ghi đó để nhãn vẫn đúng thay vì hiển thị id thô.
  const selected = useOne<BaseRecord>({
    resource,
    id: value ?? "",
    queryOptions: { enabled: isMissing, staleTime: 60_000 },
  });
  const selectedRecord = selected.data?.data;
  const options = useMemo(() => {
    const merged = [...fetchedOptions];
    if (isMissing && selectedRecord) {
      merged.unshift(toOption(selectedRecord, labelField, labelFormat));
    }
    return applyOptionFilters(merged, excludeValues, preferredValues) ?? [];
  }, [excludeValues, fetchedOptions, isMissing, labelField, labelFormat, preferredValues, selectedRecord]);

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = relation;
  const handlePopupScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const list = event.currentTarget;
      const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
      if (remaining <= 48 && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const handleChange = useCallback(
    (next: string | undefined) => onChange?.(next),
    [onChange],
  );

  return (
    <Select<string>
      allowClear={!required}
      disabled={disabled}
      filterOption={false}
      loading={relation.isLoading || relation.isFetchingNextPage}
      notFoundContent={
        relation.isLoading
          ? <Spin size="small" />
          : relation.isError
            ? t("common.error")
            : undefined
      }
      onChange={handleChange}
      onClear={() => setSearchInput("")}
      onPopupScroll={handlePopupScroll}
      onSearch={setSearchInput}
      options={options}
      placeholder={placeholder}
      showSearch
      style={{ width: "100%" }}
      value={value}
    />
  );
}
