/** Payment scheduling confirms explicit provider details and preserves retry identity/amount authority. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { PayrollPaymentsPanel } from "@/features/payroll/PayrollPaymentsPanel";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll, payment } from "@/tests/fixtures/payroll";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const run = { ...payroll, status: "LOCKED" };
describe("payment scheduling", () => {
  it("confirms the backend net amount and keeps a failed retry key stable", async () => {
    let scheduled = false; const payloads: unknown[] = [];
    const request = vi.fn(async (x: CustomParams) => {
      if (x.method === "get") return scheduled ? [{ ...payment, status: "SCHEDULED" }] : [payment];
      payloads.push(x.payload); if (payloads.length === 1) throw new ApiHttpError({ statusCode: 409, code: "PAYMENT_PROVIDER_NOT_CONFIGURED", message: "Provider unavailable", requestId: "provider-request" });
      scheduled = true; return { ...payment, status: "SCHEDULED" };
    });
    await renderFinance(<PayrollPaymentsPanel run={run} />, request); fireEvent.click(await screen.findByRole("button", { name: "Schedule Payment Retry" }));
    const dialog = await screen.findByRole("dialog"); expect(within(dialog).getByText(/811.21/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); await within(dialog).findAllByText(/Please select|Please enter/); expect(payloads).toHaveLength(0);
    fireEvent.mouseDown(within(dialog).getByLabelText("Payment Method")); fireEvent.click(await screen.findByText("Bank Transfer", { selector: ".ant-select-item-option-content" }));
    fireEvent.change(within(dialog).getByLabelText("Provider"), { target: { value: "configured-bank" } }); fireEvent.change(within(dialog).getByLabelText("Destination Reference"), { target: { value: "account-reference" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText("Configure an authoritative payment provider before dispatch.")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); await waitFor(() => expect(payloads).toHaveLength(2)); expect(payloads[0]).toEqual(payloads[1]);
    expect(payloads[0]).toEqual({ idempotencyKey: expect.any(String), paymentMethod: "BANK_TRANSFER", providerKey: "configured-bank", destinationReference: "account-reference" });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Schedule Payment Retry" })).not.toBeInTheDocument());
  });
  it("offers no retry for succeeded payments and no dispatch for manual attempts", async () => {
    const first = await renderFinance(<PayrollPaymentsPanel run={{ ...run, status: "PAYMENT_SCHEDULED" }} />, async () => [{ ...payment, status: "SUCCEEDED" }]);
    await screen.findByRole("status", { name: "Succeeded" }); expect(screen.queryByRole("button", { name: /Schedule Payment/ })).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Dispatch Payment" })).not.toBeInTheDocument(); first.unmount();
    await renderFinance(<PayrollPaymentsPanel run={{ ...run, status: "PAYMENT_SCHEDULED" }} />, async () => [{ ...payment, status: "SCHEDULED", paymentMethod: "MANUAL" }]);
    await screen.findByRole("status", { name: "Scheduled" }); expect(screen.queryByRole("button", { name: "Dispatch Payment" })).not.toBeInTheDocument();
  });
});
