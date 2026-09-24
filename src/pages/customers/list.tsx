/** Hiển thị danh sách khách hàng bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Customer } from "@/types/customer.types";
import { customerColumns } from "@features/customers/components/columns";
export const CustomerList = () => <ResourceListPage<Customer> columns={customerColumns} resource="customers" />;
