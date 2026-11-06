# Kiểm tra nghiệp vụ: loads

## Nguồn đối chiếu đã dùng
1. **Hợp đồng API backend (`logictics_api`)**:
   - Controller: `LoadController.java` (`GET /api/loads`, `GET /api/loads/{id}`, `POST /api/loads`, `PUT /api/loads/{id}`, `DELETE /api/loads/{id}`).
   - Controller: `LoadTimelineController.java` (`GET /api/loads/{loadId}/timeline`).
   - Controller: `LoadPickupBusinessDateController.java` (`POST /api/loads/{id}/requested-pickup-business-date`).
   - Service & Entity: `LoadService.java`, `Load.java`, `LoadEvent.java`, `LoadException.java`.
   - DTOs: `CreateLoadRequest.java`, `UpdateLoadRequest.java`, `LoadView.java`, `LoadTimelineResponse.java`.
2. **Tài liệu nghiệp vụ & Handoff**:
   - `docs/frontend-backend-handoff/docs/load-pickup-date-and-rating-mileage.md` (Đặc tả V22: ngày nghiệp vụ lấy hàng `requestedPickupBusinessDate`, provenance `reasonCode`, `reason`, `source`, chuỗi bất biến lịch sử `LOAD_PICKUP_DATE_HISTORY_PROTECTED`).
   - `docs/audit/SCREEN_INDEX.md` (Chỉ mục các màn hình quản trị chuyến hàng và luồng điều phối TMS).
3. **Mã nguồn frontend**:
   - Router & Capabilities: `src/router/AppRouter.tsx`, `src/components/resources/resourceCapabilities.ts`.
   - Cấu hình Resource & Handoff types: `src/features/loads/loads.resource.ts`, `src/types/load.types.ts`, `src/types/load.dto.ts`, `src/types/handoff.generated.ts`.
   - Danh sách & Biểu mẫu: `src/pages/loads/list.tsx`, `src/pages/loads/create.tsx`, `src/pages/loads/edit.tsx`, `src/pages/loads/show.tsx`, `src/features/loads/components/LoadForm.tsx`.
   - Component chi tiết & Redesign: `src/features/loads/components/redesign/ShipmentHeader.tsx`, `src/features/loads/components/redesign/ShipmentHeroCard.tsx`, `src/features/loads/components/redesign/ShipmentDetailView.tsx`, `src/features/loads/components/redesign/ShipmentLoadPlanCard.tsx`, `src/features/loads/components/redesign/RouteProgressBar.tsx`.
   - Tab nghiệp vụ liên quan: `src/features/loads/components/LoadTimelinePanel.tsx`, `src/features/loads/components/LoadFinancialPanel.tsx`, `src/features/loads/components/LoadDocumentsPanel.tsx`, `src/features/loads/components/LoadTripPanel.tsx`, `src/features/loads/components/LoadExceptionsPanel.tsx`, `src/features/loads/components/PickupBusinessDateForm.tsx`, `src/components/lark-base/LoadLarkSyncPanel.tsx`.

---

## Màn 1: Danh sách chuyến hàng (LoadList) — `/loads`

### Luồng hiện tại (as-is)
Người dùng truy cập `/loads` qua thanh điều hướng chính. Giao diện tải bảng dữ liệu `ResourceListPage<Load>` kết hợp phân trang, sắp xếp và lọc phía server thông qua Refine dataProvider (`loadRepository.search`). Cột mã số chuyến hàng (`number`) hiển thị dưới dạng liên kết chuyển hướng sang màn chi tiết `/loads/show/:id`. Mỗi dòng hiển thị mã đơn, tên hàng, trạng thái, khách hàng, số hiệu xe được gán, cùng ô trợ lý AI (`LoadAiOverviewCell`).

### Luồng mong đợi theo docs/API
Hỗ trợ tìm kiếm theo từ khóa (`search`), lọc theo trạng thái (`status`), khách hàng (`customerId`), xe (`truckId`), điều phối viên (`dispatcherId`), phân trang với tham số `page`, `pageSize`, sắp xếp theo `orderBy` và `descending` theo đúng quy chuẩn `QuerySortPolicy` của backend TMS.

