# TMS Operations Flow — trạng thái triển khai

Nguồn đặc tả: `tms_business_flow_ux_dom.md`. Giao diện Phase 1 đã được nối vào backend thật của dự án; không còn fixture, gateway demo hay banner mẫu.

## 1. Trạng thái từng màn

| Màn | Trạng thái | Route / Test id chính |
|---|---|---|
| S01 Operations Dashboard | ✅ Dữ liệu thật | `/tms` · `dashboard-kpi-*`, `dashboard-map` |
| S02 New Shipment | ✅ Dùng form Load có thật | nút `New shipment` → `/loads/create` |
| S03 Dispatch | ✅ Dữ liệu thật | `/tms/dispatch?filter=&shipment=&q=` · `dispatch-filter-*`, `dispatch-queue` |
| S04 Auto-assign modal | ⛔ Chưa có contract | — |
| S05 Route Optimization | ⛔ Chưa có contract | — |
| S06 Edit stops modal | ⛔ Chưa có contract | — |
| S07 Inbox | ⛔ Chưa có contract | — |
| S08 Approve AI dispatch | ✅ Dữ liệu thật | `/tms/approvals` + modal · `suggestion-approve`, `suggestion-reject` |
| S09 Shipment Detail | ✅ Dữ liệu thật | `/tms/shipments/:loadId` · `shipment-detail-id`, `shipment-map`, `tms-timeline` |
| S10 Share live tracking | ⛔ Chờ backend | — |
| S11 Live Tracking | ⛔ Chờ backend | — |

Luồng đang chạy: Dashboard → Dispatch → chọn load → Shipment Detail → timeline thật; dashboard/dispatch mở được AI decision đang chờ duyệt và approve/reject thật.

## 2. Nguồn dữ liệu thật

| Dữ liệu | Endpoint | Ghi chú |
|---|---|---|
| Loads | `GET /api/loads?page=&pageSize=100` | Phân trang tới tối đa 10 trang (1.000 dòng) |
| Load detail | `GET /api/loads/{id}` | Dùng cho S09 |
| Load timeline | `GET /api/loads/{id}/timeline` | Event thật, không suy diễn |
| Trucks | `GET /api/trucks?page=&pageSize=100` | Tối đa 5 trang (500 xe), marker theo toạ độ thật |
| AI pending | `GET /api/ai/dispatch/pending` | Polling 30 giây |
| AI theo load | `POST /api/ai/loads/overview` `{loadIds}` | Ghép `latestDecisionId` với load |
| Approve / reject | `POST /api/ai/dispatch/decisions/{id}/approve|reject` | Approve gọi `assignTruck`; reject bắt buộc lý do |

Không còn network call nào tới fixture. Không hiển thị field không có trong response: không PO, pallets, weight, BOL, ETA dự kiến, phần trăm tuyến, speed/fuel/reefer/HOS hay đường đi trên bản đồ.

## 3. Quy tắc trạng thái (một nguồn: `src/utils/tms-flow/status.ts`)

`LoadResponse.status` là chuỗi tự do nên trạng thái vận hành được suy ra từ timestamp:

| Ưu tiên | Điều kiện | Trạng thái |
|---|---|---|
| 1 | `cancelledAt != null` | `cancelled` |
| 2 | `deliveredAt != null` | `delivered` |
| 3 | `pickedUpAt != null` | `in_transit` |
| 4 | `dispatchedAt != null` | `dispatched` |
| 5 | `assignedTruckId != null` | `assigned` |
| 6 | còn lại | `open` |

Risk chỉ tính cho load chưa terminal và có `requestedDeliveryDate`:

- quá hạn → `delayed`
- trong 4 giờ tới → `at_risk`
- còn lại → `none`

Cửa sổ 4 giờ nằm ở `src/constants/tms.ts`. Khi backend có operations summary, cửa sổ sẽ lấy từ response để tránh lệch cấu hình.

## 4. Giới hạn đã biết

- **Chưa có operations summary/filter phía server**: KPI, bộ lọc queue và sort được tính trong browser trên tối đa 1.000 load. Nếu tenant nhiều hơn, dashboard hiện cảnh báo `Showing the first … of … loads` và số liệu chỉ phản ánh phần đã tải.
- **Pending AI decision chưa trả `loadId`**: phải ghép qua `POST /api/ai/loads/overview` (tối đa 100 load active mỗi lần). Decision của load nằm ngoài 100 load đầu sẽ hiện mã decision thay vì số load.
- **S10/S11 chưa triển khai**: backend chưa có module tracking link. Không có route `/tms/tracking`, không có nút Share tracking; route và UI sẽ được thêm khi API tracking sẵn sàng.
- **Backend chưa được sửa trong phiên này**: cây `/home/vumoi/logictics_api` còn thay đổi chưa commit nên các thay đổi backend (tracking, operations summary, `loadId` trong suggestion) chưa được thực hiện.
- **Copy màn hình giữ tiếng Anh literal**. Chỉ thêm ba nhãn navigation (`tms-dashboard`, `tms-dispatch`, `tms-approvals`) vào vi/en; ja không có namespace `navigation`.

## 5. Điều hướng và quyền

- `/tms` được bọc `ResourceAccessBoundary resource="loads" action="list"`.
- AppSider gom TMS thành zone `zone:tms` với ba mục: Dashboard (`/tms`), Dispatch (`/tms/dispatch`, quyền `loads:list`), AI approvals (`/tms/approvals`, quyền `ai-dispatch:AI_DISPATCH_VIEW`).
- `/tms/shipments/:loadId` nằm trong cùng route group nên giữ nguyên quyền `loads:list`.
- Nút approve/reject còn kiểm tra `ai-dispatch:AI_DISPATCH_APPROVE`; thiếu quyền thì nút bị disable và backend vẫn là chốt cuối.

## 6. Bằng chứng kiểm tra

Chạy trong phiên ngày 2026-10-22:

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run build` | 0 | `✓ built in 1.68s` (cảnh báo chunk >500 kB có sẵn) |
| `npm run lint` | 0 | 0 error, 4 warning `react-hooks/exhaustive-deps` có sẵn |
| `npx vitest run` | 0 | 208 file / 1.380 test pass |

Test mới của flow:

- `src/utils/tms-flow/status.test.ts` — 12 test: thứ tự 6 trạng thái; risk delayed/at-risk/none; map field thật; queue/filter/sort/counts; summary và load risk chính.
- `src/api/tms-flow/tmsFlow.api.test.ts` — 7 test: phân trang loads/trucks và cờ truncated; unwrap pending; payload approve/reject; map lỗi HTTP sang `TmsApiError`; giới hạn 100 id cho AI overview.

Sàn test ghi trong `docs/restructure/PROGRESS.md` là 1.205; hiện tại 1.380.

## 7. Việc còn lại

- Backend: commit cây hiện tại, sau đó thêm tracking link API, operations summary/filter và `loadId`/`loadNumber` trong suggestion.
- Frontend sau backend: S10/S11, bỏ giới hạn 1.000 load, bỏ cảnh báo truncated, dùng `riskWindowHours` từ summary.
- Playwright flow thật + responsive 1440/1024/768/390/320; screenshot evidence vào `docs/design/tms-flow/`.
- Test component cho `ApproveSuggestionModal` (double-submit, reject thiếu lý do, 409) và cho ba màn TMS với dữ liệu mock.
