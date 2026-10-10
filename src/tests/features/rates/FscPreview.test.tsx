/** Real Refine preview: explicit input, no startup request, stale result removal and backend-owned values. */
import type { CustomParams } from "@refinedev/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FscPreview, RatingPreviewSummary } from "@/features/rates/FscPreview";
import { LoadFinancialPanel } from "@/features/loads/LoadFinancialPanel";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { loadId, report } from "@/tests/fixtures/finance";
import { rating } from "@/tests/fixtures/rating";
import { ApiHttpError } from "@/providers/api/httpError";
const session = vi.hoisted(() => ({ tenantKey: "tenant-finance" as string | undefined }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: session.tenantKey } }) }));
async function fill() {
  await screen.findByRole("button", { name: "Preview Rating" });
  fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "usd" } });
  fireEvent.change(screen.getByLabelText("Context Source / Provenance"), { target: { value: " Signed agreement " } });
}
describe("FscPreview", () => {
  beforeEach(() => { session.tenantKey = "tenant-finance"; });
  it("requires the authenticated tenant boundary even with an allowed authority", async () => {
    session.tenantKey = undefined;
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(async () => rating); await renderFinance(<FscPreview loadId={loadId} />, request);
    expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("requests only on user action and displays backend FSC, subtotal and four-digit unit rate", async () => {
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(async () => rating); const { client } = await renderFinance(<FscPreview loadId={loadId} />, request);
    await fill(); expect(request).not.toHaveBeenCalled(); const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "Preview Rating" }));
    const result = await screen.findByTestId("rating-preview-result"); expect(result).toHaveTextContent("999.12"); expect(result).toHaveTextContent("35.67"); expect(result).toHaveTextContent("0.3846");
    expect(result).not.toHaveTextContent("38.46"); expect(result).toHaveTextContent("Unavailable"); expect(result).toHaveTextContent("SERIES-01"); expect(result).toHaveTextContent("Audited mileage");
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: `/api/loads/${loadId}/rating/preview`, method: "post", payload: {
      currency: "USD", contextSource: "Signed agreement", contractId: undefined, contractVersion: undefined, lane: undefined, equipment: undefined, service: undefined, tier: undefined,
      linehaulMileageEvidenceId: undefined, fscMileageEvidenceId: undefined, accessorialIds: [],
    } })); expect(invalidate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "EUR" } }); expect(screen.queryByTestId("rating-preview-result")).not.toBeInTheDocument();
  });
  it("validates required context, UUIDs, unique evidence and paired contract version before requesting", async () => {
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(async () => rating); await renderFinance(<FscPreview loadId={loadId} />, request); await fill();
    fireEvent.change(screen.getByLabelText("Approved Accessorial IDs"), { target: { value: `${loadId}, ${loadId}` } });
    fireEvent.change(screen.getByLabelText("Contract ID"), { target: { value: loadId } });
    fireEvent.click(screen.getByRole("button", { name: "Preview Rating" }));
    expect(await screen.findByText("Contract ID and positive version must be supplied together.")).toBeInTheDocument();
    expect(screen.getByText("Enter unique approved accessorial UUIDs, separated by commas or spaces.")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Linehaul Mileage Evidence ID"), { target: { value: "bad-id" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview Rating" })); expect(await screen.findByText("Enter a valid UUID.")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("sends explicit dimensions/evidence without substituting customer or business date", async () => {
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(async () => rating); await renderFinance(<FscPreview loadId={loadId} />, request); await fill();
    for (const label of ["Contract ID", "Linehaul Mileage Evidence ID", "FSC Mileage Evidence ID", "Approved Accessorial IDs"]) fireEvent.change(screen.getByLabelText(label), { target: { value: loadId } });
    fireEvent.change(screen.getByLabelText("Contract Version"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Lane"), { target: { value: " lane-evidence " } });
    fireEvent.click(screen.getByRole("button", { name: "Preview Rating" })); await screen.findByTestId("rating-preview-result");
    expect(request.mock.calls[0]?.[0]).toMatchObject({ payload: { contractId: loadId, contractVersion: 7, linehaulMileageEvidenceId: loadId, fscMileageEvidenceId: loadId, accessorialIds: [loadId], lane: "lane-evidence" } });
  });
  it("shows pending state and prevents duplicate previews", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn(() => new Promise<unknown>((resolve) => { finish = resolve; }));
    await renderFinance(<FscPreview loadId={loadId} />, request); await fill(); const button = screen.getByRole("button", { name: "Preview Rating" }); fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(button).toBeDisabled(); expect(screen.getByLabelText("Currency")).toBeDisabled(); finish(rating); await screen.findByTestId("rating-preview-result");
  });
  it("maps a stale index error with requestId, preserves inputs and allows retry", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "FUEL_INDEX_STALE", message: "Stale", requestId: "index-request" })).mockResolvedValueOnce(rating);
    await renderFinance(<FscPreview loadId={loadId} />, request); await fill(); fireEvent.click(screen.getByRole("button", { name: "Preview Rating" }));
    expect(await screen.findByText("The fuel index exceeds the policy age limit. Refresh its source.")).toBeInTheDocument(); expect(screen.getByText(/index-request/)).toBeInTheDocument(); expect(screen.queryByTestId("rating-preview-result")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview Rating" })); await screen.findByTestId("rating-preview-result"); expect(request.mock.calls[0]?.[0].payload).toEqual(request.mock.calls[1]?.[0].payload);
  });
  it.each(["DRIVER", "DISPATCHER", "PAYROLL", "SUPERADMIN", "UNKNOWN"])("denies %s without API requests", async (role) => {
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(async () => rating); await renderFinance(<FscPreview loadId={loadId} />, request, { role });
    expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Preview Rating" })).not.toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("preserves missing amounts and distinguishes a rule without FSC from zero", async () => {
    await renderFinance(<RatingPreviewSummary preview={{ ...rating, subtotal: null, boundedLinehaul: null, fuelSurcharge: null, lines: [] }} />, async () => rating);
    const result = screen.getByTestId("rating-preview-result"); expect(within(result).getByText("This rule has no FSC policy.")).toBeInTheDocument(); expect(result).not.toHaveTextContent("0.00"); expect(within(result).getAllByText("—")).toHaveLength(2);
  });
  it("mounts rating only when its financial tab opens and does not fetch on tab selection", async () => {
    const request = vi.fn(async () => report); await renderFinance(<LoadFinancialPanel loadId={loadId} />, request);
    await screen.findByTestId("profitability-summary"); expect(screen.queryByRole("button", { name: "Preview Rating" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Rating / FSC Preview" })); await screen.findByRole("button", { name: "Preview Rating" }); expect(request).toHaveBeenCalledTimes(1);
  });
});