### Phát hiện
- `[loads-001] [MEDIUM] [BUG-LOGIC] [CONFIRMED] src/features/loads/components/columns.tsx:47-53` — Cột trạng thái (`status`) hiển thị dạng tag tự do nhưng không chuẩn hóa chữ hoa/thường giữa các nguồn dữ liệu — Backend enum và service `LoadService.assignTruck` gán trạng thái chữ hoa `ASSIGNED` trong khi form nhập lại tạo chữ thường (`draft`, `dispatched`, `picked_up`) — Sửa ở frontend?: Có — Chuẩn hóa hiển thị trạng thái qua helper `statusTone()` và mapper thống nhất.
- `[loads-002] [LOW] [UX-TRAP] [CONFIRMED] src/features/loads/components/columns.tsx:20-25` — Liên kết chuyển sang màn chi tiết gắn trực tiếp vào số đơn `record.number` thay vì hỗ trợ toàn bộ dòng hoặc có icon hành động rõ ràng — Khi `record.number` là 0 hoặc chưa có, hiển thị fallback làm mất khả năng nhấp chuột chuyển trang — Sửa ở frontend?: Có — Luôn render liên kết với fallback chữ số hợp lệ hoặc icon điều hướng sang `/loads/show/:id`.

### Đã kiểm và đạt
- **Phân quyền & Tenant**: Bảo vệ qua `ResourceAccessBoundary` (`action="list"`, `resource="loads"`). Người dùng không có quyền bị chuyển hướng sang `<ForbiddenPage />`. Query tự động mang tenant context.
- **Phân trang server**: Dùng server-side pagination qua Refine table props, không kéo toàn bộ bảng về client.
- **Trạng thái rỗng & Tải**: Hiển thị loading skeleton / spinner của Ant Design Table và empty state khi không có dữ liệu.

---

## Màn 2: Tạo mới chuyến hàng (LoadCreate) — `/loads/create`

### Luồng hiện tại (as-is)
Người dùng nhấn nút "Tạo chuyến hàng" tại danh sách hoặc truy cập trực tiếp `/loads/create`. Giao diện hiển thị biểu mẫu `LoadForm` chia thành 6 phân đoạn chính: Thông tin chung, Điểm lấy hàng, Điểm giao hàng, Hàng hóa & an toàn (Hazmat), Cước phí & phân công, Tham chiếu ngoài. Phía bên phải có thanh Anchor điều hướng nhanh. Khi lưu, dữ liệu được lọc qua `buildResourceMutation` và gửi qua `POST /api/loads`.

### Luồng mong đợi theo docs/API
Theo đặc tả V22 `load-pickup-date-and-rating-mileage.md` và `CreateLoadRequest.java`, đơn hàng cần hỗ trợ độc lập trường `requestedPickupBusinessDate` (`LocalDate`, định dạng `YYYY-MM-DD`) kèm thông tin nguồn gốc thay đổi `requestedPickupDateProvenance` (`reasonCode`, `reason`, `source`). Đồng thời, khi tạo mới đơn hàng chỉ nên ở trạng thái khởi tạo (`draft`), không được phép nhảy cóc sang các trạng thái vận chuyển khi chưa có lộ trình.

