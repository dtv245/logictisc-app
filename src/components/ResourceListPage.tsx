/**
 * Cung cấp list page chuẩn dùng Refine useTable cho resource chưa có UI riêng.
 */

import { CreateButton, List, useTable } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Alert, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ApiError } from "../types/api";
import { crudScaffoldText } from "../constants/ui";

interface ResourceListPageProps<TData extends BaseRecord> {
  columns: ColumnsType<TData>;
  resource: string;
}

export const ResourceListPage = <TData extends BaseRecord>({
  columns,
  resource,
}: ResourceListPageProps<TData>) => {
  // Refine useTable sở hữu pagination/filter/sort state và gọi dataProvider,
  // tránh lặp lại useState + useList trong từng resource.
  const { tableProps, tableQueryResult } = useTable<TData, ApiError>({
    pagination: { mode: "server" },
    resource,
    syncWithLocation: true,
  });

  return (
    <List headerButtons={<CreateButton resource={resource} />}>
      {tableQueryResult.error ? (
        <Alert
          description={tableQueryResult.error.message}
          message={crudScaffoldText.loadError}
          showIcon
          type="error"
        />
      ) : null}
      <Table<TData> {...tableProps} columns={columns} rowKey="id" />
    </List>
  );
};
