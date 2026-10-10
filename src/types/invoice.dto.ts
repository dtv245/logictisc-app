import type { Money } from "./common.types";

export type InvoiceType = string;
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
export type InvoiceStatus = string;
export type TaxBehavior = string;
export type InvoiceLineItemType = string;

/** Flat InvoiceView projection from the verified handoff; UI presentation does not add wire fields. */
export interface InvoiceResponse {
  billingChainId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  dueDate?: string | null;
  economicSign?: number | null;
  employeeId?: string | null;
  employeeName?: string | null;
  id: string;
  invoicePurpose?: string | null;
  loadId?: string | null;
  notes?: string | null;
  number: number;
  parentInvoiceId?: string | null;
  periodEnd?: string | null;
  periodStart?: string | null;
  ratingSnapshotId?: string | null;
  sentAt?: string | null;
  sentToEmail?: string | null;
  status: string;
  subtotalAmount?: number | null;
  subtotalCurrency?: string | null;
  taxBehavior?: string | null;
  taxTotalAmount?: number | null;
  taxTotalCurrency?: string | null;
  totalAmount?: number | null;
  totalCurrency?: string | null;
  totalDistanceDriven?: number | null;
  type: string;
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
