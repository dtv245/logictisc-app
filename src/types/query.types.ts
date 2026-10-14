import type { CrudFilters, CrudSorting, Pagination } from "@refinedev/core";

export type QueryParameterValue =
  | string
  | number
  | boolean
  | readonly string[];

export type QueryParameters = Record<string, QueryParameterValue>;

export interface ListQuerySerializationOptions {
  pagination?: Pagination;
  filters?: CrudFilters;
  sorters?: CrudSorting;
  allowedFilterFields: readonly string[];
  allowedSortFields: readonly string[];
}
