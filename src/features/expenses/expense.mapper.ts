import type { ExpenseResponse } from "@/types/expense.dto";
import type { Expense } from "@/types/expense.types";

export function mapExpenseResponse(response: ExpenseResponse): Expense {
  return {
    ...response,
    expenseDate: new Date(response.expenseDate),
    approvedAt: response.approvedAt ? new Date(response.approvedAt) : null,
    estimatedCompletionDate: response.estimatedCompletionDate ? new Date(response.estimatedCompletionDate) : null,
    actualCompletionDate: response.actualCompletionDate ? new Date(response.actualCompletionDate) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}
