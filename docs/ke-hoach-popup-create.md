# Kế hoạch popup tạo riêng theo màn hình và hợp đồng API

Ngày khảo sát: 02/11/2026. Phạm vi: lập kế hoạch, chưa thay đổi code hoặc bật chức năng ghi.

## 1. Quyết định thiết kế

- Mỗi màn có thao tác tạo hợp lệ sở hữu **một popup riêng theo nghiệp vụ**. Có thể dùng chung khung `ResourceModalFrame`, `Form`, notification và picker, nhưng không dùng một cấu hình field tổng quát để quyết định toàn bộ form của mọi resource.
- Nút tạo tại từng điểm vào của cùng màn phải mở cùng một popup. Với load, cần thống nhất cả Dispatch `New shipment`, danh sách và đường dẫn `/loads/create`; nếu URL trực tiếp vẫn được hỗ trợ, làm rõ cơ chế hiển thị và đóng popup, không để tồn tại hai luồng submit khác nhau.
- Popup lấy trường gửi từ **schema request của POST**, không lấy toàn bộ trường của GET response. Trường do server tạo như `id`, `number`, `version`, tên quan hệ và thời gian nghiệp vụ chỉ đọc từ response; không gửi lại khi tạo.
- Chia form dài thành nhóm, có validate tại trường, trạng thái tải/lỗi/không có quyền, khóa gửi trùng, giữ dữ liệu khi lỗi, cảnh báo khi đóng form bẩn, focus và bàn phím. Thành công thì đóng popup và invalidate đúng danh sách/tenant. Không dựng dữ liệu mặc định giả hoặc tự bật capability đang khóa.
- Tổ chức mới theo `AGENTS.md`: component `src/components/<domain>/`, hook `src/hooks/<domain>/`, API `src/api/<domain>/`, type thuần `src/types/<domain>/`; page mỏng, import `@/`, test cạnh file. Reuse code hiện có khi phù hợp; không di chuyển domain hoặc refactor ngoài phạm vi chỉ để làm popup.

## 2. Nguồn hợp đồng và giới hạn

- Swagger live được đọc trực tiếp bằng `GET http://localhost:8080/v3/api-docs`, HTTP 200. Snapshot đã lưu: [openapi-popup-create-2026-11-02.json](./openapi-popup-create-2026-11-02.json); OpenAPI 3.1.0, 161 path, 336 schema; SHA-256 `0152fe40e526ab8d174dfe16699f63127b5350d4a907e7ccaa3f0a108935ea2b`. Khảo sát lúc khoảng 15:04 UTC 02/11/2026; đây là backend local đang chạy, **không chứng minh** đồng nhất môi trường QA/production hoặc source backend hiện tại.
- Snapshot handoff [openapi-backend-remediation.json](./frontend-backend-handoff/docs/frontend/openapi-backend-remediation.json) ngày 06/10 có 140 path, 291 schema, `deployment_verified: false`; khác Swagger live (25 path chỉ có trong live, 4 path chỉ có trong snapshot). Không dùng snapshot cũ làm nguồn duy nhất; kiểm tra lại Swagger live và đối chiếu Spring DTO/controller trước mỗi màn, lưu fingerprint vào test/handoff.
- Swagger là mô tả contract, chưa chứng minh quyền, state machine, enum thực tế, giá trị mặc định, precision tiền hay backend deploy. Nếu schema ghi `string` mà không có enum, không tự suy enum. So khớp `required`, `format`, `pattern`, `min/max`, nullability, field lồng nhau và mã lỗi với backend. Đặc biệt, Swagger live khai báo response thành công `200` cho một số POST; cần đối chiếu controller/runtime trước khi kết luận status thành công.
- Frontend runtime dùng `src/pages/resourceRegistry.ts`, `src/components/ResourceListPage.tsx`, `src/components/resources/resourceCapabilities.ts` và transport tại `src/providers/api/`. Nút tạo chung hiện dùng `ResourceCreateModal`; khách hàng đã có `CustomerCreateModal`; bến bãi đang dùng nút mở trang; danh sách load đang chuyển về Dispatch. Kiểm tra trạng thái thật theo role và route trước khi thay.
- GitNexus `logictisc-app` đang cũ hơn HEAD một commit lúc khảo sát. Số liệu graph chỉ là gợi ý, đã kiểm tra thêm source; cập nhật index và chạy impact trước từng thay đổi code, cảnh báo HIGH/CRITICAL và xác minh UNKNOWN theo `AGENTS.md`.

