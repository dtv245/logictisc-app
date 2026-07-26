/** Hiển thị danh sách khách hàng bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Customer } from "../../types/customer";
import { customerColumns } from "./columns";
export const CustomerList = () => <ResourceListPage<Customer> columns={customerColumns} resource="customers" />;
