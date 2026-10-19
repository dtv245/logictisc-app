# SPRINT 0 — TRIAGE & BASELINE AUDIT REPORT
**LogisticsX Frontend Master UI/UX Improvement Plan**

> **Phiên bản:** `v1.1`  
> **Ngày cập nhật:** 19/10/2026  
> **Trạng thái:** `IN_REVIEW`  
> **Phạm vi:** Sprint 0b — Triage & Baseline Audit (Chỉ đọc code ứng dụng, kiểm chứng chất lượng mã, làm sạch bằng chứng và lập dependency map)  
> **Căn cứ:** `plan.md`, `GENMINI.md` (file thật tại repo), `docs/CURRENT_UI_UX_FLOW_ANALYSIS.md`, source code tại HEAD  

---

## 0. Changelog v1.1 (Trước -> Sau)

| Mục | Trước (v1.0) | Sau (v1.1) |
|---|---|---|
| **Mục 1 (Baseline chất lượng mã)** | Chỉ chạy `typecheck` (báo exit code 2, 3 lỗi TS6133). Chưa chạy các lệnh còn lại. Chưa xác minh nguồn gốc lỗi. | Chạy đủ 4 lệnh thật: `lint` (exit 1, 3 errors + 1 warning), `typecheck` (exit 2, 3 errors), `test` (exit 1, 2 failed / 186 passed files, 17 failed / 1265 passed tests), `test:e2e` (exit 1, 1 failed / 16 passed tests). Xác nhận 3 lỗi TS6133 phát sinh từ working tree chưa commit; phân tích 2 đề xuất xử lý. Cập nhật Gate checklist. |
| **Mục 2 (So sánh layout với video)** | Liệt kê các chi tiết so sánh giả định (F-pattern, camera 3D, instant auto-assign) chưa được đối chiếu thực tế với video. | Viết lại §6 thành hai phần rõ rệt: (A) Hiện trạng layout từ source có file:dòng (`SOURCE`, `BROWSER-FIXTURE`); (B) Khác biệt so với video: ghi rõ "Chưa có đầu vào video; BASE-004 phần đối chiếu video chưa thực hiện được". Đổi trạng thái `BASE-004` thành `Partially verified`. |
| **Mục 3 (Bổ sung ảnh baseline)** | Chỉ có 9 ảnh (Operations mặc định, Loads list, Loads show). Thiếu Operations demo, AI Dispatch, Optimization. | Bổ sung 3 ảnh `operations-demo-*.png` (1440/768/390) chụp bằng spec mới `e2e/capture-demo-baseline.spec.ts` qua fixture `sider-fixture.html`. Màn AI Dispatch và Optimization ghi nhận không chụp được do thiếu fixture và route nằm sau auth/API (`NEEDS-LIVE`). Đo kích thước byte thực tế cho toàn bộ ảnh. |
| **Mục 4 (Kiểm chứng filter URL)** | Ghi các link `/loads?status=...` là `ACTIVE` mà chưa kiểm chứng xem filter có tác dụng hay không. | Lần theo mã nguồn Refine `useTable` (`syncWithLocation: true`) và `querySerializer.ts`. Kết luận: Cả 4 link (`?status=dispatched`, `?status=at_risk`, `?status=delivered`, `?search={kw}`) đều **KHÔNG HOẠT ĐỘNG** ở cấp độ filter (flat param bị bỏ qua). Riêng `at_risk` không tồn tại trong enum `LoadStatus`. Sửa đề xuất NAV-004. |
| **Mục 5 (Chính xác hóa Data Modes)** | Ghi nhầm cờ `sessionStorage.getItem("ops_preview_mode")`; khẳng định `OperationsDashboardPreview` import từ `e2e/fixtures/`; gộp dev proxy với fallback hook. | Đọc `vite.config.ts`: ghi chi tiết mock responses (health, me SUPERADMIN, 10 collections mock, POST/PUT fake), điều kiện kích hoạt và cách nhận diện. Tách riêng "fallback ngầm trong code dashboard" (OPS-002: 94/3/2). Xác minh `useOperationsPreview.ts:18` chỉ đọc `?demo=1` và `OperationsDashboardPreview.tsx` chứa mock data nội bộ, không import `e2e/`. |
| **Mục 6 (Bằng chứng và số liệu đồng đều)** | Ghi "22 CTA" nhưng bảng có 24 dòng. Thiếu file:dòng ở AI Dispatch, Optimization, Fleet. NAV-002 dùng nhãn "CONFLICTING". Còn link `file:///`. | Chuẩn hóa số lượng 24 CTA trên bảng §2 và §4. Bổ sung file:dòng cụ thể cho từng CTA. Phân định rõ gating của Approve/Reject Plan. NAV-002 đổi nhãn thành `SOURCE` và trạng thái `CONFLICTING_EVIDENCE`. NAV-005 tách rõ `/accidents` và `/fleet/mileage-attributions`. Thay toàn bộ link sang dạng tương đối `src/...:line`. |
| **Mục 7 (Quyết định OPEN & Dependency Map)** | Chỉ nêu 3 câu hỏi rời rạc ở mục 8.2. | Liệt kê đủ 8 quyết định OPEN từ `plan.md §5`. Lập bảng Dependency Map đầy đủ: Quyết định -> Task bị chặn -> Hành động an toàn ở Sprint 1. Nêu rõ chủ thể cần trả lời và fallback an toàn. |
| **Mục 8 (Kiểm tra tên file ngữ cảnh)** | Phần căn cứ ghi nguồn là `GENMINI.md` mà chưa xác nhận file nào thực sự tồn tại. | Kiểm tra `ls`: Xác nhận `GEMINI.md` không tồn tại; file thực tế là `GENMINI.md` (21.489 bytes). Giữ nguyên tên file thực tế trong phần Căn cứ, không tự ý đổi tên file. |

---

