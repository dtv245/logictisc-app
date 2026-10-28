import { ResourceListPage } from "@/components";
import { driverColumns } from "@/components/drivers/columns";
import type { Employee } from "@/types/employee.types";

const DriverList = () => <ResourceListPage<Employee> columns={driverColumns} resource="drivers" />;

export default DriverList;
