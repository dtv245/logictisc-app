# LogisticsX UI/UX Implementation Progress

**Cập nhật:** 19/10/2026  
**Plan:** [`plan.md`](../plan.md)  
**Baseline:** HEAD `cff6c8c89b80e5f5501feb4747caf786722a55c8`; working tree đã có nhiều thay đổi chưa commit trước khi triển khai. Không dọn, reset, commit hoặc ghi đè các thay đổi đó.

Plan có **76 ticket triển khai**. Tám mã `UX-01..UX-08` là nhãn traceability, không tính là ticket riêng. Trạng thái tóm tắt: **DONE 7, UI_SAFE_DONE 16, IN_REVIEW 4, BLOCKED 11, BACKLOG 38, INTEGRATION_DONE 0**.

## Kết quả kiểm thử phiên này

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `npm run build` | PASS — exit 0 | `tsc -b` và Vite build thành công. Vite cảnh báo một số bundle lớn hơn 500 kB. |
| `npm run lint` | PASS — exit 0 | 0 lỗi, 1 cảnh báo hook dependencies có sẵn tại `src/hooks/useDriverRanking.ts:57`. |
| `npm test -- --reporter=dot` | PASS — exit 0, 191 files / 1290 tests | Vượt baseline 1205 tests của `docs/restructure/PROGRESS.md`. Các cảnh báo Ant Design/Sass/React Router/jsdom và error logs từ test conflict là không fatal. |
| `npx vitest run src/tests/pages/dashboard/DashboardResponsive.test.tsx --reporter=dot` | PASS — exit 0, 1 file / 11 tests | Có kiểm tra shortcut Ctrl/Cmd+K và parse filter bằng Refine. |
| `npx vitest run src/tests/pages/loads/LoadShow.test.tsx src/tests/features/loads/ShipmentDetailRedesign.test.tsx --reporter=dot` | PASS — exit 0, 2 files / 9 tests | Xác nhận header/back ổn định khi đổi tab và states của Load detail. |
| `npx playwright test e2e/dashboard-panels.spec.ts --grep "keeps missing panel data empty"` | PASS — 1/1 | Chạy với browser fixture; không phải backend-live/UAT. |

## Kiểm chứng sau hòa nhập `origin/main` — 19/10/2026

- `origin/main` chuyển các dashboard/map hooks sang `src/hooks/`; lần build đầu phát hiện import cũ còn sót. Đã cập nhật import trong 14 file, không đổi nghiệp vụ/API.
- `npm run build`: PASS, exit 0.
- `npm run lint`: PASS, exit 0; còn 1 cảnh báo `react-hooks/exhaustive-deps` tại `src/hooks/useDriverRanking.ts:57`.
- Test liên quan: PASS, 6 file / 26 tests.
- `npx vitest run`: PASS, exit 0, 191 files / 1290 tests.
- Playwright không chạy lại ở bước hòa nhập này vì các spec screenshot ghi vào `docs/design/` đang chứa bằng chứng hiện có. E2E fixture 1/1 ở bảng trên là kết quả lần chạy trước; không phải live UAT.

## Tiến độ theo milestone