## 1. Baseline Môi Trường & Chất Lượng Mã Nguồn (BASE-001)

### 1.1. Git State
- **HEAD Commit:** `cff6c8c89b80e5f5501feb4747caf786722a55c8` (*refactor(accidents): move to global structure*)
- **Branch:** `refactor/global-structure`
- **Working Tree State:** Dirty (54 files modified/deleted, 30+ untracked files/directories).
  - Toàn bộ thay đổi chưa commit này là baseline ghi nhận ngày 19/10/2026.
  - **Quy tắc tuân thủ:** Giữ nguyên 100% working tree, không chạy `reset`, `clean`, `checkout .`, hoặc `stash`.

### 1.2. Danh Sách Lệnh Thật & Kết Quả Chạy Thực Tế (package.json scripts)

Tất cả lệnh chạy từ `package.json` trong môi trường hiện tại:

1. **Typecheck:** `npm run typecheck` (`tsc -b`)
   - *Exit code:* `2` (FAIL)
   - *Số lỗi:* 3 errors
   - *Chi tiết lỗi:*
     - `src/components/AppSider.tsx:51:3` - error `TS6133: 'FleetZoneIcon' is declared but its value is never read.`
     - `src/components/AppSider.tsx:61:3` - error `TS6133: 'OperationsZoneIcon' is declared but its value is never read.`
     - `src/components/AppSider.tsx:73:3` - error `TS6133: 'TransportZoneIcon' is declared but its value is never read.`

2. **Lint:** `npm run lint` (`eslint .`)
   - *Exit code:* `1` (FAIL)
   - *Số vấn đề:* 3 errors, 1 warning (tổng 4 problems)
   - *Chi tiết lỗi:*
     - `src/components/AppSider.tsx:51:3` error `'FleetZoneIcon' is defined but never used` (`@typescript-eslint/no-unused-vars`)
     - `src/components/AppSider.tsx:61:3` error `'OperationsZoneIcon' is defined but never used` (`@typescript-eslint/no-unused-vars`)
     - `src/components/AppSider.tsx:73:3` error `'TransportZoneIcon' is defined but never used` (`@typescript-eslint/no-unused-vars`)
     - `src/features/dashboard/hooks/useDriverRanking.ts:57:6` warning `React Hook useMemo has unnecessary dependencies: 'filters.currency', 'filters.from', 'filters.to', and 'sortBy'` (`react-hooks/exhaustive-deps`)

3. **Unit / Component Test:** `npm test` (`vitest run`)
   - *Exit code:* `1` (FAIL)
   - *Tổng hợp:* 2 failed | 186 passed (tổng 188 test files); 17 failed | 1265 passed (tổng 1282 tests). Thời gian chạy: 150.05s.
   - *Danh sách file test fail:*
     - `src/tests/components/AppResponsiveShell.test.tsx` (5 tests failed) - lỗi tìm kiếm phần tử menu/thông báo trong shell responsive khi Sider đổi sang dạng icon rail.
     - `src/tests/components/AppSider.test.tsx` (12 tests failed) - lỗi timeout và query selector do cấu trúc DOM của Sider đang được refactor dở dang trong working tree.

4. **E2E Test:** `npm run test:e2e` (`playwright test`)
   - *Exit code:* `1` (FAIL)
   - *Tổng hợp:* 1 failed | 16 passed (tổng 17 tests trong 6 files). Thời gian chạy: 22.2s.
   - *Test fail:* `e2e/bootstrap.spec.ts:46:1` (*healthy API continues to public diagnostics*). Lý do: Test kỳ vọng chuyển hướng `/diagnostics` nhưng môi trường headless thiếu phiên OIDC live nên redirect về `/login`.
   - *Các file test e2e pass:* `e2e/dashboard-panels.spec.ts` (3/3 pass), `e2e/error-contracts.spec.ts` (7/7 pass), `e2e/loads-show-screenshot.spec.ts` (1/1 pass), `e2e/priority-shipment-card.spec.ts` (2/2 pass), `e2e/sider-screenshot.spec.ts` (1/1 pass).

5. **Build:** `npm run build` (`tsc -b && vite build`)
   - *Ghi chú an toàn:* Bỏ qua không chạy vì `tsc -b` fail (exit 2) và build tạo thư mục `dist/` có thể ảnh hưởng cây thư mục.

### 1.3. Nguồn Gốc 3 Lỗi TS6133 Tại `AppSider.tsx` & Đề Xuất Xử Lý
- **Kiểm chứng nguồn gốc:** Chạy `git diff HEAD src/components/AppSider.tsx` xác nhận 3 import này **không có tại commit HEAD `cff6c8c`**, mà được thêm vào trong đợt refactor dở dang thuộc working tree chưa commit.
- **Phân tích đề xuất:**
  - *Phương án 1 (Khuyến nghị — Ít rủi ro nhất):* Xóa bỏ 3 import không dùng (`FleetZoneIcon`, `OperationsZoneIcon`, `TransportZoneIcon`) khỏi dòng import `src/components/AppSider.tsx:51,61,73`. Vì các icon này chưa từng được render hay gán vào JSX nào, việc bỏ import giải quyết ngay 3 lỗi `TS6133` và 3 lỗi ESLint mà không làm thay đổi DOM hay vỡ test.
  - *Phương án 2 (Rủi ro cao hơn):* Đưa 3 icon này vào các zone tương ứng (`zone:fleet`, `zone:operations`, `zone:transport`). Việc này thay đổi cấu trúc JSX và có thể gây xung đột hiển thị hoặc snapshot test.

---

## 2. Bảng Ma Trận CTA -> Route -> Capability -> Trạng Thái (BASE-002)

Bảng rà soát chi tiết **24 CTA** trên các màn ưu tiên, tách bạch giữa **Trạng thái Route** (URL có được router hỗ trợ không) và **Trạng thái Filter** (tham số query URL có thực sự kích hoạt lọc ở API không):

