# LogisticsX UI/UX Implementation Progress

**Cập nhật:** 20/10/2026
**Plan:** [plan.md](../plan.md)
**Branch / HEAD lúc bắt đầu gói A:** `feat/complete-ux-review-tasks-20261020` / `da5c600`
**Working tree lúc bắt đầu gói A:** đã có ảnh test từ Phase 0 trong `docs/design/**` và `docs/ux/baseline/`; được giữ nguyên. Không commit/push.

Plan có **76 ticket**; UX-01..UX-08 chỉ là nhãn traceability. Sau gói A: **DONE 7, UI_SAFE_DONE 46, INTEGRATION_DONE 0, IN_REVIEW 12, BLOCKED 11, BACKLOG 0**. Có 23 ticket chưa nghiệm thu cuối (12 IN_REVIEW và 11 BLOCKED). Các UI_SAFE_DONE chỉ xác nhận phần frontend an toàn; không có tuyên bố backend-live.

## Kết quả kiểm thử và review

Các lệnh được chạy tuần tự, không chạy đồng thời. Full suite chạy sau đợt code chính; sau khi sửa lỗi và bổ sung Operations i18n, chỉ chạy lint/test mục tiêu cho phần bị ảnh hưởng. Không chạy lại full suite.

| Kiểm tra | Trạng thái | Bằng chứng |
|---|---|---|
| npm run lint — toàn dự án | **FAIL**, sau đó sửa lỗi; full rerun **NOT RUN** | Lượt đầu exit 1 do no-useless-escape tại DocumentDropboxView.tsx:199. Regex đã sửa. ESLint targeted trên các file thay đổi đã exit 0; targeted ESLint cho ConfirmActionModal.tsx và test của nó được chạy ở lượt chốt. Không khẳng định full lint xanh. |
| npm run typecheck | **PASS — exit 0**, chạy trước refactor cuối của ConfirmActionModal và Operations i18n | Kết quả có trước các thay đổi cuối; không rerun typecheck toàn dự án sau đó. |
| npm run build | **PASS — exit 0**, chạy trước refactor cuối của ConfirmActionModal và Operations i18n | Vite build hoàn tất; có cảnh báo bundle chunk trên 500 kB. Không rerun build toàn dự án sau đó. |
| npm test -- --maxWorkers=1 --minWorkers=1 — full Vitest | **FAIL — exit 1** | 6 file lỗi, 9 test lỗi, 1,296/1,305 test pass và 2 unhandled errors. Nguyên nhân gồm expectation cũ và rejection từ modal khi API trả conflict. Đã cập nhật expectation và chuyển confirmation modal sang controlled state. |
| Targeted Vitest sau sửa lỗi | **PASS — exit 0** | 3 file, 15 test pass: ConfirmActionModal, OptimizationRunShow, FleetCharts. Trước đó các assertion AI/Document liên quan cũng pass trong targeted run; process run đó chỉ còn lỗi unhandled Optimization được sửa sau. Full Vitest không rerun. |
| Targeted Vitest — Operations localization | **PASS — exit 0** | 3 file, 15 test pass: DashboardResponsive (12), locale key contract (2), KpiStrip (1); xác nhận locale vi/en/ja keys và Japanese KPI/search UI. |
| Playwright fixtures — 1 worker | **PASS — exit 0** | 7 test pass trên dashboard panels, Load detail, Priority Shipment và sidebar. Viewport fixtures bao gồm 320, 390, 768, 1024, 1440px. Ảnh được lưu ngoài repository tại /tmp/logisticsx-ui-ux-evidence. Không có authenticated backend session; không phải live UAT. |
| npx eslint src/components/ConfirmActionModal.tsx src/components/ConfirmActionModal.test.tsx | **PASS — exit 0** | Targeted lint cho modal refactor cuối và test đi kèm. |
| npx eslint — Operations localization files | **PASS — exit 0** | 8 file source/locale/test đã chỉnh trong nhóm này. |
| git diff --check | **PASS — exit 0** | Kiểm tra whitespace sau khi cập nhật source, plan và báo cáo. |

Full Vitest và full lint đã từng trả lỗi nên các kết quả tổng thể không được ghi PASS. Typecheck/build thành công trước lần sửa cuối modal và Operations i18n; chúng chưa xác nhận snapshot source cuối. Playwright chỉ dùng fixture; không chạy các luồng AI Dispatch/Optimization trên trình duyệt vì chưa có spec phù hợp/authenticated session.

## Trạng thái theo milestone

| Milestone / Task ID | Trạng thái | Thực hiện / evidence | Blocker / tiếp theo |
|---|---|---|---|
| M0 BASE-001..003, BASE-007 | DONE | Baseline, routes, scripts, data modes và UX inventory; branch main, HEAD bbc0394, cây sạch lúc bắt đầu. | Không còn việc frontend trong scope này. |
| M0 BASE-004..005 | BLOCKED | Không có video tham khảo và authenticated backend session. | Cần video/session từ môi trường được cấp. |
| M0 BASE-006 | UI_SAFE_DONE | Ma trận route/capability/role/tenant/mode tại `docs/ux/route-capability-matrix.md`; ON/OFF được đối chiếu theo route registry thực. | Role, membership và tenant isolation thật vẫn `NEEDS-LIVE`. |
| M1 NAV-001..006, NAV-009..011 | UI_SAFE_DONE | Gating/route safety, Trip ID navigation, notification scope và AI Dispatch deep link/error/retry; test assertion liên quan pass. | Không xác nhận backend-live. |
| M1 NAV-007..008 | DONE | Search shortcut và Load header/back có bằng chứng nghiệm thu trước đó. | Không có blocker đã biết. |
| M1 CORE-001 | BLOCKED | Giữ CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false. | Cần versioned-write contract và runtime verification. |
| M2 DS-001 | DONE | Token audit được ghi trong sprint0-triage; giữ brand primary hiện tại. | — |
| M2 DS-002 | BLOCKED | Không thay brand primary. | Cần Product Owner chốt màu thương hiệu. |
| M2 DS-003 | IN_REVIEW | Semantic tokens, focus-visible và reduced-motion styles được bổ sung. | Cần audit focus/keyboard và rollout trên các component còn lại. |
| M2 DS-004..005 | IN_REVIEW | Shared async state và dashboard card được source-reviewed. | Live/preview dùng data model khác; cần mapping/data contract trước khi gộp. |
| M2 DS-006, I18N-001 | IN_REVIEW | Bổ sung locale keys en/vi/ja cho AI/Load và Operations dashboard header/KPI; responsive test kiểm tra Japanese labels. | Operations Brief, map, timeline và Priority Shipment còn chuỗi trình bày riêng; chưa đạt i18n toàn scope. |
| M2 SHELL-001 | IN_REVIEW | Sidebar fixture responsive được kiểm tra. | Cần keyboard và role/tenant UAT đầy đủ. |
| M3 OPS-001..006 | UI_SAFE_DONE | KPI thiếu dữ liệu hiển thị unavailable; live/preview và brief/map/timeline giữ rõ data truth. | Dashboard live data contract còn thiếu. |
| M3 OPS-007 | IN_REVIEW | Playwright fixture chạy tại năm viewport; bộ fixture chạy 7/7 test. | Keyboard/live mobile UAT chưa thực hiện. |
| M3 OPS-008 | BLOCKED | Không tạo API hoặc dữ liệu giả. | Cần contract freshness/source cho brief, telemetry, vehicles, routes và drivers. |
| M4 LOAD-001..003, LOAD-005 | UI_SAFE_DONE | Load form/list/header/GAP source-reviewed; retry/error states được bổ sung; core edit vẫn bị gate. | Không xác nhận write API live. |
| M4 LOAD-004 | UI_SAFE_DONE | `ShipmentDetailRedesign.test.tsx` pass 5/5 sau khi test harness nạp locale thật và assertions theo bản dịch hiện tại. | Source/fixture evidence; chưa UAT backend live. |
| M4 TRIP-001..002 | UI_SAFE_DONE | Stop actions fail-closed theo permission, mutation refresh và error feedback; test Trip pass. | Cần backend runtime verification cho integration. |
| M4 AI-001..006 | UI_SAFE_DONE | Demo/live labeling, run request fields, URL deep link, initial load retry, server response/conflict behavior; không còn affordance chat vô hiệu. | Không có authenticated AI UAT. |
| M4 AI-007 | BLOCKED | Không đổi Axios transport/auth flow. | Cần regression auth/refresh/401/403 và xác nhận shared-client contract. |
| M4 OPT-001..002 | UI_SAFE_DONE | Form/evidence và conflict review giữ request/idempotency semantics; targeted modal/optimization tests pass 15/15. | Backend optimization session chưa live-verified. |
| M5 DOC-001..005 | UI_SAFE_DONE | Filter scope rõ; Blob download/error, pessimistic delete, drawer states; targeted assertions pass. | DOCUMENT_UPLOAD_CONTRACT_CONFIRMED vẫn false; upload chưa khả dụng. |
| M5 NOT-001 | UI_SAFE_DONE | UI công bố phạm vi 5 bản ghi, không gọi là unread total. | API unread-total/mark-read chưa có. |
| M5 NOT-002, FLT-002, FIN-002..003, EXEC-001 | BLOCKED | Không giả lập endpoint/workflow và giữ flags false. | Cần API contract hoặc quyết định scope/permission. |
| M5 FLT-001 | UI_SAFE_DONE | Không suy deadhead bằng phép bù; targeted Fleet tests pass. | Fleet Gantt history API vẫn thiếu. |
| M5 FIN-001 | UI_SAFE_DONE | Giữ permission và billing runtime gate; có regression test. | Billing command vẫn gated; không xác nhận integration. |
| M5 SET-001, PAY-001..002, PSL-001 | UI_SAFE_DONE | UI/source và tests giữ confirmation, UUID/idempotency, immutable snapshot semantics. | Test fixture/source evidence, chưa xác minh API live. |
| M6 QA-001 | UI_SAFE_DONE | Dashboard 3/3 và Load detail screenshot 1/1 pass; viewport assertion gồm 320/390/768/1024/1440. | BROWSER-FIXTURE; không phải live responsive UAT. |
| M6 QA-006 | IN_REVIEW | Dashboard 3/3 và Load detail fixture 1/1 pass sau khi sửa harness. | Chưa rerun auth/tenant, CRUD, AI approval, financial/payroll regressions với strict i18n; `bootstrap.spec.ts:46` known-failing vì thiếu OIDC thật. |
| M6 QA-002, QA-004..005 | IN_REVIEW | Recovery states, focus-visible và reduced-motion styles được cập nhật. | Keyboard/focus-management audit toàn flow còn thiếu. |
| M6 QA-003 | IN_REVIEW | Tertiary token đổi sang màu có contrast tính toán tốt hơn. | Chưa rà contrast từng state/component toàn app. |
| M6 QA-007 | UI_SAFE_DONE | Nguồn SOURCE, MOCK/STATIC, BROWSER-FIXTURE, NEEDS-LIVE được phân biệt trong báo cáo. | Live provenance cần authenticated environment. |
| M6 QA-008 | UI_SAFE_DONE | Vite dev server trả fallback health/me/collection/create/update đã được quan sát; phân loại tại `docs/ux/data-provenance-runtime.md`. | Các response mock không xác minh backend; live session vẫn `NEEDS-LIVE`. |

