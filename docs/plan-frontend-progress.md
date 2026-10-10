# Frontend Implementation Progress Tracker

> **File**: `docs/plan-frontend-progress.md`  
> **Source of Truth**: `docs/frontend-context-current.md` + `plan-frontend-v2-implementation-ready.md`  
> **Status Values**: `NOT_STARTED` | `PARTIAL` | `BLOCKED_BACKEND` | `BLOCKED_AUTHORIZATION` | `IN_PROGRESS` | `READY_FOR_REVIEW` | `DONE`

---

## Blocked-dependency recheck — 2026-10-06T03:40:35+07:00

- **Task:** Read-only check of the remaining approved queue after Runtime/Plan Alignment COMPLETE; alignment work is not repeated.
- **Status:** No newly READY contract. Existing DONE tasks unchanged; missing and unsafe contracts retain their current BLOCKED/PARTIAL status. No user deferral.
- **Contract evidence:** Fresh GET `http://localhost:8080/v3/api-docs`; 137 paths; SHA256 `9891294e84db060eb30c598fa8b0fbff98057ca03e16c08f67a96be21b169978`. JSON is identical to the earlier Oct6 snapshot; method/path/parameters/schema changes: none. Relevant blocked paths inspected in priority order; current Messaging controller/services/security inspected only for the unresolved participant/sender invariant.
- **Scope / Files:** docs/plan-frontend-progress.md, docs/backend-gaps.md, docs/frontend-backend-unblock.md and .ai-workflow/PROJECT_MEMORY.md only. Frontend source/tests/package snapshots (563 files) and backend source/config snapshot (581 files) are hash-identical before/after. No new request, route/menu, fake identity, command alias, calculation or startup prefetch; no backend/container/database operation. Final OpenAPI recheck at 2026-10-06T03:43:04+07:00 remains identical.
- **Tests:** typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; authenticated E2E NOT RUN (BE-021/test environment). No source/test change, no targeted rerun or test removal. Baseline preserved at 115 files / 633 tests.

| Task | Previous status | Current runtime evidence | Current status | Implementation readiness |
|---|---|---|---|---|
| FE-FOUNDATION-002 | BLOCKED_BACKEND | GET `/api/me` absent; no authoritative identity DTO. | BLOCKED_BACKEND | NOT READY |
| FE-DOC-001 | BLOCKED_BACKEND | `/api/documents` GET only; no multipart POST/file/metadata contract. | BLOCKED_BACKEND | NOT READY |
| FE-LOAD-001 remaining slices | PARTIAL / BLOCKED_BACKEND | Upload absent; only `/api/reports/operations/exceptions-summary`, no load-scoped exception objects/detail/actions. Documents read stays DONE. | PARTIAL / BLOCKED_BACKEND | NOT READY |
| FE-COST-001 | BLOCKED_BACKEND | Only Load-scoped costs; no global collection/detail/pagination/filter contract. | BLOCKED_BACKEND | NOT READY |
| FE-SETTLEMENT-003 | PARTIAL / BLOCKED_BACKEND | Confirmed submit-review/approve/lock/validation/corrections retained; no generic recalculate/reject/settlement-payment/audit-history command. | PARTIAL / BLOCKED_BACKEND | NOT READY |
| FE-PAYROLL-001 | BLOCKED_BACKEND | No GET `/api/payroll/runs` or `/api/payroll-runs`; GET `/{id}` cannot supply server collection/pagination. | BLOCKED_BACKEND | NOT READY |
| FE-PAYROLL-003 | BLOCKED_BACKEND | Configuration paths expose tenant-default PUT/profile POST/policy-version POST; no current/history/config/policy-resolution GET. | BLOCKED_BACKEND | NOT READY |
| FE-PAYROLL-004 | PARTIAL / BLOCKED_BACKEND | Owned payslip/PDF remain snapshot evidence; PayslipView has no current payment state and no new employee-owned payment endpoint. | PARTIAL / BLOCKED_BACKEND | NOT READY |
| FE-RATE-001 | BLOCKED_BACKEND | Rules/contracts authoring and explicit ID/version GET only; no collection or version-history query. FE-RATE-002 stays DONE. | BLOCKED_BACKEND | NOT READY |
| FE-DASH-001 | PARTIAL / BLOCKED_BACKEND | Executive-summary GET absent; monthly financial still year/month + MonthlyFinancialSummary, FleetHistory still explicit policy/trucks. No approved compatibility/composition contract. | PARTIAL / BLOCKED_BACKEND | NOT READY |
| FE-EXPENSE-001 | BLOCKED_BACKEND | POST `/api/expenses/{id}/approve` only; no collection/detail/create/update CRUD. | BLOCKED_BACKEND | NOT READY |
| FE-MAINT-001 | BLOCKED_BACKEND | No maintenance object CRUD/PM workflow; reporting aggregates do not qualify. | BLOCKED_BACKEND | NOT READY |
| FE-MSG-001 | BLOCKED_BACKEND / BLOCKED_AUTHORIZATION | REST exists; MessageController/MessageService/ConversationService still trust caller employeeId/senderId/conversationId without authenticated principal membership. SecurityConfig has no message-specific ownership enforcement. | BLOCKED_BACKEND / BLOCKED_AUTHORIZATION | NOT READY |


**NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.** Implementation is caught up with current runtime; frontend plan remains blocked by backend contracts/authorization. Completed reconciliation, preview, Optimization and Fleet stay enabled; Executive/Profile/upload and other unsupported entries stay dormant.

- **Next:** GET `/api/me` first, multipart Documents next, then FE-LOAD-001 remaining slices → FE-COST-001 → FE-SETTLEMENT-003 → FE-PAYROLL-001/003/004 → FE-RATE-001 → FE-DASH-001 → FE-EXPENSE-001 → FE-MAINT-001 → FE-MSG-001 after server membership authorization. Activate only when exact live DTO/pagination/status/permissions/errors satisfy acceptance.

---

## Current delivery checkpoint — 2026-10-06

- Completed and ticked in plan section 49: FE-PAYROLL-005, FE-RATE-002, FE-OPT-001, FE-OPT-002, FE-FLEET-001 for their explicitly documented confirmed contracts. Earlier valid DONE tasks preserved.
- Final working-tree gates after Runtime/Plan Alignment: typecheck PASS; lint PASS; **115 files / 633 tests PASS**; build PASS; git diff --check PASS. Previous Profile baseline: 114 files / 629 tests PASS. Four new route/resource tests; existing tests retained. Earlier targeted Fleet 53 tests and Profile/header/nav/route 29 tests remain feature checkpoints. Browser E2E NOT RUN (BE-021 / deterministic authenticated data unavailable).
- All remaining task dependencies are recorded in `docs/frontend-backend-unblock.md` and the overview below. No additional fully READY task remains in the approved queue after this runtime verification. Missing identity/upload, individual exceptions, global cost collection, residual settlement/payroll/payslip/rate/Executive contracts, maintenance/expense CRUD and messaging principal authorization remain outside confirmed frontend integration.
- User scope remains frontend only. No backend/container/database changes, no task DEFERRED_BY_USER. **FRONTEND PLAN NOT COMPLETE**; blocked and E2E tasks stay unchecked.

---

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

**Historical runtime mismatch — 2026-10-05** — **SUPERSEDED BY 2026-10-06 RUNTIME REFRESH**. BE-029 deployment absence is resolved for FE-PAYROLL-005, FE-RATE-002, FE-OPT-001/002 and FE-FLEET-001. Earlier test counts, source-only checkpoints and disabled routes are dated audit evidence, never current missing-contract evidence. The retained mismatch table is in [frontend-backend-unblock.md](frontend-backend-unblock.md); remaining Rate collection/history and Executive compatibility are BE-031.

**READY task remaining: none. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.** Remaining acceptance depends on the current blocker rows above. Blocked work is neither DONE nor deferred by the user.

Resume order: Identity `/api/me` → multipart Documents → first newly READY operational/financial task in the approved queue → Settlement contract completion → Payroll list/profile/self-service → Rate Rule collection/history → Executive compatibility → Expense/Maintenance/Messaging when their contracts/security are ready. Optimization and Fleet are DONE; do not redo them.