| Màn hình | Tên CTA / Trigger | Target Route / Action | Quyền / Capability liên quan | Trạng thái Route Runtime | Hiệu lực Filter URL | Ghi chú & Bằng chứng Source |
|---|---|---|---|---|---|---|
| **Operations** | Refresh Header | `dashboardData.refetchAll()` | Read access | `ACTIVE` | N/A | Gọi refetch TanStack Query (`src/features/dashboard/components/DashboardHeader.tsx:38`). |
| **Operations** | Search bar `⌘K` | `/loads?search={kw}` | `loads.list` | `ACTIVE` | **KHÔNG HOẠT ĐỘNG** | Điều hướng đúng tới `/loads` (`src/features/dashboard/components/DashboardHeader.tsx:52`), nhưng Refine `useTable` không phân tích flat param `search`. Chưa có key listener cho `⌘K` (NAV-006, NAV-007). |
| **Operations** | KPI "Đang trên đường" | `/loads?status=dispatched` | `loads.list` | `ACTIVE` | **KHÔNG HOẠT ĐỘNG** | Điều hướng mở trang list (`src/features/dashboard/components/OperationsDashboardView.tsx:66`), nhưng `status=dispatched` không được nạp vào `useTable` filters. |
| **Operations** | KPI "Nguy cơ trễ (At Risk)" | `/loads?status=at_risk` | `loads.list` | `ACTIVE` | **KHÔNG HOẠT ĐỘNG** | Filter không hoạt động VÀ giá trị `at_risk` không tồn tại trong enum `LoadStatus` (`src/components/resources/resourceForms.ts:525`). (`src/features/dashboard/components/OperationsDashboardView.tsx:75`). |
| **Operations** | KPI "Đúng giờ (OTD)" | `/reports/fleet` | `reports.fleet` | `ACTIVE` | N/A | Điều hướng tới route fleet report (`src/features/dashboard/components/OperationsDashboardView.tsx:83`). |
| **Operations** | KPI "Đã giao hôm nay" | `/loads?status=delivered` | `loads.list` | `ACTIVE` | **KHÔNG HOẠT ĐỘNG** | `delivered` có trong enum nhưng flat param `status=delivered` bị `useTable` bỏ qua (`src/features/dashboard/components/OperationsDashboardView.tsx:91`). |
| **Operations** | KPI "Xe sẵn sàng gán" | `/trucks` | `trucks.list` | `ACTIVE` | N/A | Điều hướng mở danh sách xe (`src/features/dashboard/components/OperationsDashboardView.tsx:100`). |
| **Operations** | KPI "Ngoại lệ phát sinh" | `/accidents` | `accidents.list` | `UNROUTED` | N/A | `accidents` không nằm trong `supportedNames` (`src/pages/resourceRegistry.ts:100`). Click dẫn 404 (NAV-005; `src/features/dashboard/components/OperationsDashboardView.tsx:108`). |
| **Operations** | Mini-Map: "Chi tiết bản đồ" | `/map` | N/A | `UNROUTED` | N/A | `src/features/dashboard/components/NetworkMiniMap.tsx:33`: Route `/map` chưa từng được mount trong `AppRouter.tsx` (NAV-003). |
| **Operations** | Timeline: "Mở điều phối" | `/load-board` | N/A | `UNROUTED` | N/A | `src/features/dashboard/components/DispatchTimeline.tsx:44`: Resource `load-board` không có trong `supportedNames` (NAV-004). |
| **Operations** | Brief: Review recommendation | Modal preview | N/A | `ACTIVE` | N/A | Mở modal xem gợi ý (`src/features/dashboard/components/OperationsBrief.tsx:90`), nút confirm bị disabled theo chủ đích. |
| **Operations** | Switch "Mẫu / Thật" | Toggle state | N/A | `ACTIVE` | N/A | Chuyển đổi giữa `OperationsDashboardPreview` và `OperationsDashboardView` qua `?demo=1` (`src/hooks/dashboard/useOperationsPreview.ts:18`). |
| **Load Show** | Nút Quay lại (Back) | `navigate(-1)` | N/A | `ACTIVE` | N/A | Cần ổn định tiêu đề và nút Back khi chuyển các tab (NAV-008; `src/features/loads/components/redesign/ShipmentHeader.tsx:30`). |
| **Load Show** | Chuyển Tabs | Local state | Role matrix | `ACTIVE` | N/A | Hoạt động bình thường giữa các tab Overview, Stops, Docs... (`src/pages/loads/show.tsx:40`). |
| **Load Show** | AI GAP "Fill" | `/loads/edit/:id?focusField=...` | `loads.edit` | `GATED` | N/A | `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false` (`src/components/resources/resourceCapabilities.ts:20`). Router loại bỏ route edit → Dẫn tới 404 (NAV-001; `src/features/loads/components/redesign/ShipmentGapsCard.tsx:18`). |
| **Load Show** | AI GAP "Dismiss" / "Rerun" | Local callback | N/A | `ACTIVE` | N/A | Dismiss ẩn khỏi UI, rerun kích hoạt lại kiểm tra (`src/features/loads/components/redesign/ShipmentGapsCard.tsx:25`). |
| **Load Show** | AI Agent Drawer | Drawer chat | Feature flag `app.ai.gap-enabled` | `ACTIVE` (Mô phỏng) | N/A | UI drawer mở được nhưng trả lời bằng fake setTimeout 400ms (AI-001; `src/components/ai/AiGapChatWidget.tsx:489`). |
| **AI Dispatch** | "Chạy đề xuất mới" | POST API | Quyền điều phối | `ACTIVE` | N/A | Gửi request `POST /api/v1/ai/dispatch/run` (`src/features/ai-dispatch/components/AiDispatchRunForm.tsx:45`, `src/features/ai-dispatch/api/aiDispatch.api.ts:145`). |
| **AI Dispatch** | "Kiểm tra kết nối" (Config) | `testAiConnection` | N/A | `MOCK/STATIC` | N/A | Giả lập thành công sau 500ms không gọi backend thật (`src/features/ai-dispatch/hooks/aiConfigStorage.ts:129`). |
| **AI Dispatch** | "Xem Trip" | `/trips` | `trips.list` | `ACTIVE` (Lệch đích) | N/A | Mở danh sách trips thay vì trip cụ thể do response thiếu `tripId` thật (`src/features/ai-dispatch/components/AiMovementPlanCard.tsx:160`, NAV-009). |
| **AI Dispatch** | Phê duyệt / Từ chối Plan | PATCH API | Role `AI_DISPATCH_APPROVE` | `GATED` | N/A | Bị khóa bởi 3 điều kiện: (1) Quyền roleMatrix `AI_DISPATCH_APPROVE` (`src/providers/permissions/roleMatrix.ts:56`), (2) Tenant key active, (3) Plan state phải là `proposed` (`src/features/ai-dispatch/components/AiMovementPlanCard.tsx:90,134`). Gọi `src/features/ai-dispatch/api/aiDispatch.api.ts:241`. |
| **Optimization** | Wizard tạo lượt tối ưu | `/optimization` | Optimization permissions | `ACTIVE` | N/A | Form submit tạo batch tối ưu (`src/features/optimization/components/OptimizationRunForm.tsx:65`, `src/features/optimization/api/optimization.api.ts:35`). |
| **Optimization** | Candidate Accept | Mutation command | Optimization permissions | `ACTIVE` | N/A | Chấp thuận lộ trình đề xuất, bảo vệ chống xung đột bằng `useFrozenCustomMutation` (`src/features/optimization/components/OptimizationCandidateDrawer.tsx:85`, `src/features/optimization/hooks/useOptimizationActions.ts:17`). |
| **Fleet** | Mileage Attributions link | `/fleet/mileage-attributions` | `fleet.report` | `UNROUTED` | N/A | `src/features/fleet/components/FleetMetricCard.tsx:116`: Route chưa từng được mount trong `AppRouter.tsx`. |

