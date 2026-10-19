# Shipment Detail Redesign Notes (Ánh Xạ Dữ Liệu & Quy Tắc Thiết Kế)

Tài liệu này ghi nhận kết quả phân tích thiết kế từ mockup (`uploaded_media_1792137342240.png`) và ánh xạ trực tiếp sang schema dữ liệu hiện có trong Logistics TMS frontend (`logictics-app`) và backend (`logictics_api`).

---

## 1. Nguyên Tắc Cốt Lõi (Zero Mock Data in Production)
1. **Tuyệt đối không bịa số liệu**: Các giá trị mẫu trong mockup như `SF-48291`, `Acme Retail`, `Marcus Johnson`, `Sarah Bennett`, `92%`, `31 min`, `58 mph`, `34.1°F`, `14 / 26 pallets - 8,420 lb`, `I-680 detour`... chỉ là mockup. Không được hardcode vào code chạy thật.
2. **Xử lý khi thiếu dữ liệu**:
   - Khối phụ (callout telemetry tốc độ, nhiên liệu, nhiệt độ sensor): Ẩn hoàn toàn nếu không có trường dữ liệu tương ứng từ telemetry/sensor.
   - Khối bắt buộc (ETA, Window, Driver, Pallet): Hiển thị "Chưa có dữ liệu" hoặc placeholder trung tính "—".
3. **Minh hoạ xe tải**: Dùng vector SVG trung tính, không sao chép ảnh bitmap từ bản thiết kế mockup.
4. **Bảo tồn toàn bộ chức năng AI & Quản trị**:
   - Khu AI Dispatch: Giữ nguyên logic duyệt/từ chối, lý do, xếp hạng (LLM/heuristic), thời gian hết hạn (`expiresAt`), phân quyền theo `capabilities`.
   - Khu AI Gaps: Giữ nguyên danh sách cảnh báo/chặn, đếm số lần hỏi (`askCount/maxAsks`), điều hướng sang form chỉnh sửa, bỏ qua gap cảnh báo.
   - Văn bản do AI trả về render dạng text thuần, không dùng `dangerouslySetInnerHTML`.

---

## 2. Bảng Ánh Xạ Dữ Liệu Từng Khối

