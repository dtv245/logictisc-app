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
 * Component này cố tình **không** nhận `ResourceFormField`: nó là component dùng
 * chung, không nên biết đến hình dạng khai báo form. Call site truyền thẳng
 * `resource` và cách hiển thị nhãn.
 */
import { useSelect } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Select, type SelectProps } from "antd";

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
}

export function EntityPicker({
  disabled,
  labelField,
  labelFormat,
  onChange,
  placeholder,
  required,
  resource,
  value,
}: EntityPickerProps) {
  const { selectProps } = useSelect<BaseRecord>({
    resource,
    optionLabel: (item: BaseRecord) =>
      (labelFormat ? labelFormat(item as RelationRecord) : undefined) ??
      String(item[labelField ?? "name"] ?? item.id ?? ""),
    optionValue: (item: BaseRecord) => String(item.id ?? ""),
    debounce: 300,
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

  return (
    <Select<string>
      // `useSelect` khai `selectProps.value` là **option object**, nhưng `optionValue`
      // ở trên khiến giá trị thật khi chạy là id dạng chuỗi. Ép kiểu tại đúng chỗ này
      // thay vì để kiểu sai lan ra props của component.
      {...(selectProps as SelectProps<string>)}
      {...(value === undefined ? {} : { value })}
      {...(onChange === undefined ? {} : { onChange })}
      allowClear={!required}
      disabled={disabled}
      filterOption={false}
      placeholder={placeholder}
      showSearch
      style={{ minWidth: 200, width: "100%" }}
    />
  );
}