### Phát hiện
- `[loads-003] [HIGH] [GAP-API] [CONFIRMED] src/features/loads/components/LoadForm.tsx:178-206` — Màn hình tạo đơn hàng thiếu trường nhập `requestedPickupBusinessDate` và provenance (`reasonCode`, `reason`, `source`) theo chuẩn V22 — Trong `CreateLoadRequest.java:53-54` backend yêu cầu hỗ trợ `requestedPickupBusinessDate`. Form hiện chỉ có DatePicker `requestedPickupDate` (datetime), không có trường riêng cho ngày nghiệp vụ, dẫn đến rating V1 bị chặn (`RATING_PRICING_DATE_REQUIRED`) — Sửa ở frontend?: Có — Bổ sung trường ngày nghiệp vụ `requestedPickupBusinessDate` độc lập với provenance mặc định (`source="USER"`, `reasonCode="MANUAL_INPUT"`).
- `[loads-004] [MEDIUM] [BUG-LOGIC] [CONFIRMED] src/features/loads/components/LoadForm.tsx:30-36,158` — Biểu mẫu cho phép chọn tùy tiện trạng thái đơn hàng (`draft`, `dispatched`, `picked_up`, `delivered`, `cancelled`) ngay khi tạo mới — `LoadForm.tsx:158` để người dùng chọn trạng thái từ dropdown `LOAD_STATUS_OPTIONS`. Việc tạo trực tiếp một đơn hàng ở trạng thái `delivered` phá vỡ hoàn toàn state machine, bỏ qua các mốc thời gian `dispatchedAt`, `pickedUpAt`, `deliveredAt` và không kích hoạt sự kiện điều phối — Sửa ở frontend?: Có — Khóa trạng thái cố định là `draft` khi ở chế độ tạo mới (`!isEdit`).
- `[loads-005] [LOW] [BUG-LOGIC] [CONFIRMED] src/features/loads/components/LoadForm.tsx:75-78` — Toạ độ địa lý mặc định bị gán cứng là `0, 0` — Khi người dùng không nhập toạ độ kinh độ/vĩ độ, form gửi `0.0, 0.0` (vị trí giữa Đại Tây Dương) lên backend thay vì giá trị null/undefined — Sửa ở frontend?: Có — Để trường toạ độ là tùy chọn (optional/undefined) để backend hoặc dịch vụ bản đồ tính toán vị trí thực.

### Đã kiểm và đạt
- **Chống double submit**: Sử dụng `saveButtonProps` của Refine, tự động kích hoạt cờ loading và vô hiệu hóa nút Submit trong suốt thời gian mutation diễn ra.
- **Validation**: Đầy đủ quy tắc bắt buộc cho khách hàng (`customerId`), tên đơn (`name`), loại đơn (`type`), địa chỉ 2 đầu, cước phí (`deliveryCostAmount > 0`), cự ly (`distance > 0`). Khi bật switch `isHazmat`, tự động mở rộng và bắt buộc nhập `hazmatClass` và `unNumber`.
- **Hiển thị lỗi backend**: Khi backend trả về lỗi validation 400 kèm mảng lỗi chi tiết, hàm `applyBackendFieldErrors` phân giải và gắn đúng thông báo vào từng ô input tương ứng.

---

## Màn 3: Chi tiết chuyến hàng (LoadShow) — `/loads/show/:id`

### Luồng hiện tại (as-is)
Người dùng truy cập `/loads/show/:id`. Component `LoadShow` gọi `useShow` lấy dữ liệu chuyến hàng từ `GET /api/loads/{id}`. Phần đầu trang (`ShipmentHeader`) hiển thị mã đơn, khách hàng, nhãn trạng thái và chi phí. Nội dung chính hiển thị qua các tab: "Overview" (sử dụng giao diện tái thiết kế `ShipmentDetailView`), "🧠 Trợ lý AI" (khi bật tính năng AI), "Timeline" (`LoadTimelinePanel`), "Financials & Costs" (`LoadFinancialPanel`), "Documents" (`LoadDocumentsPanel`), "Trip & Truck" (`LoadTripPanel`), "Exceptions" (`LoadExceptionsPanel`), và "Lark Base" (khi có quyền).

### Luồng mong đợi theo docs/API
Trang hiển thị toàn diện dữ liệu chuyến hàng, đồng thời cho phép cập nhật ngày nghiệp vụ lấy hàng (`POST /api/loads/{id}/requested-pickup-business-date` với khóa lạc quan `expectedChangeId`), theo dõi dòng thời gian thực thi (`GET /api/loads/{loadId}/timeline`), quản lý chứng từ và chi phí phụ phí theo phân quyền.

