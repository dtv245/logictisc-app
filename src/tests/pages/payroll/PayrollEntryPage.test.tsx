/** Explicit payroll entry validates transport inputs, confirms calculation and preserves replay identity. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { PayrollEntryPage } from "@/pages/payroll/PayrollEntryPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll, payrollId } from "@/tests/fixtures/payroll";
import { settlementId } from "@/tests/fixtures/settlement";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const page = <Routes><Route path="/payroll" element={<PayrollEntryPage />} /><Route path="/payroll/reconciliation" element={<p>Opened reconciliation</p>} /><Route path="/payroll/:id" element={<p>Opened run</p>} /></Routes>;
const options = { initialEntries: ["/payroll"] };
async function fill() {
  fireEvent.change(screen.getByLabelText("Pay Period ID"), { target: { value: payroll.payPeriodId } });
  fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "EUR" } });
  const date = screen.getByLabelText("Effective Date"); fireEvent.change(date, { target: { value: "2026-10-01" } }); fireEvent.keyDown(date, { key: "Enter", code: "Enter" });
  fireEvent.change(screen.getByLabelText("Source Settlement IDs"), { target: { value: settlementId } });
  fireEvent.click(screen.getByRole("button", { name: "Calculate Payroll" })); return screen.findByRole("dialog");
}
describe("PayrollEntryPage", () => {
  it("opens a validated run ID without fetching a nonexistent collection", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(page, request, options); await screen.findByRole("heading", { name: "Payroll" });
    fireEvent.change(screen.getByLabelText("Payroll Run ID"), { target: { value: "bad-id" } }); fireEvent.click(screen.getByRole("button", { name: "View" })); expect(await screen.findByText("Enter a valid UUID.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Payroll Run ID"), { target: { value: payrollId } }); fireEvent.click(screen.getByRole("button", { name: "View" })); expect(await screen.findByText("Opened run")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("opens the confirmed reconciliation route without prefetching its cases", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(page, request, options);
    fireEvent.click(await screen.findByRole("button", { name: "Payment Reconciliation" }));
    expect(await screen.findByText("Opened reconciliation")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("confirms a typed calculation with date-only unchanged and navigates to the returned run", async () => {
    const request = vi.fn(async (x: CustomParams) => { expect(x.method).toBe("post"); return payroll; }); await renderFinance(page, request, options);
    await screen.findByRole("button", { name: "Calculate Payroll" }); const dialog = await fill(); expect(request).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await screen.findByText("Opened run")).toBeInTheDocument();
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: "/api/payroll/runs/calculate", payload: { idempotencyKey: expect.any(String), payPeriodId: payroll.payPeriodId, currency: "EUR", effectiveDate: "2026-10-01", settlementIds: [settlementId] } });
  });
  it("preserves request/idempotency key after an actionable conflict", async () => {
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "CURRENCY_MISMATCH", message: "Source mismatch", requestId: "calculate-request" })).mockResolvedValueOnce(payroll);
    await renderFinance(page, request, options); await screen.findByRole("button", { name: "Calculate Payroll" }); const dialog = await fill();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText("Source currency does not match this payroll.")).toBeInTheDocument(); expect(within(dialog).getByText(/calculate-request/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await screen.findByText("Opened run")).toBeInTheDocument(); expect(request.mock.calls[0]?.[0].payload).toEqual(request.mock.calls[1]?.[0].payload);
  });
  it("denies Driver without showing a calculation action or fetching data", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(page, request, { ...options, role: "DRIVER" }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("requires valid settlement UUIDs and explicit currency before confirmation", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(page, request, options); await screen.findByRole("button", { name: "Calculate Payroll" });
    fireEvent.change(screen.getByLabelText("Source Settlement IDs"), { target: { value: "not-an-id" } }); fireEvent.click(screen.getByRole("button", { name: "Calculate Payroll" }));
    expect(await screen.findByText("Enter settlement UUIDs separated by commas or spaces.")).toBeInTheDocument(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("blocks double submission while calculation is pending", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn(() => new Promise<unknown>((resolve) => { finish = resolve; }));
    await renderFinance(page, request, options); await screen.findByRole("button", { name: "Calculate Payroll" }); const dialog = await fill(); const confirm = within(dialog).getByRole("button", { name: "Confirm" }); fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled(); finish(payroll); expect(await screen.findByText("Opened run")).toBeInTheDocument();
  });
});
