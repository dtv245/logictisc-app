import { useTable } from "@refinedev/antd";
import {
  queryKeys,
  useDataProvider,
  type BaseRecord,
  type HttpError,
} from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import type { useTableProps } from "@refinedev/antd";
import { useEffect } from "react";

import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
} from "@/constants/pagination";

type RefineTableOptions<
  TData extends BaseRecord,
  TError extends HttpError,
  TSearchVariables,
> = useTableProps<TData, TError, TSearchVariables, TData>;

export type UsePaginatedTableOptions<
  TData extends BaseRecord,
  TError extends HttpError = HttpError,
  TSearchVariables = unknown,
> = Omit<
  RefineTableOptions<TData, TError, TSearchVariables>,
  "pagination" | "queryOptions" | "syncWithLocation"
> & {
  pagination?: {
    current?: number;
    pageSize?: number;
  };
  queryOptions?: RefineTableOptions<TData, TError, TSearchVariables>["queryOptions"];
};

/**
 * Common server-paginated Refine table configuration for route lists.
 * Keeps current rows visible during page changes and warms the next page.
 */
export function usePaginatedTable<
  TData extends BaseRecord,
  TError extends HttpError = HttpError,
  TSearchVariables = unknown,
>(options: UsePaginatedTableOptions<TData, TError, TSearchVariables>) {
  const {
    dataProviderName,
    meta,
    metaData,
    pagination,
    queryOptions,
    resource,
    sorters,
    ...rest
  } = options;
  const queryClient = useQueryClient();
  const getDataProvider = useDataProvider();
  const table = useTable<TData, TError, TSearchVariables>({
    ...rest,
    dataProviderName,
    meta,
    metaData,
    resource,
    sorters,
    pagination: {
      mode: "server",
      current: pagination?.current ?? DEFAULT_LIST_PAGE,
      pageSize: pagination?.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
    },
    queryOptions: {
      ...queryOptions,
      keepPreviousData: true,
      staleTime: queryOptions?.staleTime ?? 30_000,
    },
    syncWithLocation: true,
  });

  const { current, filters, pageSize, sorters: activeSorters, tableQueryResult } = table;
  const total = tableQueryResult.data?.total ?? 0;
  const hasNextPage = total > current * pageSize;

  useEffect(() => {
    if (
      !tableQueryResult.data ||
      !hasNextPage ||
      queryOptions?.enabled === false ||
      !resource
    ) {
      return;
    }

    const nextPagination = {
      current: current + 1,
      pageSize,
      mode: "server" as const,
    };
    const queryKey = queryKeys(resource, dataProviderName, meta, metaData).list({
      filters,
      hasPagination: true,
      pagination: nextPagination,
      sorters: activeSorters,
    });

    void queryClient.prefetchQuery(
      queryKey,
      (context) =>
        getDataProvider(dataProviderName).getList<TData>({
          resource,
          pagination: nextPagination,
          hasPagination: true,
          filters,
          sort: activeSorters,
          sorters: activeSorters,
          meta: {
            ...meta,
            ...metaData,
            queryContext: context,
          },
        }),
      { staleTime: queryOptions?.staleTime ?? 30_000 },
    );
  }, [
    activeSorters,
    current,
    dataProviderName,
    filters,
    getDataProvider,
    hasNextPage,
    meta,
    metaData,
    pageSize,
    queryClient,
    queryOptions?.enabled,
    queryOptions?.staleTime,
    resource,
    tableQueryResult.data,
  ]);

  return table;
}
