/** Hiển thị danh sách chi phí bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Expense } from "@/types/expense.types";
import { expenseColumns } from "@features/expenses/components/columns";
export const ExpenseList = () => <ResourceListPage<Expense> columns={expenseColumns} resource="expenses" />;
