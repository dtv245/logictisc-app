/** Verifies backend-owned summary values, lazy tabs, mixed currencies and fail-closed access. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadFinancialPanel } from "@/features/loads/LoadFinancialPanel";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { accessorials, costs, loadId, report, tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
import type { CustomParams } from "@refinedev/core";

vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const backend = async ({ url }: CustomParams): Promise<unknown> => url.endsWith("/costs") ? costs : url.endsWith("/accessorials") ? accessorials : report;

describe("LoadFinancialPanel", () => {
  it("displays authoritative values without summing costs or deriving margin, and fetches only the open tab", async () => {
    const request = vi.fn(backend);
    await renderFinance(<LoadFinancialPanel loadId={loadId} />, request);
    const summary = await screen.findByTestId("profitability-summary");
    expect(summary).toHaveTextContent("777.00");
    expect(summary).toHaveTextContent("333.00");
    expect(summary).not.toHaveTextContent("700.00");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0].url).toBe(`/api/loads/${loadId}/financial-summary`);
  });
  it("loads costs on tab selection, separating basis/status and preserving each currency", async () => {
    const request = vi.fn(backend);
    const { client } = await renderFinance(<LoadFinancialPanel loadId={loadId} />, request);
    await screen.findByTestId("profitability-summary");
    fireEvent.click(screen.getByRole("tab", { name: "Shipment Costs" }));
    expect(await screen.findByText("FUEL")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Posted")).toBeInTheDocument();
    expect(screen.getByText("Voided")).toBeInTheDocument();
    expect(screen.getAllByText(/EUR/).length).toBeGreaterThan(0);
    expect(request.mock.calls.some(([x]) => x.url.endsWith("/accessorials"))).toBe(false);
    expect(client.getQueryCache().find(["load-finance", tenantKey, loadId, "costs"])).toBeDefined();
  });
  it("approves a pending charge only after confirmation and keeps the three amounts independent", async () => {
    const request = vi.fn(backend);
    await renderFinance(<LoadFinancialPanel loadId={loadId} />, request);
    await screen.findByTestId("profitability-summary");
    fireEvent.click(screen.getByRole("tab", { name: "Accessorial Charges" }));
    const button = await screen.findByRole("button", { name: "Approve acc-1" });
    const row = button.closest("tr");
    if (!row) throw new Error("Expected accessorial table row");
    expect(within(row).getByText(/150.00/)).toBeInTheDocument();
    expect(within(row).getByText(/USD\s50\.00/)).toBeInTheDocument();
    expect(within(row).getAllByText("—").length).toBeGreaterThan(0);
    fireEvent.click(button);
    expect(request.mock.calls.some(([x]) => x.method === "put")).toBe(false);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(request.mock.calls.filter(([x]) => x.method === "put")).toHaveLength(1));
    expect(request.mock.calls.find(([x]) => x.method === "put")?.[0].url).toBe("/api/accessorial-charges/acc-1/approve");
  });
  it("denies unknown authority and never fetches finance data", async () => {
    const request = vi.fn(backend);
    await renderFinance(<LoadFinancialPanel loadId={loadId} />, request, { role: "UNKNOWN" });
    expect(await screen.findByText(enForbidden())).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
  it("Dispatcher can read accessorials without fetching summary/costs or seeing approval", async () => {
    const request = vi.fn(backend);
    await renderFinance(<LoadFinancialPanel loadId={loadId} />, request, { role: "DISPATCHER" });
    expect(await screen.findByText("DETENTION")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve acc-1" })).not.toBeInTheDocument();
    expect(request.mock.calls.every(([x]) => x.url.endsWith("/accessorials"))).toBe(true);
  });
  it("distinguishes an empty cost collection from a query failure and allows retry", async () => {
    let failure = true;
    const request = vi.fn(async ({ url }: CustomParams) => {
      if (!url.endsWith("/costs")) return report;
      if (failure) throw new ApiHttpError({ statusCode: 503, code: "SERVICE_UNAVAILABLE", message: "Cost service unavailable", requestId: "r-1" });
      return [];
    });
    await renderFinance(<LoadFinancialPanel loadId={loadId} />, request);
    await screen.findByTestId("profitability-summary");
    fireEvent.click(screen.getByRole("tab", { name: "Shipment Costs" }));
    expect(await screen.findByText("Cost service unavailable")).toBeInTheDocument();
    failure = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument();
  });
});
function enForbidden(): string { return "Access denied"; }
