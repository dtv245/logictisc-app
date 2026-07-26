/** Định nghĩa columns cho Customer resource. */
import { createCrudColumns } from "../../components";
import type { Customer } from "../../types/customer";
export const customerColumns = createCrudColumns<Customer>("customers", [
  { dataIndex: "name", title: "Tên khách hàng", sorter: true },
  { dataIndex: "email", title: "Email", sorter: true },
  { dataIndex: "phone", title: "Điện thoại" },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
]);
