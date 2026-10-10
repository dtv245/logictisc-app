# Frontend v2 — remaining contract work

Current runtime rechecked **2026-10-06** against `http://localhost:8080/v3/api-docs` (137 paths) and current Spring controllers. Reconciliation, Rating preview, Optimization and Fleet are CONFIRMED + FRONTEND DONE. The first table below is the authoritative remaining-blocker table; old deployment absence is superseded. No backend/container/database/migration changes.

## CURRENT RUNTIME CONTRACT — 2026-10-06

Full task/status/route execution matrix: [canonical plan, section 48](../plan-frontend-v2-implementation-ready.md#48-current-execution-matrix) and [progress](plan-frontend-progress.md). **READY TASKS: none. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.**

## Current blockers — missing contracts / server authorization

| Task | Missing contract or runtime dependency | Evidence / unblock requirement |
|---|---|---|
| FE-FOUNDATION-002 | GET `/api/me` | Absent from live OpenAPI/current controllers. Return authenticated subject, email, tenantId, roles and employeeId consistent with existing JWT/session checks. Profile menus/route remain dormant; do not bypass shared identity/session. BE-021. |
| FE-DOC-001; FE-LOAD-001 upload | POST `/api/documents`, multipart | DocumentController has GET/DELETE only. Require file/metadata DTO, validated ownership/links, file/storage policy, normalized errors and authorization. Dormant upload artifacts must be aligned to the final contract before activation. BE-020. |
| FE-LOAD-001 Exceptions | Load-scoped exception read/action contract | No confirmed object read/action API; a reports summary does not implement an individual exception workflow. |
| FE-COST-001 | Global shipment-cost collection/detail | Only load-scoped cost surface is live. Do not enumerate loads or concatenate their costs. BE-023. |
| FE-SETTLEMENT-003 | Planned reject/recalculate/payment/audit contract alignment | Confirmed submit-review/approve/lock/validation and immutable corrections already implemented. Backend revenue recalculation is a different evidence-based command; payment is a payroll item operation. Do not alias them to planned actions. BE-025. |
| FE-PAYROLL-001 | Run collection GET with supported filters/page DTO | Current PayrollRunController supports calculate/detail/workflow, no collection. BE-026. |
| FE-PAYROLL-003 | Employee profile/history/config/policy read DTOs | Current PayrollConfigurationController exposes append/PUT commands only. Country-neutral profile editor needs authoritative current/history/config lookup. No invented tax/policy defaults. BE-026. |
| FE-PAYROLL-004 | Authorized employee-owned current payment status | Payslip snapshot/PDF is immutable issuance evidence. Finance-only item-payment API cannot serve DRIVER self-service. BE-028. |
| FE-RATE-001 | Rate policy collection/history reads | Current source provides GET only by explicit rule/contract ID and version. Runtime now exposes explicit version/authoring endpoints; collection/history gap remains. |
| FE-DASH-001 | Executive-summary and legacy report compatibility | `/api/reports/executive-summary` absent; FleetHistory.Report requires explicit policy/trucks; monthly financial requires year/month and returns a different DTO. Preserve executive query/metric foundation. BE-031. |
| FE-EXPENSE-001 | Expense collection/detail/create/update contract | Only individual approve/report/sync endpoints are live. Reuse the existing orphan frontend when CRUD is confirmed. BE-016 (CRUD scope). |
| FE-MAINT-001 | Maintenance CRUD/PM workflow contract | Report aggregates do not provide CRUD. Reuse the existing orphan UI after confirmation. BE-016 (CRUD scope). |
| FE-MSG-001 | Authenticated sender/participant authorization | REST exists, but MessageController/MessageService/ConversationService trust caller employee/sender/conversation IDs without principal membership checks. Frontend cannot repair server authorization. BE-030. |

## CONFIRMED + FRONTEND PARTIAL

FE-LOAD-001 documents/financial reads, FE-SETTLEMENT-003 confirmed commands/corrections and FE-PAYROLL-004 own payslip/PDF remain usable. FE-DASH-001 retains its tested foundation dormant pending BE-031; `/dashboard` return targets redirect to Operations, and menus exclude Executive. All four tasks are PARTIAL / BLOCKED_BACKEND for full acceptance. Profile/upload/global lists/editors/Messaging remain dormant. Payroll calculate/open/detail is independently DONE and does not reconstruct a missing run list.

## HISTORICAL / SUPERSEDED EVIDENCE

## Historical runtime mismatch — 2026-10-05

**SUPERSEDED BY 2026-10-06 RUNTIME REFRESH.** BE-029 resolved for reconciliation/Rating/Optimization/Fleet; the table is audit evidence only. Executive-summary and Rate collection/history remain in the current first table.

| Task | Operations absent from 2026-10-05 OpenAPI (historical) |
|---|---|
| FE-PAYROLL-005 | PayrollPaymentController: GET `/api/payroll/reconciliation-cases`; POST `/api/payroll/payments/{id}/reconcile-bank`; zero-net POST `/api/payroll/items/{id}/no-payment-required`. Scheduling/dispatch exist; reconciliation route/link remain disabled. |
| FE-RATE-001 | RatePolicyController: POST `/api/rating/contracts`, `/contracts/{id}/versions`, `/rules`, `/rules/{id}/versions`; GET `/contracts/{id}/versions/{version}`, `/rules/{id}/versions/{version}`. |
| FE-RATE-002 | RatingController: POST `/api/loads/{id}/rating/preview`; authoritative RatingPreview contains the supported backend-calculated rating/FSC. No local formula or guessed `/api/rates/preview`. |
| FE-OPT-001/002 | OptimizationRunController: POST `/api/optimization/runs`; GET `/{id}`; POST `/{id}/assignments/{candidateId}/accept`. Confirm DTO, actor roles, hard feasibility, concurrency/idempotency and explainability after runtime alignment. |
| FE-FLEET-001 / FE-DASH-001 | GET `/api/reports/executive-summary`, `/api/reports/fleet/health` (source also maps utilization-history). Preserve existing executive query/metric foundation; metric readiness still depends on qualified backend evidence. |

Updating a backend source file alone does not align the running Docker `logistics-api` image. Backend environment alignment must preserve existing data and applied migration checksums; do not reset/reseed user data. The current frontend scope has not changed containers/databases or added backend APIs. User explicitly confirmed: frontend only; retain backend-blocked tasks. Backend implementation/runtime changes are outside this authorized scope; missing dependencies remain BLOCKED, not deferred or DONE.

## Frontend work completed while dependencies remain blocked

The Load Documents read slice now reuses Refine useList and BaseTable with server page size 20, loadId filtering, permission/tenant gate, tenant/load/page cache key, and reset on load change. DocumentView has `capturedAt`, not `createdAt` or an upload timestamp; presentation now names capture time accurately. DTO/string dates, centralized status display and vi/en/ja labels are aligned. Upload remains disabled. Overall FE-LOAD-001 is PARTIAL / BLOCKED_BACKEND for its remaining contracts.

## CONFIRMED + FRONTEND DONE — 2026-10-06 delivery

- FE-PAYROLL-005: live bank cases/reconcile verified; retained route/link enabled and existing evidence workflow tested. Full 103 files / 552 tests plus four gates PASS.
- FE-RATE-002: confirmed V1 INDEX_BASED_MPG Load preview and policy display; ADMIN/ACCOUNTANT only, no client FSC formula. Full 105 files / 566 tests plus four gates PASS. FE-RATE-001 still blocked for its collection/history acceptance.
- FE-OPT-001/002: explicit immutable run, ranking evidence drawer, hard feasibility and fingerprint/idempotent acceptance. ADMIN/DISPATCHER only. Full 110 files / 598 tests plus four gates PASS.
- FE-FLEET-001: explicit policy/truck/date/zone query and independent KPI/coverage DONE; full 113 files / 627 tests plus four gates PASS. No time-series API or executive-summary invented.

Previous frontend baseline after dormant Profile menu/route correction: typecheck/lint/build PASS; full 114 files / 629 tests PASS. Latest Runtime/Plan Alignment gates: typecheck/lint/build PASS; full **115 files / 633 tests PASS**; git diff --check PASS. Executive route/menu/resources now dormant with Operations redirect; four route/resource tests added, existing Profile and feature tests retained. BE-021 still blocks Profile integration. **NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.**

The historical mismatch above is retained as dated evidence, not a current missing-runtime assertion. No blocked task is user-deferred or complete. Current remaining dependencies are the first table.

## Resume order and acceptance

Identity `/api/me` → multipart Documents → first newly READY operational/financial task in the approved queue → Settlement completion → Payroll list/profile/self-service → Rate Rule collection/history → Executive compatibility → Expense/Maintenance/Messaging after their contracts/security are ready. Optimization and Fleet are already DONE; do not redo them. For each newly available contract verify method/path/query parameters/request and response DTO/pagination/statuses/enums/permissions/error contract, implement the corresponding slice, run typecheck/lint/full unit/build, then tick the task only when its full acceptance criteria pass. Deterministic authenticated browser E2E requires the missing identity/test environment; no production endpoint mock or invented statutory/payment result is permitted.

## Subsequent blocked-dependency recheck — 2026-10-06T03:45:39+07:00

Read-only verification after the completed Runtime/Plan Alignment, not a repeat of that work. Fresh runtime remains the same 137-path OpenAPI (SHA256 `9891294e84db060eb30c598fa8b0fbff98057ca03e16c08f67a96be21b169978`), with no new blocked-contract method/path/parameters/schema. Current Messaging source still lacks authenticated sender/participant membership enforcement. Exact priority-ordered matrix/evidence is recorded in [plan-frontend-progress.md](plan-frontend-progress.md); all existing gap states remain active as shown above. The historical Oct5 table remains **SUPERSEDED BY 2026-10-06 RUNTIME REFRESH**.

**NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.** Five accepted tasks remain enabled and DONE; existing partial reads/workflows retained. No production frontend/test source change and no backend/config/container/database action. Source/config hash snapshots preserved. Final gates: typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; authenticated E2E NOT RUN (BE-021/test environment). Resume GET `/api/me` first, then Documents, remaining Load slices, global Cost, Settlement, Payroll list/profiles/self-service, Rate collection/history, Executive, Expense, Maintenance, Messaging after server authorization. No backend gap is silently aliased, no user deferral or plan completion claimed.
