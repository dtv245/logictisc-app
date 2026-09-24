/** Định nghĩa columns cho Employee resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Employee } from "@/types/employee.types";
export const employeeColumns = createCrudColumns<Employee>("employees", [
  { dataIndex: "firstName", titleKey: "columns.employees.firstName", sorter: true },
  { dataIndex: "lastName", titleKey: "columns.employees.lastName", sorter: true },
  { dataIndex: "email", titleKey: "columns.employees.email", sorter: true },
  { dataIndex: "status", titleKey: "columns.employees.status", status: true, sorter: true },
]);
