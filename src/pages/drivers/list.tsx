import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@/components";
import { DriverCreateModal } from "@/components/drivers/DriverCreateModal";
import { driverColumns } from "@/components/drivers/columns";
import type { Employee } from "@/types/employees/employee.types";

const DriverList = () => (
  <ResourceListPage<Employee>
    columns={driverColumns}
    resource="drivers"
    headerButtons={() => (
      <DriverCreateModal
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

export default DriverList;
