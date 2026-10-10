/** Immutable rating acceptance and billing commands consume server hashes/snapshots and explicit tax evidence. */
import type { DataProvider } from "@refinedev/core";
import type { AcceptedRatingSnapshot, BillingInvoice, Credit, GenerateInvoiceRequest, Issue, RatingAcceptRequest, RatingPreviewRequest, Rebill, Regenerate, Supplemental } from "@/types/handoff.generated";
import { createCommandIntent } from "@/providers/api/commandIntent";

export const BILLING_COMMANDS_RUNTIME_VERIFIED = false;
export const billingApi = {
  accept: (loadId: string) => `/api/loads/${encodeURIComponent(loadId)}/rating/accept`,
  snapshot: (id: string) => `/api/rating/snapshots/${encodeURIComponent(id)}`,
  primary: "/api/invoices/billing/primary",
  detail: (id: string) => `/api/invoices/billing/${encodeURIComponent(id)}`,
  command: (id: string, action: "issue" | "regenerate" | "supplemental" | "credit" | "rebill") => `/api/invoices/billing/${encodeURIComponent(id)}/${action}`,
};
const requireKey = (key: string) => { if (!key.trim() || key.length > 120) throw new Error("INVOICE_IDEMPOTENCY_KEY_INVALID"); };
export function freezeRatingAcceptance(request: RatingPreviewRequest, preview: { inputHash: string; resultHash: string }, key: string): RatingAcceptRequest {
  if (!key.trim() || !preview.inputHash || !preview.resultHash) throw new Error("RATING_ACCEPT_EVIDENCE_REQUIRED");
  return JSON.parse(JSON.stringify({ idempotencyKey: key, rating: request, expectedInputHash: preview.inputHash, expectedResultHash: preview.resultHash })) as RatingAcceptRequest;
}
export function createRatingAcceptance(custom: NonNullable<DataProvider["custom"]>, loadId: string) {
  return createCommandIntent<RatingAcceptRequest, AcceptedRatingSnapshot>(async (payload) => (await custom<AcceptedRatingSnapshot>({ url: billingApi.accept(loadId), method: "post", payload })).data);
}
export function createPrimaryInvoice(custom: NonNullable<DataProvider["custom"]>, accepted: AcceptedRatingSnapshot) {
  return createCommandIntent<GenerateInvoiceRequest, BillingInvoice>(async (payload) => {
    requireKey(payload.idempotencyKey);
    if (!accepted.snapshotId || payload.snapshotId !== accepted.snapshotId || !payload.taxDecision?.requirement || !payload.taxDecision.reasonCode?.trim() || !payload.taxDecision.reason?.trim() || !payload.taxDecision.sourceReference?.trim()) throw new Error("INVOICE_TAX_DECISION_REQUIRED");
    if (payload.taxDecision.requirement === "REQUIRED" && !payload.taxDecision.assessmentId) throw new Error("INVOICE_TAX_ASSESSMENT_REQUIRED");
    if (!["REQUIRED", "NOT_REQUIRED"].includes(payload.taxDecision.requirement)) throw new Error("INVOICE_TAX_DECISION_INVALID");
    return (await custom<BillingInvoice>({ url: billingApi.primary, method: "post", payload })).data;
  });
}
export type BillingCommand = { action: "issue"; payload: Issue } | { action: "regenerate"; payload: Regenerate } |
  { action: "supplemental"; payload: Supplemental } | { action: "credit"; payload: Credit } | { action: "rebill"; payload: Rebill };
export function createInvoiceCommand(custom: NonNullable<DataProvider["custom"]>, invoiceId: string) {
  return createCommandIntent<BillingCommand, BillingInvoice>(async ({ action, payload }) => {
    requireKey("idempotencyKey" in payload ? payload.idempotencyKey : payload.generation.idempotencyKey);
    return (await custom<BillingInvoice>({ url: billingApi.command(invoiceId, action), method: "post", payload })).data;
  });
}
