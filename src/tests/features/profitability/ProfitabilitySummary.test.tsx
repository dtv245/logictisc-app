/** Authoritative money/availability/policy presentation, including zero and missing data. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfitabilitySummary } from "@/features/profitability/ProfitabilitySummary";
import { ProfitabilityMetricCard } from "@/features/profitability/ProfitabilityMetricCard";
import { financialAmount, financialMetricValue } from "@/features/profitability/financialDisplay";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { metric, report } from "@/tests/fixtures/finance";

describe("profitability presentation", () => {
  it.each(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "NOT_APPLICABLE"] as const)("preserves %s and does not make unavailable metrics zero", async (availability) => {
    await renderFinance(<ProfitabilityMetricCard title="Metric" metric={metric(0, availability)} currency="USD" />, async () => ({}));
    const card = screen.getByText("Metric").closest(".ant-card");
    if (!(card instanceof HTMLElement)) throw new Error("Expected metric card");
    expect(within(card).getByText(availability === "AVAILABLE" ? "Available" : availability === "PARTIAL" ? "Partial" : availability === "UNAVAILABLE" ? "Unavailable" : "Not Applicable")).toBeInTheDocument();
    expect(card).toHaveTextContent(availability === "AVAILABLE" || availability === "PARTIAL" ? "0.00" : "—");
    if (availability === "UNAVAILABLE" || availability === "NOT_APPLICABLE") expect(card).not.toHaveTextContent("0.00");
  });
  it("shows zero revenue but never derives missing profit or margins", async () => {
    await renderFinance(<ProfitabilitySummary report={{ ...report, actualRevenue: 0, contributionMarginMetric: metric(null, "UNAVAILABLE"), allocatedProfitMetric: metric(null, "UNAVAILABLE") }} />, async () => ({}));
    const summary = await screen.findByTestId("profitability-summary");
    expect(summary).toHaveTextContent("0.00");
    expect(summary).not.toHaveTextContent("777.00");
    expect(summary).not.toHaveTextContent("333.00");
    expect(summary).toHaveTextContent("Cost Policy / v7");
  });
  it("warns on unclassified trip costs even if allocated load costs are classified", async () => {
    const classification = report.costClassification;
    if (!classification) throw new Error("Expected fixture classification");
    await renderFinance(<ProfitabilitySummary report={{ ...report, costClassification: { ...classification,
      unallocatedTripCosts: [{ costId: "c-1", tripId: "t-1", category: "OTHER", sourceType: "EXPENSE", sourceId: null, costBasis: "ACTUAL", allocationMethod: null,
        amount: 10, currency: "USD", behavior: "UNCLASSIFIED", reason: "POLICY_NOT_MATCHED" }] } }} />, async () => ({}));
    expect(await screen.findByText(/Some costs are unclassified/)).toBeInTheDocument();
  });
  it("formats ratio and per-mile precision while preserving missing currency/value", () => {
    expect(financialMetricValue(metric(0.25, "AVAILABLE", "RATIO"), "USD", "en")).toBe("25%");
    expect(financialMetricValue(metric(1.2345, "AVAILABLE", "CURRENCY_PER_MILE"), "USD", "en")).toContain("1.2345");
    expect(financialAmount(null, "USD", "en")).toBe("—");
    expect(financialAmount(10, undefined, "en")).toBe("—");
  });
});
