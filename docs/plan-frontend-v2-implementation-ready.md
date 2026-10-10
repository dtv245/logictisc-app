# LOGISTICSX — FRONTEND IMPLEMENTATION-READY SPECIFICATION

**File:** `plan-frontend-v2-implementation-ready.md`  
**Version:** 2.1 — Runtime/Plan Alignment 2026-10-06 / Screen-by-Screen Implementation Specification  
**Frontend:** React 18 + TypeScript 6 + Vite 8 + Refine v4 + Ant Design 5  
**Current audited branch:** `KAN-79-integrations-dang-nhap-bang-lark`  
**Current audited HEAD:** `0eb8bf6`  
**Primary factual input:** `docs/frontend-context-current.md`  
**Backend dependency:** `plan-convention-v3-implementation-ready.md` + runtime OpenAPI + `plan-progress-summary.md`

**Progress updated:** 2026-10-06 (Asia/Ho_Chi_Minh). Section 48 is the authoritative current execution matrix; section 49 mirrors task checkmarks. Acceptance/DoD lists describe requirements, not automatic completion.

**Current checkpoint:** Runtime/Plan Alignment 2026-10-06 COMPLETE: typecheck/lint/build PASS, **115 files / 633 tests PASS**, git diff --check PASS. Previous Profile checkpoint: 114 files / 629 tests PASS. This correction preserves all five recently DONE features, keeps genuine blockers fail-closed and makes Executive navigation dormant. Current verification is recorded in [progress](docs/plan-frontend-progress.md). Frontend-only scope; backend is read-only; the overall frontend plan remains NOT COMPLETE.

---

# 0. PURPOSE

This document replaces the generic planning layer with an **implementation-ready frontend execution specification**.

Every task below identifies:

```text
screen
existing files to preserve/modify
new files to create
hook/query behavior
endpoint contract
authorization
loading/error/empty/unavailable behavior
mutation invalidation
tests
acceptance criteria
backend dependency
```

The goal is to let either a human developer or an AI coding agent implement the frontend **without guessing architecture, ownership, fetching policy, state behavior, or business calculation responsibility**.

---

# 1. AUDITED CURRENT REPOSITORY — LOCKED BASELINE

## 1.1 Runtime architecture already exists and MUST be reused

Current runtime is:

```text
src/main.tsx
    ↓
src/App.tsx
    ↓
src/config/AppBootstrap.tsx
    ↓
RuntimeApplication
    ├── AuthSessionManager
    ├── createApiClient
    ├── createCurrentUserLoader
    ├── createAuthProvider
    ├── createAccessControlProvider
    ├── createLogisticsDataProvider
    ├── createFoundationResources
    └── AppRouter
```

Do not introduce a parallel runtime container.

---

## 1.2 Do-not-touch infrastructure

The following areas are stable and must not be redesigned during feature work:

```text
src/providers/api/
src/providers/permissions/roleMatrix.ts
src/providers/accessControlProvider.ts
src/features/executive/executive.queries.ts
src/features/executive/executive.metrics.ts
tenant resolution via JWT / currentUser boundary check
```

Allowed changes in these areas require a dedicated infrastructure task with regression proof.

Feature tasks must consume them, not replace them.

---

## 1.3 Actual source layout

Current source is already aligned with the desired shallow structure:

```text
src/
├── App.tsx
├── main.tsx
├── assets/
├── components/
├── config/
├── constants/
├── features/
├── formatters/
├── forms/
├── hooks/
├── locales/
├── pages/
├── providers/
├── router/
├── styles/
├── table/
├── tests/
├── types/
└── utils/
```

There is currently **no**:

```text
src/app
src/core
src/shared
src/common
```

Do not create these folders.

---

# 2. CURRENT QUALITY BASELINE

Latest verified checkpoint, 2026-10-06 after Runtime/Plan Alignment:

```text
npm run typecheck -> PASS
npm run lint      -> PASS
npm run test      -> PASS, 115 files / 633 tests
npm run build     -> PASS
git diff --check  -> PASS
```

The prior Profile checkpoint was 114 files / 629 tests PASS; this correction adds four route/resource regression tests without removing any existing test. The 2026-10-04 audit's 59 files / 302 tests and four Lark lint errors are historical. FE-BASE-001 and FE-FOUNDATION-001 are DONE; do not redo them. Preserve existing user/feature changes and all tests. All four gates passed after this correction. E2E remains blocked by identity/test environment.

---

# 3. NON-NEGOTIABLE FETCHING POLICY

The repository already follows the user's screen-scoped fetch rule.

Keep it.

## 3.1 Allowed

```text
screen mount -> fetch data required by that screen
tab open     -> fetch data required by that tab
explicit user action -> mutation / action request
filter change -> refetch that screen query
```

## 3.2 Forbidden

```text
startup prefetch of unrelated screens
cross-screen prefetch
fetch every resource on dashboard
fetch row detail for every table row
increase pageSize and aggregate company KPI client-side
```

## 3.3 Existing cache semantics

Reuse Refine/TanStack Query v4 query keys.

Mutation invalidation must be scoped.

Example:

```text
Trip driver assignment mutation
    invalidate:
      trip detail
      trip driver assignments
      trip list only if assignment summary is rendered there

    do NOT invalidate:
      customers
      payroll
      executive dashboard
```

unless business impact truly requires it.

---

# 4. TYPE STRATEGY — FIRST TECHNICAL FIX

The current repo has a real mismatch:

```text
DTO timestamp = ISO string
domain *.types.ts timestamp = Date
dataProvider = direct cast, no mapper
```

Therefore runtime objects may be strings even when TypeScript says `Date`.

This is the first cross-feature correctness task.

## FE-FOUNDATION-001 — Normalize transport/domain date representation

### Decision

For generic Refine resources, use:

```text
ISODate
ISODateTime
```

as strings in frontend DTO/domain contracts unless a dedicated mapper explicitly converts them.

Do not pretend the generic dataProvider returns JavaScript `Date`.

### Existing files to inspect/modify

```text
src/types/load.dto.ts
src/types/load.types.ts

src/types/trip.dto.ts
src/types/trip.types.ts

src/types/customer.dto.ts
src/types/customer.types.ts

src/types/invoice.dto.ts
src/types/invoice.types.ts

src/types/payment.dto.ts
src/types/payment.types.ts

src/types/terminal.dto.ts
src/types/terminal.types.ts

src/types/expense.dto.ts
src/types/expense.types.ts

src/types/common.types.ts
src/formatters/dateTime.ts
```

Do NOT modify `src/providers/dataProvider.ts` to add a giant mapping layer unless there is a separate architecture decision.

### Required result

Components receive real runtime types.

Dates are formatted through:

```text
src/formatters/dateTime.ts
```

rather than:

```ts
record.createdAt.getTime()
```

### Tests

Create/modify:

```text
src/tests/formatters/dateTime.test.ts
src/tests/types/load.contract.test.ts
src/tests/types/trip.contract.test.ts
```

Test:

```text
ISO timestamp remains string
invalid timestamp formatting fallback
date-only fields do not shift timezone
datetime fields format correctly
```

### Acceptance

```text
typecheck PASS
lint PASS
existing 302+ tests PASS
build PASS
```

---

# 5. RESOURCE STATUS — DO NOT REBUILD COMPLETE SCREENS

Current completed Operations/CRUD screens and accepted workflow slices remain enabled. Payroll reconciliation, Load Rating preview, Optimization and Fleet report are DONE. Profile, upload, global costs, Payroll list/profile, Rate list/history, Executive summary, Expense/Maintenance CRUD and Messaging remain dormant for the gaps in section 48.

Load business tabs, Settlement detail, Payslip current payment status and Executive integration are PARTIAL / BLOCKED_BACKEND. Preserve their valid read/workflow/foundation slices. A report aggregate or command-only API does not complete a missing object workflow or readable editor.

Do not rebuild existing complete screens or orphan Expense/Maintenance UI. Enable only a slice whose live contract and authorization are confirmed. `NOT_STARTED` describes unstarted work, never a known backend blocker.

---

# 6. EXISTING GENERIC RESOURCE FOUNDATION

Reuse:

```text
src/components/ResourceListPage.tsx
src/components/ResourceShowPage.tsx
src/components/ResourceCreateModal.tsx
src/components/ResourceEditModal.tsx
src/components/ActionButtons.tsx

src/components/resources/resourceCapabilities.ts
src/components/resources/resourceFilterControls.ts
src/components/resources/ResourceFormFields.tsx
src/components/resources/resourceForms.ts

src/table/BaseTable.tsx

src/pages/resourceConfig.ts
src/pages/resourceRegistry.ts
```

Generic CRUD is appropriate for simple master data.

Do not force workflow-heavy screens such as Settlement/Payroll/Optimization into generic CRUD templates.

---

# 7. ROUTING & RESOURCE REGISTRATION CONVENTION

Current routing ownership:

```text
src/constants/routes.ts
src/router/AppRouter.tsx
src/pages/index.ts
src/pages/resourceRegistry.ts
src/pages/resourceConfig.ts
```

Every new screen must update only the files required by its route/resource model.

## Resource-style screen

Example:

```text
shipment-costs
rate-rules
```

may be registered with Refine if backend exposes conventional resource endpoints.

## Workflow screen

Example:

```text
payroll
settlement
optimization
```

should use explicit routes/actions rather than pretending all workflow commands are CRUD.

---

# 8. GLOBAL NEW TYPES TO ADD

Create only when corresponding backend contract is ready:

```text
src/types/metric.types.ts
src/types/shipmentCost.dto.ts
src/types/accessorialCharge.dto.ts
src/types/profitability.dto.ts
src/types/driverPayPolicy.dto.ts
src/types/settlement.dto.ts
src/types/payroll.dto.ts
src/types/payslip.dto.ts
src/types/rateRule.dto.ts
src/types/optimization.dto.ts
src/types/fleetReport.dto.ts
```

