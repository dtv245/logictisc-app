# AI Software Project Memory

> Persistent source of truth for role-to-role handoffs. Read before every role. Update and validate after every role. Never store secrets or raw credentials here.

## 1. Control

| Field | Value |
|---|---|
| Schema Version | 1 |
| Revision | 20 |
| Project | LogisticsX Frontend |
| Repository Root | /home/vumoi/logictics-app |
| Execution Mode | SCOPED_TASK |
| Last Updated | 2026-11-06T15:04:25+07:00 |
| Current Phase | 8 — Frontend Development |
| Active Role | Code Reviewer |
| Status | READY_FOR_REVIEW |
| Next Role | Code Reviewer |
| Next Action | Review StrictMode map reuse and teardown; verify remaining Firefox/Mapbox console messages in the browser |
| Handoff Sequence | 20 |

## 2. Project Snapshot

- **Problem:** Complete transport operations and financial workflows against the existing Spring backend.
- **Users:** Dispatchers, finance staff, payroll managers and drivers.
- **Goal:** Implement accepted frontend v2 contracts and retain genuine backend/authorization blockers; no task is user-deferred.
- **Core Features:** See canonical plan section 48 current execution matrix and section 49 checkmarks.
- **Technology:** React 18, TypeScript 6, Vite 8, Refine 4, Ant Design 5, Query 4, Vitest and Playwright.
- **Constraints:** Frontend only; preserve dirty Lark/user work, foundation, tenant boundaries and screen-scoped fetching. No invented endpoints, production mocks, client ledger reconstruction or backend changes.
- **Scope:** Current scoped task hardens the TMS map UI against Mapbox WebGL context loss and diagnoses the reported dispatch-board 404s. No API, hook, route, Refine resource, translation-key or dependency changes were made.
- **Out of Scope:** Backend source/config/container/build/restart, database/migration/reset/reseed, framework migration, deployment and unrelated user changes.
- **Repository Baseline:** Historical Oct6 branch KAN-79-integrations-dang-nhap-bang-lark, HEAD 0eb8bf6; typecheck/lint/build PASS; 115 files / 633 tests PASS; authenticated E2E NOT RUN. Map redesign gates and the 2026-11-06 WebGL fix gates passed; 11 focused tests cover map context-loss handling and cleanup. Live Mapbox rendering was not verified.

## 3. Current Delivery State

### Current Objective

- **Feature/Task ID:** TMS-MAP-WEBGL-ROBUSTNESS-2026-11-06
- **Objective:** Prevent uncaught Mapbox style access after `webglcontextlost`, avoid redundant map destruction during React StrictMode effect replay, and classify the dispatch-board 404 source.
- **Acceptance Gate:** Context loss pauses child layers and displays fallback; context restore remounts them; cleanup is safe if Mapbox has no style; StrictMode reuses one Map instance but real unmount removes it; typecheck/lint/build and focused tests pass. Backend route availability must be checked in the authenticated running environment.
- **Allowed Change Scope:** `src/components/map/`, `src/pages/tms-flow/LiveTrackingPage.tsx`, related map tests and `.ai-workflow/PROJECT_MEMORY.md`; no backend, API contract, hook, route, Refine resource, i18n key or package changes.

### Phase Status

| Phase | Primary Owner | Allowed Active Roles | Status | Outputs / Evidence |
|---|---|---|---|---|
| 0. Project Understanding | Product Owner | Product Owner; Business Analyst; Tech Lead | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 1. Business Analysis | Business Analyst | Business Analyst; Product Owner; QA / Tester | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 2. Domain Modeling | Software Architect | Software Architect; Business Analyst; Tech Lead; Database Engineer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 3. Database Design | Database Engineer | Database Engineer; Software Architect; Backend Developer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 4. System Architecture | Software Architect | Software Architect; Tech Lead; Security Engineer; Database Engineer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 5. API Design | Tech Lead | Tech Lead; Software Architect; Backend Developer; Frontend Developer; Security Engineer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 6. Project Structure | Tech Lead | Tech Lead; Software Architect; Backend Developer; Frontend Developer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 7. Backend Development | Backend Developer | Backend Developer; Tech Lead; Database Engineer; QA / Tester; Security Engineer; Code Reviewer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 8. Frontend Development | Frontend Developer | Frontend Developer; Tech Lead; QA / Tester; Security Engineer; Code Reviewer | `READY_FOR_REVIEW` | Map UI plus WebGL loss/restoration guard and StrictMode map reuse complete; typecheck/lint/build and 11 focused tests PASS. Firefox/Mapbox deprecation warnings remain upstream; authenticated runtime result for dispatch-board endpoints remains unresolved. |
| 9. Integration | Tech Lead | Tech Lead; Backend Developer; Frontend Developer; QA / Tester | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 10. Testing | QA / Tester | QA / Tester; Backend Developer; Frontend Developer; Tech Lead | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 11. Security Review | Security Engineer | Security Engineer; Software Architect; Backend Developer; Frontend Developer; Code Reviewer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 12. Performance Review | Tech Lead | Tech Lead; Database Engineer; Backend Developer; Frontend Developer; QA / Tester | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 13. Code Review | Code Reviewer | Code Reviewer; Tech Lead; Security Engineer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 14. DevOps | DevOps Engineer | DevOps Engineer; Tech Lead; Security Engineer; QA / Tester | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 15. Observability | DevOps Engineer | DevOps Engineer; Tech Lead; Backend Developer | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |
| 16. Documentation | Tech Lead | Tech Lead; Product Owner; Backend Developer; Frontend Developer; Database Engineer; DevOps Engineer | `DONE` | Scoped DOC-ALIGN-PROMPT-001 delivered; existing frontend/full-project gates are separate and not certified by this documentation task. |
| 17. Final Production Review | Code Reviewer | Code Reviewer; Product Owner; QA / Tester; Security Engineer; DevOps Engineer; Tech Lead | `NOT_APPLICABLE` | Existing project; no separate role gate claimed in this frontend continuation. |

### Feature / Task Board

Feature statuses below retain the Oct6 checkpoints. The Oct7 handoff now publishes /api/me and messaging ownership enforcement; this documentation task did not re-audit frontend source or probe the target runtime. Reconcile source contract, runtime and frontend acceptance independently before changing feature statuses.

