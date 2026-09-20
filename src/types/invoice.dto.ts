import type { Money } from "./common.types";
import type { ISODateTime } from "./api.types";

export type InvoiceType = "customer" | "payroll" | "subscription" | "credit_note";
export type InvoiceStatus = "draft" | "pending_approval" | "approved" | "sent" | "paid" | "overdue" | "void";
export type TaxBehavior = "exclusive" | "inclusive";
export type InvoiceLineItemType = "freight" | "fuel_surcharge" | "detention" | "accessorial" | "tax" | "adjustment";

export interface InvoiceResponse {
  id: string;
  number: number;
  type: InvoiceType;
  status: InvoiceStatus;
  taxBehavior: TaxBehavior;
  taxBreakdownJson?: unknown | null;
  notes?: string | null;
  dueDate?: ISODateTime | null;
  stripeInvoiceId?: string | null;
  sentAt?: ISODateTime | null;
  sentToEmail?: string | null;
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  loadId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  periodStart?: ISODateTime | null;
  periodEnd?: ISODateTime | null;
  totalDistanceDriven?: number | null;
  totalHoursWorked?: number | null;
  approvedById?: string | null;
  approvedAt?: ISODateTime | null;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
  subscriptionId?: string | null;
  billingPeriodStart?: ISODateTime | null;
  billingPeriodEnd?: ISODateTime | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface InvoiceLineItemResponse {
  id: string;
  invoiceId: string;
  description: string;
  type: InvoiceLineItemType;
  quantity: number;
  order: number;
  notes?: string | null;
  taxRatePercent: number;
  taxAmount: number;
  taxCode?: string | null;
  amount: Money;
}
