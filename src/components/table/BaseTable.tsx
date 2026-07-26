import { useMemo, useState } from "react";
import {
  useList,
  type BaseRecord,
  type CrudFilters,
  type CrudSorting,
  type HttpError,
  type UseListProps,
} from "@refinedev/core";
import { Alert, Space, Table } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";

import type { ApiError } from "../../types/api";

type TableChangeHandler<TData extends BaseRecord> = NonNullable<
  TableProps<TData>["onChange"]
>;

type BaseTableProps<
  TData extends BaseRecord,
  TError extends HttpError = ApiError,
> = Omit<
  TableProps<TData>,
  "columns" | "dataSource" | "loading" | "onChange" | "pagination"
> & {
  resource: string;
  columns: ColumnsType<TData>;
  defaultPageSize?: number;
  initialFilters?: CrudFilters;
  initialSorters?: CrudSorting;
  listOptions?: Omit<
    UseListProps<TData, TError, TData>,
    "filters" | "pagination" | "resource" | "sorters"
  >;
  onTableChange?: TableChangeHandler<TData>;
  pageSizeOptions?: number[];
  permanentFilters?: CrudFilters;
  showError?: boolean;
};

const toFieldName = (field: React.Key | readonly React.Key[]): string =>
  Array.isArray(field) ? field.map(String).join(".") : String(field);

const toCrudFilters = (
  filters: Parameters<TableChangeHandler<BaseRecord>>[1],
): CrudFilters =>
  Object.entries(filters).flatMap(([field, values]) => {
    if (!values || values.length === 0) {
      return [];
    }

    return [
      {
        field,
        operator: values.length === 1 ? "eq" : "in",
        value: values.length === 1 ? values[0] : values,
      },
    ];
  });

const toCrudSorting = <TData extends BaseRecord>(
  sorter: Parameters<TableChangeHandler<TData>>[2],
): CrudSorting => {
  const sorters = Array.isArray(sorter) ? sorter : [sorter];

  return sorters.flatMap((item) => {
    if (!item.order || item.field === undefined) {
      return [];
    }

    return [
      {
        field: toFieldName(item.field),
        order: item.order === "ascend" ? "asc" : "desc",
      },
    ];
  });
};

export const BaseTable = <
  TData extends BaseRecord,
  TError extends HttpError = ApiError,
>({
  resource,
  columns,
  defaultPageSize = 10,
  initialFilters = [],
  initialSorters = [],
  listOptions,
  onTableChange,
  pageSizeOptions = [10, 20, 50, 100],
  permanentFilters = [],
  rowKey = "id",
  showError = true,
  ...tableProps
}: BaseTableProps<TData, TError>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [tableFilters, setTableFilters] =
    useState<CrudFilters>(initialFilters);
  const [sorters, setSorters] = useState<CrudSorting>(initialSorters);

  const filters = useMemo(
    () => [...permanentFilters, ...tableFilters],
    [permanentFilters, tableFilters],
  );

  const list = useList<TData, TError>({
    ...listOptions,
    resource,
    filters,
    sorters,
    pagination: {
      current: currentPage,
      pageSize,
      mode: "server",
    },
  });

  const handleChange: TableChangeHandler<TData> = (
    pagination,
    nextFilters,
    sorter,
    extra,
  ) => {
    const nextPageSize = pagination.pageSize ?? pageSize;
    const shouldResetPage = extra.action === "filter" || extra.action === "sort";

    setCurrentPage(shouldResetPage ? 1 : (pagination.current ?? 1));
    setPageSize(nextPageSize);
    setTableFilters(toCrudFilters(nextFilters));
    setSorters(toCrudSorting(sorter));
    onTableChange?.(pagination, nextFilters, sorter, extra);
  };

  return (
    <Space direction="vertical" size="middle" className="full-width">
      {showError && list.error ? (
        <Alert
          message={`Không thể tải dữ liệu (${list.error.statusCode})`}
          description={list.error.message}
          type="error"
          showIcon
        />
      ) : null}

      <Table<TData>
        {...tableProps}
        columns={columns}
        dataSource={list.data?.data ?? []}
        loading={list.isFetching}
        onChange={handleChange}
        pagination={{
          current: currentPage,
          pageSize,
          pageSizeOptions,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          total: list.data?.total ?? 0,
        }}
        rowKey={rowKey}
      />
    </Space>
  );
};

export type { BaseTableProps };
