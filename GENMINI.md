# GEMINI.md — LogisticsX Frontend

> Ngữ cảnh bắt buộc cho AI coding agent. Đọc hết file này trước khi sửa code.
> Nếu file này mâu thuẫn với source thực tế tại HEAD → **source thắng**. Hãy báo lại chỗ mâu thuẫn, đừng im lặng làm theo file này.
>
> Baseline của file: báo cáo hiện trạng ngày 19/10/2026 (HEAD `cff6c8c89b80e5f5501feb4747caf786722a55c8`, có tính cả working tree chưa commit).
> Tài liệu chi tiết (KHÔNG nạp toàn bộ, chỉ đọc đúng mục cần bằng `grep -n` / `sed -n`):
> - `docs/CURRENT_UI_UX_FLOW_ANALYSIS.md` — hiện trạng route, flow, component, design system, API (file lớn ~145KB).
> - `docs/plan.md` — Master UI/UX Improvement Plan (v0.1 DRAFT): backlog theo ID, ưu tiên, DoR/DoD, test.

---

## 1. Dự án là gì

LogisticsX là một **TMS (Transport Management System) đa tenant**. Frontend là SPA React, gọi backend Spring Boot qua `/api/...`.

Các nhóm chức năng: đăng nhập SSO (Lark/OIDC) → chọn tenant → Operations dashboard, Load/Trip/Truck/Customer/Employee/Terminal, Documents, Notifications, AI Dispatch, Optimization, Fleet report, Profitability, Settlement, Driver pay policy, Payroll, Payslip.

Mức hoàn thiện không đồng đều. Luôn phân biệt 3 lớp:
1. **CRUD đã nối API** (Refine DataProvider).
2. **Workflow chuyên biệt** có permission/state guard và invalidation (Trip execution, Settlement, Payroll, Optimization).
3. **Phần mẫu / dormant / gated** (Operations mặc định pha static, executive dashboard, map module, nhiều nút AI).

---

## 2. Nguyên tắc cốt lõi (vi phạm = sai task)

1. **Không giả thành công.** Không hiển thị số liệu tĩnh như thể live; không báo "đã gửi/đã kết nối/đã duyệt" khi chưa có kết quả thật từ API. `testAiConnection` (500ms) và chat AI (400ms) hiện là **mô phỏng** — phải được gắn nhãn đúng.
2. **Không tự bật feature flag/capability bị khóa.** Ví dụ: `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED`, `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED`, `BILLING_COMMANDS_RUNTIME_VERIFIED`, `PAYMENT_COMMANDS_RUNTIME_VERIFIED`, `EXECUTIVE_CONTRACT_CONFIRMED` (đang `false`). Chỉ bật khi người dùng đã phê duyệt contract bằng văn bản.
3. **Không thêm route chỉ để che lỗi 404.** Nếu đích chưa có, hãy điều hướng tới luồng hợp lệ, hoặc disable CTA kèm lý do rõ ràng.
4. **Không đổi nghiệp vụ khi chỉnh UI.** Giữ nguyên: JWT role matrix, tenant isolation, state machine (Trip stop / Settlement / Payroll), idempotency, immutable history của Optimization/Settlement/Payroll.
5. **Không bịa.** Không bịa endpoint, tên file, tên hook, ID, field. Kiểm tra bằng `ls`, `grep`, đọc file trước khi dùng. Không tự dựng `tripId`/`sessionId`/`loadId` khi response không trả về.
6. **Không thêm thư viện mới** (UI framework, motion, map, state) nếu chưa được hỏi và chưa có lý do. Dùng Ant Design 5 + SCSS + CSS variables + stack hiện có.
7. **Thay đổi nhỏ, đúng phạm vi.** Mỗi lần chỉ làm một task/ID. Không refactor "tiện tay", không đổi tên/di chuyển file ngoài yêu cầu, không gộp thay đổi nền tảng với redesign.
8. **Giữ nguyên thay đổi chưa commit của người khác.** Chạy `git status` trước khi sửa; không `git reset --hard`, `git checkout .`, `git clean`, không force push.
9. **Mơ hồ thì hỏi 1 câu ngắn**, đừng đoán rồi sửa hàng loạt file.