## 3. Kế hoạch từng màn — popup tạo có thể triển khai theo điều kiện

Danh sách dưới đây ghi **đầy đủ field cấp một của request** trong Swagger live; dấu `*` là có trong `required` của schema. Các trường lồng nhau phải kiểm tra sâu, không tự giả định chỉ từ tên. Mỗi màn đều có test payload đúng schema, field bắt buộc, từ chối payload sai, 403/400/409/500, thao tác hủy, gửi trùng và làm mới danh sách.

### M1. Khách hàng — ưu tiên 1, mẫu chuẩn

- Điểm vào: `/customers`; hiện đã có `CustomerCreateModal` và `CustomerForm`. Rà soát, hoàn thiện popup riêng hiện có thay vì tạo bản thứ hai.
- `POST /api/customers` → `CreateCustomerRequest`; response Swagger `ApiResponseCustomerView` → `CustomerView`.
- Bắt buộc: `name*`, `status*`, `isVatExempt*`. Không bắt buộc: `email`, `phone`, `notes`, `taxId`, `addressLine1`, `addressLine2`, `addressCity`, `addressState`, `addressZipCode`, `addressCountry`. `email` có format email; `isVatExempt` là boolean, phải phân biệt `false` với thiếu giá trị.
- Nhóm thông tin chung, liên hệ, thuế, địa chỉ; trạng thái và enum cần đối chiếu backend. Test request không chứa `id`, dữ liệu lỗi được gắn đúng field; response có `id` được dùng để làm mới danh sách.

### M2. Bến bãi — ưu tiên 2

- Điểm vào: `/terminals`; `TerminalList` hiện dùng `CreateButton` điều hướng trang. Tạo `TerminalCreateModal` riêng, gắn nút tại toolbar và xử lý truy cập trực tiếp `/terminals/create` theo chính sách thống nhất.
- `POST /api/terminals` → `CreateTerminalRequest`; response `ApiResponseTerminalView` → `TerminalView`.
- Bắt buộc: `name*`, `code*`, `countryCode*`, `type*`, `addressCity*`, `addressCountry*`, `addressLine1*`, `addressState*`, `addressZipCode*`. Tùy chọn: `notes`, `addressLine2`. Swagger ghi `name` tối đa 200 ký tự, `code` 5, `countryCode` 2, `notes` 2000; kiểm tra thêm `@NotBlank` trong Spring vì Swagger có thể không biểu diễn đầy đủ khoảng trắng.
- Nhóm nhận diện và địa chỉ; không suy danh sách quốc gia/loại từ các dòng đang có. Test giới hạn, mã quốc gia, 404/403 và refresh sau tạo.

### M3. Xe tải — ưu tiên 3

- Điểm vào: `/trucks`; hiện `ResourceListPage` dùng popup chung. Tạo `TruckCreateModal` riêng, tận dụng `TruckForm` sau khi so contract; không bật edit đang khóa.
- `POST /api/trucks` → `CreateTruckRequest`; response `ApiResponseTruckView` → `TruckView`.
- Bắt buộc: `number*`, `type*`, `vehicleCapacity*`, `status*`, `isHazmatPlacarded*`. Tùy chọn: `make`, `model`, `year`, `vin`, `licensePlate`, `licensePlateState`, `mainDriverId`, `secondaryDriverId`, `adrEquipmentIsAdrCertified`, `adrEquipmentAllowedClasses`, `adrEquipmentOrangePlateNumber`.
- Chia nhóm thông tin xe, tài xế, ADR; dùng picker phân trang, ngăn chọn cùng tài xế hai lần, kiểm tra điều kiện ADR theo backend. `version`, `mainDriverName`, vị trí hiện tại là response-only. Test boolean `false`, ID, điều kiện ADR và refresh.

