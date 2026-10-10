import { describe, expect, it } from "vitest";
import { normalizeJwtRoles } from "@providers/permissions/jwtRoles";
import { canJwtRolesAccess } from "@providers/permissions/roleMatrix";

// Expected grants come from SecurityConfig /controllers, not ROLE_MATRIX.
const authorities = ["SUPERADMIN", "OWNER", "MANAGER", "DISPATCHER", "DRIVER",
  "ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER", "UNKNOWN"];
const finance = ["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"];
const financeActions: Record<string, string[]> = {
  "shipment-costs": ["COST_VIEW", "COST_CREATE", "COST_SYNC_EXPENSES", "COST_ALLOCATE_MAINTENANCE"],
  profitability: ["PROFITABILITY_VIEW"],
  "driver-pay-policies": ["POLICY_VIEW", "POLICY_CREATE", "POLICY_NEW_VERSION"],
  settlements: ["SETTLEMENT_VIEW", "SETTLEMENT_CALCULATE", "SETTLEMENT_REVIEW", "SETTLEMENT_APPROVE", "SETTLEMENT_LOCK", "SETTLEMENT_ADJUST", "SETTLEMENT_REVERSE", "SETTLEMENT_REQUIRE_VALIDATION", "SETTLEMENT_RESOLVE_VALIDATION", "SETTLEMENT_RECALCULATE_REVENUE", "SETTLEMENT_BILLING_ADJUST"],
  payroll: ["PAYROLL_VIEW", "PAYROLL_CALCULATE", "PAYROLL_RECALCULATE", "PAYROLL_REVIEW", "PAYROLL_APPROVE", "PAYROLL_LOCK", "PAYROLL_SCHEDULE_PAYMENT", "PAYROLL_DISPATCH_PAYMENT", "PAYROLL_RECONCILE", "PAYROLL_NO_PAYMENT_REQUIRED"],
};

describe("backend finance endpoint authorization parity", () => {
  it.each(authorities)("mirrors each finance and accessorial action for %s", (authority) => {
    const roles = normalizeJwtRoles(undefined, [`ROLE_${authority}`]);
    for (const [resource, actions] of Object.entries(financeActions)) {
      for (const action of actions) {
        expect(canJwtRolesAccess(roles, resource, action), `${authority} ${resource}/${action}`)
          .toBe(finance.includes(authority));
      }
      // Backend offers commands, not arbitrary CRUD status edits/deletes.
      expect(canJwtRolesAccess(roles, resource, "edit")).toBe(false);
      expect(canJwtRolesAccess(roles, resource, "delete")).toBe(false);
    }
    for (const action of ["ACCESSORIAL_VIEW", "ACCESSORIAL_CREATE", "ACCESSORIAL_CALCULATE_DETENTION"]) {
      expect(canJwtRolesAccess(roles, "accessorials", action))
        .toBe(["ADMIN", "ACCOUNTANT", "DISPATCHER"].includes(authority));
    }
    expect(canJwtRolesAccess(roles, "accessorials", "ACCESSORIAL_APPROVE"))
      .toBe(["ADMIN", "ACCOUNTANT"].includes(authority));
    expect(canJwtRolesAccess(roles, "payroll", "list")).toBe(false);
    expect(canJwtRolesAccess(roles, "shipment-costs", "COST_POST")).toBe(false);
    expect(canJwtRolesAccess(roles, "settlements", "SETTLEMENT_REJECT")).toBe(false);
    expect(canJwtRolesAccess(roles, "settlements", "invented-action")).toBe(false);
    expect(canJwtRolesAccess(roles, "rates", "RATE_PREVIEW")).toBe(["ADMIN", "ACCOUNTANT"].includes(authority));
    for (const action of ["list", "edit", "delete"]) expect(canJwtRolesAccess(roles, "rates", action)).toBe(false);
    expect(canJwtRolesAccess(roles, "rates", "RATE_ACCEPT")).toBe(["ADMIN", "ACCOUNTANT"].includes(authority));
    for (const action of ["OPTIMIZATION_VIEW", "OPTIMIZATION_RUN", "OPTIMIZATION_ACCEPT"]) expect(canJwtRolesAccess(roles, "optimization", action)).toBe(["ADMIN", "DISPATCHER"].includes(authority));
    for (const action of ["edit", "delete", "dispatch"]) expect(canJwtRolesAccess(roles, "optimization", action)).toBe(false);
    expect(canJwtRolesAccess(roles, "fleet-reports", "FLEET_REPORT_VIEW")).toBe(finance.includes(authority));
    expect(canJwtRolesAccess(roles, "fleet-reports", "edit")).toBe(false);
  });
});