---

## 3. Tech stack (theo `package.json`; luôn đọc lại `package.json` khi cần số phiên bản chính xác)

| Thành phần | Công nghệ |
|---|---|
| Core | React `^18.3.1`, TypeScript `~6.0.2`, Vite `^8.1.1` — SPA, không SSR |
| App framework | Refine core v4 + `@refinedev/antd` v5 (resource, auth, access control, data hooks) |
| UI | Ant Design `^5.29.3`; icon: Ant Design Icons + Lucide React |
| Styling | Sass/SCSS + CSS variables. **Không** Tailwind/Bootstrap |
| Routing | React Router DOM `^6.30.3` (BrowserRouter, nested Routes/Outlet) |
| Server state | TanStack Query `^4.41.0` (qua Refine và hook trực tiếp) |
| Client state | React state/ref/context; Zustand `^5` **chỉ** cho map store |
| HTTP | Axios (client nền có bearer/refresh/envelope/error normalization) |
| Map | Leaflet (mini-map dashboard); react-map-gl + MapLibre (candidate map); deck.gl/H3/Turf (module map **chưa route**) |
| Charts | Recharts `^3.10` |
| Form | Ant Design Form, `useForm`/`useModalForm`; Zod chỉ ở config/contract. **Không** dùng React Hook Form |
| Auth | OIDC client, Lark gateway, session manager, JWT verify bằng `jose` |
| i18n / format | i18next + react-i18next (vi/en/ja), locale Antd, dayjs, Decimal.js |
| Test | Vitest + Testing Library; Playwright (e2e/fixtures) |

Không có dark mode, không có thư viện motion, không có animated route transition.

---

## 4. Cấu trúc thư mục & nơi đặt code

```text
src/
├── main.tsx / App.tsx        entry, providers, BrowserRouter, Refine
├── config/                   runtime config, health gate, bootstrap
├── router/                   AppRouter, ProtectedRoute, TenantGuard
├── pages/                    route pages (resource pages + màn chuyên biệt)
├── components/               AppLayout, AppSider, CRUD shell, modal, toolbar
│   ├── resources/            form definitions, resourceCapabilities, modal frame
│   ├── dashboard/ ai/ lark-base/
├── features/                 domain components/hooks/API hiện có (dashboard, loads/redesign, optimization, settlements, payroll, fleet, map, ...)
├── hooks/                    identity, tenant, filter, mutation, AI, preview
├── api/                      adapters AI và Lark Base
├── providers/                auth, access control, dataProvider, apiClient, notification
├── forms/  table/            FormGrid/Section/Footer, BaseTable
├── constants/ styles/ locales/ formatters/ types/ utils/
└── tests/                    (nhiều test nằm cạnh component/hook/page)
e2e/fixtures/                 fixture Playwright
public/  docs/
```

**Quy ước đặt code mới:**
- Hook dùng chung → `src/hooks/`. Hàm tái sử dụng (từ 2 nơi trở lên) → `src/utils/` (format thì `src/formatters/`). Type/contract → `src/types/`. Component dùng chung → `src/components/<domain>/`.
- Không tạo thêm cấu trúc feature lồng nhiều tầng. Code đã có trong `features/` thì **sửa tại chỗ**, không di chuyển.
- Việc tái cấu trúc thư mục chỉ làm khi người dùng yêu cầu rõ và theo phiên riêng.
- Layout thật là `components/AppLayout.tsx`; không có thư mục `layouts/` hay `services/` thống nhất.

---

## 5. Auth, tenant, permission, route

