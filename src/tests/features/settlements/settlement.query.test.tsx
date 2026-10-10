/** Verifies supported filter transport and calculation behavior at the real Refine boundary. */
import { useState } from "react";
import { useCan, type CustomParams } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSettlements, useCalculateSettlement } from "@/features/settlements/settlement.query";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { settlement } from "@/tests/fixtures/settlement";
import { tenantKey } from "@/tests/fixtures/finance";
import type { SettlementFilterParams } from "@/types/settlement.dto";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function ListProbe() {
  const [filters, setFilters] = useState<SettlementFilterParams>({}); const query = useSettlements(filters);
  return <><span>{query.isLoading ? "loading" : query.settlements.length}</span><button onClick={() => setFilters({ driverId: settlement.driverId, payPeriodId: settlement.payPeriodId, status: "LOCKED", settlementType: "ORIGINAL" })}>Filter</button></>;
}
function CalculateProbe() {
  const calculate = useCalculateSettlement(); const permission = useCan({ resource: "settlements", action: "SETTLEMENT_CALCULATE" });
  return <><button disabled={permission.isLoading} onClick={() => void calculate.calculateSettlement({ driverId: settlement.driverId, payPeriodId: settlement.payPeriodId })}>Calculate</button><span>{calculate.isCalculating ? "pending" : "idle"}</span></>;
}
describe("settlement queries", () => {
  it("serializes only confirmed filters and refetches the collection", async () => {
    const request = vi.fn(async (x: CustomParams) => { expect(x.url).toBe("/api/driver-settlements"); return [settlement]; });
    await renderFinance(<ListProbe />, request); expect(await screen.findByText("1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filter" })); await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]?.[0].query).toEqual({ driverId: settlement.driverId, payPeriodId: settlement.payPeriodId, status: "LOCKED", settlementType: "ORIGINAL" });
  });
  it("keeps calculation single-flight and invalidates only the current tenant settlement list", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const request = vi.fn(() => new Promise<unknown>((done) => { resolve = done; })); const client = new QueryClient();
    const related = ["settlements", tenantKey, "list", {}]; const other = ["settlements", "other-tenant", "list", {}]; client.setQueryData(related, {}); client.setQueryData(other, {});
    await renderFinance(<CalculateProbe />, request, { client }); await waitFor(() => expect(screen.getByRole("button", { name: "Calculate" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Calculate" })); fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(screen.getByText("pending")).toBeInTheDocument(); resolve(settlement);
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument()); expect(client.getQueryState(related)?.isInvalidated).toBe(true); expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  });
  it("denies calculate and collection reads for an unknown authority", async () => {
    const request = vi.fn(async () => settlement); await renderFinance(<><ListProbe /><CalculateProbe /></>, request, { role: "UNKNOWN" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Calculate" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Calculate" })); expect(request).not.toHaveBeenCalled();
  });
});