Prefer DTO names that match backend contract.

Do not create a separate `Date`-based domain copy unless a real mapper exists.

---

# 9. GLOBAL REUSABLE UI TO ADD

Create only where reuse is real:

```text
src/components/MetricAvailabilityBadge.tsx
src/components/MetricValue.tsx
src/components/MoneyText.tsx
src/components/PercentText.tsx
src/components/AuditInfo.tsx
src/components/WorkflowActionBar.tsx
src/components/DomainErrorAlert.tsx
```

Keep business-specific UI in feature folders.

---

# 10. FE-BASE-001 — CLOSE CURRENT LARK LOGIN QUALITY GAP

### Existing modified files

```text
src/App.tsx
src/hooks/useLarkLogin.ts
src/locales/en.ts
src/locales/ja.ts
src/locales/vi.ts
src/pages/auth/LarkCallbackPage.tsx
src/pages/auth/LoginPage.tsx
src/providers/auth/sessionManager.ts
src/providers/authProvider.ts
src/types/auth.types.ts
src/types/authSession.types.ts
```

### Failing lint tests

```text
src/tests/pages/auth/LarkCallbackPage.test.tsx
src/tests/pages/auth/LoginPage.test.tsx
```

### Scope

Replace four `any` usages with real mock/provider types.

Do not alter auth behavior merely to satisfy lint.

### Tests

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### Done

All green.

---

# 11. FE-FOUNDATION-002 — PROFILE SCREEN

**Current status: BLOCKED_BACKEND (BE-021).** Required GET `/api/me` is absent from live OpenAPI/current controllers. Existing Profile implementation/tests and shared identity loader are retained; route and both menus remain dormant. Required response: subject, email, tenantId, roles, employeeId consistent with existing JWT/session checks. The shared loader dependency is not evidence that the backend endpoint exists. No JWT-decoding replacement or session bypass.

Do not issue a second `/api/me` request if the current identity/current-user hook already contains the required data.

## Files

Create:

```text
src/pages/profile/ProfilePage.tsx
src/features/profile/ProfileSummary.tsx
src/features/profile/profile.types.ts   # only view-specific type if needed
src/tests/pages/profile/ProfilePage.test.tsx
```

Modify:

```text
src/constants/routes.ts
src/router/AppRouter.tsx
src/pages/index.ts
src/components/appNavigation.tsx
src/locales/vi.ts
src/locales/en.ts
src/locales/ja.ts
```

## Hook

Reuse:

```text
src/hooks/useCurrentUser.ts
src/hooks/useCurrentTenant.ts
```

Do not create `useProfileData()` if it only calls these two hooks.

## UI

Display:

```text
email
subject/user id if appropriate
employeeId
tenant
roles
auth source/session context if already available and non-sensitive
```

No edit form unless backend provides profile mutation.

## Tests

```text
renders current user
renders tenant
renders role list
no extra /api/me duplicate request
handles missing employeeId
forbidden/session-expired state
```

---

# 12. FE-DOC-001 — DOCUMENT UPLOAD

Current contract mismatch:

```text
GET/DELETE /api/documents exists
POST /api/documents multipart is absent (BE-020)
Existing upload modal/hook/tests stay dormant until the final contract is verified
```

Do not modify generic dataProvider just for multipart.

## Files

Create:

```text
src/features/documents/DocumentUploadModal.tsx
src/features/documents/documents.api.ts
src/features/documents/useDocumentUpload.ts
src/tests/features/documents/DocumentUploadModal.test.tsx
src/tests/features/documents/useDocumentUpload.test.tsx
```

Modify:

```text
src/pages/documents/DocumentList.tsx       # or actual list page name
src/pages/documents/DocumentShow.tsx
src/components/resources/resourceCapabilities.ts
src/locales/vi.ts
src/locales/en.ts
src/locales/ja.ts
```

## API

Required future transport — BLOCKED_BACKEND, not runtime-confirmed:

```http
POST /api/documents
Content-Type: multipart/form-data
```

Use existing API client, not raw global axios.

Do not set multipart boundary manually.

## Form

Fields only if backend accepts them:

```text
file
document type
load
truck
employee
description/metadata
```

Inspect runtime OpenAPI before implementation.

## Mutation

On success invalidate:

```text
documents getList
relevant document getOne if needed
```

Do not invalidate unrelated resources.

## Tests

```text
builds FormData
sends file once
double-click guarded
server field error displayed
file-size/type validation only if backend/product rule exists
success invalidates documents list
```

---

# 13. EXISTING LOAD SCREEN — TARGETED EXTENSION, NOT REWRITE

Current route:

```text
/loads/*
```

Current files already exist under:

```text
src/pages/loads/
src/features/loads/
src/types/load.dto.ts
src/types/load.types.ts
```

## FE-LOAD-001 — Load Detail Business Tabs

### Goal

Extend show/detail experience to expose backend Phase 2/3 flow.

### Do not replace

```text
LoadList
LoadCreate
LoadEdit
existing CRUD actions
```

### Create feature components

```text
src/features/loads/LoadOverviewPanel.tsx
src/features/loads/LoadTimelinePanel.tsx
src/features/loads/LoadTripPanel.tsx
src/features/loads/LoadDocumentsPanel.tsx
src/features/loads/LoadExceptionsPanel.tsx
src/features/loads/LoadFinancialPanel.tsx
```

Modify actual Load Show page:

```text
src/pages/loads/LoadShow.tsx
```

(adapt name to actual file found in repo).

### Fetch policy

On page mount:

```text
GET /api/loads/{id}
```

Only when tab opens:

```text
Timeline     -> planned load timeline endpoint
Financial    -> planned load financial-summary/profitability endpoint
Exceptions   -> only if endpoint exists
Documents    -> /api/documents?loadId=...
```

No cross-tab prefetch.

### Planned contracts — verify runtime OpenAPI

```http
GET /api/loads/{id}/timeline
GET /api/loads/{id}/financial-summary
GET /api/loads/{id}/costs
```

If endpoint does not exist:

```text
do not call it
mark panel BLOCKED_BACKEND
```

### Tests

```text
base detail renders without fetching hidden tabs
opening documents fetches load documents
opening financial triggers one financial query
UNAVAILABLE metric not rendered as zero
switching tabs does not duplicate same request unnecessarily
```

---

# 14. EXISTING TRIP SCREEN — TARGETED EXTENSION

Current route:

```text
/trips/*
```

Existing files:

```text
src/pages/trips/
src/features/trips/
src/types/trip.dto.ts
src/types/trip.types.ts
```

## FE-TRIP-001 — Trip Detail Execution View

Create:

```text
src/features/trips/TripDriverAssignments.tsx
src/features/trips/TripMileageSummary.tsx
src/features/trips/TripStopsTimeline.tsx
src/features/trips/TripStopActions.tsx
src/features/trips/tripExecution.api.ts
src/features/trips/useTripDriverAssignments.ts
src/features/trips/useTripStopActions.ts
```

Modify:

```text
Trip Show page
src/locales/*
```

### Planned backend contracts — verify OpenAPI

```http
GET  /api/trips/{tripId}/drivers
POST /api/trips/{tripId}/drivers
POST /api/trips/{tripId}/drivers/{assignmentId}/unassign

POST /api/trip-stops/{id}/arrive
POST /api/trip-stops/{id}/start-service
POST /api/trip-stops/{id}/complete-service
POST /api/trip-stops/{id}/depart
```

### Driver assignment UI

Show:

```text
driver
role
effectiveFrom
effectiveTo
active/ended
```

Never show generic delete action.

Use:

```text
Unassign
```

with `ConfirmActionModal`.

### Mileage UI

Show four fields separately:

```text
plannedDistanceMiles
actualDistanceMiles
loadedMiles
emptyMiles
```

Do not relabel legacy `totalDistance` as actual mileage.

### Stop actions

State → action:

```text
PENDING/EN_ROUTE -> Arrive
ARRIVED          -> Start service
SERVICE_STARTED  -> Complete service
SERVICE_COMPLETED-> Depart
DEPARTED         -> read-only
```

Do not offer status dropdown.

### Invalidation

Assignment mutation:

```text
trip drivers query
trip detail query if assignment summary exists
```

Stop mutation:

```text
trip detail
trip stops
load timeline only if it is currently mounted and shares data
```

### Tests

```text
unassign does not call DELETE
state action matrix
button hidden/disabled for invalid transition
409 maps to business error
driver assignment history remains visible after unassign
mileage null shown as unavailable
```

---

# 15. FE-COST-001 — SHIPMENT COST LIST

**Backend dependency:** Phase 3 shipment cost contract must be runtime-confirmed.

## Route

Planned:

```text
/finance/shipment-costs
```

## New files

```text
src/pages/shipment-costs/ShipmentCostList.tsx
src/pages/shipment-costs/ShipmentCostShow.tsx

src/features/shipment-costs/shipmentCost.api.ts
src/features/shipment-costs/shipmentCost.query.ts
src/features/shipment-costs/shipmentCost.columns.tsx
src/features/shipment-costs/ShipmentCostFilters.tsx
src/features/shipment-costs/ShipmentCostSummary.tsx
src/features/shipment-costs/ShipmentCostStatusTag.tsx

src/types/shipmentCost.dto.ts

src/tests/features/shipment-costs/shipmentCost.query.test.tsx
src/tests/pages/shipment-costs/ShipmentCostList.test.tsx
src/tests/pages/shipment-costs/ShipmentCostShow.test.tsx
```

Modify:

```text
src/constants/routes.ts
src/router/AppRouter.tsx
src/pages/index.ts
src/pages/resourceRegistry.ts       # only if resource-style registration is appropriate
src/components/appNavigation.tsx
src/providers/permissions/roleMatrix.ts  # ONLY when backend capability/role contract is confirmed
src/locales/*
```