- Luồng: `ProtectedRoute` → `TenantGuard` → `AppLayout` (`AppSider` + `Outlet`).
- Quyền theo **JWT role matrix** (`providers/permissions/roleMatrix.ts`). Menu kiểm tra bất đồng bộ bằng `useCanWithoutCache`. Item không được phép thì ẩn; icon khai báo trong `NAV_ZONES` ≠ chắc chắn hiển thị ở runtime.
- `src/pages/index.ts` khai báo 72 route CRUD (18 domain) nhưng runtime chỉ bật **31** qua `foundationResourcePageRoutes` trong `App.tsx`. Cộng 24 route tường minh = 55 mẫu URL. **Có file page ≠ có route đang chạy.**
- Capability theo resource: `components/resources/resourceCapabilities.ts`. Load/Trip/Truck edit đang bị tắt dù adapter còn code update.
- Thay tenant phải gọi clear/invalidate cache tenant-scoped; **query key luôn gắn tenant**.
- 401 → một lượt refresh/replay có guard. **403 không được refresh/logout, và không được hiển thị như "empty".**
- Comment đầu `AppSider.tsx` ("9 phân khu") đã lỗi thời; xem mảng `NAV_ZONES` thực tế.

**Route/CTA chưa đăng ký — không được trỏ tới:** `/map`, `/load-board`, `/accidents`, `/fleet/mileage-attributions`, `/loads/edit/:id` (đang bị khóa).

---

## 6. Data mode — luôn biết mình đang ở chế độ nào

| Mode | Ghi chú |
|---|---|
| Production API | Backend Spring thật |
| `/operations?demo=1` | Mock có banner (`OperationsDashboardPreview`, hằng số, `now=15:20` cố định) |
| Operations mặc định | **Pha API + static** (`useDashboardData` + hằng số); không phải toàn bộ live |
| Dev proxy fallback | `vite.config.ts` trả health/identity/list mẫu và create/update giả khi backend offline → **không chứng minh** backend xử lý thành công |
| Playwright fixture | Mock DataProvider + axios adapter; `can=true` cho mọi quyền |

Quy tắc: mọi test/báo cáo phải nêu rõ bằng chứng thuộc loại `SOURCE` / `BROWSER-FIXTURE` / `BROWSER-LIVE` / `MOCK` / `GATED` / `UNROUTED` / `PROPOSAL` / `NEEDS-LIVE`. Không trộn nhãn, không dùng fixture để khẳng định backend thành công.

---

## 7. API, mutation, cache

- **Hai đường transport:**
  1. Nền Refine: hook → `DataProvider` → `createApiClient` (Axios: bearer, correlation header, timeout, unwrap envelope, `ApiHttpError`). Code: `providers/api/apiClient.ts`, `providers/dataProvider.ts`. `getList` chỉ nhận filter/sort trong allowlist; có AbortController.
  2. Nhánh AI: `src/api/ai/ai.api.ts` và `features/ai-dispatch/api/aiDispatch.api.ts` gọi axios trực tiếp tới `/api/...`, đọc `res.data.data ?? res.data` — **không** qua toàn bộ interceptor/error của client nền. Khi sửa AI, tự xử lý lỗi/auth tương ứng, đừng giả định giống đường nền.
- Mutation chính là **pessimistic** (không optimistic): chỉ cập nhật UI sau response thật.
- Sau mutation phải **invalidate đúng key** (theo tenant, theo entity). Một số chỗ hiện thiếu (Trip action chưa chắc invalidate Load timeline/finance; AI overview batch key khác `[loadId]`). Khi sửa, kiểm tra các key liên quan, đừng invalidate quá rộng.
- **Command có idempotency** (`hooks/useFrozenCustomMutation.ts`): khi outcome chưa rõ phải **giữ nguyên command + `idempotencyKey`** để retry; không sinh key mới, không đổi payload (`COMMAND_INTENT_FROZEN`). Modal Payroll/Optimization giữ input/key khi lỗi.
- **Edit có version** (`components/resources/useResourceEditContract.tsx`): chỉ mở compare server khi `CONCURRENT_MODIFICATION_CONFLICT`; không tự thay draft bằng dữ liệu server khi background refetch.
- Single-flight: chặn double-submit bằng pending/flight ref cho mọi nút ghi.
- `AI approve/reject`: `approvedAt/approvedBy` hiện do frontend gán sau response — không bịa thêm audit.

---

## 8. State machine & quy tắc nghiệp vụ (KHÔNG đổi khi làm UI)

