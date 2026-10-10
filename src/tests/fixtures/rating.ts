/** Deliberately non-reconciling test amounts prove the UI never derives authoritative values. */
import type { RatingPreview } from "@/types/rateRule.dto";
import { loadId } from "./finance";
export const rating: RatingPreview = {
  inputs: {
    loadId, pricingDate: { pricingDate: "2026-10-01", pricingDateSource: "LOAD_PICKUP_BUSINESS_DATE", sourceChangeId: null },
    matchContext: { customerId: loadId, contractId: null, contractVersion: null, lane: null, equipment: null, service: null, tier: null, currency: "USD", pricingDate: "2026-10-01" },
    contextSource: "Signed agreement", rule: {
      ruleId: "22222222-2222-4222-8222-222222222222", version: 7, priority: 10, customerId: loadId, contractId: null, contractVersion: null,
      lane: null, equipment: null, service: null, tier: null, currency: "USD", effectiveFrom: "2026-01-01", effectiveTo: null,
      method: "PER_MILE", baseRate: "1.23", linehaulMileageBasis: "CONTRACT_MILES", minimumCharge: null, maximumCharge: null,
      fsc: { mileageBasis: "CONTRACT_MILES", indexProvider: "EIA", indexRegion: "REGION-EXPLICIT", maxIndexAgeDays: 14,
        contractMpg: "6.5", baseFuelPrice: "1.25", priceCurrency: "USD", priceUnit: "GALLON" },
      roundingPolicyCode: "RATE_V1", roundingPolicyVersion: 1, createdBy: loadId, createdAt: "2026-10-01T01:00:00Z",
    }, linehaulMileage: null, fscMileage: null, accessorials: [],
  },
  rawLinehaul: "901.21", boundedLinehaul: "876.54", fuelSurcharge: {
    policy: { mileageBasis: "CONTRACT_MILES", indexProvider: "EIA", indexRegion: "REGION-EXPLICIT", maxIndexAgeDays: 14,
      contractMpg: "6.5", baseFuelPrice: "1.25", priceCurrency: "USD", priceUnit: "GALLON" },
    index: { provider: "EIA", region: "REGION-EXPLICIT", seriesIdentifier: "SERIES-01", observationDate: "2026-09-30", value: "3.75", currency: "USD", unit: "GALLON", frequency: "WEEKLY", fuelType: "DIESEL", includingTaxes: true, retrievedAt: "2026-10-01T01:00:00Z", providerVersion: "v1", contentHash: "hash" },
    mileage: { componentType: "FSC", mileageBasis: "CONTRACT_MILES", mileageSourceType: "CONTRACT", sourceReference: "signed-mileage", sourceVersion: 3,
      originalValue: "100", originalUnit: "MILE", eligibleMiles: "100", evidenceId: loadId, provenance: "Audited mileage", capturedBy: loadId, capturedAt: "2026-10-01T01:00:00Z" },
    rawPerMile: "0.384615", perMile: "0.3846", unroundedTotal: "38.46", total: "35.67", currency: "USD", roundingPolicyCode: "RATE_V1", roundingPolicyVersion: 1,
  },
  lines: [{ componentType: "FSC", sourceId: null, description: "Backend charge", unroundedAmount: "38.46", amount: "35.67", currency: "USD" }],
  subtotal: "999.12", currency: "USD", currencyScale: 2, taxAvailability: "UNAVAILABLE", roundingPolicyCode: "RATE_V1", roundingPolicyVersion: 1,
  calculatedAt: "2026-10-01T01:00:00Z", correlationId: "rating-request", inputHash: "input-hash", resultHash: "result-hash",
};
