/** Định nghĩa columns cho Employee resource. */
import { createCrudColumns } from "../../components";
import type { Employee } from "../../types/employee";
export const employeeColumns = createCrudColumns<Employee>("employees", [
  { dataIndex: "firstName", title: "Tên", sorter: true },
  { dataIndex: "lastName", title: "Họ", sorter: true },
  { dataIndex: "email", title: "Email", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
]);
