# Backend gaps and production blockers

This file is the explicit ticket register for backend gaps the frontend depends
on. Frontend code must fail closed or feature-flag affected behavior; it must
not invent endpoints or replace backend authorization.

## CURRENT RUNTIME CONTRACT — 2026-10-06

Authoritative active frontend blockers, rechecked against fresh localhost:8080 OpenAPI (137 paths) and current controllers. The historical reporting/deployment evidence below is not an active-contract table. No backend/container/database/migration changes are part of this continuation.

| ID | Current status | Frontend task / genuine gap | Required backend resolution / retained UI |
|---|---|---|---|
| BE-020 | BLOCKED_BACKEND | FE-DOC-001 / FE-LOAD-001 upload: POST `/api/documents` multipart absent; GET/DELETE only. | Final file/metadata DTO, ownership/link validation, storage policy, normalized errors/authorization; align retained dormant upload before activation. Document reads/capturedAt remain valid. |
| BE-021 | BLOCKED_BACKEND | FE-FOUNDATION-002: GET `/api/me` absent. Identity/test environment also blocks authenticated browser E2E. | Return subject/email/tenantId/roles/employeeId consistent with shared JWT/session boundary. Profile component/tests retained; menus/route dormant; no identity fallback. |
| BE-023 | BLOCKED_BACKEND | FE-COST-001: global shipment-cost collection/detail with server filtering/pagination absent. | Provide authoritative global read contract; keep embedded load-scoped costs. No Load enumeration/fake ledger. |
| BE-025 | PARTIAL / BLOCKED_BACKEND | FE-SETTLEMENT-003: full planned action/audit acceptance incomplete. | Confirmed submit-review/approve/lock/validation/corrections retained; no reject/generic recalculate/settlement payment aliases. Evidence-based revenue commands are distinct; payment belongs to PayrollItem. |
| BE-026 | BLOCKED_BACKEND | FE-PAYROLL-001/003: run collection and profile/history/configuration/policy reads absent. | Supported list/filter/page DTO and authoritative editor read state. `/api/payroll/runs` calculate/detail/workflow and append/PUT are insufficient; no ID/period enumeration, fake pagination or tax/country/classification/policy defaults. |
| BE-028 | PARTIAL / BLOCKED_BACKEND | FE-PAYROLL-004: authorized employee-owned current payment state absent. | Retain payslip snapshot/PDF; supply owned payment status DTO. DRIVER must not use finance-only item-payment endpoint; issuance != PAID. |
| BE-030 | BLOCKED_BACKEND / BLOCKED_AUTHORIZATION | FE-MSG-001: caller employeeId/senderId/conversationId lacks authenticated principal membership binding. | Server actor derivation, membership/read/write checks and sender binding; messaging stays dormant. REST presence does not satisfy authorization. |
| BE-031 | PARTIAL / BLOCKED_BACKEND | FE-DASH-001: executive-summary/report compatibility absent; FE-RATE-001: collection/history reads absent. | Executive requires its exact DTO/parameters, not composition of year/month MonthlyFinancialSummary and explicit-scope FleetHistory.Report. Preserve query/metric foundation; Executive rendering/menu dormant. Rating authoring/explicit version GET exists; no guessed list/history. Fleet and Rating preview are independently DONE. |
| BE-016 | BLOCKED_BACKEND (CRUD scope) | FE-EXPENSE-001 / FE-MAINT-001: Expense collection/detail/create/update and Maintenance CRUD/PM workflows absent. | Reports, individual expense approve/sync do not implement CRUD. Reuse retained orphan screens only after exact contracts are ready. |

FE-LOAD-001 Exceptions also remains BLOCKED_BACKEND: no load-scoped exception object read/action contract. `/api/reports/operations/exceptions-summary` is an aggregate, not workflow evidence.

BE-029 is **RESOLVED / HISTORICAL** for bank cases/reconcile/no-payment-required, Rating, Optimization and Fleet health/history. FE-PAYROLL-005, FE-RATE-002, FE-OPT-001/002 and FE-FLEET-001 are DONE; do not restore their old deployment blockers. Remaining optional profitability dimensions (BE-024) and MANUAL payment completion (BE-027) are separate residual scopes, not regressions of those DONE tasks.

## Existing environment / hardening register