---

## 3. Phân Loại Các Data Modes Ở Runtime (BASE-003)

Hệ thống LogisticsX có 5 cơ chế dữ liệu cần phân biệt rạch ròi:

### 3.1. Production / Live API Mode
- **Cách nhận biết ở runtime:** URL không có `?demo=1`, `window.location.search` không chứa cờ demo. Mọi request HTTP đi qua Axios client nền (`src/providers/api/apiClient.ts`), tự động đính kèm header `Authorization: Bearer <token>`.
- **Dữ liệu đến từ đâu:** Backend Spring Boot qua `/api/...`. Query keys luôn gắn tiền tố `tenantId` để cách ly tenant.
- **Có gọi backend thật không:** CÓ.
- **Nhãn bằng chứng:** `SOURCE` / `NEEDS-LIVE`.

### 3.2. Operations Preview Mode (`?demo=1`)
- **Cách nhận biết ở runtime:** URL chứa query param `?demo=1` (`src/hooks/dashboard/useOperationsPreview.ts:18`). Nút Switch trên đầu trang hiển thị trạng thái "Mẫu" kèm Alert cảnh báo màu cam (`src/pages/dashboard/OperationsDashboardPage.tsx:12-29`).
- **Đính chính v1.0:** *Không có cờ `sessionStorage.getItem("ops_preview_mode")` trong mã nguồn*. Hook hoàn toàn phụ thuộc vào `searchParams.get("demo") === "1"`.
- **Dữ liệu đến từ đâu:** Hằng số tĩnh được khai báo trực tiếp bên trong component `src/components/dashboard/OperationsDashboardPreview.tsx:15-103` (`kpis`, `shipments`, `brief`, `vehicles`, `routes`, `drivers`).
- **Đính chính v1.0:** *Code production `OperationsDashboardPreview.tsx` KHÔNG import từ thư mục `e2e/fixtures/dashboard-reference.data.ts`*. Dữ liệu mẫu được định nghĩa độc lập tại chỗ.
- **Có gọi backend thật không:** KHÔNG. Tuyệt đối không phát sinh request API ghi.
- **Nhãn bằng chứng:** `MOCK/STATIC`.

### 3.3. Dev Proxy Mock Fallback Mode (Vite Dev Server)
- **Cách nhận biết ở runtime:**
  - Response body chứa thông báo đặc thù: `message: "Success (dev mock)"` hoặc `message: "Created successfully (dev mock)"`.
  - Console dev server (terminal chạy Vite) xuất hiện cảnh báo: `⚠️ [vite] Backend API chưa chạy tại http://localhost:8080. Dev proxy đang kích hoạt chế độ Mock Fallback cho /api.`.
- **Điều kiện kích hoạt:** Chỉ chạy ở môi trường phát triển local (`npm run dev`). Kích hoạt khi Vite proxy gặp lỗi kết nối tới backend (`ECONNREFUSED` hoặc status `502`) tại `vite.config.ts:73-268`.
- **Nó trả về những gì:**
  - `GET /api/health`: Trả về `{ application: 'logicstic', database: 'enabled', status: 'UP' }` để vượt qua bootstrap gate (`vite.config.ts:83`).
  - `GET /api/me`: Trả về user mock role `SUPERADMIN`, tenant `local-development` (`vite.config.ts:96`).
  - `GET /api/<resource>`: Trả về danh sách mẫu 2-3 items cho `customers`, `drivers`, `trucks`, `terminals`, `roles`, `employees`, `loads`, `trips`, `invoices`, `fleet/policies` (`vite.config.ts:121-185`).
  - `POST /api/...`: Trả về `code: "CREATED"`, fake id `00000000-0000-0000-0000-000000000099` (`vite.config.ts:230`).
  - `PUT/PATCH /api/...`: Trả về `code: "UPDATED"` (`vite.config.ts:245`).