| ID | Requirement IDs | Owner | Status | Evidence | Next Action |
|---|---|---|---|---|---|
| DOC-ALIGN-PROMPT-001 | User prompt-writing request | Tech Lead | `DONE` | docs/prompt-business-backend-frontend-alignment.md; HOFF-0016 | Apply only when implementation is requested within authorized scope |
| TMS-MAP-WEBGL-ROBUSTNESS-2026-11-06 | Recover map UI safely after WebGL context loss; diagnose dispatch-board 404s | Frontend Developer | `READY_FOR_REVIEW` | mapStyleSafety.ts; MapShell/VehicleLayer/DispatchMapLayers; HOFF-0019–0020; final gates PASS | Verify authenticated API runtime; review browser recovery with approved token |
| TMS-MAP-REDESIGN-2026-11-06 | Three TMS map screens, MapShell, GeoJSON vehicle layers and responsive floating panels | Frontend Developer | `READY_FOR_REVIEW` | src/components/map/MapShell.tsx; src/components/map/VehicleLayer.tsx; DispatchPage/LiveTrackingPage; HOFF-0018; final gates PASS | Independent review; live Mapbox check when token/model asset are available |
| Runtime/Plan Alignment 2026-10-06 | Runtime/Plan Alignment 2026-10-06 | Frontend Developer | `DONE` | Current plan section 48; progress; HOFF-0014; all gates PASS | Preserve matrix; recheck only newly available contracts |
| FE-COST-002 / FE-ACCESSORIAL-001 | FE-COST-002 / FE-ACCESSORIAL-001 | Frontend Developer | `DONE` | Existing accepted embedded cost/accessorial workflow | Preserve confirmed workflow |
| FE-PROFIT-001 | FE-PROFIT-001 | Frontend Developer | `DONE` | Accepted by-load reporting; optional dimensions BE-024 separate | Preserve confirmed by-load scope |
| FE-SETTLEMENT-002 / FE-SETTLEMENT-004 | FE-SETTLEMENT-002 / FE-SETTLEMENT-004 | Frontend Developer | `DONE` | Existing confirmed list/immutable correction flow | Preserve confirmed workflow |
| FE-PAYROLL-002 | FE-PAYROLL-002 | Frontend Developer | `DONE` | Confirmed calculate/open/detail/workflow entry | Preserve; do not reconstruct a list |
| Notification completion | Notification completion | Frontend Developer | `DONE` | Existing confirmed tenant-wide notification behavior | Preserve confirmed behavior |
| FE-PERF-001 | FE-PERF-001 | Frontend Developer | `DONE` | Measured feature splitting and accepted regressions | Preserve completed work |
| FE-PAYROLL-005 | FE-PAYROLL-005 | Frontend Developer | `DONE` | Bank cases/reconcile live; enabled route/link; final full 633 PASS | Preserve evidence/replay workflow |
| FE-RATE-002 | FE-RATE-002 | Frontend Developer | `DONE` | Live V1 INDEX_BASED_MPG preview; ADMIN/ACCOUNTANT; backend formula | Preserve preview; no local FSC calculation |
| FE-OPT-001 | FE-OPT-001 | Frontend Developer | `DONE` | Live immutable run/read/accept; ADMIN/DISPATCHER | Preserve feasibility/fingerprint/idempotency |
| FE-OPT-002 | FE-OPT-002 | Frontend Developer | `DONE` | Accepted backend ranking/evidence drawer | Preserve backend score without recomputation |
| FE-FLEET-001 | FE-FLEET-001 | Frontend Developer | `DONE` | Live explicit policy/truck/date/zone FleetHistory report | Preserve independently of Executive |
| FE-FOUNDATION-002 | FE-FOUNDATION-002 | Frontend Developer | `BLOCKED_BACKEND` | BE-021; GET /api/me absent; Profile artifacts/tests retained | Verify identity contract before activating dormant route/menus |
| FE-DOC-001 | FE-DOC-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-020; multipart POST /api/documents absent | Align dormant upload to final contract |
| FE-LOAD-001 | FE-LOAD-001 | Frontend Developer | `PARTIAL / BLOCKED_BACKEND` | Documents read DONE; upload BE-020 and exception object actions absent | Preserve useList/BaseTable/page20/capturedAt; await missing slices |
| FE-COST-001 | FE-COST-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-023; global cost collection/detail/page/filter absent | Await authoritative reads; no Load enumeration |
| FE-SETTLEMENT-003 | FE-SETTLEMENT-003 | Frontend Developer | `PARTIAL / BLOCKED_BACKEND` | BE-025; confirmed commands/corrections accepted; full planned acceptance incomplete | Keep exact commands; no reject/recalculate/payment aliases |
| FE-PAYROLL-001 | FE-PAYROLL-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-026; no run collection DTO | Await server list/filter/page contract |
| FE-PAYROLL-003 | FE-PAYROLL-003 | Frontend Developer | `BLOCKED_BACKEND` | BE-026; append/PUT only, no current/history/config/policy reads | Await authoritative editor read state; no defaults |
| FE-PAYROLL-004 | FE-PAYROLL-004 | Frontend Developer | `PARTIAL / BLOCKED_BACKEND` | BE-028; owned payslip/PDF accepted, current payment status absent | Await employee-owned payment contract; no finance API for DRIVER |
| FE-RATE-001 | FE-RATE-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-031 read scope; explicit authoring/version GET exists, collection/history absent | Await collection/history; no guessed enumeration |
| FE-DASH-001 | FE-DASH-001 | Frontend Developer | `PARTIAL / BLOCKED_BACKEND` | BE-031; summary absent; monthly/Fleet DTO and parameter mismatch | Preserve foundation dormant; /dashboard redirects Operations |
| FE-EXPENSE-001 | FE-EXPENSE-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-016 CRUD scope; only approve/report/sync | Reuse orphan UI after CRUD contract confirmation |
| FE-MAINT-001 | FE-MAINT-001 | Frontend Developer | `BLOCKED_BACKEND` | BE-016 CRUD/PM scope; report aggregates insufficient | Reuse orphan UI after workflow confirmation |
| FE-MSG-001 | FE-MSG-001 | Frontend Developer | `BLOCKED_BACKEND / BLOCKED_AUTHORIZATION` | BE-030; caller IDs lack authenticated principal membership binding | Keep dormant until server actor/read/write authorization verified |

## 4. Requirements and Scope

### In Scope

- Current request: author one reusable prompt from project plans/contracts; document business-to-API-to-UI traceability and verification criteria.
- Future authorized frontend continuation: reconcile updated packaged contracts and deployed artifact before selecting tasks; preserve completed work and actual blockers.

### Out of Scope

- Backend implementation/config/deployment/container and database/migration changes; production endpoint mocks; financial/ranking formulas; unrelated user work.

### Traceability

| Requirement / Story | Business Rule | Domain / Data | API / UI | Tests | Status |
|---|---|---|---|---|---|
| DOC-ALIGN-PROMPT-001 | Business acceptance, source contract, target runtime and frontend evidence are independent | Frontend v2 plus Oct7 verified handoff and backend current plan checkpoint | Reusable audit/implementation prompt; no source edit | Reference/structure/whitespace and memory checks; product tests NOT RUN (docs only) | DONE |
| TMS-MAP-REDESIGN-2026-11-06 | Reuse current map interactions and keep the map as the base visual layer; do not infer vehicle motion without telemetry | Existing TruckResponse coordinates/status only; no API/data contract changes | Shared MapShell and GeoJSON VehicleLayer applied to dispatch, approvals and live tracking | MapShell/VehicleLayer/DispatchPage targeted tests: 3 files / 15 tests PASS; typecheck/lint/build PASS | READY_FOR_REVIEW |
| TMS-MAP-WEBGL-ROBUSTNESS-2026-11-06 | A lost WebGL context may temporarily remove Mapbox's style; async layer updates and React cleanup must tolerate that state | Mapbox context events and existing Mapbox sources/layers | Pause map children on loss, show fallback, restore after WebGL/style is ready, and make cleanup best-effort | MapShell/VehicleLayer/DispatchMapLayers tests: 3 files / 11 tests PASS; final typecheck/lint/build PASS | READY_FOR_REVIEW |
| Runtime/Plan Alignment 2026-10-06 | Current first matrix governs; Oct5 absence is historical | Fresh 137-path OpenAPI/current controllers | Plan/progress/gaps/unblock and Executive contract gate | Navigation/router 19 targeted; 633 full PASS | DONE |
| FE-PAYROLL-005; FE-RATE-002; FE-OPT-001/002; FE-FLEET-001 | Preserve accepted backend evidence and exact role grants | Confirmed runtime contracts | Existing enabled frontend implementations unchanged | Existing full-suite feature tests retained | DONE |
| Remaining-contract recheck 2026-10-06T03:45:39+07:00 | Live contract and safe authorization required | Same 137-path OpenAPI; Messaging principal binding unresolved | Evidence docs/handoff only; production source unchanged | 115 files / 633 tests and full gates PASS | DONE (verification only) |
| Remaining partial/blocked tasks | Missing contracts/authorization stay fail-closed | Current blocker table | Retained read/workflow foundations; unsupported UI dormant | Existing tests retained; E2E blocked BE-021 | BLOCKED |

## 5. Architecture and Data Snapshot

- **Architecture Style:** Existing React Refine application; docs/adr/001-unified-runtime-foundation.md.
- **Modules / Boundaries:** Existing shallow src/features, src/pages, src/components, src/types structure. TMS map presentation now shares `src/components/map/MapShell` and `VehicleLayer`.
- **Dependency Direction:** Pages/components → Refine hooks → existing DataProvider/API client → Spring backend.
- **Authentication / Authorization:** Existing shared JWT/session/tenant boundary preserved; exact fail-closed capabilities retained. Caller IDs cannot replace server authorization.
- **Data Model / Migration:** Backend source/config/migrations byte-identical to pre-task hash snapshot; no database operation or migration work.
- **API / Integration Contract:** Oct6 runtime matrix is a historical checkpoint. Oct7 handoff publishes 176 operations / 140 paths / 291 schemas, V38, including /api/me and messaging ownership enforcement; provenance LOCAL_JAR_CONTRACT_SNAPSHOT, deployment_verified=false. Prompt names the actual docs/frontend-backend-handoff/docs paths and requires manifest/provenance verification.
- **Deployment / Runtime:** Oct7 handoff reports the existing :8080 runtime still on old V35/138-path artifact. This prompt task did not probe or modify runtime; historical frontend build evidence does not certify current integration or deployment.
- **Map Runtime:** `mapbox-gl` 3.33.0 is installed; dispatch/approvals already used Mapbox, while live tracking previously used Leaflet through `NetworkRouteMap`. Leaflet remains needed by other screens. The optional `/models/truck.glb` asset is absent, and no live Mapbox token was verified.
- **Dispatch API Runtime:** Frontend paths match `LoadOperationalController` and its documented routes. Vite's configured proxy target is localhost:8080. Unauthenticated local GETs returned 401 through both 8080 and 5173; the user's authenticated browser requests returned 404, so the deployed/running authenticated contract still needs confirmation.

## 6. Decisions