### M4. Chuyến xe — ưu tiên 4

- Điểm vào: `/trips`; hiện popup chung. Tạo `TripCreateModal` riêng; không nhầm tạo chuyến với tạo stop hay phân công tài xế, không bật edit bị khóa.
- `POST /api/trips` → `CreateTripRequest`; response `ApiResponseTripView` → `TripView`.
- Bắt buộc: `name*`, `totalDistance*`, `status*`; tùy chọn `truckId`. Swagger chỉ ghi `totalDistance: number`, **không ghi đơn vị**; cần backend xác nhận trước khi gắn đơn vị hoặc quy đổi. `completedAt`, `dispatchedAt`, `cancelledAt`, `version`, `number` không phải trường tạo.
- Picker xe phân trang; không cho tự nhập timestamp hoàn tất. Test submit nhỏ nhất, trạng thái hợp lệ theo contract được xác nhận, giữ nguyên dữ liệu khi 409 và cảnh báo dữ liệu lịch sử mâu thuẫn.

### M5. Đơn hàng / Shipment — ưu tiên 5, form lớn

- Điểm vào chính: `/tms/dispatch` và `/loads/create`; `/loads` hiện redirect Dispatch. Tạo `LoadCreateModal` duy nhất, ghép lại `LoadForm` và hook nghiệp vụ, tránh popup chung và trang riêng gọi hai handler khác nhau.
- `POST /api/loads` → `CreateLoadRequest`; response `ApiResponseLoadView` → `LoadView`.
- Bắt buộc: `name*`, `type*`, `status*`, `distance*`, `isInProximity*`, `customerId*`, `source*`, `isHazmat*`, `deliveryCostAmount*`, `deliveryCostCurrency*`, `originAddressLine1*`, `originAddressCity*`, `originAddressState*`, `originAddressZipCode*`, `originAddressCountry*`, `originLocationLatitude*`, `originLocationLongitude*`, `destinationAddressLine1*`, `destinationAddressCity*`, `destinationAddressState*`, `destinationAddressZipCode*`, `destinationAddressCountry*`, `destinationLocationLatitude*`, `destinationLocationLongitude*`.
- Tùy chọn: `assignedTruckId`, `assignedDispatcherId`, `requestedPickupDate`, `requestedDeliveryDate`, `notes`, `hazmatClass`, `unNumber`, `containerId`, `originTerminalId`, `destinationTerminalId`, `externalSourceProvider`, `externalSourceId`, `externalBrokerReference`, `originAddressLine2`, `destinationAddressLine2`, `requestedPickupBusinessDate`, `requestedPickupDateProvenance`. Nếu gửi provenance, schema yêu cầu `reasonCode`, `reason`, `source`.
- Chia nhóm khách hàng, lấy/giao, hàng nguy hiểm, cước, phân công, tham chiếu. Cần quyết định UX cho tọa độ bắt buộc: không âm thầm gửi `0,0` khi người dùng chưa cung cấp; xác nhận nguồn geocode/nhập tay. Container chưa có endpoint trong Swagger live: giữ khóa có lý do. Đơn vị `distance` và ngữ nghĩa ngày/múi giờ cần backend/PO xác nhận. Không gửi `number`, `version`, tên quan hệ hay timestamp thực tế.
- Test payload đầy đủ, required/whitespace, false/zero, invalid tọa độ/ngày, hai picker phân trang, hazmat và lỗi backend; xác nhận không có POST khi form lỗi.

### M6. Hóa đơn — ưu tiên 6, cần xác nhận nghiệp vụ tài chính

