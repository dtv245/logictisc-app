/** Self-service own-data requests, employee/tenant keys and distinct async states. */
import { fireEvent, screen } from "@testing-library/react";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { MyPayslipsPage } from "@/pages/payslips/MyPayslipsPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payslip, payslipSnapshot } from "@/tests/fixtures/payslip";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { employeeId: "own-employee" } }) }));
describe("MyPayslipsPage", () => {
  it("requests own payslips only and never implies that issued means paid", async () => {
    const request = vi.fn(async (x: CustomParams) => { expect(x.url).toBe("/api/driver/me/payslips"); return [payslip]; });
    const { client } = await renderFinance(<MyPayslipsPage />, request, { role: "DRIVER" }); expect(await screen.findByText(/811.21/)).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument(); expect(screen.queryByText("Paid")).not.toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["payslips", "tenant-finance", "mine", "own-employee"])).toEqual({ data: [payslip] });
  });
  it("does not substitute zero for unavailable tax/net or invalid snapshots", async () => {
    await renderFinance(<MyPayslipsPage />, async () => [{ ...payslip, snapshotJson: JSON.stringify({ ...payslipSnapshot, calculation: { ...payslipSnapshot.calculation, availability: "UNAVAILABLE", netAmount: 0 } }) }, { ...payslip, id: "invalid-row", snapshotJson: "{}" }], { role: "DRIVER" });
    await screen.findByRole("heading", { name: "My Payslips" }); expect(screen.queryByText(/811.21|EUR\s*0.00/)).not.toBeInTheDocument();
  });
  it("denies unknown authorities before fetching financial data", async () => {
    const request = vi.fn(async () => [payslip]); await renderFinance(<MyPayslipsPage />, request, { role: "UNKNOWN" }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("separates loading, empty and retryable read errors", async () => {
    const loading = await renderFinance(<MyPayslipsPage />, () => new Promise(() => undefined), { role: "DRIVER" }); expect(document.querySelector(".ant-spin")).not.toBeNull(); loading.unmount();
    const empty = await renderFinance(<MyPayslipsPage />, async () => [], { role: "DRIVER" }); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); empty.unmount();
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Payslips unavailable", requestId: "own-error" })).mockResolvedValueOnce([payslip]); await renderFinance(<MyPayslipsPage />, request, { role: "DRIVER" }); expect(await screen.findByText("Payslips unavailable")).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(await screen.findByText(/811.21/)).toBeInTheDocument();
  });
});