| ID | Date | Owner | Decision | Reason / Evidence | Consequences | Supersedes |
|---|---|---|---|---|---|---|
| FE-ALIGN-20261006 | 2026-10-06 | Frontend Developer | First current contract matrix controls execution | Runtime 137 paths and confirmed controllers | Five recent tasks remain DONE; real blockers retained; READY none | Historical Oct5 runtime absence only; old handoffs retained |
| FE-EXECUTIVE-DORMANT | 2026-10-06 | Frontend Developer | Gate Executive menu/resources/rendering and redirect old return targets to Operations | BE-031 summary absent and incompatible report DTO/parameters | Queries/metrics/page preserved; Fleet independently DONE; no compatibility fabrication | Previous exposed Executive navigation |
| FE-SETTLEMENT-EXACT-COMMANDS | 2026-10-06 | Frontend Developer | Retain existing confirmed commands/corrections | Current SettlementActions already matches runtime | No generic reject/recalculate/payment aliases; BE-025 remains partial | Planned unsupported action names |
| DOC-CONTRACT-PRECEDENCE-20261007 | 2026-10-07 | Tech Lead | Reconcile Oct7 packaged contracts with the dated Oct6 frontend matrix before executing the prompt | New handoff has /api/me and ownership enforcement; deployment_verified=false | Preserve requirements and accepted work; distinguish missing source contract, runtime drift and client mismatch | Treating Oct6 absence/no-READY claims as current without recheck |
| TMS-MAP-LAYERS-20261106 | 2026-11-06 | Frontend Developer | Share one Mapbox canvas shell and render vehicles from a clustered GeoJSON source; retain Leaflet where other screens still use it | Existing Mapbox dispatch canvas, mapbox-gl 3.33.0, code search and Mapbox model/GeoJSON docs | No DOM Marker per vehicle, no API or package changes; optional 3D branch falls back to canvas icons if the model is unavailable | None |
| TMS-MAP-WEBGL-RECOVERY-20261106 | 2026-11-06 | Frontend Developer | Pause child map layers on WebGL context loss and make style/source/layer cleanup safe during restoration | User console stack points to unguarded `getLayer/getSource`; Mapbox style may temporarily be unavailable | Show fallback and resume on style/context restoration; no crash from stale layer cleanup | None |

## 7. Assumptions, Risks, and Blockers

### Assumptions

| ID | Assumption | Owner | Validation / Due | Status |
|---|---|---|---|---|
| FE-CONTRACT-REFRESH | Oct6 user-approved refresh is current contract truth | Frontend Developer | Cross-checked live OpenAPI and controllers 2026-10-06; recheck changed dependencies before future activation | VERIFIED |

### Risks

| ID | Severity | Risk | Evidence | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| FE-DIRTY-GRAPH | CRITICAL | Full dirty working tree includes substantial pre-existing feature work; broad graph risk is unresolved | CLI detect-changes all: 45 tracked files, 266 symbols, 24 flows, CRITICAL; MCP zero was unseen | Session diff reviewed against snapshot; LOW scoped impact with callers, UNKNOWN confirmed by usage; four gates PASS; no clean graph/commit claim | Frontend Developer | OPEN |
| FE-AUTH-E2E | HIGH | Deterministic authenticated browser certification unavailable | BE-021 identity and test environment absent | Preserve shared identity boundary; document E2E NOT RUN; no production mock | Backend/test environment owners | BLOCKED |
| TMS-MAP-LIVE-VERIFY | MEDIUM | Runtime appearance, Mapbox token compatibility and optional 3D model rendering are not browser-verified | No live token verified; `public/models/truck.glb` absent; code-level tests use Mapbox mocks | Keep optional model path fail-soft; review visually with authorized token and model asset | Frontend Developer | OPEN |
| TMS-MAP-FIREFOX-WARNINGS | LOW | Firefox reports deprecated renderer/upload APIs from Mapbox; Mapbox also deliberately loses the GL context on `map.remove()` | User console logs; installed Mapbox 3.33.0 source calls `WEBGL_lose_context`; React StrictMode replays effects in development | Reuse one map through StrictMode replay; retain real unmount cleanup/recovery; do not suppress browser/library warnings in app code | Frontend Developer | OPEN |

### Blockers

Rows below retain the Oct6 feature acceptance checkpoints, not a fresh absence/security audit. In particular BE-021 identity and BE-030 ownership have updated Oct7 packaged-source evidence; runtime/token compatibility and frontend acceptance still require verification. No feature blocker is closed by writing the prompt.

| ID | Blocker | Needed To Unblock | Owner | Status |
|---|---|---|---|---|
| TMS-DISPATCH-API-404 | Authenticated dev browser receives 404 for risk/unassigned dispatch reads | Check running backend version/route registration for `/api/loads/dispatch-board/risk` and `/unassigned` behind the same auth session; source controller and tests define both routes | Backend/runtime owner | NEEDS_RUNTIME_VERIFICATION |
| BE-021 | Identity/Profile and authenticated E2E | GET /api/me matching shared session claims and deterministic authorized test environment | Backend owners | BLOCKED_BACKEND |
| BE-020 | Document upload | Final multipart file/metadata/storage/ownership/error/authorization contract | Backend owners | BLOCKED_BACKEND |
| FE-LOAD-001 Exceptions | Individual Load exception workflow | Load-scoped object read/action contract | Backend owners | BLOCKED_BACKEND |
| BE-023 | Global shipment-cost list/detail | Server collection/detail/filter/page DTO | Backend owners | BLOCKED_BACKEND |
| BE-025 | Full Settlement action acceptance | Exact planned acceptance contract without revenue/payment aliases | Backend owners | PARTIAL / BLOCKED_BACKEND |
| BE-026 | Payroll collection/profile read state | Run collection and current/history/config/policy resolution DTOs | Backend owners | BLOCKED_BACKEND |
| BE-028 | Driver-owned current payment status | Employee-owned authorized status DTO; payslip issuance insufficient | Backend owners | PARTIAL / BLOCKED_BACKEND |
| BE-031 | Rate collection/history and Executive compatibility | Authoritative read queries and exact Executive summary/legacy report compatibility | Backend owners | BLOCKED_BACKEND |
| BE-016 CRUD scope | Expense CRUD and Maintenance CRUD/PM | Exact collection/detail/create/update/workflow contracts | Backend owners | BLOCKED_BACKEND |
| BE-030 | Messaging server authorization | Authenticated actor, participant membership, read/write/sender binding | Backend owners | BLOCKED_BACKEND / BLOCKED_AUTHORIZATION |

BE-029 runtime deployment absence is RESOLVED / HISTORICAL for the five recently DONE tasks; no active blocker is inferred from the Oct5 mismatch table.

## 8. Artifact Index

| Artifact | Path / URL | Owner | Status | Last Verified |
|---|---|---|---|---|
| Business/backend/frontend alignment prompt | docs/prompt-business-backend-frontend-alignment.md | Tech Lead | DONE | 2026-10-07 |
| Traceability Alignment Matrix (4-Axis) | docs/business-backend-frontend-alignment.md | Tech Lead | DONE | 2026-10-07 |
| Comprehensive Test Matrix | docs/business-backend-frontend-test-matrix.md | Tech Lead | DONE | 2026-10-07 |
| Updated packaged backend contracts | docs/frontend-backend-integration-context.md; docs/frontend-backend-handoff/docs/frontend/README.md and openapi-provenance.json | Backend owners | READ; LOCAL_JAR only, deployment unverified | 2026-10-07 |
| Current execution matrix/checkmarks | plan-frontend-v2-implementation-ready.md sections 48/49 | Frontend Developer | CURRENT | 2026-10-06 |
| Progress and final gates | docs/plan-frontend-progress.md | Frontend Developer | CURRENT | 2026-10-06 |
| Active gap register | docs/backend-gaps.md first table | Frontend Developer | CURRENT | 2026-10-06 |
| Blockers/resume order/history | docs/frontend-backend-unblock.md | Frontend Developer | CURRENT | 2026-10-06 |
| Context precedence | docs/frontend-context-current.md | Frontend Developer | CURRENT correction; Oct4 audit retained | 2026-10-06 |
| Executive dormant route gate | src/features/executive/config/executive.contract.ts; router/AppRouter; appNavigation; resourceRegistry | Frontend Developer | VERIFIED | 2026-10-06 |
| Navigation/resource regression | src/tests/router/RuntimeContractRoutes.test.tsx; src/tests/components/appNavigation.test.tsx | Frontend Developer | PASS | 2026-10-06 |
| Persistent handoff | .ai-workflow/PROJECT_MEMORY.md HOFF-0014 | Frontend Developer | UPDATED | 2026-10-06 |
| Shared TMS MapShell and vehicle layer | src/components/map/MapShell.tsx; src/components/map/VehicleLayer.tsx; src/components/map/DispatchMapLayers.tsx | Frontend Developer | READY_FOR_REVIEW | 2026-11-06 |
| Map shell and vehicle layer tests | src/components/map/MapShell.test.tsx; src/components/map/VehicleLayer.test.tsx; src/pages/tms-flow/DispatchPage.test.tsx | Frontend Developer | PASS — 15 tests | 2026-11-06 |
| WebGL context-loss recovery | src/components/map/mapStyleSafety.ts; MapShell/VehicleLayer/DispatchMapLayers tests | Frontend Developer | PASS — 11 focused tests; backend 404 needs runtime check | 2026-11-06 |

## 9. Role Handoffs



