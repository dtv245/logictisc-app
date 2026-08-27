/**
 * Synchronizes server-table pagination, search, sorting and filters with the
 * route query string.
 *
 * The URL is the source of truth so browser back/forward navigation restores
 * list state without maintaining a duplicate cache in component state.
 */
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const MAX_TABLE_PAGE_SIZE = 100;
export const DEFAULT_TABLE_PAGE_SIZE = 20;

export const TABLE_URL_KEYS = {
  page: "page",
  pageSize: "pageSize",
  search: "q",
  sortField: "sort",
  sortOrder: "order",
} as const;

const reservedTableKeys: ReadonlySet<string> = new Set(
  Object.values(TABLE_URL_KEYS),
);
const emptyFilterKeys: readonly string[] = Object.freeze([]);

export type TableSortOrder = "asc" | "desc";

export interface TableUrlFilter {
  key: string;
  values: readonly string[];
}

export interface TableUrlState {
  page: number;
  pageSize: number;
  search: string;
  sortField?: string;
  sortOrder?: TableSortOrder;
  filters: readonly TableUrlFilter[];
}

export interface TableUrlStateOptions {
  defaultPageSize: number;
  allowedSortFields: readonly string[];
  filterKeys?: readonly string[];
}

export interface TableFilterUpdate {
  key: string;
  value?: string | readonly string[] | null;
}

const clampInteger = (
  value: string | number | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const parsed =
    typeof value === "number"
      ? Math.trunc(value)
      : value !== null && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, parsed));
};

const normalizeDefaultPageSize = (pageSize: number): number =>
  clampInteger(
    pageSize,
    DEFAULT_TABLE_PAGE_SIZE,
    1,
    MAX_TABLE_PAGE_SIZE,
  );

const isSortOrder = (value: string | null): value is TableSortOrder =>
  value === "asc" || value === "desc";

const validateFilterKeys = (filterKeys: readonly string[]) => {
  const invalidKey = filterKeys.find((key) => reservedTableKeys.has(key));
  if (invalidKey) {
    throw new RangeError(`Filter key "${invalidKey}" is reserved for table state.`);
  }
};

export function parseTableUrlState(
  searchParams: URLSearchParams,
  options: TableUrlStateOptions,
): TableUrlState {
  const defaultPageSize = normalizeDefaultPageSize(options.defaultPageSize);
  const filterKeys = options.filterKeys ?? emptyFilterKeys;
  validateFilterKeys(filterKeys);

  const requestedSortField = searchParams.get(TABLE_URL_KEYS.sortField);
  const requestedSortOrder = searchParams.get(TABLE_URL_KEYS.sortOrder);
  const sortState =
    requestedSortField !== null &&
    options.allowedSortFields.includes(requestedSortField) &&
    isSortOrder(requestedSortOrder)
      ? {
          sortField: requestedSortField,
          sortOrder: requestedSortOrder,
        }
      : {};

  return {
    page: clampInteger(
      searchParams.get(TABLE_URL_KEYS.page),
      1,
      1,
      Number.MAX_SAFE_INTEGER,
    ),
    pageSize: clampInteger(
      searchParams.get(TABLE_URL_KEYS.pageSize),
      defaultPageSize,
      1,
      MAX_TABLE_PAGE_SIZE,
    ),
    search: searchParams.get(TABLE_URL_KEYS.search) ?? "",
    ...sortState,
    filters: filterKeys.map((key) => ({
      key,
      values: searchParams.getAll(key).filter((value) => value.length > 0),
    })),
  };
}

export interface UseTableUrlStateResult extends TableUrlState {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setSort: (field?: string, order?: TableSortOrder) => void;
  setFilters: (updates: readonly TableFilterUpdate[]) => void;
}

export function useTableUrlState(
  options: TableUrlStateOptions,
): UseTableUrlStateResult {
  // React Router owns query-string transitions so browser navigation and link
  // sharing preserve the exact list state.
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseTableUrlState(searchParams, options);
  const defaultPageSize = normalizeDefaultPageSize(options.defaultPageSize);
  const filterKeys = options.filterKeys ?? emptyFilterKeys;

  // Setters are returned to table controls and debounce effects; stable
  // callbacks avoid restarting those effects until the URL actually changes.
  const updateSearchParams = useCallback(
    (
      update: (next: URLSearchParams) => void,
      navigation: { replace?: boolean } = {},
    ) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        update(next);
        return next;
      }, navigation);
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      updateSearchParams((next) => {
        const normalizedPage = clampInteger(
          page,
          1,
          1,
          Number.MAX_SAFE_INTEGER,
        );
        if (normalizedPage === 1) {
          next.delete(TABLE_URL_KEYS.page);
        } else {
          next.set(TABLE_URL_KEYS.page, String(normalizedPage));
        }
      });
    },
    [updateSearchParams],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateSearchParams((next) => {
        const normalizedPageSize = clampInteger(
          pageSize,
          defaultPageSize,
          1,
          MAX_TABLE_PAGE_SIZE,
        );
        next.delete(TABLE_URL_KEYS.page);
        if (normalizedPageSize === defaultPageSize) {
          next.delete(TABLE_URL_KEYS.pageSize);
        } else {
          next.set(TABLE_URL_KEYS.pageSize, String(normalizedPageSize));
        }
      });
    },
    [defaultPageSize, updateSearchParams],
  );

  const setSearch = useCallback(
    (search: string) => {
      updateSearchParams(
        (next) => {
          const normalizedSearch = search.trim();
          next.delete(TABLE_URL_KEYS.page);
          if (normalizedSearch.length === 0) {
            next.delete(TABLE_URL_KEYS.search);
          } else {
            next.set(TABLE_URL_KEYS.search, normalizedSearch);
          }
        },
        { replace: true },
      );
    },
    [updateSearchParams],
  );

  const setSort = useCallback(
    (field?: string, order?: TableSortOrder) => {
      if (field && !options.allowedSortFields.includes(field)) {
        throw new RangeError(`Sort field "${field}" is not allowed.`);
      }

      updateSearchParams((next) => {
        next.delete(TABLE_URL_KEYS.page);
        if (!field || !order) {
          next.delete(TABLE_URL_KEYS.sortField);
          next.delete(TABLE_URL_KEYS.sortOrder);
          return;
        }
        next.set(TABLE_URL_KEYS.sortField, field);
        next.set(TABLE_URL_KEYS.sortOrder, order);
      });
    },
    [options.allowedSortFields, updateSearchParams],
  );

  const setFilters = useCallback(
    (updates: readonly TableFilterUpdate[]) => {
      const invalidUpdate = updates.find(
        ({ key }) => !filterKeys.includes(key),
      );
      if (invalidUpdate) {
        throw new RangeError(`Filter key "${invalidUpdate.key}" is not allowed.`);
      }

      updateSearchParams((next) => {
        next.delete(TABLE_URL_KEYS.page);
        for (const { key, value } of updates) {
          next.delete(key);
          const values = typeof value === "string" ? [value] : (value ?? []);
          for (const item of values) {
            if (item.length > 0) {
              next.append(key, item);
            }
          }
        }
      });
    },
    [filterKeys, updateSearchParams],
  );

  return {
    ...state,
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setFilters,
  };
}
