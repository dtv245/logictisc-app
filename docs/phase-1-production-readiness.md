# Phase 1 — Lộ trình còn lại tới production

Tài liệu này là bảng theo dõi tiến độ cho toàn bộ phần việc còn lại của
LogisticsX frontend. Nó kế thừa `phase-0-foundation.md` (đã xong) và liệt kê
mọi hạng mục chặn việc phát hành production.

**Quy ước đánh dấu**

| Ký hiệu | Nghĩa |
|---|---|
| `[ ]` | Chưa làm |
| `[~]` | Đang làm |
| `[x]` | Xong và đã verify |
| `[!]` | Blocked — không thể xong từ phía frontend |

Mỗi hạng mục ghi kèm **cách verify**. Một hạng mục chỉ được đánh `[x]` khi
lệnh verify của nó chạy sạch.

**Nguyên tắc bất biến** (không được vi phạm khi làm bất kỳ hạng mục nào):
`.agents/rules/frontend-engineering.md`, `.agents/rules/screen-api-loading.md`,
`.agents/rules/types-architecture.md`, `.agents/rules/refine-feature-architecture.md`.

---

## Giai đoạn 1 — Khôi phục nền tảng kiểm thử ✅ HOÀN THÀNH

> **Trạng thái ban đầu (2026-09-21):** `npm test` báo `Test Files no tests` và
> `35 errors` — toàn bộ test suite không chạy được. `npm run typecheck` pass,
> nên nhánh trông "xanh" một cách sai lệch. (`npm run lint` thì **không** pass —
> xem hạng mục 1.7.)
>
> **Trạng thái sau khi sửa:** **145/145 test pass, 35/35 file, 0 error.**
> Có 4 nguyên nhân độc lập chồng lên nhau; phải sửa hết cả 4 mới chạy được.

- [x] **1.1 — Sửa đường dẫn `setupFiles`**
  `vite.config.ts` trỏ `setupFiles: ['./src/test/setup.ts']` (số ít) nhưng file
  thật nằm ở `src/tests/setup.ts` (số nhiều). Alias `@test` → `./src/test` trong
  `tsconfig.app.json` và `vite.config.ts` cũng trỏ vào thư mục không tồn tại.
  Alias `@test` không được dùng ở đâu trong `src/` — config chết.
  **Đã sửa:** cả ba chỗ về `src/tests`.
  *Verify:* `grep -rn "src/test/" vite.config.ts tsconfig.app.json` → sạch ✅
  *Lưu ý:* sửa xong test **vẫn hỏng** y nguyên 35 error — đây chỉ là nguyên nhân đầu.

- [x] **1.2 — Gỡ chặn version Node ↔ jsdom**
  `jsdom@30.1.0` khai báo `engines.node: ^22.22.2 || ^24.15.0 || >=26.0.0`, kéo
  theo `undici@8.10.2` cần Node `>=22.19.0`. Máy đang chạy **Node 20.20.2** nên
  nạp jsdom ném `TypeError: webidl.util.markAsUncloneable is not a function` —
  thông báo trông như bug nội bộ jsdom nhưng thực chất là version gate.
  **Đã chọn hướng (a):** cài Node 22 LTS qua nvm. Máy đã có sẵn `v22.23.2`,
  đặt làm `nvm alias default 22`. Thêm `.nvmrc` (= `22`) để bug này không tái diễn.
  *Verify:* `npm test` collect được file test ✅

- [x] **1.3 — Sửa entry point của `jest-dom`**
  `src/tests/setup.ts` import `@testing-library/jest-dom` (entry mặc định). Entry
  này gọi `expect.extend()` dựa vào `expect` **toàn cục** kiểu Jest, trong khi dự
  án không bật `globals` và mọi test file đều `import { expect } from "vitest"`.
  → `ReferenceError: expect is not defined`, cả 35 file fail.
  **Đã sửa:** đổi sang entry `@testing-library/jest-dom/vitest`.

- [x] **1.4 — Bổ sung `afterEach(cleanup)` cho React Testing Library**
  Cơ chế auto-cleanup của RTL dựa vào một `afterEach` toàn cục, chỉ tồn tại khi
  Vitest bật `globals`. Dự án không bật → DOM của test trước tích tụ vào
  `document.body`, khiến `getByRole`/`getByText` ở test sau khớp nhiều phần tử
  và ném `Found multiple elements`. Đây là nguyên nhân của 6 test fail cuối cùng.
  **Đã sửa:** gọi `cleanup()` tường minh trong `afterEach`.

- [x] **1.5 — Polyfill `matchMedia` và `ResizeObserver`**
  jsdom không cài hai API này, nhưng Ant Design cần chúng khi render
  (`Grid.useBreakpoint`, `_util/responsiveObserver`, Table/Select/Form).
  Thiếu chúng thì mọi component test render antd đều lỗi khi mount.
  **Đã sửa:** thêm stub trong `src/tests/setup.ts`.

- [x] **1.6 — Cài `@vitest/coverage-v8`**
  Script `test:coverage` đã khai báo trong `package.json` nhưng dependency chưa
  được cài → `MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'`.
  **Đã sửa:** cài `@vitest/coverage-v8@2.1.9` khớp đúng vitest 2.1.9.
  **Baseline coverage lần đầu:** `% Stmts 64.83 | % Branch 77.54 | % Funcs 55.25 | % Lines 64.83`
  (mốc để so sánh về sau).

- [x] **1.7 — Xác nhận test suite xanh** ✅
  *Verify:* `npm test` → `Test Files 35 passed (35)`, `Tests 145 passed (145)`, `Errors 0`.

- [x] **1.8 — Sửa 2 lỗi ESLint đang tồn tại**
  `npm run lint` **không** pass. Cả hai lỗi đều nằm trong code chưa commit sẵn có
  trên nhánh, không liên quan tới Giai đoạn 1:
  - `src/components/AppSider.tsx:10:26` — `'_props' is defined but never used`.
    **Đã sửa:** khai báo kiểu tường minh
    `FC<RefineThemedLayoutV2SiderProps>` và bỏ tham số không dùng. Cách này giữ
    đúng hợp đồng của slot `Sider` trong `ThemedLayoutV2` (nơi component được
    truyền vào) mà không cần nới lỏng rule ESLint.
  - `src/features/notifications/components/NotificationHeaderIcon.tsx` —
    `react-refresh/only-export-components`: file vừa export component vừa export
    hàm `playNotificationSound`.
    **Đã sửa:** tách hàm sang `src/features/notifications/notificationSound.ts`;
    cập nhật `features/notifications/index.ts` và import trong test.
  - Thêm `coverage`, `playwright-report`, `test-results` vào `globalIgnores` của
    `eslint.config.js` (khớp `.gitignore`) — đây là vệ sinh cấu hình cho thư mục
    sinh tự động, **không** nới lỏng rule nào.
  *Verify:* `npm run lint` → 0 problem ✅

- [ ] **1.9 — Cân nhắc thêm `engines` vào `package.json`**
  `.nvmrc` chỉ giúp người dùng nvm. Thêm `"engines": { "node": ">=22.22.2" }` sẽ
  khiến npm cảnh báo trên Node cũ. Cân nhắc tác động lên CI trước khi thêm.
  *Verify:* quyết định được ghi lại.

- [ ] **1.10 — Lưu ý về `PATH` trong session hiện tại**
  Terminal đang chạy Claude Code thừa hưởng `PATH` trỏ thẳng vào
  `~/.nvm/versions/node/v20.20.2/bin`, nên `nvm alias default 22` **không** có
  tác dụng trong session đó. Terminal mới mở sẽ dùng Node 22. Nếu gặp lại lỗi
  jsdom cũ, kiểm tra `node --version` trước tiên.
  *Verify:* mở terminal mới, `node --version` → v22.

---

## Giai đoạn 2 — Đồng bộ tài liệu với code ✅ HOÀN THÀNH

> `docs/adr/001-unified-runtime-foundation.md` mô tả runtime nằm ở
> `src/app/App.tsx`, `src/core/api`, `src/core/permissions`. Các đường dẫn này
> **không còn tồn tại** (`ls src/app src/core` → No such file) và đã bị
> `frontend-engineering.md` cấm tạo. Code thật nằm ở `src/App.tsx`,
> `src/providers/api/`, `src/providers/permissions/`.
>
> Phần *quyết định* trong ADR vẫn đúng và **đã được giữ nguyên không sửa một
> chữ**: OIDC + PKCE, token trong memory, không gửi `X-Tenant`, `PUT` cho
> update, page 1-based, envelope `ApiResponse.data`, CORS. Chỉ đường dẫn sai.