The following original non-feature items were not revalidated in this scoped contract correction. Their recorded environment/security constraints remain; the current execution matrix above governs feature availability.

| ID | Status | Gap | Required resolution |
|---|---|---|---|
| BE-001 | BLOCKED | Spring has no CORS configuration. A real preflight from `http://localhost:5173` returns no `Access-Control-Allow-*` headers. | Whitelist exact origins; allow `GET, POST, PUT, DELETE, OPTIONS`; allow `Authorization, Content-Type, X-Request-Id`; expose `Content-Disposition`. Keep credentials disabled for the approved Bearer-only flow. |
| BE-002 | BLOCKED | Identity Server is outside the repository and `https://localhost:7001` is currently unreachable. OAuth client ID, redirect URIs, scopes and refresh/logout capabilities are unconfirmed. | Provide deployed discovery endpoint and SPA client configuration. Confirm refresh-token rotation or another secure renewal mechanism. |
| BE-003 | PHASE 4 | There is no `/api/me` or trusted JWT `employeeId` mapping. | Add and validate an employee claim or implement `GET /api/me`. Never ask users to select themselves. |
| BE-004 | PHASE 4 | Messaging trusts caller-supplied `employeeId`; notifications and mark-all-read are tenant-wide. | Bind messaging identity to the JWT principal and define per-user notification semantics before production enablement. |
| BE-005 | PHASE 2 | Upload has no enforced maximum size, MIME policy, content sniffing, malware quarantine, signed URL or idempotency contract. | Define and enforce the policy server-side. Keep `documentUpload` feature-flagged off until approved. |
| BE-006 | BLOCKED | `/api/health` hard-codes `status=UP` and derives database state only from the profile name. | Return truthful readiness from the contracted endpoint, or explicitly add `/actuator/health` to the frontend contract. |
| BE-007 | OPEN | Runtime OpenAPI describes all create operations as `200`, while controllers return `201`; it omits documented error responses and nullable fields. | Correct response annotations and schema nullability before client generation is considered safe. |
| BE-008 | OPEN | UUID/type mismatch, missing parameters, unsupported methods and media types can fall through to `500 INTERNAL_ERROR`. | Map framework client exceptions to stable `400`, `405` and `415` envelopes. |
| BE-009 | OPEN | OpenAPI claims MCP API key and `X-Tenant` resolution, while current Java source only resolves the JWT `tenant` claim. | Align documentation and implementation. The frontend will not send `X-Tenant`. |
| BE-010 | OPEN | Spring default `/logout` returns a form-login redirect but does not revoke OIDC tokens. | Disable the default endpoint or document it as unsupported. Frontend logout must use Identity Server metadata only. |
| BE-011 | HARDENING | The JWT converter creates an authority for any role string and `/api/**` has an authenticated fallback. | Whitelist supported roles and require every new API route to have an explicit matcher/method policy. |
| BE-012 | PHASE 3 | Load-dispatch invoice status comparison is case-sensitive (`Draft` versus `draft`). | Normalize invoice states before frontend relies on automatic issue behavior. |
| BE-013 | OPEN | Currency strings are not validated as ISO currency codes. | Define currency validation and rounding policy. |
| BE-022 | RESOLVED (frontend correction) | FE-AUTH-001 now mirrors exact backend ADMIN/ACCOUNTANT/PAYROLL/PAYROLL_MANAGER endpoint authorities/actions alongside retained legacy operational grants. | Preserve accepted/denied authority tests and fail-closed permissions; no semantic aliases or SUPERADMIN bypass. This historical frontend mismatch is not an active backend blocker. |
| BE-024 | PARTIAL CONTRACT | Runtime GET `/api/reports/profitability/by-load` returns `List<LoadFinancialSummary>` and supports only optional UUID `loadId`; no date/currency/customer/truck filter, customer grouping, pagination or share-of-cost field. GET `/api/loads/{loadId}/financial-summary` returns the distinct `LoadProfitabilityReport` DTO. | FE-PROFIT-001 implements the verified by-load report with loadId filter, explicit DTO projection and backend classification breakdown; no unsupported filters, client totals, inferred share or additional summary request per row. Unsupported planned scopes/filters remain recorded, not silently invented. |

## Historical Executive reporting snapshot — superseded contract evidence

