/** Real Refine payroll reads and lazy payment evidence with immutable server amounts. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { PayrollRunShow } from "@/pages/payroll/PayrollRunShow";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll, payrollId, payment } from "@/tests/fixtures/payroll";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const page = <Routes><Route path="/payroll/:id" element={<PayrollRunShow />} /></Routes>;
const options = { initialEntries: [`/payroll/${payrollId}`] };
describe("PayrollRunShow", () => {
  it("preserves backend net, country without subdivision, and fetches payments only on tab open", async () => {
    const request = vi.fn(async (x: CustomParams) => x.url.endsWith("payments") ? [payment] : payroll);
    await renderFinance(page, request, options);
    expect(await screen.findByTestId(`${payroll.items[0]!.id}-netAmount`)).toHaveTextContent("811.21"); expect(request).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "Validation" })); expect(await screen.findByText("SG")).toBeInTheDocument(); expect(screen.getByText("Region / Subdivision")).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "Payments" })); expect(await screen.findByText("Bank declined")).toBeInTheDocument();
    expect(screen.getByText("••••6789")).toBeInTheDocument(); expect(screen.queryByText(payment.providerReference!)).not.toBeInTheDocument();
    expect(request.mock.calls[1]?.[0].url).toBe(`/api/payroll/items/${payroll.items[0]!.id}/payments`);
  });
  it("shows jurisdiction blocker and unavailable tax/net without approve or lock", async () => {
    await renderFinance(page, async () => ({ ...payroll, status: "VALIDATION_REQUIRED", validationReason: "PAYROLL_JURISDICTION_NOT_CONFIGURED", items: [{ ...payroll.items[0]!, jurisdiction: null, taxAvailability: "UNAVAILABLE", incomeTaxAmount: 0, insuranceAmount: null, netAmount: null, validationReason: "PAYROLL_JURISDICTION_NOT_CONFIGURED" }] }), options);
    expect(await screen.findByText("Payroll jurisdiction is not configured.")).toBeInTheDocument(); expect(screen.getByTestId(`${payroll.items[0]!.id}-incomeTaxAmount`)).toHaveTextContent("—");
    expect(screen.queryByRole("button", { name: "Approve Payroll" })).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Lock Payroll" })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Recalculate Payroll" })).toBeInTheDocument();
  });
  it.each(["LOCKED", "COMPLETED"])("keeps %s read-only without translating lock as paid", async (status) => {
    await renderFinance(page, async () => ({ ...payroll, status }), options); await screen.findByRole("heading", { name: payroll.runNumber });
    expect(screen.queryByRole("button", { name: "Recalculate Payroll" })).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Lock Payroll" })).not.toBeInTheDocument(); expect(screen.queryByRole("status", { name: "Paid" })).not.toBeInTheDocument();
  });
  it("requires confirmation and keeps pending action single-flight", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn(async (x: CustomParams) => x.method === "post" ? new Promise((resolve) => { finish = resolve; }) : { ...payroll, status: "APPROVED" });
    await renderFinance(page, request, options); fireEvent.click(await screen.findByRole("button", { name: "Lock Payroll" }));
    expect(request.mock.calls.some(([x]) => x.method === "post")).toBe(false); const dialog = await screen.findByRole("dialog"); const button = within(dialog).getByRole("button", { name: "Confirm" });
    fireEvent.click(button); fireEvent.click(button); await waitFor(() => expect(request.mock.calls.filter(([x]) => x.method === "post")).toHaveLength(1));
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled(); finish({ ...payroll, status: "LOCKED" }); await waitFor(() => expect(request.mock.calls.filter(([x]) => x.method === "get")).toHaveLength(2));
  });
  it("denies an unauthorized screen without fetching run data", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(page, request, { ...options, role: "DRIVER" }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("distinguishes error and empty from loading and supports retry", async () => {
    const loading = await renderFinance(page, () => new Promise(() => undefined), options); expect(document.querySelector(".ant-spin")).not.toBeNull(); loading.unmount();
    const empty = await renderFinance(page, async () => null, options); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); empty.unmount();
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Run unavailable", requestId: "run-error" })).mockResolvedValueOnce(payroll);
    await renderFinance(page, request, options); expect(await screen.findByText(/Run unavailable/)).toHaveTextContent("run-error"); fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(await screen.findByRole("heading", { name: payroll.runNumber })).toBeInTheDocument();
  });
});
