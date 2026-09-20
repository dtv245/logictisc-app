/**
 * Tạo columns CRUD nhất quán cho các resource list.
 */

import type { BaseRecord } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";

import { crudScaffoldText } from "@constants/ui";
import { ActionButtons } from "./ActionButtons";

export interface ResourceColumn<TData extends BaseRecord> {
  dataIndex: Extract<keyof TData, string>;
  title: string;
  sorter?: boolean;
  render?: (value: unknown, record: TData, index: number) => React.ReactNode;
}

export const createCrudColumns = <TData extends BaseRecord>(
  resource: string,
  fields: ResourceColumn<TData>[],
): ColumnsType<TData> => {
  return [
    ...fields.map(({ dataIndex, title, sorter, render }) => ({
      dataIndex,
      key: dataIndex,
      sorter,
      title,
      ...(render ? { render } : {}),
    })),
    {
      key: "actions",
      title: crudScaffoldText.actions,
      render: (_, record) => (
        <ActionButtons record={record as BaseRecord} resource={resource} />
      ),
    },
  ];
};
