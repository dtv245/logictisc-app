import type { Invoice } from "@/types/invoice.types";
import type { PaymentResponse } from "@/types/payment.dto";
import type { ISODateTime } from "@/types/api.types";

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
