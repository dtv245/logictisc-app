import type { ShipmentCostView } from "./shipmentCost.types";
import type { AccessorialChargeView } from "./accessorial.types";

export type FinancialDecimal = number | string;
export type MetricAvailability = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE";

/** Current Spring MetricDto; availability is authoritative, including a null value. */
export interface ProfitabilityMetricDto {
  code: string;
  value: FinancialDecimal | null;
  unit: string | null;
  numerator?: FinancialDecimal | null;
  denominator?: FinancialDecimal | null;
  availability: MetricAvailability;
  basis: string | null;
  reason: string | null;
}

export interface ClassifiedCostDto {
  costId: string;
  tripId: string | null;
  category: string;
  sourceType: string;
  sourceId: string | null;
  costBasis: string;
  allocationMethod: string | null;
  amount: FinancialDecimal | null;
  currency: string;
  behavior: "VARIABLE" | "FIXED_ALLOCATABLE" | "EXCLUDED" | "UNCLASSIFIED";
  reason: string | null;
}

export interface CostClassificationSummaryDto {
  policyName: string;
  policyVersion: string;
  currency: string;
  revenue: FinancialDecimal | null;
  variableCost: FinancialDecimal | null;
  allocatedFixedCost: FinancialDecimal | null;
  excludedCost: FinancialDecimal | null;
  unclassifiedCost: FinancialDecimal | null;
  contributionMargin: ProfitabilityMetricDto;
  contributionMarginPercent: ProfitabilityMetricDto;
  allocatedProfit: ProfitabilityMetricDto;
  allocatedMarginPercent: ProfitabilityMetricDto;
  costs: ClassifiedCostDto[];
  unallocatedTripCosts: ClassifiedCostDto[];
}

export interface LoadProfitabilityReportDto {
  loadId: string;
  currency: string;
  actualRevenue: FinancialDecimal | null;
  actualCost: FinancialDecimal | null;
  contributionMargin: FinancialDecimal | null;
  allocatedProfit: FinancialDecimal | null;
  marginPercent: ProfitabilityMetricDto;
  revenuePerTotalMile: ProfitabilityMetricDto;
  costPerTotalMile: ProfitabilityMetricDto;
  breakEvenLoadedRate: ProfitabilityMetricDto;
  estimatedCost: FinancialDecimal | null;
  costVariance: ProfitabilityMetricDto;
  contributionMarginMetric: ProfitabilityMetricDto;
  allocatedProfitMetric: ProfitabilityMetricDto;
  costClassification: CostClassificationSummaryDto | null;
}

export interface LoadFinancialSummaryDto {
  loadId: string;
  loadNumber: string | null;
  currency: string;
  quotedRevenue: FinancialDecimal | null;
  actualInvoicedRevenue: FinancialDecimal | null;
  actualCost: FinancialDecimal | null;
  estimatedCost: FinancialDecimal | null;
  costVariance: FinancialDecimal | null;
  contributionMargin: FinancialDecimal | null;
  allocatedProfit: FinancialDecimal | null;
  marginPercent: FinancialDecimal | null;
  totalMiles: FinancialDecimal | null;
  loadedMiles: FinancialDecimal | null;
  emptyMiles: FinancialDecimal | null;
  revenuePerTotalMile: FinancialDecimal | null;
  costPerTotalMile: FinancialDecimal | null;
  breakEvenLoadedRate: FinancialDecimal | null;
  costs: ShipmentCostView[];
  accessorials: AccessorialChargeView[];
  mileageMetrics: {
    totalMiles: ProfitabilityMetricDto;
    loadedMiles: ProfitabilityMetricDto;
    emptyMiles: ProfitabilityMetricDto;
    revenuePerTotalMile: ProfitabilityMetricDto;
    costPerTotalMile: ProfitabilityMetricDto;
    breakEvenLoadedRate: ProfitabilityMetricDto;
  };
  contributionMarginMetric: ProfitabilityMetricDto;
  allocatedProfitMetric: ProfitabilityMetricDto;
  marginPercentMetric: ProfitabilityMetricDto;
  costVarianceMetric: ProfitabilityMetricDto;
  costClassification: CostClassificationSummaryDto | null;
}