Before unblocking any task, verify live method/path/query parameters/request and response DTO/pagination/statuses/enums/permissions/error contract. Implement only that slice, run targeted tests and all four gates (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`), then mark DONE only when full acceptance passes. Deterministic authenticated browser E2E remains blocked by identity/test environment; no production mock identity or report endpoint.

---

## Runtime/Plan Alignment — 2026-10-06

- **Task / Status:** Runtime/Plan Alignment COMPLETE. Overall frontend plan NOT COMPLETE; READY task remaining: none. **NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.**
- **Contract evidence:** Read context → canonical plan → progress → gaps → frontend source → fresh live OpenAPI (137 paths) → current controllers → existing tests. Only read-only backend inspection; backend source/config/migrations unchanged against the pre-task hash snapshot. No backend/container/database action or production mock added.
- **Plan correction:** Section 48 and the current progress matrix govern execution. Five recently accepted tasks remain DONE; partial read/workflow foundations and missing-contract/authorization tasks stay unchecked. BE-029 and the dated 2026-10-05 table are historical/superseded; BE-020/021/023/025/026/028/030/031 and Expense/Maintenance CRUD scope BE-016 remain active.
- **Route/menu correction:** Executive page was still exposed despite BE-031. `EXECUTIVE_CONTRACT_CONFIRMED=false` now gates application navigation and Refine resources; `/dashboard` and authenticated `/login` redirect to Operations without mounting Executive requests. Existing auth/session/tenant guards and executive query/metric foundation are preserved. Profile/upload and other blocked menus remain dormant; reconciliation, rating preview, Optimization and Fleet remain enabled.
- **Settlement:** Inspected SettlementActions and exact controller commands. Existing submit-review/approve/lock/validation/corrections already align; no component change needed. No generic reject/recalculate/payment alias added. Revenue recalculation retains distinct evidence semantics; payment remains PayrollItem workflow.
- **Preservation:** LoadDocumentsPanel, executive.queries.ts, executive.metrics.ts and SettlementActions are byte-identical to the pre-task snapshot. No feature/test deleted. Removed only four pre-existing surplus EOF blank lines in en/vi/ja locales and dateTime.test.ts so the repository whitespace gate passes.
- **Graph evidence:** Pre-edit AppRouter and createFoundationResources impact LOW with RuntimeApplication callers; APP_NAV_ITEMS/supportedNames and test-file UNKNOWN results were confirmed by usage/discovery searches. Full working-tree CLI detect-changes reports 45 tracked files, 266 symbols, 24 flows and CRITICAL risk, including substantial pre-existing work. This is not a clean graph check or a claim that the full dirty tree is low risk. MCP's zero-symbol result was treated as unseen; the nonzero CLI result is retained. No commit made.
- **Verification:** Targeted navigation/router 2 files / 19 tests PASS. Final `npm run typecheck` PASS; `npm run lint` PASS; full `npm run test -- --maxWorkers=4 --minWorkers=1` **115 files / 633 tests PASS**; `npm run build` PASS; `git diff --check` PASS. Test total increased by four from the 114/629 baseline. Authenticated browser E2E NOT RUN; BE-021/test environment remains unresolved.
- **Before checklist:** Branch/HEAD/status/diff checked; dirty user work snapshotted and preserved; contracts/permissions/routes inspected; graph impact run before code edits.
- **After checklist:** Current task/gap matrices aligned; no unsupported production request/command added; existing DONE implementations retained; four gates and whitespace check PASS; persistent memory updated with HOFF-0014.
- **Next unblock:** Identity `/api/me`, then multipart Documents and the recorded resume order; reverify exact runtime contract and acceptance before activating retained UI. No task is user-deferred.

---

## FE-FOUNDATION-002 — blocked Profile navigation correction (2026-10-06)

- **Task / Status:** FE-FOUNDATION-002 remains BLOCKED_BACKEND. Corrective navigation slice DONE with four gates; no full Profile completion claim.
- **Contract Status / Backend Dependency:** BLOCKED GET `/api/me` (BE-021), absent from current OpenAPI/controller. Existing shared identity loader is preserved; no JWT identity fallback, synthetic employee/roles or duplicate identity request.
- **Route:** `/profile` kept as a route constant and retained implementation, but registration/app navigation/user dropdown are dormant under `PROFILE_CONTRACT_CONFIRMED=false` until backend identity is verified. Existing owned `/profile/payslips` remains independent and authorized through its confirmed contract.
- **Files:** features/profile/profile.contract.ts; existing AppHeader, appNavigation, AppRouter; header regression and navigation tests. ProfilePage/ProfileSummary/current-user/current-tenant hooks unchanged.
- **Mismatch / Implemented:** Earlier blocker report kept Profile exposed in two menus despite missing identity contract. Both entry points and route now use the explicit verified-contract gate. Existing logout and tenant reauthentication menu actions preserved; no startup probe or new capability/model introduced.
- **Query / Mutation:** No new fetch or mutation; dormant page never mounts via its production route. Existing shared session behavior unchanged.
- **Tests:** Typecheck/lint/build PASS; header/nav/Profile/route targeted 4 files / 29 tests PASS; full 114 files / 629 tests PASS. Added two regression tests, no existing Profile test removed. No auth/session/tenant foundation edits.
- **Blocker:** BE-021 retained; no backend changes authorized.
- **Next:** Retain FE-FOUNDATION-002 unchecked; verify identity contract and activate retained implementation only when backend supplies it. No other complete task is restarted.

---

## FE-FLEET-001 — Fleet historical report (2026-10-06)

- **Task / Status:** FE-FLEET-001 DONE for the confirmed V1 selected-period reporting scope. Overall frontend plan remains NOT COMPLETE.
- **Contract Status:** CONFIRMED GET `/api/reports/fleet/health` (utilization-history alias), FleetHistory.Report / Durations / MetricDto, source period/calculation/error rules and SecurityConfig roles verified against current 137-path OpenAPI.
- **Backend Dependency:** Published Fleet policy; 1–200 distinct tenant truck UUIDs; qualified historical intervals/mileage; explicit date-only half-open period and business ZoneId. No policy/truck collection enumeration or current status substitute.
- **Route:** `/reports/fleet`; lazy route under existing authenticated/tenant and FLEET_REPORT_VIEW guards; capability-filtered navigation. Roles ADMIN/ACCOUNTANT/PAYROLL/PAYROLL_MANAGER; DISPATCHER denied for `/api/reports/fleet/**`.
- **Files:** types/fleetReport.dto.ts; features/fleet/fleetReport.api.ts, FleetKpiGrid.tsx, FleetHealthTable.tsx; pages/fleet/FleetReportPage.tsx; new resource vocabulary/permission, existing router/navigation, locales vi/en/ja; fixture + KPI/coverage/page/locale tests and existing parity/navigation tests.
- **Query / Mutation:** Refine useCustom GET enabled only after explicit submit and resolved tenant/permission; tenant/full-scope cache key. UUID list serialized as comma-separated truckIds for Spring, dates remain YYYY-MM-DD with explicit zone; no X-Tenant/query tenant. Reset hides report, changed submitted filters select only that report; read only, no mutation/invalidation. Coverage pages only the already-returned backend rows (20 per page), no per-row fetch or frontend KPI aggregation.
- **Mismatch:** Plan's proposed time-series chart has no V1 source points; actual endpoint provides a selected-period aggregate and coverage. Render those without invented chart points/query wrapper. Actual metric/reason codes replace plan examples explicitly; executive summary and legacy dashboard compatibility remain independently BE-031. Original plan requirements retained with runtime alignment notes.
- **Implemented:** Backend utilization/loaded/deadhead independently; available/partial/unavailable/not-applicable, invalid/missing dash and true-zero distinction; raw numerator/denominator/basis/reasons retained. Health missing history never becomes zero or currency assumption. Separate loading/request error + code/requestId/retry/empty coverage/403/permission states. Date display uses selected business zone via existing formatter.
- **Tests:** Targeted 5 files / 53 PASS; typecheck/lint/build PASS; final full 113 files / 627 tests PASS. Added 29 tests, none removed. Serializer trailing-delimiter case verified; Antd text selectors corrected without timeout changes. Valid decimal display uses formatter callback. No production fixture or real financial mutation.
- **Blocker:** No missing backend contract for confirmed V1 Fleet report. New Executive integration remains BE-031; authenticated deterministic E2E remains BE-021.
- **Next:** Profile navigation correction completed next; retain remaining backend/authorization dependencies and E2E explicitly unresolved.

---

## FE-OPT-001 / FE-OPT-002 — Optimization integration (2026-10-06)

- **Task / Status:** FE-OPT-001/002 DONE for confirmed run/explain/accept. Existing foundation/screens preserved.
- **Contract Status:** CONFIRMED POST `/api/optimization/runs`, GET `/{id}`, POST `/{id}/assignments/{candidateId}/accept`; exact CreateRequest/Outcome/AcceptRequest/Accepted and source eligibility/scoring/acceptance services verified. Planned select path is not used.
- **Backend Dependency:** Published policy, explicit Load/Trip/accepted-rating/pickup-stop targets, distinct driver/truck scope and candidate-bound qualified source IDs; backend HOS/routing/forecast completeness/revalidation. ADMIN/DISPATCHER only.
- **Route:** `/optimization`; `/optimization/runs/:id`; lazy authenticated/tenant/resource guard and capability-filtered navigation.
- **Files:** types/optimization.dto.ts; features/optimization API/action hook/form/candidate table/explanation drawer/error; pages/optimization entry/show; exact permission/status vocabulary, locales vi/en/ja and tests.
- **Query / Mutation:** No startup collection/prefetch or per-row requests. Explicit UUID open or confirmed run creation; immutable cached run keyed by tenant/run. Accept requires original fingerprint/feasibility, confirmation, stable per-candidate key, shared single-flight, domain error/requestId/success and only affected run/Trip-detail invalidation. Real acceptance response cached separately; immutable audit never rewritten to an invented status.
- **Mismatch:** Candidate API returns pickup ETA only, and run GET is immutable calculation audit without prior acceptance. No delivery ETA/accepted-state GET invented. UI shows current server command acceptance; after a fresh session backend conflict checks remain final authority. Authoritative rank, final score, component raw/normalized/weight/contribution, policy versions and all rejection codes displayed unchanged. No browser score/profit/HOS calculation.
- **Tests:** Targeted 63 PASS; typecheck/lint/build PASS; full 110 files / 598 tests PASS. Added 32 tests; none removed. Initial Antd rejection exposed unhandled confirmation errors; now workflow consumes normalized failure, closes confirmation and preserves explicit retry key. Test assertion narrowed to money text to avoid matching UUIDs.
- **Blocker:** No missing backend contract for the confirmed run/explain/accept workflow. Authenticated deterministic browser environment remains absent BE-021.
- **Next:** Four gates passed; continue Fleet reporting.

---

## FE-RATE-002 — Rating / FSC preview (2026-10-06)

- **Task / Status:** FE-RATE-002 DONE for the confirmed V1 policy display/preview. FE-RATE-001 remains BLOCKED_BACKEND for collection/history, not silently replaced by preview.
- **Contract Status:** CONFIRMED POST `/api/loads/{id}/rating/preview`; current RatingPreviewRequest/RatingPreview/FuelSurchargeResult and controller/service checked. V1 supports linehaul FLAT/PER_MILE and FSC INDEX_BASED_MPG only. No hypothetical FSC methods exposed.
- **Backend Dependency:** Existing versioned rule/contract, business pickup date, authoritative mileage/accessorial evidence and eligible fuel-index source. Exact ADMIN/ACCOUNTANT access; backend resolves persisted customer/date.
- **Route:** Existing `/loads/show/:id` → Financial → Rating/FSC Preview; permission-guarded tab, no new global route.
- **Files:** types/rateRule.dto.ts; features/rates/rateRule.api.ts, FscPolicyFields.tsx, FscPreview.tsx; LoadFinancialPanel; exact rates/RATE_PREVIEW permission and tests; vi/en/ja; fixtures/rating and preview/locale tests.
- **Query / Mutation:** Explicit preview POST only on submit; shared single-flight, disabled pending form, no startup/tab-open fetch, no unrelated invalidation or financial write. Old results removed on input change. Money/date formatter reuse; no local formula/totals, no null-zero fallback.
- **Tests:** Targeted 30 PASS; typecheck/lint/build PASS; full 105 files / 566 tests PASS. Added 14 tests, no tests removed.
- **Blocker:** No backend blocker for this read-only preview. Rate list/history and E2E identity separately blocked.
- **Next:** Four gates passed; Optimization completed next in plan order.

---

## Runtime refresh — 2026-10-06

- Fresh localhost:8080 OpenAPI now has 137 paths. BE-029 deployment mismatch is resolved for payroll cases/reconcile/no-payment-required, Rating preview/version APIs, Optimization run/read/accept and Fleet health/history. Earlier dated reports below are historical, superseded for runtime availability by this check.
- FE-PAYROLL-005 DONE: retained bank reconciliation route/link activated after exact DTO/actor/role verification. Targeted 24 tests PASS; typecheck/lint/build PASS; full 103 files / 552 tests PASS. No existing test removed. Scheduling, dispatch, failure/retry and evidence reconciliation are complete for the confirmed backend workflow. Existing baseline/date tasks remain DONE and are not reimplemented.
- Rating FSC preview and Optimization are now DONE with four gates PASS (task evidence above). Fleet is DONE for confirmed V1 scope with four gates PASS. FE-RATE-001 still lacks collection/history reads; FE-DASH-001 still lacks executive-summary/report compatibility. Runtime presence alone does not complete any UI task.
- Identity, upload, global costs, residual settlement/payroll reads, driver payment evidence and messaging authorization remain blocked. Frontend-only scope retained; no backend or environment mutation.

---

## Historical checkpoint — FE-LOAD-001 Documents read completion (2026-10-05)

> SUPERSEDED BY 2026-10-06 RUNTIME REFRESH for runtime absence; Documents read completion evidence remains valid.

- **Task:** FE-LOAD-001, confirmed Documents read slice.
- **Status:** DONE for Documents read slice; overall task remains BLOCKED_BACKEND for multipart upload and Exceptions.
- **Contract Status:** CONFIRMED GET `/api/documents` with loadId and server page/pageSize; BLOCKED POST upload. Rechecked configured localhost:8080 OpenAPI and DocumentController/DocumentView. Running backend still lacks identity/upload, Rating/Optimization, latest reconciliation and required fleet endpoints.
- **Backend Dependency:** Existing DocumentController search and DocumentView; no backend change or production stub. User confirmed frontend-only scope; backend implementation/runtime alignment remains outside this task. Missing contracts keep their BLOCKED_BACKEND/BLOCKED_AUTHORIZATION states.
- **Route:** Existing lazy Documents tab at `/loads/show/:id`; no new route/menu.
- **Files:** `src/features/loads/LoadDocumentsPanel.tsx`, `src/types/document.dto.ts`, LoadShow keyed panel, locales vi/en/ja; `src/tests/features/loads/LoadDocumentsPanel.test.tsx`; contract follow-up at `docs/frontend-backend-unblock.md`.
- **Implemented:** Reuse Refine useList and BaseTable, server page size 20/total, loadId-only filter, permission/tenant gate, tenant/load/page cache key, reset on load change, separate loading/error/empty/forbidden/retry, central StatusTag/statusTone, responsive horizontal scroll. Only the selected tab mounts/fetches; no per-row getOne or screen prefetch.
- **Mismatch:** Existing panel hid server pagination and showed createdAt under Uploaded At even though DocumentView has neither upload nor creation timestamp. Added exact DTO and display capturedAt as Captured at; never relabel it as upload time. Known document status/type labels localized; no generic provider/API/auth/tenant foundation rewrite.
- **Query / Mutation:** Current load's requested page only; upload remains fully dormant, no mutation enabled.
- **Tests:** typecheck PASS; lint PASS; full **103 files / 550 tests PASS**; build PASS. Targeted **2 files / 12 tests PASS**, including eight new real Refine cases for paging/filter/cache/load changes/null timestamps/read/error/retry/permission/tenant/403. Tests increased from 542 to 550. No test removal/check bypass.
- **Blocker:** BE-020/021/023/025/026/028/029/030 and other remaining contracts as listed in `docs/frontend-backend-unblock.md`. Browser E2E NOT RUN because identity/test environment remains absent. Backend source and existing containers/data were not modified.
- **Next:** User confirmed "Chỉ frontend; giữ rõ các task bị backend chặn". Resume the earliest newly READY frontend task after backend supplies its contract; no task is user-deferred or marked DONE solely because it is blocked. Overall FRONTEND PLAN remains NOT COMPLETE.

---

## Historical checkpoint — FE-PERF-001 (2026-10-05)

- **Task / Status:** FE-PERF-001 DONE for current ready feature splitting. Overall frontend v2 remains NOT COMPLETE; no blocked task was ticked as complete.
- **Contract Status / Backend Dependency:** Frontend-only bundle task; existing APIs/query semantics retained. Future Optimization remains blocked independently by BE-029.
- **Route:** Existing lazy Dashboard, Operations, Payroll and Payslip routes; Leaflet's point-triggered dynamic import retained.
- **Files:** `src/pages/dashboard/DashboardPage.tsx`, `scripts/measure-frontend-bundle.mjs`, `docs/frontend-performance.md`, before/after JSON artifacts, plan/tracker/workflow memory.
- **Implemented:** FinancialSection/Recharts becomes a feature-level dynamic import under local Suspense with existing localized section/Skeleton fallback. Existing KPI sections render independently of chart-module loading. No manualChunks, warning-limit change, framework migration, business/query foundation edit or Operations rewrite.
- **Query / Mutation:** Unchanged; no additional backend request, prefetch or client financial calculation.
- **Tests:** Targeted executive metric/dashboard data/Leaflet regression **3 files / 8 tests PASS**; typecheck PASS; lint PASS; full **102 files / 542 tests PASS**; build PASS. Emitted dependency graph confirms all six measured feature roots excluded from bootstrap, charts excluded from Dashboard static graph. No tests removed.
- **Measurement:** Dashboard additional static JS 445,978 → 52,924 bytes (−88.1%); gzip 124,760 → 15,193. Bootstrap 2,570,990 → 2,572,067 bytes (approximately unchanged). Largest chunk 505,644 → 470,110 bytes; build no longer emits >500 kB warning. See reproducible evidence in `docs/frontend-performance.md`; no browser speed claim.
- **E2E / Blocker:** E2E NOT RUN; BE-021 identity missing. No independent READY frontend task remains in the verified queue; restore backend identity/upload and align running financial/reporting/rating/optimization contracts, then resume earliest newly READY task. Messaging requires authenticated participant/actor contract BE-030.
- **Next:** Backend contract resolution, then priority continuation. Preserve completed work and never treat blocked work as DONE.

---

## Historical checkpoint — Payslip read/PDF, Notifications and runtime reconciliation (2026-10-05)

- **Task / Status:** Notification completion DONE. FE-PAYROLL-004 BLOCKED_BACKEND: confirmed own-list/detail/PDF slice complete, current driver payment status missing (BE-028). FE-PAYROLL-005 remains BLOCKED_BACKEND following live-runtime correction BE-029; bank reconciliation route/link disabled despite retained source-contract implementation/tests. FE-LOAD-001 has no remaining independent ready work; upload/Exceptions dependencies keep it BLOCKED_BACKEND.
- **Contract Status / Backend Dependency:** CONFIRMED GET `/api/driver/me/payslips`, GET `/api/payslips/{id}`, GET `/api/payslips/{id}/pdf`; persisted employee ownership verified in PayslipController/services. CONFIRMED GET `/api/notifications` and POST `/api/notifications/mark-all-read`; command changes shared tenant-wide records. No individual mark-read/global unread-count contract. REST messaging exists, but authenticated participant/actor authorization is unresolved (BE-030), so FE-MSG-001 is BLOCKED_AUTHORIZATION.
- **Route:** `/profile/payslips`, `/payslips/:id`, existing `/notifications` and header. No production reconciliation/rating/optimization/fleet menu activated for source-only endpoints.
- **Files:** `src/features/payslips/*`, `src/pages/payslips/*`, `src/types/payslip.dto.ts`, App/router/navigation/role mapping/locales; `src/features/notifications/useNotificationActions.ts`, `components/NotificationMarkAllRead.tsx`, existing header/list/columns; five new feature/page test files, existing navigation/notification sound regression and typed finance harness.
- **Query / Mutation:** Payslip read cache scoped to cached employee/tenant; no duplicate identity fetch. PDF uses existing authenticated API download method, validated UUID endpoint, verified PDF MIME and revoked object URL; no untrusted DTO URI fetch. Payslip issuance never implies payment success; unavailable payment/tax remains explicit. Notifications fetch only widget five-record page or current list; no local fake read state/count or unsupported sorter. Confirmed tenant-wide mark-all action has permission/tenant gate, impact confirmation, pending/single-flight, domain code/requestId and invalidation limited to notification list/detail/header.
- **Tests:** typecheck PASS; lint PASS; full unit/integration **102 files / 542 tests PASS**; build PASS. Added payslip ownership/cache/permissions/snapshot/null/money/PDF tests and eight notification mutation/header integration cases. Existing three notification sound cases retained. No tests removed or checks bypassed.
- **E2E:** NOT RUN; authenticated identity contract BE-021 absent. No live payroll provider/payment success certification.
- **Blocker / Next:** FE-PAYROLL-004 payment evidence BE-028, runtime alignment BE-029, messaging authorization BE-030; all explicitly unchecked. Continue dedicated FE-PERF-001 measured splitting; overall frontend plan NOT COMPLETE.

---

## Historical payroll source checkpoint — FE-PAYROLL-002 / FE-PAYROLL-005 (2026-10-05)

> Historical source/deployment evidence only. SUPERSEDED BY 2026-10-06 RUNTIME REFRESH: FE-PAYROLL-005 is now DONE with its route/link enabled; the current first matrix governs execution.

- **Status:** DONE for confirmed run/workflow and bank/Stripe payment/reconciliation scope. FE-PAYROLL-001 collection and FE-PAYROLL-003 profile/config read remain BLOCKED_BACKEND (BE-026); no fake list/menu endpoint. MANUAL-method completion gap documented BE-027.
- **Contract:** Confirmed controller/services as recorded in the active slice log. Runtime states/source enums preserved; no guessed endpoint alias, tax/net, country rule, payment result or event history.
- **Files:** `src/pages/payroll/*`, `src/features/payroll/*`, `src/types/payroll.dto.ts`, route/router/nav/locales; eight test files and payroll fixture.
- **Query / Mutation:** Page/tab/selected-item only; cases use server pagination. Exact existing payroll guards, stable replay keys, confirmation and single-flight. Successful commands invalidate only current-tenant affected run/item/related settlement queries/case pages. Unknown dispatch refreshes scoped evidence; succeeded payments offer no retry; zero-net never creates a transfer. Forms use normalized field error mapping. Provider references masked.
- **Tests:** typecheck PASS; lint PASS; full suite **97 files / 513 tests PASS**; build PASS. Payroll/nav targeted suite **61 tests PASS**. Read/loading/empty/error/retry/permission, actual transition matrix, jurisdiction blocker, four country-neutral resolution cases, retry identity/date-only inputs, masked references, all active payment guards, zero-net, bank evidence confirmation, server pagination, scoped invalidation and provider unknown-outcome covered. Locales vi/en/ja have matching new keys and domain errors. No test removal or quality bypass.
- **E2E:** NOT RUN; authenticated identity contract BE-021 missing. Provider/production statutory adapters are not configured or certified here. Existing chunk warning remains outside this task.
- **Next:** FE-PAYROLL-004 payslip self-service/detail/PDF; then backend-aligned Rating → Optimization → Fleet.

---

## FE-PROFIT-001 — Verified by-load profitability screen (2026-10-05)

- **Status:** DONE for the runtime-confirmed by-load report. Planned unsupported filters/scopes are documented at BE-024; no fake request or financial fallback introduced.
- **Contract:** CONFIRMED GET `/api/reports/profitability/by-load`, optional UUID `loadId`, response `List<LoadFinancialSummary>`. Explicit projection to existing summary presentation preserves authoritative MetricDto values; individual financial-summary keeps its distinct `LoadProfitabilityReport` DTO.
- **Route:** `/finance/profitability`, lazy-loaded with PROFITABILITY_VIEW route/page guard; navigation permission-filtered. No generic resource or foundation redesign.
- **Files:** `pages/profitability/ProfitabilityPage.tsx`, `features/profitability/ProfitabilityFilters.tsx`, `ProfitabilityBreakdownTable.tsx`, existing summary/metric/display/API modules, routes/router/navigation, locales vi/en/ja; three profitability test files and navigation regression.
- **Query:** Page-only reporting request, only supported `loadId` filter, UUID validation, current-tenant cache key/permission gate. Selecting report detail uses returned data and never requests getOne per row. No client aggregate KPIs; mixed currencies retain row currency. Missing backend share is shown unavailable, never calculated.
- **Tests:** typecheck PASS; lint PASS; full suite **85 files / 440 tests PASS**; build PASS. Read/empty/error/retry/permission/tenant gate, filter refetch, all four availability states, zero revenue, null amounts, unclassified cost policy/source and per-mile precision covered. E2E NOT RUN because authenticated identity contract is absent (BE-021).
- **Review corrections:** Reused `common.view` locale key; tests target accessible table headers instead of Ant Design measurement cells. No test removal or timeout increase.
- **Next:** FE-SETTLEMENT-003 / 004. Inspection found FE-SETTLEMENT-002 list incorrectly sums mixed-currency gross/net using float and labels USD; repair this proven defect within the settlement slice before retaining DONE. No redo of valid policy versioning.

---

## FE-COST-002 / FE-ACCESSORIAL-001 — Financial corrective gate (2026-10-05)

- **Status:** DONE for confirmed embedded costs/accessorial scope. FE-COST-001 standalone collection/detail remains BLOCKED_BACKEND (BE-023). FE-LOAD-001 remains IN_PROGRESS because upload/Exceptions contracts remain missing.
- **Contract:** CONFIRMED using refreshed runtime OpenAPI plus ShipmentCostController, AccessorialController, ReportController and exact existing finance capabilities. Actual cost basis is ESTIMATE/ACCRUAL/ACTUAL, approval state PENDING_APPROVAL, method PUT. No invented post/void/status dropdown.
- **Files:** LoadFinancialPanel/LoadFinancialSummary, ShipmentCostTable, AccessorialChargesTable/useAccessorialApproval, profitability.api cache keys, financial presentation components, locales vi/en/ja; Financial panel integration tests, approval workflow tests and finance fixtures/harness.
- **Implemented:** Backend-owned summary only; lazy tab mounting; tenant-scoped cache keys with identity/permission gates (no tenant transport parameter); separate cost basis/status and three accessorial money amounts; no USD fallback or inferred driver pay; confirmation, single-flight, domain errors/requestId and scoped invalidation for approval.
- **Mismatch repaired:** The old tests required browser aggregation and obsolete deliveryCost props. Replaced with six meaningful panel integration cases and three workflow cases; test count increased. Existing statusTone translations for seven finance states were missing; added en/vi while new finance presentation has complete vi/en/ja keys.
- **Tests:** typecheck PASS, lint PASS; full suite 82 files / 424 tests PASS; build PASS. Browser E2E NOT RUN: shared identity GET /api/me absent (BE-021), so no authenticated integration certification. Build retains the existing chunk-size warning; no unrelated performance rewrite.
- **Next:** FE-PROFIT-001 verified by-load report. The collection DTO is LoadFinancialSummary while the individual financial-summary DTO is LoadProfitabilityReport; only loadId filtering is supported (BE-024).

---

## Historical progress audit — 2026-10-05 (superseded by completed task gates above/below)

- Checklist hiện tại được tick trực tiếp tại mục 49 của `plan-frontend-v2-implementation-ready.md`. Chỉ task hoàn thành tại checkpoint có bằng chứng mới được tick; task có component nhưng còn thiếu screen/contract/tests vẫn để chưa tick.
- **Current verification (re-run during progress audit):** `npm run typecheck` FAIL với 3 TS2322 tại `src/tests/features/loads/LoadFinancialPanel.test.tsx` vì test vẫn truyền `deliveryCost` đã bỏ khỏi props. `npm run test -- src/tests/features/loads/LoadFinancialPanel.test.tsx --maxWorkers=2 --minWorkers=1` FAIL: 3 failed / 1 passed. Chưa chạy lại full suite/lint/build/browser E2E ở checkpoint audit này; các PASS trong log trước là bằng chứng lịch sử.
- **FE-LOAD-001 → IN_PROGRESS:** Shell/tab panels đã có, nhưng Financial đang thay đổi; Exceptions chỉ là blocked notice và Documents upload vẫn bị chặn BE-020. Không chứng nhận toàn bộ Load business tabs DONE.
- **FE-COST-002 / FE-ACCESSORIAL-001 → IN_PROGRESS:** Code mới đã tách costs/accessorial tables, thêm backend summary, permission guard/confirmation và approval invalidation. Nhận xét client aggregation trong continuation log là trạng thái trước sửa; implementation mới vẫn cần hoàn thiện và kiểm chứng.
- **FE-PROFIT-001 → IN_PROGRESS:** Có `profitability.dto.ts`, endpoint/query-key constants, summary/metric components; chưa có profitability page/route và report filters/breakdown hoàn chỉnh.
- **FE-COST-001 → BLOCKED_BACKEND:** Standalone global collection/detail contract chưa xác nhận; embedded load-scoped costs không được tính thay thế standalone list.
- **FE-RATE-001/002, FE-OPT-001/002, FE-FLEET-001 → NOT_STARTED:** Backend progress ngày 2026-10-05 ghi Convention V1 Phases 0–8 COMPLETE. Bỏ lý do lịch sử “Phase 6/7 pending”; contract/frontend integration của từng task vẫn phải đối chiếu runtime trước khi code.
- Canonical IDs theo v2: `FE-TRIP-001` (historical alias `FE-OP-001`), `FE-EXPENSE-001` (historical alias `FE-EXP-001`). Các task DONE trước giữ checkpoint riêng; không có tuyên bố toàn repo hiện tại PASS hoặc đã triển khai production.
- Next: Financial quality gates → Shipment Costs / Accessorial → Profitability → Settlement detail/adjustments → Payroll → Rating → Optimization → Fleet.

---

## Continuation verification — 2026-10-05

- Branch `KAN-79-integrations-dang-nhap-bang-lark`, HEAD `0eb8bf6`; existing dirty Lark and feature work preserved. No reset/stash/checkout/commit.
- Context is at `docs/frontend-context-current.md`, not the repository root. Backend progress is `/home/vumoi/logictics_api/plan-progress-summary.md` (backend Convention V1 Phases 0–8 complete).
- Incoming quality gates were re-executed: typecheck, lint, all 79 files / 384 tests, build PASS. FE-BASE-001 and FE-FOUNDATION-001 source/tests exist and remain DONE; no redundant implementation.
- Runtime `http://localhost:8080/v3/api-docs` and current Spring controllers override historical logs below. The earlier logs are retained as history, not current runtime certification.
- **FE-DOC-001 mismatch:** `/api/documents` has GET only (individual documents have GET/DELETE). No multipart POST exists; historical `/api/v1/documents` claim is also unsupported. Upload code/tests are preserved but the modal does not mount, expose any trigger, or instantiate its upload hook until `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED` becomes true following runtime verification. Status **BLOCKED_BACKEND**, contract **BLOCKED**, dependency POST multipart + DTO/permissions; files `documents.api.ts`, `DocumentUploadModal.tsx`, modal tests; blocker BE-020; next verify backend upload contract.
- **FE-FOUNDATION-002 mismatch:** runtime and current backend source do not expose `/api/me`. Profile implementation correctly reuses `useCurrentUser`/`useCurrentTenant` and is retained, but live authenticated integration cannot be DONE until the existing identity-loader dependency is restored. Status **BLOCKED_BACKEND**, contract **BLOCKED**, dependency `/api/me`; blocker BE-021; no auth/session/tenant workaround added.
- **FE-COST-002 / FE-LOAD-001 mismatch:** current Financial panel computes costs, accessorial revenue and margin in-browser, defaults currency to USD, and exposes approval without a capability guard/confirmation. This contradicts the approved plan; repair is required before declaring financial work DONE. Confirmed summary endpoint is GET `/api/loads/{loadId}/financial-summary`.
- **Authorization mismatch / user decision:** backend finance authorities are ADMIN, ACCOUNTANT, PAYROLL, PAYROLL_MANAGER; frontend's five legacy roles are not aliases. User explicitly approved retaining them and adding exact backend authorities, representation-only ROLE_ normalization, per-endpoint action matrix and allowed/denied tests. No SUPERADMIN bypass. Track this corrective task as **FE-AUTH-001** before further finance work.
- Next order remains Trip execution → Shipment Costs → Accessorial → Profitability → Settlement → Payroll → Rating → Optimization → Fleet. Prior log's proposed Profitability-after-Settlement order is superseded by the user's required queue. No global cost endpoint will be invented.
- FE-DOC-001 corrective gate: typecheck/lint/build PASS; full suite PASS at 79 files / 385 tests after fixing the new blocked-modal assertion to exclude Ant Design's provider wrapper. No tests removed. Runtime POST remains absent, so feature status stays BLOCKED_BACKEND.

---

## Task Progress Overview

| Task ID | Description | Status | Contract Status | Route | Blockers |
|---|---|---|---|---|---|
| **Batch 1: Foundation** | | | | | |
| **FE-BASE-001** | Close Lark auth lint quality gap (`@typescript-eslint/no-explicit-any`) | **DONE** | CONFIRMED | `/auth/callback`, `/login` | None |
| **FE-FOUNDATION-001** | Normalize transport/domain date representation (ISO strings vs Date) | **DONE** | CONFIRMED | All generic resources | None |
| **FE-FOUNDATION-002** | Authenticated user profile page (`/profile` consuming `/api/me`) | **BLOCKED_BACKEND** | BLOCKED | Dormant `/profile` | BE-021: live identity absent; retained page, route and both menu entries gated |
| **FE-DOC-001** | Multipart document upload modal & action | **BLOCKED_BACKEND** | BLOCKED | `/documents` | BE-020: POST multipart absent; upload dormant |
| **FE-AUTH-001** | Exact backend finance authority/action matrix | **DONE** | CONFIRMED | Finance route/action boundaries | None; exact backend authorities, no aliases |
| **Batch 2: Operations Execution** | | | | | |
| **FE-TRIP-001** (alias FE-OP-001) | Trip detail execution extensions, stop actions & driver history | **DONE** | CONFIRMED | `/trips/show/:id` | None at recorded task checkpoint |
| **FE-LOAD-001** | Load detail business tabs (Overview, Timeline, Financials, Documents, Trip, Exceptions) | **PARTIAL / BLOCKED_BACKEND** | CONFIRMED / BLOCKED | `/loads/show/:id` | Financial + Documents read/paging gates PASS; upload BE-020; Exceptions contract absent |
| **Batch 3: Financial & Profitability** | | | | | |
| **FE-COST-001** | Standalone shipment cost list/detail | **BLOCKED_BACKEND** | BLOCKED | `/finance/shipment-costs` (planned) | BE-023: global collection/detail absent; no standalone screen |
| **FE-COST-002** | Shipment cost embedded tracking and backend financial summary | **DONE** | CONFIRMED | `/loads/show/:id` | None for embedded scope; E2E dependency BE-021 retained |
| **FE-ACCESSORIAL-001** | Load-scoped accessorial table and approval UX | **DONE** | CONFIRMED | `/loads/show/:id` | None for embedded scope; E2E dependency BE-021 retained |
| **FE-PROFIT-001** | Profitability reporting & contribution analysis | **DONE** | CONFIRMED | `/finance/profitability` | None for verified by-load scope; unsupported dimensions BE-024 |
| **FE-DASH-001** | New executive/fleet metrics | **PARTIAL / BLOCKED_BACKEND** | BLOCKED compatibility | Dormant Executive; `/dashboard` redirects to Operations | BE-031: executive-summary absent; legacy/new report DTO and parameter mismatch |
| **Batch 4: Driver Settlements** | | | | | |
| **FE-SETTLEMENT-001** | Driver pay policy versioning (`create` / `new-version`, ratio convention) | **DONE** | CONFIRMED | `/settlements/policies` | None |
| **FE-SETTLEMENT-002** | Driver settlement list & filters/calculation | **DONE** | CONFIRMED | `/settlements` | Runtime-supported filters; collection pagination local, unsupported planned filters BE-025 |
| **FE-SETTLEMENT-003** | Settlement detail & workflow transitions | **PARTIAL / BLOCKED_BACKEND** | CONFIRMED / BLOCKED | `/settlements/:id` | Confirmed detail/commands PASS; unsupported planned commands/audit BE-025 |
| **FE-SETTLEMENT-004** | Settlement adjustments & reversals UX | **DONE** | CONFIRMED | `/settlements/:id` | None for confirmed explicit-amount correction scope |
| **Batch 5: Payroll & Reconciliation** | | | | | |
| **FE-PAYROLL-001** | Payroll run list & calculation trigger | **BLOCKED_BACKEND** | BLOCKED | `/payroll` | BE-026: no collection GET; calculate/detail exist |
| **FE-PAYROLL-002** | Payroll run detail, validated workflow & explicit create/open entry | **DONE** | CONFIRMED | `/payroll`, `/payroll/:id` | No collection claim; BE-026 tracked in FE-PAYROLL-001 |
| **FE-PAYROLL-003** | Multi-jurisdiction employee payroll profiles | **BLOCKED_BACKEND** | CONFIRMED / BLOCKED | Payroll item jurisdiction summary | BE-026: no profile/history/config read; actual resolution evidence display implemented |
| **FE-PAYROLL-004** | Employee payslips self-service & PDF export | **PARTIAL / BLOCKED_BACKEND** | CONFIRMED / BLOCKED | `/profile/payslips`, `/payslips/:id` | Confirmed reads/PDF gates PASS; payment status BE-028 |
| **FE-PAYROLL-005** | Payroll payment scheduling & bank reconciliation | **DONE** | CONFIRMED | `/payroll/:id`; `/payroll/reconciliation` | Live cases/reconcile verified; scoped invalidation/replay/permission/confirmation; 103 files / 552 tests + four gates PASS |
| **Notification completion** | Persisted tenant-scoped mark-all-read; header/list states | **DONE** | CONFIRMED | `/notifications`, header | No per-item mark-read/unread-count API; no fabricated count |
| **FE-PERF-001** | Measured route/feature code splitting | **DONE** | Frontend only | Existing lazy routes | None; new Optimization/Fleet routes reuse lazy boundaries |
| **Remaining / Blocked Tasks** | | | | | |
| **FE-RATE-001** | Rate rules list/history | **BLOCKED_BACKEND** | BLOCKED collection/history | No global menu | Collection/history missing; version/authoring contracts confirmed |
| **FE-RATE-002** | FSC policy display/preview | **DONE** | CONFIRMED V1 | Load Financial tab | 105 files / 566 tests and four gates PASS |
| **FE-OPT-001** | Optimization run/read/accept | **DONE** | CONFIRMED | `/optimization`; `/optimization/runs/:id` | Exact immutable run/acceptance workflow; 110 files / 598 tests and four gates PASS |
| **FE-OPT-002** | Backend explainability | **DONE** | CONFIRMED | Candidate drawer | Raw/unit/normalized/weight/contribution and policy versions unchanged; no score calculation |
| **FE-FLEET-001** | Fleet report page | **DONE** | CONFIRMED V1 health/history | `/reports/fleet` | 113 files / 627 tests and four gates PASS; executive integration separately BE-031 |
| **FE-EXPENSE-001** (alias FE-EXP-001) | Standalone driver expense claim workflow | **BLOCKED_BACKEND** | BLOCKED | `/expenses` | BE-016: Collection CRUD absent; individual approval/report/sync exists |
| **FE-MAINT-001** | Maintenance record PM scheduling | **BLOCKED_BACKEND** | BLOCKED | `/maintenance` | BE-016: CRUD/PM workflow absent; report aggregates insufficient |
| **FE-MSG-001** | Specialized conversation/message adapter | **BLOCKED_BACKEND / BLOCKED_AUTHORIZATION** | CONFIRMED REST / BLOCKED actor authorization | No exposed menu | BE-030: participant/actor ownership not bound to authenticated employee |

---

## Detailed Task Log

> Historical task logs below retain their original checkpoint evidence. The CURRENT RUNTIME CONTRACT — 2026-10-06 and current overview above govern execution. Old DONE/BLOCKED/IN_PROGRESS/NOT_STARTED labels are not current task status: Profile/upload remain blocked; Documents read and embedded costs are done slices; reconciliation/Rating/Optimization/Fleet runtime absence is superseded. Historical gate counts are superseded by the final verified correction batch.

### FE-AUTH-001 — corrective authority contract
- **Task**: Mirror exact backend finance authorities/actions, preserving legacy operational grants.
- **Status**: DONE
- **Contract Status**: CONFIRMED (SecurityConfig + relevant controllers/services + LarkAuthService/Filter; user direction received).
- **Backend Dependency**: See `docs/frontend-finance-authorization.md` for every capability/method/path/authority. Backend currently permits all four finance authorities to approve/lock; no invented narrower rule, role alias, or SUPERADMIN bypass.
- **Route**: Existing settlement and policy route guards now use exact read capabilities. Load Financial tab checks cost/accessorial read capabilities; denied/unresolved reads remain disabled. Financial action guard uses ACCESSORIAL_APPROVE. Restricted app navigation is capability-filtered.
- **Files**: `types/roles.types.ts`, `providers/permissions/jwtRoles.ts`, `roleMatrix.ts`, `router/AppRouter.tsx`, `components/appNavigation.tsx`, `AppHeader.tsx`, settlement list/policy pages, LoadShow/LoadFinancialPanel; authority, route/action, navigation and page tests.
- **Tests**: typecheck PASS; lint PASS; full suite PASS **81 files / 419 tests** (`npm run test -- --maxWorkers=4 --minWorkers=1`); build PASS. Unbounded suite initially hit three 5s timeouts during concurrent build; bounded rerun includes every test with unchanged timeout. Real Refine/provider tests prove denied screens never mount. Unknown authority/resource/action denied. No production token logged.
- **Blocker**: None for frontend matrix. `/api/me` dependency remains BE-021; authenticated browser E2E is not claimed.
- **Next**: FE-COST-002 corrective financial summary + FE-ACCESSORIAL-001, then FE-PROFIT-001. Global FE-COST-001 still needs its runtime collection/detail contract.

### FE-BASE-001
- **Task**: Close Lark auth lint quality gap
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Backend Dependency**: `/api/auth/lark/callback`, `/api/auth/lark/login`
- **Route**: `/auth/callback`, `/login`
- **Files**:
  - `src/tests/pages/auth/LarkCallbackPage.test.tsx`
  - `src/tests/pages/auth/LoginPage.test.tsx`
- **Tests**:
  - `npm run lint` -> PASS (0 errors, 0 warnings)
  - `npx vitest run src/tests/pages/auth` -> 2 files passed, 4 tests passed
  - `npm run typecheck` -> PASS
- **Blocker**: None
- **Next**: FE-FOUNDATION-001

---

### FE-FOUNDATION-001
- **Task**: Normalize transport/domain date representation (ISO strings vs Date)
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Backend Dependency**: None (frontend contract normalization)
- **Route**: Generic CRUD resources (`loads`, `trips`, `customers`, `invoices`, `payments`, `terminals`, `expenses`, `containers`)
- **Files**:
  - `src/types/api.types.ts` (added `ISODate = string`)
  - `src/types/load.types.ts`
  - `src/types/trip.types.ts`
  - `src/types/invoice.types.ts`
  - `src/types/payment.types.ts`
  - `src/types/terminal.types.ts`
  - `src/types/expense.types.ts`
  - `src/types/container.types.ts`
  - `src/formatters/dateTime.ts` (added `formatDateOnly`, `formatDateTime`)
  - `src/tests/utils/dateTime.test.ts` (10 tests)
  - `src/tests/types/load.contract.test.ts` (2 tests)
  - `src/tests/types/trip.contract.test.ts` (2 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (61 test files, 313 tests)
  - `npm run build` -> PASS
- **Blocker**: None
- **Next**: FE-FOUNDATION-002

---

### FE-FOUNDATION-002
- **Task**: Authenticated user profile page (`/profile` consuming `/api/me`)
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Backend Dependency**: Reuses cached current user identity from `useCurrentUser()` and tenant from `useCurrentTenant()` without duplicate network requests
- **Route**: `/profile`
- **Files**:
  - `src/pages/profile/ProfilePage.tsx`
  - `src/features/profile/ProfileSummary.tsx`
  - `src/features/profile/profile.types.ts`
  - `src/constants/routes.ts`
  - `src/router/AppRouter.tsx`
  - `src/components/appNavigation.tsx`
  - `src/components/AppHeader.tsx`
  - `src/pages/index.ts`
  - `src/locales/vi.ts`
  - `src/locales/en.ts`
  - `src/locales/ja.ts`
  - `src/tests/pages/profile/ProfilePage.test.tsx` (3 tests)
  - `src/tests/components/appNavigation.test.tsx` (updated APP_ROUTES)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (62 test files, 316 tests)
  - `npm run build` -> PASS
- **Blocker**: None
- **Next**: FE-DOC-001

---

### FE-DOC-001
- **Task**: Multipart document upload modal & action
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Backend Dependency**: `POST /api/v1/documents` (`multipart/form-data`)
- **Route**: `/documents`
- **Files**:
  - `src/components/ResourceListPage.tsx` (supported custom `headerButtons`)
  - `src/features/documents/documents.api.ts` (added `DocumentUploadPayload` & `buildDocumentFormData`)
  - `src/features/documents/useDocumentUpload.ts` (`useCustomMutation` + `useInvalidate` + double-submit guard)
  - `src/features/documents/DocumentUploadModal.tsx` (`Upload.Dragger`, type selector, metadata fields, backend error mapping)
  - `src/pages/documents/list.tsx` (integrated upload modal via `headerButtons`)
  - `src/locales/en.ts`
  - `src/locales/vi.ts`
  - `src/locales/ja.ts`
  - `src/tests/features/documents/useDocumentUpload.test.tsx` (4 tests)
  - `src/tests/features/documents/DocumentUploadModal.test.tsx` (4 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (64 test files, 324 tests)
  - `npm run build` -> PASS
- **Blocker**: None
- **Next**: FE-OP-001

---

### FE-OP-001
- **Task**: Trip detail execution extensions & stop timeline (FE-TRIP-001)
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Backend Dependency**:
  - `GET /api/trips/{tripId}/drivers`
  - `POST /api/trips/{tripId}/drivers`
  - `POST /api/trips/{tripId}/drivers/{assignmentId}/unassign`
  - `GET /api/trips/{tripId}/stops`
  - `POST /api/trip-stops/{id}/arrive`
  - `POST /api/trip-stops/{id}/start-service`
  - `POST /api/trip-stops/{id}/complete-service`
  - `POST /api/trip-stops/{id}/depart`
- **Route**: `/trips/show/:id`
- **Files**:
  - `src/types/tripExecution.types.ts` (`TripDriverAssignment`, `TripStopExecution`, `AssignDriverPayload`, statuses)
  - `src/types/trip.types.ts` (added `plannedDistanceMiles`, `actualDistanceMiles`, `loadedMiles`, `emptyMiles`)
  - `src/features/trips/tripExecution.api.ts` (endpoint constants & transition state matrix)
  - `src/features/trips/useTripDriverAssignments.ts` (`useCustom` + `useCustomMutation` POST unassign, never DELETE)
  - `src/features/trips/useTripStopActions.ts` (action transitions `arrive`, `startService`, `completeService`, `depart`)
  - `src/features/trips/TripMileageSummary.tsx` (4 separate distance metrics, handles unavailable null without defaulting to 0)
  - `src/features/trips/TripStopActions.tsx` (state-driven action buttons, no dropdowns)
  - `src/features/trips/TripStopsTimeline.tsx` (sequential timeline with order, type, timestamps, dwell, and actions)
  - `src/features/trips/TripDriverAssignments.tsx` (assignment table, history preservation, popconfirm unassign, assignment modal)
  - `src/pages/trips/show.tsx` (lazy tabbed display: Stops Timeline, Driver Assignments, Full Details)
  - `src/locales/en.ts`
  - `src/locales/vi.ts`
  - `src/locales/ja.ts`
  - `src/tests/features/trips/TripMileageSummary.test.tsx` (3 tests)
  - `src/tests/features/trips/TripStopActions.test.tsx` (8 tests)
  - `src/tests/features/trips/useTripDriverAssignments.test.tsx` (4 tests)
  - `src/tests/features/trips/useTripStopActions.test.tsx` (3 tests)
  - `src/tests/pages/trips/TripShow.test.tsx` (3 tests)
  - `src/tests/types/tripExecution.contract.test.ts` (3 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (70 test files, 348 tests)
  - `npm run build` -> PASS
- **Blocker**: None
- **Next**: FE-LOAD-001 / FE-COST-002

---

### FE-LOAD-001 & FE-COST-002
- **Task**: Load detail business tabs & embedded accessorial / shipment cost tracking
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Architectural Discovery / Runtime Contract Resolution**:
  - Runtime Spring backend implements Phase 3 shipment costs and accessorials as **load-scoped resources**:
    - `GET /api/loads/{loadId}/costs` (`ShipmentCostController`)
    - `POST /api/loads/{loadId}/costs`
    - `GET /api/loads/{loadId}/accessorials` (`AccessorialController`)
    - `POST /api/loads/{loadId}/accessorials`
    - `PUT /api/accessorial-charges/{id}/approve`
    - `GET /api/loads/{loadId}/timeline` (`LoadTimelineController`)
    - `GET /api/documents?loadId={loadId}` (`DocumentController`)
  - No global un-scoped `/api/shipment-costs` endpoint exists in runtime backend.
  - Load detail tabs natively embed all Phase 2 and Phase 3 capabilities with strict tab-scoped lazy fetching.
- **Route**: `/loads/show/:id`
- **Files**:
  - `src/types/loadTimeline.types.ts` (`LoadTimelineResponse`, `LoadEventView`)
  - `src/types/shipmentCost.types.ts` (`ShipmentCostView`)
  - `src/types/accessorial.types.ts` (`AccessorialChargeView`)
  - `src/features/loads/LoadOverviewPanel.tsx` (general info, schedules, addresses, hazmat, notes)
  - `src/features/loads/LoadTimelinePanel.tsx` (chronological events, transitions, timestamps, locations)
  - `src/features/loads/LoadFinancialPanel.tsx` (costs table, accessorials table, revenue/costs/margin statistics, approve action)
  - `src/features/loads/LoadDocumentsPanel.tsx` (documents table, integrated `DocumentUploadModal`)
  - `src/features/loads/LoadTripPanel.tsx` (assigned truck, transit status, truck link)
  - `src/features/loads/LoadExceptionsPanel.tsx` (explicit `BLOCKED_BACKEND` notice, zero redundant API requests)
  - `src/pages/loads/show.tsx` (tabbed view with tab-scoped lazy fetching)
  - `src/locales/en.ts`
  - `src/locales/vi.ts`
  - `src/locales/ja.ts`
  - `src/tests/features/loads/LoadTimelinePanel.test.tsx` (3 tests)
  - `src/tests/features/loads/LoadFinancialPanel.test.tsx` (3 tests)
  - `src/tests/pages/loads/LoadShow.test.tsx` (3 tests)
  - `src/tests/types/loadTimeline.contract.test.ts` (3 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (74 test files, 360 tests)
  - `npm run build` -> PASS
- **Blocker**: None
- **Next**: FE-SETTLEMENT-001

---

### FE-SETTLEMENT-001
- **Task**: Driver Pay Policy Versioning (`/settlements/policies`)
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Architectural Discovery / Runtime Contract Resolution**:
  - Runtime Spring backend implements `DriverPayPolicyController` at `/api/driver-pay-policies`:
    - `GET /api/driver-pay-policies` (list of all policies ordered by code ASC, version DESC)
    - `GET /api/driver-pay-policies/{id}` (get single policy version)
    - `POST /api/driver-pay-policies` (create new policy code starting at v1)
    - `POST /api/driver-pay-policies/{id}/new-version` (create v(N+1) with immutable code & scope, `effectiveFrom` > previous)
  - Normalized backend responses to standard `ResponseEntity<ApiResponse<T>>` for full Refine/Axios interceptor compliance.
  - Implemented exact percentage convention: UI accepts `0 - 100%`, transport communicates ratio `0.0 - 1.0`.
  - Date-only handling: dates formatted strictly as `YYYY-MM-DD` strings without timezone shifting.
  - Historical versions are strictly read-only; new versions can only be spawned from the latest version.
- **Route**: `/settlements/policies`, `/settlements/policies/:id`
- **Files**:
  - `src/types/driverPayPolicy.dto.ts`
  - `src/features/settlements/driverPayPolicy.api.ts`
  - `src/features/settlements/driverPayPolicy.query.ts`
  - `src/features/settlements/DriverPayPolicyForm.tsx`
  - `src/features/settlements/DriverPayPolicyVersionHistory.tsx`
  - `src/pages/settlements/DriverPayPolicyList.tsx`
  - `src/pages/settlements/DriverPayPolicyShow.tsx`
  - `src/constants/routes.ts`
  - `src/router/AppRouter.tsx`
  - `src/types/roles.types.ts` & `src/providers/permissions/roleMatrix.ts`
  - `src/locales/en.ts`, `src/locales/vi.ts`, `src/locales/ja.ts`
  - `src/tests/features/settlements/DriverPayPolicyForm.test.tsx` (4 tests)
  - `src/tests/pages/settlements/DriverPayPolicyList.test.tsx` (3 tests)
  - `src/tests/types/driverPayPolicy.contract.test.ts` (7 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (77 test files, 375 tests)
  - `npm run build` -> PASS (1.83s)
- **Blocker**: None
- **Next**: FE-SETTLEMENT-002 (Settlement List `/settlements`)

---

### FE-SETTLEMENT-002
- **Task**: Driver Settlement List & Pay Period / Driver Filters (`/settlements`)
- **Status**: **DONE**
- **Contract Status**: CONFIRMED
- **Architectural Discovery / Runtime Contract Resolution**:
  - Runtime Spring backend implements `DriverSettlementController` at `/api/driver-settlements`:
    - `GET /api/driver-settlements` with query filters (`payPeriodId`, `driverId`, `status`, `settlementType`)
    - `POST /api/driver-settlements/calculate` (triggers engine calculation for `driverId` and `payPeriodId`)
    - Added `findSettlements` repository query and `engine.list()` service method.
    - Wrapped `DriverSettlementController` and `PayPeriodController` endpoints with `ResponseEntity<ApiResponse<T>>` using `ApiResponse.success(data, request)` so frontend `apiClient` parses envelopes properly.
    - Populated `driverName` and `payPeriodCode` directly in `DriverSettlementView.from()` for zero-waterfall row display.
  - Implemented client-side and server-side filtering by Pay Period, Driver, Status, and Settlement Type.
  - Quick summary cards for Total Settlements, Total Gross, and Total Net payout.
  - Integrated `CalculateSettlementModal` for on-demand calculation with double-submit guard and query invalidation.
- **Route**: `/settlements`
- **Files**:
  - `src/types/settlement.dto.ts` (`DriverSettlementView`, `SettlementStatus`, `SettlementType`, `SettlementLineView`, `CalculateSettlementPayload`)
  - `src/features/settlements/settlement.api.ts` (`SETTLEMENT_ENDPOINTS`)
  - `src/features/settlements/settlement.query.ts` (`useSettlements`, `usePayPeriods`, `useDrivers`, `useCalculateSettlement`)
  - `src/features/settlements/settlement.columns.tsx` (`createSettlementColumns`, `formatCurrencyAmount`, `getSettlementStatusColor`, `getSettlementTypeColor`)
  - `src/features/settlements/SettlementFilters.tsx` (pay period, driver, status, type filters + reset)
  - `src/features/settlements/CalculateSettlementModal.tsx` (driver & period selector, calculation mutation)
  - `src/pages/settlements/SettlementList.tsx` (top-level page with table, stats, search, filters, modals)
  - `src/pages/settlements/index.ts` (barrel export)
  - `src/pages/index.ts` (re-export `SettlementList`)
  - `src/router/AppRouter.tsx` (registered `/settlements` lazy route with `ResourceAccessBoundary`)
  - `src/locales/en.ts`, `src/locales/vi.ts`, `src/locales/ja.ts`
  - `src/tests/pages/settlements/SettlementList.test.tsx` (4 tests)
  - `src/tests/types/settlement.contract.test.ts` (5 tests)
- **Tests**:
  - `npm run typecheck` -> PASS (0 errors)
  - `npm run lint` -> PASS (0 errors)
  - `npm run test` -> PASS (79 test files, 384 tests)
  - `npm run build` -> PASS (1.63s)
- **Blocker**: None
- **Next**: FE-SETTLEMENT-003 (Settlement Detail & Workflow `/settlements/show/:id`)

### FE-SETTLEMENT-002 corrective completion / FE-SETTLEMENT-003 verified slice / FE-SETTLEMENT-004
- **Task**: Settlement collection scope, detail, confirmed transitions and immutable corrections.
- **Status**: FE-SETTLEMENT-002 DONE; FE-SETTLEMENT-004 DONE; FE-SETTLEMENT-003 BLOCKED_BACKEND for residual planned commands (implemented verified slice passes gates).
- **Contract Status**: CONFIRMED for actual DriverSettlementController requests; BLOCKED for BE-025.
- **Backend Dependency**: GET collection/detail; POST calculate/submit-review/approve/lock/require-validation/resolve-validation/adjustments/reversal. No arbitrary status/locked edit. Actor must map to employee.
- **Route**: /settlements; /settlements/:id. Corrected prior unregistered /settlements/show/:id constant to actual planned detail route; existing list links now reuse it.
- **Files**: settlement.query/keys/columns, SettlementList/Show, SettlementSummary/LinesTable/Audit/Actions/Adjustments, useSettlementActions, CreateAdjustmentModal, CalculateSettlementModal, settlement.dto, routes/AppRouter, statusTone, locales vi/en/ja, utils/uuid; test fixtures and settlement workflow/form/query/page tests.
- **Query / Mutation**: Tenant and exact permission keys, lazy driver-period correction history; shared single-flight; scoped detail/list/load financial invalidation including new correction load IDs. Stable adjustment idempotency key survives failure/cancel; server field errors map inline. Confirmation/pending guard every consequential command. Parent money/history never recalculated/edited. Removed mixed-currency client totals/default USD and floating-point money formatter.
- **Tests**: typecheck PASS; lint PASS; full unit/integration **89 files / 466 tests PASS**; build PASS. Targeted settlement + status tests 49 tests PASS before added query coverage, all included in full suite. Tests cover statuses/authorities/direct unauthorized handlers, hidden tabs, loading/empty/error/retry, reversal reason, field errors, retry identity, backend totals, exact decimal amounts, double-click, scoped invalidation. E2E not run: BE-021 authentication contract remains absent.
- **Blocker**: BE-025 residual workflow commands/full audit history; no fabricated actions or event history.
- **Next**: FE-PAYROLL-002; FE-PAYROLL-001 blocked by BE-026 missing collection.

### FE-PAYROLL-002 / FE-PAYROLL-005 — active verified workflow slice
- **Task**: Runtime run detail/entry, validated transitions and payment/reconciliation.
- **Status**: DONE after final gate; FE-PAYROLL-001/003 blocked read scopes recorded separately.
- **Contract Status**: CONFIRMED from live OpenAPI and PayrollRunController/PayrollWorkflow/PayrollCalculationService/PayrollPaymentController/scheduling/dispatch/bank reconciliation services.
- **Backend Dependency**: Actual /api/payroll/runs paths, /items/{id}/payments, /payments/{id}/dispatch and /reconcile-bank, server-paged /reconciliation-cases.
- **Route**: /payroll is explicit create/open entry (no collection claim); /payroll/:id; /payroll/reconciliation. Exact existing payroll capabilities, route/page/action guards.
- **Files**: pages/payroll entry/detail/reconciliation; features/payroll DTO/query-key constants/actions/hooks/validation/items/jurisdiction/payment modal/panel; types/payroll.dto; router/routes/nav; locales vi/en/ja; real Refine fixtures and workflow/page/form tests.
- **Query / Mutation**: Run page mount fetches run only; payments tab fetches selected driver item only; case pagination uses backend page/size. Stable calculation/payment/bank replay keys, explicit confirmation, shared single-flight. No currency summation, inferred tax/net, mark-paid toggle or tenant transport override. Dispatch error refreshes run/item because PROCESSING may already be persisted before provider I/O fails. Success invalidation scopes returned item/related cached run/settlement IDs/current tenant cases.
- **Tests**: Final typecheck/lint/full 97 files / 513 tests/build PASS; targeted payroll/nav 61 tests PASS. See current checkpoint above.
- **Blocker**: FE-PAYROLL-001 no run collection; FE-PAYROLL-003 no profile/config read. Provider/statutory production configuration remains backend responsibility; no fake success. Manual method lacks a supported completion command (BE-027).
- **Mismatch**: Backend snapshot uses resolution.source WORK_PAYROLL_OVERRIDE, not planned WORK_OVERRIDE. UI preserves backend value with localized label and does not infer source from jurisdiction. Run uses IN_REVIEW, PAYMENT_SCHEDULED, COMPLETED. Backend tax availability UNAVAILABLE stays dash even if conflicting numeric tax zero arrives; incomplete validation blocks review/approve/lock/schedule.
- **Next**: Finish gates for FE-PAYROLL-002/005, then FE-PAYROLL-004 payslips; then Rating/Optimization/Fleet contract queue.

### Historical runtime mismatch — 2026-10-05

**SUPERSEDED BY 2026-10-06 RUNTIME REFRESH.** BE-029 is resolved for reconciliation/Rating/Optimization/Fleet. Residual Rate list/history and Executive compatibility remain BE-031.
- **Task**: Verify runtime readiness before the next backend-aligned feature.
- **Status**: FE-PAYROLL-005 BLOCKED_BACKEND for reconciliation; FE-RATE-001/002, FE-OPT-001/002, FE-FLEET-001, FE-DASH-001 BLOCKED_BACKEND. Confirmed scheduling/dispatch remains implemented; no production bank reconciliation route/link.
- **Contract Status**: Fresh :8080 OpenAPI overrides source-only readiness. Controller/progress exists but deployment has not exposed these operations. Source/test evidence does not equal integrated runtime readiness.
- **Files**: payroll.api confirmation gate, AppRouter/PayrollEntryPage gated route/link, backend gaps and plan.
- **Tests**: Source workflow/unit tests retained; next full gate includes runtime exposure correction. No tests removed.
- **Blocker**: BE-029 exact missing runtime paths, BE-028 payslip self-service payment status.
- **Next**: Finish confirmed payslip read/PDF gate; then independent confirmed Notifications / Conversations. No backend restart or framework/foundation rewrite.