- **Trip stop** (`features/trips/api/tripExecution.api.ts`): `PENDING|EN_ROUTE → ARRIVED → SERVICE_STARTED → SERVICE_COMPLETED → DEPARTED`. Không thêm status picker tùy ý.
- **Settlement** (`features/settlements/hooks/useSettlementActions.ts`): submitReview ← CALCULATED; approve ← IN_REVIEW; lock ← APPROVED; resolveValidation ← VALIDATION_REQUIRED; adjustment/reversal ở LOCKED/PAYMENT_SCHEDULED/PAID. Settlement đã finalized là immutable/versioned.
- **Payroll** (`features/payroll/hooks/usePayrollActions.ts`): recalculate ← CALCULATED/VALIDATION_REQUIRED; submit-review ← CALCULATED; approve ← IN_REVIEW; lock ← APPROVED. Ngoài recalculate, cần `payrollIsValidated=true`.
- **Payment attempts** (`usePayrollPaymentActions.ts`): schedule/dispatch có điều kiện chặt; click nút ≠ thành công. Dispatch lỗi I/O vẫn phải refetch evidence.
- **Optimization**: outcome của run là immutable; accept là lệnh backend (có conflict/replay). Backend re-check trước khi gán.
- Payslip: read-only, PDF tải qua Blob có authorization; không suy ra payment status nếu backend chưa có.

---

## 9. Design system

**Nguồn token:** `src/styles/_variables.scss` → `global.scss` (xuất CSS variables); override chung ở `styles/_components.scss`; shell ở `components/AppLayout.scss`, rail ở `components/AppSider.scss`.

| Token | Giá trị |
|---|---|
| Primary | `#2563eb` (hover `#1d4ed8`, active `#1e40af`, light `#eff6ff`) |
| Success / Warning / Error | `#16a34a` / `#d97706` / `#dc2626` (kèm bg/border/text tương ứng trong `_variables.scss`) |
| Text / secondary / tertiary | `#172033` / `#475569` / `#94a3b8` |
| Border | `#e2e8f0` (secondary `#e8edf5`, dark `#cbd5e1`) |
| Layout bg / canvas / surface | `#f4f1eb` / `#d6d1cd` / `#ffffff` |
| Spacing | 4/8/12/16/24/32/48px |
| Radius | 4/6/8/12/16/20px, full=9999px |
| Font | Inter + system stack; body 14px/1.5; cỡ chữ token 12/13/14/16/18/20/24/30 |
| Breakpoint chung | 480/576/768/992/1200/1600px |

**Hiện trạng cần biết (không "sửa" khi chưa được duyệt):**
- Có 3 palette cạnh tranh: global `#2563eb`, Operations `--ops-purple:#703eff`, Load AI `#7C3AED`.
- `AntdLocaleProvider` **chỉ set locale**, chưa inject theme token cho Ant Design → biến SCSS `primary` không tự áp lên mọi control Antd.
- **Không tự chọn màu primary mới.** Đây là quyết định đang `OPEN` (DS-002). Khi viết UI mới: dùng token/CSS variable sẵn có, **không hard-code hex** mới.
- Sidebar là rail icon luôn thu gọn (64px; mobile 60px), **không có global Header** (EmptyHeader). Token `$sider-width:240px` không phản ánh rail thực tế.
- Hai `PriorityShipmentCard` trùng tên: `components/dashboard/PriorityShipmentCard.tsx` (nhận data từ caller, không bịa telemetry) và `features/dashboard/components/PriorityShipmentCard.tsx` (có `DEFAULT_SHIPMENTS`). Biết bạn đang sửa bản nào; đừng để dữ liệu mẫu rò sang live.
- Panel Load cũ và `features/loads/components/redesign/**` cùng tồn tại: đừng trộn nút của hai bên.

---

## 10. Quy tắc UI/UX khi viết/sửa màn hình

