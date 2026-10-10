/** Dedicated flat Payment commands; no lifecycle editor, physical delete or client audit fields. */
import Decimal from "decimal.js";
import type { CustomParams, DataProvider } from "@refinedev/core";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "@/types/handoff.generated";
import type { PaymentResponse } from "@/types/payment.dto";
import { createCommandIntent } from "@/providers/api/commandIntent";
import { toWireDecimal } from "@/providers/api/decimal";
import { ApiHttpError } from "@/providers/api/httpError";

export const PAYMENT_COMMANDS_RUNTIME_VERIFIED = false;
export const paymentApi = {
  collection: "/api/payments",
  detail: (id: string) => `/api/payments/${encodeURIComponent(id)}`,
  cancel: (id: string) => `/api/payments/${encodeURIComponent(id)}/cancel`,
};
export type PaymentCreateValues = Omit<CreatePaymentRequest, "amountAmount" | "idempotencyKey" | "status" | "recordedAt" | "stripePaymentMethodId" | "stripePaymentIntentId"> & { amountAmount: string | number };
const fields = ["invoiceId", "amountAmount", "amountCurrency", "description", "referenceNumber", "billingAddressLine1", "billingAddressLine2", "billingAddressCity", "billingAddressState", "billingAddressZipCode", "billingAddressCountry"] as const;
export function createPaymentPayload(values: PaymentCreateValues, key: string): CreatePaymentRequest {
  const amount = new Decimal(values.amountAmount);
  if (!amount.isFinite() || !amount.greaterThan(0) || amount.decimalPlaces() > 2 || amount.greaterThanOrEqualTo("10000000000000000")) throw new ApiHttpError({ statusCode: 400, code: "PAYMENT_AMOUNT_INVALID", message: "PAYMENT_AMOUNT_INVALID", requestId: null });
  if (!key.trim() || key.length > 200 || !values.invoiceId) throw new Error("PAYMENT_IDENTITY_REQUIRED");
  return { ...Object.fromEntries(fields.filter((field) => values[field] !== undefined).map((field) => [field, values[field]])),
    invoiceId: values.invoiceId, amountAmount: toWireDecimal(values.amountAmount), amountCurrency: values.amountCurrency, status: "PENDING", idempotencyKey: key,
    billingAddressLine1: values.billingAddressLine1, billingAddressCity: values.billingAddressCity,
    billingAddressState: values.billingAddressState, billingAddressZipCode: values.billingAddressZipCode, billingAddressCountry: values.billingAddressCountry };
}
export function paymentMetadata(values: UpdatePaymentRequest): UpdatePaymentRequest {
  return Object.fromEntries((["description", "referenceNumber"] as const).filter((field) => Object.hasOwn(values, field) && values[field] !== undefined).map((field) => [field, values[field]]));
}
export function createPaymentCommands(custom: NonNullable<DataProvider["custom"]>, key: string = globalThis.crypto.randomUUID()) {
  const send = async (options: CustomParams): Promise<PaymentResponse> => (await custom<PaymentResponse>({ ...options })).data;
  const create = createCommandIntent<CreatePaymentRequest, PaymentResponse>((payload) => send({ url: paymentApi.collection, method: "post", payload }));
  return {
    create: (values: PaymentCreateValues) => create.execute(createPaymentPayload(values, key)),
    retryCreate: create.retry,
    hasCreateIntent: create.hasIntent,
    isCreateResolved: create.isResolved,
    canReviseCreate: create.canRevise,
    reviseRejectedCreate: create.reviseRejected,
    update: (id: string, values: UpdatePaymentRequest) => send({ url: paymentApi.detail(id), method: "put", payload: paymentMetadata(values) }),
    cancel: (id: string, reason: string) => {
      if (!reason.trim() || reason.length > 1000) return Promise.reject(new Error("PAYMENT_CANCEL_REASON_REQUIRED"));
      return send({ url: paymentApi.cancel(id), method: "post", query: { reason: reason.trim() } });
    },
  };
}
