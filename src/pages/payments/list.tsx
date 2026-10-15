/** Hiển thị danh sách thanh toán bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Payment } from "@/features/payments/types";
import { paymentColumns } from "@features/payments/components/columns";
export const PaymentList = () => <ResourceListPage<Payment> columns={paymentColumns} resource="payments" />;