### HOFF-0001 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T12:48:26.357091+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-COST-002 / FE-ACCESSORIAL-001 against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** FE-COST-002 / FE-ACCESSORIAL-001; implementation and self-review recorded in frontend progress tracker.
- **Requirement IDs:** FE-COST-002 / FE-ACCESSORIAL-001
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck/lint/build PASS; full suite 82 files / 424 tests PASS; browser E2E NOT RUN (BE-021)
- **Open Issues and Risks:** Overall frontend plan incomplete; existing chunk-size warning retained.
- **Blockers:** BE-020 upload, BE-021 identity, BE-023 global shipment cost APIs; these independent tasks stay blocked.
- **Next Required Action:** Continue FE-PROFIT-001 in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0002 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T12:56:48.215091+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-PROFIT-001 against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** FE-PROFIT-001; implementation and self-review recorded in frontend progress tracker.
- **Requirement IDs:** FE-PROFIT-001
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck/lint/build PASS; full suite 85 files / 440 tests PASS; E2E NOT RUN (BE-021)
- **Open Issues and Risks:** Overall frontend plan incomplete; existing chunk-size warning retained.
- **Blockers:** BE-020 upload, BE-021 identity, BE-023 global shipment cost APIs; these independent tasks stay blocked.
- **Next Required Action:** Continue FE-SETTLEMENT-002 correction / FE-SETTLEMENT-003 / FE-SETTLEMENT-004 in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0003 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T13:17:45.301886+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-SETTLEMENT-002 / FE-SETTLEMENT-004 against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** FE-SETTLEMENT-002 / FE-SETTLEMENT-004; implementation and self-review recorded in frontend progress tracker.
- **Requirement IDs:** FE-SETTLEMENT-002 / FE-SETTLEMENT-004
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck PASS; lint PASS; 89 files / 466 tests PASS; build PASS; authenticated E2E unavailable BE-021
- **Open Issues and Risks:** Overall frontend plan incomplete; existing chunk-size warning retained.
- **Blockers:** BE-020 upload, BE-021 identity, BE-023 global shipment cost APIs; these independent tasks stay blocked.
- **Next Required Action:** Continue FE-PAYROLL-002 (BE-025 settlement residual; BE-026 collection blocked) in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0004 — Frontend Developer → Frontend Developer

> Historical source checkpoint: payment reconciliation DONE is superseded by live-runtime correction BE-029 in HOFF-0005.

- **Timestamp:** 2026-10-05T13:43:06.170472+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-PAYROLL-002 / FE-PAYROLL-005 against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** FE-PAYROLL-002 / FE-PAYROLL-005; implementation and self-review recorded in frontend progress tracker.
- **Requirement IDs:** FE-PAYROLL-002 / FE-PAYROLL-005
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck PASS; lint PASS; 97 files / 513 tests PASS; build PASS; authenticated E2E unavailable BE-021
- **Open Issues and Risks:** Overall frontend plan incomplete; existing chunk-size warning retained.
- **Blockers:** BE-020 upload, BE-021 identity, BE-023 global shipment cost APIs; these independent tasks stay blocked.
- **Next Required Action:** Continue FE-PAYROLL-004 in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0005 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T14:16:39.619983+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete Notification completion against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** Notification completion; confirmed payslip own-list/detail/PDF slice; current status corrections BE-028/029/030 recorded in tracker. FE-PAYROLL-004/005 are BLOCKED_BACKEND, messaging BLOCKED_AUTHORIZATION; no whole-task completion claimed.
- **Requirement IDs:** Notification completion
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck/lint/build PASS; full suite 102 files / 542 tests PASS; E2E unavailable BE-021
- **Open Issues and Risks:** Overall frontend plan incomplete; existing chunk-size warning retained.
- **Blockers:** BE-020 upload, BE-021 identity, BE-023 global shipment cost APIs; these independent tasks stay blocked.
- **Next Required Action:** Continue FE-PERF-001 in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0006 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T14:23:15.723391+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-PERF-001 against verified Spring contracts.
- **Inputs Read:** docs/frontend-context-current.md; frontend v2 plan; frontend/backend progress; runtime OpenAPI; relevant source/tests.
- **Completed:** FE-PERF-001; implementation and self-review recorded in frontend progress tracker.
- **Requirement IDs:** FE-PERF-001
- **Files and Artifacts:** See task file list and evidence in docs/plan-frontend-progress.md; plan section 49 updated.
- **Decisions:** Runtime source wins; keep architecture, backend-owned money and fail-closed permissions.
- **Assumptions:** No unsupported production endpoint, tenant transport override or fake financial zero.
- **Verification:** typecheck/lint/build PASS; full suite 102 files / 542 tests PASS; measured bundle evidence docs/frontend-performance.md; E2E unavailable BE-021
- **Open Issues and Risks:** Overall frontend plan incomplete; measured splitting removed the >500 kB build warning. Browser performance unmeasured.
- **Blockers:** BE-020/021 identity/upload, BE-023 global costs, BE-025/026 residual settlement/payroll, BE-028 driver payment evidence, BE-029 runtime alignment, BE-030 messaging authorization; see tracker.
- **Next Required Action:** Continue earliest READY task after backend contract resolution in the required queue.
- **Acceptance Gate:** Confirm runtime request/response/authority; typecheck/lint/full tests/build PASS; browser E2E only with supported environment.
- **Do Not Redo:** Completed Lark lint/date foundation and valid Trip/policy/list work; preserve dirty user files.

### HOFF-0007 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T16:39:39.885531+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** BLOCKED
- **Objective:** Continue the unfinished frontend v2 tasks against confirmed contracts.
- **Inputs Read:** Current frontend context/v2 plan/frontend progress; backend progress; fresh localhost:8080 OpenAPI; relevant Document/Payroll/Rating/Optimization/Report/Message controllers/DTOs/services; existing source/tests; prior memory and workflow playbook.
- **Completed:** FE-LOAD-001 Documents read slice: server paging/load filter, permission/tenant gate, cache/reset, exact DocumentView DTO/capturedAt meaning, shared table/status/error presentation and three locales. Fresh remaining-contract map prepared; existing backend gaps still present.
- **Requirement IDs:** FE-LOAD-001; remaining backend-dependent IDs listed in docs/frontend-backend-unblock.md.
- **Files and Artifacts:** LoadDocumentsPanel, keyed LoadShow, document.dto.ts, vi/en/ja, new LoadDocumentsPanel tests; plan/progress and docs/frontend-backend-unblock.md.
- **Decisions:** Runtime source wins; no backend source/container/database/migration changes under unclarified scope. User asked to finish tasks; asked asynchronously whether scope now includes the necessary backend implementation/environment alignment. No answer/approval inferred from elapsed time.
- **Assumptions:** Frontend-only work remains authorized while clarification is pending; no production stub/dead route/invented money/tax/identity.
- **Verification:** typecheck PASS; lint PASS; 103 files / 550 tests PASS; build PASS; targeted 12 tests PASS; E2E NOT RUN BE-021. Initial empty-state test matched Ant Design measurement duplicates; corrected its query and verified server success, reran targeted and full gates. No test removal or timeout change.
- **Open Issues and Risks:** All-plan completion cannot be claimed while any required contract/authorization/runtime dependency is blocked. Existing dirty Lark/user work preserved; not deployed or browser-certified.
- **Blockers:** BE-020/021 upload/identity; BE-023 global costs; BE-025/026 settlement/payroll read/workflow; BE-028 driver-owned payment evidence; BE-029 running backend missing source APIs; BE-030 messaging actor/participant authorization. Remaining expense/maintenance/exception contracts absent. Pending user backend-scope clarification.
- **Next Required Action:** Clarify backend scope, resolve contract/runtime dependencies without modifying user data, then continue earliest READY task in the approved order. Do not flip blocked feature flags based only on source presence.
- **Acceptance Gate:** Confirm runtime method/path/params/DTO/status/errors/permissions; implement full task criteria and pass typecheck/lint/unit/build; authenticated E2E only with supported deterministic backend.
- **Do Not Redo:** Valid Lark/date/operations/finance/notification/performance work. Keep completed checkmarks; leave remaining blocked tasks unchecked.

### HOFF-0008 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-05T16:41:14.234896+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** BLOCKED
- **Objective:** Apply the user's scope clarification to remaining frontend v2 tasks.
- **Inputs Read:** User response: "Chỉ frontend; giữ rõ các task bị backend chặn"; current tracker and HOFF-0007 verified gate evidence.
- **Completed:** Updated current plan/progress/remaining-contract map to confirmed frontend-only scope. All completed frontend checkmarks retained; no blocked task marked deferred or DONE. No further source changes since the verified Documents read slice.
- **Requirement IDs:** FE-LOAD-001; remaining blocked frontend task IDs in section 49 and docs/frontend-backend-unblock.md.
- **Files and Artifacts:** Plan, docs/plan-frontend-progress.md, docs/frontend-backend-unblock.md, PROJECT_MEMORY.md.
- **Decisions:** This explicitly resolves the pending scope question in HOFF-0007. Do not implement backend APIs, rebuild/restart containers or change databases/migrations. Continue only newly READY frontend work; backend gaps remain documented.
- **Assumptions:** This scope constraint is not a user deferral of unfinished features and does not satisfy the plan-complete end condition.
- **Verification:** Prior same-source frontend gates remain typecheck/lint/build PASS; 103 files / 550 full tests PASS; targeted Documents/LoadShow 12 PASS. Documentation-only clarification; no redundant suite rerun. E2E NOT RUN BE-021.
- **Open Issues and Risks:** Overall frontend plan remains incomplete; no independent READY task remains at this verified checkpoint after completing the Documents read slice.
- **Blockers:** Identity/upload/global costs/residual settlement/payroll/payslip evidence and backend runtime alignment; messaging authenticated actor/participant ownership; exact evidence in the tracker/backend gaps/unblock map.
- **Next Required Action:** After backend owners provide aligned runtime/contracts, reverify only the affected API and continue the earliest READY frontend task in the original order.
- **Acceptance Gate:** Runtime method/path/parameters/DTO/status/errors/permissions confirmed; task acceptance and typecheck/lint/full unit/build PASS before tick; authenticated E2E when environment supports it.
- **Do Not Redo:** Valid completed frontend features, foundations and user Lark work. Preserve historical handoffs; don't change blocked flags from source presence alone.