### Planned endpoint — verify OpenAPI

Preferred:

```http
GET /api/shipment-costs
GET /api/shipment-costs/{id}
```

Possible filters:

```text
loadId
tripId
category
costBasis
status
sourceType
currency
from
to
page
pageSize
```

Only send filters runtime backend supports.

### Columns

```text
Date
Load
Trip
Category
Cost Basis
Workflow Status
Source
Allocation
Amount
Currency
```

### Critical semantic

Separate:

```text
costBasis:
ESTIMATE | ACCRUAL | ACTUAL
```

from:

```text
status:
DRAFT | VERIFIED | APPROVED | POSTED | VOIDED
```

Never render them as one “Stage”.

### Actions

Only expose actions that backend explicitly provides:

```text
verify
approve
post
void
```

No client-side status mutation.

### Tests

```text
basis/status are separate
filters serialize only supported fields
currency rendered
voided cost visual
no fake zero
permission hides financial actions
```

---

# 16. FE-ACCESSORIAL-001 — ACCESSORIAL CHARGES

## Placement

Primary access points:

```text
Load detail
Trip/Stop detail
optional dedicated finance list if backend supports it
```

## Files

```text
src/features/accessorials/accessorial.api.ts
src/features/accessorials/accessorial.query.ts
src/features/accessorials/AccessorialChargesTable.tsx
src/features/accessorials/AccessorialChargeDetail.tsx
src/features/accessorials/AccessorialApprovalActions.tsx
src/types/accessorialCharge.dto.ts

src/tests/features/accessorials/AccessorialChargesTable.test.tsx
src/tests/features/accessorials/AccessorialApprovalActions.test.tsx
```

Optional dedicated page:

```text
src/pages/accessorials/AccessorialList.tsx
```

only if product/backend provides global list use case.

### Planned contract — verify

```http
GET /api/loads/{loadId}/accessorial-charges
GET /api/trips/{tripId}/accessorial-charges
POST /api/accessorial-charges/{id}/approve
```

Do not invent path if OpenAPI differs.

### UI fields

```text
Type
Occurred At
Dwell Time
Free Time
Chargeable Time
Customer Amount
Company Cost Amount
Driver Pay Amount
Currency
Status
Document/Evidence
```

Three money dimensions are mandatory and must not be merged.

### Tests

```text
three amounts remain distinct
missing driver pay not inferred from customer charge
approve action permission
backend validation error
detention reason/policy displayed when supplied
```

---

# 17. FE-PROFIT-001 — PROFITABILITY SCREEN

**Backend dependency:** Profitability endpoint must be runtime-confirmed after BE Phase 3.

## Route

```text
/finance/profitability
```

## Files

```text
src/pages/profitability/ProfitabilityPage.tsx

src/features/profitability/profitability.api.ts
src/features/profitability/profitability.query.ts
src/features/profitability/ProfitabilityFilters.tsx
src/features/profitability/ProfitabilitySummary.tsx
src/features/profitability/ProfitabilityBreakdownTable.tsx
src/features/profitability/ProfitabilityMetricCard.tsx

src/types/profitability.dto.ts

src/tests/features/profitability/ProfitabilitySummary.test.tsx
src/tests/features/profitability/ProfitabilityBreakdownTable.test.tsx
src/tests/pages/profitability/ProfitabilityPage.test.tsx
```

Modify:

```text
routes
router
navigation
locales
```

### Planned endpoint — verify

Preferred reporting contract:

```http
GET /api/reports/profitability/by-load
GET /api/reports/profitability/by-truck
GET /api/reports/profitability/by-customer
```

or an equivalent backend reporting endpoint.

Do not implement three calls if backend exposes one scope-driven endpoint.

### Filters

Only supported server filters:

```text
from/to
currency
customerId
truckId
loadId
```

### Summary

```text
Revenue
Variable Cost
Allocated Fixed Cost
Contribution Margin
Allocated Profit
Margin %
RPM
CPM
Break-even Rate
```

### Availability

Must consume backend status/reason.

Examples:

```text
UNCLASSIFIED_COST
MISSING_ACTUAL_MILES
REVENUE_UNAVAILABLE
```

Do not calculate a replacement value in frontend.

### Breakdown

```text
Category
Cost Behavior
Amount
Share
Source
```

Behavior:

```text
VARIABLE
FIXED_ALLOCATABLE
EXCLUDED
UNCLASSIFIED
```

`UNCLASSIFIED` must display warning.

### Tests

```text
AVAILABLE
PARTIAL
UNAVAILABLE
zero revenue
unclassified cost warning
currency mismatch error
filter refetch
no client financial re-aggregation
```

---

# 18. EXECUTIVE DASHBOARD — TARGETED INTEGRATION ONLY

Current Executive foundation is retained, but FE-DASH-001 is PARTIAL / BLOCKED_BACKEND (BE-031). GET `/api/reports/executive-summary` is absent; legacy report parameters/DTOs differ. Executive rendering and menus remain dormant; `/dashboard` redirects to Operations for existing return targets.

Do not rewrite:

```text
src/features/executive/executive.queries.ts
src/features/executive/executive.metrics.ts
```

The retained query foundation describes six legacy report calls and unavailable semantics. These are intended contracts, not current runtime compatibility. Do not compose monthly financial/Fleet/other reports into a fabricated executive-summary.

## FE-DASH-001 — Integrate newly available backend metrics only

When backend starts returning previously unavailable data:

```text
fleetUtilization
loadedMiles
DIFOT
unplannedDowntime
breakdownsPer100kMiles
operatingMargin/profitability if contract is extended
```

modify only presentation/DTO contract required.

Do not compute:

```text
deadhead = 100 - loadedMiles
operatingMargin
revenueGrowth
```

unless backend contract explicitly returns them or product approves frontend derivation.

### Tests

Extend existing executive tests:

```text
real value replaces unavailable state
unavailable still works
target provenance unchanged
open/closed period behavior unchanged
VND display remains correct
```

---

# 19. FE-SETTLEMENT-001 — DRIVER PAY POLICY

**Backend dependency:** Driver Pay Policy API runtime-confirmed.

## Route

Planned:

```text
/settlements/policies
```

## Files

```text
src/pages/settlements/DriverPayPolicyList.tsx
src/pages/settlements/DriverPayPolicyShow.tsx

src/features/settlements/driverPayPolicy.api.ts
src/features/settlements/driverPayPolicy.query.ts
src/features/settlements/DriverPayPolicyForm.tsx
src/features/settlements/DriverPayPolicyVersionHistory.tsx

src/types/driverPayPolicy.dto.ts

src/tests/features/settlements/DriverPayPolicyForm.test.tsx
src/tests/pages/settlements/DriverPayPolicyList.test.tsx
```

### Planned endpoints — verify

```http
GET  /api/driver-pay-policies
POST /api/driver-pay-policies
POST /api/driver-pay-policies/{id}/new-version
```

### Fields

```text
policyCode
name
driver/default scope
payMethod
rate fields
mileageBasis
revenueBasis
detention config
currency
effectiveFrom
effectiveTo
version
active
```

### UX

Existing historical version is read-only.

Primary edit action:

```text
Create New Version
```

not in-place overwrite.

### Tests

```text
historical policy cannot edit
new-version request
percentage is displayed as percent but transport remains ratio
effective dates remain date-only
unsupported pay method rejected by frontend enum only if contract is confirmed
```

---

# 20. FE-SETTLEMENT-002 — SETTLEMENT LIST

## Route

```text
/settlements
```

## Files

```text
src/pages/settlements/SettlementList.tsx
src/features/settlements/settlement.api.ts
src/features/settlements/settlement.query.ts
src/features/settlements/settlement.columns.tsx
src/features/settlements/SettlementFilters.tsx
src/types/settlement.dto.ts
src/tests/pages/settlements/SettlementList.test.tsx
```

### Planned endpoint — verify

```http
GET /api/driver-settlements
```

Filters:

```text
payPeriodId
driverId
status
settlementType
currency
page
pageSize
```

### Columns

```text
Settlement #
Driver
Pay Period
Type
Status
Gross
Deductions
Reimbursements
Net
Currency
Last Updated/Calculated
```

Types:

```text
ORIGINAL
ADJUSTMENT
REVERSAL
```

### Tests

```text
pagination
filter serialization
type labels
status labels
money formatting
no edit button for locked/paid
permission behavior
```

---

# 21. FE-SETTLEMENT-003 — SETTLEMENT DETAIL & WORKFLOW

## Route

```text
/settlements/:id
```

## Files

```text
src/pages/settlements/SettlementShow.tsx

src/features/settlements/SettlementSummary.tsx
src/features/settlements/SettlementLinesTable.tsx
src/features/settlements/SettlementSourceWork.tsx
src/features/settlements/SettlementAudit.tsx
src/features/settlements/SettlementAdjustments.tsx
src/features/settlements/SettlementActions.tsx
src/features/settlements/useSettlementActions.ts

src/tests/pages/settlements/SettlementShow.test.tsx
src/tests/features/settlements/SettlementActions.test.tsx
src/tests/features/settlements/useSettlementActions.test.tsx
```

### Current confirmed endpoints — 2026-10-06

```http
GET  /api/driver-settlements/{id}
POST /api/driver-settlements/{id}/submit-review
POST /api/driver-settlements/{id}/approve
POST /api/driver-settlements/{id}/lock
POST /api/driver-settlements/{id}/require-validation
POST /api/driver-settlements/{id}/resolve-validation
POST /api/driver-settlements/{id}/adjustments
POST /api/driver-settlements/{id}/reversal
```

**PARTIAL / BLOCKED_BACKEND (BE-025)** for full planned acceptance. No reject, generic recalculate or settlement payment command exists. POST `/{id}/recalculate-revenue` has distinct evidence-based revenue semantics; it must not be relabelled generic Settlement recalculation. Payment belongs to PayrollItem. Retain only confirmed UI commands; no aliases or invented audit history.

