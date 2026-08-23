# AI Frontend Project Memory

> Persistent source of truth cho frontend. Đọc trước khi bắt đầu bất kỳ tác vụ frontend nào.
> Cập nhật sau mỗi lần làm việc. Nguồn quyết định là controller/DTO Java và `/v3/api-docs`
> (xem `docs/docs/frontend-context.md`, file này là bản tóm tắt điều hành của nó).

## 1. Control

| Field | Value |
|---|---|
| Schema Version | 1 |
| Revision | 5 |
| Project | Logistics TMS frontend (kết nối backend Spring Boot `logictics_api`) |
| Backend Repo Root | /home/vumoi/logictics_api |
| Frontend Repo / Root | `/home/vumoi/logictics-app` — React frontend đã tồn tại và đang kết nối backend Spring Boot |
| Frontend Strategy | **Đã chốt** (không còn "linh hoạt"): React 18 + TypeScript + Vite + Refine v4 + React Router 6 + Ant Design 5 + Axios + TanStack Query 4. Không đổi stack/UI kit khác nếu chưa cập nhật file này trước. Boundary chi tiết ở mục 3.1, 9, 10. |
| Last Updated | 2026-08-23T13:48:00+07:00 |
| Current Phase | Phase 8 — Frontend Development |
| Next Action | QA kiểm tra UI-LOGIN-001 trên browser ở desktop/mobile; sau đó mới nối OAuth/PKCE thật với Identity Server |
| Rev 5 — thay đổi chính | Link `LoginPage.scss` trực tiếp qua `src/styles/app.scss` để style được bundle ngay từ entry; bỏ import SCSS trùng trong component; build/lint PASS và main CSS đã chứa marker login |

## 2. Trạng thái backend liên quan frontend

### Đã verify (PASS)

- **GET /api/me** — endpoint current-user đã có (SLICE-001 VERIFIED). Trả identity + employee mapping.
  - Giải quyết BLOCKER-03 cũ. **Frontend PHẢI dùng nó**, không cho người dùng tự chọn employee.
- **Messaging** — SLICE-003 VERIFIED: server tự resolve sender/reader từ JWT; legacy `employeeId`/`senderId`
  vẫn bắt buộc gửi lên và phải **khớp** với JWT-mapped employee, nếu lệch → `403`.
- **Invoice dispatch→issued** — SLICE-002 VERIFIED: dispatch Load tự chuyển Invoice `draft` → `issued`.
  Frontend không cần workaround case nữa.

### Chưa có / không được giả định

- CORS chưa cấu hình backend — cần whitelist origin phía backend (BLOCKER-01).
- Identity Server ở ngoài repo (`https://localhost:7001` local). API là resource server; không có `/login`, `/logout`, `/refresh`.
- Upload document chưa có policy MIME/size/malware; chỉ không rỗng + tên an toàn (BLOCKER-05).
- Document relation access (ai xem/delete) chưa đúng scope người dùng (SLICE-004 mới xử lý attribution/filename; BLK-008 còn mở).
- Notifications là tenant-wide; chưa có per-user unread-count hay mark-one-read.
- Terminal DTO hiện tại **chưa xác nhận có field toạ độ (lat/lng)** — xem mục 6.1 trước khi làm map.
- **Chưa gọi** các endpoint: dashboard/reports, AI dispatch, Stripe, container CRUD, tracking/GPS, maintenance/HOS/DVIR,
  POD/BOL, VIN decode, WebSocket/SignalR/SSE, message edit/delete, notification mark-one-read.

## 3. Cấu trúc frontend đề xuất