- **Có gọi backend thật không:** KHÔNG (đây là mock giả lập ở tầng node server dev proxy khi backend offline).
- **Nhãn bằng chứng:** `MOCK/STATIC`.

### 3.4. Fallback Ngầm Trong Code Dashboard (OPS-002)
- **Cơ chế:** Hoàn toàn độc lập với Vite dev proxy. Nằm trực tiếp trong hook logic của frontend: `src/features/dashboard/components/OperationsDashboardView.tsx:47-58`.
- **Hành vi vi phạm:** Khi TanStack Query gọi API thật nhưng backend trả về `undefined` hoặc lỗi (error), code tự động gán fallback: OTD = `94%`, Delays = `3`, Exceptions = `2`.
- **Rủi ro:** Khiến màn hình "Thật" biến lỗi backend thành số liệu giả thành công.
- **Nhãn bằng chứng:** `MOCK/STATIC`.

### 3.5. Playwright Fixture Mode
- **Cách nhận biết ở runtime:** Trình duyệt trỏ trực tiếp vào các file HTML fixture cô lập: `/e2e/fixtures/*.html` (ví dụ `dashboard-panels.html`, `loads-show-fixture.html`, `sider-fixture.html`).
- **Dữ liệu đến từ đâu:** Mock data cục bộ định nghĩa trong `e2e/fixtures/*.tsx` và `e2e/fixtures/dashboard-reference.data.ts`.
- **Có gọi backend thật không:** KHÔNG. Chặn WebGL và API network, dùng thuần túy cho visual test và layout assertions.
- **Nhãn bằng chứng:** `BROWSER-FIXTURE`.

---

## 4. Issue Register Các Vấn Đề P0 (Sprint 1 Pre-flight)

| Task ID | Trạng thái xác minh | Nhãn Evidence | File:Dòng | Blocker & Chủ sở hữu API | Ghi chú & Giải pháp an toàn (Sprint 1) |
|---|---|---|---|---|---|
| `BASE-001` | **Verified** | `SOURCE` | `plan.md:90` | Không có | Baseline đã khóa: commit `cff6c8c`, 54 file working tree dirty được giữ nguyên. |
| `BASE-002` | **Verified** | `SOURCE` / `GATED` / `UNROUTED` | `src/router/AppRouter.tsx:226`, `src/pages/resourceRegistry.ts:100` | Quyết định quyền sửa Load (`OPEN`) | Đã rà soát đủ 24 CTA. Xác nhận 4 route unrouted và 1 route edit bị gated. |
| `BASE-003` | **Verified** | `SOURCE` / `MOCK/STATIC` | `src/hooks/dashboard/useOperationsPreview.ts:18`, `vite.config.ts:73` | Không có | Đã phân tách rõ ràng 5 data modes (Live, Preview `?demo=1`, Dev proxy fallback, Code fallback, Playwright fixture). |
| `BASE-004` | **Partially verified** | `PROPOSAL` / `BROWSER-FIXTURE` | `docs/ux/baseline/` | Chưa có đầu vào video | Ảnh baseline đã có Operations (default + demo), Load list, Load show. AI Dispatch và Optimization thiếu fixture (`NEEDS-LIVE`). Phần đối chiếu video chưa thể thực hiện do thiếu input video. |
| `BASE-005` | **Verified** | `NEEDS-LIVE` | `plan.md:94` | Cần tài khoản tenant & live server | Môi trường agent chỉ có local client; ghi nhận trung thực `NEEDS-LIVE`. |
| `NAV-001` | **Verified** | `GATED` | `src/features/loads/components/redesign/ShipmentGapsCard.tsx:18`, `src/components/resources/resourceCapabilities.ts:20` | Quyết định quyền sửa Load runtime (`OPEN — BLOCKER`) | Nút "Fill" dẫn tới route `/loads/edit/:id` bị khóa → 404. Giải pháp Sprint 1: Vô hiệu hóa CTA kèm Tooltip + `aria-disabled`, không tự ý bật flag. |
| `NAV-002` | **CONFLICTING_EVIDENCE** | `SOURCE` | `src/features/loads/components/redesign/ShipmentGapsCard.tsx:18` vs `src/components/ai/AiGapChatWidget.tsx:308` | Phụ thuộc `NAV-001` | Bất đồng bộ query parameter: `ShipmentGapsCard` truyền `?focus=`, `AiGapChatWidget` truyền `?focusField=`. Trong khi `src/pages/loads/edit.tsx:39` chỉ đọc `focusField`. Giải pháp: Thống nhất quy ước `?focusField=`. |
| `NAV-003` | **Verified** | `UNROUTED` | `src/features/dashboard/components/NetworkMiniMap.tsx:33` | Kế hoạch route `/map` (`OPEN — BLOCKER`) | Nút "Chi tiết bản đồ" gọi `navigate('/map')` không tồn tại → 404. Giải pháp Sprint 1: Vô hiệu hóa nút và hiện tooltip "Tính năng bản đồ toàn màn hình đang phát triển". |
| `NAV-004` | **Verified** | `UNROUTED` | `src/features/dashboard/components/DispatchTimeline.tsx:44` | Kế hoạch route `/load-board` (`OPEN — BLOCKER`) | Nút "Mở điều phối" gọi `navigate('/load-board')` chưa mount → 404. Đính chính đề xuất v1.0: Không chuyển hướng sang `/loads?status=dispatched` vì filter này chưa hoạt động; thay vào đó điều hướng sang `/loads` thuần hoặc vô hiệu hóa kèm lý do. |
| `NAV-005` | **Verified** | `UNROUTED` | `src/features/dashboard/components/OperationsDashboardView.tsx:108` và `src/features/fleet/components/FleetMetricCard.tsx:116` | Kế hoạch route `/accidents` và `/fleet/mileage-attributions` (`OPEN — BLOCKER`) | Cả 2 route `/accidents` và `/fleet/mileage-attributions` đều không có trong `supportedNames`. Giải pháp Sprint 1: Vô hiệu hóa link hoặc trỏ tới danh sách có filter hợp lệ. |
| `OPS-001` | **Verified** | `MOCK/STATIC` | `src/features/dashboard/components/OperationsDashboardView.tsx:62-102` | API Dashboard Live (`OPEN — BLOCKER`) | Màn hình "Thật" nhưng hardcode 3 KPI: Đang trên đường (28), Đã giao (46), Xe sẵn sàng (14). Giải pháp Sprint 1: Gắn nhãn dữ liệu mô phỏng rõ ràng. |
| `OPS-002` | **Verified** | `SOURCE` / `MOCK/STATIC` | `src/features/dashboard/components/OperationsDashboardView.tsx:47-58` | API Dashboard Live (`OPEN — BLOCKER`) | Fallback âm thầm khi API fail/empty: OTD -> 94, Delays -> 3, Exceptions -> 2. Giải pháp Sprint 1: Khi API lỗi, hiển thị trạng thái `Chưa khả dụng` (Unavailable) có nút Thử lại. |
| `AI-001` | **Verified** | `MOCK/STATIC` | `src/features/ai-dispatch/hooks/aiConfigStorage.ts:128`, `src/components/ai/AiGapChatWidget.tsx:489` | API AI backend integration | Ping 500ms giả lập thành công; chat 400ms giả lập phản hồi. Giải pháp Sprint 1: Gắn nhãn rõ "Mô phỏng thử nghiệm", không tuyên bố đã kết nối thật. |
| `DS-001` | **Verified** | `SOURCE` | `src/styles/_variables.scss:18`, `src/components/AntdLocaleProvider.tsx:32`, `src/features/dashboard/components/OperationsDashboardView.scss:2` | Quyết định Brand Primary (`OPEN`) | Đã lập bảng token hiện trạng. Giữ nguyên màu, không tự ý chốt màu mới khi chưa duyệt. |