### Phát hiện
- `[loads-006] [HIGH] [BUG-LOGIC] [CONFIRMED] src/pages/loads/show.tsx:73, src/features/loads/components/LoadOverviewPanel.tsx:204, src/features/loads/components/redesign/ShipmentDetailView.tsx:15-46` — Form cập nhật ngày nghiệp vụ lấy hàng (`PickupBusinessDateForm`) bị cô lập hoàn toàn khỏi giao diện người dùng (Orphaned / Dormant component) — `PickupBusinessDateForm` được thiết kế chuẩn xác với khóa lạc quan `expectedChangeId` nhưng chỉ được nhúng trong `LoadOverviewPanel.tsx:204`. Trong khi đó, `LoadShow.tsx:73` đã chuyển sang hiển thị `ShipmentDetailView.tsx`, và không có bất kỳ thẻ con nào trong `ShipmentDetailView` nhúng form này. Kết quả là người dùng không thể thực hiện API `POST /api/loads/{id}/requested-pickup-business-date` từ UI — Sửa ở frontend?: Có — Đưa `PickupBusinessDateForm` vào thẻ thông tin kế hoạch chuyến (`ShipmentLoadPlanCard`) hoặc vị trí thích hợp trong `ShipmentDetailView`.
- `[loads-007] [MEDIUM] [UX-TRAP] [CONFIRMED] src/features/loads/components/redesign/ShipmentHeader.tsx:18-20` — Nút quay lại (Back) sử dụng `window.location.assign("/loads")` gây full page reload — Khi lịch sử trình duyệt không có trang trước, code gọi `window.location.assign` làm mất toàn bộ SPA state và React Query cache — Sửa ở frontend?: Có — Dùng hook `navigate(routes.resources.loads.list)` của React Router.
- `[loads-008] [MEDIUM] [MONEY] [CONFIRMED] src/features/loads/components/redesign/ShipmentHeader.tsx:72, src/features/loads/components/redesign/ShipmentHeroCard.tsx:146, src/features/loads/components/redesign/ShipmentLoadPlanCard.tsx:92` — Ép kiểu số tiền bằng `Number(load.deliveryCostAmount).toLocaleString()` thay vì formatter chuẩn hệ thống tài chính — `deliveryCostAmount` trong cơ sở dữ liệu là `DECIMAL(18,2)`. Việc ép kiểu `Number` có nguy cơ sai số làm tròn khi xử lý số tiền lớn và không đồng bộ với thiết lập phân cách tiền tệ chung — Sửa ở frontend?: Có — Sử dụng hàm định dạng tài chính chuẩn của dự án (`financialAmount` hoặc `formatCurrency`).
- `[loads-009] [MEDIUM] [GAP-API] [CONFIRMED] src/features/loads/components/redesign/ShipmentHeader.tsx:52-76, src/providers/permissions/roleMatrix.ts:31` — Thiếu các nút thao tác chuyển đổi trạng thái (Dispatch, Pickup, Deliver, Cancel) trên trang chi tiết mặc dù quyền đã được cấp trong `roleMatrix.ts` — Trong `roleMatrix.ts:31`, quyền thao tác trạng thái được định nghĩa nhưng trên header hay các card đều không có hành động tương ứng. Đối chiếu backend: `LoadController.java` chỉ có CRUD chuẩn, các hành động chuyển trạng thái thực tế nằm ở tầng `trips` hoặc TMS execution — Sửa ở frontend?: Cần làm rõ phạm vi nghiệp vụ — Bổ sung liên kết điều hướng sang chuyến xe (`trip`) hoặc thêm nút hủy đơn (`cancel`) nếu backend hỗ trợ.
- `[loads-010] [LOW] [UX-TRAP] [CONFIRMED] src/features/loads/components/redesign/ShipmentHeroCard.tsx:60, src/features/loads/components/redesign/RouteProgressBar.tsx:66` — Đơn vị cự ly bị gán cứng là dặm (`mi`) — Hiển thị cứng chuỗi "mi" mà không hỗ trợ cấu hình hệ đo lường theo quốc gia/tenant (km vs mi) — Sửa ở frontend?: Có — Hiển thị đơn vị dựa theo thiết lập tenant hoặc locale.
- `[loads-011] [LOW] [BLOCKED_BACKEND] [CONFIRMED] src/features/loads/components/LoadExceptionsPanel.tsx:16-28` — Tab "Exceptions" hiển thị trạng thái bị chặn do backend chưa cung cấp endpoint cho `LoadException` — `LoadExceptionsPanel` hiển thị trung thực cảnh báo `BLOCKED_BACKEND`, không sử dụng mock data giả lập — Sửa ở frontend?: Không (chờ backend bổ sung controller) — Giữ nguyên cảnh báo trung thực.

