/** Payment state guards, single-flight, scoped invalidation and unknown dispatch outcomes. */
import { useCan, type CustomParams } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { canScheduleItem, usePayrollPaymentActions, type PayrollPaymentCommand } from "@/features/payroll/usePayrollPaymentActions";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll, payrollId, payment } from "@/tests/fixtures/payroll";
import { settlementId } from "@/tests/fixtures/settlement";
import { tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
import type { PayrollPayment } from "@/types/payroll.dto";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const locked = { ...payroll, status: "LOCKED" };
const schedule: PayrollPaymentCommand = { action: "schedule", itemId: payroll.items[0]!.id, payload: { idempotencyKey: "stable-payment-key", paymentMethod: "BANK_TRANSFER", providerKey: "configured-provider", destinationReference: "explicit-destination" } };
function Probe({ command = schedule, attempts = [] }: { command?: PayrollPaymentCommand; attempts?: PayrollPayment[] }) {
  const actions = usePayrollPaymentActions({ ...locked, status: command.action === "dispatch" ? "PAYMENT_SCHEDULED" : locked.status }, payroll.items[0], attempts);
  const permission = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  return <><button disabled={permission.isLoading} onClick={() => void actions.execute(command).catch(() => undefined)}>Execute</button><span>{actions.pending ? "pending" : "idle"}</span><span>{actions.error?.message}</span><span>{actions.canSchedule ? "schedule-allowed" : "schedule-denied"}</span></>;
}
describe("payroll payment actions", () => {
  it("reconciles bank evidence and invalidates only its tenant cases and related payment/run/settlements", async () => {
    const command: PayrollPaymentCommand = { action: "reconcile", paymentId: payment.id, payload: {
      idempotencyKey: "evidence-key", caseEventId: "88888888-8888-4888-8888-888888888888", bankSource: "bank",
      transactionReference: "transaction", amount: "811.21", currency: "EUR", outcome: "SUCCEEDED",
      counterpartyReference: "destination", evidenceReference: "statement", reason: "Verified", occurredAt: "2026-10-02T10:00:00Z",
    } };
    const request = vi.fn(async () => ({ eventId: "event", sourceKey: "source", status: "APPLIED", reason: null, payment: { ...payment, status: "SUCCEEDED" } }));
    const client = new QueryClient();
    const related = [["payroll", tenantKey, "run", payrollId], ["payroll", tenantKey, "payments", payment.payrollItemId], ["payroll", tenantKey, "reconciliation-cases", { page: 1 }], ["settlements", tenantKey, "list"], ["settlements", tenantKey, "detail", settlementId]];
    const unrelated = [["payroll", "another-tenant", "reconciliation-cases"], ["dashboard"], ["payroll", tenantKey, "payments", "another-item"]];
    client.setQueryData(related[0]!, { data: locked }); for (const key of [...related.slice(1), ...unrelated]) client.setQueryData(key, {});
    await renderFinance(<Probe command={command} />, request, { client }); await screen.findByText("schedule-allowed");
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    await waitFor(() => expect(client.getQueryState(related[2]!)?.isInvalidated).toBe(true));
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: "post", url: `/api/payroll/payments/${payment.id}/reconcile-bank`, payload: command.payload }));
    for (const key of related) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
  it.each(["SCHEDULED", "SUBMITTED", "PROCESSING", "RECONCILIATION_REQUIRED", "SUCCEEDED"])("blocks another attempt when %s exists", (status) => {
    expect(canScheduleItem(locked, payroll.items[0]!, [{ ...payment, status }])).toBe(false);
  });
  it("allows a failed payment retry only on a validated incomplete run and never zero-net transfers", () => {
    expect(canScheduleItem(locked, payroll.items[0]!, [payment])).toBe(true);
    expect(canScheduleItem({ ...locked, status: "COMPLETED" }, payroll.items[0]!, [payment])).toBe(false);
    expect(canScheduleItem(locked, { ...payroll.items[0]!, netAmount: 0 }, [])).toBe(false);
    expect(canScheduleItem(locked, { ...payroll.items[0]!, jurisdiction: null, taxAvailability: "UNAVAILABLE" }, [])).toBe(false);
  });
  it("prevents duplicate schedule and invalidates only related tenant run/items/settlements", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn<(x: CustomParams) => Promise<unknown>>(() => new Promise((resolve) => { finish = resolve; }));
    const client = new QueryClient(); const related = [["payroll", tenantKey, "run", payrollId], ["payroll", tenantKey, "payments", payment.payrollItemId], ["settlements", tenantKey, "list", {}], ["settlements", tenantKey, "detail", settlementId]];
    const unrelated = [["payroll", "another-tenant", "run", payrollId], ["payroll", tenantKey, "run", "another-run"], ["settlements", tenantKey, "detail", "another-settlement"], ["dashboard"]];
    client.setQueryData(related[0]!, { data: locked }); for (const key of [...related.slice(1), ...unrelated]) client.setQueryData(key, {});
    await renderFinance(<Probe />, request, { client }); await screen.findByText("schedule-allowed");
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); fireEvent.click(screen.getByRole("button", { name: "Execute" })); await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(screen.getByText("pending")).toBeInTheDocument();
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: `/api/payroll/items/${payment.payrollItemId}/payments`, method: "post", payload: schedule.payload }); finish({ ...payment, status: "SCHEDULED" });
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument()); for (const key of related) expect(client.getQueryState(key)?.isInvalidated).toBe(true); for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
  it("denies unauthorized direct scheduling", async () => {
    const request = vi.fn(async () => payment); await renderFinance(<Probe />, request, { role: "DRIVER" }); await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it.each(["SUCCEEDED", "FAILED", "PROCESSING"])("never dispatches a payment in %s", async (status) => {
    const request = vi.fn(async () => payment); await renderFinance(<Probe command={{ action: "dispatch", payment: { ...payment, paymentMethod: "BANK_TRANSFER", status } }} />, request);
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it("refreshes only run/item after a provider outcome becomes unknown", async () => {
    const request = vi.fn().mockRejectedValue(new ApiHttpError({ statusCode: 409, code: "PAYMENT_SUBMISSION_OUTCOME_UNKNOWN", message: "Outcome requires reconciliation", requestId: "dispatch-request" }));
    const { client } = await renderFinance(<Probe command={{ action: "dispatch", payment: { ...payment, paymentMethod: "BANK_TRANSFER", status: "SCHEDULED" } }} />, request); const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(await screen.findByText("Outcome requires reconciliation")).toBeInTheDocument();
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2)); expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["payroll", tenantKey, "payments", payment.payrollItemId] }));
  });
});