### Tabs

```text
Summary
Lines
Source Work
Adjustments
Audit
```

### Workflow matrix

```text
CALCULATED          -> Submit Review / Require Validation
VALIDATION_REQUIRED -> Resolve Validation
IN_REVIEW           -> Approve / Require Validation
APPROVED            -> Lock / Require Validation
LOCKED/PAID         -> Immutable Adjustment / Reversal where authorized
```

Initial calculation is the confirmed POST `/api/driver-settlements/calculate` entry. No payment action or arbitrary status mutation is offered on Settlement detail.

Frontend never sends arbitrary status.

### Hook behavior

`useSettlementActions` owns:
- action mutation;
- single-flight;
- confirmation;
- domain error mapping;
- scoped invalidation.

It does NOT calculate settlement amounts.

### Invalidation

On successful action:

```text
settlement getOne
settlement list
payroll candidate query only if mounted/relevant
```

### Tests

```text
action visibility by status
action visibility by permission
LOCKED has no edit mutation
409 conflict displays domain message
double click sends one request
successful action refetches settlement
```

---

# 22. FE-SETTLEMENT-004 — ADJUSTMENT / REVERSAL UX

## Files

```text
src/features/settlements/CreateAdjustmentModal.tsx
src/features/settlements/AdjustmentHistory.tsx
src/tests/features/settlements/CreateAdjustmentModal.test.tsx
```

### Planned contract — verify

Prefer explicit endpoint such as:

```http
POST /api/driver-settlements/{id}/adjustments
```

or the backend's actual command endpoint.

### Form

```text
reason
lineClass
lineType
load/trip/source
quantity
rate
amount
document/evidence if supported
```

Do not allow direct edit of original locked line.

### Tests

```text
original remains immutable
adjustment links parent
required reason
server validation mapping
currency preserved
```

---

# 23. FE-PAYROLL-001 — PAYROLL RUN LIST

**Current status: BLOCKED_BACKEND (BE-026).** No collection GET `/api/payroll-runs` or `/api/payroll/runs` exists. Confirmed calculate/detail/workflow supports FE-PAYROLL-002 explicit entry only; do not enumerate IDs/periods or fake pagination. **Backend note:** schema may already exist even when logic is incomplete. Frontend implementation must depend on API readiness, not schema existence.

## Route

```text
/payroll
```

## Files

```text
src/pages/payroll/PayrollRunList.tsx
src/features/payroll/payroll.api.ts
src/features/payroll/payroll.query.ts
src/features/payroll/payroll.columns.tsx
src/features/payroll/PayrollFilters.tsx
src/types/payroll.dto.ts
src/tests/pages/payroll/PayrollRunList.test.tsx
```

### Planned endpoint — verify

```http
GET /api/payroll-runs
```

### Columns

```text
Payroll #
Pay Period
Status
Driver Count
Gross
Tax
Deductions
Reimbursements
Net
Currency
Payment Progress
```

### Critical status semantic

`LOCKED` must never be labelled "Paid".

### Tests

```text
locked != paid label
payment progress
currency display
status filters
pagination
permission
```

---

# 24. FE-PAYROLL-002 — PAYROLL DETAIL

## Route

```text
/payroll/:id
```

## Files

```text
src/pages/payroll/PayrollRunShow.tsx

src/features/payroll/PayrollSummary.tsx
src/features/payroll/PayrollItemsTable.tsx
src/features/payroll/PayrollValidationPanel.tsx
src/features/payroll/PayrollPaymentsPanel.tsx
src/features/payroll/PayrollAuditPanel.tsx
src/features/payroll/PayrollActions.tsx
src/features/payroll/usePayrollActions.ts

src/tests/pages/payroll/PayrollRunShow.test.tsx
src/tests/features/payroll/PayrollActions.test.tsx
```

### Planned endpoints — verify

```http
GET  /api/payroll-runs/{id}
POST /api/payroll-runs/{id}/calculate
POST /api/payroll-runs/{id}/validate
POST /api/payroll-runs/{id}/approve
POST /api/payroll-runs/{id}/lock
POST /api/payroll-runs/{id}/mark-paid   # only if backend really supports manual workflow
```

Payment execution should normally have explicit payment/reconciliation endpoint.

### Tabs

```text
Drivers
Validation
Payments
Audit
```

### Action state matrix

```text
DRAFT              -> Calculate
CALCULATED         -> Review/Validate
VALIDATION_REQUIRED-> Resolve
REVIEWED           -> Approve
APPROVED           -> Lock
LOCKED             -> Schedule Payments
PROCESSING_PAYMENT -> Monitor
PAYMENT_FAILED     -> Retry/Reconcile permitted payments
PAID               -> Read-only
```

### Tests

```text
VALIDATION_REQUIRED issues shown
approve hidden without capability
locked cannot recalculate
payment failed shows retry/reconcile
paid is read-only
```

---

# 25. FE-PAYROLL-003 — MULTI-JURISDICTION PAYROLL PROFILE

**Current status: BLOCKED_BACKEND (BE-026).** PayrollConfigurationController has append/PUT commands only; authoritative current profile/history/configuration/policy reads are absent. Keep editors dormant; do not invent defaults. Existing item resolution evidence is read-only, not a completed profile editor.

## Product requirement

Payroll is multi-jurisdiction.

Never hard-code UI label `State` for all countries.

## Files

```text
src/features/payroll/PayrollJurisdictionSummary.tsx
src/features/payroll/PayrollJurisdictionForm.tsx
src/features/payroll/WorkerClassificationTag.tsx
src/features/payroll/PayrollPolicyResolution.tsx
src/types/payrollJurisdiction.dto.ts    # create if backend contract separates it

src/tests/features/payroll/PayrollJurisdictionForm.test.tsx
src/tests/features/payroll/PayrollPolicyResolution.test.tsx
```

### Generic fields

```text
countryCode
subdivisionCode
localityCode
workerClassification
resolutionSource
policyCode
policyVersion
```

Resolution source:

```text
WORK_OVERRIDE
EMPLOYEE_PROFILE
TENANT_DEFAULT
```

### Missing jurisdiction

Backend code:

```text
PAYROLL_JURISDICTION_NOT_CONFIGURED
```

UI:

```text
Validation Required
Jurisdiction not configured
```

Never:

```text
tax = 0
```

### Tests

```text
country without subdivision
country with subdivision
locality optional
employee/contractor rendering
missing jurisdiction blocker
date-effective policy version
```

---

# 26. FE-PAYROLL-004 — PAYSLIP

**Current status: PARTIAL / BLOCKED_BACKEND (BE-028).** Own list/detail/PDF is confirmed and enabled. Current employee-owned payment status is absent; finance-only PayrollItem payments cannot serve DRIVER. Preserve unavailable payment display; issuance does not imply PAID.

## Routes

Admin/finance:

```text
/payslips/:id
```

Driver self-service:

```text
/profile/payslips
```

or route matching current navigation model.

## Files

```text
src/pages/payslips/PayslipShow.tsx
src/pages/payslips/MyPayslipsPage.tsx

src/features/payslips/payslip.api.ts
src/features/payslips/payslip.query.ts
src/features/payslips/PayslipSummary.tsx
src/features/payslips/PayslipEarningsTable.tsx
src/features/payslips/PayslipPaymentStatus.tsx

src/types/payslip.dto.ts

src/tests/pages/payslips/MyPayslipsPage.test.tsx
src/tests/pages/payslips/PayslipShow.test.tsx
```

### Planned endpoints — verify

```http
GET /api/driver/me/payslips
GET /api/payslips/{id}
GET /api/payslips/{id}/pdf
```

### Display

```text
Pay Period
Gross
Taxes
Deductions
Reimbursements
Net
Payment Status
Jurisdiction summary
Issued At
```

### Security

Driver can only access own payslips.

Frontend guard is UX only; backend remains final authority.

### Tests

```text
driver own list
forbidden other payslip
locked/final payslip is read-only
PDF link action
payment status distinct from payslip issuance
```

---

# 27. FE-PAYROLL-005 — PAYROLL PAYMENT & RECONCILIATION

## Files

```text
src/features/payroll/PayrollPaymentTable.tsx
src/features/payroll/PayrollPaymentDetail.tsx
src/features/payroll/PayrollPaymentActions.tsx
src/tests/features/payroll/PayrollPaymentActions.test.tsx
```

### States

```text
PENDING
SCHEDULED
PROCESSING
SUCCEEDED
FAILED
RETRY_SCHEDULED
```

### UI

Show:

```text
provider
masked reference
scheduledAt
paidAt
failureCode
failureMessage
```

Sensitive bank data masked.

### Tests

```text
SUCCEEDED has no retry
FAILED can retry only with permission
duplicate click single-flight
manual reconciliation confirm
locked payroll not automatically paid
```

---

# 28. FE-RATE-001 — RATE RULE LIST & VERSIONING

**Current status: BLOCKED_BACKEND.** Runtime `/api/rating` has authoring/version creation and reads by explicit ID/version, but no collection/history query suitable for acceptance (BE-031 rating scope). Keep list/history dormant; no ID enumeration or client history reconstruction. FE-RATE-002 remains DONE independently.

## Route

```text
/rates
```

## Files

```text
src/pages/rates/RateRuleList.tsx
src/pages/rates/RateRuleShow.tsx

src/features/rates/rateRule.api.ts
src/features/rates/rateRule.query.ts
src/features/rates/rateRule.columns.tsx
src/features/rates/RateRuleForm.tsx
src/features/rates/RateRuleVersionHistory.tsx
src/types/rateRule.dto.ts

src/tests/pages/rates/RateRuleList.test.tsx
src/tests/features/rates/RateRuleForm.test.tsx
```

### Planned endpoints — verify

```http
GET  /api/rate-rules
POST /api/rate-rules
POST /api/rate-rules/{id}/new-version
```

