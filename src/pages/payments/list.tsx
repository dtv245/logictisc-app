/** Hiển thị danh sách thanh toán bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Payment } from "../../types/finance";
import { paymentColumns } from "./columns";
export const PaymentList = () => <ResourceListPage<Payment> columns={paymentColumns} resource="payments" />;
