/** Real Refine detail reads, lazy history, confirmations and immutable financial evidence. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import type { CustomParams } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";
import { SettlementShow } from "@/pages/settlements/SettlementShow";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { settlement, settlementId } from "@/tests/fixtures/settlement";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const page = <Routes><Route path="/settlements/:id" element={<SettlementShow />} /></Routes>;
const options = { initialEntries: [`/settlements/${settlementId}`] };
describe("SettlementShow", () => {
  it("uses backend totals, source work and timestamp evidence without prefetching hidden tabs", async () => {
    const request = vi.fn(async (x: CustomParams) => x.url.endsWith(settlementId) ? settlement : [{ ...settlement, id: "child-id", parentSettlementId: settlementId, settlementNumber: "CHILD-101" }, { ...settlement, id: "unrelated", settlementNumber: "UNRELATED-101" }]);
    await renderFinance(page, request, options);
    expect(await screen.findByRole("heading", { name: settlement.settlementNumber })).toBeInTheDocument();
    expect(screen.getByText(/811.01/)).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "Source Work" })); expect(await screen.findByText(/trip-source/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Audit" })); expect(await screen.findByText(/Full event history is unavailable/)).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "Adjustments / Reversals" })); expect(await screen.findByText("CHILD-101")).toBeInTheDocument();
    expect(screen.queryByText("UNRELATED-101")).not.toBeInTheDocument(); expect(request.mock.calls[1]?.[0].query).toEqual({ driverId: settlement.driverId, payPeriodId: settlement.payPeriodId });
  });
  it("requires confirmation, disables pending actions and refetches only current detail", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn(async (x: CustomParams) => x.method === "post" ? new Promise((resolve) => { finish = resolve; }) : settlement);
    await renderFinance(page, request, options);
    const trigger = await screen.findByRole("button", { name: "Submit for Review" }); fireEvent.click(trigger);
    expect(request.mock.calls.filter(([x]) => x.method === "post")).toHaveLength(0);
    const dialog = await screen.findByRole("dialog"); const confirm = within(dialog).getByRole("button", { name: "Confirm" });
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(request.mock.calls.filter(([x]) => x.method === "post")).toHaveLength(1));
    expect(trigger).toBeDisabled(); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    finish({ ...settlement, status: "IN_REVIEW" }); await waitFor(() => expect(request.mock.calls.filter(([x]) => x.method === "get")).toHaveLength(2));
  });
  it.each(["LOCKED", "PAID"] as const)("keeps %s read-only and offers linked corrections only", async (status) => {
    await renderFinance(page, async () => ({ ...settlement, status }), options);
    expect(await screen.findByRole("button", { name: "Create Adjustment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Reversal" })).toBeInTheDocument();
    for (const name of ["Approve Settlement", "Lock Settlement", "Submit for Review", "Edit"]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  });
  it("displays validation reason with only resolution actions", async () => {
    await renderFinance(page, async () => ({ ...settlement, status: "VALIDATION_REQUIRED", validationReason: "Missing policy" }), options);
    expect(await screen.findByText("Missing policy")).toBeInTheDocument(); expect(await screen.findByRole("button", { name: "Resolve Validation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock Settlement" })).not.toBeInTheDocument();
  });
  it("requires a reversal reason and posts a linked correction command", async () => {
    const request = vi.fn(async (x: CustomParams) => x.method === "get" ? { ...settlement, status: "LOCKED" } : { ...settlement, id: "55555555-5555-4555-8555-555555555555", parentSettlementId: settlementId, settlementType: "REVERSAL" });
    await renderFinance(page, request, options); fireEvent.click(await screen.findByRole("button", { name: "Create Reversal" }));
    const dialog = await screen.findByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(await within(dialog).findByText("Enter a reason within the allowed length.")).toBeInTheDocument(); expect(request.mock.calls.some(([x]) => x.method === "post")).toBe(false);
    fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "Correct historical pay" } }); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: `/api/driver-settlements/${settlementId}/reversal`, method: "post", payload: { reason: "Correct historical pay" } })));
  });
  it("keeps denied and malformed routes from reaching the API", async () => {
    const request = vi.fn(async () => settlement); const first = await renderFinance(page, request, { ...options, role: "DISPATCHER" });
    expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled(); first.unmount();
    await renderFinance(page, request, { initialEntries: ["/settlements/malformed"] }); expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("distinguishes loading, empty and read error with retry", async () => {
    const loading = await renderFinance(page, () => new Promise(() => undefined), options); expect(document.querySelector(".ant-spin")).not.toBeNull(); loading.unmount();
    const empty = await renderFinance(page, async () => null, options); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); empty.unmount();
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Unavailable detail", requestId: null })).mockResolvedValueOnce(settlement);
    await renderFinance(page, request, options); expect(await screen.findByText("Unavailable detail")).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: settlement.settlementNumber })).toBeInTheDocument();
  });
});
