/** Contract tests use the actual Axios client and Refine provider with mocked wire responses. */
import { readFileSync } from "node:fs";
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/providers/api/apiClient";
import { createLogisticsDataProvider } from "@/providers/dataProvider";
import { foundationApiResources } from "@/pages/resourceRegistry";
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { createCommandIntent } from "@/providers/api/commandIntent";
import { createPaymentCommands, createPaymentPayload, paymentMetadata, type PaymentCreateValues } from "@/features/payments/paymentCommands";
import { createMessagingCommands } from "@/features/messaging/messaging.api";
import { createInvoiceCommand, createPrimaryInvoice, createRatingAcceptance, freezeRatingAcceptance } from "@/features/invoices/billingCommands";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { ApiHttpError } from "@/providers/api/httpError";
import type { CurrentUser } from "@/types/auth.types";
import type { GenerateInvoiceRequest, RatingPreviewRequest } from "@/types/handoff.generated";
import { handoffExamples, handoffExampleProvenance } from "@/tests/fixtures/handoffExamples";

const envelope = (data: unknown, code = "OK", errors: unknown[] = []) => ({ success: code === "OK", code, message: code, data, errors, meta: { timestamp: "2026-10-07T00:00:00Z", path: "/api/example", requestId: "request-contract" } });
function wire(handler: (config: InternalAxiosRequestConfig) => unknown) {
  const adapter: AxiosAdapter = async (config) => ({ config, data: handler(config), status: 200, statusText: "OK", headers: new AxiosHeaders() });
  const client = createApiClient({ runtimeConfig: { apiBaseUrl: "http://localhost:8080", healthPath: "/api/health", requestTimeoutMs: 5000 }, tokenProvider: { getAccessToken: () => "fixture-bearer", refreshAccessToken: async () => null }, adapter });
  return { client, provider: createLogisticsDataProvider({ apiClient: client, resources: foundationApiResources }) };
}
const identity: CurrentUser = { id: "fixture-subject", openId: "fixture-subject", name: "Fixture", tenantId: "fixture-tenant", roles: ["ADMIN"], employeeId: "fixture-employee" };
const example = (name: string) => { const value = handoffExamples.find((row) => row.name === name); if (!value) throw new Error(name); return value; };
const paymentValues = () => example("Create Payment").body as PaymentCreateValues & { idempotencyKey: string };

