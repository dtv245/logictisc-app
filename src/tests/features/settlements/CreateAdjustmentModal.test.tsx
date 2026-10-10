/** Corrections keep immutable parent data, explicit currency/amounts and retry identity. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { CreateAdjustmentModal } from "@/features/settlements/CreateAdjustmentModal";
import { SettlementActions } from "@/features/settlements/SettlementActions";
import { useSettlementActions } from "@/features/settlements/useSettlementActions";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { settlement, settlementId } from "@/tests/fixtures/settlement";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe({ onCreated = () => undefined }: { onCreated?: (id: string) => void }) {
  const actions = useSettlementActions({ ...settlement, status: "LOCKED" });
  return <><SettlementActions actions={actions} /><CreateAdjustmentModal actions={actions} currency="EUR" onCreated={onCreated} /></>;
}
async function fill(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "Historical correction" } });
  fireEvent.mouseDown(within(dialog).getByLabelText("Line Class"));
  fireEvent.click(await screen.findByText("Deduction", { selector: ".ant-select-item-option-content" }));
  fireEvent.change(within(dialog).getByLabelText("Line Type"), { target: { value: "CORRECTION" } });
  fireEvent.change(within(dialog).getByLabelText("Description"), { target: { value: "Explicit correction line" } });
  fireEvent.change(within(dialog).getByLabelText("Amount (EUR)"), { target: { value: "18.25" } });
}
describe("CreateAdjustmentModal", () => {
  it("requires reason and positive explicit amount without editing parent history", async () => {
    const request = vi.fn(async () => settlement);
    await renderFinance(<Probe />, request);
    fireEvent.click(await screen.findByRole("button", { name: "Create Adjustment" }));
    const dialog = await screen.findByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(await within(dialog).findByText("Enter a reason within the allowed length.")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
    await fill(dialog); fireEvent.change(within(dialog).getByLabelText("Amount (EUR)"), { target: { value: "0" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText("Enter an explicit positive amount.")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled(); expect(settlement.lines?.[0]?.amount).toBe("25");
  });
  it("maps server fields, retains the retry key, preserves currency and links the new child", async () => {
    const childId = "55555555-5555-4555-8555-555555555555";
    const error = new ApiHttpError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Correction invalid", requestId: "adjustment-request", fieldErrors: { "lines[0].amount": ["Amount needs verification"] } });
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(error).mockResolvedValueOnce({ ...settlement, id: childId, settlementType: "ADJUSTMENT", parentSettlementId: settlementId });
    const onCreated = vi.fn(); await renderFinance(<Probe onCreated={onCreated} />, request);
    fireEvent.click(await screen.findByRole("button", { name: "Create Adjustment" })); const dialog = await screen.findByRole("dialog"); await fill(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText("Amount needs verification")).toBeInTheDocument();
    expect(screen.getByText(/adjustment-request/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(childId));
    expect(request).toHaveBeenCalledTimes(2);
    const first = request.mock.calls[0]?.[0]; const second = request.mock.calls[1]?.[0];
    expect(first?.url).toBe(`/api/driver-settlements/${settlementId}/adjustments`); expect(first?.method).toBe("post");
    expect(first?.payload).toEqual(second?.payload);
    expect(first?.payload).toEqual({ idempotencyKey: expect.any(String), reason: "Historical correction", lines: [{ lineClass: "DEDUCTION", lineType: "CORRECTION", description: "Explicit correction line", amount: "18.25" }] });
    expect(within(dialog).getByText(/original locked history remains immutable/)).toBeInTheDocument();
    expect(settlement.currency).toBe("EUR"); expect(settlement.settlementNet).toBe("811.01");
  });
});
