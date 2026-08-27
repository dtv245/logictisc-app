/**
 * Verifies URL-backed table state, pagination bounds and debounced search.
 */
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MAX_TABLE_PAGE_SIZE,
  parseTableUrlState,
  useTableUrlState,
  type TableUrlStateOptions,
} from "./tableUrlState";
import {
  TABLE_SEARCH_DEBOUNCE_MS,
  useDebouncedTableSearch,
} from "./useDebouncedTableSearch";

const tableOptions: TableUrlStateOptions = {
  defaultPageSize: 20,
  allowedSortFields: ["createdAt"],
  filterKeys: ["status"],
};

describe("parseTableUrlState", () => {
  it("enforces 1-based pagination, page-size bounds and sort whitelist", () => {
    const state = parseTableUrlState(
      new URLSearchParams(
        "page=0&pageSize=999&sort=unknown&order=asc&status=draft&status=active",
      ),
      tableOptions,
    );

    expect(state).toMatchObject({
      page: 1,
      pageSize: MAX_TABLE_PAGE_SIZE,
      search: "",
      filters: [
        {
          key: "status",
          values: ["draft", "active"],
        },
      ],
    });
    expect("sortField" in state).toBe(false);
    expect("sortOrder" in state).toBe(false);
  });
});

describe("useTableUrlState", () => {
  it("resets page when a filter changes", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={["/?page=7&status=draft"]}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(
      () => useTableUrlState(tableOptions),
      { wrapper },
    );

    act(() => {
      result.current.setFilters([
        {
          key: "status",
          value: "active",
        },
      ]);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.filters[0]?.values).toEqual(["active"]);
  });

  it("resets page when debounced search is committed", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={["/?page=7"]}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(
      () => useTableUrlState(tableOptions),
      { wrapper },
    );

    act(() => {
      result.current.setSearch("truck");
    });

    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe("truck");
  });
});

describe("useDebouncedTableSearch", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("commits only the newest value after 400 milliseconds", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedTableSearch({
        committedSearch: "",
        onCommit,
      }),
    );

    act(() => {
      result.current.setSearchInput("tru");
      result.current.setSearchInput("truck");
    });

    act(() => {
      vi.advanceTimersByTime(TABLE_SEARCH_DEBOUNCE_MS - 1);
    });
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith("truck");
  });
});
