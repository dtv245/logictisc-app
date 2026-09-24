import { describe, expect, it } from "vitest";

import {
  buildMetricDefinitions,
  findMetric,
  NORTH_STAR_METRICS,
  REQUIRED_ENDPOINTS,
  unavailableReasonKey,
} from "@features/executive/executive.metrics";
import { runRules } from "@features/executive/executive.rules";

describe("Executive Metrics Configuration", () => {
  it("declares the 6 canonical reporting endpoints under /api/reports/**", () => {
    expect(REQUIRED_ENDPOINTS.executiveSummary).toBe(
      "/api/reports/executive-summary",
    );
    expect(REQUIRED_ENDPOINTS.monthlyFinancials).toBe(
      "/api/reports/financials/monthly",
    );
    expect(REQUIRED_ENDPOINTS.costBreakdown).toBe(
      "/api/reports/costs/by-category",
    );
    expect(REQUIRED_ENDPOINTS.fleetHealth).toBe("/api/reports/fleet/health");
    expect(REQUIRED_ENDPOINTS.customerConcentration).toBe(
      "/api/reports/customers/concentration",
    );
    expect(REQUIRED_ENDPOINTS.receivablesAging).toBe(
      "/api/reports/receivables/aging",
    );
  });

  it("builds metric definitions with references for fleet types", () => {
    const definitions = buildMetricDefinitions("longHaul");
    expect(definitions.length).toBeGreaterThan(10);

    const cpm = findMetric(definitions, "costPerMile");
    expect(cpm).toBeDefined();
    expect(cpm?.unit).toBe("currencyPerMile");
    expect(cpm?.higherIsBetter).toBe(false);

    const rpm = findMetric(definitions, "revenuePerMile");
    expect(rpm).toBeDefined();
    expect(rpm?.unit).toBe("currencyPerMile");
    expect(rpm?.higherIsBetter).toBe(true);

    NORTH_STAR_METRICS.forEach((id) => {
      const metric = findMetric(definitions, id);
      expect(metric).toBeDefined();
    });
  });

  it("translates backend reason codes to locale keys safely", () => {
    expect(unavailableReasonKey("NO_SOURCE_ROWS")).toBe(
      "executive.unavailable.reason.noSourceRows",
    );
    expect(unavailableReasonKey("ZERO_DENOMINATOR")).toBe(
      "executive.unavailable.reason.zeroDenominator",
    );
    expect(unavailableReasonKey("CUSTOM_UNKNOWN_CODE")).toBe(
      "executive.unavailable.reason.unknown",
    );
    expect(unavailableReasonKey(null)).toBe(
      "executive.unavailable.reason.unknown",
    );
  });

  it("evaluates rules without generating spurious insights when metrics are unavailable", () => {
    const definitions = buildMetricDefinitions(null);
    const insights = runRules({
      values: {},
      definitions,
    });

    // When values are all undefined (unavailable), rules requiring values must not trigger
    expect(insights).toEqual([]);
  });
});
