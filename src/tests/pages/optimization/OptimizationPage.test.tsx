import type { CustomParams } from "@refinedev/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OptimizationPage } from "@/pages/optimization/OptimizationPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { optimization, optimizationRunId } from "@/tests/fixtures/optimization";
import { loadId } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const page = <Routes><Route path="/optimization" element={<OptimizationPage />} /><Route path="/optimization/runs/:id" element={<p>Opened optimization</p>} /></Routes>;
const options = { initialEntries: ["/optimization"] };
async function fill() {
  await screen.findByRole("button", { name: "Run Optimization" });
  for (const label of ["Published Policy ID", "Driver IDs", "Truck IDs", "Load", "Trip", "Accepted Rating Snapshot ID", "Pickup Stop ID"]) fireEvent.change(screen.getByLabelText(label), { target: { value: loadId } });
  fireEvent.click(screen.getByRole("button", { name: "Run Optimization" })); return screen.findByRole("dialog");
}
describe("OptimizationPage", () => {
  it("opens only a valid run ID without startup or cross-screen queries", async () => {
    const request = vi.fn(async () => optimization); await renderFinance(page, request, options); await screen.findByRole("heading", { name: "Optimization" });
    fireEvent.change(screen.getByLabelText("Run ID"), { target: { value: "invalid" } }); fireEvent.click(screen.getByRole("button", { name: "View" })); expect(await screen.findByText("Enter a valid UUID.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Run ID"), { target: { value: optimizationRunId } }); fireEvent.click(screen.getByRole("button", { name: "View" })); expect(await screen.findByText("Opened optimization")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("confirms explicit scope, accepts server run ID and blocks duplicate creation", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn<(x: CustomParams) => Promise<unknown>>(() => new Promise((resolve) => { finish = resolve; }));
    await renderFinance(page, request, options); const dialog = await fill(); expect(request).not.toHaveBeenCalled(); const confirm = within(dialog).getByRole("button", { name: "Confirm" }); fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: "/api/optimization/runs", method: "post", payload: { idempotencyKey: expect.any(String), policyId: loadId, targets: [{ loadId, tripId: loadId, ratingSnapshotId: loadId, pickupStopId: loadId }], driverIds: [loadId], truckIds: [loadId], sourceSelections: [] } });
    finish(optimization); expect(await screen.findByText("Opened optimization")).toBeInTheDocument();
  });
  it("retains creation key/input after conflict", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "OPTIMIZATION_IDEMPOTENCY_CONFLICT", message: "Key conflict", requestId: "create-conflict" })).mockResolvedValueOnce(optimization);
    await renderFinance(page, request, options); const dialog = await fill(); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await within(dialog).findByText(/This command key belongs/)).toBeInTheDocument(); expect(within(dialog).getByText(/create-conflict/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await screen.findByText("Opened optimization")).toBeInTheDocument(); expect(request.mock.calls[0]?.[0].payload).toEqual(request.mock.calls[1]?.[0].payload);
  });
  it("requires distinct driver UUIDs before submitting", async () => {
    const request = vi.fn(async () => optimization); await renderFinance(page, request, options); await screen.findByRole("button", { name: "Run Optimization" });
    fireEvent.change(screen.getByLabelText("Driver IDs"), { target: { value: `${loadId},${loadId}` } }); fireEvent.click(screen.getByRole("button", { name: "Run Optimization" }));
    expect(await screen.findAllByText("Enter distinct UUIDs separated by commas or spaces.")).not.toHaveLength(0); expect(request).not.toHaveBeenCalled(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("submits explicit candidate-bound evidence with no inferred source IDs", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>(async () => optimization); await renderFinance(page, request, options); await screen.findByRole("button", { name: "Run Optimization" });
    for (const label of ["Published Policy ID", "Driver IDs", "Truck IDs", "Load", "Trip", "Accepted Rating Snapshot ID", "Pickup Stop ID"]) fireEvent.change(screen.getByLabelText(label), { target: { value: loadId } });
    fireEvent.click(screen.getByRole("button", { name: "Add Evidence Selection" }));
    for (const label of ["Load", "Trip", "Driver", "Truck", "Capacity Evidence ID", "Qualification Evidence ID", "Forecast Evidence ID"]) {
      const inputs = screen.getAllByLabelText(label); fireEvent.change(inputs[inputs.length - 1]!, { target: { value: loadId } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Run Optimization" })); const dialog = await screen.findByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await screen.findByText("Opened optimization"); expect(request.mock.calls[0]?.[0]).toMatchObject({ payload: { sourceSelections: [{ scope: { loadId, tripId: loadId, driverId: loadId, truckId: loadId }, capacityInputId: loadId, qualificationInputId: loadId, forecastInputId: loadId }] } });
  });
  it("generates a new command identity when the scope changes after failure", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 400, code: "INVALID_OPTIMIZATION_SCOPE", message: "Invalid scope", requestId: "scope-request" })).mockResolvedValueOnce(optimization);
    await renderFinance(page, request, options); const dialog = await fill(); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); await within(dialog).findByText(/Verify distinct target IDs/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Truck IDs"), { target: { value: optimizationRunId } }); fireEvent.click(screen.getByRole("button", { name: "Run Optimization" })); const retry = await screen.findByRole("dialog"); fireEvent.click(within(retry).getByRole("button", { name: "Confirm" })); await screen.findByText("Opened optimization");
    const first = request.mock.calls[0]?.[0].payload; const second = request.mock.calls[1]?.[0].payload;
    if (!first || typeof first !== "object" || !("idempotencyKey" in first) || !second || typeof second !== "object" || !("idempotencyKey" in second)) throw new Error("Expected typed command payloads");
    expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
  });
  it.each(["DRIVER", "ACCOUNTANT", "PAYROLL", "SUPERADMIN", "UNKNOWN"])("denies direct entry for %s", async (role) => {
    const request = vi.fn(async () => optimization); await renderFinance(page, request, { ...options, role }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
});
