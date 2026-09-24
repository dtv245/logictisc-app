# LogisticsX — Đặc tả UI quản trị (bản đối chiếu với source)

Tài liệu này là bản rà soát "Frontend Management UI Design Specification" (bản
do bạn gửi) **đối chiếu trực tiếp với source tại thời điểm 2026-09-21**. Mục đích
không phải phê bình bản spec, mà để trả lời đúng câu hỏi cuối của nó: *component
nào giữ/xoá/tách, thư mục nào đổi, hook nào cần tạo, filter nào đang sai contract,
payload/validation cụ thể cho từng form*.

Mọi khẳng định dưới đây đều kèm `file:line` để bạn tự kiểm lại. Chỗ nào tôi chưa
kiểm được thì ghi rõ **"chưa xác minh"**, không đoán.

**Phạm vi đã đọc trực tiếp:** toàn bộ `src/providers/` (api, auth, permissions, 4
provider), `src/router/`, `src/config/`, `src/components/` (kể cả `resources/`),
`src/hooks/`, `src/formatters/`, `src/forms/`, `src/types/`, `src/locales/`,
`src/pages/resourceRegistry.ts`, `src/pages/index.ts`, 8 feature folder của
`src/features/`, và toàn bộ `src/tests/`. Cộng 4 file rule + `docs/` contract/ADR/backend-gaps.

**Ghi chú sửa đổi.** Bản đầu của tài liệu này có **4 chỗ tôi ghi sai**, đã đính chính
sau khi đọc lại source:

| Chỗ sai | Đính chính ở |
|---|---|
| Đề xuất tạo `src/formatters/statusTone.ts` — `StatusTone` đã tồn tại ở `StatusIndicator.tsx:17` | §3.7 |
| Mô tả `create.tsx`/`edit.tsx` là modal — chúng render page đầy đủ (`ResourceCreatePage`/`ResourceEditPage`) | §4 |
| Bỏ sót lỗi enum **Trip** (nặng hơn Load vì `in_progress` là trạng thái đang chạy) | §5 #1b |
| Khuyên **bỏ `select("status")` khỏi form ngay** — sai, vì chưa có command endpoint thì status sẽ thành bất biến và không dispatch được gì | §3.4 |

**Đã thi công 2026-09-21** (§7 bước 1, 1a, 1b, 1c):

- `ResourceFormField` có thêm `readOnly`; `max` nhận hàm (`number("year", …, nextYear)`).
- `loads.status` 5 → 7 giá trị; `trips.status` 4 → 6 giá trị; thêm khoá locale
  `planned`/`in_progress` vào `vi.ts` + `en.ts`.
- `isInProximity` và 2 Stripe ID chuyển sang `readOnly`; VIN `uppercase`.
- Test mới `src/tests/components/resourceFormEnums.test.ts` (5 test) neo enum form vào
  union trong `src/types/*`. Đã kiểm chứng nó **fail** đúng cách bằng cách tạm hoàn
  nguyên `trips.status`.
- Test mới `src/tests/components/resourceFormReadOnly.test.tsx` (4 test) chốt cơ chế
  `readOnly`: giá trị server sống sót trong payload, và phản chứng rằng thiết kế
  "xoá field khỏi descriptor" **sẽ** làm mất giá trị (antd loại `initialValues`
  không có `Form.Item`). Chi tiết §5.1.
- Cổng chất lượng sau khi sửa: `npm run typecheck` sạch, `npm run lint` sạch,
  `npm test` **41 file / 172 test** xanh (trước: 39/163).

**Ký hiệu**

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Repo **đã có**, spec không cần đề xuất lại |
| 🟡 | Repo có một phần, cần mở rộng |
| 🔨 | Việc thật, phải làm mới |
| 🔒 | Không làm được từ frontend — chờ backend |
| ⛔ | Xung đột với rule bất biến của repo |

---

## 1. Kết luận nhanh

**Ba điều quan trọng nhất, xếp theo mức ảnh hưởng:**

1. **Spec và source đang nói về hai phiên bản contract khác nhau về trạng thái.**
   Spec viết Load `draft/dispatched`, Invoice `draft/issued/partially_paid/paid/cancelled`.
   Source khai Load **7** trạng thái và Invoice **7** trạng thái *hoàn toàn khác*
   (không có `issued`, không có `partially_paid`). Xem §3.2. Đây là chặn số một:
   toàn bộ phần "UI phản ánh đúng state machine" — vốn là nguyên tắc trung tâm của
   spec — không thi hành được cho tới khi chốt được vocabulary với backend.

2. **Đây không phải một cuộc refactor, mà là xây mới UI nghiệp vụ trên một scaffold CRUD.**
   20 resource hiện dùng **chung một bộ 3 component generic** + 2 file khai báo
   descriptor; mỗi page chỉ 3–8 dòng. Chưa có Load detail, chưa có filter bar, chưa
   có action panel, chưa có picker riêng. Xem §4. Hệ quả: câu hỏi "giữ/xoá/tách
   component nào" có câu trả lời rất gọn — **giữ nguyên scaffold, và chỉ 6 resource
   trọng yếu mới rời khỏi nó** (§6.1).

3. **Ba đề xuất cốt lõi của spec (command endpoint, `/api/me` + `employeeId`,
   `load.confirm_status`) đều chưa có contract.**
   Không tồn tại endpoint `/dispatch`, `/pickup`, `/deliver` nào trong repo; `BE-003`
   ghi `/api/me` **chưa implement**; `load.confirm_status` không tồn tại ở đâu. Xem
   §3.4, §3.5. Ba hạng mục này phải chuyển thành **yêu cầu contract gửi backend**
   (§9), không phải việc code frontend.

Ngược lại, **khoảng 10 hạng mục trong spec mà repo đã làm sẵn** — envelope unwrap,
pagination mapping, `syncWithLocation`, `useApiError`, confirm dialog, entity picker
async, capability resource, bản đồ theo dõi xe. Xem §3.7. Làm lại những thứ này sẽ
là regression.

---

## 2. Nguyên tắc bất biến — spec phải cúi theo các file này

Bốn file rule có hiệu lực, theo thứ tự ưu tiên khi mâu thuẫn:

| File | Phạm vi |
|---|---|
| `.agents/rules/frontend-engineering.md` | Cấu trúc thư mục, types, dependency direction. **Nói rõ nó override generic recommendation.** |
| `.codex/AGENTS.md` | 27 mục: hooks, Refine/TanStack, i18n (§20), a11y, loading/error/empty (§24) |
| `.agents/rules/screen-api-loading.md` | Chỉ fetch khi màn hình đang mở; cấm prefetch |
| `.agents/rules/refine-feature-architecture.md` | **Đã lỗi thời** (roadmap Giai đoạn 12 đã ghi) |

### 2.1 Phát hiện mới: có **file rule lỗi thời thứ ba**

Roadmap hiện ghi 2 file rule lỗi thời (`refine-feature-architecture.md`, và mục 19
của nó). Rà lần này thấy thêm **`.agents/rules/types-architecture.md`** cũng lỗi
thời, và mâu thuẫn **trực tiếp** với `frontend-engineering.md`:

| `types-architecture.md` nói | `frontend-engineering.md` nói |
|---|---|
| §6: "`src/types/` is only for truly application-wide types. **Do NOT put domain types here**" (d.237) — chỉ định `features/*/types/` (d.253-255) | §2: "All structured application data types **MUST** live at the root of `src/types/` in a flat structure. **Do NOT create `features/*/types/`**" (d.34) |
| §3, §8: transport types ở `features/*/types/` | cấm (d.34) |
| §4: mapper ở `features/*/mappers/` (d.157) | `features/*/mappers/` nằm trong cấu trúc đã khai tử |
| §7: envelope types ở `core/api/` (d.267) | `src/core/` **bị cấm** (d.29) |
| §16: schema ở `features/*/schemas/` (d.636) | cấm |

**Vì sao điều này quan trọng cho spec của bạn:** cấu trúc thư mục mà spec đề xuất
(`features/loads/{api,types,hooks,validation,constants}`) **gần với
`types-architecture.md` hơn là với `frontend-engineering.md`**. Nghĩa là nếu ai đó
thi công theo spec, họ sẽ vô tình làm theo một file rule đã bị cấm. Cần sửa rule
trước (việc của bạn — roadmap 12.21), hoặc chấp nhận `frontend-engineering.md` là
nguồn duy nhất và viết lại spec theo nó.

### 2.2 Hệ quả trực tiếp lên spec

| Spec đề xuất | Verdict | Đường dẫn đúng trong repo |
|---|---|---|
| `src/app/providers/`, `src/app/router/`, `src/app/layout/` | ⛔ | `src/providers/`, `src/router/`, `src/components/` |
| `features/loads/types/` | ⛔ | `src/types/load.types.ts`, `src/types/load.dto.ts` (flat) |
| `features/loads/api/` | ⛔ | `src/providers/api/` + `src/providers/dataProvider.ts` |
| `features/loads/validation/loadRules.ts` | 🟡 | Rule §3 cho tên cụ thể: `features/loads/load.validation.ts` |
| `features/loads/hooks/` | ✅ hợp lệ | Chưa tồn tại; tạo được |
| `features/loads/components/` | ✅ hợp lệ | Đã có `features/loads/components/columns.tsx` |
| `components/LoadTable.tsx`, `components/InvoiceTable.tsx` (domain component trong `components/`) | ⛔ | `frontend-engineering.md:9` — "Do NOT place domain-specific components here" |
| `features/loads/pages/` | ⛔ | `src/pages/loads/` |

