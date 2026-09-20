import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { PaymentResponse, PaymentLinkResponse } from "@/types/payment.dto";
import type { Payment, PaymentLink } from "@/types/payment.types";

export function mapPaymentResponse(response: PaymentResponse): Payment {
  return {
    ...response,
    recordedAt: toDateOrNull(response.recordedAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}

export function mapPaymentLinkResponse(response: PaymentLinkResponse): PaymentLink {
  return {
    ...response,
    expiresAt: toDate(response.expiresAt),
    lastAccessedAt: toDateOrNull(response.lastAccessedAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}