1. **Mọi màn/panel có đủ trạng thái:** loading, empty, error (có retry), permission/403, disabled (có lý do), success. Lỗi API **không** được trông như "không có dữ liệu".
2. **CRUD sạch, ít rối:** form nhiều input phải **nhóm theo section** rõ ràng (dùng `FormGrid`/`FormSection`/`FormFooterBar`); validation hiển thị tại field; không mất dữ liệu đã nhập khi submit lỗi.
3. **Tái sử dụng trước khi tạo mới:** `PageHeader`, `AsyncStateView`, `EmptyState`, `ErrorStates`, `StatusTag`, `BaseTable`, `ConfirmActionModal`, `ResourceModalFrame`, `EntityPicker`, formatters. Không tạo bộ component song song.
4. **Nút/CTA:** không dẫn tới URL chưa đăng ký; không bấm được mà không có handler (Share/voice/search/plus trong AI chat hiện chưa có handler → disable hoặc gỡ, đừng làm giả).
5. **Nhãn dữ liệu:** dữ liệu mẫu/fallback/unavailable phải có nhãn rõ trên chính panel đó.
6. **Số liệu:** tiền/số dùng formatter + Decimal.js; ngày dùng dayjs; không tự cộng tiền bằng `number` thô.
7. **Bàn phím & a11y:** Tab/Enter/Space/Escape hoạt động, modal restore focus, không chỉ dựa vào màu. Text thường ≥ 4.5:1, non-text ≥ 3:1. Nút icon-only có `aria-label`.
8. **Motion:** chỉ CSS transition nhẹ (150–200ms); tôn trọng `prefers-reduced-motion`; không thêm thư viện motion, không sao chép hiệu ứng camera zoom/rotate từ video tham chiếu.
9. **Responsive:** kiểm tra 1440 / 1024 / 768 / 390 / 320px; wide content (table/code) cuộn trong container riêng, body không tràn ngang.
10. **i18n:** chuỗi UI mới đi qua i18next (vi/en/ja) khi sản phẩm yêu cầu; không hard-code thêm tiếng Việt vào component mới nếu đã có cơ chế locale. Giữ nguyên ngôn ngữ comment đang dùng trong từng file.
11. Video tham chiếu chỉ là tham chiếu **bố cục/visual hierarchy/pattern tương tác**, không phải bằng chứng về chức năng backend.

---

## 11. Các "bẫy" đã biết (đọc trước khi đụng vào khu vực liên quan)

- **AI GAP `Fill`** → `/loads/edit/:id` đang bị khóa; `?focus=` và `?focusField=` chưa thống nhất (NAV-001/002).
- **`NetworkMiniMap`/`NetworkRouteMap`** mở `/map` (chưa route); **Dispatch Timeline** mở `/load-board` (chưa route); **KPI Fleet** có thể trỏ `/accidents`, `/fleet/mileage-attributions` (chưa route).
- **Dashboard search** gửi `/loads?search=` — chưa chắc khớp filter của list; nhãn `⌘K` hiển thị nhưng chưa có shortcut, trigger thiếu Enter/Space.
- **Load Detail** mất nút Back khi đổi tab (`pages/loads/show.tsx`, `ShipmentHeader`).
- **AI Dispatch:** `View Trip` chỉ mở Trip list; `/ai-dispatch/:id` không đọc ID từ URL; plan history là local state; initial fetch fail chỉ `console.warn`; "Yêu cầu/Tính lại" ở Load chỉ refetch GET status.
- **Notifications:** badge chỉ đếm trong 5 bản ghi đã tải; click chỉ tới list; không có mark-read từng item; polling 10s dừng khi lỗi.
- **Documents:** search/filter/sort chỉ trên **trang đang tải**; upload bị tắt (flag `false`); download dùng anchor (không qua Blob có auth); delete từ drawer đóng sớm trước khi mutation xong.
- **Tenant selection:** mỗi nút tenant đều gọi `switchTenant()` không truyền tenant ID — kiểm tra kỹ trước khi đụng.
- **Operations live:** không truyền vehicles/routes/drivers cho map & timeline; một số KPI là hằng số; query tài chính đang disable.
- **Settlement list:** search chỉ trên tập đã tải. **Payroll/Optimization entry:** yêu cầu nhập UUID, chưa có run-index.
- **GitNexus index chậm 48 commit so với HEAD** → không dựa vào graph; đọc source.