---

## 3. Đính chính spec — từng mục

### 3.1 Vocabulary trạng thái: sai lệch nghiêm trọng nhất ⛔🔒

Spec §14, §18, §26, §27 khẳng định các bộ trạng thái. Source khai như sau:

| Resource | Source khai (`file:line`) | Spec khẳng định |
|---|---|---|
| Load | `draft \| pending \| dispatched \| picked_up \| in_transit \| delivered \| cancelled` — **7** (`src/types/load.dto.ts:5`) | `draft`, `dispatched` |
| Trip | `draft \| planned \| dispatched \| in_progress \| completed \| cancelled` — **6** (`src/types/trip.dto.ts:4`) | "draft, dispatched, completed" — **3** |
| Invoice | `draft \| pending_approval \| approved \| sent \| paid \| overdue \| void` — **7** (`src/types/invoice.dto.ts:5`) | `draft/issued/partially_paid/paid/cancelled` |
| Payment | `pending \| processing \| succeeded \| failed \| cancelled \| refunded` — **6** (`src/types/payment.dto.ts:4`) | (không nêu) |

**Hai tập Invoice giao nhau chỉ ở `draft` và `paid`.** `issued` và `partially_paid`
— hai giá trị mà spec dùng làm xương sống cho luồng `Dispatch Load → Invoice issued`
(§18, §28) — **không tồn tại trong type của repo**. Ngược lại `pending_approval`,
`approved`, `sent`, `overdue`, `void` không có trong spec.

Đây cũng đúng là lớp lỗi mà `BE-012` mô tả (`Draft` vs `draft` khi so sánh trạng thái
invoice lúc dispatch). Nên: **trước khi viết bất kỳ `LOAD_STATUS_META` hay
`normalizeInvoiceStatusForDisplay()` nào, phải chốt được đâu là vocabulary thật.**
Ba khả năng, cần backend trả lời:

- (a) Type trong repo đúng, spec lấy từ tài liệu cũ → sửa spec.
- (b) Backend mới đổi sang vocabulary của spec → sửa `src/types/*.dto.ts` + 20 cột + 8 form.
- (c) Hai vocabulary cùng tồn tại ở hai endpoint khác nhau → nguy hiểm nhất, phải làm rõ.

**Chưa xác minh:** tôi chỉ đọc được type phía frontend. Chưa có OpenAPI/Spring source
trong repo để đối chiếu lần hai. Xem §9 mục B1.

### 3.2 Role & permission ⛔

Spec §5 viết role là `SuperAdmin`, `Owner`, `Manager`, `Dispatcher`, `Driver`.
Source dùng **chữ hoa toàn bộ** (`src/providers/permissions/roleMatrix.ts:15-26`):

```
SUPERADMIN · OWNER · MANAGER · DISPATCHER · DRIVER
```

Ma trận thật (`roleMatrix.ts`), đối chiếu với bảng của spec §5:

| Resource | Read | Write | Spec §5 nói |
|---|---|---|---|
| `roles`, `employees` | SUPERADMIN, OWNER | ADMIN_AND_OWNER (d.62-70) | ✅ khớp |
| `customers` | FINANCE_WRITERS = SUPERADMIN, OWNER, MANAGER (d.71-75) | như read | ✅ khớp |
| `invoices`, `payments` | NON_DRIVER_ROLES (d.76-80) | FINANCE_WRITERS + `write` (d.81-85) | ✅ khớp |
| `loads`, `trips` | ALL_ROLES (d.82-86) | NON_DRIVER_ROLES + `dispatch` + `cancel` (d.87-94) | ✅ khớp |
| `trips` | — | thêm `complete` (d.95-99) | spec không nêu |
| `loads` | — | **`pickup`/`deliver` = ALL_ROLES (d.100-103)** | ⚠️ xem dưới |
| `documents` | ALL_ROLES, +`download`,`upload` | `delete` = NON_DRIVER_ROLES (d.104-113) | spec không nêu |
| `drivers` | NON_DRIVER_ROLES (d.114-118) | — | ⚠️ spec ghi mutation có Dispatcher; repo **không cho write** |
| `terminals`, `inspections`, `messages`, `notifications` | … (d.119-160) | | spec không nêu |

**Ba điểm sửa spec:**

1. **`pickup`/`deliver` trong repo là ALL_ROLES** (`roleMatrix.ts:102`) — nghĩa là
   *mọi role* đều được UI cho phép bấm, kể cả MANAGER. Điều này **xác nhận** luận
   điểm của spec §19 (role name không đủ để quyết định) nhưng bằng chứng mạnh hơn
   spec nói: frontend **không thể** gate pickup/deliver theo role, vì ma trận cố ý
   mở cho tất cả. Việc chặn thật **chỉ có thể** đến từ backend theo assignment.

2. **`load.confirm_status` không tồn tại** trong repo (đã `grep -rn "confirm_status"`
   toàn `src/`, `docs/`, `.agents/`, `.codex/`, `e2e/`, `public/` → 0 kết quả).
   Spec §19 nói "Contract đã được chốt" với permission `load.confirm_status` —
   **chưa chốt ở repo này**. Action vocabulary thật của `loads` là
   `dispatch · cancel · pickup · deliver` (`roleMatrix.ts:87-103`). Xem §9 mục B2.

3. **`drivers` là read-only** trong repo: không có `create`/`edit` trong
   `ACCESS_RESOURCES` write rules, và `drivers` cũng không nằm trong
   `resourceFormDefinitions` (`resourceForms.ts:9-17` chỉ có 8 resource editable).
   Contract cũng ghi `drivers` là read-only (`foundation-integration-contract.md:78`).
   Spec §24 nói về "Driver CRUD" thì phải bỏ.

### 3.3 Identity & `employeeId` 🔒

Spec §4 (§4 `useCurrentUser`, §31 uploader, §34 messaging sender) đều dựa trên
`currentUser.employeeId` và nói "JWT đã chứa identity, role và tenant".

