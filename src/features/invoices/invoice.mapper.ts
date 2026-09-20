import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { InvoiceResponse, InvoiceLineItemResponse } from "@/types/invoice.dto";
import type { Invoice, InvoiceLineItem } from "@/types/invoice.types";

export function mapInvoiceResponse(response: InvoiceResponse): Invoice {
  return {
    ...response,
    dueDate: toDateOrNull(response.dueDate),
    sentAt: toDateOrNull(response.sentAt),
    periodStart: toDateOrNull(response.periodStart),
    periodEnd: toDateOrNull(response.periodEnd),
    approvedAt: toDateOrNull(response.approvedAt),
    billingPeriodStart: toDateOrNull(response.billingPeriodStart),
    billingPeriodEnd: toDateOrNull(response.billingPeriodEnd),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}

export function mapInvoiceLineItemResponse(response: InvoiceLineItemResponse): InvoiceLineItem {
  return { ...response };
}
