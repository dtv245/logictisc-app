/**
 * Executive Overview contract status.
 *
 * Re-verified 2026-11-14 against `logictics_api`:
 *   src/main/java/com/company/logicstic/controller/ReportController.java
 *   src/main/java/com/company/logicstic/config/SecurityConfig.java
 *
 * PRESENT
 *   GET /api/reports/financials/monthly
 *     Params: year (int, required), month (int, required), currency (optional).
 *     Returns: ApiResponse<MonthlyFinancialSummary> — ONE month per call.
 *   GET /api/reports/fleet/health (alias: /api/reports/fleet/utilization-history)
 *     Params: policyId (UUID, required), truckIds (List<UUID>, required),
 *             from/to (Instant), firstDate/exclusiveLastDate (LocalDate),
 *             businessZoneId (optional).
 *     Returns: ApiResponse<FleetHistory.Report>.
 *
 * ABSENT — a grep over controller mappings returns no match for any of these:
 *   /api/reports/executive-summary
 *   /api/reports/costs/by-category
 *   /api/reports/customers/concentration
 *   /api/reports/receivables/aging
 *
 * Executive therefore stays dormant (BE-031 in docs/backend-gaps.md). When it is
 * mounted later, it must not request the four absent routes, and it must not
 * present a composition of monthly + fleet data as system-wide figures: the
 * dashboard already owns the verified monthly and fleet screens.
 */
export const EXECUTIVE_CONTRACT_CONFIRMED = false;

export type ExecutiveEndpointKey =
  | "executiveSummary"
  | "monthlyFinancials"
  | "costBreakdown"
  | "fleetHealth"
  | "customerConcentration"
  | "receivablesAging";

export interface ExecutiveEndpointContract {
  readonly path: string;
  /** true only when the exact route exists in the backend controller mappings. */
  readonly available: boolean;
}

export const EXECUTIVE_ENDPOINT_CONTRACT = {
  executiveSummary: {
    path: "/api/reports/executive-summary",
    available: false,
  },
  monthlyFinancials: {
    path: "/api/reports/financials/monthly",
    available: true,
  },
  costBreakdown: {
    path: "/api/reports/costs/by-category",
    available: false,
  },
  fleetHealth: {
    path: "/api/reports/fleet/health",
    available: true,
  },
  customerConcentration: {
    path: "/api/reports/customers/concentration",
    available: false,
  },
  receivablesAging: {
    path: "/api/reports/receivables/aging",
    available: false,
  },
} as const satisfies Record<ExecutiveEndpointKey, ExecutiveEndpointContract>;

/**
 * A query may only run when the feature is enabled AND its route exists.
 * Callers pass this into `enabled`; it is exported so tests can prove that a
 * dormant feature issues no request even for a route that exists.
 */
export const isExecutiveEndpointQueryEnabled = (
  key: ExecutiveEndpointKey,
): boolean =>
  EXECUTIVE_CONTRACT_CONFIRMED && EXECUTIVE_ENDPOINT_CONTRACT[key].available;
