/**
 * Tạo columns CRUD nhất quán cho các resource list.
 */

import {
  DeleteButton,
  EditButton,
  ShowButton,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space } from "antd";
import type { ColumnsType } from "antd/es/table";

import { crudScaffoldText } from "../constants/ui";

export interface ResourceColumn<TData extends BaseRecord> {
  dataIndex: Extract<keyof TData, string>;
  title: string;
  sorter?: boolean;
}

export const createCrudColumns = <TData extends BaseRecord>(
  resource: string,
  fields: ResourceColumn<TData>[],
): ColumnsType<TData> => [
  ...fields.map(({ dataIndex, title, sorter }) => ({
    dataIndex,
    key: dataIndex,
    sorter,
    title,
  })),
  {
    key: "actions",
    title: crudScaffoldText.actions,
    render: (_, record) => (
      <Space>
        <ShowButton
          hideText
          recordItemId={record.id}
          resource={resource}
        />
        <EditButton
          hideText
          recordItemId={record.id}
          resource={resource}
        />
        <DeleteButton
          hideText
          recordItemId={record.id}
          resource={resource}
        />
      </Space>
    ),
  },
];
