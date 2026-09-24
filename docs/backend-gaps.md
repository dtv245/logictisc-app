# Backend gaps and production blockers

This file is the explicit ticket register for backend gaps the frontend depends
on. Frontend code must fail closed or feature-flag affected behavior; it must
not invent endpoints or replace backend authorization.

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

## Executive Overview report endpoints

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

### Status of this group

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
