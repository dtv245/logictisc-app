import type { BaseRecord } from "@refinedev/core";
import type { ColumnType } from "antd/es/table";

import { ActionButtons, type ExtraActionItem } from "./ActionButtons";
import type { StatusStyleConfig, StatusTone } from "./StatusTag";

export interface ResourceColumn<TData extends BaseRecord> {
  dataIndex: Extract<keyof TData, string>;
  /** Khoá locale, không phải text hiển thị. */
  titleKey: string;
  /**
   * Giá trị của cột là enum có bản dịch trong `forms.options.*` (ví dụ `in_transit`).
   * Bật cờ này để `useLocalizedColumns` dịch giá trị lúc render.
   */
  options?: boolean;
  sorter?: boolean;
  /**
   * Cột trạng thái: dịch giá trị và bọc trong `StatusTag`.
   * Có thể là boolean hoặc truyền map status tùy biến cho resource (drivers, trailers...).
   */
  status?: boolean | Record<string, StatusTone | "info" | "default" | StatusStyleConfig>;
  /** Độ rộng cột */
  width?: number | string;
  /** Độ rộng tối thiểu của cột */
  minWidth?: number;
  /** Căn lề nội dung: text trái, số phải */
  align?: "left" | "right" | "center";
  /** Rút gọn text dài kèm Tooltip */
  ellipsis?: boolean | { showTitle?: boolean };
  /** Cột dạng số / mã số: căn phải và sử dụng tabular-nums */
  numeric?: boolean;
  render?: (value: unknown, record: TData, index: number) => React.ReactNode;
}

/** Column còn giữ `titleKey`; `ResourceListPage` dịch và bỏ khoá này trước khi render. */
export type CrudColumn<TData extends BaseRecord> = ColumnType<TData> & {
  titleKey: string;
  options?: boolean;
  status?: boolean | Record<string, StatusTone | "info" | "default" | StatusStyleConfig>;
  numeric?: boolean;
};

export interface CrudColumnsOptions<TData extends BaseRecord> {
  /** Độ rộng cột actions (mặc định 130px) */
  actionsWidth?: number | string;
  /** Cố định cột actions bên phải */
  fixedActions?: boolean | "right" | "left";
  /** Các hành động bổ sung ngoài Xem / Sửa / Xóa chuẩn */
  extraActions?: (record: TData) => ExtraActionItem[];
}

export const createCrudColumns = <TData extends BaseRecord>(
  resource: string,
  fields: ResourceColumn<TData>[],
  options?: CrudColumnsOptions<TData>,
): CrudColumn<TData>[] => {
  return [
    ...fields.map(
      ({
        dataIndex,
        titleKey,
        options: isEnum,
        sorter,
        status,
        width,
        minWidth,
        align,
        ellipsis,
        numeric,
        render,
      }) => ({
        dataIndex,
        key: dataIndex,
        sorter,
        titleKey,
        width,
        minWidth,
        align: align ?? (numeric ? "right" : "left"),
        className: numeric ? "tabular-nums" : undefined,
        ellipsis: ellipsis === true ? { showTitle: false } : ellipsis,
        numeric,
        ...(isEnum ? { options: isEnum } : {}),
        ...(status ? { status } : {}),
        ...(render ? { render } : {}),
      }),
    ),
    {
      key: "actions",
      titleKey: "columns.actions",
      width: options?.actionsWidth ?? 130,
      align: "center",
      fixed: options?.fixedActions === true ? "right" : (options?.fixedActions ?? undefined),
      render: (_, record) => (
        <ActionButtons
          record={record as BaseRecord}
          resource={resource}
          extraActions={options?.extraActions ? options.extraActions(record as TData) : undefined}
        />
      ),
    },
  ];
};
