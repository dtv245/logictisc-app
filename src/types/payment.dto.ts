import type { ISODateTime } from "./api.types";

export type PaymentStatus = string;

/** Flat PaymentView projection from the verified handoff; UI presentation does not add wire fields. */
export interface PaymentResponse {
  amountAmount: number;
  amountCurrency: string;
  billingAddressCity?: string | null;
  billingAddressCountry?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingAddressState?: string | null;
  billingAddressZipCode?: string | null;
  description?: string | null;
  id: string;
  invoiceId: string;
  invoiceNumber?: number | null;
  recordedAt?: string | null;
  referenceNumber?: string | null;
  status: string;
}

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

export type { CreatePaymentRequest, UpdatePaymentRequest } from "./handoff.generated";