```text
src/
├── app/          router/, providers/ (RefineProvider, AntdApp/ConfigProvider theme), shell/
├── core/
│   ├── auth/         authProvider (Refine AuthBindings) — PKCE, access token trong memory, refresh
│   ├── api/           httpClient (Axios), envelope unwrap, X-Request-Id, error normalize (mục 4)
│   ├── dataProvider/  Refine DataProvider — map ApiResponse<T>/PagedResponse<T> ↔ {data, total} của Refine
│   ├── errors/         error map (mục 4) → antd notification/message adapter
│   ├── permissions/   accessControlProvider (Refine) dùng role matrix mục 5
│   └── hooks/          hooks dùng chung bắt buộc — xem mục 3.1
├── shared/       components/ (chỉ antd), forms/, table/, formatters/, types/, map/ (Mapbox wrapper, mục 6.1)
└── features/
    roles/ customers/ employees/ terminals/ trucks/
    loads/ trips/ invoices/ payments/ inspections/
    messaging/ notifications/ documents/
```

Mỗi feature: `api.ts` (resource config, không phải fetch tay), `types.ts`, `queries.ts` (khai báo hook Refine cho feature), `schema.ts`, `routes.ts`, `components/`, `pages/`.

Query key convention (Refine tự sinh theo resource, nhưng khi cần key thủ công cho `useCustom`):
```ts
['loads', 'list', filters]
['loads', 'detail', id]
['customers', 'options', search]
```

### 3.1 Quy ước Refine + AntD (bắt buộc)

- **UI**: chỉ dùng component Ant Design 5 (`Table`, `Form`, `Modal`, `Drawer`, `Select`, `DatePicker`, `Upload`...). Không tự viết lại component đã có sẵn trong antd, không trộn UI kit khác (Tailwind/MUI/Bootstrap...). Theme qua `ConfigProvider` + design token dùng chung, đặt trong `app/providers/`.
- **Data**: mọi list/detail/create/update/delete phải đi qua Refine resource — `useTable`, `useForm`, `useSelect`, `useOne`, `useMany`, `useCustom`/`useCustomMutation` — trỏ tới `dataProvider` chuẩn hoá theo envelope mục 4. Không tự viết `useEffect` + `fetch`/`axios` rời rạc trong component, trừ khi là action thật sự không map được vào CRUD resource — khi đó vẫn phải dùng `useCustom`/`useCustomMutation` của Refine, không viết tay ngoài data layer.
- **Resource name** trong cấu hình `<Refine resources={...}>` = đúng path API (`loads`, `trips`, `invoices`, `customers`, `terminals`...), khớp mục 6.
- **Auth**: dùng `authProvider` Refine (`login`/`check`/`logout`/`onError`) nối với PKCE + interceptor mục 5; không tự quản lý token ngoài `core/auth`.
- **Access control**: dùng `accessControlProvider` Refine ánh xạ role matrix mục 5 để ẩn/disable action trên UI — nhưng backend vẫn là nguồn authorization thật (đã nêu ở mục 5), UI chỉ là UX, không thay validate quyền phía server.
- **Hooks dùng chung bắt buộc tái sử dụng** (không viết lại logic tương đương trong feature khác):
  - `useCurrentUser` — bọc `GET /api/me`, nguồn duy nhất cho `employeeId` hiện tại (mục 7 DO).
  - `usePermission` — kiểm tra quyền theo role matrix mục 5.
  - `useApiErrorHandler` — map lỗi theo bảng mục 4 ra antd `notification`/form field error.
  - `useServerTable` — bọc `useTable` của Refine với pagination 1-based, `pageSize` mặc định 20/tối đa 100, debounce search 300–500ms, giữ filter/sort/page trên URL (mục 7 DO).
  - `useMoneyFormat`, `useDateFormat` — format tiền (decimal-safe) và ngày giờ theo timezone người dùng (mục 4, mục 7).
  - Nếu cần hook mới có phạm vi dùng lại > 1 feature, phải thêm vào `core/hooks/` hoặc `shared/` **trước**, không tạo hook cục bộ trùng chức năng bên trong một feature.

## 4. HTTP contract chung

### Headers
```http
Authorization: Bearer <access-token>
Accept: application/json
X-Request-Id: <uuid-v4>
```
Upload dùng `FormData` (browser tự sinh boundary), **không** tự set multipart Content-Type.