---

## 5. Bảng Token Màu Thực Tế Hiện Tại (DS-001)

> **Cảnh báo:** Hiện trạng màu sắc đang bị phân mảnh giữa 4 hệ thống khác nhau. Theo quy định tại `plan.md §5`, **không tự chốt màu primary mới** ở Sprint 0 và giữ nguyên mã màu tại các module.

| Tên Token / Biến | Giá trị Hex / RGB | Nơi khai báo | Nơi sử dụng thực tế | Mô tả hiện trạng & Rủi ro |
|---|---|---|---|---|
| `$color-primary` (Global Blue) | `#2563eb` (Blue 600) | `src/styles/_variables.scss:18` | SCSS chung, AppLayout, nút chuẩn, link | Màu primary chính thức của design system nền tảng. |
| `$color-primary-hover` | `#1d4ed8` (Blue 700) | `src/styles/_variables.scss:19` | Hover states | Tương phản tốt trên nền trắng (WCAG AAA). |
| `$color-primary-active` | `#1e40af` (Blue 800) | `src/styles/_variables.scss:20` | Active states | |
| **Ant Design Default Blue** | `#1677ff` | Ant Design 5 Core (chưa config) | Nút AntD, Checkbox, Radio, Switch, Table pagination | `src/components/AntdLocaleProvider.tsx:32` chưa inject theme token, khiến các component AntD lệch màu nhẹ so với CSS `$color-primary`. |
| `--ops-purple` (Operations Purple) | `#703eff` | `src/features/dashboard/components/OperationsDashboardView.scss:2` | Dashboard Header, tabs, filter button, brief recommendation | Màu tím đặc thù theo layout video của màn Operations. Chưa nằm trong `_variables.scss`. |
| `Load AI Purple` | `#7C3AED` / `#7c3aed` (Violet 600) | Hardcode inline & SCSS redesign | `src/features/loads/components/redesign/ShipmentHeroCard.tsx:88`, `src/features/loads/components/redesign/ShipmentAgentCard.tsx:173`, `src/components/ai/AiGapChatWidget.tsx:900` | Màu tím dùng cho các thành phần mang tính năng AI và màn Shipment Detail mới. |
| `$color-success` | `#16a34a` (Green 600) | `src/styles/_variables.scss:26` | Status Delivered, Completed, Positive KPI | Trạng thái tích cực, đồng nhất toàn app. |
| `$color-warning` | `#d97706` (Amber 600) | `src/styles/_variables.scss:31` | Status At Risk, Pending, Warning KPI | Cảnh báo cần chú ý, đạt chuẩn tương phản. |
| `$color-error` | `#dc2626` (Red 600) | `src/styles/_variables.scss:36` | Status Cancelled, Failed, Delayed, Error KPI | Trạng thái nguy hiểm, sự cố. |
| `$color-info` | `#0284c7` (Sky 600) | `src/styles/_variables.scss:41` | Status In Transit, Info tags, Notification dots | Trạng thái thông tin vận hành. |
| `$color-neutral` | `#64748b` (Slate 500) | `src/styles/_variables.scss:46` | Draft, Unassigned, Inactive | Trạng thái trung tính, văn bản thứ cấp. |

---

## 6. Hiện Trạng Layout Mã Nguồn & Tình Trạng Đối Chiếu Video (BASE-004)

### (A) Hiện trạng layout từ source (Đã kiểm chứng)
1. **Grid 12 cột cho Operations Dashboard (`SOURCE`):**
   - Đã được triển khai bằng CSS Grid trong `src/features/dashboard/components/OperationsDashboardView.scss:32-47`.
   - Cấu trúc: `ops-grid-area-header` (toàn chiều rộng), `ops-grid-area-kpi` (toàn chiều rộng), `ops-grid-area-priority` (8 cột), `ops-grid-area-brief` (4 cột), `ops-grid-area-map` (4 cột), `ops-grid-area-timeline` (8 cột).
