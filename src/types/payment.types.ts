import type { Address, Money } from "./common.types";
import type { Invoice } from "./invoice.types";
import type { PaymentStatus } from "./payment.dto";

export interface Payment {
  id: string;
  status: PaymentStatus;
  stripePaymentMethodId?: string | null;
  tenantId: string;
  description?: string | null;
  stripePaymentIntentId?: string | null;
  referenceNumber?: string | null;
  recordedByUserId?: string | null;
  recordedAt?: Date | null;
  invoiceId?: string | null;
  amount: Money;
  billingAddress: Address;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: string | null;
}

export interface PaymentLink {
  id: string;
  token: string;
  invoiceId: string;
  expiresAt: Date;
  isActive: boolean;
  createdByUserId: string;
  accessCount: number;
  lastAccessedAt?: Date | null;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: string | null;
}

export interface PaymentWithRelations extends Payment {
  invoice?: Invoice | null;
}