### Envelope
```ts
export type UUID = string;
export type ISODateTime = string; // ISO-8601 có offset, ví dụ 2026-07-27T10:00:00+07:00

export interface ApiError {
  field: string | null;
  code: string;
  message: string;
}

export interface ResponseMeta {
  timestamp: string;
  path: string;
  requestId: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
  errors: ApiError[];
  meta: ResponseMeta;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number; // 1-based
  pageSize: number;
}

export interface ListQuery {
  page?: number;       // default 1
  pageSize?: number;   // default 20, max 100
  orderBy?: string;
  descending?: boolean;
}
```

Refine `dataProvider.getList` phải trả `{ data: items, total: totalItems }` map từ `PagedResponse<T>` bên trong `ApiResponse<PagedResponse<T>>`; `getOne`/`create`/`update` trả `{ data }` map từ `ApiResponse<T>.data`. Không tự đổi shape này ở tầng feature.

Ngoại lệ không dùng envelope: `GET /`, `/health`, `/api/health` (JSON trực tiếp);
`GET /api/documents/{id}/download` (binary trực tiếp).

### Status & error
- Create JSON / upload / conversation / message → `201`; list/get/update/delete/action → `200`; download → `200` binary.
- Error map bắt buộc:
  | HTTP | code | Hành vi |
  |---:|---|---|
  | 400 | `BAD_REQUEST` | toast/form summary |
  | 400 | `VALIDATION_FAILED` | map `errors[].field` vào control |
  | 400 | `INVALID_STATE_TRANSITION` | refresh entity rồi báo |
  | 401 | `UNAUTHENTICATED` | refresh 1 lần hoặc logout |
  | 403 | `ACCESS_DENIED` | forbidden, không retry |
  | 404 | `RESOURCE_NOT_FOUND` / `NOT_FOUND` | về list với thông báo |
  | 409 | `CONFLICT` / `DATA_INTEGRITY_VIOLATION` | message nghiệp vụ / record đang được tham chiếu |
  | 500 | `INTERNAL_ERROR` | cung cấp request ID cho support |

- Pagination 1-based, pageSize ≤ 100, filter đổi thì reset page, search debounce 300–500ms,
  sort whitelist theo module (gửi field lạ có thể `500`).
- Tiền: `BigDecimal` = JSON number; dùng decimal library, không float arithmetic.
- Date: gửi `OffsetDateTime` ISO-8601.

## 5. Auth / Permission

### JWT
- Xác thực: signature, exp, issuer, audience `logisticsx.api`, claim `tenant` không rỗng.
- Role normalize: `SUPERADMIN`, `OWNER`, `MANAGER`, `DISPATCHER`, `DRIVER` (`SUPER_ADMIN` → `SUPERADMIN`).
- Decode cả `role` và `roles` (string hoặc list).
- Browser: Authorization Code + PKCE; access token trong memory; interceptor gắn Bearer + `X-Request-Id`,
  unwrap `ApiResponse`, refresh tối đa 1 lần khi 401, không refresh khi 403.
- Trong Refine: logic trên nằm trong `authProvider` (`core/auth/`) + `httpClient` interceptor (`core/api/`); `accessControlProvider` (`core/permissions/`) chỉ đọc role đã normalize, không tự parse JWT lại ở tầng UI.

### Role matrix (guard frontend chỉ là UX; backend là nguồn authorization)
| Module/action | SA | O | M | D | DR |
|---|:---:|:---:|:---:|:---:|:---:|
| Roles, Employees CRUD | ✓ | ✓ | | | |
| Customers CRUD/list | ✓ | ✓ | ✓ | | |
| Invoice/payment read | ✓ | ✓ | ✓ | ✓ | |
| Invoice/payment write | ✓ | ✓ | ✓ | | |
| Load/Trip read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Load/Trip create/update/delete/dispatch/cancel | ✓ | ✓ | ✓ | ✓ | |
| Load pickup/deliver | ✓ | ✓ | ✓ | ✓ | ✓ |
| Documents read/upload | ✓ | ✓ | ✓ | ✓ | ✓ |
| Documents delete | ✓ | ✓ | ✓ | ✓ | |
| Drivers/trucks | ✓ | ✓ | ✓ | ✓ | |
| Terminals read / create-update / delete | ✓ | ✓ | ✓ | ✓ | ✓ / ✓ / ✓ |
| Inspections/messages/notifications | ✓ | ✓ | ✓ | ✓ | ✓ |

