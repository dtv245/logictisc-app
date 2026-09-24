/**
 * BaseTable — bảng dùng chung cho mọi màn danh sách.
 *
 * Vì sao cần: trước đây chỉ `ResourceListPage` biết cách xử lý lỗi tải bảng. Mọi màn
 * khác tự render `<Table>` trần, nên một query hỏng cho ra **bảng rỗng** — và người
 * dùng đọc "không có dữ liệu" trong khi sự thật là "chưa tải được". Hai chuyện đó
 * khác nhau, và chỉ một trong hai là việc người dùng sửa được.
 *
 * BaseTable cố ý **không** dùng `AsyncStateView` cho cả bốn trạng thái, vì bảng khác
 * phần nội dung thường ở hai điểm:
 *
 * - **Đang tải** không được thay bảng. Lần tải đầu đã có `loading` của antd; những lần
 *   sau (đổi trang, đổi filter) chỉ là refetch nền — thay cả bảng bằng spinner làm mất
 *   ngữ cảnh và nhấp nháy cột. `AsyncStateView` kiểm `isLoading` trước cả `error` nên
 *   dùng nó ở đây sẽ biến mọi lần refetch thành một lần dựng lại toàn bộ.
 * - **Rỗng** không được thay bảng. Header cột là thông tin: bỏ bảng đi thì người dùng
 *   mất luôn trục để hiểu mình đang xem gì. Trạng thái rỗng nằm *trong* thân bảng, qua
 *   `locale.emptyText`, nên cột vẫn còn.
 *
 * Chỉ **lỗi** mới thay hẳn bảng, và đó đúng là hành vi `ResourceListPage` đã có.
 */

import type { BaseRecord } from "@refinedev/core";
import { Table } from "antd";
import type { TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";

import { EmptyState } from "@components/EmptyState";
import { QueryErrorState } from "@components/ErrorStates";

/**
 * Phần của kết quả query mà bảng cần. Khai hẹp thay vì nhận cả `QueryObserverResult`
 * để test dựng được trạng thái mà không phải bịa cả một observer.
 */
export interface BaseTableQueryResult {
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
}

export const BaseTable = <TData extends BaseRecord>({
  columns,
  emptyText,
  queryResult,
  rowKey = "id",
  scroll = { x: "max-content" },
  tableProps,
}: BaseTableProps<TData>) => {
  const { error, isFetching, refetch } = queryResult;

  if (error !== undefined && error !== null) {
    // Chỉ đọc message khi chắc chắn là `Error` (`ApiHttpError` cũng là `Error`). Lỗi
    // không rõ hình dạng thì rơi về mô tả của locale, thay vì hiện "[object Object]".
    const description = error instanceof Error ? error.message : undefined;

    return (
      <QueryErrorState
        {...(description === undefined ? {} : { description })}
        {...(refetch ? { onRetry: () => refetch() } : {})}
        {...(isFetching === undefined ? {} : { retrying: isFetching })}
      />
    );
  }

  return (
    <Table<TData>
      {...tableProps}
      columns={columns}
      locale={{
        // Giữ tiêu đề cột để "chưa có dòng nào" không bị đọc thành "màn này không có gì".
        // `EmptyState` tự lấy tiêu đề/mô tả từ locale, không truyền lại ở đây.
        emptyText: emptyText ?? <EmptyState />,
      }}
      rowKey={rowKey}
      scroll={scroll}
    />
  );
};