> This original reporting/seeder snapshot is retained for audit only. Its six-endpoint claims, legacy DTOs, source/seed descriptions and BE-014–019 resolutions are not current runtime certification. In 2026-10-06 runtime, executive-summary is absent, Fleet history exists with explicit policy/truck/date/zone, and monthly financial requires year/month with a different DTO. Current CRUD scope BE-016 and Executive compatibility BE-031 are in the first table. No seed/database/migration action was performed or authorized here.

The executive dashboard (`src/pages/dashboard/DashboardPage.tsx`) reads its
numbers from `src/features/executive/executive.queries.ts`, which calls the six
endpoints under `/api/reports/**` and nothing else. There are two independent
layers of "no number here", and both must be read before a value reaches the
screen:

1. **Static.** `src/features/executive/executive.metrics.ts` declares whether an
   endpoint serves a metric at all. A metric no endpoint returns renders an
   empty frame naming the endpoint it would need — never a fabricated or
   extrapolated value.
2. **Runtime.** Every value the reporting endpoints return is a `MetricValue`
   object — `{value, available, reasonCode}` — and a metric the endpoint serves
   can still come back unavailable for the requested period. The frontend
   branches on `available` before touching `value`; `MetricValue` is a
   discriminated union on `status`, so `current ?? 0` is a type error rather than
   a silent zero.

On an executive screen a wrong number is worse than a visibly empty one, which
is why the contract is shaped this way. `ZERO_DENOMINATOR` is unavailable, not
`0`: revenue per mile over zero miles is *unknown*. Unavailable metrics are
listed by name in each response's `completeness.unavailableMetrics`, so a
missing figure can be told apart from a genuine zero without trusting the
service's word for it.

### Historical status of this group (not current runtime)

The six endpoints now exist and are wired. What remains in most rows is **source
data**, not endpoint surface: several metrics report unavailable because the
column or the rows they would aggregate over do not exist yet, and the endpoint
says so instead of returning a zero.

