/**
 * `useEntityFilters` — chỗ duy nhất biết cách filter của `FilterBar` biến thành
 * `CrudFilter[]` cho `useTable`.
 *
 * Ba khẳng định ở đây tương ứng ba cách hỏng thật:
 *
 * 1. Gửi `{value: ""}` thay vì bỏ hẳn filter — backend so sánh với chuỗi rỗng, ra
 *    bảng rỗng, và người dùng đọc là "không có dữ liệu".
 * 2. Dựng lại mảng filter chỉ từ control của mình rồi `"replace"` — xoá luôn mọi
 *    filter khác đang có.
 * 3. Không kéo về trang 1 — đang ở trang 5 rồi lọc còn 2 kết quả là bảng rỗng.
 */

import type { CrudFilter } from "@refinedev/core";
import { useEntityFilters } from "@hooks/useEntityFilters";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const setup = (initialFilters: CrudFilter[] = []) => {
  const setFilters = vi.fn();
  const setCurrent = vi.fn();
  const view = renderHook(() => {
    const [filters, applyFilters] = useState(initialFilters);

    return useEntityFilters("loads", {
      filters,
      setCurrent,
      // `useTable` trả về mảng filter mới sau mỗi lần đặt, nên harness phải làm y vậy.
      // Nếu `filters` đứng yên, lần `setFilter` thứ hai sẽ tính từ mảng cũ và bỏ mất
      // filter vừa đặt ở lần đầu — test sẽ xanh trong khi app thì sai.
      setFilters: (next, behavior) => {
        setFilters(next, behavior);
        applyFilters(next);
      },
    });
  });

  return { ...view, setCurrent, setFilters };
};

describe("useEntityFilters — đọc filter hiện có", () => {
  it("dịch CrudFilter[] thành record mà FilterBar hiển thị được", () => {
    const { result } = setup([
      { field: "status", operator: "eq", value: "dispatched" },
      { field: "search", operator: "contains", value: "HN" },
    ]);

    expect(result.current.value).toEqual({ search: "HN", status: "dispatched" });
  });

  it("bỏ qua filter có giá trị rỗng và filter không phải dạng field/value", () => {
    const { result } = setup([
      { field: "status", operator: "eq", value: "" },
      { operator: "or", value: [] } as unknown as CrudFilter,
    ]);

    expect(result.current.value).toEqual({});
  });

  it("trả về control của resource", () => {
    const { result } = setup();

    expect(result.current.controls.map(({ field }) => field)).toEqual([
      "search",
      "status",
      "customerId",
      "truckId",
      "dispatcherId",
    ]);
  });
});

describe("useEntityFilters — đổi filter", () => {
  it("search dùng `contains`, các filter khác dùng `eq`", () => {
    const { result, setCurrent, setFilters } = setup();

    act(() => result.current.setFilter("search", "HN"));
    expect(setFilters).toHaveBeenLastCalledWith(
      [{ field: "search", operator: "contains", value: "HN" }],
      "replace",
    );

    act(() => result.current.setFilter("status", "dispatched"));
    expect(setFilters).toHaveBeenLastCalledWith(
      [
        { field: "search", operator: "contains", value: "HN" },
        { field: "status", operator: "eq", value: "dispatched" },
      ],
      "replace",
    );

    expect(setCurrent).toHaveBeenCalledWith(1);
  });

  it("bỏ hẳn filter khi giá trị bị xoá, không gửi chuỗi rỗng", () => {
    const { result, setFilters } = setup([
      { field: "status", operator: "eq", value: "dispatched" },
    ]);

    act(() => result.current.setFilter("status", undefined));

    expect(setFilters).toHaveBeenCalledWith([], "replace");
  });

  it("từ chối field không có control — field ngoài allowlist làm hỏng cả query", () => {
    const { result, setCurrent, setFilters } = setup();

    act(() => result.current.setFilter("khongCoThat", "x"));

    expect(setFilters).not.toHaveBeenCalled();
    expect(setCurrent).not.toHaveBeenCalled();
  });

  it("giữ lại filter không do FilterBar quản lý", () => {
    const foreign: CrudFilter = {
      field: "khongDoFilterBarQuanLy",
      operator: "eq",
      value: "x",
    };
    const { result, setFilters } = setup([
      { field: "status", operator: "eq", value: "draft" },
      foreign,
    ]);

    act(() => result.current.setFilter("status", "dispatched"));

    expect(setFilters).toHaveBeenCalledWith(
      [foreign, { field: "status", operator: "eq", value: "dispatched" }],
      "replace",
    );
  });
});

describe("useEntityFilters — xoá bộ lọc", () => {
  it("bỏ filter của FilterBar, giữ filter ngoài, và về trang 1", () => {
    const foreign: CrudFilter = {
      field: "khongDoFilterBarQuanLy",
      operator: "eq",
      value: "x",
    };
    const { result, setCurrent, setFilters } = setup([
      { field: "status", operator: "eq", value: "draft" },
      { field: "search", operator: "contains", value: "HN" },
      foreign,
    ]);

    act(() => result.current.reset());

    expect(setFilters).toHaveBeenCalledWith([foreign], "replace");
    expect(setCurrent).toHaveBeenCalledWith(1);
  });
});
