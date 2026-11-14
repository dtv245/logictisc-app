/**
 * Cài đặt ma trận quyền JWT ở mục 5.3 của frontend-context.
 *
 * Policy chỉ phục vụ route/action UX và luôn fail-closed. Backend Spring vẫn
 * là nguồn authorization cuối cùng cho mọi request.
 */

import {
  ACCESS_RESOURCES,
  JWT_ROLES,
  type AccessResource,
  type JwtRole,
  type RoleMatrixRule,
} from "@/types/roles/roles.types";

const READ_ACTIONS = ["list", "show", "read"] as const;
const WRITE_ACTIONS = ["create", "edit", "update", "delete"] as const;
const CRUD_ACTIONS = [...READ_ACTIONS, ...WRITE_ACTIONS] as const;
const OPERATIONS = ["ADMIN", "ACCOUNTANT", "DISPATCHER"] as const;
const DISPATCH = ["ADMIN", "DISPATCHER"] as const;
const ACCOUNTING = ["ADMIN", "ACCOUNTANT"] as const;
const PAYROLL = ["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"] as const;

/** Exact handoff SecurityConfig grants; no legacy authority aliases or ADMIN bypass of ownership. */
export const ROLE_MATRIX = [
  { resources: ["roles"], actions: CRUD_ACTIONS, roles: ["ADMIN"] },
  { resources: ["employees", "inspections"], actions: CRUD_ACTIONS, roles: DISPATCH },
  { resources: ["drivers"], actions: CRUD_ACTIONS, roles: DISPATCH },
  { resources: ["drivers"], actions: ["DRIVER_PROFILE_SELF_VIEW"], roles: ["DRIVER"] },
  { resources: ["drivers"], actions: ["DRIVER_PAYROLL_PROFILE_VIEW"], roles: ["ADMIN", "PAYROLL", "PAYROLL_MANAGER"] },
  { resources: ["customers", "trucks"], actions: CRUD_ACTIONS, roles: OPERATIONS },
  { resources: ["loads"], actions: ["LARK_BASE_SYNC"], roles: DISPATCH },
  { resources: ["loads"], actions: [...CRUD_ACTIONS, "dispatch", "cancel", "pickup", "deliver", "PICKUP_BUSINESS_DATE"], roles: OPERATIONS },
  { resources: ["trips"], actions: [...CRUD_ACTIONS, "dispatch", "cancel", "complete"], roles: DISPATCH },
  { resources: ["invoices"], actions: [...CRUD_ACTIONS, "write", "BILLING_VIEW", "BILLING_GENERATE", "BILLING_ISSUE", "BILLING_CORRECT"], roles: ACCOUNTING },
  { resources: ["payments"], actions: [...READ_ACTIONS, "create", "edit", "update", "write", "PAYMENT_CANCEL"], roles: ACCOUNTING },
  // Download and upload have no backend contract (DocumentController exposes
  // GET list, GET by id and DELETE only); unknown actions remain denied.
  { resources: ["documents"], actions: [...READ_ACTIONS, "delete"], roles: OPERATIONS },
  { resources: ["rates"], actions: ["RATE_PREVIEW", "RATE_ACCEPT", "RATE_AUTHOR"], roles: ACCOUNTING },
  { resources: ["optimization"], actions: ["OPTIMIZATION_VIEW", "OPTIMIZATION_RUN", "OPTIMIZATION_ACCEPT"], roles: DISPATCH },
  { resources: ["fleet-reports"], actions: ["FLEET_REPORT_VIEW"], roles: PAYROLL },
  { resources: ["fleet-reports"], actions: ["FLEET_MILEAGE_ATTRIBUTION"], roles: DISPATCH },
  { resources: ["payslips"], actions: ["PAYSLIP_VIEW"], roles: JWT_ROLES },
  { resources: ["messages", "messaging", "conversations"], actions: [...READ_ACTIONS, "create", "send"], roles: JWT_ROLES },
  { resources: ["conversations"], actions: ["TENANT_CHAT_CREATE"], roles: ["ADMIN"] },
  // SecurityConfig grants `/api/terminals/**` to exactly ADMIN, ACCOUNTANT and
  // DISPATCHER with no per-method split. Legacy SUPERADMIN/OWNER/MANAGER
  // authorities are not backend roles here; granting them would enable calls
  // the backend rejects with 403.
  { resources: ["terminals"], actions: CRUD_ACTIONS, roles: OPERATIONS },
  { resources: ["notifications"], actions: [...READ_ACTIONS, "markAllRead", "mark-all-read"], roles: JWT_ROLES },
  { resources: ["shipment-costs"], actions: [...READ_ACTIONS, "COST_VIEW", "COST_CREATE", "COST_SYNC_EXPENSES", "COST_ALLOCATE_MAINTENANCE"], roles: PAYROLL },
  { resources: ["shipment-costs"], actions: ["COST_VERIFY", "COST_APPROVE", "COST_VOID"], roles: ACCOUNTING },
  { resources: ["profitability"], actions: [...READ_ACTIONS, "PROFITABILITY_VIEW"], roles: PAYROLL },
  { resources: ["accessorials"], actions: [...READ_ACTIONS, "ACCESSORIAL_VIEW", "ACCESSORIAL_CREATE", "ACCESSORIAL_CALCULATE_DETENTION"], roles: OPERATIONS },
  { resources: ["accessorials"], actions: ["ACCESSORIAL_APPROVE"], roles: ACCOUNTING },
  { resources: ["driver-pay-policies"], actions: [...READ_ACTIONS, "POLICY_VIEW", "POLICY_CREATE", "POLICY_NEW_VERSION"], roles: PAYROLL },
  { resources: ["settlements"], actions: [...READ_ACTIONS, "SETTLEMENT_VIEW", "SETTLEMENT_CALCULATE", "SETTLEMENT_REVIEW", "SETTLEMENT_APPROVE", "SETTLEMENT_LOCK", "SETTLEMENT_ADJUST", "SETTLEMENT_REVERSE", "SETTLEMENT_REQUIRE_VALIDATION", "SETTLEMENT_RESOLVE_VALIDATION", "SETTLEMENT_RECALCULATE_REVENUE", "SETTLEMENT_BILLING_ADJUST"], roles: PAYROLL },
  { resources: ["payroll"], actions: ["show", "read", "PAYROLL_VIEW", "PAYROLL_CALCULATE", "PAYROLL_RECALCULATE", "PAYROLL_REVIEW", "PAYROLL_APPROVE", "PAYROLL_LOCK", "PAYROLL_SCHEDULE_PAYMENT", "PAYROLL_DISPATCH_PAYMENT", "PAYROLL_RECONCILE", "PAYROLL_NO_PAYMENT_REQUIRED"], roles: PAYROLL },
  { resources: ["ai-dispatch"], actions: [...CRUD_ACTIONS, "AI_DISPATCH_VIEW", "AI_DISPATCH_RUN", "AI_DISPATCH_APPROVE"], roles: DISPATCH },
] as const satisfies readonly RoleMatrixRule[];

const isKnownResource = (resource: string): resource is AccessResource =>
  (ACCESS_RESOURCES as readonly string[]).includes(resource);

const containsString = (
  values: readonly string[],
  candidate: string,
): boolean => values.includes(candidate);

/**
 * Trả về false khi resource/action chưa được contract mô tả. SUPERADMIN cũng
 * không vượt qua nhánh này để tránh vô tình mở module chưa có Spring API.
 */
export const canJwtRolesAccess = (
  roles: readonly JwtRole[],
  resource: string | undefined,
  action: string,
): boolean => {
  const normalizedResource = resource?.trim().toLowerCase();
  const normalizedAction = action.trim();

  if (
    !normalizedResource ||
    !normalizedAction ||
    !isKnownResource(normalizedResource)
  ) {
    return false;
  }

  return ROLE_MATRIX.some(
    (rule) =>
      containsString(rule.resources, normalizedResource) &&
      containsString(rule.actions, normalizedAction) &&
      rule.roles.some((allowedRole) =>
        containsString(roles, allowedRole),
      ),
  );
};
