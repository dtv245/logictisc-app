/**
 * EmptyState
 *
 * Trạng thái "không có dữ liệu" dùng chung: bảng rỗng, danh sách rỗng, kết quả
 * lọc không khớp gì.
 *
 * Vì sao tách khỏi `AsyncStateView` thay vì chỉ đổi tên: `AsyncStateView` render
 * **bốn** trạng thái (loading / error / empty / populated) từ một discriminated
 * union, nên gọi nó là `EmptyState` sẽ sai — một `EmptyState` bắn ra `<Spin/>` là
 * tên nói dối về việc nó làm. Ở đây `EmptyState` chỉ là nhánh rỗng, còn
 * `AsyncStateView` là bộ điều phối và gọi lại component này.
 *
 * `aria-live="polite"` là chủ ý: danh sách đang có dữ liệu rồi chuyển sang rỗng
 * (do lọc hoặc do xoá) là thay đổi cần được trình đọc màn hình đọc lên.
 */
import { Button, Empty, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface EmptyStateProps {
  /** Nút hành động, thường là "Tạo mới". Antd render phần này dưới mô tả. */
  action?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
  /** Bật cờ này khi danh sách rỗng là do bộ lọc/tìm kiếm thay vì không có dữ liệu ban đầu. */
  isFiltered?: boolean;
  /** Callback xóa bộ lọc khi danh sách rỗng do bộ lọc. */
  onResetFilters?: () => void;
}

export function EmptyState({
  action,
  description,
  title,
  isFiltered = false,
  onResetFilters,
}: EmptyStateProps) {
  const { t } = useTranslation();

  const defaultTitle = isFiltered
    ? t("asyncState.emptyFilteredTitle")
    : t("asyncState.emptyTitle");

  const defaultDescription = isFiltered
    ? t("asyncState.emptyFilteredDescription")
    : t("asyncState.emptyDescription");

  const filterResetAction =
    isFiltered && onResetFilters ? (
      <Button onClick={onResetFilters} type="default">
        {t("actions.clearFilters")}
      </Button>
    ) : null;

  return (
    <section aria-live="polite" className="app-empty-state">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction="vertical" size={4}>
            <Typography.Text strong className="app-empty-state__title">
              {title ?? defaultTitle}
            </Typography.Text>
            <Typography.Text type="secondary" className="app-empty-state__description">
              {description ?? defaultDescription}
            </Typography.Text>
          </Space>
        }
      >
        {action ?? filterResetAction}
      </Empty>
    </section>
  );
}
