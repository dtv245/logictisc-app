/** Hiển thị danh sách thanh toán bằng Refine useTable kèm Popup tạo mới riêng theo hợp đồng Swagger. */
import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@components";
import { PaymentCreateModal } from "@/components/payments/PaymentCreateModal";
import type { Payment } from "@/types/payments/payments.types";
import { paymentColumns } from "@features/payments/components/columns";

export const PaymentList = () => (
  <ResourceListPage<Payment>
    columns={paymentColumns}
    resource="payments"
    headerButtons={() => (
      <PaymentCreateModal
        trigger={(show) => (
          <CreateButton
            onClick={(e) => {
              e.preventDefault();
              show();
            }}
          />
        )}
      />
    )}
  />
);
