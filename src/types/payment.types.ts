import type { Invoice } from "./invoice.types";
import type { PaymentResponse } from "./payment.dto";
import type { ISODateTime } from "./api.types";

export type Payment = PaymentResponse;

export interface PaymentLink {
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

export interface PaymentWithRelations extends Payment {
  invoice?: Invoice | null;
}
