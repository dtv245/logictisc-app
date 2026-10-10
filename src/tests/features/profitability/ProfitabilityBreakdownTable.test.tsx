/** Classification detail preserves backend behavior, source evidence and currency per row. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfitabilityBreakdownTable } from "@/features/profitability/ProfitabilityBreakdownTable";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { ClassifiedCostDto } from "@/types/profitability.dto";

const row: ClassifiedCostDto = { costId: "c-1", tripId: null, category: "FUEL", sourceType: "EXPENSE", sourceId: "e-1", costBasis: "ACTUAL",
  allocationMethod: null, amount: null, currency: "EUR", behavior: "UNCLASSIFIED", reason: "POLICY_NOT_MATCHED" };
describe("ProfitabilityBreakdownTable", () => {
  it("shows missing amounts, unclassified reason and source without deriving share or zero", async () => {
    await renderFinance(<ProfitabilityBreakdownTable costs={[row]} />, async () => ({}));
    expect(screen.getByText("Unclassified")).toBeInTheDocument();
    expect(screen.getByText("POLICY_NOT_MATCHED")).toBeInTheDocument();
    expect(screen.getByText("EXPENSE / e-1")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument();
  });
  it("keeps header/empty collection state", async () => {
    await renderFinance(<ProfitabilityBreakdownTable costs={[]} />, async () => ({}));
    expect(screen.getByRole("columnheader", { name: "Cost Behavior" })).toBeInTheDocument();
    expect(screen.getByText("No data", { selector: "strong" })).toBeInTheDocument();
  });
});