- [x] **2.1 — Cập nhật đường dẫn trong ADR-001**
  **Đã sửa:**
  - `src/app/App.tsx` → `src/App.tsx` (câu "Use one composition rooted at…").
  - Sơ đồ composition viết lại kèm đường dẫn thật: `src/main.tsx` →
    `src/locales` → `src/App.tsx` → `src/config` → `src/providers/{auth,api}` →
    `src/router`.
  - `core/api` → `src/providers/api`; `core/permissions` → `src/providers/permissions`.
  - Thêm khối **"Path update — 2026-09-21"** ngay sau Context, nói rõ bố cục
    `src/app/` + `src/core/` đã bị bỏ và hiện bị cấm, để người đọc sau không đi
    tìm thư mục không tồn tại.
  *Verify:* `grep -n "src/app\|src/core"` chỉ còn trong khối Context lịch sử và
  chính ghi chú đó — đúng như mong đợi ✅

- [x] **2.2 — Cập nhật `foundation-integration-contract.md`**
  ⚠️ **Đính chính:** hạng mục này ban đầu tôi ghi rằng contract chứa câu
  "The new `core/api` client is the only production transport". **Sai** — câu đó
  nằm trong **ADR-001**, không phải contract, và đã được sửa ở hạng mục 2.1.
  `grep -n "core/" docs/foundation-integration-contract.md` vốn đã không có kết quả.
  Công việc thật sự cần làm ở file này:
  - Thêm mục **"Transport and authorization"** trỏ tới `src/providers/api/` và
    `src/providers/permissions/` — trước đây contract không nói client nằm ở đâu.
  - Ghi rõ nguồn sự thật của bảng resource là `foundationApiResources` trong
    `src/pages/resourceRegistry.ts`, kèm cảnh báo rằng resource vắng mặt ở đó
    thì không có route/menu dù page component có tồn tại.
  - Ghi rõ route khai báo ở `src/router/AppRouter.tsx` theo hằng số trong
    `src/constants/routes.ts`.
  - Nêu rõ 3 resource read-only và việc `notifications` đặt `canDelete: false`.

- [x] **2.3 — Đối chiếu bảng resource trong contract với `resourceRegistry.ts`**
  Bảng trong contract thiếu **1** resource: `roles` (`/api/roles`, filter
  `search`, sort `name`). Không phải "thiếu `drivers`, `roles`" như tôi ghi ban
  đầu — `drivers` đã có sẵn trong bảng.
  **Đã sửa:** thêm dòng `roles`.
  *Verify:* script so sánh từng trường `collectionPath` / `allowedFilterFields` /
  `allowedSortFields` giữa code và bảng → **khớp hoàn toàn, 12 resource** ✅

---

## Giai đoạn 3 — Tuân thủ i18n 🟡 ĐANG LÀM