| Milestone / Task ID | Mô tả | Trạng thái | Files đã chỉnh sửa hoặc evidence | Kiểm thử / kết quả | Blocker và bước tiếp theo |
|---|---|---|---|---|---|
| M0 `BASE-001..003`, `BASE-007` | Baseline Git/scripts/routes, modes dữ liệu, UX/gap inventory | DONE | `docs/ux/sprint0-triage.md`, `plan.md`; đọc source `App.tsx`, router, resource registry, proxy, fixture | Build/lint/Vitest cuối phiên PASS; source và fixture phân loại riêng | Cần backend-live để tăng độ tin cậy của một số role/tenant. |
| M0 `BASE-004..005` | Screenshot/reference video và live session | BLOCKED | Ảnh fixture sẵn có tại `docs/ux/baseline/`; danh sách và nguồn ảnh trong `docs/ux/sprint0-triage.md` | E2E fixture 1/1 PASS | Thiếu video đầu vào; thiếu authenticated tenant/backend-live; AI Dispatch và Optimization chưa có screenshot kiểm chứng phù hợp. |
| M0 `BASE-006` | Ma trận route, capability, role, tenant | IN_REVIEW | Route/capability audit trong `docs/ux/sprint0-triage.md` | Source test suite PASS | UAT từng role/tenant còn lại. |
| M1 `NAV-001..002` | Khóa GAP Fill khi Load edit bị gated; thống nhất focus field | UI_SAFE_DONE | `ShipmentGapsCard.tsx`, `LoadAiGapsSection.tsx`, `AiGapChatWidget.tsx`, `pages/loads/edit.tsx`, `locales/en.ts`, `locales/vi.ts`; tests AI/GAP | Full Vitest PASS; test xác nhận Fill disabled và có giải thích | `CORE-001` vẫn BLOCKED; không bật runtime flag. |
| M1 `NAV-003..005` | CTA vào `/map`, `/load-board`, `/accidents`, mileage attribution | UI_SAFE_DONE | `src/components/AppSider.tsx`, dashboard map/timeline/CTA components, `FleetMetricCard.tsx`; AppSider/Fleet tests | Full Vitest PASS; test xác nhận route unsupported không hiện như chức năng khả dụng | Mount route chỉ khi có scope/data/permission đã xác nhận. |
| M1 `NAV-006` | Dashboard quick search → Loads filter Refine | UI_SAFE_DONE | `src/features/dashboard/components/DashboardHeader.tsx`, `src/tests/pages/dashboard/DashboardResponsive.test.tsx` | DashboardResponsive 11/11 PASS; Refine `parseTableParams` khôi phục `{ field: search, operator: contains }` và trang 1 | UAT bằng list API thật còn lại; query URL giữ keyword cho back/refresh. |
| M1 `NAV-007` | Search trigger và Ctrl/Cmd+K | DONE | `DashboardHeader.tsx`, `DashboardHeader.scss`, `DashboardResponsive.test.tsx` | DashboardResponsive 11/11 PASS; keyboard shortcut và native button được kiểm tra | Không có blocker đã biết. |
| M1 `NAV-008` | Load detail giữ Back/Header khi đổi tab | DONE | `src/pages/loads/show.tsx`, `ShipmentDetailView.tsx`, `src/tests/pages/loads/LoadShow.test.tsx`, `src/tests/features/loads/ShipmentDetailRedesign.test.tsx` | Focused 9/9 PASS; build/lint/full Vitest PASS | Không có blocker đã biết. |
| M1 `NAV-009..011` | Trip detail, notification target, AI session deep-link | BACKLOG | Chưa thay đổi các contract/ID | Full suite PASS, chưa nghiệm thu các task này | Cần `tripId`, target entity và endpoint session-by-ID xác thực. |
| M1 `CORE-001` | Core Load/Trip/Truck edit | BLOCKED | `resourceCapabilities.ts` giữ `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false` | Full suite PASS; guarded UI tests PASS | Cần versioned-write contract/runtime verification và permission tests backend. |
| M2 `DS-001` | Kiểm kê design tokens/semantic colors | DONE | `docs/ux/sprint0-triage.md` §5; audit `styles/_variables.scss`, AntD provider, Operations/Load overrides | Docs/source audit | Không đổi màu thương hiệu trong task audit. |
| M2 `DS-002` | Quyết định brand primary + AntD theme | BLOCKED | Không đổi `ConfigProvider` theme | Chưa chạy visual theme regression vì chưa có quyết định màu | Product Owner cần xác nhận brand primary. |
| M2 `DS-003..006`, `I18N-001` | Typography/spacing/components/i18n rollout | BACKLOG | Chưa chỉnh trong phạm vi các task này | Build/lint/full suite PASS cho source hiện tại | Tiếp tục theo từng component sau quyết định theme. |
| M2 `SHELL-001` | Sidebar discoverability, route và permission | IN_REVIEW | `src/components/AppSider.tsx`, `src/tests/components/AppSider.test.tsx`, `src/tests/components/AppResponsiveShell.test.tsx`; menu loại bỏ entries không có route runtime | Full Vitest PASS; role/permission fixture tests PASS | Còn xác minh screenshot và keyboard flow ở đủ role/viewport. |
| M3 `OPS-001..006` | Truthful dashboard KPI/preview/brief/map/timeline | UI_SAFE_DONE | `OperationsDashboardView.tsx/.scss`, `DashboardHeader.tsx/.scss`, `KpiStrip.tsx/.scss`, `NetworkMiniMap.tsx/.scss`, `DispatchTimeline.tsx/.scss`, `OperationsBrief.tsx/.scss`, `PriorityShipmentCard.tsx/.scss`, `OperationsDashboardPage.tsx/.scss`; tests components/dashboard | Full Vitest PASS (1290); dashboard fixture E2E 1/1 PASS | Safe empty/unavailable/demo UI shipped; live panels depend on backend data. |
| M3 `OPS-007` | Responsive density/layout and keyboard checks | IN_REVIEW | Dashboard responsive styles/tests and existing fixture screenshots | Full Vitest + targeted E2E PASS | Viewport 320px và complete live/manual responsive pass chưa thực hiện. |
| M3 `OPS-008` | Live panel data contract | BLOCKED | No API/data contract change | Không giả lập success; test empty-data fixture PASS | Cần dashboard panel contract, freshness và ownership từ backend. |
| M4 `LOAD-003`, `LOAD-005` | Load detail header/tab; safe GAP interactions | UI_SAFE_DONE | `pages/loads/show.tsx`, `ShipmentDetailView.tsx`, GAP components and tests | Load focused 9/9 + full Vitest PASS | Mutation integration/cache invalidation chờ core edit contract; không đổi business workflow. |
| M4 `LOAD-001..002`, `LOAD-004`, `TRIP-001..002` | Load list/create/panel completeness and Trip transitions | BACKLOG | Chưa chỉnh trong nhóm ticket này | Full suite PASS, không thay state machine | Kiểm tra riêng form/API, role, timeline transition, refresh behavior. |
| M4 `AI-001` | Phân biệt mô phỏng AI với provider/chat thật | UI_SAFE_DONE | `aiConfigStorage.ts`, `AiConfigModal.tsx`, `AiGapChatWidget.tsx`, `locales/en.ts`, `locales/vi.ts` và AI tests | Full Vitest PASS; test xác nhận không báo provider/chat success thật | AI backend/credential contract vẫn cần tích hợp riêng. |
| M4 `AI-002..007`, `OPT-001..002` | AI inputs/history/approval/errors và optimization comparison | BACKLOG | Chưa thay đổi command/approval semantics | Full suite PASS với regression coverage hiện có | Cần task-specific source/contract review trước triển khai. |
| M5 `DOC-002`, `NOT-002`, `FLT-002`, `FIN-002..003`, `EXEC-001` | Các chức năng phụ thuộc contract/flag/scope | BLOCKED | Feature flags vẫn false; no endpoint/schema changes | Activation contract tests PASS; không mở mutation | Cần upload/payment/billing/notification/fleet-history contracts hoặc quyết định executive scope. |
| M5 `DOC-001`, `DOC-003..005`, `NOT-001`, `FLT-001`, `FIN-001`, `SET-001`, `PAY-001..002`, `PSL-001` | UX module documents/notifications/fleet/finance/payroll | BACKLOG | Chưa triển khai task cụ thể ở nhóm này | Full Vitest PASS cho source hiện tại | Tiếp tục theo backlog, giữ nguyên financial/payroll/settlement semantics. |
| M6 `QA-006` | Regression suite | UI_SAFE_DONE | Repo test/build/lint; dashboard/load tests | Build exit 0; lint exit 0; Vitest 191/1290 PASS; targeted E2E 1/1 PASS | Chưa thay thế UAT/live tenant. |
| M6 `QA-008` | Tách proxy/fallback/fixture khỏi live evidence | IN_REVIEW | `docs/ux/sprint0-triage.md` data-mode inventory và fixture E2E | Dashboard fixture 1/1 PASS | Cần kiểm tra Vite fallback trên môi trường runtime riêng. |
| M6 `QA-001..005`, `QA-007` | Responsive/accessibility/contrast/reduced-motion/provenance | BACKLOG | Existing responsive/accessibility tests được chạy; chưa đủ toàn checklist | Full Vitest PASS | Bổ sung viewport 320px, keyboard/focus/contrast audit và reduced-motion verification. |

## Feature flags và dữ liệu

- `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false`.
- `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED=false`.
- `BILLING_COMMANDS_RUNTIME_VERIFIED=false`.
- `PAYMENT_COMMANDS_RUNTIME_VERIFIED=false`.
- Không bật flag, không tạo endpoint/API contract và không dùng fixture làm bằng chứng live.
- Các screenshot baseline hiện có là `BROWSER-FIXTURE`; phiên này không chụp/ghi đè file ảnh.

## Công việc tiếp theo

1. Hoàn thiện M1 audit runtime cho NAV-009..011 khi có API payload/permission contract.
2. Chốt brand primary để DS-002 có thể triển khai theme với visual regression có kiểm soát.
3. Lấy backend panel contract để unblock OPS-008; tiếp tục M3 layout sau viewport 320px.
4. Giữ nguyên các task gated cho đến khi có API/permission/runtime evidence.