- Điểm vào: `/invoices`; hiện dùng popup chung và có luồng billing riêng đang gated. Tạo `InvoiceCreateModal` riêng cho đúng luồng được phê duyệt; không gộp tạo hóa đơn legacy với sinh hóa đơn từ rating/billing.
- `POST /api/invoices` → `CreateInvoiceRequest`; response `ApiResponseInvoiceView` → `InvoiceView`.
- Bắt buộc: `type*`, `status*`, `subtotalAmount*`, `subtotalCurrency*`, `taxTotalAmount*`, `taxTotalCurrency*`, `totalAmount*`, `totalCurrency*`. Tùy chọn: `taxBehavior`, `notes`, `dueDate`, `loadId`, `customerId`, `employeeId`, `periodStart`, `periodEnd`, `totalDistanceDriven`.
- Cần PO/backend xác nhận quan hệ đối tượng, trạng thái tạo, nguồn số và quy tắc thuế/làm tròn; không tự suy công thức hoặc cộng khác currency. Dùng Decimal và giữ idempotency/version nếu command áp dụng. `sentAt`, `invoicePurpose`, `economicSign`, `ratingSnapshotId` và lịch sử là response-only. Test currency, precision, lỗi conflict và immutable history.

### M7. Nhân viên — có contract, chưa xác nhận màn runtime

- `POST /api/employees` → `CreateEmployeeRequest`; response `ApiResponseEmployeeView` → `EmployeeView`. Có `employeesResource` và các file page, nhưng `appResourcePageRoutes` hiện không khai báo nhóm route employees: không khẳng định màn đang truy cập được. Cần quyết định scope/route và phân quyền trước khi làm popup.
- Bắt buộc: `email*`, `firstName*`, `lastName*`, `salaryType*`, `status*`, `joinedDate*`, `salaryAmount*`, `salaryCurrency*`. Tùy chọn: `phoneNumber`, `roleId`, `addressLine1`, `addressLine2`, `addressCity`, `addressState`, `addressZipCode`, `addressCountry`. `joinedDate` là `date-time`, không mặc nhiên là ngày thuần.
- Nhóm danh tính, vai trò, lương, địa chỉ; cần kiểm tra quyền xem/nhập lương và source danh sách role. Không tái sử dụng popup tài xế khi chưa xác nhận quy trình cấp vai trò.

### M8. Chính sách lương tài xế — giữ command nghiệp vụ

- Điểm vào: `/settlements/policies` theo hằng số routes; hiện đã có modal tại `DriverPayPolicyList`. Rà soát và tách popup riêng theo cấu trúc đích nếu cần, không viết lại logic version.
- `POST /api/driver-pay-policies` → `DriverPayPolicyRequest`; response `ApiResponseDriverPayPolicyView` → `DriverPayPolicyView`.
- Bắt buộc: `policyCode*`, `name*`, `payMethod*`, `currency*`, `effectiveFrom*`. Tùy chọn: `driverId`, `perMileRate`, `perLoadRate`, `hourlyRate`, `dailyRate`, `flatRate`, `revenuePercentage`, `mileageBasis`, `revenueBasis`, `detentionRate`, `detentionFreeMinutes`, `detentionBlockMinutes`, `layoverRate`, `stopPayRate`, `effectiveTo`.
- `payMethod` theo Swagger: `PER_MILE`, `PER_LOAD`, `PERCENT_REVENUE`, `HOURLY`, `DAILY`, `FLAT_RATE`; tiền tệ theo pattern `[A-Z]{3}`, tỷ lệ 0–1. Kiểm tra điều kiện field theo phương pháp và hiệu lực với backend; `policyVersion`, `active`, `id` là response. Test Decimal/đổi phương pháp/phiên bản và không cộng tiền khác currency.

### M9. Quyết toán tài xế — popup tính, không gọi create CRUD giả

