/**
 * Tạo columns CRUD nhất quán cho các resource list.
 *
 * `titleKey` là khoá locale (ví dụ `columns.loads.number`), KHÔNG phải text hiển thị.
 * Việc dịch được thực hiện trong `ResourceListPage` lúc render: ngôn ngữ có thể đổi
 * sau khi module này được import (AppBootstrap gọi `i18n.changeLanguage` sau khi
 * runtime config tải xong), nên dịch ở cấp module sẽ luôn ra sai ngôn ngữ.
 */

import type { BaseRecord } from "@refinedev/core";
import type { ColumnType } from "antd/es/table";

import { ActionButtons } from "./ActionButtons";

export interface ResourceColumn<TData extends BaseRecord> {
  dataIndex: Extract<keyof TData, string>;
  /** Khoá locale, không phải text hiển thị. */
  titleKey: string;
  /**
   * Giá trị của cột là enum có bản dịch trong `forms.options.*` (ví dụ `in_transit`).
   * Bật cờ này để `useLocalizedColumns` dịch giá trị lúc render — nếu không, bảng sẽ
   * hiện enum thô trong khi form hiện chữ đã dịch.
   */
  options?: boolean;
  sorter?: boolean;
  /**
   * Cột trạng thái: dịch giá trị **và** bọc trong `StatusTag` với màu lấy từ
   * `statusTone`. Mạnh hơn `options` — bật cờ này thì không cần `options` nữa.
   */
  status?: boolean;
  render?: (value: unknown, record: TData, index: number) => React.ReactNode;
}

/** Column còn giữ `titleKey`; `ResourceListPage` dịch và bỏ khoá này trước khi render. */
export type CrudColumn<TData extends BaseRecord> = ColumnType<TData> & {
  titleKey: string;
  options?: boolean;
  status?: boolean;
};

export const createCrudColumns = <TData extends BaseRecord>(
  resource: string,
  fields: ResourceColumn<TData>[],
): CrudColumn<TData>[] => {
  return [
    ...fields.map(({ dataIndex, titleKey, options, sorter, status, render }) => ({
      dataIndex,
      key: dataIndex,
      sorter,
      titleKey,
      ...(options ? { options } : {}),
      ...(status ? { status } : {}),
      ...(render ? { render } : {}),
    })),
    {
      key: "actions",
      titleKey: "columns.actions",
      render: (_, record) => (
        <ActionButtons record={record as BaseRecord} resource={resource} />
      ),
    },
  ];
};