| ID | Status | Gap | Required resolution |
|---|---|---|---|
| BE-014 | PARTIALLY RESOLVED | The aggregate endpoint now exists (`GET /api/reports/executive-summary`, `@PreAuthorize` MANAGEMENT_ROLES, mirrored by a `/api/reports/**` path matcher in `SecurityConfiguration`). Of the metrics it serves, `fleetUtilizationPct` and `loadedMilesPct` are returned **unavailable** — `NO_AVAILABILITY_HISTORY` and `NO_TOTAL_MILES_SOURCE` respectively — and `difotPct` is `NOT_IMPLEMENTED`. `trucksWithLoadsPct` is served as an honest substitute for utilisation: dispatched-truck activity, not a utilisation ratio. | Remaining work is the source data, not the endpoint: a vehicle availability history (`Truck` has no status history and no availability window) and a denominator for loaded miles (no empty/deadhead miles are recorded anywhere). Until then the dashboard shows those three as empty frames with their reason, which is the correct presentation. |
| BE-015 | PARTIALLY RESOLVED | `GET /api/reports/financials/monthly` exists and returns per month: `revenue`, `operatingCost`, `operatingProfit`, `revenuePerMile`, `costPerMile`, `contributionSpread`, `loadedMiles`, `totalMiles`, `closed`, `invoiceCount`. `InvoiceController.search` still accepts no date range — unchanged, and no longer on the frontend's critical path, since the frontend reads this endpoint instead. `totalMiles` is returned **unavailable** (`NO_TOTAL_MILES_SOURCE`) and deliberately kept in the contract rather than relabelling `SUM(Load.distance)` as total miles. | Two things are genuinely outstanding. (a) `totalMiles` has no source. (b) The old requirement "monthly rows must be final only after the accounting period closes" is **not met and cannot be met as specified** — there is no `accounting_periods` table. `closed` is a calendar inference (`periodEnd < now`), reported as such in the response and in the frontend type, and it must not be presented to users as an accounting close. |
| BE-016 | PARTIALLY RESOLVED | **The reason recorded here was wrong.** This row claimed "there is no `ExpenseController` and no `MaintenanceController`. Cost per mile, contribution spread, operating margin and cost structure have no source at all." In fact `Expense` (`fleet/truck/Expense.java`), `MaintenanceRecord` and `MaintenanceSchedule` (`fleet/maintenance/`) all exist as entities, and `GET /api/reports/costs/by-category` is implemented. What was — and still is — missing is a **CRUD controller/service** for expenses and maintenance records; the reporting feature owns its own projection repositories (`ReportingExpenseRepository`, `ReportingMaintenanceRecordRepository`) rather than depending on a feature service that does not exist. Cost per mile and contribution spread are both served (from this endpoint and from `/financials/monthly`). Cost structure is served for all eight `CostCategory` values, emitted in every response including the empty ones so that the `shareOfTotal` denominator stays stable; `classify()` sends an unrecognised legacy value to `UNCLASSIFIED` rather than dropping the row. `ambiguousTruckLinkCount` reports rows carrying two different truck foreign keys, which cannot be attributed to one vehicle. | `operatingMargin` is the one part of the original claim that holds: no response returns it, so the frontend declares it as not in contract and renders it as an empty frame with that reason — not as a derived figure. Separately, `expenses` used to be empty in every seeded environment, so every category read `currentTotal: 0` with `rowCount: 0` and the per-mile columns were unavailable rather than zero. The dev seeder now creates synthetic expense rows (see the fixture note below); the endpoint itself needed no change. |
| BE-017 | PARTIALLY RESOLVED | `GET /api/reports/fleet/health` exists. `pmCompliancePct` is computed by date and `maintenanceCostPerMile` is served. `unplannedDowntimePct` is returned **unavailable** (`NO_DOWNTIME_INTERVALS`) and `breakdownsPer100kMiles` is `NOT_IMPLEMENTED` — a "breakdown" is still not a distinguishable event type (`maintenanceType` is free text). `schedulesRequiringOdometerCount` is reported separately so schedules that cannot be assessed are not silently folded into the compliance denominator. Migration `V4__add_reporting_inputs.sql` added `downtime_start_at`, `downtime_end_at`, `is_unplanned` and `is_breakdown` to `maintenance_records`. | `is_unplanned` and `is_breakdown` are `bool NULL`, deliberately not `NOT NULL DEFAULT false`: defaulting them would assert that every historical record was planned and never a breakdown, which is a claim nobody has evidence for. `NULL` means unclassified, aggregates exclude it from both numerator and denominator, and the count of excluded rows is reported. The dev seeder now creates maintenance records and PM schedules, so `maintenanceCostPerMile` and `pmCompliancePct` have a source to compute from — but it writes those four columns as `NULL` on purpose, so the "unclassified" count stays visible rather than being quietly defaulted to a classification nobody made. `unplannedDowntimePct` and `breakdownsPer100kMiles` remain unavailable regardless of the data: `ReportServiceImpl` hard-codes both, so **seeding downtime intervals would not light up either tile**. Making those two live is a service change, not a data change, and is not in scope here. |
| BE-018 | PARTIALLY RESOLVED | `GET /api/reports/customers/concentration` exists and computes `top1Share` / `top3Share` / `top5Share` / `hhi` over **all** customers before trimming the returned rows to `limit` (default 10, `@Min(1) @Max(100)`). `customersConsidered` and `customersReturned` are both returned so a client can prove the list it holds is the trimmed one, and `invoicesWithoutCustomer` reports the revenue that belongs to no row. **The direction stated in this row was backwards.** It claimed an HHI over a truncated list "is always lower than the true one — i.e. it would under-report concentration risk". The opposite is true, and it is now pinned by test: dropping the smallest customers shrinks the denominator faster than the numerators, so every retained share grows and the index reads **higher** than the truth. `ReportingMetricsCalculatorTest` measures 5070.00 over the complete set of 30 customers against 7890.63 over the top 10. Truncation therefore **over**-states concentration, and a client recomputing the index from the rows it was handed would report concentration as worse than it is. This is why the service sends the computed figure rather than the inputs to it. Contract differences from the original request: the per-customer field is `shareOfRevenue` (not `shareOfTotal`), the name field is `customerName`, and there is no `yoyGrowthPct`; the row also has no `costPerMile`. | `yoyGrowthPct` was never delivered and nothing computes it. `grossMarginPercent` is returned **unavailable** (`NO_COST_ALLOCATION`) as a permanent structural limit, not a missing feed: `Expense` attaches to a truck, never to a trip, so there is no basis on which to allocate cost to a customer. It must stay unavailable rather than be approximated. |
| BE-019 | RESOLVED | `GET /api/reports/receivables/aging` returns `outstandingTotal`, `dsoDays`, `overdueTotal`, the six `AgingBucket` buckets (`current`, `days1To30`, `days31To60`, `days61To90`, `over90`, `noDueDate`) and `invoicesWithStatusPaymentMismatch`. DSO is derived from total paid amounts (`totalAmount − SUM(Payment.amount)`) rather than from the status string, which is what makes it immune to the `Draft`/`draft` casing problem recorded in BE-012. Invoices with no due date are a bucket of their own (`noDueDate`) and are **not** merged into `current`. `invoicesWithStatusPaymentMismatch` counts invoices where deriving the balance from status and from payments disagree — turning a data-quality problem into a number on the response rather than a silent choice between two answers. | No backend work outstanding. The frontend consumes `dsoDays` into a KPI and renders all six buckets in the Receivables aging panel (`src/features/executive/components/AgingSection.tsx`), using the `labelKey` each bucket carries rather than any label of its own. |

