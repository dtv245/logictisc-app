# Tiến độ sửa QA 02/11/2026

Phạm vi: chỉ sửa FE trong repo `logictisc-app`. Không thay đổi backend, auth/tenant hay proxy `/api/**`. Không có phiên SSO thật nên mọi kết luận dưới đây dựa trên đọc code, unit test với dữ liệu giả, lint và build; các mục cần API thật nằm ở “Cần tự kiểm tra tay”.

## Bảng trạng thái

| Ticket | Lớp lỗi | Nguyên nhân | Cách sửa | File đã đổi | Xác minh | Trạng thái |
|---|---|---|---|---|---|---|
| D-01.b | FE | Các trường địa chỉ bắt buộc chấp nhận chuỗi chỉ có khoảng trắng. | Rule `whitespace` từ chối chuỗi toàn khoảng trắng ở cả điểm lấy và giao; không thay đổi địa chỉ hợp lệ. | `src/forms/AddressFields.tsx`, `AddressFields.test.tsx` | Build/lint exit 0; 16 test mục tiêu đạt, gồm test hai đầu. | FIXED-CẦN-KIỂM-TAY |
| AUTH-007 | Chưa xác định | Đổi công ty gặp `Failed to fetch`, phiên mất sau đó; thiếu Network trace để xác định request lỗi. | Truy vết read-only: phiên bị xóa trước khi bắt đầu OIDC redirect; chưa thay đổi auth/tenant. | Không | Đọc code và bằng chứng QA AUTH-007, không tái hiện live. | NEEDS-INFO |
| 3 [P1] | FE | `EntityPicker resource="containers"` gọi data provider tới resource không có trong registry nên ném `RESOURCE_NOT_CONFIGURED:containers` ngay khi mở form. Backend chưa có contract container. | Thay picker bằng `Select` bị khóa kèm giải thích “chưa khả dụng”, không phát request container; form vẫn tạo được đơn không container. | `src/features/loads/components/LoadForm.tsx`, `LoadForm.test.tsx` | 2 test mục tiêu đạt; không còn `picker-containers`; lint/build đạt. | FIXED-CẦN-KIỂM-TAY |
| 11 [P2] | FE | Nút lưu vừa chạy `onClick` của Refine vừa submit HTML; lỗi backend hiện toast chung kể cả khi field đã có lỗi, và template cũ để lại nhãn `(mã: )` rỗng. | Bỏ `onClick` trùng, để submit HTML kích hoạt validate + `onFinish`; thêm `hasBackendFieldErrors` để bỏ toast chung khi lỗi đã gắn vào field; chuẩn hóa bỏ `(mã: )`. | `LoadForm.tsx`, `LoadForm.test.tsx`, `src/pages/loads/create.tsx`, `src/pages/loads/edit.tsx`, `src/forms/backendFieldErrors.ts`, `src/tests/forms/backendFieldErrors.test.ts`, `src/utils/apiErrorNotification.ts`, `apiErrorNotification.test.ts` | 7 test mục tiêu đạt: không submit khi thiếu trường, không còn nhãn mã rỗng, nhận diện field error đúng. | FIXED-CẦN-KIỂM-TAY |
| 1 [P1] | FE + backend đang chạy | FE gọi literal `GET /api/drivers/expiring`; lỗi QA cũ cho thấy request từng rơi vào `/api/drivers/{id}`, chưa xác nhận phiên bản backend. | Giữ endpoint; nhận diện 400-UUID/404 và hiển thị thông báo “không khả dụng trên máy chủ này”; 500 vẫn có retry. | `src/pages/drivers/DriverExpiringPage.tsx`, `DriverExpiringPage.test.tsx` | QA UI-020 mở đúng route, danh sách nghiệp vụ còn chưa hỗ trợ. | BLOCKED-BACKEND |
| 2 [P1] | FE / contract | Tab hồ sơ từng coi 404 sub-resource là “không tìm thấy trang”; chưa xác định được response 404 phân biệt dữ liệu trống và endpoint chưa triển khai. | FE hiện hiển thị empty state với mọi 404 sub-resource, 403/5xx tách riêng. Cần xác nhận contract để tránh nhầm endpoint thiếu với dữ liệu trống. | `src/components/drivers/profile/DriverProfileSection.tsx`, tests, `src/pages/drivers/DriverProfilePage.tsx` | QA UI-021 mở được hai tab rỗng; chưa kiểm chứng dữ liệu có hồ sơ hoặc nguyên nhân 404. | NEEDS-INFO |
| 6 [P2] | FE | Filter gửi `bill_of_lading` trong khi dữ liệu lưu `BILL_OF_LADING`; backend so khớp chính xác nên trả 0. | Đặt value filter BOL đúng `BILL_OF_LADING`; chuẩn hóa chữ thường chỉ để hiển thị/nhóm, không đổi giá trị gửi server; thêm test mapping. | `src/features/documents/components/documentUtils.tsx`, `documentUtils.test.tsx`, `src/types/document.types.ts`, `src/tests/features/documents/DocumentDropboxView.test.tsx` | 3 test mapping + 9 test view đạt. | FIXED-CẦN-KIỂM-TAY |
| 5 [P2] | FE / phạm vi dữ liệu | Tìm kiếm cục bộ trên các đơn đã tải, không giải thích phạm vi; viết tắt `LA-SF` không khớp tên thành phố/địa chỉ đầy đủ. | Trim + không phân biệt hoa thường; so khớp cả thành phố/địa chỉ hai đầu; ghi rõ phạm vi “các đơn đã tải” và viết tắt không khớp ngay trên Queue. | `src/utils/tms-flow/status.ts`, `src/utils/tms-flow/status.test.ts`, `src/pages/tms-flow/DispatchPage.tsx` | 13 test status đạt, gồm `"  LOS ANGELES "`, `"san francisco"`, địa chỉ. | FIXED-CẦN-KIỂM-TAY |
| 4 [P1] | FE (nguồn số liệu) | Dispatch đếm at-risk gồm delayed, TMS overview tách riêng, dashboard lại lấy báo cáo khác; ba màn hình không cùng nguồn/định nghĩa nên số lệch. | Dùng chung `useTmsLoads`; thêm `countTmsRiskQueue = delayed + atRisk` cho KPI At risk; hiển thị định nghĩa, kỳ 30 ngày, phạm vi và trạng thái truncated; chỉ để “không có dữ liệu” khi thật sự thiếu API (xe sẵn sàng). | `src/utils/tms-flow/status.ts`, `status.test.ts`, `src/pages/tms-flow/OperationsDashboardPage.tsx`, `src/features/dashboard/components/OperationsDashboardView.tsx`, `OperationsDashboardView.scss`, `src/locales/{vi,en,ja}.ts`, `src/tests/pages/dashboard/DashboardResponsive.test.tsx` | 15 test dashboard + 13 test status đạt; có ca zero thật, truncated và lỗi/retry. | FIXED-CẦN-KIỂM-TAY |
| 8 [P2] | FE + contract | Các màn gắn `km` và `mi` khác nhau; DTO `load.distance` và `trip.totalDistance` không ghi đơn vị. Các trường tên `*_miles` không đủ chứng minh đơn vị hai trường legacy. | Có formatter chung trong cây hiện tại, nhưng không thể xác nhận giả định dặm hoặc liên kết load-trip chỉ từ cùng tên tuyến. | `src/utils/distance.ts`, các nơi hiển thị khoảng cách | Cần contract BE và ID liên kết load-trip để kiểm chứng. | NEEDS-INFO |
| 7 [P2] | FE / dữ liệu | Trip #38 và #39 PLANNED có completedAt; #38 còn có pickup depart 08:59 sau completedAt 08:26 cùng ngày. | FE cảnh báo, giữ timestamp; dữ liệu và invariant vẫn cần backend xử lý. | `src/pages/trips/show.tsx`, `show.test.tsx`, `src/locales/{vi,en,ja}.ts` | QA UI-015/UI-016 báo FAIL invariant; test FE cảnh báo không chứng minh dữ liệu đúng. | BLOCKED-BACKEND |
| 9 [P2] | FE / contract | Ô nhập UUID tự do cho phép chọn sai; API danh sách không thể hiện settlement đã giữ cho payroll khác. | Bảng chọn phân trang, lọc `LOCKED`, đúng kỳ và tiền tệ; chống trùng id; tổng Decimal; đổi kỳ/tiền tệ xóa lựa chọn. Reservation vẫn phải do backend xác minh khi submit. | `src/api/payroll/settlementPicker.api.ts`, `src/hooks/payroll/usePayrollSettlements.ts`, `src/components/payroll/PayrollSettlementPicker.tsx` + test, `src/pages/payroll/PayrollEntryPage.tsx`, `src/tests/pages/payroll/PayrollEntryPage.test.tsx` | 8 test picker/trang và 2 test API đạt; không chạy “Tính lương” live. | BLOCKED-BACKEND (reservation) |
| 10 [P3] | FE | Bảng đối soát/thanh toán hiển thị mã lý do thô. | Map mã đã biết sang tiếng Việt + gợi ý hành động; giữ mã gốc trong tooltip; mã lạ dùng fallback, nội dung tự do giữ nguyên. | `src/constants/payrollReasons.ts`, `payrollReasons.test.ts`, `src/components/payroll/PayrollReason.tsx`, `PayrollReason.test.tsx`, `PaymentAttempts`, `PayrollReconciliationPage` | 1 test component + 1 test constants đạt, gồm fallback mã lạ. | FIXED-CẦN-KIỂM-TAY |
| 12 [P2] | BE | Backend trả `actualInvoicedRevenue: 0` khi chưa có hóa đơn đủ điều kiện, nên FE không phân biệt “0 thật” với “chưa có dữ liệu”. | FE đã tôn trọng `availability`/null: chỉ AVAILABLE/PARTIAL có số mới format, còn lại “—”; hiển thị tag lý do/basis. Không tự suy đoán từ 0. | `src/formatters/financialDisplay.ts`, `src/features/profitability/components/ProfitabilityMetricCard.tsx`, `src/types/profitability.dto.ts`, `src/tests/features/profitability/ProfitabilitySummary.test.tsx` | 3 test profitability đạt: 0 AVAILABLE khác null/UNAVAILABLE. | BLOCKED-BACKEND |

