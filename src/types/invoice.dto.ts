import type { Money } from "./common.types";
import type { ISODateTime } from "./api.types";

export type InvoiceType = "customer" | "payroll" | "subscription" | "credit_note";
/**
 * Backend **không** có enum cho trạng thái hoà đơn — `Invoice.status` là cột `text` tự do
 * (`finance/invoice/Invoice.java:59-60`). Vocabulary dưới đây lấy từ hai chỗ có thẩm quyền:
 * `InvoiceDispatchStatus` (chỉ định nghĩa `draft`/`issued` cho bước dispatch) và
 * `docs/docs/business/slice-002-dispatch-invoice.md:48` + `InvoiceDispatchTransitionTest`
 * (liệt kê `issued`, `partially_paid`, `paid`, `cancelled`).
 *
 * Vì backend so khớp không phân biệt hoa/thường (`InvoiceDispatchStatus.matches`), dữ liệu
 * cũ có thể đang là `Draft`/`Issued`/`Paid` viết hoa — xem `BE-012`.
 */
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
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
