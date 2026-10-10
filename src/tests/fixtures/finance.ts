/** Contract fixtures deliberately disagree with row totals to catch browser aggregation. */
import type { LoadProfitabilityReportDto, ProfitabilityMetricDto, LoadFinancialSummaryDto } from "@/types/profitability.dto";
import type { ShipmentCostView } from "@/types/shipmentCost.types";
import type { AccessorialChargeView } from "@/types/accessorial.types";

export const loadId = "11111111-1111-4111-8111-111111111111";
export const tenantKey = "tenant-finance";
export const metric = (value: number | null = 777, availability: ProfitabilityMetricDto["availability"] = "AVAILABLE", unit = "CURRENCY"): ProfitabilityMetricDto => ({
  code: "TEST_METRIC", value, availability, unit, reason: availability === "AVAILABLE" ? null : "MISSING_ACTUAL_MILES", basis: "BACKEND_POLICY_V1",
});
export const costs: ShipmentCostView[] = [{ id: "cost-1", loadId, category: "FUEL", costBasis: "ACTUAL", status: "POSTED", amount: 450, currency: "USD", sourceType: "EXPENSE", note: "Diesel" },
  { id: "cost-2", loadId, category: "TOLL", costBasis: "ESTIMATE", status: "VOIDED", amount: 50, currency: "EUR" }];
export const accessorials: AccessorialChargeView[] = [{ id: "acc-1", loadId, type: "DETENTION", status: "PENDING_APPROVAL", quantity: 2, freeQuantity: 1, unit: "HOURS", rate: 75,
  customerAmount: 150, companyCostAmount: 50, driverPayAmount: null, currency: "USD", note: "Backend detention evidence", documentId: "doc-1" }];
export const report: LoadProfitabilityReportDto = {
  loadId, currency: "USD", actualRevenue: 1200, actualCost: 123, estimatedCost: null, contributionMargin: 777, allocatedProfit: 333,
  marginPercent: metric(0.25, "AVAILABLE", "RATIO"), revenuePerTotalMile: metric(null, "UNAVAILABLE", "CURRENCY_PER_MILE"),
  costPerTotalMile: metric(1.2345, "PARTIAL", "CURRENCY_PER_MILE"), breakEvenLoadedRate: metric(null, "NOT_APPLICABLE"),
  contributionMarginMetric: metric(777), allocatedProfitMetric: metric(333), costVariance: metric(null, "UNAVAILABLE"),
  costClassification: { policyName: "Cost Policy", policyVersion: "v7", currency: "USD", revenue: 1200, variableCost: 123, allocatedFixedCost: 456, excludedCost: 0,
    unclassifiedCost: 0, contributionMargin: metric(777), contributionMarginPercent: metric(0.25, "AVAILABLE", "RATIO"), allocatedProfit: metric(333),
    allocatedMarginPercent: metric(0.25, "AVAILABLE", "RATIO"), costs: [], unallocatedTripCosts: [] },
};
export const summaryRow: LoadFinancialSummaryDto = {
  loadId, loadNumber: "L-101", currency: report.currency, quotedRevenue: 9999, actualInvoicedRevenue: report.actualRevenue,
  actualCost: report.actualCost, estimatedCost: null, costVariance: null, contributionMargin: 777, allocatedProfit: 333, marginPercent: 25,
  totalMiles: null, loadedMiles: null, emptyMiles: null, revenuePerTotalMile: null, costPerTotalMile: 1.2345, breakEvenLoadedRate: null,
  costs, accessorials, mileageMetrics: { totalMiles: metric(null, "UNAVAILABLE", "MILE"), loadedMiles: metric(null, "UNAVAILABLE", "MILE"), emptyMiles: metric(null, "UNAVAILABLE", "MILE"),
    revenuePerTotalMile: report.revenuePerTotalMile, costPerTotalMile: report.costPerTotalMile, breakEvenLoadedRate: report.breakEvenLoadedRate },
  contributionMarginMetric: report.contributionMarginMetric, allocatedProfitMetric: report.allocatedProfitMetric, marginPercentMetric: report.marginPercent,
  costVarianceMetric: report.costVariance, costClassification: report.costClassification,
};