### The seeded cost and odometer rows are synthetic fixtures

`DataSeeder` (`devtools/seed/DataSeeder.java`, `@Profile({"dev", "seed"})`) now
creates the source rows the reporting endpoints were missing: expenses,
maintenance records, PM schedules and odometer readings, for every seeded truck.

**These are invented fixtures, not transactions.** Every row carries the marker
`SEED-FIXTURE` in its notes or invoice number, and the seeder prints a separate
`synthetic fixtures` block in its summary so those counts are never read as the
real record counts printed above them. A figure computed from them demonstrates
that the calculation runs end to end; it is not evidence about the business.

What they make computable — each verified by running the seeder against a fresh
database and then querying it:

| Figure | Becomes | How |
|---|---|---|
| cost structure by category | available | 53 expense rows over 7 `type` strings, each of which `CostCategory.classify` maps to a distinct bucket; none fall to `UNCLASSIFIED` |
| operating cost, contribution spread | available | the same rows, via `/financials/monthly` |
| `maintenanceCostPerMile` | available | 45 maintenance records, every one carrying `total_cost_currency = 'VND'` |
| the mileage denominator behind the per-mile columns | available | 13 odometer readings per truck, 28 days apart and monotonically increasing, so every truck has a positive spread and none is dropped for having a single reading |
| `pmCompliancePct` | available, 9 / 15 | 15 schedules, deliberately a mix of past-due and not-past-due, so the ratio is a real division rather than 0% or 100% |

Two deliberate omissions, recorded so a later reader does not take them for
oversights:

- **No downtime intervals.** `unplannedDowntimePct` is hard-coded unavailable in
  `ReportServiceImpl`; writing `downtime_start_at` or `is_unplanned` would change
  nothing on screen. Filling a column nothing reads produces data that looks
  meaningful and is not.
- **No `trucks.current_odometer`.** The reporting path differences
  `vehicle_mileage_readings`; nothing aggregates the single odometer column.

Both can be seeded later if the service is changed to read them.

The seeder was also **broken** before this work, and is fixed here.
`seedInspections` called `Double.parseDouble` on `FAKER.address().latitude()`, and
the Faker is constructed with `Locale("vi")`, whose latitude uses a comma as the
decimal separator (`"-21,56260295"`). That threw `NumberFormatException` out of
the `CommandLineRunner` and aborted the entire seed — so no fixture of any kind
could be written, and the failure looked like a new-code bug when it was not.

### The requested currency must match the unit the rows are actually in

`src/features/executive/executive.constants.ts` sets `DISPLAY_CURRENCY = "VND"`.
An earlier revision had it as `"USD"` while every seeded invoice, payment and
expense row is in VND, so all six endpoints answered `available: false` with
reason `NO_ROWS_IN_CURRENCY`. That was the correct answer to the question being
asked — the requested unit was not the unit the data was in — and it is **not** a
backend bug:

- the `currency` request parameter is required on all six endpoints
  (`@RequestParam @Pattern("^[A-Z]{3}$")`); omitting it is a `400`, and there is
  no server-side default, because a default would be a unit chosen on the user's
  behalf;