## Feature flags và nguồn dữ liệu

- CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false.
- DOCUMENT_UPLOAD_CONTRACT_CONFIRMED=false.
- BILLING_COMMANDS_RUNTIME_VERIFIED=false.
- PAYMENT_COMMANDS_RUNTIME_VERIFIED=false.
- Không thay API contract/schema, tenant isolation, permission hoặc business state machine.
- Screenshots Playwright là browser fixture; không dùng làm backend-live evidence.

## File thay đổi trong phiên

- Tài liệu: plan.md, docs/UI_UX_IMPLEMENTATION_PROGRESS.md.
- Playwright: e2e/dashboard-panels.spec.ts, e2e/loads-show-screenshot.spec.ts, e2e/priority-shipment-card.spec.ts.
- Shared UI/styles: src/components/ConfirmActionModal.tsx, src/components/ConfirmActionModal.test.tsx, src/components/ai/AiGapChatWidget.tsx, src/components/ai/LoadAiDispatchSection.tsx, src/components/ai/LoadAiGapsSection.tsx, src/styles/_variables.scss, src/styles/global.scss.
- AI Dispatch/dashboard: src/features/ai-dispatch/api/aiDispatch.api.ts, src/features/ai-dispatch/components/AiDispatchRunForm.tsx, src/features/ai-dispatch/components/AiMovementPlanCard.tsx, src/features/ai-dispatch/hooks/useAiDispatchActions.ts, src/features/ai-dispatch/types/ai-dispatch.types.ts, src/features/dashboard/components/OperationsDashboardView.tsx, src/features/dashboard/components/KpiStrip.tsx, src/features/dashboard/components/DashboardHeader.tsx, src/features/dashboard/components/KpiStrip.test.tsx, src/tests/pages/dashboard/DashboardResponsive.test.tsx, src/hooks/ai/useLoadAiDispatch.ts, src/pages/ai-dispatch/AiDispatchPage.tsx, src/tests/fixtures/aiMovementPlan.ts, src/tests/pages/ai-dispatch/AiDispatchPage.test.tsx.
- Documents: src/features/documents/api/documents.api.ts, src/features/documents/components/DocumentDropboxCard.tsx, src/features/documents/components/DocumentDropboxDrawer.tsx, src/features/documents/components/DocumentDropboxDropzone.tsx, src/features/documents/components/DocumentDropboxTable.tsx, src/features/documents/components/DocumentDropboxView.tsx, src/features/documents/components/DocumentDropboxView.scss, src/tests/features/documents/DocumentDropboxDrawer.test.tsx, src/tests/features/documents/DocumentDropboxDropzone.test.tsx, src/tests/features/documents/DocumentDropboxView.test.tsx, src/tests/features/documents/documents.api.test.ts.
- Fleet/Loads/Trips/Notifications/Optimization: src/features/fleet/components/FleetCharts.tsx, src/features/loads/components/redesign/RouteProgressBar.tsx, src/features/loads/components/redesign/ShipmentAgentCard.tsx, src/features/loads/components/redesign/ShipmentDocumentsCard.tsx, src/features/loads/components/redesign/ShipmentHeroCard.tsx, src/features/loads/components/redesign/ShipmentLoadPlanCard.tsx, src/features/loads/components/redesign/ShipmentTimelineCard.tsx, src/features/notifications/components/NotificationHeaderIcon.tsx, src/features/optimization/components/OptimizationCandidateTable.tsx, src/features/optimization/components/OptimizationError.tsx, src/features/optimization/components/OptimizationRunForm.tsx, src/features/trips/components/TripStopActions.tsx, src/features/trips/components/TripStopsTimeline.tsx, src/features/trips/hooks/useTripStopActions.ts, src/hooks/useDriverRanking.ts.
- Pages/locales/tests: src/locales/en.ts, src/locales/ja.ts, src/locales/vi.ts, src/pages/fleet/FleetReportPage.tsx, src/pages/loads/edit.tsx, src/pages/optimization/OptimizationPage.tsx, src/pages/payroll/PayrollEntryPage.tsx, src/tests/features/ai/LoadAiComponents.test.tsx, src/tests/features/fleet/FleetCharts.test.tsx, src/tests/features/trips/TripStopActions.test.tsx, src/tests/features/trips/useTripStopActions.test.tsx, src/tests/features/rates/RatingAcceptance.test.tsx, src/features/dashboard/components/KpiStrip.test.tsx, src/tests/pages/dashboard/DashboardResponsive.test.tsx.

## Công việc tiếp theo

1. Chạy lại full lint sau khi đã sửa no-useless-escape, khi có ngân sách tài nguyên phù hợp.
2. Chạy typecheck/build có mục tiêu hoặc toàn dự án cho snapshot sau refactor ConfirmActionModal; hiện chưa có kết quả sau sửa cuối.
3. Chạy lại full Vitest nếu cần release gate; targeted suite sau khi sửa đã pass.
4. Hoàn tất keyboard/focus/contrast UAT trên 320/390/768/1024/1440 với authenticated role/tenant.
5. Nhận contract/API hoặc quyết định Product Owner cho 11 task BLOCKED; nhận quyết định brand primary cho DS-002.
6. Hoàn thiện i18n cho Operations Brief/map/timeline/Priority Shipment; tiếp tục kiểm chứng live data trước khi xét các task IN_REVIEW.

## Gói A — 20/10/2026

### Shared i18n harness và baseline DS-003