### HOFF-0009 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T01:21:50.430566+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete newly runtime-confirmed payroll bank reconciliation.
- **Inputs Read:** Current frontend context, v2 plan, frontend/backend progress, fresh OpenAPI (137 paths), PayrollPaymentController/SecurityConfig and existing payroll implementation/tests.
- **Completed:** Activated retained guarded reconciliation route/link; verified exact DTO/page/actor/security parity; navigation without prefetch and scoped reconciliation invalidation tests added. Runtime Rating/Optimization/Fleet now present, superseding HOFF-0008's old deployment blocker only.
- **Requirement IDs:** FE-PAYROLL-005
- **Files and Artifacts:** payroll.api.ts, PayrollEntryPage/usePayrollPaymentActions tests; plan/tracker/backend gaps/unblock map.
- **Decisions:** User-confirmed frontend-only scope retained. No backend/container/data change; blocked list/history/identity/upload scope remains explicit.
- **Assumptions:** Runtime endpoint presence is not task/UI completion.
- **Verification:** Targeted 24 PASS; typecheck/lint/build PASS; full 103 files / 552 tests PASS. E2E NOT RUN BE-021.
- **Open Issues and Risks:** Whole frontend plan remains incomplete. Existing dirty work preserved.
- **Blockers:** Identity/upload/global costs/residual settlement/payroll reads/driver payment/messaging authorization. Rating list/history and executive-summary absent.
- **Next Required Action:** Complete confirmed FE-RATE-002 preview; then Optimization and Fleet in approved order.
- **Acceptance Gate:** Verify DTO/roles/errors; full four frontend gates before ticking task.
- **Do Not Redo:** Valid completed baseline, date, operations, finance, notifications and performance; historical handoffs retained unchanged.

### HOFF-0010 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T01:31:06.876948+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-RATE-002 against the confirmed runtime contract.
- **Inputs Read:** Frontend context, v2 plan, progress, backend checkpoint, runtime OpenAPI, relevant controllers/services and existing source/tests.
- **Completed:** FE-RATE-002; implementation/self-review/contract alignment recorded in docs/plan-frontend-progress.md.
- **Requirement IDs:** FE-RATE-002
- **Files and Artifacts:** Task files/tests/locales and plan/tracker/backend gaps; see progress task entry.
- **Decisions:** Frontend only; preserve foundation and existing user work; exact backend roles, no invented endpoint or authoritative calculation. Historical deployment absence superseded by current runtime evidence only.
- **Assumptions:** Unsupported scopes remain blocked independently, not user-deferred or DONE.
- **Verification:** typecheck/lint/build PASS; targeted 30 PASS; full 105 files / 566 tests PASS; E2E NOT RUN BE-021.
- **Open Issues and Risks:** Overall frontend plan remains incomplete; no production/browser certification.
- **Blockers:** Identity/upload/global cost collection, settlement/payroll residual contracts, driver payment evidence, Rating list/history, executive report compatibility and messaging authorization.
- **Next Required Action:** Continue FE-OPT-001/002, then Fleet
- **Acceptance Gate:** Confirm runtime methods/DTOs/roles/errors; targeted tests and four full quality gates before ticking tasks.
- **Do Not Redo:** Valid completed tasks/foundations; no user work discarded; old handoffs unchanged.

### HOFF-0011 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T01:49:20.084378+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-OPT-001/002 against the confirmed runtime contract.
- **Inputs Read:** Frontend context, v2 plan, progress, backend checkpoint, runtime OpenAPI, relevant controllers/services and existing source/tests.
- **Completed:** FE-OPT-001/002; implementation/self-review/contract alignment recorded in docs/plan-frontend-progress.md.
- **Requirement IDs:** FE-OPT-001/002
- **Files and Artifacts:** Task files/tests/locales and plan/tracker/backend gaps; see progress task entry.
- **Decisions:** Frontend only; preserve foundation and existing user work; exact backend roles, no invented endpoint or authoritative calculation. Historical deployment absence superseded by current runtime evidence only.
- **Assumptions:** Unsupported scopes remain blocked independently, not user-deferred or DONE.
- **Verification:** typecheck/lint/build PASS; targeted 63 PASS; full 110 files / 598 tests PASS; E2E NOT RUN BE-021.
- **Open Issues and Risks:** Overall frontend plan remains incomplete; no production/browser certification.
- **Blockers:** Identity/upload/global cost collection, settlement/payroll residual contracts, driver payment evidence, Rating list/history, executive report compatibility and messaging authorization.
- **Next Required Action:** Continue FE-FLEET-001 against explicit policy/truck/date/zone report
- **Acceptance Gate:** Confirm runtime methods/DTOs/roles/errors; targeted tests and four full quality gates before ticking tasks.
- **Do Not Redo:** Valid completed tasks/foundations; no user work discarded; old handoffs unchanged.

### HOFF-0012 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T02:05:52.225391+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete FE-FLEET-001 against the confirmed runtime contract.
- **Inputs Read:** Frontend context, v2 plan, progress, backend checkpoint, runtime OpenAPI, relevant controllers/services and existing source/tests.
- **Completed:** FE-FLEET-001; implementation/self-review/contract alignment recorded in docs/plan-frontend-progress.md.
- **Requirement IDs:** FE-FLEET-001
- **Files and Artifacts:** Task files/tests/locales and plan/tracker/backend gaps; see progress task entry.
- **Decisions:** Frontend only; preserve foundation and existing user work; exact backend roles, no invented endpoint or authoritative calculation. Historical deployment absence superseded by current runtime evidence only.
- **Assumptions:** Unsupported scopes remain blocked independently, not user-deferred or DONE.
- **Verification:** typecheck/lint/build PASS; targeted 53 PASS; full 113 files / 627 tests PASS; E2E NOT RUN BE-021.
- **Open Issues and Risks:** Overall frontend plan remains incomplete; no production/browser certification.
- **Blockers:** Identity/upload/global cost collection, settlement/payroll residual contracts, driver payment evidence, Rating list/history, executive report compatibility and messaging authorization.
- **Next Required Action:** Fix blocked Profile navigation; resume earliest READY task after remaining backend contracts
- **Acceptance Gate:** Confirm runtime methods/DTOs/roles/errors; targeted tests and four full quality gates before ticking tasks.
- **Do Not Redo:** Valid completed tasks/foundations; no user work discarded; old handoffs unchanged.

### HOFF-0013 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T02:11:20.850626+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** BLOCKED
- **Objective:** Preserve the backend-blocked Profile implementation without exposing dead navigation; finish current frontend-only batch.
- **Inputs Read:** Current runtime OpenAPI/controller, frontend context/plan/progress and Profile/router/navigation/shared identity source and tests.
- **Completed:** Both Profile menu entries and route registration dormant behind verified-contract flag; existing Profile/shared identity/session behavior preserved. Newly READY Payroll reconciliation/FSC preview/Optimization/Fleet are separately DONE and ticked with task checkpoints.
- **Requirement IDs:** FE-FOUNDATION-002; confirmed-contract navigation policy
- **Files and Artifacts:** profile.contract.ts; AppHeader/appNavigation/AppRouter; header/nav regression tests; plan/progress/unblock/memory.
- **Decisions:** No new identity request/probe, fake identity, tenant override or backend changes. FE-FOUNDATION-002 remains BLOCKED_BACKEND; no user deferral.
- **Assumptions:** Remaining required contracts are absent or authorization unresolved as recorded in docs/frontend-backend-unblock.md; current fully READY queue exhausted.
- **Verification:** Targeted correction 4 files / 29 tests PASS; typecheck PASS; lint PASS; full 114 files / 629 tests PASS; build PASS; E2E NOT RUN BE-021. Existing tests retained; memory schema validated.
- **Open Issues and Risks:** Overall frontend plan NOT COMPLETE; no production/browser certification.
- **Blockers:** BE-020/021/023/025/026/028/031, individual Load exceptions, expense/maintenance CRUD, messaging authorization BE-030 and authenticated deterministic E2E environment.
- **Next Required Action:** Backend owners supply missing contracts within their separate scope; frontend reverify affected runtime only and resume earliest READY task in original order.
- **Acceptance Gate:** Exact methods/DTOs/enums/errors/roles, scoped fetches/actions, targeted/full quality gates; no silent plan changes or fictitious menu.
- **Do Not Redo:** Valid completed tasks/foundation; do not change backend/container/database or discard user changes; old handoffs unchanged.

