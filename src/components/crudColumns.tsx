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

import { crudScaffoldText } from "@constants/ui";
import { getResourceCapabilities } from "./resources/resourceCapabilities";

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
  const capabilities = getResourceCapabilities(resource);

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
      <Space>
        <ShowButton
          hideText
          recordItemId={record.id}
          resource={resource}
        />
        {capabilities.edit ? (
          <EditButton
            hideText
            recordItemId={record.id}
            resource={resource}
          />
        ) : null}
        {capabilities.delete ? (
          <DeleteButton
            hideText
            recordItemId={record.id}
            resource={resource}
          />
        ) : null}
      </Space>
    ),
  },
  ];
};
