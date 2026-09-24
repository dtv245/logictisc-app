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
import { Empty, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface EmptyStateProps {
  /** Nút hành động, thường là "Tạo mới". Antd render phần này dưới mô tả. */
  action?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <section aria-live="polite">
      <Empty
        description={
          <Space direction="vertical">
            <Typography.Text strong>
              {title ?? t("asyncState.emptyTitle")}
            </Typography.Text>
            <Typography.Text type="secondary">
              {description ?? t("asyncState.emptyDescription")}
            </Typography.Text>
          </Space>
        }
      >
        {action}
      </Empty>
    </section>
  );
}
