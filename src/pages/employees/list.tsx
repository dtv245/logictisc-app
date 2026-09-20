/** Hiển thị danh sách nhân viên bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Employee } from "@/types/employee.types";
import { employeeColumns } from "@features/employees/components/columns";
export const EmployeeList = () => <ResourceListPage<Employee> columns={employeeColumns} resource="employees" />;