2. **Responsive Breakpoints (`SOURCE`, `BROWSER-FIXTURE`):**
   - Desktop 1440px: Giữ nguyên 12 cột, 2 hàng chính bên dưới header/KPI.
   - Tablet 1024px / 768px: Co giãn linh hoạt; timeline và priority card co lại theo chiều rộng, không bị tràn ngang (`e2e/dashboard-panels.spec.ts:44-60`).
   - Mobile 390px / 320px: Toàn bộ panel chuyển sang dạng 1 cột xếp chồng (`OperationsDashboardView.scss:115-140`).
3. **Thành phần độc lập (`SOURCE`):**
   - `PriorityShipmentCard` (`src/features/dashboard/components/PriorityShipmentCard.tsx:1-120`): Chứa thông tin đơn hàng, tiến trình điểm dừng, chỉ số tốc độ/nhiên liệu/nhiệt độ.
   - `OperationsBrief` (`src/features/dashboard/components/OperationsBrief.tsx:1-150`): Tóm tắt nguyên nhân trễ, danh sách hành động đề xuất.
   - `NetworkMiniMap` (`src/features/dashboard/components/NetworkMiniMap.tsx:1-49`): Bản đồ mạng lưới Leaflet hiển thị marker xe và đường nối.
   - `DispatchTimeline` (`src/features/dashboard/components/DispatchTimeline.tsx:1-74`): Trục thời gian theo giờ với các block lịch chạy của tài xế.

### (B) Khác biệt so với video
> **Chưa có đầu vào video; BASE-004 phần đối chiếu video chưa thực hiện được.**  
> *(Ghi nhận theo `docs/CURRENT_UI_UX_FLOW_ANALYSIS.md:13`: "Không có reference video trong đầu vào; tài liệu này tạo baseline để so sánh sau, không nhận định thiết kế nào đã giống/khác video".)*

---

## 7. Ảnh Baseline Đã Lưu Trữ & Trạng Thái Màn Thiếu (BASE-004)

### 7.1. Danh mục ảnh baseline thực tế đã kiểm tra (`ls -la docs/ux/baseline/`)

Tất cả 12 file ảnh tồn tại thật trên đĩa, được đo kích thước chính xác:

| Tên File | Viewport | Kích thước File | Nguồn Fixture / Quyền | Nhãn Evidence |
|---|---|---|---|---|
| `operations-default-1440.png` | 1440 × 1000 | 227.747 bytes | `e2e/fixtures/dashboard-panels.html` | `BROWSER-FIXTURE` |
| `operations-default-768.png` | 768 × 1000 | 347.488 bytes | `e2e/fixtures/dashboard-panels.html` | `BROWSER-FIXTURE` |
| `operations-default-390.png` | 390 × 1000 | 208.872 bytes | `e2e/fixtures/dashboard-panels.html` | `BROWSER-FIXTURE` |
| `operations-demo-1440.png` | 1440 × 900 | 326.313 bytes | `e2e/fixtures/sider-fixture.html?route=/operations?demo=1` | `BROWSER-FIXTURE` |
| `operations-demo-768.png` | 768 × 1024 | 165.701 bytes | `e2e/fixtures/sider-fixture.html?route=/operations?demo=1` | `BROWSER-FIXTURE` |
| `operations-demo-390.png` | 390 × 844 | 82.663 bytes | `e2e/fixtures/sider-fixture.html?route=/operations?demo=1` | `BROWSER-FIXTURE` |
| `loads-list-1440.png` | 1440 × 900 | 73.831 bytes | `e2e/fixtures/sider-fixture.html?route=/loads` | `BROWSER-FIXTURE` |
| `loads-list-768.png` | 1024 × 768 | 64.135 bytes | `e2e/fixtures/sider-fixture.html?route=/loads` | `BROWSER-FIXTURE` |
| `loads-list-390.png` | 390 × 844 | 38.829 bytes | `e2e/fixtures/sider-fixture.html?route=/loads` | `BROWSER-FIXTURE` |
| `loads-show-1440.png` | 1440 × 900 | 182.269 bytes | `e2e/fixtures/sider-fixture.html?route=/loads/show/101` | `BROWSER-FIXTURE` |
| `loads-show-768.png` | 1024 × 768 | 135.136 bytes | `e2e/fixtures/sider-fixture.html?route=/loads/show/101` | `BROWSER-FIXTURE` |
| `loads-show-390.png` | 390 × 844 | 71.157 bytes | `e2e/fixtures/sider-fixture.html?route=/loads/show/101` | `BROWSER-FIXTURE` |

### 7.2. Các Màn Chưa Thể Chụp Ảnh & Lý Do
1. **AI Dispatch (`/ai-dispatch`):**
   - *Lý do:* Không có file fixture HTML/TSX độc lập trong `e2e/fixtures/`. Route được bảo vệ bởi `ProtectedRoute` và phụ thuộc vào API backend `/api/v1/ai/dispatch/run`. Tuyệt đối không dựng ảnh giả lập khi chưa có môi trường render an toàn.
   - *Nhãn:* `NEEDS-LIVE`.
2. **Optimization (`/optimization`):**
   - *Lý do:* Không có file fixture HTML/TSX độc lập trong `e2e/fixtures/`. Route phụ thuộc vào permission `optimization` và API endpoint backend.
   - *Nhãn:* `NEEDS-LIVE`.

---

## 8. Gate Checklist, Quyết Định OPEN & Dependency Map

### 8.1. Gate Checklist (Cập nhật trung thực)

