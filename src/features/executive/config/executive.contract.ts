/**
 * Executive Overview contract status.
 *
 * Re-verified 2026-11-14 against `logictics_api` at `2328e76`:
 *   src/main/java/com/company/logicstic/controller/ReportController.java
 *   src/main/java/com/company/logicstic/dto/report/*.java
 *   src/main/java/com/company/logicstic/config/SecurityConfig.java
 *
 * ALL SIX ROUTES NOW EXIST:
 *   GET /api/reports/executive-summary          (from, to)
 *   GET /api/reports/financials/monthly         (year, month, currency?)
 *   GET /api/reports/costs/by-category          (from, to, currency?)
 *   GET /api/reports/fleet/health               (policyId, truckIds required)
 *   GET /api/reports/customers/concentration    (from, to, currency?, limit)
 *   GET /api/reports/receivables/aging          (asOf, from?, to?, currency?)
 *
 * Authorization: the five financial/executive routes are limited to ADMIN,
 * ACCOUNTANT, PAYROLL and PAYROLL_MANAGER. DISPATCHER/DRIVER receive 403, so
 * the hooks also gate on `reports:EXECUTIVE_VIEW` (see roleMatrix) instead of
 * issuing a predictable 403.
 *
 * Fleet health still needs a policy id and truck ids selected by the user. The
 * Executive screen has no verified source for those, so it never calls that
 * route; the Fleet Report page owns the verified request path and the fleet
 * health KPIs stay unavailable here.
 */
export const EXECUTIVE_CONTRACT_CONFIRMED = true;

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
    available: true,
  },
  monthlyFinancials: {
    path: "/api/reports/financials/monthly",
    available: true,
  },
  costBreakdown: {
    path: "/api/reports/costs/by-category",
    available: true,
  },
  fleetHealth: {
    path: "/api/reports/fleet/health",
    available: true,
  },
  customerConcentration: {
    path: "/api/reports/customers/concentration",
    available: true,
  },
  receivablesAging: {
    path: "/api/reports/receivables/aging",
    available: true,
  },
} as const satisfies Record<ExecutiveEndpointKey, ExecutiveEndpointContract>;

/** Refine resource/action used to mirror the backend finance-only report matrix. */
export const EXECUTIVE_REPORT_RESOURCE = "reports";
export const EXECUTIVE_VIEW_ACTION = "EXECUTIVE_VIEW";

/**
 * A query may only run when the feature is enabled, its route exists, and the
 * caller holds the report permission. Callers pass this into `enabled`.
 */
export const isExecutiveEndpointQueryEnabled = (
  key: ExecutiveEndpointKey,
): boolean =>
  EXECUTIVE_CONTRACT_CONFIRMED && EXECUTIVE_ENDPOINT_CONTRACT[key].available;
