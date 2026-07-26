/** Định nghĩa columns cho Expense resource. */
import { createCrudColumns } from "../../components";
import type { Expense } from "../../types/finance";
export const expenseColumns = createCrudColumns<Expense>("expenses", [
  { dataIndex: "number", title: "Số chi phí", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "vendorName", title: "Nhà cung cấp", sorter: true },
  { dataIndex: "expenseDate", title: "Ngày chi", sorter: true },
]);
