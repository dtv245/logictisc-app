/** Định nghĩa columns cho Payment resource. */
import { createCrudColumns } from "../../components";
import type { Payment } from "../../types/finance";
export const paymentColumns = createCrudColumns<Payment>("payments", [
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "referenceNumber", title: "Mã tham chiếu", sorter: true },
  { dataIndex: "invoiceId", title: "Hóa đơn" },
  { dataIndex: "recordedAt", title: "Thời điểm ghi nhận", sorter: true },
]);