- Màn settlement hiện có modal tính riêng; giữ luồng command và cải thiện theo hợp đồng, không tạo `POST /api/driver-settlements` vì Swagger live chỉ có GET tại collection.
- `POST /api/driver-settlements/calculate` → `CalculateSettlementRequest`: `driverId*`, `payPeriodId*`; response `ApiResponseDriverSettlementView` → `DriverSettlementView`.
- Picker tài xế/kỳ phân trang; xác nhận quyền, kỳ và trạng thái trước gửi; tiền/tổng nhận từ backend. Test payload, conflict, 403, giữ form khi lỗi. Không tự chạy tính thật khi kiểm tra.

### M10. Payroll — popup tính riêng, không phải tạo CRUD

- Điểm vào `/payroll`; hiện có form tính và popup xác nhận. Quyết định cùng PO có gộp thành popup nhập riêng hay giữ form + xác nhận, nhưng chỉ một luồng tính với snapshot/idempotency ổn định.
- `POST /api/payroll/runs/calculate` → `CalculatePayrollRequest`; response Swagger trực tiếp `PayrollRunView`. Bắt buộc: `idempotencyKey*`, `payPeriodId*`, `currency*`, `effectiveDate*`, `settlementIds*`. Tùy chọn: `jurisdictionOverrides`, `taxInputs`, `supplements`; mỗi `Supplement` yêu cầu `sourceId`, `driverId`, `lineClass`, `description`, `amount`.
- Chọn settlement `LOCKED` đúng kỳ/currency, phân trang, không trùng; tổng Decimal và tiền tệ trước xác nhận. API danh sách chưa cho biết reservation của payroll khác: backend phải xác minh và trả lỗi rõ; cần bổ sung field đủ điều kiện để UI khóa trước. Test double submit, retry cùng key, conflict, snapshot, đa tiền tệ; không tính lương live khi test.

## 4. Màn phải chờ xác nhận, không tự mở create

1. **Tài xế `/drivers`**: Swagger live chỉ có `GET /api/drivers`; không có `POST /api/drivers`. UI directory không có nút tạo. Có `DriverCreate` dùng generic resource trong source, nhưng không đủ chứng minh write được hỗ trợ. Hỏi backend/PO có tạo qua employee + role, endpoint khác, hay chỉ đồng bộ. Các màn profile/sub-resource phải đối chiếu Swagger mới được deploy trước khi lập popup tương ứng.
2. **Thanh toán `/payments`**: Swagger có `POST /api/payments` với `CreatePaymentRequest`, nhưng `PAYMENT_COMMANDS_RUNTIME_VERIFIED = false` và generic mutation bị khóa. Chỉ thiết kế popup `PaymentCreateModal` sau khi được duyệt contract. Schema yêu cầu `status*` pattern `PENDING`, `invoiceId*`, `amountAmount*`, `amountCurrency*`, `idempotencyKey*`, `billingAddressLine1*`, `billingAddressCity*`, `billingAddressState*`, `billingAddressZipCode*`, `billingAddressCountry*`; tùy chọn `description`, `referenceNumber`, `stripePaymentMethodId`, `stripePaymentIntentId`, `recordedAt`, `billingAddressLine2`. Không đưa trường Stripe kỹ thuật hoặc ID idempotency cho người dùng nhập tùy tiện.
3. **Chứng từ `/documents`**: Swagger live collection chỉ GET; `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED = false`. Giữ thông báo chưa hỗ trợ; chờ multipart endpoint, loại file/kích thước, quyền và lỗi trước popup upload.
4. **Thông báo**: collection GET, không có create CRUD. Không tạo popup giả; các thao tác đọc/xử lý notification là workflow riêng.
5. **Container, sản phẩm, expenses, maintenance, HOS/ELD, accidents, DVIR, load-board**: có code UI cũ nhưng không thuộc `foundationApiResources`; Swagger live không cung cấp create tương ứng cho các collection này. Không bật route hay bịa endpoint; mỗi màn cần backend/PO xác nhận trước khi lên popup chi tiết.
6. **Role/quyền**: `POST /api/roles` có `CreateRoleRequest` với `name*`, `claims*`, tùy chọn `displayName`; mỗi claim có `claimType*`, `claimValue*`. Chưa tìm thấy route page roles đang bật; cần xác nhận scope quản trị, ma trận quyền và UX claim trước khi làm.
7. **Profitability, payslip, dashboard, expiring, reconciliation**: là báo cáo, danh sách chỉ đọc hoặc workflow xác nhận; không tự thêm nút create. Các command chuyên biệt trên màn chi tiết chỉ lập kế hoạch riêng sau khi xác nhận thao tác thực tế.
8. **Nhập kiểm định, accessorial, chi phí shipment, phân công tài xế, rating/optimization**: Swagger có POST command khác nhau nhưng không đồng nghĩa mỗi command là một màn CRUD. Kiểm kê CTA thực tế và hợp đồng/role/feature gate trước khi đề xuất popup riêng; không biến preview/approve/transition thành create chung.

