# Finance authorization contract — 2026-10-05

Source: current `/home/vumoi/logictics_api` SecurityConfig, ShipmentCostController,
AccessorialController, ReportController, DriverPayPolicyController,
DriverSettlementController, PayrollRunController and PayrollPaymentController.
Runtime OpenAPI was fetched directly from localhost:8080, bypassing Vite's dev fallback.
User approved exact backend authorities, with no semantic alias or SUPERADMIN bypass.

`F` below means ADMIN, ACCOUNTANT, PAYROLL, PAYROLL_MANAGER.

| Frontend resource / capability | Backend method/path | Authorities |
|---|---|---|
| shipment-costs / COST_VIEW | GET /api/loads/{id}/costs | F |
| shipment-costs / COST_CREATE | POST /api/loads/{id}/costs | F |
| shipment-costs / COST_SYNC_EXPENSES | POST /api/loads/{id}/costs/sync-expenses | F |
| shipment-costs / COST_ALLOCATE_MAINTENANCE | POST /api/loads/{id}/costs/allocate-maintenance | F |
| profitability / PROFITABILITY_VIEW | GET /api/loads/{id}/financial-summary and /api/reports/profitability/** | F |
| accessorials / ACCESSORIAL_VIEW, ACCESSORIAL_CREATE | GET, POST /api/loads/{id}/accessorials | ADMIN, ACCOUNTANT, DISPATCHER |
| accessorials / ACCESSORIAL_CALCULATE_DETENTION | POST /api/trip-stops/{id}/calculate-detention | ADMIN, ACCOUNTANT, DISPATCHER |
| accessorials / ACCESSORIAL_APPROVE | PUT /api/accessorial-charges/{id}/approve | ADMIN, ACCOUNTANT |
| driver-pay-policies / POLICY_VIEW | GET /api/driver-pay-policies and /{id} | F |
| driver-pay-policies / POLICY_CREATE, POLICY_NEW_VERSION | POST collection and /{id}/new-version | F |
| settlements / SETTLEMENT_VIEW | GET /api/driver-settlements and /{id} | F |
| settlements / SETTLEMENT_CALCULATE | POST /api/driver-settlements/calculate | F |
| settlements / SETTLEMENT_REVIEW, SETTLEMENT_APPROVE, SETTLEMENT_LOCK | POST /{id}/submit-review, /approve, /lock | F |
| settlements / SETTLEMENT_REQUIRE_VALIDATION, SETTLEMENT_RESOLVE_VALIDATION | POST /{id}/require-validation, /resolve-validation | F |
| settlements / SETTLEMENT_ADJUST, SETTLEMENT_REVERSE | POST /{id}/adjustments, /reversal | F |
| settlements / SETTLEMENT_RECALCULATE_REVENUE, SETTLEMENT_BILLING_ADJUST | POST /{id}/recalculate-revenue, /billing-adjustments | F |
| payroll / PAYROLL_VIEW | GET /api/payroll/runs/{id}, /items/{id}/payments | F |
| payroll / PAYROLL_CALCULATE, PAYROLL_RECALCULATE | POST /api/payroll/runs/calculate, /{id}/recalculate | F |
| payroll / PAYROLL_REVIEW, PAYROLL_APPROVE, PAYROLL_LOCK | POST /api/payroll/runs/{id}/submit-review, /approve, /lock | F |
| payroll / PAYROLL_SCHEDULE_PAYMENT, PAYROLL_DISPATCH_PAYMENT | POST /api/payroll/items/{id}/payments, /payments/{id}/dispatch | F |
| payroll / PAYROLL_RECONCILE | GET /api/payroll/reconciliation-cases, POST /payments/{id}/reconcile-bank | F |
| payroll / PAYROLL_NO_PAYMENT_REQUIRED | POST /api/payroll/items/{id}/no-payment-required | F |

The inspected controllers/services add no per-role `@PreAuthorize` restrictions
to these matchers. Consequently ACCOUNTANT currently can approve/lock; examples
of stricter future policy are not implemented as if they were current backend rules.
Actor-sensitive commands additionally require an authenticated email mapped to an
Employee; the frontend never synthesizes that mapping or sends an arbitrary actor.
Workflow state, ownership, field validation and domain conflicts remain server checks.
No payroll collection GET, settlement reject, or cost post/void endpoint was confirmed;
their corresponding fictitious actions are denied.

LarkAuthService issues uppercase `roles` from Employee.role.name (default EMPLOYEE).
LarkAuthenticationFilter creates SimpleGrantedAuthority, preserving ROLE_ or adding it.
Frontend normalization accepts the four exact authorities and retains the five legacy
authorities, removes representation prefixes, and drops unknown values (including
EMPLOYEE). No private production token was obtained or logged. Existing normalization
of legacy representations and tenant/session validation remain intact.

LoadController reads have no explicit role matcher; the four finance roles gain only
load reads needed for load-scoped financial UI. This grants no dispatch/edit access.
Legacy operational resource grants are otherwise preserved. Finance guards use Refine
capabilities, never component-level role comparisons. Unknown role/resource/action
remains denied. Backend remains the final authorization authority.

## Rating preview extension — 2026-10-06

RatingController and SecurityConfig confirm POST `/api/loads/{id}/rating/preview` for ADMIN/ACCOUNTANT only. Add `rates / RATE_PREVIEW` without list/edit/accept/delete grants; Load tab and component both guard through Refine. This is the required new-feature action registration, not a matrix redesign or legacy role alias. Unknown and every other role stay denied; allowed/denied parity and component tests pass.

## Optimization extension — 2026-10-06

SecurityConfig confirms run/read/accept at `/api/optimization/runs/**` for ADMIN/DISPATCHER. Register only OPTIMIZATION_VIEW/RUN/ACCEPT; route and action guards preserve unknown/legacy/finance-only denial. Acceptance maps persisted actor server-side, revalidates complete HOS/evidence and assigns an existing Trip; no dispatch/edit/delete grant. All-authority matrix/nav parity and direct denied-mutation tests included.

## Fleet report extension — 2026-10-06

GET `/api/reports/fleet/health` (alias utilization-history) is matched by `/api/reports/fleet/**` and permits F: ADMIN, ACCOUNTANT, PAYROLL, PAYROLL_MANAGER. The separate `/api/fleet/**` matcher permits ADMIN/ACCOUNTANT/DISPATCHER for policy/evidence commands; that does not grant DISPATCHER the report. Register only `fleet-reports / FLEET_REPORT_VIEW`; route, page query and navigation use Refine capabilities. No editing/collection/actor grant introduced. Explicit report scope never adds a tenant header/query parameter. All-authority parity, navigation and page access tests prove fail-closed behavior.
