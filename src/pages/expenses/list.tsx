/** Hiển thị danh sách chi phí bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Expense } from "../../types/finance";
import { expenseColumns } from "./columns";
export const ExpenseList = () => <ResourceListPage<Expense> columns={expenseColumns} resource="expenses" />;
