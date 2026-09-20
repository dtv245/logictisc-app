import type { PaymentResponse, PaymentLinkResponse } from "@/types/payment.dto";
import type { Payment, PaymentLink } from "@/types/payment.types";

export function mapPaymentResponse(response: PaymentResponse): Payment {
  return {
    ...response,
    recordedAt: response.recordedAt ? new Date(response.recordedAt) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}

export function mapPaymentLinkResponse(response: PaymentLinkResponse): PaymentLink {
  return {
    ...response,
    expiresAt: new Date(response.expiresAt),
    lastAccessedAt: response.lastAccessedAt ? new Date(response.lastAccessedAt) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}
