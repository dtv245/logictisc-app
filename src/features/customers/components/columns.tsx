/** Định nghĩa columns cho Customer resource. */
import { Link } from "react-router-dom";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Customer } from "@/types/customer.types";

export const customerColumns = createCrudColumns<Customer>("customers", [
  {
    dataIndex: "name",
    titleKey: "columns.customers.name",
    sorter: true,
    render: (value: unknown, record: Customer) => (
      <Link to={routes.resources.customers.show.replace(":id", String(record.id))}>
        <strong>{displayValue(value)}</strong>
      </Link>
    ),
  },
  { dataIndex: "email", titleKey: "columns.customers.email", sorter: true },
  { dataIndex: "phone", titleKey: "columns.customers.phone" },
  { dataIndex: "status", titleKey: "columns.customers.status", status: true, sorter: true },
]);
