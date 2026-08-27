/**
 * Serializes Refine list state into the Spring list-query contract.
 *
 * The serializer keeps wire pagination one-based, clamps page sizes, omits
 * empty filters, and rejects sort/filter fields not declared by a feature.
 */

import type {
  CrudFilter,
  CrudFilters,
  CrudSorting,
  Pagination,
} from "@refinedev/core";

export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_PAGE_SIZE = 20;
export const MAX_LIST_PAGE_SIZE = 100;

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

const normalizeInteger = (
  value: number | undefined,
  fallback: number,
): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : fallback;

export const normalizePage = (page: number | undefined): number =>
  Math.max(DEFAULT_LIST_PAGE, normalizeInteger(page, DEFAULT_LIST_PAGE));

export const normalizePageSize = (
  pageSize: number | undefined,
): number =>
  Math.min(
    MAX_LIST_PAGE_SIZE,
    Math.max(
      1,
      normalizeInteger(pageSize, DEFAULT_LIST_PAGE_SIZE),
    ),
  );

const isEmptyFilterValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim().length === 0) ||
  (Array.isArray(value) && value.length === 0);

const isConditionalFilter = (
  filter: CrudFilter,
): filter is Extract<CrudFilter, { operator: "and" | "or" }> =>
  filter.operator === "and" || filter.operator === "or";

const serializeFilterValue = (
  value: unknown,
  field: string,
): QueryParameterValue => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  ) {
    return value;
  }

  throw new Error(`UNSUPPORTED_FILTER_VALUE:${field}`);
};

const serializeFilters = (
  filters: CrudFilters,
  allowedFilterFields: readonly string[],
): QueryParameters => {
  const parameters: QueryParameters = {};
  const allowedFields = new Set(allowedFilterFields);

  for (const filter of filters) {
    if (isConditionalFilter(filter)) {
      throw new Error("UNSUPPORTED_CONDITIONAL_FILTER");
    }

    if (!allowedFields.has(filter.field)) {
      throw new Error(`FILTER_FIELD_NOT_ALLOWED:${filter.field}`);
    }

    if (filter.operator !== "eq" && filter.operator !== "contains") {
      throw new Error(
        `FILTER_OPERATOR_NOT_SUPPORTED:${filter.field}:${filter.operator}`,
      );
    }

    if (isEmptyFilterValue(filter.value)) {
      continue;
    }

    parameters[filter.field] = serializeFilterValue(
      filter.value,
      filter.field,
    );
  }

  return parameters;
};

const serializeSorter = (
  sorters: CrudSorting,
  allowedSortFields: readonly string[],
): QueryParameters => {
  if (sorters.length === 0) {
    return {};
  }

  if (sorters.length > 1) {
    throw new Error("MULTIPLE_SORT_FIELDS_NOT_SUPPORTED");
  }

  const sorter = sorters[0];
  if (!sorter) {
    return {};
  }

  if (!allowedSortFields.includes(sorter.field)) {
    throw new Error(`SORT_FIELD_NOT_ALLOWED:${sorter.field}`);
  }

  return {
    orderBy: sorter.field,
    descending: sorter.order === "desc",
  };
};

export const serializeListQuery = ({
  pagination,
  filters = [],
  sorters = [],
  allowedFilterFields,
  allowedSortFields,
}: ListQuerySerializationOptions): QueryParameters => ({
  page: normalizePage(pagination?.current),
  pageSize: normalizePageSize(pagination?.pageSize),
  ...serializeFilters(filters, allowedFilterFields),
  ...serializeSorter(sorters, allowedSortFields),
});

export const serializeCustomQuery = (
  query: unknown,
): QueryParameters => {
  if (query === undefined || query === null) {
    return {};
  }

  if (
    typeof query !== "object" ||
    Array.isArray(query)
  ) {
    throw new Error("CUSTOM_QUERY_MUST_BE_AN_OBJECT");
  }

  const parameters: QueryParameters = {};

  for (const [field, value] of Object.entries(query)) {
    if (isEmptyFilterValue(value)) {
      continue;
    }

    parameters[field] = serializeFilterValue(value, field);
  }

  return parameters;
};