### Đã kiểm và đạt
- **5 trạng thái giao diện**: Có màn hình tải (`<Show isLoading={true}>`), thông báo lỗi mạng/API kèm nút Retry (`actions.retry`), thông báo khi không có dữ liệu, phân quyền bảo vệ từng tab (`ForbiddenState`).
- **Trung thực về ETA & GPS**: Component `ShipmentHeroCard.tsx:30` và `RouteProgressBar.tsx:81-83` ghi rõ: "Tiến độ hiển thị theo trạng thái, không phải vị trí xe thực tế (GPS)" và "Requested delivery appointment, không phải live ETA", không bịa số liệu GPS giả.
- **Bảo mật chi phí & tài chính**: Tab "Financials & Costs" được kiểm soát quyền chặt chẽ (`COST_VIEW`, `ACCESSORIAL_VIEW`, `PROFITABILITY_VIEW`, `RATE_PREVIEW`), người dùng không có quyền sẽ không thể kích hoạt API gọi dữ liệu tài chính.
- **Chứng từ đi kèm**: Tab "Documents" hỗ trợ tải lên file thật qua `DocumentUploadModal`, phân trang server và gắn đúng tenant key vào query cache.

---

## Màn 4: Chỉnh sửa chuyến hàng (LoadEdit) — `/loads/edit/:id`

### Luồng hiện tại (as-is)
Trang `LoadEdit` được cài đặt đầy đủ logic tại `src/pages/loads/edit.tsx`: tích hợp `useForm`, cơ chế hợp đồng chỉnh sửa `useResourceEditContract` để tự động xử lý xung đột phiên bản (HTTP 409 Conflict với `expectedVersion`), tự động cuộn đến trường thiếu theo gợi ý của AI GAP widget (`focusField`). Tuy nhiên, trong runtime hiện tại, màn hình này bị vô hiệu hóa bởi cờ kiểm soát năng lực `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false`.

### Luồng mong đợi theo docs/API
Backend cung cấp endpoint `PUT /api/loads/{id}` với DTO `UpdateLoadRequest.java`, yêu cầu trường bắt buộc `@NotNull @PositiveOrZero Long expectedVersion`. Khi xảy ra xung đột đồng thời, backend trả về mã lỗi 409 `CONCURRENT_MODIFICATION_CONFLICT`, cho phép frontend giữ lại bản nháp và đối chiếu khác biệt so với phiên bản trên máy chủ.

### Phát hiện
- `[loads-012] [HIGH] [GAP-API] [CONFIRMED] src/components/resources/resourceCapabilities.ts:17,20, src/router/AppRouter.tsx:291` — Màn hình chỉnh sửa Load bị vô hiệu hóa hoàn toàn trong runtime ứng dụng — Cờ `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false` khiến `AppRouter.tsx:291` không mount route `/loads/edit/:id`. Truy cập trực tiếp URL này sẽ rơi vào trang 404 (`NotFoundPage`). Tất cả các nút điều hướng "Sửa đơn hàng" hoặc "Điền thông tin" từ AI GAP đều bị disable — Sửa ở frontend?: Cần phối hợp backend kiểm thử tải xác nhận `expectedVersion` để kích hoạt cờ runtime — Mở lại route edit cho `loads` khi quy trình xác nhận phiên bản hoàn tất.

