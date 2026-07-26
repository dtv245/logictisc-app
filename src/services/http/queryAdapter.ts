/**
 * Chuyển pagination, filters và sorting của Refine sang query Spring.
 */

import type {
  CrudFilter,
  CrudSorting,
  Pagination,
} from "@refinedev/core";

const isConditionalFilter = (
  filter: CrudFilter,
): filter is Extract<CrudFilter, { operator: "and" | "or" }> =>
  filter.operator === "and" || filter.operator === "or";

const serializeValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue).join(",");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
};

const appendFilter = (params: URLSearchParams, filter: CrudFilter): void => {
  if (isConditionalFilter(filter)) {
    params.append("filter", JSON.stringify(filter));
    return;
  }

  const key =
    filter.operator === "eq"
      ? filter.field
      : `${filter.field}.${filter.operator}`;

  params.append(key, serializeValue(filter.value));
};

const appendQuery = (params: URLSearchParams, query: unknown): void => {
  if (typeof query !== "object" || query === null) {
    return;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, serializeValue(value));
    }
  });
};

/**
 * Ánh xạ zero-based pagination và `sort=field,direction` của Spring.
 */
export const buildQueryParams = ({
  pagination,
  filters = [],
  sorters = [],
  query,
}: {
  pagination?: Pagination;
  filters?: CrudFilter[];
  sorters?: CrudSorting;
  query?: unknown;
}): URLSearchParams => {
  const params = new URLSearchParams();

  appendQuery(params, query);

  if (pagination?.mode !== "off") {
    const currentPage = Math.max(pagination?.current ?? 1, 1);
    const pageSize = Math.max(pagination?.pageSize ?? 10, 1);
    params.set("page", String(currentPage - 1));
    params.set("size", String(pageSize));
  }

  filters.forEach((filter) => appendFilter(params, filter));
  sorters.forEach((sorter) => {
    params.append("sort", `${sorter.field},${sorter.order}`);
  });

  return params;
};