Source thật: **`BE-003` ghi `/api/me` là `PHASE 4` — chưa implement**
(`docs/backend-gaps.md:11`: *"There is no `/api/me` or trusted JWT `employeeId`
mapping"*). ADR-001 cũng chỉ mô tả nó ở thì tương lai (`adr/001…:65` "Protected
`GET /api/me` confirms … and supplies `employeeId`").

Hệ quả:

- 🔒 Spec §31 (`metadata.uploadedById = currentUser.employeeId`) **không thi công
  được** — chưa có nguồn `employeeId` đáng tin.
- 🔒 Spec §34 (messaging `senderId = currentUser.employeeId`) — `BE-004` cũng ghi
  messaging đang tin `employeeId` do caller cung cấp (`backend-gaps.md:12`).
- ✅ Nhưng **nguyên tắc** "không cho user tự chọn ID" thì repo đã theo: không có
  trường nào cho chọn `employeeId` của chính mình trong `resourceForms.ts`.

Việc đúng cần làm hôm nay: một chỗ duy nhất đọc `employeeId` và **fail closed khi
null**, để ngày backend xong chỉ phải nối dây. Đây là thiết kế tốt, nhưng phải ghi
là **blocked**, không phải "làm được ngay".

### 3.4 Command endpoint (`/dispatch`, `/pickup`, `/deliver`) 🔒

Spec §16–§19 xây toàn bộ mô hình "state đổi qua command, không cho sửa status bằng
Select". Kiểm tra thực tế:

- `grep -rniE "dispatch|pickup|deliver" src/` → **không có lời gọi endpoint nào**.
  Chỉ có: (a) action name trong ma trận quyền (`roleMatrix.ts:90-102`), (b) tên
  trường dữ liệu (`pickupDate`, `deliveredAt`…), (c) enum `LoadStatus`.
- Không có `@microsoft/signalr` trong `package.json` dependencies.
- Không có file `*Service.ts` hay adapter nào gọi endpoint ngoài JSON CRUD.

**Nghĩa là:** hôm nay cách duy nhất để đổi trạng thái load là `PUT /api/loads/:id`
với `status` trong body — đúng cái mà spec §16 gọi là sai. Nhưng **chưa có đường
nào khác**. Vì vậy:

> ⚠️ **Đính chính (2026-09-21).** Bản đầu của tài liệu này khuyên *"bỏ
> `select("status", …)` khỏi form ngay"*. **Lời khuyên đó sai** và tôi đã không làm
> theo. Vì chưa có command endpoint nào, `Select` status trong form **chính là** cách
> duy nhất để điều phối một load hôm nay. Bỏ nó đi thì trạng thái trở thành bất biến
> — không dispatch được gì cả, phá thẳng chuỗi MVP `Create Load → Dispatch Trip`.
> Việc đúng và làm được ngay là **làm cho danh sách enum đầy đủ** (đã làm, xem §7
> bước 1a), còn việc chuyển status sang read-only **phải chờ B3**.

- Việc làm được ngay: **bổ sung giá trị còn thiếu** vào các `select` status để không
  mất dữ liệu (đã làm — Load 5→7, Trip 4→6, xem #1a/#1b §5).
- Việc **không** làm được: `useLoadActions()` gọi `/loads/:id/dispatch`. → §9 mục B3.
- Hệ quả cần nhớ: chừng nào B3 chưa xong, **status vẫn buộc phải sửa được từ form**.
  Đặt mục tiêu "status read-only" vào lộ trình sau B3, không phải bây giờ.

### 3.5 Filter — spec vừa thiếu vừa thừa

Spec §13 nói filter của Loads v1 chỉ nên có `search`, `status`, `customerId`, và
cấm thêm `truckId`/`dispatcherId`. **Allowlist thật cho phép nhiều hơn thế** —
nguồn sự thật là `foundationApiResources` (`src/pages/resourceRegistry.ts:16-71`),
khớp với bảng trong contract:

| Resource | `allowedFilterFields` thật (`resourceRegistry.ts`) | Ghi chú so với spec |
|---|---|---|
| loads | `search, status, customerId, truckId, dispatcherId` (d.39-45) | ✅ spec thiếu `truckId`, `dispatcherId` — **được phép**, không phải cấm |
| trips | `search, status, truckId` (d.50) | |
| customers | `search, status` (d.19) | ✅ khớp |
| invoices | `status, type, customerId, employeeId` (d.55) | ⚠️ **không có `search`** — spec §27 ghi "Search" |
| payments | `status, invoiceId` (d.60) | ⚠️ không có `search` |
| documents | `type, status, loadId, truckId, employeeId` (d.65) | ⚠️ không có `search` |
| notifications | `[]` (d.70) | ⚠️ không filter được gì |
| employees | `search, status, roleId` (d.24) | |
| trucks | `search, status, type` (d.34) | |
| terminals | `search, type, countryCode` (d.29) | |
| roles | `search` (d.?) | |

**Ba kết luận filter:**

1. `driverId`, `origin`, `destination`, `dateFrom`, `dateTo` — spec §13 nói đúng:
   **không tồn tại ở đâu cả**. ✅ giữ nguyên khuyến nghị.
2. `loads` được phép filter thêm `truckId` + `dispatcherId` → FilterBar của Loads
   nên có 5 filter, không phải 3. Spec đang tự bó hẹp.
3. **Invoice/Payment/Documents không có `search`** → spec §27 yêu cầu ô "Search" cho
   Invoice là **sai contract**. Hệ quả kèm theo, đã xác minh: form Payment khai
   `relation("invoiceId", "invoices")` (`resourceForms.ts:326`) trong khi
   `RelationSelect` (`ResourceFormFields.tsx:45-52`) **luôn gửi filter `search`**
   khi gõ. Với invoices, filter này không nằm trong allowlist → **picker hoà đơn
   trong form Payment không search được**. Đây là lỗi thật, đang chạy.

### 3.6 Những thứ spec đề xuất làm mà repo đã có ✅

Làm lại những mục này sẽ là regression, không phải tiến bộ:

| Spec | Đã có ở đâu | Ghi chú |
|---|---|---|
| §10 pagination `{items,totalItems,…}` → `{data,total}` | ✅ `providers/dataProvider.ts:227` (`total: page.totalItems`), `providers/api/envelope.ts` | Còn **validate** `pageSize > 100` là lỗi (`envelope.ts:100-101`) |
| §68 `unwrapApiResponse` + kiểm `isSuccess` | ✅ `providers/api/envelope.ts`, `httpError.ts` | |
| §67 DataProvider là lớp duy nhất biết `ApiResponse` | 🟡 **nhưng không đúng như spec mô tả** | Envelope được bóc ở **`providers/api/apiClient.ts:197`** (`response.data = envelope.data`), tức tầng transport; `dataProvider.ts` chỉ còn đọc `PagedResponse` (`:219-228`). Kiến trúc thực tế là *apiClient biết envelope, dataProvider biết paging* — tốt hơn về tách bạch, nhưng đừng mô tả sai rồi viết code theo mô tả sai |
| §9 `syncWithLocation: true` | ✅ `App.tsx:229`, `ResourceListPage.tsx:37`, `products/list.tsx:25` | URL đã giữ filter/sort/page |
| §41 `useApiError` mapping 400/401/403/404/500 | ✅ `src/hooks/useApiError.ts` | |
| §20 confirm dialog (không dùng `window.confirm`) | ✅ `src/components/ConfirmActionButton.tsx` (171 dòng) | |
| §46 EntityPicker async | ✅ control `relation` + `RelationSelect` dùng `useSelect` + `debounce: 300` + server `search` (`ResourceFormFields.tsx:36-64`) | Chưa rõ có phân trang khi scroll — chưa xác minh |
| §59 `useCapability` (một phần) | 🟡 `src/components/resources/resourceCapabilities.ts` — chỉ có `{create,edit,delete}` per resource | Chưa có capability cấp **tính năng** (realtime, dashboard stats) |
| §48 `formatMoney` / `<Money/>` | ✅ `src/formatters/money.ts`, `number.ts`, `dateTime.ts`, `display.ts`, `intlLocale.ts`; `decimal.js` đã có trong deps | |
| §47 Date/time qua dayjs | ✅ `dayjs` trong deps + `src/formatters/dateTime.ts` | |
| §49–50 Dashboard | 🟡 **đã có** `src/pages/dashboard/DashboardPage.tsx` + `OperationsChart.tsx` + `VehicleTrackingMap.tsx` (Leaflet) | Xem lỗi #5 §5 |
| §33–36 Messaging layout | 🟡 `src/pages/conversations/` có 5 file page nhưng **không đăng ký được** | Xem §4.1 — `conversations` không có trong `foundationApiResources` |
| §52 Empty state 3 loại | ✅ `src/components/AsyncState.tsx` — `AsyncStateView` render đúng union `loading/error/empty/populated`, có `AccessibleAnnouncement` (aria-live) | Spec không cần đề xuất lại |
| §65 Tone/màu theo trạng thái | ✅ `src/components/StatusIndicator.tsx:17` — `StatusTone = success \| processing \| warning \| error \| neutral`, render antd `Tag` + icon | **Dùng lại, đừng tạo mới** |
| §43 Lỗi field từ backend → form | ✅ `src/forms/backendFieldErrors.ts` (map path dạng `items[0].name` → `setFields`, focus field lỗi đầu tiên) | Đã nối vào **4** form: `ResourceCreateModal`, `ResourceEditModal`, `ResourceCreatePage`, `ResourceEditPage` — bước 1f |
| §45 Ẩn nút khi thiếu quyền | 🟡 `accessControlProvider.ts:38-43` đã đặt `options.buttons = { enableAccessControl: true, hideIfUnauthorized: true }` | Nút do Refine sinh (`CreateButton`…) tự ẩn; chỉ nút tự viết mới cần gate tay |
| §11 Chống race khi gõ tìm kiếm | 🟡 `src/providers/api/latestRequest.ts` — `createLatestRequestCoordinator()` hủy request cũ theo key; `dataProvider.ts:201-205` dựng `requestKey` | Máy móc đã có, thiếu hook debounce (§6.2) |
| §6/§7 Nav theo nhóm nghiệp vụ | ⛔ `AppSider.tsx` trả `null`; nav là **một `Select` phẳng** trong `AppHeader.tsx:155-162` dựng từ `useMenu()`, lọc bằng `can()` | Không có sidebar để nhóm; đây là quyết định đã có chủ đích |

### 3.7 i18n — status registry phải dùng locale key ⛔

Spec §14 đề xuất:

```ts
const LOAD_STATUS_META = { draft: { label: "Draft" } };
```

**Không được** theo `.codex/AGENTS.md` §20.1 (cấm hardcode text hiển thị, d.1265-1283
liệt kê thẳng "Status label") và §20.7 (d.1480-1508: "Không hiển thị enum trực tiếp").
Repo **đã có** cơ chế đúng, dùng lại thay vì dựng registry song song:

- Cột bảng: cờ `options: true` trên `createCrudColumns` → `useLocalizedColumns` dịch
  qua `t("forms.options.<value>", { defaultValue: value })`
  (`crudColumns.tsx:22-30`, `useLocalizedColumns.ts`). Đã áp cho **10/20** cột enum
  (roadmap 12.5).
- Cần bổ sung: **ánh xạ trạng thái → tone**. `StatusTone` **đã tồn tại** ở
  `src/components/StatusIndicator.tsx:17` (`success | processing | warning | error | neutral`)
  — nên **dùng lại type đó**, chỉ cần thêm một bảng tra `LoadStatus → StatusTone`
  (đặt cạnh `StatusIndicator` hoặc trong `features/loads/`, không tạo module mới).
  Không nhét màu vào locale, không nhét text vào registry.
- ⚠️ **Bẫy đã phát hiện:** `forms.options.*` trong catalog locale cũng thiếu
  `planned` và `in_progress` (xem #1b §5) — thêm tone mà chưa thêm khoá locale thì
  `StatusIndicator` sẽ hiện enum thô.

Bài học `BE-012` (`Draft` vs `draft`) nói thêm: registry phải **normalize hoa/thường
khi tra cứu**, nhưng **không viết lại giá trị trước khi gửi request** — đúng như spec
§27 cảnh báo.

### 3.8 Realtime / SignalR 🔒

Spec §38–§39 đề xuất `useRealtimeBridge`, `useSignalRConnection`, có `capabilities.signalR`.
Repo: **không có `@microsoft/signalr`** trong `package.json`, không có hub/service/hook
nào. Ngược lại, `.codex/AGENTS.md` §19 (d.1205-1258) **đã có sẵn** quy định cho SignalR
khi nó tồn tại — hook đề xuất ở đó là `useTrackingHub`, `useMessagingHub`,
`useNotificationHub`, `useTripTracking`, `useUnreadMessages`, kèm yêu cầu event phải
kiểm tenant ID / resource ID / permission.

Nên: giữ nguyên hướng của spec, nhưng **đặt tên hook theo §19 của repo** và thêm yêu
cầu mà spec thiếu: **query key phải chứa `tenantId`** (§15.3, d.988-1013) và cleanup
khi tenant đổi (§14.4, d.938-947). `VehicleTrackingMap` hiện đã tự ghi nhãn trung thực
`dashboard.lastKnownData` — giữ nguyên cách đó, không giả vờ realtime.

---

## 4. Hiện trạng thật của source

Đây là phần quan trọng nhất để trả lời câu hỏi "giữ/xoá/tách component nào".

**Kiến trúc thật: một scaffold CRUD generic, 3 component + 2 file descriptor.**

```
20 resource × 5 page giống hệt nhau:

src/pages/loads/            src/pages/customers/       … ×20
  list.tsx     8 dòng         list.tsx     5 dòng
  show.tsx     3 dòng         show.tsx     3 dòng
  create.tsx   3 dòng         create.tsx   3 dòng
  edit.tsx     3 dòng         edit.tsx     3 dòng
  index.ts                    index.ts
```

Mỗi page chỉ là một dòng gọi component generic. Ba trụ:

| Component | Dòng | Vai trò |
|---|---|---|
| `src/components/ResourceListPage.tsx` | 133 | Cả list + create modal + **view modal** + edit modal cho mọi resource |
| `src/components/ResourceShowPage.tsx` | 78 | Show page của route `/show` |
| `src/components/ResourceCreateModal.tsx` | 59 | Modal create |

Hai file descriptor:

| File | Dòng | Vai trò |
|---|---|---|
| `src/components/resources/resourceForms.ts` | 324 | Khai field cho **8** resource editable — nguồn enum duy nhất của repo |
| `src/features/<x>/<x>.resource.ts` | ~14 | Khai icon/tên/route cho Refine (label là code chết — roadmap 12.20) |

Riêng feature folder chỉ có `components/columns.tsx` + `*.mapper.ts` (**dead code**,
roadmap 12.8 — không file nào import) + `<x>.resource.ts`.

**Đính chính một chi tiết tôi đã ghi sai ở bản trước:** `create.tsx`/`edit.tsx` không
chỉ là modal. Chúng render `ResourceCreatePage`/`ResourceEditPage` — hai component
**page đầy đủ** (dùng `useForm`, không phải `useModalForm`) trong `src/components/`.
Nghĩa là repo có **ba** đường vào form cho mỗi resource editable: create page
(`/loads/create`), create modal (từ nút ở list), và edit modal (từ nút ở list). Route
`/show` dùng `ResourceShowPage` (78 dòng, render `Descriptions` + `TextField` — **không
phải** form disabled). Ba đường này chưa được rà soát thống nhất, và đó là lý do spec §15
nên bắt đầu từ việc **chọn một** đường làm chuẩn.

### 4.1 Số liệu đối chiếu (đã kiểm)

| | Số lượng | Ghi chú |
|---|---|---|
| Resource có page + route (`appResources`) | **20** | `src/pages/index.ts:211-233` |
| Resource có contract backend (`foundationApiResources`) | **12** | `resourceRegistry.ts:16-83` |
| → có UI **không** có backend | **10** | `expenses, maintenance, hosEld, accidents, dvir, conversations, aiDispatch, containers, loadBoard, products` |
| → có backend **không** có page | **2** | `drivers`, `roles` — chỉ dùng làm picker (`useSelect`), không có `src/pages/drivers/` hay `src/pages/roles/` (đã `ls` xác nhận) |
| Resource editable (có form) | **8** | `resourceFormDefinitions` |
| Resource read-only | **3** | `documents`, `notifications`, `drivers` |

### 4.2 Hệ quả

1. **"Refactor component nào" gần như không phải câu hỏi.** Scaffold chỉ có 8 file
   lõi. Việc thật là **tạo UI nghiệp vụ mới** cho 6 resource trọng yếu.
2. **Mọi thứ spec đề xuất cho Load detail (§15), Action panel (§16), FilterBar (§8),
   picker riêng (§24-25) — chưa tồn tại dòng nào.** Đây là net-new.
3. **Phần lớn resource không cần gì ngoài CRUD** — `employees`, `terminals`, `trucks`,
   `drivers`, `documents`, `notifications`, cộng 10 resource chưa có backend. Với
   chúng, scaffold hiện tại là *đúng* — không nên kéo chúng ra khỏi scaffold.
4. **Tính read-only đang được khai ở hai nơi, lệch nhau.** `readOnlyResourceNames`
   (`resourceRegistry.ts:91` = `documents, notifications, drivers`) gỡ route create/edit;
   còn `resourceCapabilities.ts:16-17` khai lại lần nữa ở tầng nút. Hai danh sách này
   phải khớp nhau bằng tay — thêm một resource read-only mà quên một trong hai chỗ thì
   UI sẽ hiện nút hoặc route mồ côi. Nên gộp về **một** nguồn (đề xuất: `resourceRegistry`,
   vì nó đã là nguồn của filter/sort và route).

### 4.3 Một bất nhất UX đáng sửa

`ActionButtons.tsx:22-30`: nút "Xem" trong list **không** điều hướng tới `/show` mà
mở modal — và modal đó render **lại chính form edit ở chế độ `disabled`**
(`ResourceListPage.tsx:115-130`, dùng `ResourceFormFields` với `disabled`). Tức là
"Xem chi tiết" hiện là "form sửa bị khoá", không phải một màn hình đọc. Route `/show`
(3 dòng, `ResourceShowPage`) chỉ tới được bằng URL trực tiếp. Spec §15 chính là chỗ
thay thế đúng cho cả hai.

---

## 5. Lỗi thật đang chạy (đã xác minh, xếp theo mức nghiêm trọng)

Đây là phần "phải sửa trước tiên" mà spec §"điểm cần sửa trước" đang tìm.

| # | Lỗi | Bằng chứng | Vì sao nghiêm trọng | Sửa |
|---|---|---|---|---|
| 1a | **Enum trạng thái Load trong form lệch với type**: form có 5 giá trị, DTO có 7 | `resourceForms.ts:240` vs `load.dto.ts:5` — form thiếu `pending`, `in_transit` | Load ở `pending`/`in_transit` mở form edit → `Select` không có option khớp → ô trống; user lưu → **mất trạng thái thật**. Đây là mất dữ liệu, không phải lỗi hiển thị | ✅ **đã sửa 2026-09-21** — bổ sung đủ 7 giá trị |
| 1b | **Cùng lỗi ở Trip, và nặng hơn**: form có 4 giá trị, DTO có 6 | `resourceForms.ts:292` (`draft,dispatched,completed,cancelled`) vs `trip.dto.ts:4` (thêm `planned`, `in_progress`) | `in_progress` là trạng thái **đang chạy** — trạng thái phổ biến nhất của một trip. Mở form edit một trip đang chạy → ô trống → lưu → **mất trạng thái**. Kèm theo: `forms.options` trong `vi.ts`/`en.ts` **cũng không có** `planned`/`in_progress` ⇒ kể cả cột cũng không dịch được | ✅ **đã sửa 2026-09-21** — 6 giá trị + 2 khoá locale ở cả `vi` và `en` |
| 1c | **`terminals.type` lệch toàn bộ vocabulary — không giao nhau giá trị nào** | `resourceForms.ts:198-204` gửi `SEA_PORT/RAIL_TERMINAL/INLAND_DEPOT/AIR_CARGO/BORDER_CROSSING`; `terminal.dto.ts:4` khai `TerminalType = "port" \| "rail" \| "warehouse" \| "yard"` | Nặng hơn #1a/#1b vì lệch **100%**: mọi terminal tạo từ UI gửi một `type` mà type của chính repo không có; mở form edit terminal có sẵn → `Select` trống hoàn toàn → lưu là ghi đè. `forms.options` cũng chỉ có 5 khoá UPPERCASE, không có `port`/`rail`/`warehouse`/`yard` | 🔒 **chưa sửa** — không đoán được bên nào đúng từ frontend. Đã ghi nhận vào `KNOWN_CONTRACT_CONFLICTS` của test mới và chuyển thành §9 B1 |
| 2 | **`isInProximity` cho client ghi** | `resourceForms.ts:245` `boolean("isInProximity")`; `boolean()` đặt `required: true` (`:125-129`); `createResourceFormInitialValues` mặc định `false` (`:343`) | `isInProximity` là **sự thật do server công bố** (`load.dto.ts:21`). Form create gửi `isInProximity: false` như một khẳng định của client; form edit cho user **tự bật "đang ở gần"**. Đúng y cái spec §19 cấm | ✅ **đã sửa 2026-09-21** — `readOnly(boolean(...))`: hiển thị disabled, không seed lúc create |
| 3 | **`select("status")` cho Invoice mâu thuẫn vocabulary** | `resourceForms.ts:305` (`draft,pending_approval,approved,sent,paid,overdue,void`) vs `invoice.dto.ts:5` (giống nhau — **khớp nội bộ**) nhưng khác spec §27 | Nội bộ repo khớp, nhưng khác spec ⇒ chưa biết bên nào đúng. Rủi ro cao nhất vì `Dispatch → Invoice issued` phụ thuộc giá trị này (BE-012) | Chốt với backend trước (§9 B1) |
| 4 | **Picker hoà đơn không search được** | `resourceForms.ts:326` relation tới `invoices`, nhưng `RelationSelect` luôn gửi filter `search` (`ResourceFormFields.tsx:45-52`); allowlist invoices không có `search` (`resourceRegistry.ts:55`) | User gõ tên hoà đơn → không lọc được, chỉ thấy trang đầu | Thêm `search` vào invoices (backend), hoặc đổi `onSearch` của RelationSelect thành filter được phép |
| 5 | **Dashboard chỉ thấy 100 xe đầu** | `DashboardPage.tsx:40` `pageSize: 100`; `envelope.ts:100-101` chặn `pageSize > 100` | `locatedVehicleCount` và bản đồ **âm thầm cắt** ở 100. Tenant >100 xe thấy số sai mà không có cảnh báo. Đúng loại lỗi spec §49/§70 cảnh báo | 🔒 cần endpoint aggregate thật (§9 B4). Trước mắt: hiển thị rõ "hiển thị N/total" |
| 6 | **VIN không được chuẩn hoá** | `resourceForms.ts:216` `text("vin")` — không `uppercase`, không pattern; trong khi `terminals.code` **có** `uppercase: true` (`:196`) | Cơ chế đã có sẵn, chỉ thiếu áp dụng. Spec §25 yêu cầu trim+uppercase | ✅ **đã sửa 2026-09-21** — `{ ...text("vin"), uppercase: true }` |
| 7 | **`year` chỉ có min, không max** | `resourceForms.ts:215` `number("year", false, 1900)` | `year = 999999` lọt qua | ✅ **đã sửa 2026-09-21** — `max` nhận hàm; `year` dùng `nextYear()` = năm sau |
| 8 | **Ba cặp amount+currency cho một invoice, do người dùng gõ** | `resourceForms.ts:316-318` `subtotalAmount/subtotalCurrency`, `taxTotalAmount/taxTotalCurrency`, `totalAmount/totalCurrency`, đều `required` | `total = subtotal + tax` do con người nhập tay ⇒ lệch số. `BE-013` xác nhận currency **không** được validate ISO 4217 ⇒ gõ sai tiền tệ không ai chặn | 🔒 hỏi backend ai là nguồn tính toán (§9 B5) |
| 9 | **`stripePaymentMethodId` / `stripePaymentIntentId` là text tự do** | `resourceForms.ts:336` | Spec §29 nói không dựng UI Stripe; repo lại cho gõ tay ID Stripe | ✅ **đã sửa 2026-09-21** — `readOnly` (không phải xoá: xoá khỏi payload có thể làm mất giá trị do webhook ghi, xem ghi chú dưới bảng) |
| 10 | **`source` cho client chọn** | `resourceForms.ts:259` `select("source", ["manual","customer_portal","load_board","api"])` | `source` mô tả **nguồn gốc dữ liệu**; để user chọn `api`/`load_board` là tự khai man. Có `externalSourceProvider` bên cạnh càng cho thấy đây là dữ liệu hệ thống | ⏸️ **chưa sửa** — cần `defaultValue` cho create (readOnly sẽ bỏ trống lúc tạo, mà backend có thể bắt buộc trường này). Chờ bạn quyết |
| 11 | **`notifications` fetch toàn cục + poll 10s** | Roadmap 12.7 (đã ghi), `NotificationHeaderIcon.tsx:32-37` + `AppHeader.tsx:156` | Mọi màn hình gọi API nghiệp vụ mỗi 10 giây, kể cả khi chưa mở trang Notifications. Vi phạm `screen-api-loading.md` §1/§2 | Chờ bạn quyết (roadmap 12.7 có 3 lựa chọn) |
| 12 | **`applyBackendFieldErrors` có sẵn nhưng không nơi nào gọi** | `src/forms/backendFieldErrors.ts` (map `items[0].name` → `setFields` + focus field lỗi); grep toàn `src/` ngoài `src/forms/` và test → **0 consumer** | Backend trả 400 kèm `errors[].field` (`api.types.ts:6-10`) nhưng form **không hiển thị lỗi theo field** — user chỉ thấy notification chung. Spec §43 yêu cầu đúng thứ này, và nó đã viết xong | Nối vào `ResourceCreateModal`/edit form: `onError` → `applyBackendFieldErrors(form, error)` |
| 13 | **File page không đăng ký được vẫn nằm trong repo** | `src/pages/conversations/`, `documents/`, `notifications/` đều có đủ 5 file (`list/show/create/edit/index.tsx`) | `conversations` **không có** trong `foundationApiResources` ⇒ `dataProvider.ts:151` sẽ ném `RESOURCE_NOT_CONFIGURED:conversations`; `documents`/`notifications` bị `readOnlyResourceNames` (`resourceRegistry.ts:91`) gỡ route create/edit, và cả hai **không có** trong `resourceFormDefinitions` ⇒ `ResourceCreatePage` sẽ ném `RESOURCE_FORM_NOT_CONFIGURED`. Route đã bị lọc nên không crash, nhưng đây là ~15 file chết gây nhiễu | Xoá phần create/edit của 3 resource này (chờ bạn duyệt, cùng nhóm roadmap 12.17) |

### 5.1 Cơ chế `readOnly` — và vì sao là `disabled` chứ không phải xoá khỏi payload

`ResourceFormField` nay có `readOnly?: boolean` (`resourceForms.ts:44-64`), và
`FieldRenderer` render control `disabled` (`ResourceFormFields.tsx`) chứ **không** bỏ
field khỏi form.

Lý do chọn `disabled`: **repo không có `CreateLoadRequest`/`UpdateLoadRequest`**.
`src/types/load.dto.ts` chỉ khai `LoadResponse` — cả repo chỉ có duy nhất
`UpdateCustomerRequest = Partial<CreateCustomerRequest>` (`customer.dto.ts:43`). Nghĩa
là **không có type nào chặn shape của PUT body**, và không xác minh được backend PUT là
full-replace hay partial.

- Nếu PUT là **full-replace**: xoá field khỏi form ⇒ mọi lần sửa load sẽ **xoá trắng**
  `isInProximity` về `null`/`false`. Tức là "sửa lỗi" lại thành lỗi nặng hơn.
- Nếu PUT là **partial**: xoá field cũng "được", nhưng ta không biết.

`disabled` đúng trong **cả hai** trường hợp: antd giữ giá trị của field `disabled`
trong form store, nên giá trị server trả về được gửi lại nguyên vẹn. Lúc **create**,
field không có giá trị ⇒ `JSON.stringify` bỏ khoá `undefined` ⇒ server tự quyết định.
Đây cũng là lý do `createResourceFormInitialValues` phải **bỏ qua** field `readOnly`
(nếu không, create sẽ gửi `isInProximity: false` — đúng cái bug #2 cần diệt).

**Cả hai vế của lập luận trên đã được kiểm chứng, không phải suy đoán**
(`src/tests/components/resourceFormReadOnly.test.tsx`, 4 test):

1. `Form` + `initialValues` có `isInProximity: true`, render field `readOnly` ⇒ control
   `disabled` **và** `getFieldsValue().isInProximity === true`. Tức giá trị server
   sống sót qua form.
2. Phản chứng cho "xoá field là mất giá trị": một `Form` khai
   `initialValues={{ name, ghost, isInProximity }}` nhưng **chỉ** có `Form.Item name="name"`
   thì `getFieldsValue()` trả về **đúng `{"name": ...}`** — antd **loại bỏ** hẳn
   `initialValues` không có `Form.Item`. Nên nếu chọn thiết kế "xoá khỏi descriptor",
   giá trị server sẽ **không** được gửi lại, và gặp PUT full-replace là mất thật.

Vế (2) còn cho thấy một điều đáng chú ý: PUT body **chỉ chứa field đã đăng ký trong
descriptor**, nên các field dẫn xuất mà server trả về (`customerName`, `number`,
timestamps…) đương nhiên không bị UI gửi ngược lên. Đó là hành vi đúng, nhưng là hệ quả
của antd chứ không phải do ta lọc — cần biết để không "tối ưu" nhầm về sau.

**Điểm chung của #1a, #1b, #1c, #2, #10:** cùng một nguyên nhân — trường do server sở
hữu, hoặc enum do server định nghĩa, bị đưa vào form generic vì form generic chỉ biết
"field nào có trong DTO". Cách sửa không phải vá từng field, mà là (a) **`readOnly`**
để descriptor khai được "hiển thị nhưng không nhập", và (b) **một test neo enum form
vào enum DTO** để #1a/#1b/#1c không tái diễn. Cả hai nay đã có:
`src/tests/components/resourceFormEnums.test.ts`.

---

## 6. Thiết kế đề xuất (đã chỉnh cho khớp repo)

### 6.1 Hai làn — nguyên tắc tổ chức quan trọng nhất

Spec ngầm giả định mọi resource đều cần màn hình nghiệp vụ. Repo cho thấy ngược lại.
Đề xuất chia hai làn rõ ràng, và **ghi vào rule**:

| Làn | Resource | Cách làm |
|---|---|---|
| **A. Scaffold (giữ nguyên)** | `employees`, `terminals`, `roles`, `trucks`, `drivers`(ro), `documents`(ro), `notifications`(ro) + 9 resource chưa có backend | Ở lại `ResourceListPage` + `resourceForms.ts`. Chỉ **một** thay đổi chung: thêm FilterBar (§6.2) |
| **B. Domain screens (xây mới)** | `loads`, `trips`, `customers`, `invoices`, `payments` + messaging | Rời hẳn scaffold, có page riêng + component riêng trong `features/<x>/components/` |

Lý do tách `customers` khỏi làn A: spec §23 đúng — customer là picker cho mọi nơi,
cần trang riêng. Nhưng `customers` **không cần** action panel/state machine.

### 6.2 FilterBar — một thay đổi phục vụ cả 20 resource

Đây là hạng mục **đòn bẩy cao nhất**, và spec §8/§54 nói đúng hướng. Cách làm khớp repo:

1. Thêm `filters` khai báo được vào `foundationApiResources` (đã có
   `allowedFilterFields` — nhưng đó là **allowlist**, thiếu kiểu control). Thêm
   `filterControls?: { field, control: "search"|"select"|"relation", options?, relationResource? }[]`.
2. Thêm prop `filterControls` cho `ResourceListPage`, render một `FilterBar` phía trên
   `<Table>`; nối vào `useTable` qua `filters: { permanent: [...] }` hoặc
   `setFilters` — `useTable` đã có `syncWithLocation: true` (`ResourceListPage.tsx:34-38`)
   nên **URL state có sẵn**, chỉ thiếu UI để đặt filter.
3. `pagination: { mode: "server" }` đã đúng (`ResourceListPage.tsx:35`) ⇒ không có
   filter client-side nào cần gỡ. Đã `grep .filter(` toàn `pages/`+`features/`+`components/`:
   **không có chỗ nào lọc client-side trên list** ⇒ lo ngại của spec §8 không xảy ra
   ở repo này. ✅
4. Filter phải **sinh từ allowlist**, không khai tay. Đây là điểm mạnh sẵn có của repo
   mà spec không biết: `foundationApiResources` là nguồn sự thật duy nhất của
   filter/sort (`resourceRegistry.ts:16-71`), nên FilterBar không thể lệch contract.

Việc cần làm thêm (spec §11 đúng, repo **chưa có**): `useDebouncedSearch`. Đã
`grep "setTimeout"` toàn `src/` (ngoài test) → **0 kết quả**; `grep -i debounce` chỉ
thấy `ResourceFormFields.tsx:45`. Hook này chưa tồn tại.

### 6.3 Action layer — dùng đúng vocabulary đã có

`roleMatrix.ts` đã định nghĩa sẵn action vocabulary: `dispatch`, `cancel` (loads+trips),
`pickup`, `deliver` (loads), `complete` (trips), `download`/`upload` (documents),
`markRead`/`send` (messages). **`getLoadAvailableActions` phải trả đúng các key này**,
không tự đặt tên mới — để `useCan({resource:"loads", action:"dispatch"})` hoạt động
liền.

Đồng thời tuân `.codex/AGENTS.md` §18 (d.1168-1201): không kiểm tra quyền bằng string
trong JSX; dùng `useCan` hoặc `<CanAccess>`. Spec §45 đề xuất `<PermissionGate>` —
có thể làm, nhưng phải là wrapper mỏng quanh `useCan`, không phải cơ chế thứ hai.

Và nhớ `roleMatrix.ts:170-190`: resource/action **không có trong ma trận → false**,
SUPERADMIN cũng không vượt. Mọi UI mới phải chấp nhận fail-closed này.

**Hai lưu ý kỹ thuật đã kiểm:**

- **Đường đi cho command endpoint đã có sẵn:** `dataProvider.custom` (`dataProvider.ts:325-368`)
  là chỗ duy nhất gọi được endpoint không phải CRUD — nhưng nó **hiện từ chối** mọi
  `filters`/`sorters` bằng `CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER`, và
  **chưa nơi nào gọi** (`useCustom` → 0 kết quả). Khi backend có B3, action panel nên
  đi qua `custom`, không tự dựng axios riêng. Đừng gỡ guard đó — nó là ranh giới contract
  có chủ đích.
- **`can()` không cache:** `accessControlProvider.ts:20-21` `await roleSource.getJwtRoles()`
  ở **mọi** lần gọi. Một action panel render 5 nút × mỗi nút một `useCan` là 5 lần await
  mỗi render. Nếu panel có nhiều action, gọi `useCan` **một lần** cho cả resource rồi
  truyền xuống, hoặc thêm cache ngắn ở `accessControlProvider`. Đây là lý do kỹ thuật
  để **không** rải `useCan` khắp component.

### 6.4 Load detail (§15) — chỉnh theo DTO thật

Spec §15 đề xuất 5 tab. Đối chiếu `LoadResponse` (`load.dto.ts:14-54`):

| Tab | Khả thi? | Ghi chú từ DTO |
|---|---|---|
| Overview | ✅ | `number`, `name`, `type`, `status`, `source`, `createdAt`, `dispatchedAt`, `pickedUpAt`, `deliveredAt` **đều có sẵn** |
| Route | ✅ | `originAddress`/`destinationAddress` (`Address`), `originLocation`/`destinationLocation` (`GeoLocation`), `originTerminalId`/`destinationTerminalId` |
| Assignment | 🟡 | Load **không có `driverId`**. Chỉ có `assignedTruckId` + `assignedTruckNumber` + `assignedDispatcherId` + `assignedDispatcherName`. **Main/Secondary driver phải đọc từ Truck** (`resourceForms.ts:218-232`) |
| Documents | ✅ | `documents` cho phép filter `loadId` (`resourceRegistry.ts:65`) ⇒ query được |
| Finance | 🔒 | `invoices` **không** cho filter `loadId` (`resourceRegistry.ts:55`) và `LoadResponse` không có trường invoice ⇒ **không có đường lấy hoà đơn của một load**. Phải xin backend (§9 B6) |
| (Cargo/Hazmat) | ✅ | `isHazmat`, `hazmatClass`, `unNumber`, `containerId` có sẵn — spec không nhắc nhưng nên có |

Bổ sung quan trọng: **`customerName`, `assignedTruckNumber`, `assignedDispatcherName`
đã được backend trả kèm** (`load.dto.ts:27-31`). Nghĩa là lo ngại N+1 của spec §70
**đã được giải quyết sẵn ở tầng DTO** — list hiện render thẳng `customerName`
(`features/loads/components/columns.tsx:14-18`). Không cần picker cho cột.

### 6.5 Money / Unit / Date

- ✅ `decimal.js` + `src/formatters/money.ts` đã có.
- 🔒 **Đơn vị `distance`, `vehicleCapacity` chưa có unit field** trong cả DTO lẫn form
  (`resourceForms.ts:243`, `:213`). Spec §22 gọi đây là blocker — **đúng, và repo xác
  nhận**. Cho tới khi backend chốt: giữ nguyên số trần, **không** ghi "km"/"kg" lên UI.
- 🔒 Currency: `BE-013` xác nhận chưa validate ISO 4217. Spec §48 đúng.
- ⚠️ Roadmap 12.22: `products/components/columns.tsx:42`, `pages/products/show.tsx:43`
  hardcode `"VND"`. Cần gỡ cùng đợt.

### 6.6 Capability layer (§59) — làm, nhưng đặt đúng chỗ

Spec §59 là đề xuất **tốt nhất** trong cả tài liệu. Repo đã có một nửa
(`getResourceCapabilities`). Đề xuất hợp nhất thay vì tạo song song:

```
src/config/runtimeConfigSchema.ts   ← feature flag theo deployment (đã có: demoAuth, tenantChange)
src/pages/resourceRegistry.ts       ← feature flag theo resource (đã có: foundationApiResources + readOnly)
src/components/resources/resourceCapabilities.ts  ← mở rộng thành capability cấp tính năng
```

`useCapability("realtime" | "dashboard.stats" | "finance.publicPayment" | "documentUpload")`
— đọc từ runtime config; **mặc định `false`**, fail closed. Ghi thêm vào
`public/runtime-config.json` khi cần (roadmap 7.1 đã lên kế hoạch cho `documentUpload`).

---

## 7. Thứ tự thi công đề xuất

Sắp theo **phụ thuộc**, không theo độ hấp dẫn thị giác. Mỗi bước có lệnh verify.

| # | Việc | Phụ thuộc | Verify |
|---|---|---|---|
| 0 | Chốt vocabulary trạng thái với backend (§9 B1) — gồm cả `terminals.type` (#1c) | — | Ghi lại quyết định vào §3.1 |
| 1 | Thêm `readOnly` vào `ResourceFormField`; `readOnly` cho `isInProximity` + 2 Stripe ID; `uppercase` cho VIN; `max` động cho `year` | — | ✅ **xong 2026-09-21** |
| 1a | **Sửa #1a**: `loads.status` 5 → 7 giá trị | — | ✅ **xong 2026-09-21** |
| 1b | **Sửa #1b**: `trips.status` 4 → 6 giá trị + 2 khoá locale `planned`/`in_progress` ở `vi` và `en` | — | ✅ **xong 2026-09-21** |
| 1c | Test neo enum form vào enum DTO: `src/tests/components/resourceFormEnums.test.ts` (5 test) | — | ✅ **xong 2026-09-21** — đã chứng minh nó **fail** khi tạm hoàn nguyên `trips.status` về 4 giá trị, và chỉ đích danh `planned`/`in_progress` thiếu |
| 1d | **#10 `source`**: cần `defaultValue` cho create rồi mới `readOnly` được | 1 | `npm test` + tạo load mới xác nhận `source = manual` |
| 1e | **#4 picker hoà đơn**: thêm `search` vào allowlist `invoices`, hoặc đổi `onSearch` của `RelationSelect` | 0 (backend) | Gõ tên hoà đơn trong form Payment → lọc được |
| 1f | Nối `applyBackendFieldErrors` vào form create/edit (lỗi #12) | — | ✅ **xong 2026-09-21** — `src/tests/components/resourceFormBackendErrors.test.tsx` (16 test, phủ **cả 4** form); đã chứng minh non-vacuous bằng cách gỡ `onMutationError` ở riêng `ResourceEditPage` → đúng 3 test của nó đỏ, 3 form kia vẫn xanh |
| 1g | **#3 invoice status** + **#1c `terminals.type`**: sửa sau khi B1 chốt, rồi xoá khoá khỏi `KNOWN_CONTRACT_CONFLICTS` | 0 | `npx vitest run src/tests/components/resourceFormEnums.test.ts` phải đỏ nếu quên xoá miễn trừ |
| 2 | Thêm `FilterBar` + `filterControls` vào `foundationApiResources` + `ResourceListPage`, phục vụ cả 20 resource | — | ✅ **xong 2026-09-21** — xem ghi chú bên dưới về chỗ lệch so với bản gốc |
| 3 | `useDebouncedSearch` trong `src/hooks/` (repo chưa có) | 2 | ✅ **xong** (có trước bước 2) — `src/hooks/useDebouncedSearch.ts` + `src/tests/hooks/useDebouncedSearch.test.tsx` |
| 4 | Bảng tra `<status> → StatusTone` (**dùng lại `StatusTone` ở `StatusIndicator.tsx:17`**) + render qua `StatusIndicator` với locale key; áp cho 10 cột enum còn lại khi backend chốt enum | 0, 1b | ✅ **xong phần bảng tra** — `src/components/statusTone.ts` + `src/tests/components/statusTone.test.ts`; phần "áp cho 10 cột enum" vẫn 🔒 chờ bước 0 |
| 5 | Load list rời scaffold: page riêng + cột Route/Truck/Driver/Created; sửa "Xem" mở detail thật | 1,2 | So `features/loads/components/columns.tsx` với `load.dto.ts` |
| 6 | Load detail 5 tab (Assignment lấy driver từ Truck; Finance để trống có nhãn "chưa có contract") | 5 | Mở `/loads/:id` |
| 7 | Action panel: render từ `getLoadAvailableActions` + vocabulary `roleMatrix.ts`; **không** gọi endpoint chưa có ⇒ hiện `dispatch`/`cancel` qua `PUT` như hiện tại, hoặc disable + tooltip | 5 | `useCan({resource:"loads",action:"dispatch"})` đúng theo ma trận |
| 8 | Customer/Driver/Truck domain pages (picker đã có sẵn) | 2 | — |
| 9 | Invoice/Payment: chỉ sau khi B1 chốt | 0 | — |
| 10 | Documents upload: 🔒 chờ `BE-005` + flag `documentUpload` (roadmap 7.1-7.3) | — | — |
| 11 | Messaging adapter: 🔒 chờ `BE-004` (roadmap Giai đoạn 8) | — | — |
| 12 | Dashboard: 🔒 chờ endpoint aggregate (§9 B4) | — | — |
| 13 | Realtime: 🔒 chờ hub + `@microsoft/signalr` | — | — |
| 14 | **`BaseTable`** dùng chung cho mọi màn có bảng (`src/table/`) | 2 | ✅ **xong 2026-09-22** — `src/tests/table/BaseTable.test.tsx` (12 test) |
| 15 | **Cân xứng form**: `FormGrid` + prop `columns`; route page 2 cột, modal giữ 1 cột | 1f | ✅ **xong 2026-09-22** — `src/tests/forms/FormGrid.test.tsx` (5) + `src/tests/components/resourceFormFieldsLayout.test.tsx` (5) |
| 16 | **Thay `window.confirm` của Refine** bằng modal antd khi đóng form còn thay đổi | 1f | ✅ **xong 2026-09-22** — `useDiscardConfirm` + `src/tests/hooks/useDiscardConfirm.test.tsx` (4) + `src/tests/components/resourceModalDiscardConfirm.test.tsx` (10) |

**Cổng chất lượng bắt buộc sau mỗi bước** (roadmap 11.3):
`npm run lint` + `npm run typecheck` + `npm test` (hiện **54 file / 279 test**).

### Ghi chú bước 2 — hai chỗ lệch so với bản spec gốc, và vì sao

1. **Không thêm `filterControls` vào `foundationApiResources`.** Spec (§6.2 điểm 1) đề
   nghị khai `filterControls?: { field, control, options?, relationResource? }[]` trong
   registry. Bản đã làm khai **hẹp hơn**: `resourceFilterControls.ts` chỉ khai
   `{ field, formField? }`, rồi **mượn** `options`/`relationResource` từ
   `resourceFormDefinitions`. Lý do: chép `options` vào registry tạo **nguồn sự thật thứ
   hai** cho enum — đúng lớp lỗi đã xảy ra thật ở `loads.status`/`trips.status` (#1a/#1b).
   Mượn thì enum filter **không thể** lệch enum form, và `resourceFormEnums.test.ts` bảo
   vệ luôn filter mà không phải viết thêm gì.
2. **`FilterBar` là component thuần hiển thị, không tự gọi `useTable`.** Toàn bộ việc
   "đổi filter ⇒ về trang 1" nằm ở `useEntityFilters`. Nhờ vậy test được logic đó mà
   không phải dựng bảng, và `ResourceListPage` vẫn là chỗ duy nhất biết resource nào
   dùng bảng nào.

Bất biến đã khoá bằng test: field khai trong `resourceFilterControls` **phải** nằm trong
`allowedFilterFields`. Đây không phải chuyện gọn gàng — `serializeFilters`
(`providers/api/querySerializer.ts:96`) ném `FILTER_FIELD_NOT_ALLOWED` và lỗi đó làm rơi
**cả query**, không riêng filter vi phạm. Filter ngoài allowlist = danh sách trắng bảng.

**Hai bài test sẵn có sẽ chặn bạn, và đó là điều tốt — biết trước để không bị bất ngờ:**

- `src/tests/locales/localeKeys.test.ts` kiểm tra **tính đủ khoá** giữa catalog locale.
  Mọi khoá `forms.options.*` mới (bước 1b) phải thêm vào **cả** `vi.ts` và `en.ts` —
  và `ja.ts` hiện **chỉ có 121 dòng / 11 nhóm khoá** (thiếu `forms`, `columns`,
  `resources`, `crud`), nên test này là chỗ sẽ buộc bạn quyết định roadmap 3.4.
- `src/tests/providers/permissions/roleMatrix.test.ts` đã khẳng định
  `can("DRIVER","loads","pickup")` và `can("DRIVER","loads","deliver")` **là true**
  (d.35-39). Nếu ai đó định siết `pickup`/`deliver` theo role ở frontend, test này sẽ
  đỏ — và nó đúng khi đỏ, vì §3.2 nói việc chặn phải đến từ backend.

**~~Chưa có test cho `ResourceListPage`~~** — ✅ đã có từ bước 2:
`src/tests/components/ResourceListPage.test.tsx` (9 test) phủ ba nhánh lỗi tải bảng,
FilterBar, và bốn trạng thái của modal xem chi tiết.

### Ghi chú bước 14–16 — ba quyết định, và một cái bẫy của môi trường test

1. **Bước 14–15 đặt ở `src/table/` và `src/forms/`, không phải `src/common/`.** Yêu cầu
   ban đầu là "cho vào folder common", nhưng `.agents/rules/frontend-engineering.md:29`
   **cấm** `src/common/` (cùng `app/`, `core/`, `shared/`, `services/`, `repositories/`,
   `use-cases/`, `domain/`, `entities/`, `infrastructure/`) — cấm vì đó là tàn dư của kiến
   trúc cũ mà §2.1 nói file rule còn sót lại. Trong khi đó chính file rule ấy **cho phép**
   `table/` (dòng 14, "Global table utilities") và `forms/` (dòng 13), và alias `@table` →
   `src/table` **đã được khai sẵn** ở cả `vite.config.ts` lẫn `tsconfig.app.json:28-29` mà
   chưa có thư mục nào. Nên chỗ đúng đã được dọn sẵn — chỉ cần đặt vào.

2. **`columns` của `FormGrid` là prop, không tự suy từ breakpoint.** `Col` của antd chia
   theo **viewport**, không theo container: một modal rộng 520px trong cửa sổ 1400px sẽ bị
   chia 2 cột nếu dùng `lg`. Vì vậy route page truyền `columns={2}`, modal để mặc định 1.

3. **Refine không cho thay hộp thoại "bỏ thay đổi"** — `UnsavedWarnContext` không được
   export, và `useModalForm`'s `handleClose` gọi thẳng `window.confirm` khi `warnWhen` bật.
   Nên bước 16 **chặn ở `onCancel` của `Modal`** rồi tự hỏi bằng `modal.confirm` của antd.
   Cờ `warnWhen` vẫn đọc từ `useWarnAboutChange` để Refine quyết định "form có thay đổi
   chưa" — tự đếm rất dễ sai (reset sau khi lưu, `autoSave`, sửa rồi sửa lại như cũ).
   Phải đóng qua effect chứ không gọi `close` trong `onOk`: `close` là `useCallback` phụ
   thuộc `warnWhen`, nên bản ta đang giữ vẫn đóng cứng `warnWhen === true` và sẽ bật lại
   `window.confirm`. Sửa kèm một lỗi có thật ở `ResourceEditModal`: `onClose()` chạy vô
   điều kiện, nên **huỷ** hộp thoại xác nhận vẫn làm modal cha đóng.

**Bẫy môi trường test, ghi lại để lần sau không mất thời gian:** `rc-util`'s `useId`
(`node_modules/rc-util/es/hooks/useId.js:29`) trả về **đúng chuỗi `"test-id"` cho mọi id**
khi `NODE_ENV === "test"`. Khi trang có **hai** modal cùng mở, hai tiêu đề cùng mang
`id="test-id"`, `aria-labelledby` của cả hai đều trỏ vào đó, và `dom-accessibility-api`
giải ra tên của modal **đầu tiên** trong DOM. Hệ quả: `getByRole("dialog", { name })` không
dùng được để phân biệt hai modal trong test — phải bám vào nội dung riêng của hộp thoại
rồi `closest('[role="dialog"]')`. Trình duyệt thật không có chuyện này (mỗi modal một
`useId`), nên **đây là hạn chế của test, không phải lỗi sản phẩm**.

---

## 8. Việc cần bạn quyết

1. **Vocabulary trạng thái (§3.1)** — (a) sửa spec theo repo, (b) sửa type theo spec,
   hay (c) hai vocabulary song song? Không quyết được từ frontend.
2. **`types-architecture.md` lỗi thời (§2.1)** — sửa file rule (gộp vào roadmap 12.21),
   hay chấp nhận nó là nguồn thứ hai? Nếu sửa, spec của bạn cũng phải viết lại theo
   `frontend-engineering.md`.
3. **Giữ `ja` hay bỏ** (roadmap 3.4) — vẫn đang mở, ảnh hưởng tới mọi việc thêm locale key.
4. **`notifications` poll 10 giây** (roadmap 12.7) — 3 lựa chọn đã ghi.
5. **Mapper chết** (roadmap 12.8) — nối vào `dataProvider` hay xoá? Type đang nói
   `Date` trong khi runtime là `string` (`load.types.ts:27` vs `load.dto.ts:22`).
6. **`ResourceEditModal.tsx` + `AsyncState.tsx`** (roadmap 12.17) — đã chứng minh là
   code chết, chờ cho phép `git rm`.
7. **Làn A hay làn B cho `trucks`** (§6.1) — `trucks` có rule nghiệp vụ (main driver
   bắt buộc, chống trùng) mà form generic không diễn đạt được. Tôi đề xuất làn A +
   validation ở backend; nếu bạn muốn siết ở UI thì phải chuyển sang làn B.
8. **~15 file page chết** của `conversations`, `documents`, `notifications` (§5 #13) —
   xoá phần `create`/`edit`, hay để nguyên tới khi Giai đoạn 8 làm messaging?
9. **Gộp hai danh sách read-only về một** (§4.2 mục 4) — `readOnlyResourceNames` hay
   `resourceCapabilities` là nguồn? Tôi đề xuất cái thứ nhất.
10. **Ba đường vào form** (`/create` page, create modal, edit modal) — chọn một làm
    chuẩn trước khi làm spec §15, nếu không bạn sẽ phải sửa cùng một thứ ở ba nơi.

---

## 9. Yêu cầu contract gửi backend

Xếp theo mức chặn.

**B1 — Vocabulary trạng thái và enum.** Cho từng resource (`load`, `trip`, `invoice`,
`payment`, **`terminal`**): danh sách giá trị canonical, có phân biệt hoa/thường không
(xem `BE-012`), và giá trị nào là **terminal state**. Đây là chặn của chặn.

Riêng `terminal.type` cần trả lời dứt khoát vì **hai bên không giao nhau giá trị nào**
(#1c): backend nhận `port/rail/warehouse/yard` (theo `terminal.dto.ts:4`) hay
`SEA_PORT/RAIL_TERMINAL/INLAND_DEPOT/AIR_CARGO/BORDER_CROSSING` (theo form + locale)?
Không có câu trả lời thì mọi terminal tạo từ UI đều sai `type`.

**B2 — Action vocabulary cho load.** Repo đã có action `dispatch`/`cancel`/`pickup`/
`deliver` ở tầng quyền (`roleMatrix.ts:87-103`) nhưng **không có endpoint**. Cần biết:
- Có endpoint command riêng (`POST /api/loads/:id/dispatch`) hay vẫn `PUT` status?
- Nếu có: `pickup`/`deliver` xác thực theo cái gì? Spec §19 nói theo assignment
  (truck → main/secondary driver) hoặc permission `load.confirm_status`. Repo
  **không có** `load.confirm_status` và ma trận cho **mọi role** pickup/deliver ⇒
  chưa rõ backend chặn bằng gì. Cần câu trả lời trước khi dựng UI, nếu không UI sẽ
  hiện nút rồi 403.
- `isInProximity` do server tính từ nguồn nào? `BE-…` chưa có mục nào về GPS/proximity
  ⇒ **chưa có nguồn đáng tin** (spec §19 nói đúng). Nếu chưa có, xoá hẳn khỏi form
  ngay (lỗi #2) và **không** dựng UI proximity.

**B3 — `GET /api/me` + claim `employeeId`** (`BE-003`, PHASE 4). Chặn spec §4, §31, §34.

**B4 — Endpoint aggregate cho dashboard.** Hiện dashboard đọc `total` bằng
`pageSize: 1` và bị cắt ở 100 xe (`DashboardPage.tsx:40-51`). Cần `GET /api/dashboard/stats`
hoặc tương đương, trả số đếm theo trạng thái. Nếu không có, dashboard phải ghi rõ
"chỉ tính trên 100 bản ghi đầu".

**B5 — Ai tính tiền hoà đơn?** `totalAmount` do client gửi (`resourceForms.ts:318`)
hay server tự tính từ `subtotal` + `tax`? Kèm `BE-013` (validate ISO 4217).

**B6 — Truy vấn theo quan hệ còn thiếu.** Ba tab/thông tin không có đường lấy:
- `invoices?loadId=` → cần cho tab Finance của Load (`resourceRegistry.ts:55`)
- `loads?tripId=` → cần cho "Associated Loads" của Trip (spec §26); `LoadResponse`
  cũng **không có** `tripId`
- `documents?loadId=` ✅ đã có

**B7 — Unit cho `distance` và `vehicleCapacity`** (spec §22, repo xác nhận thiếu).

**B8 — `search` cho invoices / payments / documents / notifications** — nếu muốn ô
tìm kiếm ở các màn đó (spec §27). Hiện allowlist không có; kèm theo là lỗi #4.

---

## 10. Ghi chú cuối

Bản spec bạn gửi có **nguyên tắc đúng**: UI phản ánh state machine, backend là nguồn
sự thật, không fake capability, không optimistic update cho mutation nghiệp vụ, filter
phải server-side, không để user nhập ID. Những nguyên tắc đó khớp với rule repo và
không cần sửa gì.

Phần cần sửa là **chi tiết**: đường dẫn thư mục, vocabulary trạng thái, casing role,
danh sách filter, và ba hạng mục chưa có contract. Tôi đã ghi hết ở §3 và §9.

Ưu tiên đúng như spec §"điểm cần sửa trước" nhận định — **Load + filter chung +
permission/action layer** — với một chỉnh: việc đầu tiên không phải code, mà là
**chốt vocabulary trạng thái** (§9 B1) và **dọn 3 trường server-owned khỏi form
generic** (§7 bước 1). Hai việc đó nhỏ, độc lập, và mở khoá cho mọi thứ còn lại.