> ⚠️ **Đính chính nguồn rule.** Bản trước của mục này ghi rule 20.1 nằm trong
> `.agents/rules/refine-feature-architecture.md`. **Sai.** Rule 20.1–20.4
> ("Cấm hardcode text hiển thị", "Title bắt buộc dùng locale key", "Cấu trúc locale
> theo feature", "Locale key phải có cấu trúc rõ ràng") nằm ở **`.codex/AGENTS.md`**
> dòng 1261 trở đi. File `refine-feature-architecture.md` chỉ có mục 19 "i18n
> Ownership" (dòng 822), và mục này còn mô tả `app/i18n/`, `common/i18n/` — những
> thư mục **đã bị cấm** bởi `frontend-engineering.md`. Tức mục 19 ấy cũng đã lỗi thời.

> ⚠️ **Đính chính phạm vi.** Bản trước ghi Giai đoạn 3 chỉ có "hai chỗ vi phạm".
> Quét thật (tách comment khỏi chuỗi hiển thị) cho kết quả: **138 dòng chứa tiếng
> Việt có thể hiển thị**, trên 30 file — không phải 2. 536 dòng còn lại là comment
> tiếng Việt, **hợp lệ**, không thuộc phạm vi rule 20.1.

### Quyết định thiết kế cho 3.1 (đã chốt khi triển khai)

`createCrudColumns` được gọi ở **cấp module** nên không thể dùng hook. Nhưng
`App.tsx:192` mở `changeLanguage` ra ngoài và `AppBootstrap.tsx:41` gọi
`i18n.changeLanguage(locale)` **sau khi** module đã import — nên dịch ở cấp module
sẽ **luôn sai ngôn ngữ** (và không bao giờ cập nhật khi đổi ngôn ngữ).

Vì vậy đã chọn: `createCrudColumns` giữ nguyên chữ ký nhưng đổi `title: string`
thành `titleKey: string` (khoá locale), và việc dịch tập trung tại
`useLocalizedColumns` — hook được `ResourceListPage` gọi lúc render.
Cách này tránh phải sửa 20 file columns + 20 page + 20 barrel.

- [x] **3.1 — Chuyển title của `columns.tsx` sang locale key**
  **82 title trên 19 file** đã đổi từ `title: "Số load"` sang
  `titleKey: "columns.loads.number"`.
  - `src/components/crudColumns.tsx`: `title` → `titleKey`, thêm type `CrudColumn`.
  - `src/components/useLocalizedColumns.ts` (mới): dịch `titleKey` bằng
    `useTranslation`, **bỏ** `titleKey` khỏi object để khoá không lọt ra DOM.
  - `src/components/ResourceListPage.tsx`: dùng hook trên.
  - `src/features/products/components/columns.tsx`: đổi từ hằng số
    `productColumns` sang hook `useProductColumns()` (feature này tự dựng
    `<Table>`, không qua `ResourceListPage`).

  *Verify:* `npx vitest run src/tests/components/useLocalizedColumns.test.tsx`
  → **4/4 pass**, gồm ca đổi ngôn ngữ lúc đang chạy và ca chống lộ khoá ra DOM. ✅

- [x] **3.2 — Chuyển text trong `NotificationHeaderIcon.tsx` sang locale key**
  5 chuỗi đã thay: tiêu đề + `aria-label` dùng chung `resources.notifications`;
  `markAllAsRead` / `empty` / `viewAll` dùng khối `notifications.*` mới.
  *Verify:* `grep -nP '[àáảãạăâđêôơư]' src/features/notifications/components/NotificationHeaderIcon.tsx`
  → chỉ còn **comment**, không còn chuỗi hiển thị. ✅

- [x] **3.3 — Bổ sung locale key cho `en` và `vi`**
  Đã thêm vào cả `vi.ts` và `en.ts`: khối `columns` (82 key + `actions`),
  `crud` (`emptyValue`, `editTitle`, `viewTitle`, `loadError`, `selectPlaceholder`,
  `identifier`, `invoiceOption`, `invoiceOptionFallback`), `notifications`,
  `products`, và các key lẻ `common.navigate` / `common.navigatePlaceholder` /
  `common.loading` / `errors.httpStatus` / `auth.loginSuccess` /
  `auth.demoUserName` / `actions.save`.
  Đổi luôn các chuỗi hiển thị ngoài columns: `ResourceListPage`, `ResourceShowPage`,
  `ResourceFormFields`, `FullPageLoader`, `AppHeader`, `useApiError`, `authProvider`,
  `demoAuthSession`, `resourceForms`.
  - **Xoá `src/constants/ui.ts`**: `crudScaffoldText` chuyển vào locales;
    `commonUiText` **không có nơi nào dùng** (code chết).
  - **Thêm `src/locales/translate.ts`**: helper dịch ngoài cây React cho các module
    thuần TS (factory provider, định nghĩa form).
  *Verify:* `npm run typecheck` + `npm run lint` sạch; `npm test` → **36 file / 149 test pass**. ✅

- [ ] **3.4 — Chốt số phận locale `ja`** ← **CẦN BẠN QUYẾT**
  Bất nhất đã xác minh:
  - `src/locales/index.ts:30` khai `SupportedLocale = "vi" | "en" | "ja"`, và type này
    là type của `defaultLocale` (`src/config/types.ts:25`).
  - `src/config/runtimeConfigSchema.ts:37` chỉ cho `z.enum(["en", "vi"])`.
  ⇒ Type cho phép một giá trị mà validator runtime **từ chối**. `ja` **không thể
  chạm tới** qua runtime config hôm nay.
  - `ja.ts` phủ 12 khối cấp 1; `vi.ts` phủ 20 — thiếu `tenant`, `errors`, `forms`,
    `resources`, `crud`, `columns`, `notifications`, `products` (rơi về `en`).
  Hai lựa chọn, cần bạn chọn vì đây là quyết định sản phẩm:
  **(a)** Bỏ `ja` — xoá `ja.ts`, thu `SupportedLocale` về `"vi" | "en"`, hết bất nhất.
  **(b)** Giữ `ja` — thêm `"ja"` vào `z.enum`, rồi dịch đủ 8 khối còn thiếu.
  *Verify:* `SupportedLocale` và `defaultLocale` liệt kê **cùng một tập** locale.

- [ ] **3.5 — Title cột tiếng Anh lẫn trong code Việt** ← **mới phát hiện**
  Nhiều `title` gốc vốn đã là tiếng Anh dù UI mặc định tiếng Việt:
  `"Email"`, `"ISO type"`, `"Content type"`, `"Duty status"`, `"Listing ID"`,
  `"Load"`, `"Chat tenant"`, `"Odometer"`. Đã đưa hết vào locale key (nên `vi`
  vẫn hiện đúng như cũ), nhưng **cần bạn xác nhận bản dịch tiếng Việt** cho những
  thuật ngữ này thay vì giữ nguyên tiếng Anh.
  *Verify:* rà lại khối `columns.*` trong `src/locales/vi.ts`.

- [ ] **3.6 — `locale` hardcode khi format tiền** ← **mới phát hiện & đã sửa một phần**
  `src/pages/products/show.tsx` gọi `formatMoney(price, { locale: "vi-VN" })` bất kể
  ngôn ngữ đang chọn. Đã thêm `src/formatters/intlLocale.ts` (`toIntlLocale`) và
  dùng `i18n.language`. Cần rà xem còn chỗ nào hardcode locale tương tự.
  *Verify:* `grep -rn '"vi-VN"\|"en-US"' src/ --include=*.tsx --include=*.ts`.

- [ ] **3.7 — 16 nhãn `label:` trong `.resource.ts` là code chết** ← **đề xuất, chờ quyết**
  Đã chứng minh: `appResources` **chỉ** được tiêu thụ bởi `createFoundationResources`
  (`src/pages/resourceRegistry.ts:96`), nơi `meta.label` bị ghi đè **vô điều kiện**
  bằng `translate(\`resources.${name}\`)`. Nên `label: "Chuyến hàng"` trong
  `loads.resource.ts` **không bao giờ render** → không vi phạm rule 20.1.
  Nhưng nó là cái bẫy: người đọc sau sẽ tưởng đó là nhãn menu thật.
  Đề xuất: bỏ hẳn tham số `label` khỏi `createResourceConfig` (21 file, typecheck
  sẽ bắt hết). Chưa làm vì đây là đổi API resource config, cần bạn đồng ý.
  *Verify:* `grep -rn "label:" src/features/*/*.resource.ts` không còn kết quả.

### Không thuộc phạm vi 20.1 (đã rà, giữ nguyên)

- `src/config/env.ts:39,55` và `src/main.tsx:17` — `throw new Error` cho lập trình
  viên, không hiển thị cho người dùng cuối.
- Comment tiếng Việt (536 dòng) — hợp lệ.
- `src/types/*.types.ts` — `// TODO` cuối dòng, không hiển thị.

---

## Giai đoạn 4 — Ngữ nghĩa notifications

> `BE-004` ghi rõ: "notifications and mark-all-read are tenant-wide" — backend
> chưa có ngữ nghĩa per-user. Frontend hiện đang tự chế trạng thái đã đọc.

- [ ] **4.1 — Chốt trạng thái đã đọc thuộc về ai**
  `NotificationHeaderIcon` giữ `readIds` trong `useState` (local, mất khi
  reload) rồi trộn với `item.isRead` từ server. Hai nguồn sự thật chồng nhau.
  Cần quyết định: gọi API mark-read thật, hay chỉ hiển thị `isRead` từ server.
  *Verify:* chỉ còn một nguồn sự thật cho `isRead`.

- [ ] **4.2 — Rà lại `refetchInterval: 10000`**
  Polling 10 giây cho mọi phiên đăng nhập. Rule `screen-api-loading.md` cho phép
  dữ liệu global, nhưng cần xác nhận đây là chủ ý và cân nhắc khoảng thời gian /
  cơ chế đẩy (SignalR) thay vì polling dày.
  *Verify:* có ghi chú lý do trong code hoặc trong tài liệu này.

- [ ] **4.3 — Rà lại tiếng động khi tải trang**
  `playNotificationSound()` được gọi ngay lần load đầu nếu `unreadCount > 0`.
  Trình duyệt chặn `AudioContext` trước tương tác người dùng, và phát tiếng khi
  vừa mở trang là hành vi gây khó chịu. Cân nhắc chỉ phát khi số chưa đọc *tăng*
  sau lần load đầu.
  *Verify:* mở app ở tab mới, xác nhận không phát tiếng.

---

## Giai đoạn 5 — Xác nhận enum với backend

> Khoảng 10 file trong `src/types/` có TODO `xác nhận lại danh sách giá trị enum
> với backend`. Đây là rủi ro runtime thật: enum sai làm hỏng filter, sort và
> hiển thị trạng thái.

- [ ] **5.1 — Lập bảng enum cần xác nhận**
  Các file có TODO: `dvir`, `truck`, `document`, `hos-eld`, `accident`,
  `notification`, `ai-dispatch`, `employee` và các file khác.
  *Verify:* `grep -rln "xác nhận lại danh sách giá trị enum" src/types/` khớp danh sách.

- [ ] **5.2 — Xác nhận với backend và chốt enum**
  *Verify:* xoá hết TODO, mỗi enum có comment nguồn xác nhận.

- [ ] **5.3 — Định nghĩa shape cho các trường `unknown`**
  `hos-eld.types.ts:139` (`rawEventDataJson`), `ai-dispatch.types.ts:68-69`
  (`toolInput`, `toolOutput`).
  *Verify:* không còn `unknown | null` chưa có chú thích lý do.

---

## Giai đoạn 6 — Resource có UI nhưng chưa có backend contract

> 10 resource đã có feature, page, route đầy đủ nhưng **bị ẩn khỏi runtime** vì
> không nằm trong `foundationApiResources`. Đây là chủ ý (ADR-001: "Unsupported
> menu resources may be hidden until a backend contract exists"), không phải bug.
> Việc cần làm là theo dõi khi nào backend sẵn sàng.

`products`, `conversations`, `accidents`, `dvir`, `expenses`, `maintenance`,
`ai-dispatch`, `containers`, `load-board`, `hos-eld`

- [ ] **6.1 — Lập danh sách endpoint backend cần bổ sung**
  Mỗi resource cần: `collectionPath`, `allowedFilterFields`, `allowedSortFields`.
  *Verify:* có bảng đối chiếu trong tài liệu.

- [ ] **6.2 — Bật từng resource khi contract sẵn sàng**
  Thêm vào `foundationApiResources`; `supportedNames` tự động cho hiện menu.
  *Verify:* resource hiện trong menu và list gọi đúng endpoint.

- [ ] **6.3 — Quyết định số phận các resource không có kế hoạch backend**
  Resource nào không bao giờ có backend thì nên xoá hẳn feature + page để giảm
  bundle, thay vì để code chết.
  *Verify:* không còn feature mồ côi.

---

## Giai đoạn 7 — Upload documents

> `BE-005` (PHASE 2): upload chưa có giới hạn dung lượng, chính sách MIME, chống
> sniff nội dung, cách ly malware, signed URL hay idempotency. Contract yêu cầu
> giữ `documentUpload` tắt cho tới khi được duyệt.
>
> Lưu ý: hiện `public/runtime-config.json` chỉ có `demoAuth` và `tenantChange` —
> **chưa có flag `documentUpload`**. Cần thêm trước khi có gì để bật/tắt.

- [ ] **7.1 — Định nghĩa và thêm flag `documentUpload`**
  *Verify:* flag có trong `runtime-config.json` và mặc định `false`.

- [ ] **7.2 — Viết multipart upload adapter**
  `documents` hiện nằm trong `readOnlyResourceNames` — `create`/`edit` bị xoá.
  Endpoint này không phải JSON CRUD thường.
  *Verify:* upload chạy được ở môi trường dev, có kiểm tra phía client.

- [ ] **7.3 — Chờ backend chốt chính sách** — `[!]` blocked bởi `BE-005`.
  *Verify:* `BE-005` chuyển trạng thái khỏi PHASE 2.

---

## Giai đoạn 8 — Messaging

> `foundation-integration-contract.md`: "Messaging uses feature adapters because
> conversations live at `/api/messages/conversations` and messages require
> principal-scoped parameters/actions; the generic `/conversations` resource must
> not call an invented endpoint."
>
> Hiện `src/features/conversations/` chỉ có `columns.tsx` và
> `conversations.resource.ts` — **chưa có adapter nào**.

- [ ] **8.1 — Viết feature adapter cho conversations**
  Không được dùng generic resource trỏ vào endpoint tự nghĩ ra.
  *Verify:* adapter gọi đúng `/api/messages/conversations`.

- [ ] **8.2 — Xử lý messages theo principal**
  *Verify:* không truyền `employeeId` từ client.

- [ ] **8.3 — Chờ `BE-004` bind identity vào JWT** — `[!]` blocked.
  Messaging hiện tin `employeeId` do caller cung cấp.

---

## Giai đoạn 9 — Chặn production còn lại (backend)

Các mục này frontend không tự giải quyết được; theo dõi trong `backend-gaps.md`.

- [ ] **9.1 — `BE-001`** CORS phía Spring. Hiện dev phải proxy qua Vite vì backend
  không cấu hình CORS. — `[!]` blocked
- [ ] **9.2 — `BE-002`** Identity Server ngoài repo, `https://localhost:7001`
  không truy cập được. Chưa xác nhận được client ID, redirect URI, scope,
  refresh/logout. **Đây là blocker lớn nhất: chưa chứng minh được login
  production thật.** — `[!]` blocked
- [ ] **9.3 — `BE-003`** Chưa có `/api/me` hoặc mapping `employeeId` từ JWT. — `[!]`
- [ ] **9.4 — `BE-006`** `/api/health` hardcode `status=UP`, chỉ suy ra trạng thái
  DB từ tên profile → health gate có thể báo xanh sai. — `[!]`
- [ ] **9.5 — `BE-007`** OpenAPI ghi create trả `200` nhưng controller trả `201`.
- [ ] **9.6 — `BE-008`** Lỗi framework rơi xuống `500` thay vì `400/405/415`.
- [ ] **9.7 — `BE-009`** OpenAPI nói có `X-Tenant` nhưng Java chỉ đọc claim JWT.
- [ ] **9.8 — `BE-010`** `/logout` mặc định của Spring không thu hồi token OIDC.
- [ ] **9.9 — `BE-011`** JWT converter tạo authority cho mọi chuỗi role (hardening).
- [ ] **9.10 — `BE-012`** So sánh trạng thái invoice phân biệt hoa thường
  (`Draft` vs `draft`).
- [ ] **9.11 — `BE-013`** Chưa validate chuỗi tiền tệ theo ISO 4217.

---

## Giai đoạn 10 — Nợ kỹ thuật đã biết

- [ ] **10.1 — Rủi ro tồn dư của dependency**
  `npm audit --omit=dev` còn 2 cảnh báo moderate ở React Router 6. Bản vá tự động
  nâng lên Router 7, phá vỡ stack đã duyệt (Refine v4 + Router 6). Theo
  `backend-gaps.md` đây vẫn tính là **FAIL** cho cổng production
  zero-vulnerability cho tới khi có quyết định migrate.
  *Verify:* ghi lại quyết định chấp nhận rủi ro hoặc kế hoạch migrate.

- [ ] **10.2 — `e2e/` và Playwright**
  Có `playwright.config.ts` và thư mục `e2e/` nhưng chưa rõ mức độ bao phủ.
  *Verify:* `npm run test:e2e` chạy và ghi lại kết quả.

- [ ] **10.3 — Chỉ mục GitNexus hỏng**
  Mọi lệnh Bash đều kèm cảnh báo `FTS extension load failed: ... Database file
  version: 43, Current build storage version: 40` cho repo `logictisc-app`. Chỉ
  mục `.gitnexus/` cần được index lại.
  *Verify:* không còn cảnh báo FTS khi chạy lệnh trong repo.

---

## Giai đoạn 11 — Đóng nhánh hiện tại

> Nhánh `feat/login-polar-bear-ui` đang có thay đổi chưa commit.

- [ ] **11.1 — Rà soát thay đổi chưa commit**
  `AppHeader.tsx` (+199/-…): thêm Select điều hướng dùng `useCanWithoutCache` +
  `useMenu`, tính `allowedResources` bằng `Promise.all`. `AppSider.tsx` (-282):
  rút gọn mạnh. Kiểm tra `AppSider` sau khi rút gọn còn đủ chức năng.
  *Verify:* `git diff` đã được review từng file.

- [ ] **11.2 — Commit `NotificationHeaderIcon` và test của nó**
  `src/features/notifications/components/NotificationHeaderIcon.tsx`,
  `src/features/notifications/index.ts`, `src/tests/features/` còn untracked.
  *Verify:* `git status` sạch.

- [ ] **11.3 — Chạy đủ cổng chất lượng trước khi merge**
  *Verify:* `npm run lint` + `npm run typecheck` + `npm test` đều pass.

---

## Giai đoạn 12 — Kiểm tra tuân thủ rule (scan toàn dự án)

> Quét 5 nguồn rule: `.codex/AGENTS.md` (1852 dòng), `.agents/rules/types-architecture.md`,
> `.agents/rules/refine-feature-architecture.md`, `.agents/rules/frontend-engineering.md`,
> `.agents/rules/screen-api-loading.md`, `.agents/rules/external-skill-compatibility.md`.
> Mọi phát hiện dưới đây **đã được tôi tự kiểm lại bằng `grep`/`sed`** — không chép nguyên
> báo cáo của agent, vì kinh nghiệm ở Giai đoạn 3 cho thấy phát hiện tự động có thể sai.

### ⚠️ Đính chính: 2 file rule đã lỗi thời

- `.agents/rules/refine-feature-architecture.md` — **gần như mọi tham chiếu đường dẫn đều
  trỏ vào cấu trúc đã bị khai tử**: `src/app/`, `src/core/`, `src/common/`, `features/*/mappers/`,
  `features/*/types/`, `*.api.types.ts`. Chính `frontend-engineering.md:27-30` **cấm** những
  thư mục đó. Mục 19 của file này còn mô tả `app/i18n/` + `common/i18n/` — không tồn tại.
- `.codex/AGENTS.md` §20 — nguồn rule i18n **đúng**, giữ nguyên.

**Hệ quả:** không thể "sửa code cho khớp rule" ở các mục lỗi thời — phải sửa **rule** trước.
Đây là việc của bạn (12.21).

### Đã sửa trong lần quét này

- [x] **12.1 — Chuỗi tiếng Anh cứng trong `ResourceCreateModal` (rule 20.1/20.2)**
  `title={\`Create ${resource}\`}` + `okText="Create"` → người dùng **thật sự thấy** vì
  `ResourceListPage.tsx:65` render component này trong `headerButtons`. Đã thay bằng
  `t("crud.createTitle", …)` + `t("actions.create")`, thêm 2 khoá vào `vi.ts`/`en.ts`.
  *Verify:* `npx vitest run src/tests/locales/localeKeys.test.ts` + mở modal "Thêm mới".

- [x] **12.2 — Context value không memo hoá (rule 11)**
  `ResourceListPage.tsx:56-61` tạo object literal mới mỗi render ⇒ `ActionButtons` (consumer)
  re-render theo mọi lần render của list. Đã bọc `useCallback` + `useMemo`.
  *Verify:* `npx eslint src` sạch; `exhaustive-deps` không cảnh báo.

- [x] **12.3 — Ép kiểu thừa sau type predicate (rule 21)**
  `ResourceCreateModal.tsx:35` và `ResourceListPage.tsx:50` đều `resource as EditableResourceName`
  ngay sau `isEditableResourceName(resource)` — guard **đã là** type predicate nên ép kiểu là
  vô nghĩa và che mất lỗi thật. Đã bỏ cả hai (kèm bỏ import không còn dùng).
  *Verify:* `npx tsc -p tsconfig.app.json --noEmit` sạch.

- [x] **12.4 — Type guard trùng lặp verbatim (rule §10 types-architecture)**
  `authProvider.ts:29-53` sao chép y hệt `auth.types.ts:41-64`, **nhưng bản sao narrow sai**:
  `value is LoginParams` thay vì `value is LarkLoginParams`. Đã xoá bản sao, import từ
  `auth.types`. Kiểm trước khi xoá: không consumer nào import 2 hàm này từ `authProvider`.
  *Verify:* `npx tsc --noEmit` + `npx vitest run` sạch.

- [x] **12.15 — 🟡 9 hook thiếu khai báo kiểu trả về (rule 14.3/21)**
  Đã thêm kiểu trả về cho cả 9: `useApiError` (`UseApiErrorResult`), `useAuthStatus`,
  `useCurrentUser` (`UseCurrentUserResult`), `useCurrentTenant`, `useLarkLogin`,
  `useLogoutUser`, `useSwitchTenant`, `useTenantList`, `useResourceAction`.
  **Bẫy đã vấp và cách thoát:** cách viết tưởng như hiển nhiên
  `ReturnType<typeof useGetIdentity<CurrentUser>>` lại **sai** — `useGetIdentity`, `useLogin`,
  `useLogout` đều là hàm **overload**, mà instantiation expression chỉ lấy được overload
  **cuối cùng** (bản `Combined`). Hậu quả: `data` của identity bị thu về `{}` và `useLogin`
  nới thành `AuthActionResponse | TLoginData`. Nó làm **18 lỗi typecheck** ở `AppHeader`,
  `TenantGuard`, `DashboardPage`, `LarkCallbackPage`… Dấu hiệu nhận biết: typecheck đỏ trong
  khi `eslint` vẫn sạch.
  Cách viết đúng (và cũng là chuẩn của repo, theo `useAppBootstrap.ts`): **interface đặt tên
  viết tay** dùng type có thật của thư viện —
  `UseQueryResult<CurrentUser, unknown>` cho identity,
  `UseMutationResult<AuthActionResponse, Error | RefineError, TVariables, unknown>` cho login/logout.
  Lưu ý `@refinedev/core` **không** re-export các alias `UseGetIdentityReturnType` /
  `UseLoginReturnType` (đã thử import, TS báo không tồn tại) nên không dùng lại được.
  *Verify:* `npx tsc -p tsconfig.app.json --noEmit` → 0 lỗi.

- [x] **12.16 — 🟡 Thiếu trạng thái query (rule 15.5)**
  `ResourceShowPage.tsx` chỉ truyền `isLoading`, không xử lý `isError` → show page của 9
  resource im lặng khi API lỗi. Đã thêm nhánh lỗi (`Alert` + nút "Thử lại" gọi `refetch`) và
  nhánh rỗng (`Empty`). `ResourceListPage` có `Alert` lỗi nhưng **không có nút retry** — đã
  thêm nút "Thử lại" gọi `tableQueryResult.refetch()`.
  *Verify:* `npx vitest run src/tests/components/ResourceShowPage.test.tsx` — 4/4 pass
  (loading / error + retry / rỗng / có dữ liệu).

- [x] **12.19 — 🟡 3 thư mục rỗng (rule §4)**
  `src/features/chat/`, `src/features/api-keys/`, `src/features/customers/schemas/` — đã kiểm
  bằng `ls -la` và `git ls-files`: **0 file được track**, nên xoá không mất gì.
  *Verify:* `ls -d src/features/chat src/features/api-keys src/features/customers/schemas`
  → cả ba đều "No such file or directory".

- [x] **Test mới cho các sửa đổi trên**
  `useLocalizedColumns.test.tsx` (viết lại, 8 test), `AntdLocaleProvider.test.tsx` (mới, 4 test),
  `ResourceShowPage.test.tsx` (mới, 4 test).
  *Verify:* `npx vitest run` → **39/39 file, 163/163 test pass**.

- [x] **12.6 — 🔴 antd luôn hiển thị tiếng Anh (rule 20.1)**
  `App.tsx:61` `<ConfigProvider>` không truyền `locale`, toàn repo không import `antd/locale`
  ⇒ mọi text dựng sẵn của antd ("No data", phân trang, "Select" rỗng) luôn tiếng Anh.
  **Đã sửa:** thêm `src/components/AntdLocaleProvider.tsx` — đọc `i18n.language`, ánh xạ
  `en → en_US`, `vi → vi_VN`, `ja → ja_JP`, mặc định `en_US`. `App.tsx` dùng provider này
  thay `<ConfigProvider>` trần. `ConfigProvider` của antd điều khiển chuỗi **nội bộ antd**,
  i18next không với tới được, nên đây là tầng bắt buộc phải có.
  *Verify:* `npx vitest run src/tests/components/AntdLocaleProvider.test.tsx` — 4/4 pass,
  khẳng định `vi_VN` cho `emptyText` = "Trống" và `en_US` = "No data".

- [~] **12.5 — 🔴 Enum thô hiển thị trên bảng (rule 20.7) — nặng nhất**
  20 cột enum (không phải 15) không có `render` ⇒ bảng hiện `in_transit` trong khi form hiện
  "In transit" (bản dịch **đã có sẵn** ở `forms.options.*`).
  **Đã sửa 10/20 cột** — đúng bằng tập field được khai bằng `select(...)` trong
  `resourceForms.ts` (nguồn enum duy nhất đáng tin trong repo): `customers.status`,
  `employees.status`, `terminals.type`, `trucks.type`, `trucks.status`, `loads.status`,
  `trips.status`, `invoices.type`, `invoices.status`, `payments.status`.
  Cơ chế: thêm cờ `options?: boolean` vào `crudColumns.tsx`; `useLocalizedColumns` dịch giá
  trị cell qua `t("forms.options.<value>", { defaultValue: value })` — nhờ `defaultValue`,
  cột nào lỡ đánh dấu sai cũng chỉ hiện nguyên giá trị thô, không vỡ.
  **10 cột còn lại chưa làm được:** `ai-dispatch`, `containers`, `accidents`, `documents`
  (type + status), `dvir` (type + status), `expenses` (type + status), `load-board` — các
  resource này **không có form definition** trong `resourceForms.ts`, tức repo không có
  nguồn enum nào để đối chiếu. Đánh dấu bừa sẽ là đoán. Chờ danh sách enum từ backend
  (Giai đoạn 5).
  *Verify:* `npx vitest run src/tests/components/useLocalizedColumns.test.tsx` — 8/8 pass,
  gồm ca dịch enum ở cả `vi`/`en`, ca enum lạ rơi về giá trị thô, ca giá trị rỗng.

### Còn lại — chưa sửa

> Trong nhóm này, **12.7, 12.8, 12.21, 12.22** cần bạn quyết (đánh đổi sản phẩm hoặc
> cấu hình dự án); phần còn lại là việc cơ học.

- [ ] **12.7 — 🔴 `notifications` bị fetch toàn cục + poll 10 giây (screen-api-loading §1/§2/§8)**
  `NotificationHeaderIcon.tsx:32-37` gọi `useList({resource:"notifications", queryOptions:{refetchInterval:10000}})`
  và được mount trong `AppHeader` (`AppHeader.tsx:156`) — tức **mọi màn hình** đều gọi API
  nghiệp vụ này mỗi 10 giây, kể cả khi người dùng chưa từng mở trang Notifications
  (`AppHeader.tsx:100` còn **loại** notifications khỏi menu). `refetchInterval` là chỗ duy nhất
  trong repo. Ba lựa chọn: (a) chuyển badge vào trong popover, chỉ fetch khi `open` —
  mất số đếm realtime; (b) coi đây là ngoại lệ hợp lệ và bổ sung vào rule §6 kèm lý do;
  (c) giữ nguyên, chấp nhận. **Cần bạn chọn vì đây là đánh đổi sản phẩm.**

- [ ] **12.8 — 🟠 8 file mapper là code chết ⇒ type nói `Date`, runtime là `string`**
  `grep` xác nhận **không file nào** import `src/features/*/*.mapper.ts` (kể cả `dataProvider.ts`).
  Trong khi `load.types.ts:27` khai `dispatchedAt?: Date | null` còn `load.dto.ts:22` là
  `ISODateTime = string`. Luồng §3 (DTO → Mapper → Domain) **chưa được nối vào đâu**.
  Chưa thấy lỗi hiển thị (cột render chuỗi nên trông vẫn đúng), nhưng đây là lời nói dối kiểu
  sẽ nổ khi có người gọi `.getTime()`. Chọn: nối mapper vào `dataProvider`, hoặc xoá mapper
  và sửa type domain về `string`.

- [ ] **12.9 — 🟠 Identity mapper (rule §7/§24)**
  `invoice.mapper.ts:20-22` `return { ...response }` (2 type giống hệt, không có field ngày).
  `customer.mapper.ts:11-17` — phép biến đổi duy nhất bị **comment out**, kèm comment
  "Ví dụ giả định".

- [ ] **12.10 — 🟠 `Customer` ≡ `CustomerResponse` (rule §6/§24)**
  `customer.types.ts:13-23` vs `customer.dto.ts:12-22` giống hệt từng field;
  `CustomerStatus` vs `ApiCustomerStatus` là cùng union. Bằng chứng hệ quả:
  `customer.mapper.ts:28` gán `CustomerStatus` vào chỗ `ApiCustomerStatus` mà TS không phàn nàn.

- [ ] **12.11 — 🟠 20 file `.resource.ts` import ngược lên tầng `pages`** — **KHÔNG sửa: rule gốc đã lỗi thời**
  Cả 20 file đều có `src/features/<x>/<x>.resource.ts:4`:
  `import { createResourceConfig } from "@pages/resourceConfig";`, trong khi rule quy định
  chiều `pages ↓ features`.
  **Đã truy nguồn rule trước khi refactor 20 file:** quy tắc "Dependency Direction" này
  **chỉ tồn tại** ở `.agents/rules/refine-feature-architecture.md` §20 — đúng file đã bị
  đánh dấu lỗi thời ở phần đính chính đầu mục. Sơ đồ tầng của chính nó viết
  `app → pages → features → providers → core → common → config`, tức có `app`/`core`/`common`
  — toàn thư mục đã bị khai tử.
  Kiểm thêm hai nguồn còn lại: `.codex/AGENTS.md` (file rule lớn nhất, còn hiệu lực)
  **không có** mục nào về chiều phụ thuộc; `.agents/rules/frontend-engineering.md:66-67`
  chỉ cấm `types` và nhóm hạ tầng dùng chung (`components`, `hooks`, `validators`,
  `formatters`, `forms`) phụ thuộc `pages`/`features` — **không** nói gì về `.resource.ts`.
  Bản thân file rule lỗi thời cũng ghi: *"If actual code does not match this separation,
  propose changes before modifying it."*
  **Kết luận:** đây không phải lỗi cần sửa, mà là một quy tắc không còn nguồn hiệu lực.
  Không có vòng import thật (`pages/resourceConfig.ts` không import ngược `pages/index.ts`),
  nên không có rủi ro kỹ thuật. Muốn siết lại thì phải **sửa rule trước** (12.21) rồi mới
  động vào code; khi đó cách sửa là chuyển `createResourceConfig` xuống `src/config/`
  (1 file + 20 dòng import).

- [ ] **12.12 — 🟠 `components` → `features` (rule §20)**
  `AppHeader.tsx:19` `import { NotificationHeaderIcon } from "@features/notifications/…"`.
  Đây là **trường hợp duy nhất** trong toàn bộ tầng dùng chung.

- [ ] **12.13 — 🟠 Kiến thức nghiệp vụ nằm trong tầng generic (rule §2/§16)**
  `components/resources/resourceForms.ts:137-304` chứa enum trạng thái + regex + luật validate
  của 8 domain (`loads` status, `trucks` type, `terminals` pattern `/^[A-Za-z]{5}$/u`,
  `payments` status…). 20 domain khác đều có `features/<x>/<x>.resource.ts` — riêng form
  definitions thì không. Không tồn tại `src/validators/`.

- [ ] **12.14 — 🟠 `products` là ngoại lệ duy nhất không dùng hạ tầng generic (rule §12/§13)**
  `pages/products/list.tsx` 108 dòng tự dựng `useTable` + 2 modal; 19 feature còn lại chỉ
  5 dòng (`pages/customers/list.tsx:5`). `pages/products/show.tsx` cũng tự dựng lại.

- [ ] **12.17 — 🟡 Dead code (rule 28)** — **chờ bạn cho phép xoá**
  `components/ResourceEditModal.tsx` — không ai import (đã grep, kể cả barrel).
  `components/AsyncState.tsx` — `AsyncStateView` chỉ xuất ở barrel, không dùng ở production
  lẫn test.
  **Đã hạ mìn nhưng chưa xoá.** Toàn bộ diff chưa commit của `ResourceEditModal.tsx`
  (`git diff` = 6 thêm/5 xớt) là của phiên này, không phải code của người khác — nên xoá
  là an toàn về mặt kỹ thuật. Tôi vẫn không tự xoá vì đây là file được track và có thể nằm
  trong dự định của bạn. Cách sửa đúng theo rule 28 là `git rm` cả hai.
  Đã sửa trước khi xoá: bỏ `modalProps.onCancel({} as React.MouseEvent…)` — chỗ này **bịa
  event rỗng**, consumer nào đọc `e.target` sẽ crash lúc chạy; nay chuyển tiếp event thật.
  Lưu ý thêm: `ResourceEditModal.tsx` còn hardcode `title={\`Edit ${resource}\`}` (rule 20.1),
  và `ResourceListPage` đã tự dựng modal inline thay thế nó — file này là tàn dư của một
  lần refactor.

- [~] **12.18 — 🟡 Comment + permission trong `useEffect` (rule 3.1/6.1/6.2/7.2)**
  **Phần comment: XONG.** Đã rà bằng script (đọc 2 dòng trước mỗi `useEffect`/`useMemo`/
  `useCallback`) và thấy đúng **6 chỗ** thiếu, không phải 9: `AppHeader.tsx` (`flattenedItems`
  memo, effect permission, `navOptions` memo, `activeNavValue` memo), `App.tsx` (`resources`
  memo, `i18nProvider` memo), `VehicleTrackingMap.tsx` (effect Leaflet). Đã thêm comment
  "tại sao" cho cả 6; script rà lại = 0 chỗ thiếu.
  Comment ở `AppHeader.flattenedItems` ghi lại một cái bẫy thật: memo ở đó **bắt buộc**,
  không phải tối ưu — `collectMenuItems` luôn trả mảng mới, mà effect permission lại phụ
  thuộc chính mảng đó, nên bỏ memo là effect chạy lại mỗi render và bắn lại toàn bộ `can()`.
  **Phần permission trong `useEffect`: còn để bạn quyết.** Rule 6.1 cấm "kiểm tra permission
  trong mỗi page", nhưng cùng mục đó **cho phép** "request thủ công không được query library
  quản lý" — và `useCanWithoutCache` đúng là loại đó (cố ý bỏ cache để đổi tenant là kiểm
  tra lại), nên effect này đọc theo hướng nào cũng có lý. Tôi **không** tự đổi sang `useCan`
  từng item vì như vậy là đổi hành vi cache/permission — cần bạn xác nhận trước.

- [ ] **12.20 — 🟡 20 nhãn `label:` chết (mở rộng mục 3.7)** — **đã xác nhận chết, chờ bạn quyết cách gỡ**
  Đếm lại chính xác: **20** chỗ trong `src/features/*/*.resource.ts` + 1 ở
  `src/pages/index.ts:207` (`label: "Tổng quan"`).
  **Chuỗi bằng chứng đầy đủ (ghi lại vì tôi từng kết luận ngược rồi phải sửa lại):**
  1. `appResources` (dựng từ 20 file `.resource.ts`) **chỉ được dùng bởi một chỗ duy nhất**:
     `pages/resourceRegistry.ts:12,96` — đã grep toàn `src`, không consumer nào khác.
  2. `createFoundationResources` (`resourceRegistry.ts:93-105`) **ghi đè** nhãn:
     `meta: { ...resource.meta, label: translate(\`resources.${resource.name}\`) }`.
  3. `App.tsx:210` truyền kết quả đó vào `<Refine resources={resources}>`; `useMenu()` đọc
     `meta.label` (xác nhận trong bundle Refine: `label: ((s=r.meta)==null?void 0:s.label) ?? …`).
  ⇒ Nhãn hiển thị luôn là bản dịch, không bao giờ là chuỗi cứng trong `.resource.ts`.
  **Bằng chứng phụ:** `foundationApiResources` (`resourceRegistry.ts:16-69`) chỉ chứa đúng
  11 resource — trùng khít 11 khoá `resources.*` đang có. 9 resource còn lại (accidents,
  ai-dispatch, containers, conversations, dvir, expenses, hos-eld, load-board, maintenance,
  products) bị `supportedNames` lọc khỏi registry nên không bao giờ lên menu.
  **Ghi chú trung thực:** trong lúc kiểm mục này tôi đã kết luận sai theo hướng ngược lại
  ("nhãn còn sống, nav hiện 'Terminal' thay vì 'Bến bãi'"), sửa `AppHeader` và thêm 10 khoá
  locale — sau đó chứng minh được là **sai** và đã **revert sạch cả hai** (`git diff` hai file
  locale về đúng bản gốc). Bài học: phải đọc hết chuỗi `appResources → resourceRegistry →
  Refine` trước khi kết luận, thay vì chỉ thấy `AppHeader` đọc `item.label`.
  **Cách gỡ (chờ quyết, gộp chung 3.7):** bỏ tham số `label` khỏi `createResourceConfig`
  và 21 chỗ truyền vào.

- [ ] **12.21 — 🟡 Sửa 2 file rule lỗi thời** (xem đính chính đầu mục). Việc của bạn.

- [ ] **12.22 — 🟡 Hardcode tiền tệ/số lượng (rule 23)**
  `products/components/columns.tsx:42`, `pages/products/show.tsx:43` hardcode `currency: "VND"`;
  `DashboardPage.tsx:40` hardcode `pageSize: 100`. Repo không có config currency.

### Đã tuân thủ (đã kiểm, không cần làm gì)

Không `any` / `@ts-ignore` / `@ts-nocheck` / `console.log` trong `src/` (ngoại lệ duy nhất
`notificationSound.ts:22` có comment, đúng loại được phép) · không TS `enum` · không
`eslint-disable` (0 trong repo) · `exhaustive-deps` bật và sạch · `StrictMode` bật, không tắt ·
7/7 `useEffect` có cleanup · không `useEffect(async` · 10/10 `useCallback` có lý do ·
không `useReducer`/`useLayoutEffect`/`useTransition` lạm dụng · không `prefetchQuery`/`Promise.all`
tải trước màn hình · modal chỉ fetch khi mở (đã verify trong source Refine:
`enabled: id !== undefined`) · DTO chỉ được import bởi mapper, không rò vào UI ·
35/35 file type đặt tên đúng `*.types.ts`/`*.dto.ts` · không thư mục bị cấm ·
`import type` dùng rộng rãi · không import chéo giữa các feature · router param được validate
(`normalizeLocalReturnTo`) · `App.useApp` dùng đúng, không `message.*` static ·
không nâng cấp dependency ngoài `@vitest/coverage-v8`.

---

## Nhật ký tiến độ

| Ngày | Hạng mục | Kết quả |
|---|---|---|
| 2026-09-21 | Khảo sát ban đầu | Phát hiện test suite hỏng (0 test, 35 error), docs lệch path, hardcode i18n trong `columns.tsx` + `NotificationHeaderIcon`, read-state notification chỉ local. Khởi tạo tài liệu này. |
| 2026-09-21 | 1.1 | Sửa `setupFiles` + alias `@test` từ `src/test` → `src/tests` (3 chỗ). Verify sạch, typecheck pass. Test vẫn hỏng 35 error → 1.2 là chặn thật. |
| 2026-09-21 | 1.2 | Tra registry: jsdom 29 dùng undici 7 (Node `>=20.18.1`) nên chạy được trên Node 20.20.2; jsdom 30 dùng undici 8 (Node `>=22.19.0`) nên không. Chốt hướng (a): cài Node 22 LTS. |
| 2026-09-21 | 1.2 | nvm đã có sẵn `v22.23.2`; đặt `nvm alias default 22`, thêm `.nvmrc`. |
| 2026-09-21 | 1.3 | Đổi `src/tests/setup.ts` sang entry `@testing-library/jest-dom/vitest` — entry mặc định cần `expect` toàn cục mà dự án không bật `globals`. |
| 2026-09-21 | 1.4 | Thêm `afterEach(cleanup)` tường minh — RTL auto-cleanup không chạy khi thiếu `globals`, gây `Found multiple elements`. |
| 2026-09-21 | 1.5 | Polyfill `matchMedia` + `ResizeObserver` cho jsdom (antd cần khi render). |
| 2026-09-21 | 1.6 | Cài `@vitest/coverage-v8@2.1.9`. Baseline: 64.83% stmts / 77.54% branch / 55.25% funcs. |
| 2026-09-21 | 1.7 | **`npm test` xanh: 35/35 file, 145/145 test, 0 error.** Giai đoạn 1 hoàn thành. |
| 2026-09-21 | 1.8 | Phát hiện `npm run lint` **không** pass: 2 lỗi trong `AppSider.tsx` và `NotificationHeaderIcon.tsx` (code chưa commit sẵn có). |
| 2026-09-21 | 1.8 | Sửa `AppSider` (bỏ tham số, giữ kiểu `FC<RefineThemedLayoutV2SiderProps>`), tách `playNotificationSound` sang `notificationSound.ts`, thêm thư mục sinh tự động vào `globalIgnores`. |
| 2026-09-21 | — | **Cả ba cổng xanh:** `lint` 0 problem, `typecheck` sạch, `test` 35/35 file & 145/145 test. |
| 2026-09-21 | 2.1 | Sửa đường dẫn trong ADR-001 (`src/App.tsx`, `src/providers/api`, `src/providers/permissions`), viết lại sơ đồ composition kèm path thật, thêm khối "Path update" cảnh báo `src/app`/`src/core` đã bị bỏ và bị cấm. Không sửa phần quyết định. |
| 2026-09-21 | 2.2 | **Đính chính sai sót của tôi:** câu `core/api` nằm ở ADR chứ không phải contract. Công việc thật: thêm mục "Transport and authorization", ghi nguồn sự thật của bảng resource, ghi nơi khai báo route, nêu rõ 3 resource read-only. |
| 2026-09-21 | 2.3 | Bảng contract thiếu `roles` (không phải thiếu cả `drivers` như tôi ghi ban đầu). Thêm dòng `roles`. Script so sánh từng trường xác nhận **khớp hoàn toàn, 12 resource**. |
| 2026-09-21 | 3.4 | Phát hiện `SupportedLocale` có `ja` nhưng `runtimeConfigSchema.defaultLocale` chỉ cho `["en","vi"]` — `ja` được nạp nhưng không chọn được. Ghi thành hạng mục mới. Giai đoạn 2 hoàn thành. |
| 2026-09-21 | 3.x | **Đính chính nguồn rule:** rule 20.1–20.4 nằm ở `.codex/AGENTS.md`, không phải `refine-feature-architecture.md` như tôi ghi. Mục 19 của file sau còn mô tả `app/i18n/` — thư mục đã bị cấm, nên cũng lỗi thời. |
| 2026-09-21 | 3.x | **Đính chính phạm vi:** không phải "2 chỗ vi phạm" mà **138 dòng tiếng Việt hiển thị trên 30 file**. Tách được 536 dòng comment hợp lệ. |
| 2026-09-21 | 3.x | **Đính chính phát hiện sai của tôi:** tôi từng nói thiếu key `resources.drivers`/`roles` làm menu hiện khoá thô. Kiểm lại: `appResources` **không chứa** `drivers`/`roles`, bộ lọc loại chúng nên không bao giờ render. Đây là **rủi ro tiềm ẩn, không phải bug đang chạy**. 11 key locale khớp đúng 11 resource render. |
| 2026-09-21 | 3.x | Chốt thiết kế 3.1: `AppBootstrap.tsx:41` gọi `i18n.changeLanguage` **sau** khi module import ⇒ dịch ở cấp module luôn sai ngôn ngữ. Chọn `titleKey` + hook `useLocalizedColumns` thay vì đổi chữ ký 60 file. |
| 2026-09-21 | 3.1 | Đổi **82 title / 19 file** sang `titleKey`. Thêm `useLocalizedColumns.ts`, sửa `crudColumns.tsx` + `ResourceListPage.tsx`. `products` chuyển sang hook `useProductColumns()`. Viết test mới. |
| 2026-09-21 | 3.1 | **Test mới `useLocalizedColumns.test.tsx` 4/4 pass** — gồm ca đổi ngôn ngữ lúc đang chạy (`vi` → `en` cập nhật tiêu đề) và ca chống lộ `titleKey` ra DOM. |
| 2026-09-21 | 3.2 | Thay 5 chuỗi trong `NotificationHeaderIcon.tsx`; chỉ còn comment tiếng Việt. |
| 2026-09-21 | 3.3 | Thêm khối `columns` (83 key), `crud`, `notifications`, `products` + 7 key lẻ vào `vi.ts`/`en.ts`. Sửa thêm 9 file ngoài columns. **Xoá `src/constants/ui.ts`** (`commonUiText` là code chết). Thêm `src/locales/translate.ts`. |
| 2026-09-21 | 3.6 | Phát hiện `products/show.tsx` hardcode `locale: "vi-VN"` khi format tiền. Thêm `src/formatters/intlLocale.ts`. |
| 2026-09-21 | — | **Cả ba cổng xanh sau Giai đoạn 3:** `lint` 0 problem, `typecheck` sạch, `test` **36/36 file & 149/149 test**. |
| 2026-09-21 | 3.4 | **Cần bạn quyết:** bỏ `ja` hay hoàn thiện `ja`. Đây là quyết định sản phẩm, không tự chọn được. |
| 2026-09-21 | 3.7 | **Cần bạn quyết:** 16 nhãn `label:` trong `.resource.ts` đã chứng minh là code chết (bị ghi đè). Có nên bỏ tham số `label` khỏi `createResourceConfig` (21 file)? |
| 2026-09-21 | 12.1 | Quét rule: tìm ra `ResourceCreateModal` hardcode `Create ${resource}` / `okText="Create"` — **đang chạy thật**, không phải code chết. Thêm `crud.createTitle` + `actions.create` vào `vi`/`en`. |
| 2026-09-21 | 12.2 | `ResourceListPage` context value không memo ⇒ `ActionButtons` re-render mỗi lần list render. Bọc `useCallback` + `useMemo`. |
| 2026-09-21 | 12.3 | Bỏ 2 ép kiểu thừa `as EditableResourceName` (guard đã là type predicate). |
| 2026-09-21 | 12.4 | Xoá bản sao type guard trong `authProvider` — bản sao còn narrow **sai** (`LoginParams` thay vì `LarkLoginParams`). |
| 2026-09-21 | 12.x | **Tự kiểm lại toàn bộ phát hiện của 5 agent** thay vì tin báo cáo. Xác nhận đúng: enum thô trên bảng, `ConfigProvider` thiếu `locale`, mapper chết, `features → pages` (20 file), `components → features` (1 chỗ), 3 thư mục rỗng, `products` là ngoại lệ. |
| 2026-09-21 | 12.x | **Đính chính:** `refine-feature-architecture.md` lỗi thời gần như toàn bộ (mọi path trỏ vào `src/app`, `src/core`, `features/*/mappers/` — đều bị cấm). Không thể "sửa code cho khớp rule" ở các mục đó; phải sửa rule (12.21). |
| 2026-09-21 | — | **Bốn cổng xanh sau Giai đoạn 12:** `typecheck` sạch, `lint` 0 problem, `test` **37/37 file & 151/151 test**. Ghi 18 hạng mục mới; 4 đã sửa, 14 chờ quyết định. |
| 2026-09-21 | 12.5 | Dịch enum ở cell: thêm cờ `options` vào `crudColumns.tsx`, `useLocalizedColumns` dịch qua `forms.options.<value>` (có `defaultValue` nên đánh dấu sai cũng không vỡ). Đánh dấu **10/20** cột — đúng tập field khai bằng `select(...)`. 10 cột còn lại thuộc resource **không có form definition** ⇒ repo không có nguồn enum, không đoán. |
| 2026-09-21 | 12.6 | Thêm `AntdLocaleProvider.tsx` (`vi → vi_VN`, `en → en_US`, `ja → ja_JP`). `ConfigProvider locale` chi phối chuỗi nội bộ antd mà i18next không với tới — trước đó bảng rỗng luôn hiện "No data" dù locale `vi`. |
| 2026-09-21 | 12.16 | `ResourceShowPage` thêm nhánh lỗi (`Alert` + retry) + nhánh rỗng (`Empty`); `ResourceListPage` thêm nút "Thử lại". Đây là show page của 9 resource đang chạy. |
| 2026-09-21 | 12.19 | Xoá 3 thư mục rỗng (`features/chat`, `features/api-keys`, `features/customers/schemas`) — đã xác nhận `git ls-files` = 0 file track. |
| 2026-09-21 | 12.15 | **Vấp bẫy overload:** `ReturnType<typeof useGetIdentity<CurrentUser>>` chỉ lấy overload **cuối**, thu `data` về `{}` ⇒ **18 lỗi typecheck** ở 6 file trong khi `eslint` vẫn sạch. Sửa bằng interface viết tay + `UseQueryResult`/`UseMutationResult`. Ghi lại vì đây là bẫy sẽ còn gặp với mọi hook Refine. |
| 2026-09-21 | 12.15 | **Đính chính nhận định cũ của tôi:** tôi từng nói không xoá `ResourceEditModal.tsx` vì "diff chưa commit là của người khác". Kiểm lại `git diff`: toàn bộ 6 thêm/5 xớt là của phiên này. Lý do đó sai; file vẫn chưa xoá vì cần bạn cho phép, không phải vì sợ mất code. |
| 2026-09-21 | 12.x | Thêm test: `useLocalizedColumns` (8), `AntdLocaleProvider` (4), `ResourceShowPage` (4). |
| 2026-09-21 | — | **Ba cổng xanh sau đợt sửa:** `typecheck` 0 lỗi, `lint` 0 problem, `test` **39/39 file & 163/163 test**. Trong 18 hạng mục: **8 xong** (12.1–12.4, 12.6, 12.15, 12.16, 12.19), **1 làm một phần** (12.5: 10/20 cột), **9 còn lại** — trong đó 12.7/12.8/12.21/12.22 chờ bạn quyết. |
| 2026-09-21 | 12.11 | **Truy nguồn rule trước khi refactor 20 file.** Quy tắc "pages ↓ features" **chỉ có** ở `refine-feature-architecture.md` §20 — file đã bị đánh dấu lỗi thời, sơ đồ tầng của nó còn viết `app`/`core`/`common`. `.codex/AGENTS.md` không có mục nào về chiều phụ thuộc; `frontend-engineering.md:66-67` chỉ cấm `types` + hạ tầng dùng chung. ⇒ **Không sửa code**, ghi lại là "rule không còn nguồn hiệu lực". |
| 2026-09-21 | 12.20 | Xác nhận 21 nhãn `label:` **đúng là chết**: `appResources` chỉ có 1 consumer (`resourceRegistry.ts`), và tại đó `meta.label` bị ghi đè bằng `translate()`. Ghi lại cả chuỗi bằng chứng để không ai phải truy lại. |
| 2026-09-21 | 12.20 | **Tôi đã sai rồi tự sửa:** thoạt thấy `AppHeader.tsx:104` đọc `item.label` nên kết luận "nhãn còn sống", sửa `AppHeader` + thêm 10 khoá locale. Kiểm tiếp mới thấy `item.label` đã là bản dịch. **Đã revert sạch cả hai** (`git diff` 2 file locale về đúng gốc, `AppHeader` chỉ còn comment). Không để lại rác. |
| 2026-09-21 | 12.18 | Rà bằng script: đúng **6** chỗ thiếu comment (không phải 9). Đã thêm comment "tại sao" cho cả 6 — 4 memo, 2 effect. Ghi lại bẫy ở `AppHeader.flattenedItems`: memo là **bắt buộc**, bỏ đi thì effect permission lặp vô hạn. Phần "permission trong `useEffect`" để bạn quyết (rule 6.1 có cả cấm lẫn cho phép). |
| 2026-09-21 | — | **Ba cổng xanh:** `typecheck` 0 lỗi, `lint` 0 problem, `test` **39/39 file & 163/163 test**. Lũy kế Giai đoạn 12: **8 xong**, **2 một phần** (12.5, 12.18), **8 còn lại**. |
