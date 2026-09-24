/** Định nghĩa columns cho Invoice resource. */
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Invoice } from "@/types/invoice.types";
export const invoiceColumns = createCrudColumns<Invoice>("invoices", [
  { dataIndex: "number", titleKey: "columns.invoices.number", sorter: true },
  { dataIndex: "type", titleKey: "columns.invoices.type", options: true, sorter: true },
  { dataIndex: "status", titleKey: "columns.invoices.status", status: true, sorter: true },
  {
    dataIndex: "customerName",
    titleKey: "columns.invoices.customerName",
    render: (value: unknown) => displayValue(value),
  },
  {
    dataIndex: "employeeName",
    titleKey: "columns.invoices.employeeName",
    render: (value: unknown) => displayValue(value),
  },
  { dataIndex: "dueDate", titleKey: "columns.invoices.dueDate", sorter: true },
]);

