/**
 * Nối `FilterBar` với `useTable`.
 *
 * Ba việc, và chỉ ba việc:
 *
 * 1. Dịch qua lại giữa `CrudFilter[]` của Refine và một record phẳng `{field: value}`
 *    mà `FilterBar` hiển thị được.
 * 2. **Bỏ giá trị rỗng** trước khi gửi. Một filter `status: ""` không phải "không lọc
 *    theo status" ở phía backend — nó là một điều kiện so sánh với chuỗi rỗng.
 * 3. **Reset về trang 1 khi filter đổi.** Giữ nguyên trang 5 rồi lọc còn 2 kết quả sẽ
 *    ra bảng rỗng, và người dùng đọc kết quả đó là "không có dữ liệu".
 *
 * URL không phải việc của hook này: `useTable` đã có `syncWithLocation: true` nên
 * filter/sort/page đã nằm trên URL sẵn (`docs/frontend-management-ui-spec.md` §3.6).
 * Tự đẩy thêm vào history ở đây sẽ tạo nguồn sự thật thứ hai.
 */

import type { CrudFilter } from "@refinedev/core";
import { useCallback, useMemo } from "react";

import {
  resolveFilterControls,
  type ResourceFilterControl,
} from "@components/resources/resourceFilterControls";

/** Phần `useTable` mà hook này cần — khai hẹp để test không phải dựng cả bảng. */
export interface EntityTableFilterApi {
  filters: CrudFilter[];
  setCurrent: (page: number) => void;
  setFilters: (filters: CrudFilter[], behavior?: "merge" | "replace") => void;
}

export interface EntityFiltersResult {
  controls: readonly ResourceFilterControl[];
  /** Gọi khi một filter đổi; `undefined` nghĩa là bỏ filter đó. */
  setFilter: (field: string, value: string | undefined) => void;
  reset: () => void;
  /** Giá trị đang áp dụng, khoá theo tên query param. */
  value: Readonly<Record<string, string | undefined>>;
}

const readFilterValue = (filter: CrudFilter): string | undefined => {
  if (!("field" in filter)) {
    return undefined;
  }
  const { value } = filter;
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const toFilterValue = (
  filters: readonly CrudFilter[],
): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = {};
  for (const filter of filters) {
    if (!("field" in filter)) {
      continue;
    }
    const value = readFilterValue(filter);
    if (value !== undefined) {
      result[filter.field] = value;
    }
  }
  return result;
};

/**
 * Filter không do `FilterBar` quản lý (permanent filter, hoặc filter do màn hình khác
 * đặt) phải được giữ nguyên: `setFilters(..., "replace")` thay thế **toàn bộ** mảng,
 * nên dựng lại mảng chỉ từ `controls` sẽ âm thầm xoá chúng.
 */
const keepForeignFilters = (
  filters: readonly CrudFilter[],
  controls: readonly ResourceFilterControl[],
): CrudFilter[] => {
  const managed = new Set(controls.map((control) => control.field));
  return filters.filter(
    (filter) => !("field" in filter) || !managed.has(filter.field),
  );
};

const toCrudFilters = (
  controls: readonly ResourceFilterControl[],
  value: Readonly<Record<string, string | undefined>>,
): CrudFilter[] =>
  controls.flatMap<CrudFilter>((control) => {
    const current = value[control.field];
    if (current === undefined || current === "") {
      return [];
    }
    return [
      {
        field: control.field,
        // `search` là tìm gần đúng; mọi filter còn lại là so khớp chính xác. Đây cũng
        // là hai operator duy nhất `serializeFilters` chấp nhận.
        operator: control.kind === "search" ? "contains" : "eq",
        value: current,
      },
    ];
  });

export const useEntityFilters = (
  resource: string,
  table: EntityTableFilterApi,
): EntityFiltersResult => {
  const { filters, setCurrent, setFilters } = table;
  const controls = useMemo(() => resolveFilterControls(resource), [resource]);
  const value = useMemo(() => toFilterValue(filters), [filters]);

  const setFilter = useCallback(
    (field: string, next: string | undefined) => {
      // Field không có control nghĩa là không nằm trong allowlist — gửi lên sẽ làm
      // `serializeFilters` ném lỗi và hỏng cả query, nên từ chối ngay tại đây.
      if (!controls.some((control) => control.field === field)) {
        return;
      }

      const nextValue = { ...value, [field]: next };
      setFilters(
        [
          ...keepForeignFilters(filters, controls),
          ...toCrudFilters(controls, nextValue),
        ],
        "replace",
      );
      setCurrent(1);
    },
    [controls, filters, setCurrent, setFilters, value],
  );

  const reset = useCallback(() => {
    setFilters(keepForeignFilters(filters, controls), "replace");
    setCurrent(1);
  }, [controls, filters, setCurrent, setFilters]);

  return { controls, reset, setFilter, value };
};