- `src/locales/index.ts` là nơi duy nhất gom resource en/vi/ja và khởi tạo instance; trong Vitest hoặc khi fixture yêu cầu strict mode, missing key ném lỗi thay vì trả key thô.
- `src/tests/setup.ts` khởi tạo instance đó với locale vi và resource thật. `e2e/fixtures/dashboard-panels.tsx` dùng cùng initializer, `I18nextProvider` và strict missing-key mode.
- Test mới `src/tests/locales/i18nTestHarness.test.ts` xác nhận key thiếu ném lỗi. `ShipmentDetailRedesign.test.tsx` có ba expectation cũ không khớp locale hiện tại; đã cập nhật theo resource vi, không sửa component UI.
- `npx vitest run src/tests/features/loads/ShipmentDetailRedesign.test.tsx src/tests/locales/i18nTestHarness.test.ts --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 2 files / 6 tests pass.
- Sau harness fix, `SCREENSHOT_DIR=ds003-before-after-i18n npm run test:e2e -- e2e/dashboard-panels.spec.ts --workers=1 --reporter=line` — exit 0, 3/3 pass; `SCREENSHOT_DIR=ds003-before-after-i18n npm run test:e2e -- e2e/loads-show-screenshot.spec.ts --workers=1 --reporter=line` — exit 0, 1/1 pass.
- Ảnh “trước DS-003” mới, chủ ý tạo sau harness fix: `docs/design/ds003-before-after-i18n/{brief.png,map.png,timeline.png,dashboard-1440.png,dashboard-1024.png,dashboard-768.png,dashboard-390.png,dashboard-320.png,load-detail-1440.png,load-detail-1024.png,load-detail-768.png,load-detail-390.png,load-detail-320.png}`. Đây đều là `BROWSER-FIXTURE`, không phải live.
- Test ghi ảnh vào `docs/design/**`: `e2e/dashboard-panels.spec.ts`, `e2e/loads-show-screenshot.spec.ts`, `e2e/priority-shipment-card.spec.ts`, `e2e/sider-screenshot.spec.ts`. Test ghi ảnh vào `docs/ux/baseline/`: `e2e/capture-demo-baseline.spec.ts`. Gói A chỉ chạy hai spec đầu và ghi ảnh vào thư mục baseline mới ở `docs/design/`; không chạy test ghi vào `docs/ux/baseline/`.

### Thay đổi trạng thái theo evidence

| Task | Chuyển trạng thái | Acceptance/evidence | Giới hạn và rollback |
|---|---|---|---|
| `LOAD-004` | `UI_SAFE_DONE → IN_REVIEW → UI_SAFE_DONE` | Tiêu chí §3: “Không ngụ ý telemetry live khi thiếu; each panel có trạng thái hợp lệ.” Assertion ở `ShipmentDetailRedesign.test.tsx` liên quan `ShipmentLoadPlanCard` và `ShipmentAgentCard`, đúng scope LOAD-004. Sau harness thật và expectation locale được sửa, Vitest 5/5 pass. | Chỉ source/component test; chưa UAT backend. Rollback bằng cách hoàn nguyên test locale và harness trong diff gói A. |
| `QA-001` | `UI_SAFE_DONE → IN_REVIEW → UI_SAFE_DONE` | Tiêu chí §3: viewport 1440/1024/768/390/320 không tràn ngang. Dashboard Playwright 3/3 pass, gồm scrollWidth/layout ở đủ năm viewport; Load fixture screenshot 1/1 pass ở 320–1440. | `BROWSER-FIXTURE`; không phải live responsive UAT. Ảnh mới liệt kê ở trên là có chủ đích. |
| `QA-006` | `UI_SAFE_DONE → IN_REVIEW` | Dashboard 3/3 và Load fixture 1/1 pass sau harness fix. | Còn rerun auth/tenant, CRUD, AI approval, financial/payroll guard với strict shared harness; giữ `IN_REVIEW`. `bootstrap.spec.ts:46` known-failing do không có OIDC thật, không sửa. Fleet/sidebar timeout khi chạy song song là flaky đã biết. |
| `BASE-006` | `IN_REVIEW → UI_SAFE_DONE` | Tiêu chí §3: có một ma trận `route + role + tenant + capability + mode`; mâu thuẫn ON/OFF được phân xử theo route registry đang mount; không bật route bị khóa. Hoàn tất tại [`route-capability-matrix.md`](ux/route-capability-matrix.md), có file:dòng cho `App.tsx`, `AppRouter`, resource registry, capability và role matrix. | Role, JWT, tenant membership và data isolation thật đều `NEEDS-LIVE`. Rollback bằng cách revert file ma trận trong diff gói A. |
| `QA-008` | `IN_REVIEW → UI_SAFE_DONE` | Tiêu chí §3: report phân biệt backend/fixture/demo; mutation fallback không là bằng chứng business. Dev server chạy với target `127.0.0.1:18081` (đã xác nhận connection refused), sau đó 5 request qua Vite trả đúng mock health/me/GET/POST/PUT; log Vite ghi fallback. Kết quả ghi tại [`data-provenance-runtime.md`](ux/data-provenance-runtime.md). | Các response `MOCK/STATIC`; backend thật `NEEDS-LIVE`. Không dùng ID giả hoặc status 200/201 để xác nhận CRUD. Rollback bằng cách revert report trong diff gói A. |

### Kết quả kiểm tra gói A

- `npm run lint` — exit 0.
- `npm run typecheck` — exit 0.
- `git diff --check` — exit 0.
- Full Vitest và full Playwright chưa chạy trong gói A; để gói D. `bootstrap.spec.ts:46` vẫn known-failing vì thiếu OIDC thật; không sửa. Parallel Fleet/sidebar timeout vẫn là flaky đã biết.
- File gói A đã sửa/thêm: `src/locales/index.ts`, `src/tests/setup.ts`, `src/tests/features/loads/ShipmentDetailRedesign.test.tsx`, `src/tests/locales/i18nTestHarness.test.ts`, `e2e/fixtures/dashboard-panels.tsx`, `docs/ux/route-capability-matrix.md`, `docs/ux/data-provenance-runtime.md`, `plan.md`, `docs/UI_UX_IMPLEMENTATION_PROGRESS.md`. `vite.config.ts` và route/capability source không đổi.
- Các ảnh mới duy nhất do gói A tạo là 13 baseline files trong `docs/design/ds003-before-after-i18n/`, liệt kê ở trên theo chủ đích. Ảnh đã có trước trong `docs/design/dashboard-panels/`, `docs/design/after/`, `docs/design/sider-before-2/` và `docs/ux/baseline/` không bị ghi đè trong gói A.

## Nhóm 1 — DS-003..005 — 20/10/2026

### DS-003 — `IN_REVIEW → IN_REVIEW`

- Acceptance §3.3: “Heading/body/metadata consistent”; semantic typography/spacing/radius/shadow/selected/focus values now use existing tokens in the scoped dashboard/load/layout files. “Không làm giảm contrast”: no primary token changed; sampled pairs are no worse. The comprehensive hard-coded color inventory remains QA-003 work, so DS-003 stays `IN_REVIEW` until that audit is complete.
- Before contrast was recorded in `docs/ux/contrast-baseline.json`: 10/15 representative text pairs passed 4.5:1; failures were KPI label 3.40, KPI context 3.14, timeline caption 3.54, map caption 3.33, load metadata 2.56. After: `node scripts/audit-ux-contrast.mjs --after` — exit 0, 15/15 representative pairs pass; changed pairs are 4.76 or 4.55 and `noWorse=true`.
- Screenshot evidence: `SCREENSHOT_DIR=ds003-after npx playwright test e2e/capture-demo-baseline.spec.ts e2e/dashboard-panels.spec.ts e2e/loads-show-screenshot.spec.ts e2e/priority-shipment-card.spec.ts e2e/sider-screenshot.spec.ts --workers=1 --reporter=line` — exit 0, 8/8 tests. `npx playwright test e2e/dashboard-keyboard.spec.ts --workers=1 --reporter=line` — exit 0, 4/4; keyboard focus-visible outline measured at 2px. Screens are `BROWSER-FIXTURE`.
- Main files: scoped SCSS/inline styles in `src/components/**`, `src/features/dashboard/**`, `src/features/loads/components/redesign/**`, `src/styles/global.scss`; `scripts/audit-ux-contrast.mjs`; `docs/ux/contrast-baseline.json`, `docs/ux/contrast-after-ds003.json`; screenshots under `docs/design/ds003-after/` and refreshed `docs/ux/baseline/`.
- Rollback: revert this task’s style/token export edits and generated DS-003 after images/report; keep the harness and screenshot guards from Package A.

### DS-004 — `IN_REVIEW → DONE`

- Acceptance §3.3: “Không tạo bộ component song song không cần thiết” — PASS; existing Ant Design Button/Form/Modal and app `StatusTag`, `OpsCard`, `AsyncStateView` remain in use. “Có state matrix default/loading/error/disabled/focus” — PASS in `docs/ux/component-state-matrix.md`, all 6 × 5 cells are documented and N/A cells have reasons.
- Tests: `npx vitest run src/features/dashboard/priorityShipmentAdapters.test.ts src/features/dashboard/components/PriorityShipmentCard.test.tsx src/components/dashboard/PriorityShipmentCard.test.tsx src/hooks/dashboard/usePriorityShipments.test.ts src/hooks/dashboard/usePriorityShipments.integration.test.tsx src/components/AsyncState.test.tsx src/components/StatusTag.test.tsx src/tests/components/ControlStates.test.tsx src/components/ConfirmActionModal.test.tsx` — exit 0, 9 files / 33 tests pass. `npm run build` — exit 0. `npm run lint` — exit 0, 0 errors / 4 existing hook-dependency warnings.
- Main files: `docs/ux/component-state-matrix.md`; `src/components/AsyncState.test.tsx`, `src/components/StatusTag.test.tsx`, `src/tests/components/ControlStates.test.tsx`, `src/components/ConfirmActionModal.test.tsx`.
- Rollback: revert the matrix and component-state test changes for DS-004.

### DS-005 — `IN_REVIEW → UI_SAFE_DONE`

- Acceptance §3.3: “Cùng presentation contract cho demo/live khi có dữ liệu” — PASS via `PriorityShipmentViewModel`, `adaptPreviewShipment`, and `adaptLiveLoadToPriorityShipment`. “Không tự sinh shipment giả ở live” — PASS in hook/component tests; missing live dataset is `isUnavailable`, and the live adapter maps only fields present on the Load contract. `LD-84920`/preview-origin text is asserted absent on the live card path.
- Tests: same targeted command as DS-004 — exit 0, 9 files / 33 tests pass, including real Refine data-provider adapter test. No backend session was available; real live dataset and permissions are `NEEDS-LIVE`, so status is `UI_SAFE_DONE`.
- Main files: `src/types/dashboard/priority-shipment.types.ts`, `src/features/dashboard/priorityShipmentAdapters.ts` and test, `src/hooks/dashboard/usePriorityShipments.ts` and tests, `src/components/dashboard/DashboardPriorityShipment.tsx`, both existing card components/tests.
- Rollback: revert the view-model/adapters/hook/card changes and related tests; no route, flag, or API contract changed.

### Group 1 verification notes

- `git diff -- plan.md` was inspected after status changes; intended rows are BASE-006, QA-008, DS-003..005, LOAD-004, QA-001/006 and the §16 count. The preexisting Package A plan updates are retained.
- Count command parsed each ticket/range from §16: `DONE 8; UI_SAFE_DONE 47; IN_REVIEW 10; BLOCKED 11; BACKLOG 0; INTEGRATION_DONE 0`, total 76.
- `docs/design/**` screenshot writers: `e2e/dashboard-panels.spec.ts`, `e2e/loads-show-screenshot.spec.ts`, `e2e/priority-shipment-card.spec.ts`, `e2e/sider-screenshot.spec.ts`; `e2e/capture-demo-baseline.spec.ts` writes `docs/ux/baseline/**`. All five were intentionally rerun after strict i18n and DS token changes; each checks for visible raw translation keys before capture. Refreshed tracked screenshots are intentional, including the 21 Phase 0 images that could contain raw keys.

### DS-006 — 20/10/2026

- Trạng thái: `IN_REVIEW → DONE`. Acceptance: copy giao diện trong Operations Brief/map/timeline/Priority Shipment và các vùng Load/AI được chuyển sang key i18next; kiểm kê các literal UI copy còn 0. Chuỗi `event.note`, status enum, tên/địa danh/số liệu sample là dữ liệu; URL/UUID là placeholder kỹ thuật. Attribution bản đồ và lý do dismiss outbound cũng nằm trong locale catalog.
- Bằng chứng: `npx vitest run ...` — exit 0, 8 file/49 test; `npm run build` exit 0; `npm run lint` exit 0 (0 lỗi/4 warning có sẵn). Audit: `docs/ux/i18n-operations-load-ai-audit.md`.
- File chính: `src/locales/{en,vi,ja}.ts`, dashboard panels, Load redesign, AI Dispatch components, audit/test locale. Rollback: hoàn nguyên task locale/components/test/audit; không đổi API contract, route hay flag.

### I18N-001 — 20/10/2026

- Trạng thái: `IN_REVIEW → DONE`. Acceptance: locale key parity en/vi/ja được kiểm tra cho key mới; chuyển locale ở Operations panels, Load header và AI Dispatch run form hiển thị copy tương ứng và không còn nhãn của hai locale kia.
- Bằng chứng: `npx vitest run ...` — exit 0, 8 file/49 test; các test `operationsPanelLocales`, `loadLocaleSwitching`, `aiDispatchLocaleSwitching`, `localeKeys` đều nằm trong run. `npm run build` và `npm run lint` exit 0.
- File chính: ba locale catalogs, `localeKeys.test.ts`, ba test đổi locale. Rollback: hoàn nguyên test/copy locale thuộc task; không ảnh hưởng dữ liệu API.

### SHELL-001 — 20/10/2026

- Trạng thái: `IN_REVIEW → UI_SAFE_DONE`. Acceptance: các menu item chỉ hiện khi role matrix cho phép; route nav được đối chiếu với AppRouter/resource registry; focus/active labels đã có source assertion; rail điều hướng bàn phím bằng ArrowDown.
- Bằng chứng: `npx vitest run ...` exit 0, 8 file/49 test, trong đó AppSider 21 test kiểm tra đủ 9 JWT role; `npx playwright test e2e/sider-role.spec.ts ...` exit 0, 10/10 test trong gói dashboard/rail/reduced-motion. Ảnh BROWSER-FIXTURE: `docs/design/shell-001/admin-1440.png`, `driver-1440.png`.
- Giới hạn: role token thật và tenant membership `NEEDS-LIVE`. Rollback: hoàn nguyên unit/e2e role tests, fixture mới, ảnh SHELL-001 và dòng trạng thái này.

### OPS-007 — 20/10/2026

- Trạng thái: `IN_REVIEW → UI_SAFE_DONE`. Acceptance: keyboard trigger search qua click/Enter/Space/shortcut; KPI focus semantics; CTA map/timeline; Operations Brief; đổi mode Mẫu/Thật — Playwright đã kiểm tra. Responsive không tràn ngang ở 320/390/768/1024/1440.
- Bằng chứng: `npx playwright test e2e/sider-role.spec.ts e2e/dashboard-keyboard.spec.ts e2e/dashboard-panels.spec.ts e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 10/10 test. Ảnh dashboard-panels là `BROWSER-FIXTURE`.
- Chưa kiểm chứng: tiêu chí “theo video” do không có video tham chiếu (BASE-004); live data, role/tenant và responsive UAT thật `NEEDS-LIVE`.
- File chính: Operations/dashboard panels, `e2e/dashboard-keyboard.spec.ts`, screenshots `docs/design/dashboard-panels/`, `plan.md`. Rollback: hoàn nguyên thay đổi UI/test/ảnh gói 2 và dòng trạng thái này.

### QA-002 — 20/10/2026

- Trạng thái: `IN_REVIEW → IN_REVIEW`. Acceptance §3.8: “Tab/Enter/Space/Escape được hỗ trợ theo component, modal restore focus; không chỉ dựa màu.” Operations search/brief, map, mode và timeline đã có browser keyboard test; sidebar rail có role test và ArrowDown.
- Bằng chứng: `npx playwright test e2e/sider-role.spec.ts e2e/dashboard-keyboard.spec.ts e2e/dashboard-panels.spec.ts e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 10/10 trong run gói 2. Component tests cho Load, AI, Optimization, Documents và Notifications có thao tác pointer/source handlers.
- Chưa đạt: chưa có keyboard sequence + focus restoration browser test cho Load list/detail, AI run/approve, Optimization confirm/drawer, Documents drawer, Notification popover; liệt kê tại `docs/ux/keyboard-focus-audit.md`. Live auth/tenant `NEEDS-LIVE`.
- File đã sửa: `docs/ux/keyboard-focus-audit.md`, `plan.md`, progress. Rollback: revert audit doc và dòng `QA-002`/count nếu trạng thái được đổi.

### QA-003 — 20/10/2026

- Trạng thái: `IN_REVIEW → IN_REVIEW`. Acceptance §3.8: cặp chữ thường đạt ≥4.5:1, non-text ≥3:1; không có caption khó đọc. `node scripts/audit-ux-contrast-scope.mjs` — exit 0; quét 99 file trong `src/styles`, `src/components`, `src/features/dashboard`, `src/features/loads/components/redesign`; 70 cặp foreground/background cùng rule đạt ngưỡng, 0 fail.
- Đã sửa bằng semantic token có sẵn các cặp trực tiếp gồm map marker, Priority warning/avatar, timeline text/error badge, Operations Brief, dashboard search và trạng thái positive/neutral. Không sửa token hay màu primary. `node scripts/audit-ux-contrast.mjs --after` — exit 0, 15/15 cặp sample đạt và `noWorse=true`.
- Test: `npx vitest run src/tests/accessibility/contrastAudit.test.ts src/tests/features/documents/DocumentDropboxView.test.tsx src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx src/tests/pages/optimization/OptimizationRunShow.test.tsx src/tests/pages/loads/LoadShow.test.tsx --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 5 files/26 tests.
- Chưa đạt: audit ghi 304 khai báo màu chưa có cặp nền xác định (inherited/inline/non-text boundary); report `docs/ux/contrast-audit-qa003.json` giữ nguyên danh sách này. Vì vậy QA-003 và phụ thuộc DS-003 không thể lên DONE.
- File đã sửa: `scripts/audit-ux-contrast-scope.mjs`, `src/tests/accessibility/contrastAudit.test.ts`, các SCSS Operations/dashboard/load, `docs/ux/contrast-audit-qa003.json`, `plan.md`. Rollback: revert các thay đổi màu trong các SCSS đã nêu cùng script/test/report và dòng QA-003; không rollback token primary vì token đó không bị đổi.

### QA-004 — 20/10/2026

- Trạng thái: `IN_REVIEW → IN_REVIEW`. Acceptance §3.8: mỗi route ưu tiên có loading/empty/error/permission/disabled matrix và lỗi API có recover; 403 không được hiển thị như empty. Ma trận có đủ Operations, Loads list/show, AI Dispatch, Optimization, Documents, Notifications và Fleet tại `docs/ux/route-state-matrix.md`.
- Đã thêm API 403-vs-empty assertion cho Operations, Loads list/detail, AI Dispatch, Optimization, Documents và Notifications; Fleet suite đã có test tương ứng. Operations KPI lỗi có Retry và test xác nhận gọi `refetchAll`. Route detail Load ghi rõ empty collection là N/A vì cần một bản ghi; hiện còn thiếu direct pending/404 page assertions. Loads list/browser route và một số disabled state vẫn cần test cấp route.
- Bằng chứng: `npx vitest run src/tests/components/ResourceListPage.test.tsx src/tests/pages/loads/LoadShow.test.tsx src/tests/pages/dashboard/DashboardResponsive.test.tsx src/tests/pages/ai-dispatch/AiDispatchPage.test.tsx src/tests/features/documents/DocumentDropboxView.test.tsx src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx src/tests/pages/optimization/OptimizationRunShow.test.tsx src/tests/accessibility/contrastAudit.test.ts --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 8 files/61 tests. Sau bổ sung Retry Operations: `npx vitest run src/tests/pages/dashboard/DashboardResponsive.test.tsx src/tests/accessibility/contrastAudit.test.ts --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 2 files/14 tests. `npm run typecheck` và `npm run lint` exit 0; lint 0 errors, 4 existing warnings.
- File đã sửa: `src/features/dashboard/components/KpiStrip.tsx`, `KpiStrip.scss`, `OperationsDashboardView.tsx`, `src/features/dashboard/types/primitives.types.ts`, `src/tests/pages/dashboard/DashboardResponsive.test.tsx`, `docs/ux/route-state-matrix.md`, `plan.md`. Rollback: revert retry control/test/matrix changes và QA-004 row; giữ nguyên 403/error guards đã có trước đó.
- Còn thiếu: direct pending/404 assertion tại Loads detail, browser route test cho Loads list và một số permission/disabled state assertions. Không có authenticated backend session; role/tenant thật `NEEDS-LIVE`.

### QA-005 — 20/10/2026

- Trạng thái: `IN_REVIEW → DONE`. Acceptance §3.8: source hỗ trợ `prefers-reduced-motion`, không thêm motion library/zoom/rotate; audit ghi 69 match trên 28 file (gồm CSS, inline styles, test/type matches) và universal media rule áp dụng cả cho inline style.
- Bằng chứng: `npx playwright test e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 2/2; test emulate `reduce`, kiểm tra dashboard interactions và sider rail. `npm run typecheck` và `npm run lint` exit 0; lint 0 errors/4 warnings. Audit `docs/ux/reduced-motion-audit.md`.
- File đã sửa: `e2e/reduced-motion.spec.ts`, `docs/ux/reduced-motion-audit.md`, `plan.md`, progress. Rollback: revert reduced-motion Playwright test and audit/status documentation; no runtime motion change was required.

### QA-006 — 20/10/2026

- Trạng thái: `IN_REVIEW → UI_SAFE_DONE` (trước đó đã hạ từ `UI_SAFE_DONE` trong gói A khi cần chạy lại regression với harness strict). Acceptance §3.8: regression auth/session/tenant, CRUD, AI approval, financial/payroll guard được chạy trong full suite; không có app regressions trong test evidence.
- Bằng chứng cuối: `npm run build` exit 0; `npm run lint` exit 0 (0 errors, 4 existing hook-dependency warnings); `npm run typecheck` exit 0; `npx vitest run` exit 0, 206 files/1352 tests; `npx playwright test --workers=1 --reporter=line` 25/26 pass. Failure duy nhất là `e2e/bootstrap.spec.ts:46`, known-failing do thiếu OIDC thật theo yêu cầu, không sửa. Sau khi shared i18n fixture được sửa, priority screenshot specs pass 2/2. Sider/Fleet route screenshot specs chạy riêng serial pass 3/3.
- Ảnh `BROWSER-FIXTURE` được ghi lại sau strict i18n; các screenshot specs có assertion raw-key guard trước khi chụp. Writer cho `docs/design/**`: `dashboard-panels.spec.ts`, `loads-show-screenshot.spec.ts`, `priority-shipment-card.spec.ts`, `sider-role.spec.ts`, `sider-screenshot.spec.ts`; writer cho `docs/ux/baseline/**`: `capture-demo-baseline.spec.ts`. Có **35 PNG tracked** được refresh có chủ đích ở `docs/design/**` và `docs/ux/baseline/**`; đây không phải live snapshots.
- File đã sửa/thêm trong task: `e2e/fixtures/priority-shipment-card.tsx`, `plan.md`, progress và ảnh do các Playwright screenshot writers nêu trên tạo. Rollback: revert strict i18n wrapper/fix và QA-006 plan/progress rows; khôi phục ảnh nếu muốn bỏ baseline refresh.
- Giới hạn: thiếu OIDC thật, nên bootstrap case và live auth/tenant UAT chưa xác minh. Theo ngoại lệ đã định, QA-006 là `UI_SAFE_DONE`; toàn bộ ảnh/test là fixture.

### DS-003 — 20/10/2026 (runtime contrast closeout)

- Trạng thái: `IN_REVIEW → DONE`.
- Acceptance §3.2: “Heading/body/metadata consistent”; “không làm giảm contrast hoặc làm vỡ layout.” Typography/token rollout đã có; runtime contrast được đo trước/sau bằng cùng scanner. Trên Operations và Load detail (các màn DS-003 đã sửa), không có cặp fail. Trong 405 nhóm selector chung với `da5c600`, 0 nhóm tệ hơn. `--color-primary` không đổi. Các 5 cặp primary-blue fail còn lại nằm ở Loads list, AI Dispatch, Optimization và Fleet, và được chuyển sang đề xuất cho QA-003.
- Bằng chứng: `RUNTIME_CONTRAST_REPORT=/tmp/contrast-head-final.json npx playwright test e2e/contrast-runtime.spec.ts --workers=1 --reporter=line` — exit 0, 1/1, 495 cặp đo; baseline worktree `da5c600` exit 0, 1/1, worktree đã gỡ. Screenshot rerun — exit 0, 9/9; `npm run build`, `npm run lint` (0 lỗi/4 warning), `npm run typecheck` exit 0. Report: `docs/ux/contrast-runtime-report.md`.
- File chính: `src/styles/_variables.scss`, `src/styles/global.scss`, `src/components/AppSider.scss`, dashboard/load SCSS trong phạm vi; `e2e/contrast-runtime.spec.ts`, `e2e/fixtures/contrast-runtime.*`, `docs/ux/contrast-runtime-report.md`. Ảnh `BROWSER-FIXTURE`: `docs/design/ds003-after/` ở 1440/768/390 (cả dashboard và Load detail); `docs/ux/baseline/operations-demo-{1440,768,390}.png` được refresh có chủ đích. Không ảnh nào là live.
- Giới hạn: QA-003 vẫn `IN_REVIEW` vì năm cặp primary-blue fail; DS-003 không đổi primary. Các trường hợp indeterminate được liệt kê selector và lý do trong report.
- Rollback: revert thay đổi token/SCSS thuộc DS-003, scanner/report, ảnh trong `docs/design/ds003-after/` và ảnh Operations baseline vừa refresh; giữ các assertion keyboard/state thuộc QA tasks riêng.

### QA-002 — 20/10/2026 (keyboard/focus closeout)

- Trạng thái: `IN_REVIEW → DONE`.
- Acceptance §3.8: “Tab/Enter/Space/Escape được hỗ trợ theo component, modal restore focus; không chỉ dựa màu.” Load Create modal, AI approve modal, Optimization confirmation/drawer, Documents drawer và finance submenu mở bằng keyboard, giữ focus trong modal/drawer khi Tab/Shift+Tab, đóng bằng Escape và khôi phục đúng trigger. AI run form submit bằng Enter; Load detail tab chạy bằng Enter. Notification popover mở bằng Space, đưa focus vào trong; Tab được phép đi ra ngoài vì popover không modal (`aria-modal` không có), Escape đóng và khôi phục focus. Load detail và AI run inline được ghi N/A cho modal trap/restore vì không render overlay.
- Bằng chứng: `npx playwright test e2e/keyboard-focus-overlays.spec.ts --workers=1 --reporter=line` — exit 0, 9/9; gộp keyboard, route-state, role và reduced-motion — exit 0, 19/19. `npx vitest run src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 5/5. `npm run build`, `npm run lint` (0 lỗi/4 warning), `npm run typecheck` exit 0.
- File chính: `e2e/keyboard-focus-overlays.spec.ts`, `e2e/fixtures/keyboard-focus.*`, `src/features/notifications/components/NotificationHeaderIcon.tsx`, `src/components/AppSider.tsx`/`.scss`, `src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx`, `docs/ux/keyboard-focus-audit.md`.
- Giới hạn: test dùng `BROWSER-FIXTURE`; quyền theo user/tenant thật và live backend `NEEDS-LIVE`, nhưng không thuộc acceptance về keyboard.
- Rollback: revert keyboard spec/fixture, handler focus cho Notification/AppSider, assertion unit test và audit/status QA-002; không rollback các role/state tests thuộc QA-004/SHELL.

### QA-003 — 20/10/2026 (runtime contrast audit)

- Trạng thái: `IN_REVIEW → IN_REVIEW`.
- Acceptance §3.8: “Text regular nhắm ≥4.5:1, non-text ≥3:1; không có caption khó đọc.” Spec đo runtime text, control boundary/icon và focus indicator trên Operations, Loads list, Load detail, AI Dispatch, Optimization, Documents, Fleet và sidebar. Trong 495 cặp đo được còn 5 text pairs dưới ngưỡng, đều do primary blue chưa được phép đổi: Loads Create 4.104:1, page number 4.104:1, AI selected tab 3.641:1, Optimization Run 4.104:1, Fleet All vehicles 4.104:1. Không thay `$color-primary`.
- Contrast chưa xấu đi: so `da5c600` có 405 selector groups chung, 0 nhóm có min ratio giảm; 27 selector mới và 5 selector cũ không còn. Có 12 indeterminate được ghi cụ thể: 4 gradient trên Load detail (các endpoint đạt 7.243–18.048:1 nhưng vẫn giữ indeterminate), 8 control/text disabled được miễn trừ theo semantics. Không còn nền unknown/ảnh/alpha chưa phân loại khác.
- Đã sửa các lỗi không phụ thuộc primary: token focus indicator không còn Ant blue nhạt; Fleet DatePicker boundary/icon và text/breadcrumb token đạt ngưỡng. Báo cáo `docs/ux/contrast-runtime-report.md` liệt kê toàn bộ selector fail và indeterminate.
- Bằng chứng: `RUNTIME_CONTRAST_REPORT=/tmp/contrast-head-final.json npx playwright test e2e/contrast-runtime.spec.ts --workers=1 --reporter=line` — exit 0, 1/1. HEAD 507 entries/495 measured/5 fail/12 indeterminate; baseline `da5c600` 505/463/161/42; 405 matched selector groups, 0 worse. `npm run build`, `npm run lint` (0 lỗi/4 warning), `npm run typecheck` exit 0.
- File chính: `e2e/contrast-runtime.spec.ts`, fixture contrast; `src/styles/_variables.scss`, `src/styles/global.scss`, `src/components/AppSider.scss`; `docs/ux/contrast-runtime-report.md`, plan/progress.
- Còn thiếu: duyệt/đổi màu brand primary hoặc lựa chọn accessible text token/role riêng cho năm cặp trên. Vì yêu cầu phiên cấm đổi primary, QA-003 giữ `IN_REVIEW`; không giả nhận nghiệm thu đầy đủ.
- Rollback: revert các token/style contrast bổ sung, scanner và report; giữ lại quyết định brand color cho Product Owner. Không rollback các route state/keyboard tests.

### QA-004 — 20/10/2026 (route-state closeout)

- Trạng thái: `IN_REVIEW → DONE`.
- Acceptance §3.8: mỗi route ưu tiên có state matrix loading/empty/error/permission/disabled; lỗi có đường recover; 403/API error không bị hiển thị như empty. `docs/ux/route-state-matrix.md` ghi đủ Operations, Loads list/detail, AI Dispatch, Optimization, Documents, Notifications và Fleet; mọi ô đều có test hoặc N/A kèm lý do.
- Đã thêm pending assertion cho 3 KPI Operations và AI initial load; Documents có pending skeleton + refresh disabled, lỗi API 500 có Retry rồi hiển thị dữ liệu; Loads browser fixture có list pending/empty/error/403/retry, Create bị ẩn với DRIVER, detail pending/404. Permission/disabled/error/empty của các route còn lại được chỉ rõ ở matrix và suite tương ứng.
- Bằng chứng: targeted Vitest 9 files/99 tests pass; full `npx vitest run --reporter=dot` exit 0, 206 files/1361 tests; `npx playwright test e2e/loads-route-states.spec.ts --workers=1 --reporter=line` exit 0, 5/5; `npm run build` exit 0; `npm run lint` exit 0 (0 errors/4 existing warnings); `npm run typecheck` exit 0.
- File chính: `docs/ux/route-state-matrix.md`, `e2e/loads-route-states.spec.ts`, `src/tests/pages/dashboard/DashboardResponsive.test.tsx`, `src/tests/pages/ai-dispatch/AiDispatchPage.test.tsx`, `src/tests/features/documents/DocumentDropboxView.test.tsx`, `src/tests/pages/loads/LoadShow.test.tsx`, `src/tests/components/ResourceListPage.test.tsx`, `src/components/ResourceListPage.tsx`, `src/features/ai-dispatch/components/AiMovementPlanCard.tsx`, `plan.md`.
- Giới hạn: browser/component evidence dùng fixture/mock; role/tenant thật và backend UAT là `NEEDS-LIVE`. Fleet 403 là permission state, cần cấp lại role/tenant thay vì mù quáng retry.
- Rollback: revert QA-004 route/test and permission/disabled fixes plus this matrix/status entry; do not change backend contracts or route definitions.

### QA-005 — 20/10/2026 (reduced-motion revalidation)

- Trạng thái: `DONE → DONE`.
- Acceptance: `prefers-reduced-motion` được tôn trọng; không có animation/transition end-event dependency; Modal, Drawer, Popover, Dropdown, Select, Tooltip mở và ẩn trong giới hạn 1 giây; spinner/skeleton tiếp tục thể hiện trạng thái tải.
- Bằng chứng: `npx playwright test e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 3/3. `rg -n 'animationend|transitionend' src --glob '*.{css,scss,tsx,ts}'` — 0 match. Full Playwright — exit 0, 41 pass/1 OIDC skip. Rule sử dụng duration 0.01ms, một iteration và `scroll-behavior:auto`; không có `animation:none`/`transition:none`.
- File chính: `src/styles/global.scss`, `src/components/AppSider.scss`, `src/table/BaseTable.scss`, `src/features/operations/styles/operations.scss`, `e2e/reduced-motion.spec.ts`, `e2e/fixtures/reduced-motion-overlays.*`, `docs/ux/reduced-motion-audit.md`.
- Giới hạn: browser evidence là `BROWSER-FIXTURE`; chưa xác nhận thiết bị/browser production cụ thể.
- Rollback: revert QA-005 reduced-motion CSS/test/audit only; no library or motion dependency was introduced.

### SHELL-001 — 20/10/2026 (role evidence refresh)

- Trạng thái: `UI_SAFE_DONE → UI_SAFE_DONE`.
- Acceptance: role matrix covers all `JWT_ROLES`; browser fixture loops each role and compares every menu item to `window.__roleMenuExpectation`. Screenshot is written once per distinct menu signature; 9 role variants are captured at `docs/design/shell-001/*-1440.png`.
- Bằng chứng: full `npx playwright test --workers=1 --reporter=line` — exit 0, suite includes role capture and ArrowDown rail test; `AppSider.test.tsx` runs role visibility/mounted-route checks for 9 roles. Each screenshot is guarded by `expectNoRawTranslationKeys` and labeled `BROWSER-FIXTURE`.
- Giới hạn: real identity/tenant authorization remains `NEEDS-LIVE`.
- Rollback: revert the role fixture/spec and the nine shell screenshots; retain underlying role matrix.

### QA-006 — 20/10/2026 (full serial closeout)

- Trạng thái: `UI_SAFE_DONE → UI_SAFE_DONE`.
- Acceptance: `npm run build` exit 0; `npm run lint` exit 0 (0 errors/4 existing warnings); `npm run typecheck` exit 0; `npx vitest run --reporter=dot` exit 0, 206 files/1361 tests; `npx playwright test --workers=1 --reporter=line` exit 0, 41 pass/1 skipped.
- Skip detail: only `e2e/bootstrap.spec.ts:46` is skipped when `E2E_REAL_OIDC` is absent; assertion body remains unchanged. With a real OIDC environment, rerun using `E2E_REAL_OIDC=1 npx playwright test e2e/bootstrap.spec.ts --workers=1`.
- Flaky note: Fleet/sidebar timeout was previously observed only under parallel workers; the full serial suite passes, including Fleet/sidebar role fixtures.
- Giới hạn: all UI screenshots and route/auth regressions are fixture/mock evidence. Real backend session, tenant isolation UAT and live auth remain `NEEDS-LIVE`.
- Rollback: revert only the conditional skip and this test-result documentation; do not weaken the bootstrap assertions.

### TMS-NAV-001 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; các route production giữ nguyên, năm mục TMS được thêm vào cùng nguồn cấu hình `NAV_ZONES`, có lọc theo quyền và active theo path dài nhất. Thanh điều hướng ngang trong TMS đã bỏ.
- Bằng chứng: `npm run build` và `npm run lint` exit 0; targeted Vitest cho AppSider/TmsFlowLayout/Optimization 41 test pass, AppResponsiveShell 8 test pass với shell check 320/375/414/768/1024/1440px. Full Vitest hiện 1.493 pass / 9 fail / 1.502; số fail bằng baseline được ghi nhận trước task (9/1.494), các lỗi hiện thấy thuộc page-size assertions payroll/profitability/query serializer. `env -u CI npm run test:e2e -- e2e/tms-navigation.spec.ts e2e/reduced-motion.spec.ts --workers=1 --reporter=line` exit 0, 5/5.
- Motion: `.app-route-transition` chỉ bọc Outlet và remount theo pathname; enter 280ms opacity/translateY, không có exit; global reduced-motion đặt animation/transition 0.01ms.
- Ảnh rail theo role: `docs/design/tms-sider-review/` (`BROWSER-FIXTURE`). 25 ảnh năm màn đã lưu ở `docs/design/tms-pages-review/`, tại 320/375/768/1024/1440px. Fixture dùng các page component production với auth/API dữ liệu tổng hợp chỉ trong test.
- Bằng chứng bổ sung: full `npm run test:e2e -- --workers=1 --reporter=line` — 35 pass / 11 fail / 1 skip trên 47 test; ba spec TMS mới đều pass, gồm refresh/deep link, back/forward, query-only update không remount và overflow check 5×5 viewport. Role matrix/sidebar cũng pass.
- Giới hạn: đây là browser fixture, không phải authenticated backend/live-data UAT. Full-suite failures còn ở dashboard keyboard (1), pageSize spec cũ kỳ vọng 20 thay vì mặc định hiện tại 10 (4), keyboard overlay fixture thiếu QueryClient/Refine context (5), và Load detail fixture overflow (1). Một số fixture cũ khác vẫn log 401/`Authentication is required`; TMS page fixture mới không phát sinh lỗi auth.
- Điều bất thường: full suite dùng mặc định `SCREENSHOT_DIR=after`; spec Load đã ghi lại các ảnh 1440/1024/768/390 trong `docs/design/after/` trước khi phát hiện overflow ở 320px. Các file đó vốn đã có thay đổi từ trước; không có bản lưu trước lần chạy này để đối chiếu.
- File chính: AppSider/AppLayout/TmsFlowLayout/Optimization presentation, locale en/vi, test component và fixture `e2e/tms-navigation.spec.ts`; không đổi route registry, API, auth hoặc business hooks.
- UX follow-up: bản đồ Điều phối đổi tiêu đề thành “Bản đồ tuyến ước tính”; chú thích nói rõ đường tím là ước tính từ dịch vụ định tuyến A→B, không phải vệt GPS, và chú giải phân biệt A/B với tọa độ xe. `npm run build`, `npm run lint`, `npx vitest run src/pages/tms-flow/DispatchPage.test.tsx` (3/3) và ảnh responsive spec (25 tổ hợp màn/viewport, không tràn ngang) đều pass.

### DISP-001 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; URL `?shipment=` là nguồn chọn lô. Nếu lô chưa nằm trong các trang đang tải, dùng Refine `useOne` với resource `loads` và query key có tenant. ID không tồn tại/403 không rơi sang lô khác; lô đã biết nhưng bị lọc có nút bỏ lọc; lỗi khác có nút thử lại. Chọn thẻ vẫn cập nhật query param hiện có.
- Bằng chứng: `npx vitest run src/hooks/tms-flow/useDispatchSelection.test.tsx src/pages/tms-flow/DispatchPage.test.tsx src/tests/locales/localeKeys.test.ts --reporter=dot` — exit 0, 3 files/14 tests. Coverage gồm 403/404, loading, lô ngoài trang đã tải, bị ẩn bởi filter, retryable error và không dùng fallback khi có ID trên URL.
- Giới hạn: component/hook test xác nhận wiring và trạng thái, chưa có authenticated backend session để nghiệm thu quyền và tải trực tiếp lô thật; phần này `NEEDS-LIVE`.
- File chính: `src/hooks/tms-flow/useDispatchSelection.ts` (mới), test hook mới, `src/hooks/tms-flow/useTmsWorkspace.ts`, `src/pages/tms-flow/DispatchPage.tsx`/test, `src/locales/vi.ts`, `src/locales/en.ts`, `plan.md`.

### DISP-002 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; banner đã được triển khai và kiểm thử theo thứ tự ưu tiên rủi ro → gợi ý đang chờ → chưa có gợi ý → đã có xe. Theo yêu cầu người dùng kèm ảnh ngày 06/11, banner đã được gỡ khỏi màn Điều phối; component/test vẫn được giữ, nhưng page không render nó.
- Bằng chứng: `npx vitest run src/hooks/tms-flow/useShipmentNextAction.test.ts src/components/tms-flow/DispatchNextActionBanner.test.tsx src/pages/tms-flow/DispatchPage.test.tsx src/tests/locales/localeKeys.test.ts --reporter=dot` — exit 0, 4 files/13 tests. Kiểm tra thứ tự ưu tiên, bốn loại trạng thái, hành động chính và trạng thái disable.
- Giới hạn: route chi tiết lô và modal duyệt dùng handler hiện có; chưa có live session để xác minh quyền/API thật (`NEEDS-LIVE`).
- File chính: hook/component/test mới trong `hooks/tms-flow` và `components/tms-flow`; `DispatchPage.tsx`, `src/styles/tms-flow.scss`, locale vi/en và `plan.md`.

### DISP-003 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; khi URL chưa chọn lô, danh sách đã tải được xếp theo rủi ro → chưa có xe → giờ giao gần nhất. Sau phản hồi duyệt/từ chối thành công, handler tìm lô còn việc trong danh sách đang hiển thị, chuyển query `shipment` và có nút quay lại lô vừa xử lý. Không tự chuyển khi modal đang chờ server hoặc khi request lỗi.
- Ba thẻ tóm tắt đã được triển khai và kiểm thử, nhưng theo yêu cầu người dùng ngày 06/11 đã được gỡ khỏi màn. Component/test vẫn còn trong source nhưng `DispatchPage` không render các thẻ này.
- Bằng chứng: targeted Vitest `npx vitest run src/hooks/tms-flow/useDispatchSelection.test.tsx src/hooks/tms-flow/useShipmentNextAction.test.ts src/hooks/tms-flow/useTmsWorkspace.test.tsx src/components/tms-flow/DispatchWorkSummary.test.tsx src/components/tms-flow/DispatchNextActionBanner.test.tsx src/components/tms-flow/ApproveSuggestionModal.test.tsx src/pages/tms-flow/DispatchPage.test.tsx src/tests/locales/localeKeys.test.ts --reporter=dot` — exit 0, 8 files/27 tests; `npm run build` exit 0; `npm run lint` exit 0 (0 warning trong lượt cuối).
- Giới hạn: `resources.ts` được báo cáo không tồn tại; allowlist thật ở `src/pages/resourceRegistry.ts` không cho sắp xếp server-side theo rủi ro, trạng thái có xe hoặc giờ giao. Vì vậy lựa chọn kế tiếp chỉ tối ưu trong queue đang tải/filter hiện hành. Chưa có backend-live để kiểm tra phản hồi duyệt thật (`NEEDS-LIVE`).
- File chính: `src/hooks/tms-flow/useDispatchSelection.ts`/test, `useTmsQueries.ts`, `useTmsWorkspace.ts`/test, `src/components/tms-flow/DispatchWorkSummary.tsx`/test, `ApproveSuggestionModal.tsx`/test, `src/pages/tms-flow/DispatchPage.tsx`/test, locale vi/en, `src/styles/tms-flow.scss`, `plan.md`.

### DISP-004 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; loads, rủi ro, lô chưa có xe, xe, gợi ý AI, trạng thái AI, chi tiết lô và lịch sử lấy dữ liệu theo chu kỳ 30 giây; TanStack Query v4 được cấu hình `refetchIntervalInBackground: false` và refresh ngay khi tab được focus lại. Lô tự chọn được ghi vào query `shipment` để lần refresh không đổi lựa chọn; React Query giữ cache khi refetch lỗi. Màn hình hiện thời điểm `Cập nhật lúc HH:mm`, spinner cập nhật và cảnh báo retry.
- Bằng chứng: `npx vitest run src/hooks/tms-flow/useTmsQueries.test.tsx src/hooks/tms-flow/useTmsWorkspace.test.tsx src/pages/tms-flow/DispatchPage.test.tsx src/tests/locales/localeKeys.test.ts --reporter=dot` — exit 0, 4 files/10 tests; kiểm tra cấu hình không polling nền, refresh khi quay lại, giữ dữ liệu cũ và pin lựa chọn. `npm run build` exit 0; `npm run lint` exit 0.
- Giới hạn: test xác minh cấu hình query và hành vi từ component, chưa kiểm tra đổi visibility của trình duyệt thật với backend/tenant đang đăng nhập (`NEEDS-LIVE`).
- File chính: `src/hooks/tms-flow/useTmsQueries.ts`/test, `useTmsWorkspace.ts`/test, `src/pages/tms-flow/DispatchPage.tsx`/test, locale vi/en, `src/styles/tms-flow.scss`, `plan.md`.

### DISP-005 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; trước khi đồng ý dùng xe, hook tải lại gợi ý đang chờ từ API hiện có và so sánh snapshot. Nếu gợi ý đã đổi/hết hiệu lực thì không gửi lệnh cũ; modal giữ ngữ cảnh khi lỗi/conflict. Khóa đồng bộ ngăn gửi hai lần; chỉ đóng/chuyển lô sau khi server trả thành công.
- Bằng chứng: lần chạy hiện tại `npx vitest run` theo danh sách test TMS — exit 0, 11 files / 41 tests pass; gồm stale snapshot, lỗi API, giữ modal, permission và duplicate submission.
- Giới hạn: chưa có phiên backend đã xác thực để xác nhận freshness, permission và kết quả mutation thật (`NEEDS-LIVE`).

### DISP-006 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; điểm và confidence được diễn giải thành ba mức; lý do được rút gọn còn tối đa ba ý; số liệu gốc nằm trong mục kỹ thuật thu gọn. Từ chối có ba lựa chọn “Xe ở xa”, “Tài xế bận”, “Lý do khác”; chỉ lý do khác mở ô nhập và gửi qua tham số `reason` API hiện có.
- Ngưỡng score 80/60 chỉ là tạm thời, chưa hiệu chỉnh bằng kết quả vận hành thật và cần được duyệt/điều chỉnh khi có dữ liệu (`NEEDS-LIVE`).
- Bằng chứng: cùng lần chạy 11 files / 41 tests pass; có test phân nhóm score, dữ liệu thiếu, rút gọn lý do và gửi lý do từ chối.

### DISP-007 — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; thiếu tọa độ hiển thị tuyến lấy → giao dạng chữ và lý do chưa thể vẽ; lỗi định tuyến có thông điệp riêng; chú thích luôn nêu đây là đường đi tham khảo. Lịch sử mặc định hiện ba sự kiện mới nhất và có thể mở rộng; hàng đợi rỗng dùng thông điệp tiếng Việt.
- Bằng chứng: cùng lần chạy 11 files / 41 tests pass; có component tests cho tọa độ thiếu, lỗi định tuyến, chú thích và mở rộng timeline. Timeline ở trang khác giữ nguyên thứ tự gốc khi không bật chế độ thu gọn và có test hồi quy.
- Ghi chú: ba thẻ tóm tắt và banner “Việc tiếp theo” trong ảnh người dùng đã được gỡ khỏi UI; bản sao trước khi gỡ được lưu tại `docs/design/dispatch-screen-backup-2026-11-06.tar.gz`.

### DISP-001..007 — kiểm tra tích hợp cuối — 06/11/2026

- `npm run lint` — exit 0.
- `npm run build` — exit 2 do lỗi type trong hai file Mapbox ngoài scope DISP: `src/types/tms-flow/mapbox.types.ts` import `RouteEstimate` chưa export và `src/utils/tms-flow/mapbox.ts` import `TmsLoadCardItem` chưa export. Không sửa contract/type ngoài các ticket.
- `npx vitest run` — exit 1, 252 files: 1.543 pass / 9 fail / 1.552 tests. Các lỗi hiện tại nằm ngoài TMS Dispatch: assertions page size 20 trong khi mặc định hiện tại là 10, query cache Load Documents và suites Payroll/Profitability. Số lỗi bằng baseline đã ghi nhận trước đó (9), nhưng không khẳng định danh sách lỗi giống hệt.
- Test tập trung Điều phối — exit 0, 11 files / 41 tests pass; gồm lựa chọn URL, auto-next, polling, xác nhận gợi ý, phân mức, lý do từ chối, map fallback, timeline và locale.
- `git diff --check` — exit 0. Chưa chạy Playwright/live backend trong lượt này.

### DASH-REFRESH-001 — dashboard `/tms` — 06/11/2026

- Trạng thái: `UI_SAFE_DONE`; sửa đúng route người dùng mở. Dashboard có KPI dữ liệu API, phân bố status theo tập đơn đã tải, hàng đợi AI/rủi ro, bản đồ xe, chuyến ưu tiên, timeline và nút refresh. Các trạng thái loading/error/empty giữ rõ ràng; fallback được ghi nhãn, không suy diễn số liệu.
- Bằng chứng: browser fixture từ component production ở 1440px và 390px — heading/hàng đợi render, `scrollWidth <= viewport` cả hai kích thước, thẻ trạng thái mobile chiếm đủ chiều rộng. Ảnh: `docs/design/tms-dashboard-refresh/after-1440.png`, `after-390.png`; ảnh trước tham chiếu `docs/design/tms-pages-review/overview-1440.png`.
- Validation trong lượt này: `npm run typecheck` exit 0; `npm run lint` exit 0; `git diff --check` exit 0. Không chạy test/build theo phạm vi xác minh đã chọn. Chưa có authenticated backend-live UAT.
- File chính: `src/components/tms-flow/TmsDashboardContent.tsx`, component mới `TmsDashboardOverview.tsx` và `TmsDashboardWorkQueue.tsx`, `src/styles/tms-flow.scss`, locale vi/en, `plan.md`.
- Branch: `codex/tms-dashboard-refresh-2026-11-06`, đang phục vụ trên localhost:5173. Working tree vốn có nhiều chỉnh sửa chưa commit; chúng được giữ nguyên. Không commit/deploy.
