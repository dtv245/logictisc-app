/** Hiển thị danh sách nhân viên bằng Refine useTable kèm Popup tạo mới riêng theo hợp đồng Swagger. */
import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@/components/ResourceListPage";
import { EmployeeCreateModal } from "@/components/employees/EmployeeCreateModal";
import type { Employee } from "@/types/employee.types";
import { employeeColumns } from "@features/employees/components/columns";

export const EmployeeList = () => (
  <ResourceListPage<Employee>
    columns={employeeColumns}
    resource="employees"
    headerButtons={() => (
      <EmployeeCreateModal
        trigger={(show) => (
          <CreateButton
            onClick={(e) => {
              e.preventDefault();
              show();
            }}
          />
        )}
      />
    )}
  />
);
