import type { Money } from "./common.types";
import type { ISODateTime } from "./api.types";

export type ExpenseType = "general" | "truck" | "repair";
export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";
export type ExpenseCategory = "fuel" | "maintenance" | "repair" | "toll" | "parking" | "insurance" | "other";
export type QuantityUnit = "each" | "gallon" | "liter" | "mile" | "hour";

export interface ExpenseResponse {
  id: string;
  number: number;
  type: ExpenseType;
  status: ExpenseStatus;
  vendorName?: string | null;
  expenseDate: ISODateTime;
  receiptBlobPath?: string | null;
  notes?: string | null;
  approvedById?: string | null;
  approvedAt?: ISODateTime | null;
  rejectionReason?: string | null;
  amount: Money;
  truckId?: string | null;
  vendorAddress?: string | null;
  vendorPhone?: string | null;
  repairDescription?: string | null;
  estimatedCompletionDate?: ISODateTime | null;
  actualCompletionDate?: ISODateTime | null;
  category?: ExpenseCategory | null;
  truckExpenseTruckId?: string | null;
  truckExpenseCategory?: ExpenseCategory | null;
  odometerReading?: number | null;
  quantity?: number | null;
  quantityUnit?: QuantityUnit | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}