Lưu ý:
- JWT role (route) ≠ `TenantRole` qua `/api/roles` (claims nghiệp vụ). Tạo role không cấp quyền Spring Security.
- Driver = Employee có claim `permission:update_trip_status` (chỉ qua `/api/drivers`).

## 6. Feature cheat sheet (endpoint + điểm quan trọng)

| Module | Endpoints (đủ CRUD trừ khi ghi chú) | Ghi chú |
|---|---|---|
| Health | `GET /api/health` | public; phân biệt unreachable / unhealthy / CORS |
| Current user | `GET /api/me` | identity + employee mapping; **nguồn cho employeeId** |
| Roles | `/api/roles` | SA/O; `name` unique; claims full-replace; delete có thể `409` |
| Customers | `/api/customers` | SA/O/M; search `name`,`email`; sort `name,email,status` |
| Employees | `/api/employees` | SA/O; search `search,status,roleId`; email duplicate `409` |
| Drivers | `/api/drivers` (+`/{id}`) | SA/O/M/D read-only; là view Employee có permission `update_trip_status` |
| Terminals | `/api/terminals` | read mọi role; write SA/O/M/D; type 5 enum; `code` 5 letters, `countryCode` 2 letters (uppercase); **toạ độ chưa xác nhận, xem mục 6.1** |
| Trucks | `/api/trucks` | SA/O/M/D; search number/VIN/license; main/secondary driver từ `/api/drivers`; không có GPS update |
| Loads | `/api/loads` + `/{id}/dispatch`, `/pick-up`, `/deliver`, `/cancel` | read mọi role; write/actions SA/O/M/D trừ pickup/deliver mọi role; state máy: draft→dispatched→picked_up→delivered, cancel từ draft/dispatched/picked_up; create luôn `draft`, PUT không đổi status |
| Trips | `/api/trips` + `/{id}/dispatch`, `/complete`, `/cancel` | read mọi role; actions SA/O/M/D; stops rebuild full khi update; stop order unique; create luôn `draft` |
| Invoices | `/api/invoices` | read SA/O/M/D; write SA/O/M; dispatch load tự đổi draft→issued; không có line items/send/approve/cancel action |
| Payments | `/api/payments` | read SA/O/M/D; write SA/O/M; không tự đổi invoice status; Stripe fields không phải full flow |
| Inspections | `/api/inspections` | mọi role full; `loadId`,`inspectedById`,`inspectedAt` required; defects array rebuild full; không có VIN decode/parts |
| Messaging | `/api/messages/conversations`, `/api/messages`, `unread-count`, `conversations/{id}/read` | đã principal-scoped; gửi đúng employeeId, lệch → `403`; content ≤ 2000; message asc; chưa edit/delete |
| Notifications | `/api/notifications`, `/{id}`, `mark-all-read` | tenant-wide; chưa unread-count riêng, chưa mark-one-read; không realtime (poll có backoff) |
| Documents | `/api/documents`, `/{id}`, `/{id}/download`, DELETE | upload multipart 2 part `file` + `metadata` (JSON blob); `uploadedById` **bắt buộc từ `/api/me`**; download parse `Content-Disposition`; không dùng `blobPath`; delete SA/O/M/D |

### 6.1 Bản đồ (Mapbox)

