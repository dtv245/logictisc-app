import type { ISODateTime } from "./api.types";

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (`PaymentResponse.java`).
 * Tuyệt đối tôn trọng cấu trúc JSON của Backend ở file này:
 * - amountAmount và amountCurrency là trường phẳng.
 * - billingAddress là các trường phẳng (billingAddressLine1..billingAddressCountry).
 * - Có invoiceNumber.
 * - Backend không trả audit fields hoặc tenantId.
 */
export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  invoiceId?: string | null;
  invoiceNumber?: number | null;
  amountAmount: number;
  amountCurrency: string;
  description?: string | null;
  referenceNumber?: string | null;
  recordedAt?: ISODateTime | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingAddressCity?: string | null;
  billingAddressState?: string | null;
  billingAddressZipCode?: string | null;
  billingAddressCountry?: string | null;
}

/**
 * Payload gửi lên API để tạo mới Payment (`CreatePaymentRequest.java`).
 */
export interface CreatePaymentRequest {
  status: PaymentStatus | string;
  invoiceId?: string | null;
  amountAmount: number;
  amountCurrency: string;
  description?: string | null;
  referenceNumber?: string | null;
  stripePaymentMethodId?: string | null;
  stripePaymentIntentId?: string | null;
  recordedAt?: ISODateTime | null;
  billingAddressLine1: string;
  billingAddressLine2?: string | null;
  billingAddressCity: string;
  billingAddressState: string;
  billingAddressZipCode: string;
  billingAddressCountry: string;
}

/**
 * Payload gửi lên API để cập nhật Payment (`PUT /api/payments/{id}`).
 */
export type UpdatePaymentRequest = Partial<CreatePaymentRequest>;

export interface PaymentLinkResponse {
  id: string;
  token: string;
  invoiceId: string;
  expiresAt: ISODateTime;
  isActive: boolean;
  createdByUserId: string;
  accessCount: number;
  lastAccessedAt?: ISODateTime | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}