### Đã kiểm và đạt
- **Cơ chế chống ghi đè phiên bản**: File `useResourceEditContract.tsx` và `resourceMutation.ts` đã được thiết kế sẵn sàng cho việc đọc `snapshot.version` và gửi `expectedVersion` lên backend, có modal so sánh trường dữ liệu khi gặp lỗi 409.

---

## Luồng xuyên màn

1. **Từ Danh sách sang Chi tiết (`/loads` ➔ `/loads/show/:id`)**:
   - Khi nhấp vào số hiệu chuyến hàng `number` trên bảng danh sách, người dùng được chuyển hướng trực tiếp đến trang chi tiết của đúng bản ghi đó.
   - Nút quay lại tại trang chi tiết (`ShipmentHeader`) cần sử dụng React Router `navigate()` thay vì `window.location.assign()` để bảo toàn cache danh sách đã tải trước đó.
2. **Từ Tạo mới sang Danh sách (`/loads/create` ➔ `/loads`)**:
   - Sau khi tạo đơn hàng thành công, thuộc tính `redirect: "list"` trong `LoadCreate` tự động đưa người dùng trở về danh sách chuyến hàng `/loads`, kích hoạt invalidate query để bản ghi mới xuất hiện ngay lập tức ở đầu bảng.
3. **Từ Chi tiết sang Gán xe / Chuyến xe (`/loads/show/:id` ➔ `/trucks/show/:id` / `/trips`)**:
   - Tab "Trip & Truck" (`LoadTripPanel`) cung cấp liên kết chuyển hướng nhanh sang trang chi tiết của xe tải được gán (`/trucks/show/${load.assignedTruckId}`).
4. **Từ Trợ lý AI sang Biểu mẫu (`AI Gap` ➔ `Edit`)**:
   - Tính năng tự động cuộn `focusField` từ AI Gap sang `LoadEdit` hiện đang bị chặn do route edit chưa được kích hoạt trong runtime.

---

## Cần quyết định nghiệp vụ

1. **Kích hoạt màn hình chỉnh sửa `LoadEdit`**:
   - Frontend đã hoàn thiện logic đối chiếu xung đột phiên bản `expectedVersion` trong `useResourceEditContract`. Cần quyết định từ đội ngũ kỹ thuật/vận hành về việc bật cờ `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = true` để cho phép người dùng sửa thông tin đơn hàng trên giao diện web.
2. **Vị trí form cập nhật ngày nghiệp vụ lấy hàng (`requestedPickupBusinessDate`)**:
   - Cần thống nhất vị trí đặt `PickupBusinessDateForm` trên giao diện chi tiết mới (`ShipmentDetailView`): Đặt tại thẻ kế hoạch chuyến (`ShipmentLoadPlanCard`) hay mở thành một Action Modal chuyên dụng trên Header.
3. **Quy trình chuyển trạng thái đơn hàng**:
   - Quyết định xem đơn hàng có được phép chuyển trạng thái độc lập (ví dụ nút "Hủy đơn" trên header), hay toàn bộ vòng đời trạng thái (`dispatched`, `picked_up`, `delivered`) phải được điều khiển tuyệt đối qua phân hệ Điều phối chuyến xe (`trips`).

---

## Không chắc chắn / NOT RUN

- **Tích hợp bản đồ GPS thời gian thực**: Hiện tại giao diện chỉ hiển thị thanh tiến độ lộ trình ước tính dựa trên trạng thái (`RouteProgressBar`), chưa kết nối với luồng telemetry GPS thực của xe.
- **Quy trình tạo đơn từ nguồn đối tác ngoài (EDI / Broker)**: Biểu mẫu hiện hỗ trợ các trường `externalSourceId`, `externalBrokerReference`, nhưng quy trình webhook nhận đơn tự động từ broker thuộc phạm vi xử lý của backend, chưa thể kiểm thử trọn vẹn từ frontend.
