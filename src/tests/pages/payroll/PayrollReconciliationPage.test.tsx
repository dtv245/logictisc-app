/** Real server pagination, authorization and attested reconciliation confirmations. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { PayrollReconciliationPage } from "@/pages/payroll/PayrollReconciliationPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payment } from "@/tests/fixtures/payroll";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const evidenceCase = { caseEventId: "88888888-8888-4888-8888-888888888888", paymentId: payment.id, paymentStatus: "PROCESSING", sourceKey: "case-source", providerKey: "configured-bank", outcome: "SUCCEEDED", amount: "811.21", currency: "EUR", providerReference: "sensitive-bank-ref-987654321", occurredAt: "2026-10-02T10:00:00Z", reason: "Verify bank evidence" };
const cases = { content: [evidenceCase], totalElements: 52, number: 0, size: 25 };
describe("PayrollReconciliationPage", () => {
  it("requests server pages and masks provider references", async () => {
    const request = vi.fn(async (x: CustomParams) => ({ ...cases, number: typeof x.query === "object" && x.query !== null && "page" in x.query ? x.query.page : 0 })); await renderFinance(<PayrollReconciliationPage />, request);
    expect(await screen.findByText("Verify bank evidence")).toBeInTheDocument(); expect(screen.getByText("••••4321")).toBeInTheDocument(); expect(screen.queryByText(evidenceCase.providerReference)).not.toBeInTheDocument();
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: "/api/payroll/reconciliation-cases", method: "get", query: { page: 0, size: 25 } });
    fireEvent.click(screen.getByTitle("Next Page")); await waitFor(() => expect(request).toHaveBeenCalledTimes(2)); expect(request.mock.calls[1]?.[0].query).toEqual({ page: 1, size: 25 });
  });
  it("requires evidence, confirms reconciliation, preserves failed request and prevents double submit", async () => {
    const posts: CustomParams[] = []; let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn(async (x: CustomParams) => { if (x.method === "get") return cases; posts.push(x); if (posts.length === 1) throw new ApiHttpError({ statusCode: 409, code: "BANK_COUNTERPARTY_MISMATCH", message: "Verify destination", requestId: "case-conflict" }); return new Promise((resolve) => { finish = resolve; }); });
    await renderFinance(<PayrollReconciliationPage />, request); fireEvent.click(await screen.findByRole("button", { name: "Reconcile Bank Evidence" })); const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findAllByText(/Please enter|Please select/)).not.toHaveLength(0); expect(posts).toHaveLength(0);
    for (const [label, value] of [["Bank Source", "verified-bank"], ["Transaction Reference", "unique-bank-transaction"], ["Counterparty Reference", "explicit-destination"], ["Evidence Reference", "bank-statement-101"], ["Reason", "Verified statement"], ["Amount", "811.21"], ["Currency", "EUR"]]) fireEvent.change(within(dialog).getByLabelText(label!), { target: { value } });
    fireEvent.mouseDown(within(dialog).getByLabelText("Bank Outcome")); fireEvent.click(await screen.findByText("Succeeded", { selector: ".ant-select-item-option-content" }));
    const time = within(dialog).getByLabelText("Transaction Time"); fireEvent.change(time, { target: { value: "2026-10-02 10:00:00" } }); fireEvent.keyDown(time, { key: "Enter", code: "Enter" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText("The bank counterparty does not match the scheduled destination.")).toBeInTheDocument();
    expect(within(dialog).getByText(/case-conflict/)).toBeInTheDocument(); const confirm = within(dialog).getByRole("button", { name: "Confirm" }); fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(posts).toHaveLength(2)); expect(posts[0]?.payload).toEqual(posts[1]?.payload); expect(posts[0]).toMatchObject({ method: "post", url: `/api/payroll/payments/${payment.id}/reconcile-bank`, payload: {
      idempotencyKey: expect.any(String), caseEventId: evidenceCase.caseEventId, bankSource: "verified-bank", transactionReference: "unique-bank-transaction", amount: "811.21", currency: "EUR", outcome: "SUCCEEDED", counterpartyReference: "explicit-destination", evidenceReference: "bank-statement-101", reason: "Verified statement", occurredAt: expect.any(String),
    } }); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled(); finish({ eventId: "bank-event", sourceKey: "applied-evidence", status: "APPLIED", reason: null, payment: { ...payment, status: "SUCCEEDED" } }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("denies non-finance authorities before any API request", async () => {
    const request = vi.fn(async () => cases); await renderFinance(<PayrollReconciliationPage />, request, { role: "DISPATCHER" }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("renders loading, empty and retryable request error distinctly", async () => {
    const loading = await renderFinance(<PayrollReconciliationPage />, () => new Promise(() => undefined)); await screen.findByRole("heading", { name: "Payment Reconciliation" }); expect(screen.queryByText("No data", { selector: "strong" })).not.toBeInTheDocument(); loading.unmount();
    const empty = await renderFinance(<PayrollReconciliationPage />, async () => ({ ...cases, content: [], totalElements: 0 })); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); empty.unmount();
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Cases unavailable", requestId: "cases-request" })).mockResolvedValueOnce(cases);
    await renderFinance(<PayrollReconciliationPage />, request); expect(await screen.findByText("Cases unavailable")).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(await screen.findByText("Verify bank evidence")).toBeInTheDocument();
  });
});