Danh sách đầy đủ, có ID/priority/acceptance: `docs/plan.md` §3.

---

## 12. Quy trình làm việc cho mỗi task

1. **Xác định task:** nếu từ plan, ghi ID (vd `NAV-003`), priority (P0/P1/P2/BLOCKED), trạng thái (`BACKLOG → VERIFYING → READY → IN_PROGRESS → IN_REVIEW → DONE`). Mặc định mọi task đều `BACKLOG`, không coi là đã làm.
2. **Chuẩn bị:** `git status`; đọc source thật tại HEAD (báo cáo chỉ là baseline); đọc `package.json` → `scripts` để lấy lệnh lint/typecheck/test/e2e **thật** (không đoán tên lệnh); đọc đúng mục liên quan trong tài liệu.
3. **Kiểm tra Definition of Ready:** có route/màn hình liên quan, evidence (`SOURCE`/`FIXTURE`/`LIVE`), biết là chỉ UX hay đổi contract, biết permission/flag/data mode, có acceptance criteria. Còn blocker → làm phần an toàn, ghi rõ phần bị chặn.
4. **Nêu kế hoạch ngắn** (file sẽ sửa, rủi ro) trước khi sửa nhiều file.
5. **Sửa nhỏ, đúng phạm vi.** Ưu tiên sửa file hiện có; không tạo file/tài liệu ngoài yêu cầu.
6. **Viết test:** unit/component (Vitest + Testing Library, đặt cạnh file) và Playwright fixture khi đổi flow. **Bắt buộc có test âm tính**: lỗi API, 403, empty, disabled, double-submit.
7. **Chạy** lint + typecheck + test liên quan. Báo kết quả thật; nếu không chạy được thì nói rõ vì sao.
8. **Không tự đánh `DONE`.** Chỉ đánh sau nghiệm thu; ghi rõ phần chưa live-test.

**Definition of Done tối thiểu:** lint/typecheck/test xanh theo scripts thực tế · có loading/empty/error/focus · không 404 từ CTA · không success giả · không dữ liệu mock không nhãn · đã xem desktop/tablet/mobile cho màn thay đổi · không động tới auth/tenant/role/state machine tài chính ngoài phạm vi.

---

## 13. Cách báo cáo kết quả (trả lời bằng tiếng Việt)

Kết thúc mỗi task, trả lời ngắn gọn theo mẫu:

```md
**Task:** <ID hoặc mô tả>
**Đã làm:** <1–3 dòng>
**File đã sửa:** <danh sách>
**Kiểm thử:** <lệnh đã chạy + kết quả thật> · <test mới thêm>
**Bằng chứng:** SOURCE | FIXTURE | LIVE (nêu rõ loại)
**Chưa xác minh / rủi ro:** <những gì chưa live-test, phụ thuộc API/permission/flag>
**Rollback:** <cách hoàn tác>
```

Nếu phát hiện lỗi/mâu thuẫn mới ngoài phạm vi: **ghi lại** (dùng issue template trong `docs/plan.md` §10.2), không tự sửa lan.

---

## 14. Tuyệt đối không làm

- Bật flag/capability `GATED`; thêm route "cho có"; sửa `roleMatrix`/quyền để làm UI "chạy được".
- Biến mock/static/fixture thành dữ liệu trông như live; dùng fixture để khẳng định backend thành công.
- Đổi state machine tài chính, payroll, settlement, idempotency, hay sửa trực tiếp bản ghi finalized.
- Tự chốt màu primary mới, đổi font, đổi token toàn cục khi chưa được duyệt.
- Thêm dependency, framework UI, thư viện motion/map/state mới.
- Xóa/ghi đè thay đổi chưa commit; chạy lệnh phá hủy git; commit/push khi chưa được yêu cầu.
- Hard-code secret, token, URL môi trường, tenant ID, UUID thật vào source hoặc test.
- Đánh dấu task `DONE` khi chưa kiểm chứng.