### Fields

```text
ruleCode
customer
method
baseRate
min
max
currency
effectiveFrom
effectiveTo
version
active
```

### Tests

```text
version history
historical version read-only
money/currency
date-only semantics
customer lookup
```

---

# 29. FE-RATE-002 — FSC POLICY & PREVIEW

## Files

```text
src/features/rates/FscPolicyFields.tsx
src/features/rates/FscPreview.tsx
src/tests/features/rates/FscPolicyFields.test.tsx
src/tests/features/rates/FscPreview.test.tsx
```

### Current supported FSC display type

```text
INDEX_BASED_MPG (confirmed V1)
```

Other hypothetical FSC methods are not exposed. Backend linehaul supports FLAT/PER_MILE; do not confuse that with FSC method support.

Do not call one method “industry standard”.

### Preview

Use backend preview endpoint if provided.

Do not calculate authoritative FSC locally.

Confirmed runtime endpoint:

```http
POST /api/loads/{id}/rating/preview
```

FE-RATE-002 is DONE; preserve authoritative preview and ADMIN/ACCOUNTANT authorization.

---

Runtime alignment 2026-10-06: actual preview is POST `/api/loads/{id}/rating/preview`. Confirmed V1 supports INDEX_BASED_MPG; policy fields are read-only in the Load preview, and other methods are not fabricated. FE-RATE-001 collection/history remains blocked independently.

---

# 30. FE-OPT-001 — OPTIMIZATION RUN SCREEN

## Route

```text
/optimization
```

## Files

```text
src/pages/optimization/OptimizationPage.tsx
src/pages/optimization/OptimizationRunShow.tsx

src/features/optimization/optimization.api.ts
src/features/optimization/optimization.query.ts
src/features/optimization/OptimizationRunForm.tsx
src/features/optimization/OptimizationCandidateTable.tsx
src/features/optimization/OptimizationCandidateDrawer.tsx
src/features/optimization/OptimizationActions.tsx

src/types/optimization.dto.ts

src/tests/pages/optimization/OptimizationPage.test.tsx
src/tests/features/optimization/OptimizationCandidateTable.test.tsx
src/tests/features/optimization/OptimizationCandidateDrawer.test.tsx
```

### Planned endpoints — verify

```http
POST /api/optimization/runs
GET  /api/optimization/runs/{id}
POST /api/optimization/runs/{id}/assignments/{candidateId}/accept
```

Use actual backend paths.

### Candidate columns

```text
Rank
Driver
Truck
Load
Feasible
Deadhead
ETA Pickup
ETA Delivery
HOS
Estimated Revenue
Estimated Cost
Estimated Margin
Final Score
```

### Infeasible

Do not hide by default if explainability is a product requirement.

Display reason.

### Tests

```text
infeasible candidate cannot accept
feasibility reason
ranking
score component drawer
single accept mutation
selected candidate state
```

---

# 31. FE-OPT-002 — OPTIMIZATION EXPLAINABILITY

Drawer must show backend-provided:

```text
raw value
normalized score
weight
weighted contribution
policy version
```

for each component.

Never reverse-engineer normalized score client-side.

Tests:

```text
component rendering
missing component safely handled
policy version visible
final score matches response display
```

---

Runtime alignment 2026-10-06: actual run/read/accept use `/api/optimization/runs`; accept assigns existing Trip after revalidation, never dispatches. Immutable Outcome includes pickup ETA only; no delivery ETA or prior-acceptance GET is fabricated. Current acceptance display comes from the real command response, and backend conflict checks remain authoritative after a fresh session.

---

# 32. FE-FLEET-001 — FLEET REPORT PAGE

## Route

```text
/reports/fleet
```

## Files

```text
src/pages/fleet/FleetReportPage.tsx
src/features/fleet/fleetReport.api.ts
src/features/fleet/fleetReport.query.ts
src/features/fleet/FleetKpiGrid.tsx
src/features/fleet/FleetUtilizationChart.tsx
src/features/fleet/FleetHealthTable.tsx
src/types/fleetReport.dto.ts

src/tests/pages/fleet/FleetReportPage.test.tsx
src/tests/features/fleet/FleetKpiGrid.test.tsx
```

### Current confirmed report endpoints

```http
GET /api/reports/fleet/health
GET /api/reports/fleet/utilization-history
```

FE-FLEET-001 is DONE for explicit policy/trucks/date-range/zone and FleetHistory.Report KPI/coverage. No time-series contract exists. GET `/api/reports/executive-summary` remains absent; do not couple Fleet completion to FE-DASH-001.

### Metrics

```text
Fleet Utilization
Loaded Miles
Deadhead if contract exists
Unplanned Downtime
PM Compliance
Maintenance Cost / Mile
Breakdowns / 100k
```

Current backend gaps must remain unavailable.

### Tests

```text
NO_AVAILABILITY_HISTORY
NO_TOTAL_MILES_SOURCE
NO_DOWNTIME_INTERVALS
NOT_IMPLEMENTED
real PM compliance
real maintenance cost/mile
```

---


### Runtime alignment — 2026-10-06 (FE-FLEET-001)

Current GET `/api/reports/fleet/health` (alias utilization-history) returns FleetHistory.Report for explicit `policyId`, distinct `truckIds` (maximum 200), and a half-open LocalDate period (`firstDate`, `exclusiveLastDate`) plus `businessZoneId`. Actual report contains policy versions, one selected-period metric set and per-truck coverage; it does not return a chart time series. The frontend uses direct Refine useCustom and coverage table rather than inventing historical chart points or an unnecessary query wrapper. `/api/reports/executive-summary` remains absent; legacy dashboard report DTO/parameter compatibility is separately BE-031, not a Fleet task completion claim.

Actual utilization code is `FLEET_UTILIZATION_PERCENT`. Loaded miles and deadhead have different authoritative denominators. Current health gaps use `DOWNTIME_INTERVAL_SOURCE_UNAVAILABLE`, `HISTORICAL_PM_DUE_OCCURRENCES_UNAVAILABLE`, `COMPLETE_MAINTENANCE_COST_COVERAGE_UNAVAILABLE` and `BREAKDOWN_CLASSIFICATION_UNAVAILABLE`; the older example codes above are not production assumptions. Backend AVAILABLE/PARTIAL/UNAVAILABLE/NOT_APPLICABLE values are preserved, monetary unit has no invented currency, and no metric is calculated from current truck status.


# 33. FE-EXPENSE-001 — EXPENSE PAGE ACTIVATION

Current UI exists but runtime is blocked because backend CRUD is absent.

Do not rebuild page.

When backend controller is ready:

### Inspect/reuse

```text
src/pages/expenses/
src/features/expenses/
src/types/expense.dto.ts
src/types/expense.types.ts
```

### Activate

Modify:

```text
src/pages/resourceRegistry.ts
src/pages/index.ts
src/components/appNavigation.tsx
resource capability/filter/form definitions
roleMatrix only if backend permission contract confirmed
```

### Backend dependency

Current blocker:

```text
BE-016
```

### Tests

Add only integration/resource activation tests:

```text
resource appears when enabled
GET list
create/edit if backend supports
filter contract
permissions
```

---

# 34. FE-MAINT-001 — MAINTENANCE PAGE ACTIVATION

Same principle as expenses.

Reuse current orphan UI.

Do not rebuild.

Backend dependency:

```text
BE-016
```

After runtime endpoint exists:
- register resource;
- align filters;
- align DTO;
- test list/create/edit/show;
- update navigation.

---

# 35. FE-MSG-001 — CONVERSATION ADAPTER

Current backend path:

```text
/api/messages/conversations
```

does not fit generic resource semantics.

Do not force it into generic dataProvider.

## Files

When backend auth contract is ready:

```text
src/features/conversations/conversations.api.ts
src/features/conversations/conversations.query.ts
```

Use existing API client.

Build workflow-specific hooks.

Do not modify generic dataProvider.

---

# 36. NOTIFICATIONS — TARGETED COMPLETION

Current screen is partial.

Existing endpoint:

```http
GET /api/notifications
```

Before adding mark-read action:
- verify backend endpoint;
- add action hook;
- invalidate notification list + header unread badge only.

Do not refetch whole shell resources.

---

# 37. OPERATIONS DASHBOARD — PRESERVE CURRENT BEHAVIOR

Current:

```text
GET /api/trucks?pageSize=100
GET /api/loads?pageSize=1
GET /api/trips?pageSize=1
```

with 30-second freshness behavior.

Do not rewrite this screen as part of financial/payroll work.

If future tracking endpoint replaces truck list:
- create a dedicated migration task;
- prove map behavior and polling regression.

---

# 38. ACCESS CONTROL IMPLEMENTATION RULE

Current role matrix is fail-closed and stable.

Do not invent frontend-only permissions.

For new resources:

1. inspect backend authorities/roles;
2. document mapping;
3. update role matrix;
4. add `CanAccess`/route boundary;
5. add action-level permission tests.

If backend does not define permission yet:

```text
BLOCKED_AUTHORIZATION
```

Do not add resource to menu for everyone.

---

# 39. NAVIGATION TARGET — ONLY ENABLE READY FEATURES

Logical target:

```text
Executive Dashboard   [dormant, BE-031]
Operations            [enabled]

Operations
  Loads
  Trips

Fleet
  Trucks
  Maintenance        [when backend ready]
  Fleet Reports

People
  Employees
  Drivers             [when dedicated screen exists]

Finance
  Invoices
  Payments
  Expenses            [when backend ready]
  Shipment Costs      [global list/detail dormant, BE-023]
  Profitability

Driver Pay
  Pay Policies
  Settlements
  Payroll             [confirmed calculate/open/detail only; collection dormant]
  Payslips

Pricing
  Rate Rules          [collection/history dormant; Load preview DONE]

Optimization
  Optimization Runs

System
  Documents
  Notifications
  Profile             [dormant, BE-021]
```

