/**
 * BaseTable — bảng dùng chung cho mọi màn danh sách.
 *
 * Triết lý UX:
 * - Đang tải (loading/isFetching): không unmount hay thay bảng bằng spinner tròn;
 *   chỉ uỷ quyền cho tableProps.loading của antd Table (tránh giật layout khi phân trang/đổi filter).
 *   Khung bao ngoài giữ min-height khi đang tải để không co giật diện tích giao diện.
 * - Rỗng: giữ nguyên hàng header; nội dung rỗng hiển thị trong thân bảng qua
 *   locale.emptyText với component EmptyState (phân biệt rỗng thường vs rỗng do bộ lọc).
 * - Lỗi: khi queryResult.error có giá trị, thay bảng bằng QueryErrorState (mô tả lỗi +
 *   nút Thử lại gọi refetch, disabled khi đang isFetching).
 */

import type { BaseRecord } from "@refinedev/core";
import { ConfigProvider, Grid, Table, Tooltip } from "antd";
import type { TableProps } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { memo, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@components/EmptyState";
import { QueryErrorState } from "@components/ErrorStates";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";
import { ApiHttpError } from "@/utils/httpError";
import { resolveApiErrorMessage } from "@/utils/errorMessages";
import "./BaseTable.scss";
import { useShellTableLayout } from "./useShellTableLayout";

/**
 * Phần của kết quả query mà bảng cần. Khai hẹp thay vì nhận cả `QueryObserverResult`
 * để test dựng được trạng thái mà không phải bịa cả một observer.
 */
export interface BaseTableQueryResult {
  data?: unknown;
  error?: unknown;
  isFetching?: boolean;
  refetch?: () => void;
}

export interface BaseTableProps<TData extends BaseRecord> {
  columns: ColumnsType<TData>;
  /** Kết quả của `useTable`/`useList` đứng sau bảng này. */
  queryResult: BaseTableQueryResult;
  /** `tableProps` từ `useTable` — nguồn của `dataSource`, `loading`, `pagination`. */
  tableProps: TableProps<TData>;
  /** Mặc định `"id"`: mọi resource trong hệ thống đều có khoá này. */
  rowKey?: string;
  /** Nội dung khi không có dòng nào. Mặc định là trạng thái rỗng dùng chung. */
  emptyText?: ReactNode;
  /** Mặc định cuộn ngang khi cột không vừa, thay vì bóp cột lại cho vừa. */
  scroll?: TableProps<TData>["scroll"];
  /** Cờ báo hiệu bảng đang lọc dữ liệu, để hiển thị EmptyState phù hợp. */
  isFiltered?: boolean;
  /** Callback xóa bộ lọc khi EmptyState hiển thị trạng thái lọc không có kết quả. */
  onResetFilters?: () => void;
  /** Chiều cao tối thiểu của khung bảng khi tải để tránh co giật layout. */
  minHeight?: number | string;
  /** Cấu hình sticky header khi cuộn dọc. Mặc định { offsetHeader: 0 }. */
  sticky?: boolean | TableProps<TData>["sticky"];
  /** Tên lớp CSS tùy biến. */
  className?: string;
  /** Dùng vùng còn lại trong shell cho bảng danh sách cấp trang. */
  fitToShell?: boolean;
  /** Owner đồng bộ pageSize vào Refine/API khi sức chứa của bảng thay đổi. */
  onAdaptivePageSizeChange?: (pageSize: number) => void;
}

const TABLE_THEME = {
  components: {
    Table: {
      headerBg: "#ffffff",
      headerColor: "#24292b",
      headerSplitColor: "transparent",
      headerBorderRadius: 12,
      borderColor: "transparent",
      rowHoverBg: "#ece9e3",
      rowSelectedBg: "#ece8d8",
      rowSelectedHoverBg: "#e3ddc6",
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      fontSize: 13,
      fontWeightStrong: 600,
    },
    Pagination: {
      fontSize: 13,
      itemSize: 28,
    },
  },
};

const BaseTableComponent = <TData extends BaseRecord>({
  columns,
  emptyText,
  isFiltered = false,
  minHeight = 360,
  onResetFilters,
  queryResult,
  rowKey = "id",
  scroll = { x: "max-content" },
  sticky,
  tableProps,
  className,
  fitToShell = false,
  onAdaptivePageSizeChange,
}: BaseTableProps<TData>) => {
  const { t } = useTranslation();
  const { error, isFetching, refetch } = queryResult;
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const { wrapperRef, layout } = useShellTableLayout(fitToShell && !error);
  // Chỉ báo số dòng mới khi sức chứa thay đổi, không ghi đè lựa chọn thủ công mỗi render.
  const lastAdaptivePageSize = useRef<number>();
  const adaptivePageSize = layout?.pageSize;
  useEffect(() => {
    if (tableProps.pagination === false || adaptivePageSize === undefined || !onAdaptivePageSizeChange || lastAdaptivePageSize.current === adaptivePageSize) return;
    lastAdaptivePageSize.current = adaptivePageSize;
    onAdaptivePageSizeChange(adaptivePageSize);
  }, [adaptivePageSize, onAdaptivePageSizeChange, tableProps.pagination]);

  // 2. Tinh chỉnh columns: căn lề, fixed actions bên phải, ellipsis tooltip
  const processedColumns = useMemo(() => {
    return columns.map((col, idx) => {
      if ("children" in col && Array.isArray(col.children)) {
        return col;
      }

      const column = { ...col } as ColumnType<TData>;
      const keyStr = String(column.key ?? column.dataIndex ?? "");
      const isActions = keyStr === "actions";

      // Cột actions: cố định bên phải, căn giữa, chiều rộng ổn định
      if (isActions) {
        return {
          fixed: column.fixed ?? ("right" as const),
          align: column.align ?? ("center" as const),
          width: column.width ?? 130,
          ...column,
        };
      }

      // Cột đầu tiên (khi có từ 3 cột trở lên): chỉ tự động cố định bên trái trên desktop
      if (idx === 0 && columns.length >= 3 && column.fixed === undefined && !isMobile) {
        column.fixed = "left";
        column.width = column.width ?? 140;
      }

      // Cột số tự động căn phải
      const dataIndexStr = typeof column.dataIndex === "string" ? column.dataIndex : "";
      const isNumeric =
        column.align === "right" ||
        /(?:amount|price|cost|total|capacity|vehicleCapacity|count|quantity|weight|distance|mileage|rate|balance|fee|hours)/i.test(
          dataIndexStr,
        );

      if (isNumeric && !column.align) {
        column.align = "right";
      }

      // Ellipsis text với tooltip cho các cột không có custom render
      if (!column.render && !isActions) {
        column.render = (value: unknown) => {
          if (value === null || value === undefined || value === "") {
            return "—";
          }
          const text = String(value);
          return (
            <Tooltip placement="topLeft" title={text}>
              <span className="base-table-cell-ellipsis">{text}</span>
            </Tooltip>
          );
        };
      }

      return column;
    });
  }, [columns, isMobile]);

  // Cuộn ngang mặc định x: max-content nếu không được cấu hình tường minh
  const resolvedScroll = useMemo(() => {
    if (!scroll) {
      return { x: "max-content" };
    }
    return {
      x: scroll.x ?? "max-content",
      ...(layout ? { y: layout.bodyHeight } : {}),
      ...scroll,
    };
  }, [scroll, layout]);

  // 3. Phân trang gọn gàng, hỗ trợ chế độ compact trên mobile
  const processedPagination = useMemo(() => {
    if (tableProps.pagination === false) {
      return false;
    }

    const paginationObj =
      typeof tableProps.pagination === "object" && tableProps.pagination !== null
        ? tableProps.pagination
        : {};

    const total = paginationObj.total ?? 0;

    return {
      size: "small" as const,
      responsive: true,
      showLessItems: true,
      showSizeChanger: isMobile ? false : (paginationObj.showSizeChanger ?? true),
      pageSizeOptions: [...new Set([5, 10, 20, 50, 100, ...(adaptivePageSize === undefined ? [] : [adaptivePageSize])])].sort((a, b) => a - b).map(String),
      showQuickJumper: isMobile ? false : (paginationObj.showQuickJumper ?? total > 50),
      showTotal: (totalCount: number, range: [number, number]) =>
        t("table.pagination.total", {
          from: range[0],
          to: range[1],
          total: totalCount,
          defaultValue: `${range[0]}–${range[1]} / ${totalCount}`,
        }),
      ...paginationObj,
      // The URL may contain zero/NaN even when the API serializer sends valid numbers.
      // Preserve uncontrolled local tables; adding current=1 would freeze their navigation.
      ...(paginationObj.current !== undefined ? { current: Math.max(1, normalizePage(paginationObj.current)) } : {}),
      ...(paginationObj.defaultCurrent !== undefined ? { defaultCurrent: Math.max(1, normalizePage(paginationObj.defaultCurrent)) } : {}),
      ...(paginationObj.pageSize !== undefined ? { pageSize: normalizePageSize(paginationObj.pageSize) } : {}),
      ...(paginationObj.onChange !== undefined
        ? {
            onChange: (page: number, pageSize: number) => {
              paginationObj.onChange?.(Math.max(1, page || 1), pageSize);
            },
          }
        : {}),
    };
  }, [tableProps.pagination, isMobile, t, adaptivePageSize]);

  // 4. Trạng thái rỗng: giữ header, phân biệt rỗng thường vs rỗng do bộ lọc
  const resolvedEmptyText = useMemo(() => {
    if (emptyText !== undefined) {
      return emptyText;
    }
    return <EmptyState isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  }, [emptyText, isFiltered, onResetFilters]);

  // 1. Nhánh lỗi: thay hẳn bảng bằng QueryErrorState
  if (error !== undefined && error !== null) {
    const description = error instanceof ApiHttpError ? resolveApiErrorMessage(error.code, error.params, error.message, t)
      : error instanceof Error ? error.message : undefined;

    return (
      <QueryErrorState
        {...(description === undefined ? {} : { description })}
        {...(refetch ? { onRetry: () => refetch() } : {})}
        {...(isFetching === undefined ? {} : { retrying: isFetching })}
      />
    );
  }

  const isLoading = Boolean(tableProps.loading || isFetching);

  const handleTableChange: TableProps<TData>["onChange"] = (pagination, filters, sorter, extra) => {
    const safePagination = pagination
      ? {
          ...pagination,
          current: pagination.current !== undefined ? Math.max(1, pagination.current) : 1,
        }
      : pagination;
    tableProps.onChange?.(safePagination, filters, sorter, extra);
  };

  return (
    <ConfigProvider theme={TABLE_THEME}>
      <div
        ref={wrapperRef}
        className={`base-table-wrapper ${layout ? "base-table-wrapper--fit-shell" : ""} ${isLoading ? "base-table-wrapper--loading" : ""} ${className ?? ""}`.trim()}
        style={layout ? { height: layout.height, minHeight: 0 } : { minHeight: isLoading ? minHeight : undefined }}
      >
        <Table<TData>
          {...tableProps}
          columns={processedColumns}
          locale={{
            emptyText: resolvedEmptyText,
          }}
          onChange={handleTableChange}
          pagination={processedPagination}
          rowKey={rowKey}
          scroll={resolvedScroll}
          {...(sticky !== undefined ? { sticky } : {})}
        />
      </div>
    </ConfigProvider>
  );
};

export const BaseTable = memo(BaseTableComponent) as typeof BaseTableComponent;
