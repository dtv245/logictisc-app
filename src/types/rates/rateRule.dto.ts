/** RatingController V1 transport. Decimal values are formatted, never recalculated. */
export type RatingDecimal = string | number;
export interface RatingPreviewRequest {
  contractId?: string | null; contractVersion?: number | null;
  lane?: string | null; equipment?: string | null; service?: string | null; tier?: string | null;
  currency: string; contextSource: string; linehaulMileageEvidenceId?: string | null;
  fscMileageEvidenceId?: string | null; accessorialIds: string[];
}
export interface IndexBasedFscPolicy {
  mileageBasis: string; indexProvider: string; indexRegion: string; maxIndexAgeDays: number;
  contractMpg: RatingDecimal | null; baseFuelPrice: RatingDecimal | null; priceCurrency: string; priceUnit: string;
}
export interface ResolvedRatingMileage {
  componentType: string; mileageBasis: string; mileageSourceType: string; sourceReference: string;
  sourceVersion: number; originalValue: RatingDecimal | null; originalUnit: string;
  eligibleMiles: RatingDecimal | null; evidenceId: string | null; provenance: string;
  capturedBy: string | null; capturedAt: string | null;
}
export interface RateRule {
  ruleId: string; version: number; priority: number; customerId: string | null;
  contractId: string | null; contractVersion: number | null;
  lane: string | null; equipment: string | null; service: string | null; tier: string | null;
  currency: string; effectiveFrom: string; effectiveTo: string | null;
  method: "FLAT" | "PER_MILE"; baseRate: RatingDecimal | null;
  linehaulMileageBasis: string | null; minimumCharge: RatingDecimal | null; maximumCharge: RatingDecimal | null;
  fsc: IndexBasedFscPolicy | null; roundingPolicyCode: string; roundingPolicyVersion: number;
  createdBy: string; createdAt: string;
}
export interface FuelSurchargeResult {
  policy: IndexBasedFscPolicy;
  index: { provider: string; region: string; seriesIdentifier: string; observationDate: string;
    value: RatingDecimal | null; currency: string; unit: string; frequency: string; fuelType: string;
    includingTaxes: boolean; retrievedAt: string; providerVersion: string; contentHash: string };
  mileage: ResolvedRatingMileage; rawPerMile: RatingDecimal | null; perMile: RatingDecimal | null;
  unroundedTotal: RatingDecimal | null; total: RatingDecimal | null; currency: string;
  roundingPolicyCode: string; roundingPolicyVersion: number;
}
export interface RatingPreview {
  inputs: { loadId: string; pricingDate: { pricingDate: string; pricingDateSource: string; sourceChangeId: string | null };
    matchContext: { customerId: string; contractId: string | null; contractVersion: number | null; lane: string | null;
      equipment: string | null; service: string | null; tier: string | null; currency: string; pricingDate: string };
    contextSource: string; rule: RateRule; linehaulMileage: ResolvedRatingMileage | null;
    fscMileage: ResolvedRatingMileage | null;
    accessorials: { chargeId: string; customerAmount: RatingDecimal | null; currency: string }[] };
  rawLinehaul: RatingDecimal | null; boundedLinehaul: RatingDecimal | null; fuelSurcharge: FuelSurchargeResult | null;
  lines: { componentType: string; sourceId: string | null; description: string; unroundedAmount: RatingDecimal | null;
    amount: RatingDecimal | null; currency: string }[];
  subtotal: RatingDecimal | null; currency: string; currencyScale: number; taxAvailability: string;
  roundingPolicyCode: string; roundingPolicyVersion: number; calculatedAt: string; correlationId: string;
  inputHash: string; resultHash: string;
}
