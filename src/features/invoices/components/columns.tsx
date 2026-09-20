/** Định nghĩa columns cho Invoice resource. */
import { createCrudColumns } from "@components";
import { displayValue } from "@formatters/display";
import type { Invoice } from "@/types/invoice.types";
export const invoiceColumns = createCrudColumns<Invoice>("invoices", [
  { dataIndex: "number", title: "Số hóa đơn", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  {
    dataIndex: "customerName",
    title: "Khách hàng",
    render: (value: unknown) => displayValue(value),
  },
  {
    dataIndex: "employeeName",
    title: "Nhân viên",
    render: (value: unknown) => displayValue(value),
  },
  { dataIndex: "dueDate", title: "Hạn thanh toán", sorter: true },
]);

