import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { ExpenseResponse } from "@/types/expense.dto";
import type { Expense } from "@/types/expense.types";

export function mapExpenseResponse(response: ExpenseResponse): Expense {
  return {
    ...response,
    expenseDate: toDate(response.expenseDate),
    approvedAt: toDateOrNull(response.approvedAt),
    estimatedCompletionDate: toDateOrNull(response.estimatedCompletionDate),
    actualCompletionDate: toDateOrNull(response.actualCompletionDate),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}