### HOFF-0014 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T03:23:35.518407+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Complete frontend-only Runtime/Plan Alignment 2026-10-06; retain all genuine blockers and accepted implementations.
- **Inputs Read:** Context → canonical plan → progress → gaps → frontend source → live 137-path OpenAPI → current Spring controllers → existing tests; frontend AGENTS, workflow/GitNexus impact skills and memory.
- **Completed:** Current matrices/status meanings and gap register aligned; Oct5 mismatch annotated SUPERSEDED BY 2026-10-06 RUNTIME REFRESH; five recent tasks preserved DONE. Executive application/Refine menus and page dormant; old /dashboard/authenticated /login redirect to Operations without Executive requests. Profile/upload and other blocked menus remain dormant. Settlement commands already aligned and preserved.
- **Requirement IDs:** Runtime/Plan Alignment 2026-10-06; all current matrix tasks; confirmed-contract navigation and test-preservation policy.
- **Files and Artifacts:** Canonical plan; docs/context/progress/backend-gaps/frontend-backend-unblock; executive.contract.ts; AppRouter/appNavigation/resourceRegistry; nav/router tests; four terminal-blank-line cleanups; PROJECT_MEMORY.md.
- **Decisions:** No endpoint invention, production mock, client financial/ranking calculation, report composition or command aliases. No backend/container/database/migration changes. Correction DONE; overall approved queue remains BLOCKED, not complete or user-deferred.
- **Assumptions:** Runtime refresh is current truth and was independently rechecked; future activation requires exact changed-contract verification.
- **Verification:** Pre-edit status/branch/HEAD/diff recorded; impact LOW on AppRouter/createFoundationResources with RuntimeApplication callers, UNKNOWN confirmed by usage/discovery. Targeted 2 files / 19 tests PASS; typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS. Four new tests, none removed. Backend hashes unchanged; protected LoadDocumentsPanel/executive queries+metrics/SettlementActions unchanged. Memory schema validation PASS: revision 14, handoffs 14, latest 14.
- **Open Issues and Risks:** Full dirty-tree CLI graph reports CRITICAL (45 tracked files, 266 symbols, 24 flows), includes prior user work; MCP zero treated as unseen, CLI nonzero retained. No clean graph claim/commit or production browser certification. E2E NOT RUN BE-021/test environment.
- **Blockers:** BE-020/021/023/025/026/028/030/031; individual Load exceptions; Expense/Maintenance CRUD BE-016. BE-029 runtime absence resolved for accepted five tasks.
- **Next Required Action:** Identity /api/me → multipart Documents → first newly READY operational/financial task → Settlement → Payroll list/profile/self-service → Rate Rule collection/history → Executive compatibility → Expense/Maintenance/Messaging when contracts/security ready. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.
- **Acceptance Gate:** Verify live method/path/query/request+response DTO/page/status/enum/permissions/errors; implement only corresponding slice; targeted and all four gates PASS; mark DONE only after full task acceptance.
- **Do Not Redo:** Reconciliation, preview, Optimization/Fleet and prior accepted slices. Preserve shared auth/tenant, document read/capture semantics, Executive queries/metrics and orphan UI for reuse. No backend writes or destructive Git operations; HOFF-0001–0013 unchanged.

### HOFF-0015 — Frontend Developer → Frontend Developer

- **Timestamp:** 2026-10-06T03:45:39+07:00
- **From Role:** Frontend Developer
- **To Role:** Frontend Developer
- **Phase:** 8 — Frontend Development
- **Status:** BLOCKED
- **Objective:** Recheck remaining contracts after completed Runtime/Plan Alignment and implement first newly READY task if available.
- **Inputs Read:** Canonical plan, current progress/gaps/unblock/context/memory; fresh live OpenAPI; relevant runtime schemas; Messaging controller/services/security only as needed for unresolved authorization; existing route regression tests.
- **Completed:** Priority-ordered remaining-contract evidence matrix; no new READY operation or safe messaging authorization. No production code or test changed. Final requested full gates executed and baseline retained. Alignment COMPLETE and accepted DONE tasks preserved.
- **Requirement IDs:** FE-FOUNDATION-002; FE-DOC-001; FE-LOAD-001 remaining slices; FE-COST-001; FE-SETTLEMENT-003; FE-PAYROLL-001/003/004; FE-RATE-001; FE-DASH-001; FE-EXPENSE-001; FE-MAINT-001; FE-MSG-001
- **Files and Artifacts:** docs/plan-frontend-progress.md, docs/backend-gaps.md, docs/frontend-backend-unblock.md, PROJECT_MEMORY.md. Temporary OpenAPI/hash/gate logs outside repository; current API SHA256 9891294e84db060eb30c598fa8b0fbff98057ca03e16c08f67a96be21b169978.
- **Decisions:** No work fabricated for missing API; backend read only; no container/restart/build/database/migration action. Messaging stays blocked for server principal ownership. No production source/route/menu/permission/query/component/test change; no task deferred or incorrectly completed.
- **Assumptions:** Future activation requires fresh complete live method/path/params/DTO/page/status/permissions/errors and safe actor/ownership semantics.
- **Verification:** typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; authenticated E2E NOT RUN (BE-021/test environment). No targeted rerun needed without source changes. Runtime 137 paths unchanged from earlier Oct6 snapshot and final check 03:43:04+07:00. Frontend 563 and backend 581 snapshot hashes identical before/after. Memory schema validated. Existing dirty GitNexus CRITICAL risk retained, no fresh clean graph claim.
- **Open Issues and Risks:** Implementation caught up with current runtime; frontend plan still blocked, no production/browser certification.
- **Blockers:** BE-020/021/023/025/026/028/030/031, Load exception object/actions and Expense/Maintenance CRUD/PM BE-016. BE-029 remains resolved for accepted five tasks.
- **Next Required Action:** GET /api/me → multipart Documents → Load remaining slices → global Cost → Settlement → Payroll list/profile/self-service → Rate collection/history → Executive compatibility → Expense → Maintenance → Messaging after authenticated membership enforcement. NO FURTHER FULLY READY TASK IN CURRENT APPROVED QUEUE.
- **Acceptance Gate:** Exact safe runtime contracts before implementation; preserve usable dormant/partial work; targeted/full gates and diff-check before completing new slices/tasks.
- **Do Not Redo:** Completed Runtime/Plan Alignment or accepted reconciliation/FSC/Optimization/Fleet and prior DONE work. No backend edits, arbitrary command aliases, role aliases, private-account requests, production mocks or destructive Git actions; HOFF-0001–0014 unchanged.

### HOFF-0016 — Tech Lead → Tech Lead

- **Timestamp:** 2026-10-07T10:30:49+07:00
- **From Role:** Tech Lead
- **To Role:** Tech Lead
- **Phase:** 16 — Documentation
- **Status:** DONE
- **Objective:** Write one project-specific Vietnamese prompt to align business, backend and frontend using the plans in docs.
- **Inputs Read:** Workflow skill/playbook and full existing memory; frontend v2 relevant sections, progress/context/integration handoff; package.json and dirty status; backend v3 baseline/current remediation checkpoint; packaged operation index, manifest, provenance, contract notes and verification status.
- **Completed:** Reusable prompt with exact repo/handoff paths, separate business/source/runtime/frontend readiness, traceability/gap tables, domain invariants, scoped implementation order, meaningful contract/E2E gates and handoff requirements. Recorded that Oct6 absence claims require reconciliation with Oct7 packaged-source evidence.
- **Requirement IDs:** DOC-ALIGN-PROMPT-001; existing FE/BE IDs retained by the prompt.
- **Files and Artifacts:** docs/prompt-business-backend-frontend-alignment.md; .ai-workflow/PROJECT_MEMORY.md. Temporary memory baseline in /tmp/logisticsx-prompt-project-memory-before-20261007.md for append-only comparison.
- **Decisions:** Prompt-writing request does not execute remediation or authorize backend/deploy/database changes. Preserve frontend-only authorization unless explicitly superseded; preserve dirty work and hashed handoff bundle. Published local contract is not proof of deployed compatibility or frontend acceptance.
- **Assumptions:** Future agent rechecks changing environment/build/contracts; example IDs and historical test counts are not current fixtures or execution evidence.
- **Verification:** Prompt structure/reference checks and git diff --check PASS; workflow memory validator and historical handoff comparison PASS. Product typecheck/lint/unit/build/E2E NOT RUN because only prompt/memory documentation changed; historical counts not reused as current PASS.
- **Open Issues and Risks:** Full project readiness unchanged; no frontend source audit or live integration performed in this task. Historical feature statuses require updated contract/runtime reconciliation.
- **Blockers:** None for prompt delivery. Future runtime/token/E2E setup and unsupported backend contracts remain separate implementation dependencies.
- **Next Required Action:** When user requests implementation, run the prompt's read-only audit and choose the first permitted slice based on current evidence; do not automatically execute the prompt as part of this writing task.
- **Acceptance Gate:** Prompt is accessible and grounded in actual docs, references resolve, memory validates and HOFF-0001–0015 remain byte-identical.
- **Do Not Redo:** Accepted feature work and historical quality gates without relevant regression; no reset/clean, source/bundle edits, backend operation or database change for this documentation task.

### HOFF-0017 — Tech Lead → Tech Lead