- the currency predicate sits **inside** the query, so rows in other currencies
  are excluded, not silently summed. `SUM(totalAmount)` over a mix of USD and VND
  is not a total of anything;
- responses echo `currency` back and report `excludedOtherCurrencyRows` and
  `currenciesPresent`, so a client can verify which unit produced the figure it
  is holding.

Aligning the constant with the data is a statement about which unit the tenant
books in. It is **not** a conversion and **not** a loosening of the filter: the
frontend still may not convert currencies locally or substitute `0`, because each
would put a number on an executive screen that no query produced. If the tenant
later books in a different currency, only this constant changes — and two
currencies are still never summed into one total.

### Two cross-cutting requirements

- **Aggregation must happen server-side.** Raising `MAX_PAGE_SIZE` is not a
  substitute: summing a truncated page and presenting it as a company total is
  exactly the misstatement this register exists to prevent. This still holds —
  `Constants.MAX_PAGE_SIZE = 100` is unchanged, and it is why `fleetSize` and
  `activeCustomerCount` come from a filtered page count (`total`) rather than
  from accumulating rows.
- **Every threshold the dashboard displays carries its provenance.** The
  frontend distinguishes an internal target, an industry benchmark and a
  historical baseline by ink weight, dash pattern and a lettered mark (T/I/H),
  and it never renders one as another — see `src/features/executive/executive.refs.ts`.
  Where a benchmark is not applicable to the selected fleet type, the table
  holds `industry: null` and the UI is structurally unable to show it as an
  industry benchmark. None of the six endpoints returns a benchmark, so the
  dashboard currently shows internal targets only; any benchmark added later must
  arrive with its source, period and applicable fleet scope attached, or the
  dashboard will show the target alone rather than guess.

## Dependency residual risk