- [x] Baseline Git commit (`cff6c8c`), 54 file working tree dirty và npm scripts được xác nhận chính xác.
- [ ] **Typecheck / Lint / Test baseline:** **ĐANG FAIL** (Typecheck exit code 2 với 3 lỗi TS6133; ESLint exit code 1 với 3 errors + 1 warning; Vitest exit code 1 với 2 file / 17 tests failed; Playwright exit code 1 với 1 test failed). Cần phương án xử lý 3 import thừa tại `AppSider.tsx`.
- [x] Toàn bộ 24 CTA trên các màn ưu tiên đã được audit đường dẫn và trạng thái.
- [x] Toàn bộ 8 task P0 (`NAV-001`..`005`, `OPS-001`, `OPS-002`, `AI-001`) và `DS-001` đã được xác minh rõ nguyên nhân và file:dòng.
- [x] Bảng ma trận token màu thực tế đã hoàn thành, không có màu mới nào bị tự ý đưa vào.
- [ ] **BASE-004 Visual Baseline & Đối chiếu Video:** **MỚI ĐẠT MỘT PHẦN** (Đã bổ sung ảnh Operations demo; nhưng AI Dispatch và Optimization thiếu fixture; chưa có đầu vào video để đối chiếu).
- [x] Không có bất kỳ file code ứng dụng nào bị sửa đổi trong Sprint 0 / 0b.

---

### 8.2. Danh Sách Đầy Đủ 8 Quyết Định OPEN (`plan.md §5`)

| STT | Quyết định | Tác động | Chủ thể cần quyết định | Nếu không trả lời thì Sprint 1 làm gì? |
|---|---|---|---|---|
| 1 | **Brand primary (DS-002):** Giữ `#2563eb` (Blue) hay chuyển sang tím `#703eff` / `#7C3AED`? | DS tokens + toàn bộ giao diện | Người dùng / Product Owner | Giữ nguyên `$color-primary: #2563eb`. Chưa inject màu tím vào AntD `ConfigProvider`. |
| 2 | **Quyền / API sửa core Load ở runtime (NAV-001, NAV-002, LOAD-005)** | `NAV-001`, `NAV-002`, `LOAD-005` | Chủ sở hữu Backend API | Giữ `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false`. Vô hiệu hóa nút "Fill" kèm tooltip "Tính năng chỉnh sửa đơn hàng đang tạm khóa" + `aria-disabled`. Chuẩn hóa URL sang `?focusField=`. |
| 3 | **`/map`, `/load-board`, mileage-attributions có kế hoạch route/backend không?** | `NAV-003`, `NAV-004`, `NAV-005`, `FLT-001` | Người dùng & Backend Team | Không mount route mới. Vô hiệu hóa CTA hoặc chuyển hướng an toàn về `/loads` (không kèm query param vô hiệu). |
| 4 | **API Dashboard có KPI / vehicles / drivers / brief thật không?** | `OPS-001`, `OPS-002`, `OPS-003..006` | Chủ sở hữu Backend API | Chỉ làm phần UI states: gắn nhãn `(Mẫu)` cho KPI hardcode; khi API lỗi/empty hiển thị `Chưa khả dụng` (Unavailable) thay vì fallback 94/3/2. |
| 5 | **Contract deep-link cho AI plan / Trip / Notification** | `NAV-009..011`, `AI-003`, `NOT-001` | Chủ sở hữu Backend API | Không tự chế ID giả; nếu thiếu `tripId` thật từ response thì mở danh sách Trips kèm thông báo trung thực. |
| 6 | **Documents upload + server filter được duyệt chưa?** | `DOC-001..003` | Người dùng & Backend Team | Giữ cờ `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED = false`; chỉ lọc trên trang client hiện tại. |
| 7 | **Phạm vi redesign (Sprint 3–5):** Chỉ visual hierarchy hay đổi cả workflow nghiệp vụ? | Sprint 3, 4, 5 | Người dùng / Product Owner | Chỉ chỉnh sửa visual hierarchy, layout CSS grid, trạng thái loading/empty/error; giữ nguyên state machine và workflow. |
| 8 | **Vai trò / tenant / bộ dữ liệu nào dùng để UAT?** | Tất cả milestone test & nghiệm thu | Người dùng / QA Lead | Kiểm tra bằng Playwright fixture độc lập; các phần đòi hỏi backend đánh dấu rõ `NEEDS-LIVE`. |

---

### 8.3. Bảng Dependency Map (Quyết Định -> Task Bị Chặn -> Hành Động An Toàn Sprint 1)

```text
+------------------------------------+--------------------------+-------------------------------------------------------------+
| Quyết Định Đang OPEN               | Task Bị Chặn             | Hành Động An Toàn Sprint 1 (Khi quyết định vẫn OPEN)        |
+------------------------------------+--------------------------+-------------------------------------------------------------+
| 1. Brand Primary (DS-002)          | DS-002                   | Giữ nguyên #2563eb; không inject đổi màu AntD theme token.  |
| 2. Quyền sửa core Load ở runtime   | NAV-001, NAV-002         | Vô hiệu hóa nút Fill (tooltip + aria-disabled).             |
|                                    |                          | Thống nhất chuẩn URL parameter sang ?focusField=.           |
| 3. /map, /load-board, accidents    | NAV-003, NAV-004, NAV-005| Vô hiệu hóa nút "Chi tiết bản đồ" & link "Ngoại lệ".       |
|                                    |                          | "Mở điều phối" chuyển về /loads (bỏ status=dispatched vô hiệu). |
| 4. API Dashboard Live Data         | OPS-001, OPS-002         | Gắn nhãn mô phỏng cho 3 KPI hardcode (28, 46, 14).         |
|                                    |                          | Bỏ fallback 94/3/2; API fail -> hiển thị "Chưa khả dụng".  |
| 5. AI Backend Integration          | AI-001                   | Gắn nhãn rõ "Mô phỏng thử nghiệm" cho ping 500ms & chat.   |
+------------------------------------+--------------------------+-------------------------------------------------------------+
```
