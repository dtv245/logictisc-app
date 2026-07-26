/** Hiển thị danh sách nhân viên bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Employee } from "../../types/employee";
import { employeeColumns } from "./columns";
export const EmployeeList = () => <ResourceListPage<Employee> columns={employeeColumns} resource="employees" />;