## Backend handoff

### 1. Container cho form tạo đơn

- Endpoint đề xuất: `GET /api/containers?page=1&pageSize=20` (thêm `search` nếu cần).
- Response mong đợi (envelope phân trang hiện hành):
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "uuid", "number": "CONT-001", "type": "20FT", "status": "AVAILABLE" }],
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 20,
    "hasNext": false
  }
}
```
- Cần xác nhận quyền đọc, tên trường hiển thị (`number`), và có bắt buộc gắn container khi tạo load không. Hiện FE chặn chọn và không gọi endpoint.

### 2. Giấy tờ tài xế sắp hết hạn

- Endpoint đúng: `GET /api/drivers/expiring?days=30&page=1&pageSize=20&type=LICENSE`.
- Lỗi QA cũ: `400 VALIDATION_FAILED — Request parameter 'id' with value 'expiring' is invalid; expected type 'UUID'`, cho thấy request đã rơi vào `/{id}`; có thể bản đang chạy thiếu mapping literal. Retest mới báo tính năng chưa hỗ trợ, không lặp lỗi UUID. Cần xác nhận phiên bản backend và contract endpoint.
- Response mong đợi:
```json
{
  "success": true,
  "data": {
    "items": [{
      "driverId": "uuid", "driverName": "Nguyễn Văn A",
      "itemName": "Bằng lái hạng C", "type": "LICENSE",
      "expiryDate": "2026-12-01", "daysUntilExpiry": 29,
      "expiryStatus": "EXPIRING_SOON"
    }],
    "totalItems": 1, "totalPages": 1, "currentPage": 1, "pageSize": 20, "hasNext": false
  }
}
```

### 3. Hồ sơ tài xế — ý nghĩa 404 của sub-resource

- Các endpoint tab: `GET /api/drivers/{driverId}/licenses`, `/health-checks`, `/certifications`, `/emergency-contacts`, `/contracts`, `/insurances`… (phân trang).
- Đề nghị contract: driver không tồn tại → 404; driver tồn tại nhưng chưa có bản ghi → **200 với items rỗng**, không phải 404. Nếu giữ 404 cho “chưa có dữ liệu”, FE đang hiển thị empty state hướng dẫn thay vì trang lỗi; cần xác nhận để không che giấu endpoint thiếu.
- Response rỗng mong đợi: `{ "success": true, "data": { "items": [], "totalItems": 0, "totalPages": 0, "currentPage": 1, "pageSize": 20, "hasNext": false } }`.

### 4. Loại chứng từ

- Filter hiện gửi đúng giá trị lưu: `type=BILL_OF_LADING`. Cần xác nhận toàn bộ giá trị chuẩn của các loại còn lại (`proof_of_delivery`, `driver_license`, `inspection`, `receipt`, `photo`, `signature`, `other`) và việc backend so khớp chính xác hay không phân biệt hoa thường.
- Nếu backend chuẩn hóa về một casing duy nhất, cần thông báo để FE bỏ bảng giá trị đặc thù BOL.

### 5. KPI vận hành & tìm kiếm Dispatch

- Hiện FE tính trên các đơn đã tải. Đề nghị backend cung cấp một endpoint tổng hợp duy nhất, ví dụ `GET /api/reports/operations/summary?windowHours=4`:
```json
{
  "inTransit": 7, "delayed": 4, "atRisk": 9,
  "deliveredToday": 8, "assignableVehicles": 12,
  "exceptions": 2, "generatedAt": "2026-11-02T07:00:00Z",
  "scope": { "timeZone": "Asia/Ho_Chi_Minh", "loadedOnly": false, "truncated": false }
}
```
- Cần chốt: `atRisk` có gồm `delayed` không (FE đang dùng hợp của quá hạn + đến hạn trong 4 giờ), múi giờ, mốc “hôm nay”, và phạm vi tổng hợp. `assignableVehicles` chưa có API/field xác nhận nên FE để unavailable.
- Nếu muốn tìm kiếm toàn bộ thay vì các dòng đã tải: bổ sung `GET /api/loads?search=...` khớp số đơn, tên, khách hàng, thành phố/địa chỉ hai đầu (không phân biệt hoa thường, trim). Hiện backend chỉ hỗ trợ tên/mã tham chiếu.

### 6. Chuyến — trạng thái và đơn vị khoảng cách

- Bất biến đề nghị: `completedAt != null` chỉ khi `status` là hoàn tất; nếu dữ liệu cũ vi phạm, backend nên trả cảnh báo/field consistency hoặc sửa dữ liệu. Hiện FE cảnh báo và giữ nguyên timestamp.
- QA UI-015/UI-016: Trip #38 và #39 đều PLANNED với Completed At 10/10/2026 08:26; pickup của #38 khởi hành 08:59 cùng ngày trong khi delivery còn PENDING. Cần backend/đơn vị sở hữu dữ liệu kiểm tra và sửa nguồn, không coi cảnh báo là nghiệm thu invariant.
- `trips.planned_distance_miles` và `trips.actual_distance_miles` là dặm (tên cột xác nhận). Cần xác nhận `loads.distance`, `trips.total_distance`/`Trip.totalDistance` cũng là dặm; DTO không kèm unit.
```json
{ "id": "uuid", "status": "PLANNED", "completedAt": "2026-11-01T00:00:00Z", "totalDistance": 450, "plannedDistanceMiles": 450 }
```
- Đề nghị thêm `distanceUnit: "MILE"` vào các DTO khoảng cách để FE không phải suy đoán.

### 7. Payroll — settlement đã được giữ

- Picker gọi `GET /api/driver-settlements?payPeriodId={id}&status=LOCKED&page=1&pageSize=20`. Cần trả thêm trạng thái giữ chỗ, ví dụ `reservedByPayrollRunId` hoặc `availableForPayroll`.
```json
{ "id": "uuid", "settlementNumber": "ST-001", "driverName": "Nguyễn Văn A",
  "payPeriodId": "uuid", "payPeriodCode": "2026-10", "status": "LOCKED",
  "settlementNet": "12500000.00", "currency": "VND",
  "reservedByPayrollRunId": null }
