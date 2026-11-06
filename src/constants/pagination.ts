import type { PaginationProps } from "antd/es/pagination";
import type { TFunction } from "i18next";

export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_PAGE_SIZE = 10;
export const MAX_LIST_PAGE_SIZE = 100;
export const LIST_PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"] as const;

export const createListPaginationConfig = (
  t: TFunction,
): Pick<PaginationProps, "pageSizeOptions" | "showSizeChanger" | "showTotal"> => ({
  pageSizeOptions: [...LIST_PAGE_SIZE_OPTIONS],
  showSizeChanger: true,
  showTotal: (total, range) =>
    t("table.pagination.total", {
      from: range[0],
      to: range[1],
      total,
      defaultValue: `${range[0]}–${range[1]} / ${total} mục`,
    }),
});