Exact transitive overrides keep `brace-expansion` and `path-to-regexp` on
patched releases. `npm audit --omit=dev` reports **9 advisories (6 moderate, 3
high)** across `@ant-design/pro-layout`, `@refinedev/antd`,
`@refinedev/react-router-v6`, `@refinedev/simple-rest`, `decode-uri-component`,
`path-to-regexp`, `query-string`, `react-router` and `react-router-dom`; the
available automatic fix upgrades React Router 7 and would violate the approved
Refine v4/Router 6 stack. (An earlier revision of this file said "two moderate
advisories in React Router 6" — that count is stale.)

Until an explicit stack migration is approved:

- navigation destinations are selected from application route constants;
- untrusted strings are never passed directly to `navigate` or link targets;
- this Vite SPA does not use React Router SSR hydration/deserialization;
- the residual audit result remains a Phase 0 FAIL for a zero-vulnerability
  production gate.

## BE-025 — Settlement planned collection/workflow differences (2026-10-06 current recheck)

**Status: PARTIAL / BLOCKED_BACKEND for full planned acceptance; confirmed commands implemented.** Runtime DriverSettlementController GET collection accepts payPeriodId, driverId, status, settlementType only and returns a list (no currency/server pagination). UI paginates the returned collection, shows per-row currency and never aggregates financial totals. Confirmed detail, submit-review, approve, lock, require-validation, resolve-validation, adjustments and reversal are implemented. There is no generic recalculate, reject, schedule-payment or audit-history endpoint. Recalculate-revenue/billing-adjustments are distinct commands with dedicated evidence contracts, not aliases. Adjustment accepts positive explicit line amounts, optional load/trip, reason and stable idempotencyKey; currency is inherited and original history immutable. No quantity/rate/evidence fields are invented. FE-SETTLEMENT-003 remains BLOCKED_BACKEND for its unsupported planned scope. Payments belong to the payroll item workflow.

## BE-026 — Payroll runtime entry and profile read gaps (2026-10-06 current recheck)

**Status: BLOCKED for collection and profile read scopes.** PayrollRunController confirms POST /api/payroll/runs/calculate, GET /api/payroll/runs/{id}, POST /{id}/recalculate, /submit-review, /approve, /lock. There is no GET /api/payroll/runs or /api/payroll-runs: FE-PAYROLL-001 list cannot be implemented or replaced with client totals. Read/action contract uses IN_REVIEW (not planned REVIEWED), PAYMENT_SCHEDULED and COMPLETED (not assumed PAID). PayrollConfigurationController exposes tenant-default PUT, employee profile append POST and policy-version append POST, but no GET profile/history/tenant-default/policy lookup. Record missing read contracts before declaring FE-PAYROLL-003 complete. Existing detail/calculate endpoints can support an explicit workflow entry without exposing a fictitious collection or client aggregates.

## BE-027 — Payroll payment execution/configuration residual scope (2026-10-05)

**Status: CONFIRMED bank/Stripe surface; BLOCKED MANUAL completion.** Scheduling accepts MANUAL, BANK_TRANSFER, STRIPE. Dispatch explicitly rejects MANUAL; reconcile-bank only accepts BANK_TRANSFER with an existing open case and matching bank destination/evidence. No manual-payment completion endpoint is exposed. Frontend schedules bank/Stripe with explicit provider/destination, shows actual attempt status and bank reconciliation cases; no selectable manual dead-end or fake mark-paid. Registered authoritative provider adapters/statutory calculators require backend configuration; absence is an actionable backend error, never mocked financial success. Retry is a new schedule request only after a failed attempt and resolved evidence; SUCCEEDED/active attempts block new scheduling. Zero-net requires an explicit backend no-payment disposition rather than a transfer; no such transfer is fabricated.

Payroll snapshot resolution uses WORK_PAYROLL_OVERRIDE / EMPLOYEE_PROFILE / TENANT_DEFAULT and carries profile/version evidence. Planned WORK_OVERRIDE must not be sent as an invented enum. Profile/configuration read gaps remain BE-026.

## BE-028 — Payslip self-service current payment evidence (2026-10-06 current recheck)

**Status: PARTIAL / BLOCKED_BACKEND for current payment status; own list/detail/PDF CONFIRMED.** Runtime GET /api/driver/me/payslips, /api/payslips/{id}, /api/payslips/{id}/pdf return immutable PayslipView snapshot/artifact evidence only. The snapshot includes period, amounts, jurisdiction, resolution and policy, but no current payment status; finance-only /api/payroll/items/{id}/payments cannot serve DRIVER self-service. Required resolution: authorized driver-owned payment status endpoint/DTO, including explicit no-payment disposition if relevant. Do not infer payment success from issuedAt/lockedAt or mutate immutable snapshots. Frontend confirmed read/PDF slice is implemented; FE-PAYROLL-004 remains BLOCKED_BACKEND for payment-status requirement.

## Historical runtime mismatch — 2026-10-05

**SUPERSEDED BY 2026-10-06 RUNTIME REFRESH. BE-029: RESOLVED for reconciliation/Rating/Optimization/Fleet.** The following is the original dated evidence, not an active missing-contract assertion.

**Historical status on 2026-10-05: BLOCKED_RUNTIME_ALIGNMENT.** .env API_PROXY_TARGET=http://localhost:8080; Docker logistics-api runs logisticsx-api:local there; no :18080 runtime. Fresh GET /v3/api-docs confirms the payroll/settlement/cost/payslip surfaces used by implemented confirmed slices. It does **not** expose /api/payroll/reconciliation-cases or /api/payroll/payments/{id}/reconcile-bank (also /items/{id}/no-payment-required absent), while latest PayrollPaymentController source has them. Reconciliation UI unit tests against the source contract remain as dormant implementation evidence; production route/link are explicitly gated off. FE-PAYROLL-005 corrected to BLOCKED_BACKEND for reconciliation (scheduling/dispatch available).

The same runtime has **no rating or optimization paths**, and lacks /api/reports/executive-summary and /api/reports/fleet/health (only fleet/fuel and fleet/maintenance appear). Latest backend source/progress Phases 6–8 complete do not certify this running container. FE-RATE-001/002, FE-OPT-001/002, FE-FLEET-001 and FE-DASH-001 are blocked pending aligned runtime; no menu/production call introduced for missing contracts. Rate rules source also lacks planned collection/history GET. This is recorded as a mismatch, not a silent plan change. Backend rebuild/redeploy is separate from authorized frontend implementation; no container restart, database change or source reset was performed.

## BE-030 — Messaging authenticated actor/participant contract (2026-10-06 current recheck)

**Status: BLOCKED_AUTHORIZATION, not missing REST.** Live GET/POST `/api/messages/conversations`, conversation detail, GET/POST `/api/messages` and unread-count exist. MessageController accepts caller `employeeId`, `conversationId` and SendMessageRequest.senderId. ConversationService.listByParticipant/getById and MessageService.listByConversation/send resolve those caller IDs without authenticated employee binding or conversation membership checks. Tenant isolation alone does not establish participant ownership or prevent sender impersonation within a tenant. Required backend contract: derive/validate current persisted employee, enforce conversation membership on reads/writes, bind sender to actor, and define permitted privileged access. Do not expose dormant generic messages pages or enable a specialized production adapter before this contract is confirmed.

## BE-029 runtime recheck — 2026-10-06 (supersedes deployment absence)

Fresh configured localhost:8080 OpenAPI now confirms bank reconciliation cases/command and zero-net disposition, rating rule/contract version authoring/read and Load preview, Optimization run/read/accept, Fleet health/utilization-history (137 paths). The previous missing-runtime blocker is resolved for these operations. Frontend integration/tests have passed for FE-PAYROLL-005, FE-RATE-002, FE-OPT-001/002 and FE-FLEET-001 at their recorded checkpoints; these tasks remain DONE. Endpoint presence alone never auto-completes another task. Global Rating collection/history and executive-summary remain absent and must be tracked separately. No backend/container/data change performed by this frontend continuation.

## BE-031 — Rating collection/history and executive reporting residual contracts (2026-10-06)

**Current status: PARTIAL / BLOCKED_BACKEND for Executive; BLOCKED_BACKEND for Rate collection/history.** BE-029 runtime availability is resolved. FE-RATE-001 still cannot provide the planned rule collection/history: only explicit ID/version GET and authoring POST exist. Do not enumerate guessed versions. FE-DASH-001 still lacks executive-summary; live fleet-health now requires explicit policyId/truckIds and returns FleetHistory.Report, unlike the existing Executive FleetHealthDto/range-only request. Monthly financial also requires year/month and returns MonthlyFinancialSummary rather than the old points DTO. Executive foundation remains preserved per user instruction; record these incompatibilities rather than casting newer report data to legacy DTOs or fabricating metrics. Executive page/menu/resources are dormant; existing `/dashboard` return targets redirect to Operations without mounting its queries. Standalone FE-FLEET-001 is DONE independently using its explicit confirmed contract.

## Remaining-contract recheck — 2026-10-06T03:45:39+07:00

Fresh localhost:8080 OpenAPI (137 paths; SHA256 `9891294e84db060eb30c598fa8b0fbff98057ca03e16c08f67a96be21b169978`) is identical to the prior Oct6 snapshot and remained identical on the final 03:43:04+07:00 check. No gap became READY or resolved in this continuation. Current blocked matrix and per-task evidence are appended at the top of [plan-frontend-progress.md](plan-frontend-progress.md). Runtime/Plan Alignment 2026-10-06 stays COMPLETE; it was not redone.

- BE-021: GET `/api/me` absent. BE-020: `/api/documents` GET only; multipart POST absent. Individual Load exceptions still have only a reports summary, not object read/actions.
- BE-023: only Load-scoped costs, no global collection/detail/server page/filter contract.
- BE-025: confirmed commands unchanged; no generic recalculate/reject/settlement-payment/audit-history aliases.
- BE-026: no run collection GET or current/history/config/policy resolution reads. BE-028: no employee-owned current payment status; PayslipView remains immutable snapshot evidence.
- BE-031: Rate authoring/explicit version reads exist, collection/history still absent; Executive summary absent and supporting monthly/Fleet DTO/parameters still incompatible with dormant Executive foundation.
- BE-016 CRUD/PM scope: Expense has only individual approve; Maintenance object CRUD/PM operations absent.
- BE-030: current MessageController/MessageService/ConversationService and SecurityConfig still provide no authenticated principal membership binding for caller employeeId/senderId/conversationId. REST presence does not resolve authorization; no private-account exploit request was made.

BE-029 remains RESOLVED for accepted reconciliation/preview/Optimization/Fleet. No completed task was downgraded, no blocked task completed/deferred, no production source changed. Frontend source/tests/package and backend source/config hashes match the pre-recheck snapshot; backend read only. Final frontend gates: typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; authenticated E2E NOT RUN (BE-021/test environment).