```
- Backend vẫn phải là nơi chặn cuối; lỗi `PAYROLL_SETTLEMENT_ALREADY_RESERVED` từ `POST /api/payroll/runs/calculate` cần giữ nguyên.

### 8. Profitability — phân biệt 0 và chưa có dữ liệu

- `GET /api/reports/profitability/by-load` hiện trả `actualInvoicedRevenue: 0` khi không có invoice đủ điều kiện.
- Đề nghị trả `availability`/`reason` cho từng metric, ví dụ:
```json
{ "actualInvoicedRevenue": 0, "revenueAvailability": "AVAILABLE" }
{ "actualInvoicedRevenue": null, "revenueAvailability": "UNAVAILABLE", "reason": "NO_ELIGIBLE_INVOICE" }
```
- FE đã đọc `availability` của `MetricDto`; khi backend gắn UNAVAILABLE/null, màn hình sẽ hiện “—” thay vì 0.

## Cần tự kiểm tra tay

- **D-01.b**: nhập khoảng trắng vào địa chỉ lấy/giao, blur rồi submit; xác nhận lỗi tại trường và không có request tạo. Kiểm tra địa chỉ tiếng Việt hợp lệ vẫn giữ nguyên.
- **AUTH-007**: sau đăng nhập thật, ghi Network trace đã loại token, cookie và thông tin nhạy cảm cho thao tác đổi công ty; đối chiếu URL, method, status và initiator. Không suy nguyên nhân từ `Failed to fetch`.
- **Ticket 3 + 11**: với SSO thật mở “Tạo đơn hàng mới”; xác nhận form mở không có `RESOURCE_NOT_CONFIGURED`, ô container bị khóa có giải thích và DevTools không có request `/api/containers`. Submit form trống → chỉ lỗi tại field, không toast, không request tạo. Gây lỗi 400 kèm `errors` từ backend → chỉ lỗi field; gây 500 → có toast không chứa `mã:` rỗng.
- **Ticket 1 + 2**: mở giấy tờ sắp hết hạn trên bản backend đang chạy; ghi lại request/response. Mở hồ sơ tài xế có/không có bằng lái và liên hệ khẩn cấp; xác nhận 404 sub-resource ra “Chưa có hồ sơ”, lỗi mạng ra màn hình retry.
- **Ticket 6**: lọc BOL trên dữ liệu thật, so tổng với danh mục; thử một loại khác để xác nhận casing lưu.
- **Ticket 5 + 4**: tìm “Los Angeles”, “San Francisco”, rồi “LA-SF” trong Dispatch; so số In transit/At risk/Delivered today với cùng thời điểm ở dashboard; kiểm tra ghi chú phạm vi và trường hợp truncated.
- **Ticket 8**: mở cùng tuyến ở Dispatch, chi tiết đơn và chi tiết chuyến; xác nhận cùng đơn vị dặm và cùng con số (không tự quy đổi).
- **Ticket 7**: mở chuyến `PLANNED` có `completedAt`; cảnh báo phải thấy ngay trên tabs, timestamp vẫn hiển thị kèm tag.
- **Ticket 9**: chọn settlement qua nhiều trang, đổi kỳ/tiền tệ (lựa chọn phải xóa), kiểm tra tổng trước khi xác nhận. Không bấm “Tính lương” trong lúc kiểm thử.
- **Ticket 10**: mở đối soát có mã đã biết và mã lạ; xác nhận mô tả tiếng Việt, tooltip mã gốc và fallback.
- **Ticket 12**: cần backend gắn availability; sau đó xác nhận ca 0 thật hiển thị 0 và ca thiếu hóa đơn hiển thị “—”.

## Câu hỏi còn mở

- Bản backend QA đang chạy là phiên bản nào, và vì sao `/api/drivers/expiring` rơi vào `/{id}`?
- 404 của sub-resource hồ sơ tài xế là “chưa có dữ liệu” hay “không tồn tại/không có endpoint”?
- Giá trị lưu chuẩn của từng loại chứng từ ngoài `BILL_OF_LADING`?
- `loads.distance` và `trips.total_distance` có đúng là dặm như các cột `*_miles` không?
- Định nghĩa chốt của `delayed`/`atRisk`, múi giờ và phạm vi tổng hợp KPI?
- Khi nào backend trả trạng thái reservation của settlement trong danh sách?
- Khi nào profitability trả availability/null thay vì mặc định 0?
- AUTH-007: request nào thất bại khi mở đổi công ty và Identity Server có hỗ trợ chooser trong môi trường QA không?

## Kết quả kiểm tra

- `npm run lint`: exit 0; 4 cảnh báo `react-hooks/exhaustive-deps` có sẵn ở `ResourceListToolbar.tsx` và `useLocalizedColumns.tsx`, không phát sinh cảnh báo mới.
- `npm run build`: exit 0; chỉ còn cảnh báo chunk lớn hơn 500 kB (`index-*.js` ~506 kB).
- `npx vitest run --reporter=dot` (ngoài sandbox): exit 0 — **224/224 file, 1.426/1.426 test đạt** (127,54 s); cao hơn mốc gốc 1.205 test. Chạy ngoài sandbox vì test tương phản cần tạo tiến trình con và bị `EPERM` trong sandbox.
- Không chạy API thật, không dùng tài khoản demo để kết luận hành vi backend, không chạy “Tính lương”, không sửa backend.

STATUS: READY_FOR_REVIEW
