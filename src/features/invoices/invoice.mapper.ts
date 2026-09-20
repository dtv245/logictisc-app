import type { InvoiceResponse, InvoiceLineItemResponse } from "@/types/invoice.dto";
import type { Invoice, InvoiceLineItem } from "@/types/invoice.types";

export function mapInvoiceResponse(response: InvoiceResponse): Invoice {
  return {
    ...response,
    dueDate: response.dueDate ? new Date(response.dueDate) : null,
    sentAt: response.sentAt ? new Date(response.sentAt) : null,
    periodStart: response.periodStart ? new Date(response.periodStart) : null,
    periodEnd: response.periodEnd ? new Date(response.periodEnd) : null,
    approvedAt: response.approvedAt ? new Date(response.approvedAt) : null,
    billingPeriodStart: response.billingPeriodStart ? new Date(response.billingPeriodStart) : null,
    billingPeriodEnd: response.billingPeriodEnd ? new Date(response.billingPeriodEnd) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}

export function mapInvoiceLineItemResponse(response: InvoiceLineItemResponse): InvoiceLineItem {
  return { ...response };
}
