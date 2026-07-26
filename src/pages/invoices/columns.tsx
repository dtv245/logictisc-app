/** Định nghĩa columns cho Invoice resource. */
import { createCrudColumns } from "../../components";
import type { Invoice } from "../../types/finance";
export const invoiceColumns = createCrudColumns<Invoice>("invoices", [
  { dataIndex: "number", title: "Số hóa đơn", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "dueDate", title: "Hạn thanh toán", sorter: true },
]);