## 5. Thứ tự triển khai và cổng kiểm tra

1. Khóa bản Swagger cho môi trường đích, so operation/request/response với Spring và UI hiện tại; ghi các khác biệt `NEEDS-INFO`, không tự mở gate. Xác nhận user journey của `/create` trực tiếp và cả nút ngoài danh sách.
2. Làm M1 khách hàng làm mẫu; sau đó M2 bến bãi, M3 xe, M4 chuyến, M5 đơn. Mỗi màn một thay đổi độc lập, không kết hợp di chuyển file với sửa logic trong cùng commit; giữ mọi thay đổi đang có trong working tree.
3. M6 hóa đơn sau khi PO xác nhận dữ liệu/tài chính; M7 nhân viên chỉ khi route và quyền đã xác nhận; M8–M10 theo command nghiệp vụ và quyền. Màn bị khóa ở mục 4 chỉ thực hiện sau contract/phê duyệt tương ứng.
4. Trước sửa: GitNexus impact lên symbol, liệt kê file đích; với HIGH/CRITICAL cảnh báo và đánh giá; UNKNOWN tìm bổ sung. Sau sửa: test mapper/hook/component cạnh file; test tương tác payload và invalidation, 403/404/409/500, retry, focus, responsive, keyboard và form bẩn. Tiền dùng Decimal, danh sách picker có giới hạn và debounce; không làm yếu test cũ.
5. Với từng màn chạy `npm run lint`, `npm run build`, test mục tiêu; trước kết thúc chạy `npx vitest run` và so số test với mốc trong `docs/restructure/PROGRESS.md`. Chỉ ghi PASS khi chính người thực hiện chạy trong phiên. Vì chưa có phiên SSO thật, cần UAT riêng bằng role/tenant và dữ liệu QA cô lập; không dùng tài khoản demo làm bằng chứng API.
6. Nếu lỗi hoặc contract chưa rõ: dừng màn đó, giữ dữ liệu/form, ghi request/response ví dụ và câu hỏi backend; tiếp tục màn khác khi độc lập. Không thay đổi auth/tenant/proxy hay bật feature flag chỉ để popup hoạt động.

## 6. Quyết định cần xác nhận trước triển khai

- Phạm vi “mỗi màn”: chỉ các màn có quyền tạo đang hoạt động, hay bao gồm cả màn dormant/command chuyên biệt sau khi có backend? Đề xuất làm màn đang hoạt động trước, các mục bị khóa giữ nguyên.
- `/loads/create` và các URL create cũ có cần tiếp tục deep link hay toàn bộ chuyển sang popup từ danh sách/Dispatch?
- Ai xác nhận phiên bản backend triển khai, enum, timezone/unit, tọa độ load, quy tắc tài chính, role và reservation settlement? Swagger local chỉ là bằng chứng môi trường local.
- Mỗi màn dùng route create cũ hay modal URL được định danh; quy tắc điều hướng Back, mất mạng, đóng form bẩn và accessibility cần được chốt trước màn đầu tiên.
