/** Định nghĩa columns cho Expense resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Expense } from "@/types/expense.types";
export const expenseColumns = createCrudColumns<Expense>("expenses", [
  { dataIndex: "number", titleKey: "columns.expenses.number", sorter: true },
  { dataIndex: "type", titleKey: "columns.expenses.type", sorter: true },
  { dataIndex: "status", titleKey: "columns.expenses.status", status: true, sorter: true },
  { dataIndex: "vendorName", titleKey: "columns.expenses.vendorName", sorter: true },
  { dataIndex: "expenseDate", titleKey: "columns.expenses.expenseDate", sorter: true },
]);
