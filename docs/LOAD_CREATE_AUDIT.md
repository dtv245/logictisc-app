# Audit màn hình tạo Load — `/loads/create`

Ngày khảo sát: 2026-11-02. Phạm vi: frontend `logictics-app`, đối chiếu DTO backend
`logictics_api` (`CreateLoadRequest`, `Customer`, `Terminal`, `Container`, `Truck`).

## 1. Hiện trạng

- Trang: `src/pages/loads/create.tsx` → `Create` của Refine + `LoadForm`.
- Modal tạo nhanh ở màn điều phối dùng cùng `LoadForm` (`src/components/loads/LoadCreateModal.tsx`).
- `LoadForm` chia 6 nhóm: Thông tin chung, Điểm lấy, Điểm giao, Hàng hóa & an toàn,
  Cước phí & phân công, Tham chiếu ngoài. Có Anchor bên phải và footer dính đáy.
- Nguồn sự thật payload: `CreateLoadRequest` trong
  `src/types/handoff.generated.ts` (khớp record Java).

### Bảng field của form

| Nhóm | Field | Kiểu | Bắt buộc BE | Nguồn dữ liệu | Validation hiện có |
| --- | --- | --- | --- | --- | --- |
| Chung | `name` | string | Có (`@NotBlank`) | Người dùng | required |
| Chung | `customerId` | UUID | Có (`@NotNull`) | `/api/customers` (search server) | required |
| Chung | `type` | string | Có | Người dùng (4 lựa chọn) | required |
| Chung | `status` | string | Có | Người dùng (5 trạng thái) | required |
| Chung | `notes` | string | Không | Người dùng | — |
| Lấy hàng | `originAddressLine1` | string | Có | Người dùng / Terminal | required + whitespace |
| Lấy hàng | `originAddressLine2` | string | Không | Người dùng / Terminal | — |
| Lấy hàng | `originAddressCity` | string | Có | Người dùng / Terminal | required + whitespace |
| Lấy hàng | `originAddressState` | string | Có | Người dùng / Terminal | required + whitespace |
| Lấy hàng | `originAddressZipCode` | string | Có | Người dùng / Terminal | required + whitespace |
| Lấy hàng | `originAddressCountry` | string | Có | Người dùng / Terminal | required + whitespace |
| Lấy hàng | `originLocationLatitude/Longitude` | number | Có | Người dùng | required, range |
| Lấy hàng | `requestedPickupDate` | ISO datetime | Không | Người dùng | — |
| Lấy hàng | `originTerminalId` | UUID | Không | `/api/terminals` | — |
| Giao hàng | `destinationAddress*` | string | Có | Người dùng / Terminal | required + whitespace |
| Giao hàng | `destinationLocation*` | number | Có | Người dùng | required, range |
| Giao hàng | `requestedDeliveryDate` | ISO datetime | Không | Người dùng | — |
| Giao hàng | `destinationTerminalId` | UUID | Không | `/api/terminals` | — |
| Hàng hóa | `isHazmat` | boolean | Có | Người dùng | — |
| Hàng hóa | `hazmatClass`, `unNumber` | string | Không (bắt buộc khi Hazmat ở FE) | Người dùng | required có điều kiện |
| Hàng hóa | `containerId` | UUID | Không | **Chưa dùng được** | Ô disabled |
| Cước | `deliveryCostAmount` | decimal | Có | Người dùng | required, min 0 |
| Cước | `deliveryCostCurrency` | string | Có | Ẩn, mặc định `USD` | — |
| Cước | `distance` | number (dặm) | Có | Người dùng | required, min 0 |
| Phân công | `assignedTruckId` | UUID | Không | `/api/trucks` | — |
| Phân công | `assignedDispatcherId` | UUID | Không | `/api/employees` | — |
| Tham chiếu | `source` | string | Có | Ẩn, mặc định `MANUAL` | — |
| Tham chiếu | `externalSourceProvider/Id`, `externalBrokerReference` | string | Không | Người dùng | — |

Các field server tự sinh, **không** có trong request tạo: `id`, `number`, `version`,
`isInProximity` (FE gửi `false`), `customerName`, `assignedTruckNumber`…

## 2. Field có thể tự điền từ field khác