| Khối Giao Diện | Phần Tử Mockup | Nguồn Dữ Liệu Thật (DTO/Endpoint/Hook/File) | Trạng Thái | Cách Hiển Thị & Xử Lý Khi Thiếu |
|---|---|---|---|---|
| **Header** | Nút quay lại | `useNavigation().goBack` hoặc `Link` quay lại `/loads` | **CÓ** | Nút tròn `←` chuẩn |
| | Breadcrumb | `load.customerName` / `load.customerId`, `load.number` (`src/types/load.dto.ts`) | **CÓ** | `CHUYẾN HÀNG / {CUSTOMER} / #{NUMBER}` |
| | Tiêu đề lớn | `load.name`, `load.number` (`LoadResponse`) | **CÓ** | `Chuyến hàng #{number}` (hoặc tên chuyến nếu có) |
| | Nút Share tracking | *Không có endpoint công khai tạo link tracking* | **CHƯA CÓ** | **ẨN**, không render nút chết. Ghi nhận cần backend. |
| | Nút Call driver | `load.assignedTruckNumber`, tài xế qua relation nếu có SĐT | **MỘT PHẦN** | Chỉ hiển thị khi có số điện thoại tài xế (`tel:{phone}`). Nếu không có thì ẩn. |
| | Chip trạng thái | `load.status` (`StatusTag` / `statusTone`) | **CÓ** | Tag trạng thái dạng pill bo tròn theo màu hệ thống |
| | Chuông thông báo | `NotificationHeaderIcon` hoặc Badge header | **CÓ** | Render chuông thông báo nếu tích hợp |
| **Hero Card: Đầu thẻ** | Chip sự kiện AI | `useLoadAiDispatch` -> `dispatchState`, `suggestions[0]` | **CÓ** | Hiện chip tím `⚡ AI ĐỀ XUẤT ĐIỀU PHỐI` nếu có suggestion; ẩn nếu `not_started`/`idle` |
| | Tuyến (Origin → Dest) | `load.originAddressCity`, `load.originAddressState`, `load.destinationAddressCity`, `load.destinationAddressState` | **CÓ** | Cỡ chữ 24px đậm: `{Origin City} → {Destination City}` |
| | Status tag tuyến | `load.status` | **CÓ** | Tag màu sắc tương ứng trạng thái thực tế |
| | Dòng phụ | `load.number`, `load.customerName`, `load.distance` | **CÓ** | `#{number} · {customerName} · {distance} km` |
| **Hero Card: Stat Blocks** | WINDOW | `load.requestedPickupDate`, `load.requestedDeliveryDate` | **MỘT PHẦN** | Hiển thị khung giờ/ngày hẹn lấy hoặc giao. Nếu trống: "Chưa thiết lập" |
| | ETA NOW | Dự kiến đến từ `load.requestedDeliveryDate` / AI dispatch | **MỘT PHẦN** | Giờ/ngày ETA. Nếu có window: so sánh để gắn tag xanh "Trong khung giờ" hoặc đỏ "Ngoài khung giờ". Nếu không có: "—" |
| | TIME SAVED | `suggestions[0].metrics.timeSavedMinutes` / `costSaved` | **MỘT PHẦN** | Nếu AI dispatch có đề xuất: hiện số phút tiết kiệm (hoặc chi phí tối ưu). Nếu không có: ẩn hoặc "—" |
| **Hero Card: Xe & Callouts** | Minh hoạ xe | SVG trung tính của xe đầu kéo container / box truck | **CÓ** | Vector SVG inline sắc nét, không dùng ảnh chụp có bản quyền |
| | Driver Callout | `load.assignedTruckNumber`, `load.assignedDispatcherName` | **MỘT PHẦN** | Avatar icon, Tên người phụ trách/Tài xế, Mã xe. Thời gian ca (HOS) không có trong DTO -> Ẩn chỉ số HOS, không bịa "6h 12m on duty" |
| | SPEED Callout | Cảm biến GPS / Telematics | **CHƯA CÓ** | **ẨN**. Không điền 58 mph giả |
| | FUEL · RANGE | Mức nhiên liệu ELD | **CHƯA CÓ** | **ẨN**. Không điền 64% giả |
| | REEFER Callout | Cảm biến nhiệt độ thùng lạnh | **CHƯA CÓ** | **ẨN**. Không điền 34.1°F giả |
| | LOAD Callout | Trọng lượng / Pallet từ load details | **MỘT PHẦN** | Nếu có thông tin trọng lượng/khoảng cách thì hiển thị; nếu không thì hiện mã loại xe (`load.type`) |
| **Hero Card: Tiến trình** | Route Progress Bar | Các điểm dừng: Origin, Intermediate stops (nếu có), Destination. Vị trí dựa vào `load.status` | **CÓ** | Thanh tiến trình các mốc điểm dừng, icon xe di chuyển theo trạng thái thật (Pending -> Dispatched -> Picked up -> Delivered) |
| **Kế hoạch xếp hàng** | Sơ đồ pallet 2x13 | *Backend chưa có mô hình slot pallet 2x13 và cảm biến phân bố trục* | **CHƯA CÓ** | **Hiện thẻ rút gọn tải trọng & hàng hóa thực tế**: Tổng trọng lượng, loại xe, thể tích (nếu có). Tuyệt đối không vẽ các ô pallet giả kèm số cân nặng giả. |
| | Tải trọng trục (Steer, Drive...) | Cảm biến cân trục | **CHƯA CÓ** | Thay bằng thanh tỷ lệ tải trọng tổng (Gross weight capacity) nếu có dữ liệu |
| **PO / BOL & Documents** | Nhãn PO / BOL | `load.number` hoặc reference ID | **CÓ** | `#{number}` |
| | PICKUP | `load.originAddressCity`, `load.requestedPickupDate` | **CÓ** | Ngày giờ lấy hàng & địa điểm |
| | POD | `load.deliveredAt`, condition report delivery | **MỘT PHẦN** | "Đã giao hàng" kèm ngày giờ nếu có, hoặc "Chờ xác nhận" |
| | Danh sách tài liệu | Hook `useList` resource `documents` lọc theo `loadId` (`src/features/loads/components/LoadDocumentsPanel.tsx`) | **CÓ** | Tên file, loại tài liệu, trạng thái ký/upload, ngày tạo |
| **Cột phải: Agent AI** | Thẻ Agent Dispatch | Dữ liệu từ `useLoadAiDispatch` (`src/hooks/ai/useLoadAiDispatch.ts`) | **CÓ** | Toàn bộ: Chip Agent, độ tin cậy LLM, thời điểm, WHAT HAPPENED, WHY, RECOMMENDATION, 3 metrics dải, Nút Duyệt/Từ chối, Trạng thái đã duyệt |
| **Cột phải: AI Gaps** | Checklist chất lượng | Dữ liệu từ `useLoadAiGaps` (`src/hooks/ai/useLoadAiGaps.ts`) | **CÓ** | Danh sách Gap chặn (Blocking) và Cảnh báo (Warning), câu hỏi tự nhiên, nút Điền form, nút Bỏ qua |
| **Cột phải: Timeline** | Dòng thời gian | Endpoint `/api/loads/{id}/timeline` qua `LoadTimelinePanel` hoặc `load.statusHistory` | **CÓ** | Timeline dọc các sự kiện đã diễn ra: Tạo đơn, Điều xe, Lấy hàng, Sự kiện AI, Giao hàng. Timezone hiển thị góc trên |
| **Toast** | Toast thông báo | AntD `notification` / custom pill toast đen | **CÓ** | Pill toast nền đen, tick xanh khi thực hiện action thành công |

---

## 3. Các Mục Cần Backend Bổ Sung (Feature Requests)
1. **Public Tracking Link**: Endpoint sinh mã chia sẻ hành trình khách hàng (`/api/loads/{id}/share-tracking`). Hiện tại nút này sẽ ẩn để tránh render nút chết.
2. **Telematics / ELD Stream**: Tốc độ tức thời, mức nhiên liệu, nhiệt độ cảm biến reefer từ thiết bị IoT trên xe.
3. **Pallet Slot Matrix (2x13) & Axle Scales**: Schema chi tiết vị trí từng pallet trên rơ-moóc và cảm biến cân trục (Steer, Drive, Trailer). Hiện tại thể hiện dưới dạng thẻ tóm tắt năng lực tải trọng thực tế.
