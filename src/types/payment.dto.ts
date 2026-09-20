import type { Address, Money } from "./common.types";
import type { ISODateTime } from "./api.types";

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  stripePaymentMethodId?: string | null;
  tenantId: string;
  description?: string | null;
  stripePaymentIntentId?: string | null;
  referenceNumber?: string | null;
  recordedByUserId?: string | null;
  recordedAt?: ISODateTime | null;
  invoiceId?: string | null;
  amount: Money;
  billingAddress: Address;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
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