Menu must not expose dead routes.

---

# 40. DOMAIN ERROR MAPPING

Create feature-level mapping, not a universal switch full of business rules.

Reusable component:

```text
src/components/DomainErrorAlert.tsx
```

Possible code translations:

```text
CURRENCY_MISMATCH
SETTLEMENT_ALREADY_LOCKED
INVALID_SETTLEMENT_TRANSITION
PAYROLL_ALREADY_LOCKED
INVALID_PAYROLL_TRANSITION
PAYROLL_JURISDICTION_NOT_CONFIGURED
PAYMENT_ALREADY_SUCCEEDED
HOS_INFEASIBLE
```

Use backend `code` from existing normalized API error.

Fallback:
- localized generic message;
- requestId shown for support if available.

---

# 41. I18N REQUIREMENTS

Current locales:

```text
vi
en
ja
```

Every new screen must add keys to all three files in same task:

```text
src/locales/vi.ts
src/locales/en.ts
src/locales/ja.ts
```

Do not merge feature with missing locale keys.

Tests should avoid brittle translated full-sentence assertions when a semantic role/test-id is better.

---

# 42. FORM CONVENTION — MATCH CURRENT REPO

Current:

```text
useForm
useModalForm
ResourceFormFields
FormGrid
applyBackendFieldErrors
useDiscardConfirm
ConfirmActionModal
```

Reuse these.

Do not create a second form framework.

Workflow forms may use explicit AntD Form when generic resource form is not appropriate.

Always reuse:

```text
src/forms/backendFieldErrors.ts
```

for backend field validation.

---

# 43. ASYNC STATES

Current reusable state components already exist:

```text
AsyncState
EmptyState
QueryErrorState
FullPageLoader
```

New features must use them or the exact current equivalent.

Distinguish:

```text
loading
request error
empty collection
metric unavailable
permission denied
business validation required
```

Do not map all to `Empty`.

---

# 44. MONEY

Current formatter:

```text
src/formatters/money.ts
```

uses Decimal.js.

Reuse.

Current dashboard display currency is VND.

Do not globally change currency to USD.

New financial screens render each record's backend currency.

Do not sum mixed currencies client-side.

---

# 45. DATE/TIME

Reuse:

```text
src/formatters/dateTime.ts
```

Rules:

```text
ISO datetime -> format display
date-only effective date -> no timezone shifting
```

Do not create `new Date()` in random components if existing formatter handles semantics.

---

# 46. STATUS TONES

Current mapping:

```text
src/components/statusTone.ts
src/components/StatusTag.tsx
```

Extend centrally only when new statuses require it.

Do not hard-code colors per feature.

Important new states:

```text
LOCKED
VALIDATION_REQUIRED
PAYMENT_SCHEDULED
PROCESSING_PAYMENT
PAYMENT_FAILED
VOIDED
VERIFIED
POSTED
```

Tests:
- semantic tone;
- text translation;
- status remains accessible without relying only on color.

---

# 47. RUNTIME VALIDATION STRATEGY

Current envelope validation is strong; inner DTO validation is incomplete.

Do not attempt to add Zod schemas for every legacy endpoint in one PR.

For new high-risk financial workflow DTOs, runtime validation is recommended.

Suggested feature schemas:

```text
shipmentCost.schema.ts
settlement.schema.ts
payroll.schema.ts
optimization.schema.ts
```

only if consistent with current Zod usage and without duplicating generated OpenAPI types.

If OpenAPI generation is adopted later, revisit this decision.

---

# 48. CURRENT EXECUTION MATRIX

## CURRENT RUNTIME CONTRACT — 2026-10-06

This is the current execution matrix. Runtime refresh in the approved continuation, current frontend source, fresh GET `http://localhost:8080/v3/api-docs` (137 paths) and current Spring controllers supersede the 2026-10-05 deployment mismatch. Contract presence and frontend acceptance are separate checks.

Status meanings: `DONE` = accepted confirmed slice; `PARTIAL` = implemented foundation/read/workflow with unfinished acceptance; `BLOCKED_BACKEND` = missing backend contract; `BLOCKED_AUTHORIZATION` = server actor/ownership authorization unresolved; `NOT_STARTED` = no implementation started, not a substitute for a known blocker. A `PARTIAL / BLOCKED_BACKEND` task stays unchecked. Messaging is `BLOCKED_BACKEND` with `BLOCKED_AUTHORIZATION` as its reason.

### CONFIRMED + FRONTEND DONE

| Task | Status | Confirmed runtime and retained frontend behavior |
|---|---|---|
| FE-PAYROLL-005 | DONE | GET `/api/payroll/reconciliation-cases`; POST `/api/payroll/payments/{id}/reconcile-bank`; enabled route/link, evidence confirmation, replay/single-flight and scoped invalidation. |
| FE-RATE-002 | DONE | POST `/api/loads/{id}/rating/preview`; V1 INDEX_BASED_MPG policy/authoritative preview; ADMIN/ACCOUNTANT; no client FSC formula. |
| FE-OPT-001 | DONE | POST `/api/optimization/runs`, GET `/{id}`, POST `/{id}/assignments/{candidateId}/accept`; immutable run, hard feasibility, fingerprint/idempotency; ADMIN/DISPATCHER. |
| FE-OPT-002 | DONE | Backend candidate ranking and evidence drawer; raw/normalized/weight/contribution displayed without recomputing score. |
| FE-FLEET-001 | DONE | GET `/api/reports/fleet/health` and utilization-history alias; explicit policy/trucks/date range/zone, independent KPI and coverage; no invented time series. |

Previously accepted Lark/date/authorization foundation, Operations/CRUD, Trip execution, embedded costs/accessorials, by-load Profitability, pay policies, Settlement list/corrections, Payroll detail/entry, Notifications and performance slices remain DONE. Their individual checkpoints are preserved; none is restarted.

### CONFIRMED + FRONTEND PARTIAL

| Task | Status | Usable/retained slice | Remaining acceptance / gap |
|---|---|---|---|
| FE-LOAD-001 | PARTIAL / BLOCKED_BACKEND | Overview/Timeline/Trip/Financial and Documents read DONE. Refine useList + BaseTable, server page size 20, loadId, tenant/load/page cache, permission/tenant gate and load-change page reset preserved; `capturedAt` means capture time. | Upload BE-020; load-scoped exception object read/actions absent. Report aggregates cannot substitute. |
| FE-SETTLEMENT-003 | PARTIAL / BLOCKED_BACKEND | Detail, submit-review, approve, lock, require-validation/resolve-validation and immutable corrections. SettlementActions already matches these commands. | BE-025: no reject, generic recalculate or settlement payment aliases/full planned acceptance. Revenue recalculation is a distinct evidence command; payments belong to PayrollItem. |
| FE-PAYROLL-004 | PARTIAL / BLOCKED_BACKEND | Authorized employee-owned payslip list/detail/PDF snapshot remains enabled. | BE-028: employee-owned current payment status absent; finance payment API unavailable to DRIVER. Issuance never implies PAID; payment UI only shows unavailable. |
| FE-DASH-001 | PARTIAL / BLOCKED_BACKEND | Existing Executive page/query/metric foundation and tests retained. Executive page/menu dormant; old `/dashboard` return targets redirect to Operations without mounting Executive queries. | BE-031: GET `/api/reports/executive-summary` absent; monthly financial needs year/month and different DTO; FleetHistory needs explicit policy/trucks/range/zone. No composition/adapter/fake zero. Fleet is independently DONE. |

### BLOCKED BY MISSING CONTRACT

| Task | Status | Current backend dependency | Production route/menu/action |
|---|---|---|---|
| FE-FOUNDATION-002 | BLOCKED_BACKEND | BE-021: GET `/api/me` with subject/email/tenantId/roles/employeeId consistent with shared JWT/session boundary. | Profile component/tests retained; route and both menus dormant. No JWT-decoding replacement. |
| FE-DOC-001 | BLOCKED_BACKEND | BE-020: POST `/api/documents` multipart file + final metadata DTO, ownership/link validation, storage policy, normalized errors and authorization. Current controller has GET/DELETE only. | Upload artifacts dormant; document reads retained; no guessed request or generic JSON create. |
| FE-COST-001 | BLOCKED_BACKEND | BE-023: global collection/detail with server pagination/filtering; only load-scoped costs exist. | No global ledger route/menu, Load enumeration or concatenation. |
| FE-PAYROLL-001 | BLOCKED_BACKEND | BE-026: GET collection `/api/payroll-runs` (or authoritative runtime `/api/payroll/runs`) with filtering/pagination DTO absent. | No run-list route/menu or reconstructed list. Confirmed `/payroll` calculate/open entry is FE-PAYROLL-002, not a list. |
| FE-PAYROLL-003 | BLOCKED_BACKEND | BE-026: current profile/history/configuration/policy resolution reads absent; append/PUT alone insufficient. | No editor/default tax/country/classification/policy; existing item evidence display retained. |
| FE-RATE-001 | BLOCKED_BACKEND | BE-031 rating read scope: authoring/new versions/GET explicit ID+version exist; collection/history queries absent. | No list/history menu, guessed ID/version enumeration or client reconstruction; preview stays DONE. |
| FE-EXPENSE-001 | BLOCKED_BACKEND | BE-016: collection/detail/create/update CRUD absent; individual approve/report/sync exist. | Existing orphan UI retained for reuse, not exposed. |
| FE-MAINT-001 | BLOCKED_BACKEND | BE-016: maintenance CRUD/PM workflow absent; report aggregates insufficient. | Existing orphan UI retained for reuse, not exposed. |
| FE-MSG-001 | BLOCKED_BACKEND / BLOCKED_AUTHORIZATION | BE-030: REST exists, but employeeId/senderId/conversationId are not bound to authenticated principal membership. | Messaging dormant; frontend cannot repair server authorization. |