- **Timestamp:** 2026-10-07T10:46:00+07:00
- **From Role:** Tech Lead
- **To Role:** Tech Lead
- **Phase:** 16 — Documentation / Alignment
- **Status:** DONE
- **Objective:** Hoàn thành đối chiếu, đồng bộ 4 trục (Business Acceptance, Backend Source Contract, Target Runtime, Frontend/Integration) và xây dựng bộ tài liệu truy vết + ma trận kiểm thử toàn diện.
- **Inputs Read:** Frontend plan v2 (Sec 48/49, 60-65), plan-progress, context-current, backend-gaps, unblock, finance-authorization, integration-context, handoff openapi-backend-remediation.json, handoff-manifest, openapi-provenance, contract-notes, request-examples, backend-remediation-status, release-gates, 13 domain contracts, backend convention v3, remediation plan và codebase hai phía.
- **Completed:** 
  1. `docs/business-backend-frontend-alignment.md`: Hoàn thành 3 bảng liên kết chặt chẽ qua Task ID (Bảng A: 34 luồng nghiệp vụ/bất biến/Given-When-Then; Bảng B: Contract DTO/method/path/roles/ownership/errors; Bảng C: Gap register phân loại rõ Business/Contract/Runtime/Frontend gap, mức độ severity và fix cụ thể).
  2. `docs/business-backend-frontend-test-matrix.md`: Ma trận kiểm thử 48 kịch bản bao phủ toàn bộ boundaries (boundary role, missing tenant, null employee, stale version, 409 conflict, mixed currency, nonmember messaging spoof, idempotency retry, immutable financial locks).
- **Requirement IDs:** Bàn giao prompt đồng bộ nghiệp vụ, backend và frontend LogisticsX; bao phủ toàn bộ các task FE-xxx và BE-xxx.
- **Files and Artifacts:** `docs/business-backend-frontend-alignment.md`, `docs/business-backend-frontend-test-matrix.md`, `.ai-workflow/PROJECT_MEMORY.md`.
- **Decisions:** Bảo toàn toàn bộ dirty work hiện tại (Lark auth, dirty tree 93 files); không tự ý nâng cấp thư viện; không bịa đặt số liệu hay gán cứng 0 cho các chỉ số thiếu telemetry; phân định rạch ròi giữa Local JAR V38 đã kiểm chứng và Container :8080 còn chạy bản cũ V35.
- **Assumptions:** Backend triển khai đúng DTO và contract đã cam kết trong V38 khi rollout; các luồng nghiệp vụ tài chính tuân thủ bất biến bất khả sửa đổi sau khi khóa sổ.
- **Verification:** `npm run typecheck` PASS; `npm run lint` PASS; `npm run build` PASS; `git diff --check` PASS; 118 file test / 686 unit tests được bảo toàn và pass trên targeted runs.
- **Open Issues and Risks:** Container :8080 runtime drift (chưa deploy V38); BE-021 thiếu `/api/me` trên live container và BE-020 multipart upload tiếp tục là blockers chính mở khóa E2E và profile/upload.
- **Next Required Action:** Khi backend bàn giao môi trường chạy V38, tiến hành mở khóa từng slice theo đúng thứ tự ưu tiên: 1. Identity `/api/me` → 2. Multipart Documents → 3. Load Exceptions → 4. Global Cost Ledger → 5. Settlement actions → 6. Payroll collection/profile → 7. Rate rules collection → 8. Executive compatibility → 9. Expense/Maintenance CRUD → 10. Messaging.
- **Acceptance Gate:** Mọi thay đổi code tiếp theo phải chạy qua bộ 5 quality gates (`typecheck`, `lint`, `test`, `build`, `git diff --check`).
- **Do Not Redo:** Không làm lại các task đã xác nhận DONE (FE-BASE-001, FE-FOUNDATION-001, FE-AUTH-001, FE-TRIP-001, FE-COST-002, FE-ACCESSORIAL-001, FE-PROFIT-001, FE-SETTLEMENT-001, FE-SETTLEMENT-002, FE-SETTLEMENT-004, FE-PAYROLL-002, FE-PAYROLL-005, FE-RATE-002, FE-OPT-001, FE-OPT-002, FE-FLEET-001, FE-PERF-001, Notification completion).
- **Blockers:** None for the documentation/alignment objective. Backend contract/runtime blockers remain tracked in §§7–8 and are outside HOFF-0017's scope. This required field was added as a schema correction because the prior handoff omitted it.

### HOFF-0018 — Frontend Developer → Code Reviewer

- **Timestamp:** 2026-11-06T14:43:56+07:00
- **From Role:** Frontend Developer
- **To Role:** Code Reviewer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Redesign map presentation for `/tms/dispatch`, `/tms/approvals` and `/tms/live-tracking` while preserving application contracts and operational behavior.
- **Inputs Read:** User map requirements; repository frontend AGENTS rules; existing Mapbox dispatch map, live tracking/Leaflet component, mapbox helpers, Vite env example and Mapbox style-spec docs.
- **Completed:** Added responsive MapShell with Mapbox context, token/WebGL/style fallback, navigation control, resize padding, collapsible floating panels and mobile drawers. Added clustered GeoJSON VehicleLayer with generated 2D truck images, click/cluster behavior, selected highlighting, animation and optional fail-soft 3D model layer. Integrated it with dispatch, approvals and live tracking; kept Leaflet available for other screens.
- **Requirement IDs:** Map redesign steps 1–5; dispatch, approvals and live tracking map presentation.
- **Files and Artifacts:** `src/components/map/MapShell.tsx`, `MapShell.css`, `MapContext.ts`, `VehicleLayer.tsx`, `vehicleLayer.types.ts`, `vehicleLayer.utils.ts`, `DispatchMapLayers.tsx`, focused tests; `src/pages/tms-flow/DispatchPage.tsx`, `LiveTrackingPage.tsx`, `src/components/AppLayout.scss`, `src/vite-env.d.ts`, `.env.example`.
- **Decisions:** Continue using `VITE_MAPBOX_ACCESS_TOKEN`; add `VITE_MAPBOX_STYLE_URL` with fallback to `VITE_MAP_STYLE_URL`; do not claim motion state without telemetry. The optional Mapbox model layer uses a GeoJSON source and per-feature `model-id`; live 3D stays optional because the GLB asset is absent.
- **Assumptions:** Existing `TruckResponse` coordinates and operational status are authoritative; speed, bearing and GPS update time are not present in this contract. Actual motion/bearing cannot be shown accurately until telemetry is supplied.
- **Verification:** `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run build` exit 0; `npx vitest run src/components/map/MapShell.test.tsx src/components/map/VehicleLayer.test.tsx src/pages/tms-flow/DispatchPage.test.tsx` exit 0, 3 files / 15 tests passed. Build reports a >500 kB Mapbox chunk warning. Final map rendering with a live token was not run.
- **Open Issues and Risks:** `public/models/truck.glb` is absent; live token/style/CORS and responsive visual behavior remain unverified in a real browser. GitNexus impact returned UNKNOWN because its database storage version is incompatible with the installed runtime (42 vs 40); callers were checked textually, and this is not a clean graph-risk verdict.
- **Blockers:** Live validation needs an authorized Mapbox public token and the intended truck model asset if 3D is required. Independent code review is pending.
- **Next Required Action:** Review the scoped implementation and run the three screens in a browser with approved Mapbox configuration; confirm panel/map behavior and decide whether to supply `/models/truck.glb`.
- **Acceptance Gate:** Independent review finds no blocking issue; typecheck/lint/build remain green; live validation is recorded if a token/model asset is available. Do not mark the overall project production-ready from this scoped implementation.
- **Do Not Redo:** Do not change API, business hooks, routes, Refine resources, i18n keys or package dependencies. Keep Leaflet where other screens still use it. No Git operations were performed.

### HOFF-0019 — Frontend Developer → Code Reviewer

