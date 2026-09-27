import type { Address, Money } from "./common.types";
import type { Invoice } from "./invoice.types";
import type { PaymentStatus } from "./payment.dto";

export interface Payment {
  id: string;
  status: PaymentStatus;
  invoiceId?: string | null;
  invoiceNumber?: number | null;
  amountAmount?: number | null;
  amountCurrency?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  recordedAt?: string | Date | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingAddressCity?: string | null;
  billingAddressState?: string | null;
  billingAddressZipCode?: string | null;
  billingAddressCountry?: string | null;
  stripePaymentMethodId?: string | null;
  tenantId?: string;
  stripePaymentIntentId?: string | null;
  recordedByUserId?: string | null;
  amount?: Money;
  billingAddress?: Address;
  createdAt?: string | Date;
  createdBy?: string | null;
  lastModifiedAt?: string | Date | null;
  lastModifiedBy?: string | null;
}

export interface PaymentLink {
  id: string;
  token: string;
  invoiceId: string;
  expiresAt: string | Date;
  isActive: boolean;
  createdByUserId: string;
  accessCount: number;
  lastAccessedAt?: string | Date | null;
  createdAt?: string | Date;
  createdBy?: string | null;
  lastModifiedAt?: string | Date | null;
  lastModifiedBy?: string | null;
}

export interface PaymentWithRelations extends Payment {
  invoice?: Invoice | null;
}
