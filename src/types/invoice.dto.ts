import type { ISODateTime } from "./api.types";

export type InvoiceType = "customer" | "payroll" | "subscription" | "credit_note";
/**
 * Backend không có enum cứng cho trạng thái hoá đơn — `Invoice.status` là text.
 * Hợp đồng vocabulary được kiểm soát bởi các trạng thái dưới đây.
 */
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
export type TaxBehavior = "exclusive" | "inclusive";
export type InvoiceLineItemType = "freight" | "fuel_surcharge" | "detention" | "accessorial" | "tax" | "adjustment";

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (`InvoiceResponse.java`).
 * Tuyệt đối tôn trọng cấu trúc JSON của Backend ở file này:
 * - Số tiền trả theo cặp (amount, currency): subtotalAmount, subtotalCurrency, etc.
 * - Loại bỏ các trường ảo không có trên backend.
 */
export interface InvoiceResponse {
  id: string;
  number: number;
  type: InvoiceType;
  status: InvoiceStatus;
  taxBehavior?: TaxBehavior | string | null;
  notes?: string | null;
  dueDate?: ISODateTime | null;
  loadId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  subtotalAmount: number;
  subtotalCurrency: string;
  taxTotalAmount: number;
  taxTotalCurrency: string;
  totalAmount: number;
  totalCurrency: string;
  sentAt?: ISODateTime | null;
  sentToEmail?: string | null;
  periodStart?: ISODateTime | null;
  periodEnd?: ISODateTime | null;
  totalDistanceDriven?: number | null;
}

/**
 * Payload gửi lên API để tạo mới Invoice (`CreateInvoiceRequest.java`).
 */
export interface CreateInvoiceRequest {
  type: InvoiceType | string;
  status: InvoiceStatus | string;
  taxBehavior?: TaxBehavior | string | null;
  notes?: string | null;
  dueDate?: ISODateTime | null;
  loadId?: string | null;
  customerId?: string | null;
  employeeId?: string | null;
  subtotalAmount: number;
  subtotalCurrency: string;
  taxTotalAmount: number;
  taxTotalCurrency: string;
  totalAmount: number;
  totalCurrency: string;
  periodStart?: ISODateTime | null;
  periodEnd?: ISODateTime | null;
  totalDistanceDriven?: number | null;
}

/**
 * Payload gửi lên API để cập nhật Invoice (`PUT /api/invoices/{id}`).
 */
export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

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
  amountAmount: number;
  amountCurrency: string;
}