| Nguồn | Có thể điền | Ghi chú |
| --- | --- | --- |
| Terminal | 6 field địa chỉ (line1/2, city, state, zip, country) | `Terminal` chỉ có địa chỉ; **không có** toạ độ, giờ làm việc |
| Khách hàng | Không có field tương ứng trên Load | `CustomerView` có `notes`, `phone`, `email`, địa chỉ; Load không có field liên hệ/điều khoản |
| Load gần nhất của khách | Địa chỉ lấy/giao thường dùng | `GET /api/loads?customerId=…` cho phép lọc |
| Toạ độ 2 đầu | `distance` (đường chim bay/OSRM) | Chỉ khi cả 4 toạ độ hợp lệ |
| Toạ độ 2 đầu | ETA gợi ý | OSRM duration; ETA = giờ lấy + duration |
| Xe đã chọn | Cảnh báo Hazmat | `Truck.isHazmatPlacarded` |

## 3. Validation nghiệp vụ còn thiếu

1. `requestedDeliveryDate` phải sau `requestedPickupDate`.
2. `distance` phải > 0 khi đã có toạ độ (hiện chỉ `min=0`).
3. `deliveryCostAmount` phải > 0 (hiện `min=0`).
4. Cảnh báo khi chọn xe không được gắn Hazmat cho đơn `isHazmat`.
5. Không kiểm tra trọng tải/thể tích vì **Load không có field weight/volume**.
6. Không kiểm tra trùng container vì ô container đang disabled và endpoint container
   chưa nằm trong allowlist runtime.

## 4. Lỗi UX hiện có

- Ô "Container gắn kèm" disabled nhưng vẫn chiếm chỗ; không có mã container để kiểm tra ISO 6346.
- Toạ độ GPS nằm trong Collapse "kỹ thuật" nhưng lại bắt buộc; mặc định `0` vẫn qua validation.
- Không hiển thị mã Load (server sinh) nên người dùng không biết mã sẽ có sau khi lưu.
- `deliveryCostCurrency` ẩn và luôn `USD`; không có bộ chọn tiền tệ.
- Không có tóm tắt tuyến/ETA/giá; phải cuộn lên xuống để đối chiếu.
- Không có nút "Lưu & tạo tiếp" / "Lưu & điều xe"; mỗi lần lưu phải quay lại danh sách.
- Không có phím tắt Ctrl/Cmd+S.
- Chọn Terminal không điền địa chỉ dù dữ liệu đã có.
- Danh sách Terminal không ưu tiên bến bãi dùng gần đây.
- Form tạo trang và modal tạo nhanh lặp lại phần xử lý ngày (`dayjs`) khác nhau.

## 5. Backend gaps

| Mong muốn | Thiếu gì |
| --- | --- |
| Điền điều khoản thanh toán / tiền tệ / người liên hệ từ khách | `Customer` không có các field này; Load cũng không có |
| Điền toạ độ / giờ làm việc từ Terminal | `Terminal` không có toạ độ, giờ làm việc |
| Trọng lượng / thể tích + kiểm tra tải trọng xe | `CreateLoadRequest` và `Load` không có weight/volume |
| Chọn container + kiểm tra ISO 6346 + trùng container | `containers` chưa có trong `foundationApiResources`; ô chọn đang disabled |
| Giá cước gợi ý trước khi lưu | `POST /api/loads/{id}/rating/preview` cần Load đã tồn tại; chưa có endpoint báo giá theo tuyến/khách |
| Biên lợi nhuận | Không có field giá vốn trên Load; chi phí nằm ở `shipment-costs` sau khi tạo |
| Mã Load do hệ thống sinh | Đã đúng: `number` không nằm trong request tạo; chỉ cần hiển thị read-only |

## 6. Kế hoạch triển khai trong repo này

- Phase 1: autofill địa chỉ từ Terminal (giữ nguyên field người dùng đã sửa), gợi ý
  tuyến gần nhất theo khách hàng, sắp xếp Terminal dùng gần đây, validation thời gian,
  hiển thị mã Load read-only.
- Phase 2: ước tính khoảng cách/ETA bằng OSRM đã cấu hình (`VITE_ROUTING_API_URL`),
  TanStack Query cache + debounce; panel tóm tắt bên phải. Không gợi ý giá vì thiếu
  dữ liệu báo giá trước khi tạo.
- Phase 3: "Lưu & tạo tiếp", "Lưu & điều xe", Ctrl/Cmd+S, tạo nhanh khách hàng/bến bãi
  bằng modal có sẵn. Bỏ autosave nháp (dữ liệu khách hàng/địa chỉ nhạy cảm, chưa có
  hợp đồng lưu nháp) và clone (chưa có điểm vào UI thống nhất) — ghi rõ ở báo cáo.
- Utils thuần + test: ISO 6346, validation thời gian/ETA, dựng và đọc phản hồi OSRM.