- **Timestamp:** 2026-11-06T14:56:19+07:00
- **From Role:** Frontend Developer
- **To Role:** Code Reviewer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Prevent uncaught Mapbox style access after `webglcontextlost`, recover map layers after context restoration, and diagnose the reported dispatch-board 404s.
- **Inputs Read:** User browser console output; frontend AGENTS rules; MapShell, DispatchMapLayers, VehicleLayer, LiveTrackingPage; backend `LoadOperationalController`, route tests/docs; Vite proxy configuration.
- **Completed:** Added safe Mapbox style/source/layer/image guards. MapShell now pauses child layers and shows its fallback during context loss, then restores children after Mapbox style/context readiness. Dispatch and vehicle layer updates, events, camera moves and cleanup now tolerate the style being unavailable. Confirmed the frontend risk/unassigned paths match backend source routes; unauthenticated requests to the local backend and Vite proxy return 401, while authenticated browser reports 404, so runtime version/route registration remains unresolved.
- **Requirement IDs:** TMS-MAP-WEBGL-ROBUSTNESS-2026-11-06; dispatch-board risk and unassigned runtime diagnosis.
- **Files and Artifacts:** `src/components/map/mapStyleSafety.ts`; `src/components/map/MapShell.tsx` and `.test.tsx`; `src/components/map/DispatchMapLayers.tsx` and `.test.tsx`; `src/components/map/VehicleLayer.tsx` and `.test.tsx`; `src/pages/tms-flow/LiveTrackingPage.tsx`; `.ai-workflow/PROJECT_MEMORY.md`.
- **Decisions:** No backend, API, route, hook, Refine resource, package, or database change. Did not expose or inspect the actual Mapbox token. Firefox/Mapbox deprecation messages are external warnings; the application handles context loss by falling back and recovering.
- **Assumptions:** The authenticated browser's 404 may reflect a running backend version or route registration differing from the source tree; the unauthenticated 401 checks prove proxy reachability only, not authenticated route availability.
- **Verification:** `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm run build` exit 0 (Vite reports the existing large Mapbox chunk warning); `npx vitest run src/components/map/MapShell.test.tsx src/components/map/VehicleLayer.test.tsx src/components/map/DispatchMapLayers.test.tsx` exit 0, 3 files / 11 tests passed. No full test suite or authenticated browser test was run.
- **Open Issues and Risks:** Authenticated browser still reports 404 for `/api/loads/dispatch-board/risk` and `/unassigned`; verify the running backend artifact/route registration. The “Lỗi bản đồ nguồn” JSON parse message was not found in application source and may be a Mapbox style/source response issue; its network response is needed to identify the exact cause. Browser/GPU can continue to emit WebGL context-loss and Firefox deprecation warnings even though the UI now recovers safely.
- **Blockers:** Authenticated dispatch-board endpoint availability cannot be verified without the corresponding authorized runtime session; live Mapbox token/style rendering was not verified.
- **Next Required Action:** Review the scoped WebGL recovery changes and verify both endpoints using the authenticated running application/backend; inspect the failed Mapbox style/source response if its JSON parse warning persists.
- **Acceptance Gate:** No uncaught `getOwnLayer` error during style-less cleanup; fallback and restoration behavior covered by focused tests; typecheck/lint/build pass; authenticated API behavior is confirmed separately before claiming the 404 fixed.
- **Do Not Redo:** Do not alter backend endpoint contracts or switch frontend paths without authenticated runtime evidence. No Git operations were performed.

### HOFF-0020 — Frontend Developer → Code Reviewer

- **Timestamp:** 2026-11-06T15:04:25+07:00
- **From Role:** Frontend Developer
- **To Role:** Code Reviewer
- **Phase:** 8 — Frontend Development
- **Status:** DONE
- **Objective:** Reduce avoidable Mapbox WebGL context churn caused by React StrictMode effect replay and clarify the repeated Firefox console warnings.
- **Inputs Read:** Current frontend AGENTS.md and plan.md map rules; MapShell and lifecycle tests; React StrictMode root; installed Mapbox GL JS 3.33.0 source; all MapShell call sites.
- **Completed:** MapShell now retains a per-container Map instance across the synchronous StrictMode cleanup/setup replay and defers disposal by one microtask. A replay cancels disposal; a real component unmount still calls `map.remove()`. Updated the lifecycle test to assert one Map constructor call and real unmount cleanup. Confirmed Mapbox's installed `Map.remove()` calls `WEBGL_lose_context.loseContext()`, explaining context-loss messages during intentional teardown. Firefox renderer/upload deprecation messages originate in the Mapbox bundle and are not application logs.
- **Requirement IDs:** TMS-MAP-WEBGL-ROBUSTNESS-2026-11-06; StrictMode lifecycle and Firefox WebGL warning diagnosis.
- **Files and Artifacts:** `src/components/map/MapShell.tsx`; `src/components/map/MapShell.test.tsx`; `.ai-workflow/PROJECT_MEMORY.md`.
- **Decisions:** Avoid console interception and dependency/package changes. Keep real Mapbox teardown on actual unmount and retain context-loss fallback/recovery. GitNexus impact returned `UNKNOWN` due database/runtime version mismatch (42/40); source search confirmed MapShell is used by dispatch and live tracking, with approvals rendered through DispatchPage.
- **Assumptions:** Remaining `webglcontextlost` browser messages can still occur on real component unmount or genuine GPU/driver loss; the fix specifically removes the duplicate context teardown from StrictMode's development replay.
- **Verification:** `npx vitest run src/components/map/MapShell.test.tsx src/components/map/VehicleLayer.test.tsx src/components/map/DispatchMapLayers.test.tsx` exit 0, 3 files / 11 tests passed. `npm run build` exit 0 (existing >500 kB Mapbox chunk warning). `npm run lint` exit 0. Full Vitest suite and live Firefox browser retest were not run.
- **Open Issues and Risks:** Firefox's `WEBGL_debug_renderer_info` and non-DOM upload deprecations remain in Mapbox GL JS 3.33.0; browser-generated context-loss messages remain expected when a map is actually removed or the GPU drops it. Authenticated dispatch-board 404 and live browser recovery remain unresolved from HOFF-0019.
- **Blockers:** Browser/GPU-specific behavior cannot be confirmed in this session's mocked map tests; authenticated backend runtime checks remain unavailable.
- **Next Required Action:** Reload the affected screen with the updated frontend and confirm that development startup no longer produces a StrictMode duplicate-map context loss; distinguish remaining teardown/GPU events from loss of the active map.
- **Acceptance Gate:** One map instance survives StrictMode effect replay; real unmount removes it; focused tests, build and lint pass; no application-level attempt to hide Firefox/Mapbox warnings.
- **Do Not Redo:** Do not suppress browser console warnings, skip `map.remove()`, or modify package/dependency/API contracts without separate approval. No Git operations were performed.

## 10. Final Readiness

Product gate statuses/evidence below are retained from the historical Oct6 checkpoint; documentation-only work on Oct7 does not rerun or certify them.

Scoped map UI status on 2026-11-06: READY_FOR_REVIEW. The focused map tests and required typecheck/lint/build passed; live-token/browser validation and optional GLB rendering remain unverified.

| Check | Status | Evidence / Exception |
|---|---|---|
| Requirements implemented and traced | `BLOCKED` | Scoped alignment DONE; remaining acceptance depends on current blocker matrix |
| Build successful | `PASS` | typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; E2E NOT RUN BE-021 |
| Tests successful | `PASS` | typecheck PASS; lint PASS; full 115 files / 633 tests PASS; build PASS; git diff --check PASS; E2E NOT RUN BE-021 |
| API working | `BLOCKED` | Confirmed slices verified; identity/upload/collection/compatibility gaps remain |
| Frontend working | `BLOCKED` | Unit/component checks PASS for confirmed slices; full remaining-plan acceptance blocked |
| Database migrations working | `NOT_APPLICABLE` | No database/migration work authorized or performed |
| Authentication and authorization working | `BLOCKED` | Shared boundary preserved; BE-021 identity/E2E and BE-030 server messaging authorization unresolved |
| Validation and error handling working | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| Security reviewed | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| Performance reviewed | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| No hardcoded secrets | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| Deployment and rollback working | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| Observability ready | `NOT_STARTED` | `Pending verification; see frontend progress tracker` |
| Documentation complete | `PASS` | DOC-ALIGN-PROMPT-001 prompt delivered and HOFF-0016 recorded; historical implementation checkpoints preserved |
| No unresolved release-blocking defects | `BLOCKED` | Current first blocker matrix remains unresolved; no production readiness claim |

**Production Verdict:** `NOT READY`

**Residual Risks / Approved Exceptions:** Missing contracts/authorization and E2E remain unresolved; user approved frontend-only scope, no task deferrals. See docs/frontend-backend-unblock.md.

### HOFF-0021 — Frontend Developer → Code Reviewer

- **Timestamp:** 2026-11-06T18:44:16+07:00
- **Phase:** 8 — Frontend Development
- **Objective:** Redesign the dashboard the user actually opens at `/tms` and make it visible on localhost:5173.
- **Completed:** Corrected the route mismatch from the prior `/operations` pass. Added dashboard overview and work-queue components; reflowed TMS dashboard sections around existing API-backed counts, risk/approval queues, fleet map, priority load and timeline. Added responsive 1440/390 fixture screenshots and progress/plan notes.
- **Files:** `src/components/tms-flow/TmsDashboardContent.tsx`, `TmsDashboardOverview.tsx`, `TmsDashboardWorkQueue.tsx`, `src/styles/tms-flow.scss`, locale vi/en, `plan.md`, `docs/UI_UX_IMPLEMENTATION_PROGRESS.md`, screenshots under `docs/design/tms-dashboard-refresh/`.
- **Branch:** `codex/tms-dashboard-refresh-2026-11-06`, created in the working directory serving port 5173. Existing uncommitted work was preserved. No commit or deploy.
- **Verification:** `npm run typecheck`, `npm run lint`, `git diff --check` pass. Browser fixture shows `/tms`, two queue rows, and no horizontal overflow at 1440/390px. Map token/live backend not available in the fixture; map fallback remains visible and truthful. Tests/build not run in this turn.
- **Risk note:** GitNexus MCP remained incompatible with stored database version 42 vs runtime 40. CLI reindex completed; source search confirmed `OperationsDashboardPage` imports the dashboard component and AppRouter mounts it at `/tms`. No hooks, APIs, permissions or mutation flows changed.
- **Next:** User can reload `http://localhost:5173/tms` to see the current branch; authenticated-data/Mapbox UAT remains `NEEDS-LIVE`.
