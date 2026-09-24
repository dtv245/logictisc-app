/** Định nghĩa columns cho Customer resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Customer } from "@/types/customer.types";
export const customerColumns = createCrudColumns<Customer>("customers", [
  { dataIndex: "name", titleKey: "columns.customers.name", sorter: true },
  { dataIndex: "email", titleKey: "columns.customers.email", sorter: true },
  { dataIndex: "phone", titleKey: "columns.customers.phone" },
  { dataIndex: "status", titleKey: "columns.customers.status", status: true, sorter: true },
]);
