import type { Money } from "./common.types";
import type { Truck } from "./truck.types";
import type { ExpenseType, ExpenseStatus, ExpenseCategory, QuantityUnit } from "./expense.dto";
import type { ISODateTime, ISODate } from "./api.types";

export interface Expense {
  id: string;
  number: number;
  type: ExpenseType;
  status: ExpenseStatus;
  vendorName?: string | null;
  expenseDate: ISODateTime | ISODate;
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
  estimatedCompletionDate?: ISODateTime | ISODate | null;
  actualCompletionDate?: ISODateTime | ISODate | null;
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

export interface ExpenseWithRelations extends Expense {
  truck?: Truck | null;
  truckExpenseTruck?: Truck | null;
}