### HISTORICAL / SUPERSEDED EVIDENCE

**Historical runtime mismatch — 2026-10-05** — **SUPERSEDED BY 2026-10-06 RUNTIME REFRESH**. BE-029 deployment absence is resolved for FE-PAYROLL-005, FE-RATE-002, FE-OPT-001/002 and FE-FLEET-001. Earlier test counts, source-only checkpoints and disabled routes are dated audit evidence, never current missing-contract evidence. The retained mismatch table is in [frontend-backend-unblock.md](docs/frontend-backend-unblock.md); remaining Rate collection/history and Executive compatibility are BE-031.

**READY task remaining: none. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.** Remaining acceptance depends on the current blocker rows above. Blocked work is neither DONE nor deferred by the user.

Resume order: Identity `/api/me` → multipart Documents → first newly READY operational/financial task in the approved queue → Settlement contract completion → Payroll list/profile/self-service → Rate Rule collection/history → Executive compatibility → Expense/Maintenance/Messaging when their contracts/security are ready. Optimization and Fleet are DONE; do not redo them.

Before unblocking any task, verify live method/path/query parameters/request and response DTO/pagination/statuses/enums/permissions/error contract. Implement only that slice, run targeted tests and all four gates (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`), then mark DONE only when full acceptance passes. Deterministic authenticated browser E2E remains blocked by identity/test environment; no production mock identity or report endpoint.

---

# 49. IMPLEMENTATION ORDER — BASED ON REAL REPO + BACKEND FLOW

> Cập nhật 2026-10-06 theo current runtime matrix ở mục 48 và tracker. `DONE` giữ checkpoint hoàn thành từng task; không đồng nghĩa toàn repo hiện tại PASS hoặc đã kiểm chứng browser E2E. Backend Convention V1 Phases 0–8 đã hoàn tất theo `/home/vumoi/logictics_api/plan-progress-summary.md`; frontend vẫn phải đối chiếu contract từng task với runtime.

## Batch 0 — Green baseline

- [x] **FE-BASE-001 — DONE:** Lark lint cleanup.
- [x] **FE-FOUNDATION-001 — DONE:** Date/type normalization.

Latest quality checkpoint (2026-10-06, Runtime/Plan Alignment): typecheck PASS, lint PASS, 115 files / 633 tests PASS, build PASS, git diff --check PASS. Previous dormant Profile checkpoint: 114 files / 629 tests PASS. E2E chưa chạy vì BE-021.

## Batch 1 — Existing frontend completion

- [ ] **FE-FOUNDATION-002 — BLOCKED_BACKEND:** Profile implementation/shared identity hooks giữ nguyên; menu và route dormant vì thiếu runtime `GET /api/me` (BE-021).
- [ ] **FE-DOC-001 — BLOCKED_BACKEND:** Có modal/hook/tests; upload đang tắt vì chưa có POST multipart trong runtime (BE-020).
- [x] **Notification completion — DONE:** Persisted tenant-wide mark-all-read, confirmation/permission/single-flight and scoped header/list invalidation; loading/empty/error tested. Full gates 102 files / 542 tests PASS.

## Batch 2 — Backend Phase 2 UX extension

- [ ] **FE-LOAD-001 — PARTIAL / BLOCKED_BACKEND:** Đã có các tab nghiệp vụ; Financial đã PASS quality gates; upload/Exceptions chưa có contract đầy đủ.
  - [x] Overview, Timeline và Trip panels đã triển khai.
  - [x] Documents read: server paging, tenant/load/filter cache, permission/error/403/retry, capturedAt DTO/locales; 103 files / 550 tests + full gates PASS.
  - [x] Financial panel: summary backend và scoped permission/tenant queries đã kiểm chứng; full quality gates PASS ngày 2026-10-05.
  - [ ] Documents upload: bị chặn BE-020.
  - [ ] Exceptions workflow: hiện chỉ có thông báo backend chưa hỗ trợ.
- [x] **FE-TRIP-001 — DONE:** Trip execution, stop actions, driver assignment/history và mileage; tracker cũ dùng alias `FE-OP-001`.

Only after action endpoints are runtime-ready.

## Batch 3 — Backend Phase 3 financial

- [x] **FE-AUTH-001 — DONE (corrective task):** Exact backend finance authorities/action matrix, route/action guards và allowed/denied tests; checkpoint 81 files / 419 tests PASS.
- [ ] **FE-COST-001 — BLOCKED_BACKEND:** Chưa có standalone list/detail và chưa xác nhận global collection/detail contract; load-scoped costs không thay thế task này.
- [x] **FE-COST-002 — DONE (embedded scope, 2026-10-05):** Backend summary, tenant/permission-scoped lazy queries và tests đã hoàn tất; full gate 82 files / 424 tests PASS. Standalone FE-COST-001 vẫn bị chặn.
- [x] **FE-ACCESSORIAL-001 — DONE (2026-10-05):** Bảng load-scoped, ba khoản tiền riêng biệt, guard/confirmation, single-flight, conflict và scoped invalidation tests; full quality gates PASS.
- [x] **FE-PROFIT-001 — DONE (2026-10-05):** Trang by-load, UUID filter, backend metric availability và classification breakdown; scoped query/guards/locales; full gate 85 files / 440 tests PASS. Unsupported planned filters/scopes ghi tại BE-024.
- [ ] **FE-DASH-001 — PARTIAL / BLOCKED_BACKEND (BE-031):** Executive-summary absent; legacy dashboard DTO/parameters need aligned backend reporting compatibility. Executive page/menu dormant, old return targets redirect to Operations; executive query/metric foundation preserved.

## Batch 4 — Settlement

- [x] **FE-SETTLEMENT-001 — DONE:** Driver pay policy list/detail, create/new-version, version history và ratio convention.
- [x] **FE-SETTLEMENT-002 — DONE (2026-10-05):** Runtime filters/list/calculate, per-row currency/Decimal formatting, tenant-scoped queries và mutation tests; 89 files / 466 tests + all gates PASS.
- [ ] **FE-SETTLEMENT-003 — PARTIAL / BLOCKED_BACKEND:** Detail/confirmed transitions đã PASS; planned schedule-payment/reject/generic recalculate/full audit thiếu contract BE-025.
- [x] **FE-SETTLEMENT-004 — DONE (2026-10-05):** Linked immutable adjustments/reversals, stable idempotency/retry, confirmation, positive explicit amounts, server field errors và scoped invalidation; all gates PASS.

## Batch 5 — Payroll

- [ ] **FE-PAYROLL-001 — BLOCKED_BACKEND:** Runtime không có collection GET /api/payroll/runs; BE-026.
- [x] **FE-PAYROLL-002 — DONE (2026-10-05):** Confirmed run detail/create/open, actual workflow states, validation blockers và lazy selected-driver payments; 97 files / 513 tests + all gates PASS.
- [ ] **FE-PAYROLL-003 — BLOCKED_BACKEND (BE-026):** Multi-jurisdiction payroll profiles.
- [ ] **FE-PAYROLL-004 — PARTIAL / BLOCKED_BACKEND / BE-028:** Own list/detail/PDF slice implemented, full gates PASS (102 files / 542 tests); driver payment status contract absent.
- [x] **FE-PAYROLL-005 — DONE (2026-10-06):** Live cases/reconcile verified; route/link activated, evidence confirmation/replay/single-flight/scoped invalidation. Targeted 24 tests; typecheck/lint/build and full 103 files / 552 tests PASS.

## Batch 6 — Pricing

- [ ] **FE-RATE-001 — BLOCKED_BACKEND:** Runtime version/authoring now exists; collection/history reads still missing.
- [x] **FE-RATE-002 — DONE (2026-10-06):** Confirmed V1 INDEX_BASED_MPG policy display and authoritative Load preview; explicit inputs/errors/permissions/single-flight; 105 files / 566 tests + four gates PASS. Other hypothetical FSC methods not exposed.

## Batch 7 — Optimization

- [x] **FE-OPT-001 — DONE (2026-10-06):** Confirmed run/explain/accept workflow; exact roles, explicit evidence, immutable audit, feasibility/single-flight/replay/conflict/scoped invalidation; 110 files / 598 tests + four gates PASS.
- [x] **FE-OPT-002 — DONE (2026-10-06):** Confirmed run/explain/accept workflow; exact roles, explicit evidence, immutable audit, feasibility/single-flight/replay/conflict/scoped invalidation; 110 files / 598 tests + four gates PASS.

## Batch 8 — Fleet completion

- [x] **FE-FLEET-001 — DONE (2026-10-06, confirmed V1 scope):** Explicit policy/truck/date/zone, backend-owned independent metrics and coverage, permission/tenant/cache/error states; 113 files / 627 tests + four gates PASS. Time-series/Executive mismatch recorded in section 32 / BE-031.
- [ ] **FE-MAINT-001 — BLOCKED_BACKEND:** Chưa kích hoạt maintenance CRUD/PM scheduling; Fleet reporting backend đã xong không tự xác nhận maintenance CRUD.
- [ ] **Complete dashboard metrics — BLOCKED_BACKEND:** See FE-DASH-001 / BE-031.

## Other v2 tasks

- [ ] **FE-EXPENSE-001 — BLOCKED_BACKEND:** Individual approval exists, collection CRUD contract absent; tracker cũ dùng alias `FE-EXP-001`.
- [ ] **FE-MSG-001 — BLOCKED_BACKEND / BLOCKED_AUTHORIZATION (BE-030):** REST contracts exist; participant/actor ownership is not bound to authenticated employee. No menu enabled.
- [x] **FE-PERF-001 — DONE:** FinancialSection/Recharts feature lazy boundary; route/Leaflet boundaries preserved. Dashboard static additional JS 446 KB → 53 KB; before/after artifacts and all gates PASS (102 files / 542 tests).
- [ ] **E2E-01…06:** Chưa có bằng chứng browser E2E hoàn tất các flow của v2.

**READY TASKS: none. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.** Remaining work depends on section 48 backend contracts.

**Next:** Resume earliest READY task when backend supplies `/api/me`, multipart upload or the recorded residual contracts/authorization. BE-029 runtime alignment is resolved for the newly implemented workflows. Remaining dependencies are listed in `docs/frontend-backend-unblock.md`; user confirmed frontend-only scope. Frontend plan is NOT COMPLETE.

---

# 50. PER-TASK EXECUTION TEMPLATE

Every AI/human implementation task must start with:

```text
TASK:
BACKEND DEPENDENCY:
CONTRACT STATUS: CONFIRMED | PLANNED | BLOCKED
CURRENT FILES:
NEW FILES:
ROUTE:
PERMISSION:
READ QUERIES:
MUTATIONS:
INVALIDATION:
ASYNC STATES:
TESTS:
```

If contract status is `PLANNED`, the first step is:

```text
inspect runtime OpenAPI/controller
```

If it does not match:
- update task spec locally;
- do not invent endpoint.

---

# 51. TEST FILE CONVENTION

Current tests live in:

```text
src/tests/
```

Use mirrored logical paths where practical:

```text
src/tests/pages/settlements/SettlementShow.test.tsx
src/tests/features/settlements/SettlementActions.test.tsx
src/tests/features/payroll/PayrollJurisdictionForm.test.tsx
```

Do not create tests beside production files unless project convention changes globally.

---

# 52. QUERY TEST REQUIREMENTS

For custom financial/workflow hooks test:

```text
enabled condition
query key inputs
filter serialization
AbortSignal/cancel if applicable
retry behavior delegated to current provider/query setup
no request before required id exists
no hidden-tab fetch
```

Do not duplicate tests already owned by `src/providers/api/`.

---

# 53. MUTATION TEST REQUIREMENTS

Every consequential workflow mutation:

```text
approve
lock
post
void
pay
retry
unassign
accept optimization
```

tests:

```text
requires confirmation where appropriate
single-flight/double click
success notification
domain error
permission
scoped invalidation
button state while pending
```

---

# 54. E2E PLAN

Current e2e has only bootstrap.

Expand by backend readiness.

## E2E-01 Existing operational happy path

```text
login/demo login
open loads
open load detail
open trip
verify execution data
```

## E2E-02 Document

```text
open load
upload document
see it in documents list/detail
```

when backend upload is stable.

## E2E-03 Profitability

```text
open profitability
filter period
view available/partial/unavailable metrics correctly
```

## E2E-04 Settlement

```text
open settlement
calculate
review
approve
lock
verify immutable state
```

Use deterministic test backend/fixtures.

## E2E-05 Payroll

```text
open payroll
validation blocker
resolve configured jurisdiction fixture
approve
lock
verify payment is not automatically PAID
```

## E2E-06 Optimization

```text
run optimizer
view candidate reasons
select feasible candidate
```

---

# 55. PERFORMANCE SPEC

Current build has chunk warnings >500k.

Do not mix bundle optimization into each feature PR.

Create dedicated:

```text
FE-PERF-001 Feature-level route code splitting
```

Target candidates:

```text
DashboardPage
OperationsDashboardPage
Leaflet
Recharts
future Payroll/Optimization
```

Do not manually split AntD blindly before bundle analysis.

Use:
- route lazy imports;
- feature lazy loading;
- measure build output before/after.

---

# 56. CURRENT CONTRACT MISMATCH HANDLING

## Loads date mismatch

Fix through FE-FOUNDATION-001.

Do not change backend because frontend typed `Date` incorrectly.

## Invoice date range

Do not add client-side filtering to paginated invoice list and call it complete.

Use reporting endpoint for period analytics.

If product requires invoice-list date filter:
- create backend gap;
- implement after server support.

## Documents multipart

Use dedicated API hook.

Do not modify generic dataProvider.

## Conversations

Use custom feature adapter.

Do not pretend `/api/conversations` exists.

---

# 57. ORPHAN PAGES

Current orphan pages:

```text
expenses
maintenance
accidents
ai-dispatch
containers
dvir
hos-eld
load-board
products
```

Do not delete solely because backend is missing.

Rules:

```text
not in runtime registry/menu
kept compile-safe
clearly marked BLOCKED backend
activated only after contract exists
```

If they increase maintenance cost, handle in a dedicated cleanup task after product decision.

---

# 58. BACKEND GAP RECORDING

When frontend encounters missing backend support, update:

```text
docs/backend-gaps.md
```

with:

```text
ID
frontend screen
required endpoint
required request/response
why current API insufficient
business impact
temporary UI behavior
```

Do not build production mock as workaround.

---

# 59. PROGRESS FILE

Create:

```text
docs/plan-frontend-progress.md
```

Columns:

```text
Task
Status
Contract Status
Backend Dependency
Route
Files
Tests
Blocker
Next
```

Statuses:

```text
NOT_STARTED
PARTIAL
BLOCKED_BACKEND
BLOCKED_AUTHORIZATION
IN_PROGRESS
READY_FOR_REVIEW
DONE
```

Update after every task.

---

# 60. DEFINITION OF DONE — SCREEN LEVEL

A screen is DONE only when:

```text
[ ] backend contract is CONFIRMED
[ ] exact route registered
[ ] navigation behavior correct
[ ] permission guard exists
[ ] read query scoped to screen
[ ] hidden tabs do not prefetch
[ ] no startup cross-screen fetch added
[ ] mutation invalidation scoped
[ ] loading state
[ ] error state
[ ] empty state
[ ] unavailable state where relevant
[ ] server field errors mapped
[ ] money/currency formatted correctly
[ ] date semantics correct
[ ] i18n vi/en/ja
[ ] responsive behavior acceptable
[ ] unit/component tests
[ ] relevant e2e if workflow-critical
[ ] typecheck PASS
[ ] lint PASS
[ ] test PASS
[ ] build PASS
```

---

# 61. DEFINITION OF DONE — FINANCIAL WORKFLOW

Additionally:

```text
[ ] frontend performs no authoritative financial calculation
[ ] mixed currencies not aggregated
[ ] locked entity not editable
[ ] workflow actions map to backend commands
[ ] LOCKED is not displayed as PAID
[ ] duplicate mutation prevented
[ ] domain conflict is actionable
[ ] audit/policy version shown when provided
```

---

# 62. DEFINITION OF DONE — OPTIMIZATION

Additionally:

```text
[ ] infeasible candidate cannot be accepted
[ ] reason displayed
[ ] raw + normalized + weight shown if backend provides them
[ ] no client recomputation of authoritative score
[ ] accept mutation invalidates only affected optimization/load/trip state
```

---

# 63. IMPLEMENTATION AGENT RULES

An AI implementing this plan MUST:

1. read `frontend-context-current.md`;
2. read `docs/plan-frontend-progress.md` if it exists;
3. inspect actual files named in the task;
4. inspect runtime OpenAPI/controller for every PLANNED contract;
5. not touch do-not-touch infrastructure;
6. not reset Lark worktree changes;
7. implement one task at a time;
8. run quality gates after every task;
9. update progress;
10. never claim completion while contract/test is blocked.

---

# 64. REQUIRED QUALITY COMMANDS

After every implementation batch:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For critical workflow changes also run relevant:

```bash
npm run test:e2e
```

if the E2E environment is configured.

Do not disable lint/tests to pass.

---

# 65. RESUME ORDER — CURRENT APPROVED QUEUE

READY task remaining: none. **NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.**

1. Identity GET `/api/me` (BE-021).
2. Multipart Documents (BE-020).
3. First newly READY operational/financial task in the approved queue.
4. Settlement contract completion (BE-025).
5. Payroll list/profile/self-service completion (BE-026/028).
6. Rate Rule collection/history.
7. Executive Dashboard compatibility (BE-031).
8. Expense/Maintenance/Messaging after respective contract/security readiness (BE-016/030).

Optimization and Fleet are already DONE. Preserve completed foundations/features and all tests. Each new contract must pass the section 48 recheck and four frontend gates before acceptance is marked DONE. Overall frontend plan remains NOT COMPLETE.

---

# 66. FINAL PRODUCT FLOW

The final frontend must make this sequence obvious:

```text
Customer
  ↓
Load
  ↓
Trip
  ↓
Driver / Truck
  ↓
Stops / Delivery
  ↓
Documents / Exceptions
  ↓
Cost / Revenue
  ↓
Profitability
```

Driver compensation:

```text
Driver Work
  ↓
Pay Policy
  ↓
Settlement
  ↓
Adjustment if required
  ↓
Payroll
  ↓
Payslip
  ↓
Payment
```

Pricing:

```text
Customer
  ↓
Rate Rule Version
  ↓
FSC / Accessorial Policy
  ↓
Rated Revenue
```

Optimization:

```text
Load
+ Truck
+ Driver
+ HOS
+ Cost
+ Margin
  ↓
Feasibility
  ↓
Candidate Ranking
  ↓
Explainability
  ↓
Dispatcher Acceptance
```

Dashboard:

```text
Backend Reporting APIs
  ↓
Metric Availability
  ↓
Executive Summary
```

Never:

```text
resource page data
  ↓
client aggregation
  ↓
fake company KPI
```

---

# 67. FINAL RULE

The frontend is a truthful projection of backend domain state.

Therefore:

```text
backend says UNAVAILABLE
    -> UI says data unavailable

backend says LOCKED
    -> UI blocks edit

backend says PAYMENT_FAILED
    -> UI exposes failure/recovery

backend says HOS_INFEASIBLE
    -> UI blocks candidate acceptance

backend has no endpoint
    -> UI remains blocked, not mocked as complete
```

**END — LOGISTICSX FRONTEND IMPLEMENTATION-READY SPECIFICATION V2**