- Thư viện: **Mapbox GL JS** (qua `react-map-gl` hoặc wrapper riêng), đặt trong `shared/map/`. Token Mapbox đọc từ runtime config (`mapboxToken`, thêm vào backlog Phase 0 mục 8) — **không hardcode token trong code**.
- **Chưa có tracking/GPS real-time ở backend** (mục 2, mục 7 DON'T) → Mapbox **không được** dùng để hiển thị vị trí xe/tài xế theo thời gian thực cho tới khi backend có endpoint tương ứng. Nếu được yêu cầu làm tính năng này, phải báo lại là backend chưa hỗ trợ, không tự mock toạ độ chuyển động.
- Trước khi code phần map cho Terminal: **phải xác nhận qua `/v3/api-docs` hoặc DTO Java** rằng Terminal thật sự có field toạ độ (lat/lng) hoặc địa chỉ đủ để geocode. Mục 6 hiện chỉ xác nhận Terminal có `type`, `code`, `countryCode` — **không được tự bịa thêm field toạ độ không có trong DTO**. Nếu backend chưa có, ghi vào backlog Phase 5 (mục 8) và chờ bổ sung.
- Khi có toạ độ hợp lệ: chỉ render marker tĩnh cho vị trí Terminal; không tự suy luận route/khoảng cách/ETA (vì chưa có dữ liệu tracking); hạn chế tương tác không cần thiết (kéo marker, vẽ vùng...) trừ khi có yêu cầu cụ thể.

## 7. Critical frontend do's / don'ts

### DO
- Employee ID mọi hành động current-user (message, upload, read) lấy từ `GET /api/me` qua `useCurrentUser` (mục 3.1).
- `FormData` cho upload: `file` + `metadata` (Blob JSON), không tự set Content-Type.
- Vô hiệu hóa nút submit/action khi pending (`isLoading` của mutation Refine); confirm destructive bằng antd `Modal.confirm`.
- Invariant sau mutation: invalidate list + detail + resource có denormalized name (Refine `invalidates` trên mutation, phạm vi đúng, không invalidate toàn cache — xem mục 9).
- State transition: dùng response cập nhật ngay, rồi invalidate list/detail.
- Giữ filter/sort/page trên URL; debounce search 300–500ms qua `useServerTable`/`useSelect`; hủy request search cũ (Refine/TanStack Query tự làm khi query key đổi).
- Money: decimal-safe qua `useMoneyFormat`; preview subtotal + tax = total.
- Date/time: hiển thị theo timezone người dùng qua `useDateFormat`, gửi lại nguyên instant ISO-8601.
- Trước khi thêm bất kỳ gọi API/field/hook mới: kiểm tra mục 6/`/v3/api-docs` và `core/hooks` đã có sẵn chưa (mục 9, mục 10).

### DON'T
- Không gọi endpoint chưa tồn tại: dashboard/reports, AI dispatch, Stripe, container, tracking/GPS, HOS/DVIR, POD/BOL, realtime, message edit/delete, notification mark-one-read, invoice actions (send/approve/cancel).
- Không nhận `employeeId`/`tenantId` tùy ý từ URL cho hành động hiện tại.
- Không dùng `blobPath`/`blobContainer` làm URL; không inline download MIME nguy hiểm.
- Không giả định list trả array trực tiếp — data ở `response.data.items` (trừ 3 ngoại lệ mục 4).
- Không `localStorage` cho access/refresh token (ưu tiên memory + secure refresh).
- Không log token / Authorization / payload nhạy cảm.
- Không render message/filename bằng unsafe HTML.
- Không fetch toàn bộ table để làm dropdown — dùng server search qua `useSelect`.
- Không xây optimistic message nếu chưa có idempotency (chưa có).
- Không tự tính toán GPS/location — chưa có endpoint cập nhật (xem mục 6.1).
- Không tự viết `fetch`/`axios` rời rạc ngoài `dataProvider`/`useCustom`, không dùng UI kit khác ngoài AntD (mục 3.1).
- Không tự tạo endpoint/field/DTO/action không có trong mục 2, 6 hoặc OpenAPI (mục 10).

## 8. Danh sách việc tiếp theo (backlog frontend)

### Phase 0 — Integration foundation
- [ ] Tạo project frontend: React 18 + TypeScript + Vite + Refine v4 + Ant Design 5 (mục 3.1).
- [ ] Runtime config: `apiBaseUrl`, `identityBaseUrl`, `mapboxToken`; trang lỗi khi thiếu.
- [ ] Yêu cầu backend cấu hình CORS whitelist origin (BLOCKER-01) trước khi nối browser.
- [ ] OAuth/PKCE với Identity Server; validate `state`/`nonce`; access token memory; wire vào Refine `authProvider`.
- [ ] API client: interceptor Bearer + `X-Request-Id`; unwrap envelope; refresh 1 lần khi 401; không retry 403; normalize error.
- [ ] Refine `dataProvider` map `ApiResponse`/`PagedResponse` theo mục 4.
- [ ] Route guard + `accessControlProvider` theo role matrix mục 5.
- [ ] Shared: table (server pagination 1-based, `useServerTable`), form (field error map, dirty guard), confirm, toast, loading/error/empty, `shared/map/` wrapper Mapbox.
- [ ] Hooks dùng chung: `useCurrentUser`, `usePermission`, `useApiErrorHandler`, `useMoneyFormat`, `useDateFormat` (mục 3.1).

### Phase 1 — Master data
- [ ] Roles → Customers → Employees/Drivers → Terminals → Trucks.
- [ ] Xác nhận field toạ độ Terminal trước khi thêm map cho Terminal (mục 6.1).

### Phase 2 — Operations
- [ ] Loads + state machine; Trips + stop builder + state machine; Inspections; Documents.

### Phase 3 — Finance
- [ ] Invoices; Payments (kiểm thử issue-on-load-dispatch sau SLICE-002).

### Phase 4 — Collaboration
- [ ] `/api/me` làm employee source; Messages (principal-scoped sau SLICE-003); Notifications.

### Phase 5 — Chờ backend có contract
- Dashboard/reports, containers, tracking/GPS real-time (cần cho map động, mục 6.1), maintenance, HOS, Stripe, AI dispatch, realtime, subscriptions.

## 8.1 UI-LOGIN-001 — LoginPage avatar layout

- **Status:** READY_FOR_REVIEW
- **Scope:** `src/pages/auth/LoginPage.tsx` và `src/pages/auth/LoginPage.scss`; `src/styles/app.scss` chỉ giữ style dùng chung.
- **Completed:** Giữ nguyên `useLogin<PasswordLoginParams>()` và `useLarkLogin()`, chia page thành `BrandPanel`, `PolarBearAvatar`, `CredentialsForm`, `LoginAlternativeActions`, `LoginHeading`; avatar SVG là gấu Bắc Cực, mắt đi theo toàn viewport với biên độ rõ ràng, tay che trực tiếp hai mắt khi focus mật khẩu, password visibility của AntD, validation và Lark fallback.
- **Backend boundary:** Không thêm endpoint/field/auth giả. Login thật vẫn đi qua Identity Server OAuth2/PKCE theo mục 5.
- **Verification:** `npm run build` PASS; `npm run lint` PASS; Chrome/Playwright desktop và mobile PASS, không có page error, body mobile không tràn ngang; transform mắt trái/phải lần lượt `-10px`/`+10px`; paws opacity `1` khi focus password; submit rỗng hiển thị đúng hai lỗi required.
- **Known warnings:** Vite cảnh báo chunk lớn hơn 500 kB (đã có từ bundle Ant Design); dev server ghi các cảnh báo AntD Spin/React Router future flag ở các màn khác, không phải lỗi LoginPage.
- **Next gate:** QA kiểm tra keyboard focus, loading/error từ auth provider và nghiệm thu trực quan; sau đó mới làm OAuth/PKCE wiring.
- **Style loading:** `src/styles/app.scss` dùng `@use "../pages/auth/LoginPage"`; không thêm import SCSS thứ hai trong `LoginPage.tsx` để tránh duplicate CSS.

## 9. Hiệu năng & tránh lỗi render

- Luôn xử lý rõ 3 trạng thái từ hook Refine — `isLoading`, `isError`, dữ liệu rỗng — trước khi render UI con; dùng antd `Spin`/`Skeleton`/`Empty`, không truy cập field trên `data` khi còn `undefined`.
- List/table: luôn server-side pagination + sort + filter (mục 4); không filter/sort toàn bộ dataset ở client; không set `pageSize` vượt 100.
- **Chống N+1** khi hiển thị dữ liệu liên quan (tên customer trong Load, số truck trong Trip...): ưu tiên field denormalized có sẵn trong response (mục 6); nếu phải tra thêm, dùng `useMany` gộp một lần cho danh sách ID thay vì gọi `useOne`/API riêng cho từng dòng trong loop.
- Search/select động (customer/employee/driver/terminal picker...) dùng `useSelect` của Refine với debounce 300–500ms theo mục 4; không tự viết `onChange` gọi API trực tiếp không debounce.
- Không tạo lại function/object mới ở mỗi lần render cho bảng lớn (column defs của antd `Table`, rule của `Form`) — định nghĩa ngoài component hoặc bọc `useMemo`/`useCallback`.
- Invalidate query đúng phạm vi sau mutation theo mục 7 (list + detail + resource denormalized liên quan) — không invalidate toàn bộ cache gây refetch thừa và giật UI.
- Nút cho action dài (dispatch, deliver, upload...) phải disable khi mutation đang `isLoading`, tránh bấm lặp gây gọi API trùng/N+1 ngoài ý muốn.
- Polling notification dùng backoff đã quy định ở mục 6, không polling cố định khoảng ngắn gây tải và re-render liên tục.
- Map (mục 6.1): không re-render toàn bộ `Map` component khi state không liên quan đổi — tách marker/layer thành component riêng, memo hoá.

## 10. Quy tắc bắt buộc cho AI code (prompt chuẩn — dùng để dán vào system prompt / custom instructions của AI coding tool)

Đoạn dưới đây là bản chuẩn hoá, có thể copy nguyên văn vào cấu hình của Cursor/Copilot/Claude Code... cho project frontend này:

```text
Bạn là AI code cho frontend Logistics TMS (backend Spring Boot logictics_api).
API backend là API chuẩn, đã có sẵn contract — không phải nơi để suy đoán.

STACK BẮT BUỘC — không đổi khác:
- React 18 + TypeScript + Vite + Refine v4 + React Router 6 + Ant Design 5 + Axios + TanStack Query 4.
- UI chỉ dùng component Ant Design; không cài/dùng UI kit khác.
- Mọi call API đi qua Refine (useTable/useForm/useSelect/useOne/useMany/useCustom) và dataProvider
  chuẩn hoá theo envelope ApiResponse/PagedResponse — không tự viết fetch/axios rời rạc trong component.
- Bắt buộc tái sử dụng hook có sẵn trong core/hooks (useCurrentUser, usePermission,
  useApiErrorHandler, useServerTable, useMoneyFormat, useDateFormat) — không viết lại logic tương đương.

CẤM N+1:
- Không gọi API trong vòng lặp (for/map) để lấy dữ liệu quan hệ cho từng dòng bảng.
- Ưu tiên field denormalized đã có sẵn trong response; nếu cần tra thêm, dùng useMany gộp 1 lần.
- Không refetch dữ liệu đã có trong cache của Refine/TanStack Query trừ khi invalidate có chủ đích
  sau mutation (đúng phạm vi: list + detail + resource liên quan).

CẤM BỊA — nghiêm ngặt:
- Không tự tạo endpoint, field, DTO, action, trạng thái, hoặc quyền không có trong tài liệu dự án
  (frontend memory / frontend-context.md) hoặc /v3/api-docs. Không đoán tên field theo convention.
- Không tự thêm chức năng/nút/trang không được yêu cầu; không "sáng tạo" business logic ngoài đặc tả.
- Không code cho các module backend chưa hỗ trợ: dashboard/reports, AI dispatch, Stripe, container CRUD,
  tracking/GPS, maintenance/HOS/DVIR, POD/BOL, VIN decode, realtime, message edit/delete,
  notification mark-one-read, invoice actions send/approve/cancel. Nếu được yêu cầu, phải báo lại
  là backend chưa hỗ trợ thay vì tự mock response hoặc bịa API.
- Khi không chắc một field/endpoint có tồn tại: dừng lại và hỏi hoặc kiểm tra /v3/api-docs/DTO Java,
  không tự đoán rồi code tiếp.

HIỆU NĂNG & TRÁNH LỖI RENDER:
- Luôn xử lý rõ isLoading/isError/rỗng trước khi render; không truy cập field trên data khi undefined.
- List luôn server-side pagination/sort/filter, pageSize tối đa 100, search debounce 300-500ms.
- Không tạo lại function/object mỗi lần render cho bảng lớn — dùng useMemo/useCallback.
- Disable nút action khi mutation đang loading để tránh gọi API trùng.

MAP:
- Dùng Mapbox GL JS (qua react-map-gl), token đọc từ runtime config, không hardcode.
- Không hiển thị vị trí real-time (chưa có endpoint tracking/GPS ở backend).
- Trước khi thêm map cho một resource, xác nhận resource đó thật sự có field toạ độ trong DTO/OpenAPI;
  không tự bịa thêm field toạ độ nếu chưa có.
```

## 11. Nguồn đối chiếu

- `docs/docs/frontend-context.md` — chi tiết đầy đủ (1742 dòng), nguồn chính của file này.
- `docs/docs/business/feature-delivery-plan.md` — trạng thái FR + bằng chứng SLICE-001→004.
- `src/main/java/**/controller/*Controller.java`, `dto/request|response/*.java` — nguồn quyết định contract.
- `src/main/java/com/company/logicstic/shared/dto/ApiResponse.java`, `PagedResponse.java` — envelope.
- `src/main/java/com/company/logicstic/shared/exception/GlobalExceptionHandler.java`, `ErrorCode.java` — error contract.
- `scripts/postman/logicstic-api.postman_collection.json` — mẫu E2E smoke và dependency chuẩn.
- Runtime OpenAPI: `GET /v3/api-docs`.
- Refine docs (resource/dataProvider/authProvider/accessControlProvider/hooks) — tham khảo khi implement mục 3.1.
- Mapbox GL JS / react-map-gl docs — tham khảo khi implement mục 6.1.

Khi backend đổi DTO/controller:
1. cập nhật OpenAPI;
2. regenerate API client (nếu dùng generator);
3. regenerate Postman;
4. cập nhật `frontend-context.md` và file memory này;
5. chạy contract + frontend E2E.

## 12. Role Handoffs

### HOFF-0001 — Frontend Developer → QA / Tester

- **Timestamp:** 2026-08-23T13:37:00+07:00
- **Status:** DONE
- **Objective:** Chuyển giao UI login mới để QA xác minh trước khi nối OAuth/PKCE thật.
- **Inputs:** `LoginPage.tsx` hiện có; Ant Design 5; hook `useLogin`/`useLarkLogin`; backend authentication contract; mẫu giao diện avatar được người dùng cung cấp.
- **Files changed:** `src/pages/auth/LoginPage.tsx`; `src/pages/auth/LoginPage.scss`; `src/styles/app.scss`; `ai-frontend-project-memory.md`.
- **Decisions:** Dùng inline SVG/CSS animation, không copy mã nguồn bên ngoài; giữ nguyên password/Lark login contract; không tạo `/login` backend mới.
- **Verification:** `npm run build` PASS; `npm run lint` PASS; Playwright + `/usr/bin/google-chrome` desktop/mobile PASS; no page errors; mobile width 390 không overflow; mắt di chuyển trái/phải `-10/+10px`; paws opacity `1` khi focus password; validation required PASS; `git diff --check` PASS.
- **Open issues:** OAuth/PKCE thực tế, runtime Identity Server/CORS và auth error/loading UX chi tiết chưa nằm trong lượt này.
- **Style verification:** Production bundle `dist/assets/index-B96IBJ35.css` chứa `.animated-login-page` và `.login-avatar-paws`; SCSS được nạp từ app entry.
- **Next role/action:** QA chạy test keyboard/focus/loading/error và ghi defect nếu có; không mở rộng sang GPS, API mới hoặc backend login endpoint.