describe("verified handoff requests on the frontend transport", () => {
  it.each(handoffExamples)("serializes $name with its declared body/query and response mode", async (sample) => {
    const observed: InternalAxiosRequestConfig[] = [];
    const raw = sample.path.startsWith("/api/payroll/");
    const { provider, client } = wire((config) => { observed.push(config); return raw ? { id: "wire-result", status: "VALIDATION_REQUIRED" } : envelope({ id: "wire-result", snapshotId: "wire-result", status: "PENDING" }); });
    const custom = provider.custom!;
    if (sample.name === "Lark callback") await client.instance.post(sample.path, sample.body, { logistics: { authentication: "none" } });
    else if (sample.name === "Create Load") await provider.create({ resource: "loads", variables: sample.body });
    else if (["Update Load", "Update Trip", "Update Truck"].includes(sample.name)) {
      const resource = sample.name.split(" ")[1]!.toLowerCase() + "s";
      const body = buildResourceMutation(resource, sample.body!, { version: sample.body!.expectedVersion });
      await provider.update({ resource, id: "record", variables: body });
    } else if (sample.name === "Create Payment") await createPaymentCommands(custom, String(sample.body!.idempotencyKey)).create(sample.body as PaymentCreateValues);
    else if (sample.name.includes("Payment metadata") || sample.name === "Clear Payment description") await createPaymentCommands(custom).update("record", sample.body!);
    else if (sample.name === "Cancel Payment") await createPaymentCommands(custom).cancel("record", String(sample.query!.reason));
    else if (sample.name === "Create private conversation") await createMessagingCommands(custom, identity).create({ isTenantChat: false, name: String(sample.body!.name), loadId: String(sample.body!.loadId) });
    else if (sample.name === "Send message") await createMessagingCommands(custom, identity).send(String(sample.body!.conversationId), String(sample.body!.content));
    else if (sample.name === "Generate primary invoice") await createPrimaryInvoice(custom, { snapshotId: String(sample.body!.snapshotId) }).execute(sample.body as GenerateInvoiceRequest);
    else if (sample.name === "Issue billing invoice") await createInvoiceCommand(custom, "record").execute({ action: "issue", payload: { idempotencyKey: String(sample.body!.idempotencyKey) } });
    else await custom({ url: sample.path.replaceAll("{id}", "record").replaceAll("{candidateId}", "candidate"), method: "post", ...(raw ? { meta: RAW_RESPONSE_META } : {}), payload: sample.body, query: sample.query });
    expect(observed).toHaveLength(1);
    const request = observed[0]!;
    expect(request.method).toBe(sample.method.toLowerCase());
    expect(request.headers.get("Authorization")).toBe(sample.name === "Lark callback" ? undefined : "Bearer fixture-bearer");
    expect(request.logistics?.responseMode ?? "envelope").toBe(raw ? "raw" : "envelope");
    expect(request.data === undefined ? undefined : JSON.parse(request.data)).toEqual(sample.body);
    if (sample.query) expect(request.params).toEqual(sample.query);
    expect(request.url).not.toContain("/api/api/");
  });

  it("keeps the example provenance and all 20 operations independently traceable", () => {
    expect(handoffExampleProvenance.scope).toBe("SCHEMA_EXAMPLES_ONLY_NOT_LIVE_COMMANDS");
    expect(handoffExamples).toHaveLength(20);
    const schemas = JSON.parse(readFileSync("docs/frontend-backend-handoff/docs/frontend/openapi-backend-remediation.json", "utf8"));
    for (const sample of handoffExamples) expect(schemas.paths[sample.path]?.[sample.method.toLowerCase()]).toBeDefined();
  });

  it("RAW Payroll/Payslip reads preserve arrays, nullable results and zero-based Spring Page", async () => {
    const page = { content: [], totalElements: 31, number: 1, size: 25 };
    const { provider } = wire((config) => config.url?.includes("reconciliation") ? page : [{ id: "payslip", snapshotJson: "{}" }]);
    const result = await provider.custom!({ url: "/api/payroll/reconciliation-cases", method: "get", meta: RAW_RESPONSE_META, query: { page: 1, size: 25 } });
    expect(result.data).toEqual(page);
    expect((await provider.custom!({ url: "/api/driver/me/payslips", method: "get", meta: RAW_RESPONSE_META })).data).toHaveLength(1);
    await expect(provider.custom!({ url: "/api/payroll/runs/run", method: "get" })).rejects.toMatchObject({ code: "INVALID_API_RESPONSE" });
  });

  it("RAW errors still preserve domain code, nested field paths and request ID", async () => {
    const { provider } = wire((config) => {
      const data = envelope(null, "CURRENCY_MISMATCH", [{ field: "taxDecision.reason", code: "NotBlank", message: "required" }]);
      throw new AxiosError("domain", "ERR_BAD_REQUEST", config, undefined, { config, data, status: 422, statusText: "422", headers: new AxiosHeaders() });
    });
    await expect(provider.custom!({ url: "/api/payroll/runs/calculate", method: "post", meta: RAW_RESPONSE_META, payload: {} })).rejects.toMatchObject({ statusCode: 422, code: "CURRENCY_MISMATCH", requestId: "request-contract", errors: { "taxDecision.reason": ["required"] } });
  });

  it("blocks generic payment writes and deprecated invoice employee filters", async () => {
    const request = vi.fn(() => envelope({ id: "payment" })); const { provider } = wire(request);
    await expect(provider.create({ resource: "payments", variables: paymentValues() })).rejects.toThrow("COMMAND_RESOURCE");
    await expect(provider.update({ resource: "payments", id: "payment", variables: { status: "SUCCEEDED" } })).rejects.toThrow("COMMAND_RESOURCE");
    await expect(provider.deleteOne({ resource: "payments", id: "payment" })).rejects.toThrow("COMMAND_RESOURCE");
    await expect(provider.getList({ resource: "invoices", filters: [{ field: "employeeId", operator: "eq", value: "employee" }] })).rejects.toThrow("FILTER_FIELD_NOT_ALLOWED");
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps pending metadata omission distinct from explicit null and rejects silent amount rounding", () => {
    expect(paymentMetadata({ description: null })).toEqual({ description: null });
    expect(paymentMetadata({ referenceNumber: "REF" })).toEqual({ referenceNumber: "REF" });
    expect(() => createPaymentPayload({ ...paymentValues(), amountAmount: 1.001 }, "key")).toThrow("PAYMENT_AMOUNT_INVALID");
    expect(createPaymentPayload({ ...paymentValues(), recordedAt: "spoof" } as PaymentCreateValues, "key")).not.toHaveProperty("recordedAt");
  });

  it("freezes Payment body/key across double submit and timeout, preserving edited intent for later", async () => {
    const attempts: unknown[] = []; let fail = true;
    const { provider } = wire((config) => { attempts.push(config.data); if (fail) throw new AxiosError("timeout", "ECONNABORTED", config); return envelope({ id: "same-payment", status: "PENDING" }); });
    const commands = createPaymentCommands(provider.custom!, "stable-key"); const values = paymentValues();
    const first = commands.create(values); const double = commands.create(values);
    await expect(first).rejects.toMatchObject({ statusCode: 0 }); await expect(double).rejects.toMatchObject({ statusCode: 0 });
    expect(attempts).toHaveLength(1);
    await expect(commands.create({ ...values, description: "changed" })).rejects.toMatchObject({ code: "COMMAND_INTENT_FROZEN" });
    fail = false; await expect(commands.retryCreate()).resolves.toMatchObject({ id: "same-payment" });
    expect(attempts[1]).toBe(attempts[0]);
  });

  it("acceptance freezes the preview request and server hashes; billing requires the accepted identity and explicit tax", async () => {
    const request = example("Rating preview").body as RatingPreviewRequest;
    const payload = freezeRatingAcceptance(request, { inputHash: "server-input", resultHash: "server-result" }, "key");
    request.accessorialIds.push("later-edit"); expect(payload.rating.accessorialIds).toEqual([]);
    const { provider } = wire(() => envelope({ snapshotId: "accepted", invoiceId: "billing", status: "DRAFT" }));
    const accepted = await createRatingAcceptance(provider.custom!, "load").execute(payload); expect(accepted.snapshotId).toBe("accepted");
    const generation = example("Generate primary invoice").body as GenerateInvoiceRequest;
    await expect(createPrimaryInvoice(provider.custom!, accepted).execute(generation)).rejects.toThrow("INVOICE_TAX_DECISION_REQUIRED");
    await expect(createPrimaryInvoice(provider.custom!, accepted).execute({ ...generation, snapshotId: "accepted", taxDecision: { ...generation.taxDecision, requirement: "REQUIRED" } })).rejects.toThrow("INVOICE_TAX_ASSESSMENT_REQUIRED");
    await expect(createPrimaryInvoice(provider.custom!, accepted).execute({ ...generation, snapshotId: "accepted", idempotencyKey: "x".repeat(121) })).rejects.toThrow("INVOICE_IDEMPOTENCY_KEY_INVALID");
  });

  it("does not discard unresolved or idempotency-conflicting financial commands", async () => {
    const send = vi.fn(async () => { throw new ApiHttpError({ statusCode: 409, code: "PAYMENT_IDEMPOTENCY_CONFLICT", message: "conflict", requestId: null }); });
    const intent = createCommandIntent(send); await expect(intent.execute({ key: "original" })).rejects.toThrow("conflict");
    expect(() => intent.reset()).toThrow("UNRESOLVED"); expect(intent.canRevise()).toBe(false);
  });
});
