# AUDIT: loads-create

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `loads-create` (Tạo mới đơn hàng vận chuyển / Shipment)  
> **Thời điểm cập nhật:** 25/10/2026 (Phiên bản hiệu chỉnh sau lượt Review độc lập số 2)  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát đa tầng (Frontend React Refine & Backend Spring Boot), đối soát schema/DTO/Mapper/Security, kiểm tra luồng phân quyền và thực thi bộ kiểm thử tự động.

---

## 1. Tổng quan chức năng

Chức năng `loads-create` phụ trách tiếp nhận, xác thực dữ liệu và tạo mới thực thể Đơn hàng vận chuyển (Load / Shipment) trong hệ thống TMS LogisticsX. Đơn hàng là thực thể trung tâm liên kết mật thiết với luồng điều phối đội xe (Fleet), chuyến xe (Trip), quản lý tài xế, trạm trung chuyển (Terminals), kế toán cước (Billing/Settlements) và luồng AI Dispatch.

### Các thành phần mã nguồn cốt lõi:
- **Trang màn hình độc lập (Dedicated Page):** [`src/pages/loads/create.tsx`](file:///home/vumoi/logictics-app/src/pages/loads/create.tsx) (`LoadCreate`).
- **Thành phần biểu mẫu chính (Form Component):** [`src/features/loads/components/LoadForm.tsx`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx) (`LoadForm`).
- **Khối địa chỉ tái sử dụng:** [`src/forms/AddressFields.tsx`](file:///home/vumoi/logictics-app/src/forms/AddressFields.tsx) (`AddressFields`) phục vụ điểm lấy hàng (Origin) và điểm giao hàng (Destination).
- **Thanh thao tác dính đáy:** [`src/forms/FormFooterBar.tsx`](file:///home/vumoi/logictics-app/src/forms/FormFooterBar.tsx) (`FormFooterBar`).
- **Bộ chuẩn hóa và lọc Payload:** [`src/components/resources/resourceMutation.ts`](file:///home/vumoi/logictics-app/src/components/resources/resourceMutation.ts) (`buildResourceMutation`).
- **Popup tạo nhanh tại bảng danh sách:** [`src/components/ResourceCreateModal.tsx`](file:///home/vumoi/logictics-app/src/components/ResourceCreateModal.tsx) dựa trên định nghĩa [`src/components/resources/resourceForms.ts`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts).
- **Backend Controller & Service:** `LoadController.java` (`POST /api/loads`), `LoadService.java`, `LoadMapper.java`, `CreateLoadRequest.java`, `Load.java`.

---

## 2. Danh sách route

| Thuộc tính | Giá trị chi tiết | Ghi chú / Trạng thái |
| :--- | :--- | :--- |
| **Đường dẫn URL** | `/loads/create` | Khai báo tại `routes.resources.loads.create` ([`src/constants/routes.ts:9, 58`](file:///home/vumoi/logictics-app/src/constants/routes.ts#L9-L58)) |
| **Mounting Runtime** | Được đăng ký qua `appResourcePageRoutes` và `foundationResourcePageRoutes` ([`src/pages/resourceRegistry.ts:139-154`](file:///home/vumoi/logictics-app/src/pages/resourceRegistry.ts#L139-L154)) | Mount tại [`src/router/AppRouter.tsx:291-304`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L291-L304) |
| **Bảo vệ tầng Route** | Bọc tuần tự bởi: `ProtectedRoute` &rarr; `TenantGuard` &rarr; `MainLayout` &rarr; `ResourceAccessBoundary` | Ngăn chặn truy cập nặc danh, thiếu tenant hoặc thiếu quyền |
| **Capability Gate** | `getResourceCapabilities("loads").create === true` ([`src/components/resources/resourceCapabilities.ts:20`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L20)) | **KHÔNG** bị khóa (ngược lại `loads.edit` bị khóa bởi `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false`) |
| **Truy cập URL trực tiếp** | Hoạt động bình thường nếu đã xác thực và có quyền | Nếu chưa đăng nhập: redirect `/login`. Nếu chưa chọn tenant: redirect `/select-tenant`. Nếu thiếu quyền: render `<ForbiddenPage />` (403) |
| **Hành vi chuyển hướng (Redirect)** | - Tạo thành công: Chuyển hướng về `/loads` (`redirect: "list"` tại [`src/pages/loads/create.tsx:24`](file:///home/vumoi/logictics-app/src/pages/loads/create.tsx#L24))<br>- Nút Hủy: Chuyển hướng về `/loads` ([`src/pages/loads/create.tsx:41`](file:///home/vumoi/logictics-app/src/pages/loads/create.tsx#L41)) | Điều hướng chuẩn xác, không có dead-end link |

---

## 3. Danh sách UI action

| ID | Vùng giao diện / Field | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-01** | Section 1: Tên đơn hàng (`name`) | `Input` (Text) | `Form.Item onChange` | Không gọi API | Nhập tên định danh đơn hàng; bắt buộc nhập (báo lỗi nếu rỗng). Không có `maxLength` ở client (Backend là cột `text` không giới hạn độ dài). |
| **ACT-02** | Section 1: Khách hàng (`customerId`) | `EntityPicker` (`Select` có server search) | `useSelect` trong `EntityPicker.tsx` | `GET /api/customers?search=<query>` | Tìm kiếm và chọn khách hàng hợp lệ trong tenant. Bắt buộc. |
| **ACT-03** | Section 1: Loại đơn hàng (`type`) | `Select` (Dropdown) | `setFieldValue("type")` | Không gọi API (options tĩnh) | Chọn loại vận chuyển: STANDARD, EXPEDITED, REEFER, FLATBED. Mặc định `STANDARD`. *Lưu ý: Giới hạn enum chỉ có ở UI client; Backend DTO `CreateLoadRequest.java:13` chỉ kiểm tra `@NotBlank String type`, không có validator whitelist enum.* |
| **ACT-04** | Section 1: Trạng thái (`status`) | `Select` (Dropdown) | `setFieldValue("status")` | Không gọi API (options tĩnh) | Chọn trạng thái ban đầu: `draft`, `dispatched`, `picked_up`, `delivered`, `cancelled`. Mặc định `draft`. Backend chỉ yêu cầu `@NotBlank`, không validate whitelist enum. |
| **ACT-05** | Section 1: Ghi chú (`notes`) | `Input.TextArea` | `Form.Item onChange` | Không gọi API | Nhập ghi chú tự do cho đơn hàng (tùy chọn). Client thiếu `maxLength`, trong khi Backend DB có giới hạn cứng `@Column(length = 2000)`. |
| **ACT-06** | Section 2: Địa chỉ lấy hàng (`originAddress*`) | `AddressFields` (`Input`) | `Form.Item onChange` | Không gọi API | Nhập Line 1, City, State, ZipCode, Country. Country mặc định `"USA"`. Bắt buộc nhập. |
| **ACT-07** | Section 2: Ngày hẹn lấy (`requestedPickupDate`) | `DatePicker` (kèm giờ) | `DatePicker onChange` | Không gọi API | Chọn mốc thời gian lấy hàng dự kiến (tùy chọn). |
| **ACT-08** | Section 2: Trạm xuất phát (`originTerminalId`) | `TerminalSelect` (`Select`) | `useSelect` qua `EntityPicker` | `GET /api/terminals?pageSize=100` | Chọn bến bãi xuất phát (tùy chọn). Resource `terminals` đã kích hoạt trong `foundationApiResources` ([`src/pages/resourceRegistry.ts:91-95`](file:///home/vumoi/logictics-app/src/pages/resourceRegistry.ts#L91-L95)). *Lưu ý: Backend nhận ID nhưng không lưu vào DB (xem BUG-LC-02).* |
| **ACT-09** | Section 2: Tọa độ GPS lấy hàng (`originLocation*`) | `Collapse` &rarr; `InputNumber` | `Form.Item onChange` | Không gọi API | `InputNumber` có `min/max` [-90, 90] và [-180, 180] để clamp giá trị nhập, nhưng `Form.Item` không có message rule hiển thị lỗi. Mặc định `0, 0`. |
| **ACT-10** | Section 3: Địa chỉ giao hàng (`destinationAddress*`) | `AddressFields` (`Input`) | `Form.Item onChange` | Không gọi API | Nhập Line 1, City, State, ZipCode, Country. Country mặc định `"USA"`. Bắt buộc nhập. |
| **ACT-11** | Section 3: Ngày hẹn giao (`requestedDeliveryDate`) | `DatePicker` (kèm giờ) | `DatePicker onChange` | Không gọi API | Chọn mốc thời gian giao hàng dự kiến (tùy chọn). Không có validator so sánh với `requestedPickupDate`. |
| **ACT-12** | Section 3: Trạm đích (`destinationTerminalId`) | `TerminalSelect` (`Select`) | `useSelect` qua `EntityPicker` | `GET /api/terminals?pageSize=100` | Chọn bến bãi đích (tùy chọn). Resource `terminals` có trong allowlist. *Lưu ý: Backend nhận ID nhưng không lưu vào DB (xem BUG-LC-02).* |
| **ACT-13** | Section 3: Tọa độ GPS giao hàng (`destinationLocation*`) | `Collapse` &rarr; `InputNumber` | `Form.Item onChange` | Không gọi API | `InputNumber` clamp giá trị nhập [-90, 90] và [-180, 180]. Mặc định `0, 0`. |
| **ACT-14** | Section 4: Công tắc Hazmat (`isHazmat`) | `Switch` | `Form.Item onChange` | Không gọi API | Bật/tắt hàng nguy hiểm. Khi bật, mở rộng 2 trường con: `hazmatClass` và `unNumber`. Khi tắt về `false`, Antd Form giữ nguyên giá trị cũ trong store do không có `preserve: false`. Phía Backend DTO chỉ có `@NotNull Boolean isHazmat`, không có conditional validation cho 2 trường con. |
| **ACT-15** | Section 4: Phân loại nguy hiểm (`hazmatClass`) | `Input` (Text) | `Form.Item onChange` | Không gọi API | Bắt buộc nhập khi `isHazmat === true` (chỉ ràng buộc tại client). |
| **ACT-16** | Section 4: Mã nhận diện UN (`unNumber`) | `Input` (Text) | `Form.Item onChange` | Không gọi API | Bắt buộc nhập khi `isHazmat === true` (chỉ ràng buộc tại client). Thiếu regex định dạng UN (ví dụ `/^UN\d{4}$/`). |
| **ACT-17** | Section 4: Container gắn kèm (`containerId`) | `EntityPicker` | `useSelect` trong `EntityPicker.tsx` | `GET /api/containers` | **LỆCH CẤU HÌNH / FEATURE GATE:** `LoadForm.tsx:251` gọi `EntityPicker(resource="containers")` trong khi `containers` chưa được mở trong allowlist API (`foundationApiResources`). Khi provider query sẽ ném `RESOURCE_NOT_CONFIGURED:containers`. Biểu hiện runtime crash chưa xác minh trên môi trường live. |
| **ACT-18** | Section 5: Cước phí (`deliveryCostAmount`) | `InputNumber` (addon USD) | `InputNumber onChange` | Không gọi API | Bắt buộc nhập số tiền cước (`min={0}`). Mặc định `0`. Backend DTO chỉ có `@NotNull`, không có `@Min(0)`. |
| **ACT-19** | Section 5: Cự ly vận chuyển (`distance`) | `InputNumber` (addon mi) | `InputNumber onChange` | Không gọi API | Bắt buộc nhập khoảng cách dặm (`min={0}`). Mặc định `0`. Backend DTO chỉ có `@NotNull`. |
| **ACT-20** | Section 5: Xe phân công (`assignedTruckId`) | `EntityPicker` | `useSelect` trong `EntityPicker.tsx` | `GET /api/trucks?search=<query>` | Chọn phương tiện vận chuyển sơ bộ (tùy chọn). Backend resolve và lưu quan hệ xe. |
| **ACT-21** | Section 5: Điều phối viên (`assignedDispatcherId`) | `EntityPicker` | `useSelect` trong `EntityPicker.tsx` | `GET /api/employees?search=<query>` | **GIỚI HẠN QUYỀN API PHỤ:** Chọn nhân viên điều phối (tùy chọn). Backend `SecurityConfig.java:118` giới hạn `/api/employees/**` chỉ cho `ADMIN` và `DISPATCHER`. Người dùng có role `ACCOUNTANT` có quyền vào form tạo load nhưng dropdown này sẽ trả về **403 Forbidden**. |
| **ACT-22** | Section 6: Tham chiếu ngoài (`source`, `external*`) | `Collapse` &rarr; `Input` | `Form.Item onChange` | Không gọi API | Nhập thông tin tích hợp nguồn ngoài (tùy chọn). `source` mặc định `"MANUAL"`. `externalSourceId` không có unique constraint trên DB. |
| **ACT-23** | Mục lục biểu mẫu bên phải | `Anchor` | `Anchor.Link onClick` | Không gọi API | Cuộn mượt màn hình tới phân đoạn được bấm (Section 1 đến 6). |
| **ACT-24** | Nút "Hủy" trên Footer | `Button` (Default) | `onCancel` | Không gọi API | Hủy thao tác và điều hướng về `/loads`. Thiếu cảnh báo mất dữ liệu khi form đã điền dở. |
| **ACT-25** | Nút "Tạo đơn hàng" trên Footer | `Button` (Primary / Submit) | `Form.onFinish` | `POST /api/loads` | Validate toàn bộ form; gửi mutation tạo load; xử lý phản hồi 201 Created hoặc lỗi. Nút nhận `saveButtonProps` có trạng thái `loading`. |
| **ACT-26** | Nút "+ Tạo mới" trên trang danh sách `/loads` | `Button` (Primary) | `handleShow` modal | Không gọi API | **KHÁC BIỆT THIẾT KẾ UX:** Mở `ResourceCreateModal` generic thay vì điều hướng đến trang `LoadCreate`. Chưa có acceptance criteria bắt buộc đổi sang chuyển trang. |

---

## 4. API liên quan

### 4.1. Endpoint chính: Tạo mới Load
- **Phương thức:** `POST`
- **Đường dẫn:** `/api/loads`
- **Controller phụ trách:** `com.company.logicstic.controller.LoadController.create`
- **Headers:**
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - `X-Request-Id: <UUIDv4>` (tự sinh qua interceptor [`src/providers/api/apiClient.ts:135`](file:///home/vumoi/logictics-app/src/providers/api/apiClient.ts#L135))
- **Timeout:** Cấu hình theo `runtimeConfig.requestTimeoutMs` (mặc định trong config deployment).

### 4.2. Request Payload Schema và Đối soát Backend
Dữ liệu gửi đi được trích lọc thông qua `buildResourceMutation("loads", values)`:
- **Danh sách 24 trường bắt buộc trong `requiredCreate`:**
  1. `name` (string)
  2. `customerId` (UUID string)
  3. `type` (string enum)
  4. `status` (string enum)
  5. `source` (string)
  6. `isHazmat` (boolean)
  7. `isInProximity` (boolean, mặc định `false`)
  8. `distance` (number)
  9. `deliveryCostAmount` (number)
  10. `deliveryCostCurrency` (string, mặc định `"USD"`)
  11. `originAddressLine1` (string)
  12. `originAddressCity` (string)
  13. `originAddressState` (string)
  14. `originAddressZipCode` (string)
  15. `originAddressCountry` (string)
  16. `originLocationLatitude` (number, mặc định `0`)
  17. `originLocationLongitude` (number, mặc định `0`)
  18. `destinationAddressLine1` (string)
  19. `destinationAddressCity` (string)
  20. `destinationAddressState` (string)
  21. `destinationAddressZipCode` (string)
  22. `destinationAddressCountry` (string)
  23. `destinationLocationLatitude` (number, mặc định `0`)
  24. `destinationLocationLongitude` (number, mặc định `0`)
- **Các trường tùy chọn bổ sung:**
  `notes`, `originAddressLine2`, `originTerminalId`, `requestedPickupDate`, `destinationAddressLine2`, `destinationTerminalId`, `requestedDeliveryDate`, `hazmatClass`, `unNumber`, `containerId`, `assignedTruckId`, `assignedDispatcherId`, `externalSourceProvider`, `externalSourceId`, `externalBrokerReference`, `requestedPickupBusinessDate`, `requestedPickupDateProvenance`.

> [!IMPORTANT]
> **VẤN ĐỀ LƯU TRỮ LIÊN KẾT BẾN BÃI (BACKEND PERSISTENCE GAP):**
> Đối soát mã nguồn `CreateLoadRequest.java:27-29` cho thấy DTO nhận `originTerminalId`, `destinationTerminalId` và `containerId`.
> - **Về Bến bãi (Terminals):** Resource `terminals` đã có sẵn trong danh mục API kích hoạt (`src/pages/resourceRegistry.ts:91-95`), giao diện cho phép chọn bến bãi hợp lệ và gửi ID lên server. Tuy nhiên, trong `LoadService.resolveRelations` (`LoadService.java:138-155`), backend chỉ resolve `customer`, `truck`, và `dispatcher`. Trong `LoadMapper.java:17-35`, các mapper method `toEntity` và `updateEntity` hoàn toàn bỏ qua `originTerminalId` và `destinationTerminalId`. Do đó hai ID này **bị bỏ rơi và không được lưu vào cơ sở dữ liệu** (Finding xác nhận — xem `BUG-LC-02`).
> - **Về Container:** Resource `containers` đang ở trạng thái feature-gated (chưa kích hoạt trong frontend allowlist `src/pages/resourceRegistry.ts:20-96`). Do tính năng gắn container chưa được cung cấp chính thức trên frontend và chưa có tiêu chí chấp nhận, việc `containerId` chưa được lưu là hành vi phụ thuộc feature gate cần xác nhận yêu cầu chứ không gộp vào lỗi mất dữ liệu của terminal.

### 4.3. Xử lý phản hồi và mã lỗi (HTTP Status Codes)
- **HTTP 201 Created:** `LoadController.create` trả về `HttpStatus.CREATED` (201) bọc trong phong bì `ApiResponse.success(data, request)` &rarr; Frontend bóc tách `ApiResponse.data` &rarr; Hiển thị thông báo thành công qua `useAntdNotificationProvider` &rarr; Kích hoạt `redirect: "list"` đưa người dùng về danh sách `/loads`. (Lưu ý: Không có phản hồi 200 từ endpoint này).
- **HTTP 400 Bad Request:** Lỗi validation backend từ `@Valid` của Spring Boot &rarr; `applyBackendFieldErrors` bắt mapping `error.errors` dạng `{ [fieldName]: [message] }` và gắn trực tiếp vào Antd FormItem tương ứng, tự động cuộn tới field đầu tiên bị lỗi.
- **HTTP 401 Unauthorized:** Interceptor tự động kích hoạt `refreshAccessToken()` 1 lần duy nhất và gửi lại request. Nếu refresh thất bại, xóa session và điều hướng về `/login`.
- **HTTP 403 Forbidden:** Phản hồi từ chối quyền do JWT không khớp quyền hoặc sai lệch tenant &rarr; Hiển thị toast thông báo lỗi phân quyền.
- **HTTP 404 Not Found:** Xảy ra khi ID khóa ngoại được resolve (`customerId`, `assignedTruckId`, `assignedDispatcherId`) không tồn tại trong DB &rarr; `LoadService` ném `ResourceNotFoundException` &rarr; Frontend hiển thị toast thông báo.
- **HTTP 409 Conflict:**
  *Giới hạn theo thực tế DB:* Cột `name` (`text`) và `external_source_id` (`varchar(100)`) KHÔNG có ràng buộc duy nhất (UNIQUE constraint) trong schema database (`Load.java:50`, migration `V1__baseline_business_schema.sql:650`). Entity chỉ có cột `"number"` sequence tự sinh là duy nhất. Do đó, việc gửi trùng tên hoặc gửi lại cùng request không kích hoạt 409 Conflict; server sẽ tạo thêm bản ghi mới. Lỗi 409 chỉ phát sinh nếu có ràng buộc DB duy nhất khác bị vi phạm trong tương lai.
- **HTTP 500 Internal Server Error:** Chuẩn hóa thành `ApiHttpError` và hiển thị toast lỗi hệ thống (ví dụ khi `notes` vượt quá 2000 ký tự gây lỗi `DataTruncation` ở backend).
- **Timeout / Network Error (HTTP 0):** Quá thời gian chờ `requestTimeoutMs`, Axios hủy request và hiển thị thông báo lỗi kết nối.

---

## 5. Business rules

1. **Ràng buộc thông tin bắt buộc cơ bản:**
   Một đơn hàng vận chuyển tối thiểu phải xác định được Khách hàng đặt hàng (`customerId`), Địa chỉ lấy hàng đầy đủ 5 thành phần (Line 1, City, State, Zip, Country), Địa chỉ giao hàng đầy đủ 5 thành phần, Cự ly vận chuyển (`distance >= 0`), và Cước phí vận chuyển (`deliveryCostAmount >= 0`).
2. **Quy tắc an toàn hàng hóa nguy hiểm (Hazmat):**
   - **Phía Giao diện (Client-side):** Bắt buộc người lập đơn phải cung cấp Phân loại nguy hiểm (`hazmatClass`) và Mã số nhận diện UN (`unNumber`) khi `isHazmat = true`.
   - **Phía Backend (API-side):** DTO `CreateLoadRequest.java:24-26` chỉ có `@NotNull Boolean isHazmat`, hoàn toàn **không có conditional validation** cho `hazmatClass` và `unNumber`. Backend chấp nhận payload `isHazmat: true` mà cả hai trường trên đều mang giá trị `null` nếu bypass qua client.
3. **Quy tắc loại đơn hàng, cước phí và khoảng cách (Phạm vi dữ liệu):**
   - **Loại đơn hàng (`type`):** Frontend Select giới hạn các lựa chọn tĩnh: STANDARD, EXPEDITED, REEFER, FLATBED. Backend DTO `CreateLoadRequest.java:13` chỉ kiểm tra `@NotBlank String type`, không có ràng buộc whitelist enum hay `@Pattern`.
   - **Cước phí và khoảng cách:** Giao diện `InputNumber` giới hạn `min={0}`. Backend DTO chỉ có `@NotNull`, không có ràng buộc `@Min(0)` hay `@DecimalMin("0.0")`.
4. **Quy tắc trật tự thời gian (Pickup vs Delivery) — [REQUIREMENT_UNKNOWN]:**
   Cả `requestedPickupDate` và `requestedDeliveryDate` đều là trường tùy chọn trên cả frontend và backend. Trong mã nguồn và tài liệu hiện có, không có tài liệu đặc tả nghiệp vụ nào bắt buộc `requestedDeliveryDate >= requestedPickupDate` tại thời điểm tạo đơn. Cần xác nhận từ Product Owner liệu đây là ràng buộc bắt buộc (Hard constraint) hay có cho phép trường hợp đặc thù (linh hoạt cập nhật sau).
5. **Quy tắc kiểm tra dữ liệu trùng lặp (Duplicate Detection & Idempotency) — [REQUIREMENT_UNKNOWN]:**
   Hệ thống backend hiện tại không có cơ chế kiểm tra trùng (idempotency key hoặc kiểm tra trùng `name`/`externalSourceId`). `LoadService.create` thực hiện `saveAndFlush` trực tiếp mỗi lần gọi. Việc gửi lặp lại cùng một payload sẽ sinh ra các đơn hàng khác nhau với số hiệu (`number`) tự tăng riêng biệt.
6. **Quy tắc phân công phương tiện & điều phối:**
   Việc gán xe (`assignedTruckId`) và điều phối viên (`assignedDispatcherId`) là tùy chọn tại thời điểm tạo Load. Đơn hàng có thể lưu ở trạng thái `draft` mà không cần phương tiện gán trước.

---

## 6. Permission

Cơ chế phân quyền được quản trị tập trung tại [`src/providers/permissions/roleMatrix.ts`](file:///home/vumoi/logictics-app/src/providers/permissions/roleMatrix.ts), [`src/providers/accessControlProvider.ts`](file:///home/vumoi/logictics-app/src/providers/accessControlProvider.ts) và phía backend tại `SecurityConfig.java`:

```typescript
// Trích xuất từ roleMatrix.ts:
const OPERATIONS = ["ADMIN", "ACCOUNTANT", "DISPATCHER"] as const;
{ resources: ["loads"], actions: [...CRUD_ACTIONS, "dispatch", "cancel", "pickup", "deliver", "PICKUP_BUSINESS_DATE"], roles: OPERATIONS }
```

```java
// Trích xuất từ SecurityConfig.java:
.requestMatchers("/api/employees/**").hasAnyRole("ADMIN", "DISPATCHER")
.requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "ACCOUNTANT", "DISPATCHER")
.requestMatchers("/api/trucks/**").hasAnyRole("ADMIN", "ACCOUNTANT", "DISPATCHER")
.requestMatchers("/api/loads/**").hasAnyRole("ADMIN", "ACCOUNTANT", "DISPATCHER")
```

### Bảng phân quyền chi tiết cho `loads:create`:

| Vai trò người dùng (Role) | Quyền truy cập `/loads/create` | Quyền gọi `POST /api/loads` | Hành vi thực tế trên UI & Giới hạn API phụ |
| :--- | :---: | :---: | :--- |
| **ADMIN** | **CHO PHÉP** | **CHO PHÉP** | Toàn quyền mở form, tìm kiếm mọi resource phụ (Khách hàng, Xe, Điều phối viên, Bến bãi) và submit thành công. |
| **DISPATCHER** | **CHO PHÉP** | **CHO PHÉP** | Toàn quyền mở form, tìm kiếm mọi resource phụ và submit thành công. |
| **ACCOUNTANT** | **CHO PHÉP** | **CHO PHÉP** | **GIỚI HẠN MỘT PHẦN:** Truy cập được URL `/loads/create` và có quyền gọi `POST /api/loads`. Tuy nhiên, khi form tải danh sách Điều phối viên (`GET /api/employees`), backend trả về **HTTP 403 Forbidden** do `SecurityConfig.java:118` chỉ cho phép `ADMIN` và `DISPATCHER`. Kế toán vẫn có thể submit nếu bỏ trống trường Điều phối viên. |
| **DRIVER** | **TỪ CHỐI** | **TỪ CHỐI** | Bị chặn ngay tại `ResourceAccessBoundary`, hiển thị màn hình `ForbiddenPage` (403). Trên menu/toolbar không thấy nút tạo. |
| **PAYROLL / PAYROLL_MANAGER** | **TỪ CHỐI** | **TỪ CHỐI** | Bị chặn, hiển thị `ForbiddenPage` (403). |
| **SUPERADMIN / OWNER / MANAGER** | **TỪ CHỐI** | **TỪ CHỐI** | Bị chặn do `roleMatrix.ts` fail-closed (chỉ cấp đúng cho mảng `OPERATIONS`). |
| **Chưa xác thực (Guest)** | **TỪ CHỐI** | **TỪ CHỐI** | Bị `ProtectedRoute` chặn và chuyển hướng về `/login`. |
| **Chưa chọn Tenant** | **TỪ CHỐI** | **TỪ CHỐI** | Bị `TenantGuard` chặn và chuyển hướng về `/select-tenant`. |

---

## 7. Test cases

> [!NOTE]
> **Quy ước trạng thái kiểm thử:**
> - `UNIT_TEST_PASS`: Kịch bản có test file tương ứng trong Vitest đã thực thi và pass trong phiên làm việc.
> - `SOURCE_REVIEWED`: Kịch bản đã được kiểm tra logic qua mã nguồn chi tiết, chưa có test case thực thi hoặc chưa có môi trường live để chạy E2E.
> - `REQUIREMENT_UNKNOWN`: Chưa có đặc tả nghiệp vụ có thẩm quyền để kết luận đạt hay hỏng.
> - `NOT_TESTED / BLOCKED`: Chưa thể kiểm thử trực tiếp do thiếu backend live hoặc môi trường bị cô lập an toàn.

| Mã TC | Phân loại | Mô tả kịch bản kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Result) | Trạng thái kiểm tra thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-LC-01** | Happy Path | Tạo đơn hàng tiêu chuẩn với các trường bắt buộc | `name`: "Dallas to Austin", `customerId`: valid UUID, Origin/Destination address hợp lệ, `distance`: 195, `deliveryCostAmount`: 500, `type`: STANDARD, `status`: draft | Form hợp lệ, gửi `POST /api/loads`, backend trả `201 Created`, redirect `/loads` và hiện thông báo thành công. | `SOURCE_REVIEWED` (Đối soát logic form và `LoadController.java:65`) |
| **TC-LC-02** | Happy Path | Tạo đơn hàng kèm các liên kết phụ (Xe, Bến bãi, Điều phối) | Điền đủ trường bắt buộc kèm `originTerminalId`, `destinationTerminalId`, `assignedTruckId`, `assignedDispatcherId` | Payload trích xuất đủ các ID. Phân tích backend cho thấy `assignedTruck` và `assignedDispatcher` được resolve, nhưng `originTerminalId` và `destinationTerminalId` **không được lưu** vào entity/DB. | `SOURCE_REVIEWED / PERSISTENCE_GAP` (Phát hiện lỗi không lưu Terminal ở backend) |
| **TC-LC-03** | UI & Logic | Hiển thị và toggle công tắc Hàng nguy hiểm (Hazmat) | Bật `isHazmat: true`, `hazmatClass`: "Class 3", `unNumber`: "UN1203" | Form hiển thị 2 ô nhập Hazmat khi bật switch; render đúng placeholder. | `UNIT_TEST_PASS` (Khớp test thực thi `LoadForm.test.tsx:48-63`) |
| **TC-LC-04** | Negative Case | Submit form khi để trống toàn bộ trường bắt buộc | Không nhập gì, click nút "Tạo đơn hàng" | Antd Form chặn submit tại client; hiển thị các thông báo tiếng Việt dưới từng trường; không gửi request mạng. | `SOURCE_REVIEWED` (Xác nhận qua `rules: [{ required: true }]`) |
| **TC-LC-05** | Negative Case | Bật Hazmat nhưng bỏ trống Class và UN Number trên UI | Bật `isHazmat: true`, để trống `hazmatClass` và `unNumber` | Hiển thị lỗi `"Vui lòng nhập phân loại nguy hiểm"` và `"Vui lòng nhập mã UN"`, cuộn đến field lỗi. | `SOURCE_REVIEWED` (Xác nhận qua `LoadForm.tsx:231, 241`) |
| **TC-LC-06** | Boundary Case | Nhập khoảng cách hoặc cước phí là số âm trên UI | `distance: -10`, `deliveryCostAmount: -50` | `InputNumber` chặn số âm qua thuộc tính `min={0}` (không cho nhập hoặc tự chỉnh về 0). | `SOURCE_REVIEWED` (Khớp `InputNumber min={0}`) |
| **TC-LC-07** | Boundary Case | Nhập tọa độ GPS vượt quá giới hạn cực trị trên UI | Vĩ độ = 95 (&gt; 90), Kinh độ = -190 (&lt; -180) | `InputNumber` có `min/max` [-90, 90] và [-180, 180] tự giới hạn giá trị. Form không có rule message riêng. Backend DTO chỉ có `@NotNull`. | `SOURCE_REVIEWED` (Xác nhận hành vi `AddressFields.tsx:156, 175`) |
| **TC-LC-08** | Business Logic | Chọn ngày giao hàng sớm hơn ngày lấy hàng | `requestedPickupDate`: 2026-10-30, `requestedDeliveryDate`: 2026-10-01 | Client và backend đều cho phép submit do thiếu validator chéo; chưa có tài liệu quy định bắt buộc chặn. | `SOURCE_REVIEWED / REQUIREMENT_UNKNOWN` |
| **TC-LC-09** | Concurrency | Thao tác click đúp nhanh vào nút "Tạo đơn hàng" | Click 2 lần trong vòng 100ms | Nút Submit chuyển sang trạng thái `loading` qua `saveButtonProps`, Ant Design disable nút. Chưa có test thực tế đo latency để xác minh nguy cơ multi-flight. | `NOT_TESTED / UNVERIFIED` (Cần môi trường có network latency) |
| **TC-LC-10** | Error Handling | Backend trả về lỗi 400 kèm mapping `errors` | Backend trả `{ success: false, errors: { name: ["Tên đơn đã tồn tại"] } }` | `applyBackendFieldErrors` bắt lỗi và hiện đỏ dưới ô "Tên đơn hàng", cuộn tới ô này. | `SOURCE_REVIEWED` (Khớp logic `resourceFormBackendErrors.ts`) |
| **TC-LC-11** | Permission | Người dùng có role `DRIVER` truy cập trực tiếp `/loads/create` | Đăng nhập tài khoản DRIVER, gõ URL `/loads/create` | Render `ForbiddenPage` (403), không lộ biểu mẫu. | `SOURCE_REVIEWED` (Khớp ma trận `roleMatrix.ts`) |
| **TC-LC-12** | Permission | Người dùng có role `ACCOUNTANT` mở form chọn Điều phối viên | Đăng nhập ACCOUNTANT, vào `/loads/create`, mở dropdown Dispatcher | Form mở bình thường, nhưng gọi `GET /api/employees` bị backend trả về `403 Forbidden`. | `SOURCE_REVIEWED` (Khớp `SecurityConfig.java:118`) |
| **TC-LC-13** | Duplicate Data | Tạo 2 đơn hàng trùng tên (`name`) hoặc trùng `externalSourceId` | Gửi 2 request với cùng `name: "Trip 1"` và cùng `externalSourceId: "EXT-01"` | Backend không có ràng buộc UNIQUE trên 2 cột này; tạo thành công 2 đơn hàng riêng biệt với 2 `id` và 2 sequence `number` khác nhau. Không trả 409. | `SOURCE_REVIEWED` (Khớp `Load.java:50`, `LoadService.java:74-84`) |
| **TC-LC-14** | API Bypass | Gửi request API trực tiếp với khoảng cách âm hoặc tọa độ sai | `POST /api/loads` với `distance: -10`, `originLocationLatitude: 999.0` | Backend DTO `CreateLoadRequest` chỉ dùng `@NotNull`, không có `@Min` hay `@Range`. | `NOT_TESTED / BLOCKED` (Chưa kiểm thử runtime bypass UI) |
| **TC-LC-15** | API Bypass | Gửi request API trực tiếp với `status` không hợp lệ | `POST /api/loads` với `status: "INVALID_STATUS"` | Backend DTO `CreateLoadRequest` chỉ dùng `@NotBlank`. | `NOT_TESTED / BLOCKED` (Chưa kiểm thử runtime bypass UI) |
| **TC-LC-16** | Boundary Case | Nhập trường Ghi chú (`notes`) vượt quá 2000 ký tự | Gõ 2500 ký tự vào ô `notes` và submit | Client không có `maxLength` chặn trước; backend DB có `@Column(length = 2000)` &rarr; Nguy cơ ném lỗi 500 DataTruncation. | `SOURCE_REVIEWED` (Đối soát `LoadForm.tsx:161` và `Load.java:105`) |
| **TC-LC-17** | API Bypass | Gửi request API trực tiếp với `type` không thuộc danh mục enum | `POST /api/loads` với `type: "UNKNOWN_TYPE_XYZ"` | Backend DTO `CreateLoadRequest.java:13` chỉ kiểm tra `@NotBlank`, không validate whitelist enum; backend không từ chối ở tầng validation DTO. | `SOURCE_REVIEWED` (Backend DTO chỉ kiểm tra `@NotBlank`) |
| **TC-LC-18** | API Bypass | Gửi request API với `isHazmat=true` nhưng bỏ trống Class và UN Number | `POST /api/loads` với `isHazmat: true, hazmatClass: null, unNumber: null` | Backend DTO `CreateLoadRequest.java:24-26` không có conditional validation; backend không từ chối ở tầng validation DTO. | `SOURCE_REVIEWED` (Backend DTO không enforce conditional rule) |

---

## 8. Confirmed bugs

### BUG-LC-01: Lệch cấu hình Resource "containers" giữa biểu mẫu LoadForm và API Registry
- **Mã lỗi:** `BUG-LC-01`
- **Mức độ nghiêm trọng:** **P2** (Medium — Configuration / Feature Gate Mismatch)
- **Phân loại:** `BUG_CONFIRMED` (ở tầng mã nguồn cấu hình)
- **Mô tả:** Trong [`src/features/loads/components/LoadForm.tsx:250-256`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L250-L256), trường "Container gắn kèm" sử dụng `<EntityPicker resource="containers" />`. Tuy nhiên, trong [`src/pages/resourceRegistry.ts:20-96`](file:///home/vumoi/logictics-app/src/pages/resourceRegistry.ts#L20-L96), danh mục `foundationApiResources` chỉ chứa 12 resources chính thức và **KHÔNG** có `containers`. Hook `useSelect` gọi `dataProvider.getList({ resource: "containers" })`, và tại [`src/providers/dataProvider.ts:208`](file:///home/vumoi/logictics-app/src/providers/dataProvider.ts#L208), phương thức `getDefinition` ném lỗi `Error: RESOURCE_NOT_CONFIGURED:containers`.
- **Lưu ý về Feature Gate & Bối cảnh mã nguồn:** Mã nguồn [`src/components/resources/resourceForms.ts:552-556`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts#L552-L556) có chú thích lịch sử: *"Containers/terminals have UI files but are absent from the active API provider allowlist. Keep raw optional IDs until their list endpoints are enabled"*. Đối với `terminals`, sau đó đã được bổ sung vào API allowlist ([`src/pages/resourceRegistry.ts:91-95`](file:///home/vumoi/logictics-app/src/pages/resourceRegistry.ts#L91-L95)), nhưng `containers` thì vẫn chưa được kích hoạt endpoint. Do đó, việc `LoadForm.tsx` gọi `EntityPicker(resource="containers")` là sự không đồng bộ giữa các phần mã nguồn. Hiện tượng runtime (crash ứng dụng hay hiển thị rỗng) chưa được kiểm chứng trên môi trường live.
- **Bước tái hiện:**
  1. Vào `/loads/create`.
  2. Cuộn xuống Section 4: Hàng hóa & an toàn.
  3. Bấm vào dropdown "Container gắn kèm".
- **Kết quả mong đợi:** Trường này hiển thị ô nhập text/UUID tạm thời (như ghi nhận trong `resourceForms.ts`) hoặc tải danh sách nếu API đã mở.
- **Kết quả thực tế:** Query của React Query thất bại do `dataProvider` từ chối resource `containers`.
- **Đề xuất khắc phục:** Đổi `EntityPicker` thành ô nhập `Input` (Text/UUID) trong `LoadForm.tsx` cho đến khi endpoint `/api/containers` được kích hoạt chính thức.

---

### BUG-LC-02: Backend không ánh xạ và lưu trữ thông tin Bến bãi (Terminals) khi tạo Load
- **Mã lỗi:** `BUG-LC-02`
- **Mức độ nghiêm trọng:** **P1** (High — Data Loss / Persistence Gap)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:** Frontend `LoadForm` cho phép người dùng chọn Trạm xuất phát (`originTerminalId`) và Trạm đích (`destinationTerminalId`) từ danh sách bến bãi hợp lệ (resource `terminals` đã có sẵn trong allowlist API). Payload gửi đi chứa đầy đủ 2 UUID này khớp với `CreateLoadRequest.java:28-29`. Tuy nhiên, phía backend:
  - `LoadService.resolveRelations` (`LoadService.java:138-155`) chỉ xử lý `customer`, `truck`, và `dispatcher`; hoàn toàn không resolve `originTerminal` và `destinationTerminal`.
  - `LoadMapper.java:17-35` bỏ qua hoàn toàn việc ánh xạ `originTerminalId` và `destinationTerminalId` sang các quan hệ entity `Load.originTerminal` và `Load.destinationTerminal` (`Load.java:121-127`).
- **Bước tái hiện:**
  1. Vào `/loads/create`, chọn Trạm xuất phát và Trạm đích từ danh sách bến bãi.
  2. Điền đầy đủ các thông tin khác và bấm "Tạo đơn hàng".
  3. Kiểm tra bản ghi trong bảng `loads` hoặc gọi `GET /api/loads/{id}`.
- **Kết quả mong đợi:** Đơn hàng được tạo lưu trữ `origin_terminal_id` và `destination_terminal_id`.
- **Kết quả thực tế:** Cả 2 cột `origin_terminal_id` và `destination_terminal_id` trong cơ sở dữ liệu đều nhận giá trị `NULL`.
- **Bằng chứng:** Đối chiếu `CreateLoadRequest.java:28-29`, `LoadMapper.java:17-35`, và `LoadService.java:138-155`.
- **Lưu ý phân định:** Trường `containerId` được tách riêng khỏi bug này vì thuộc resource `containers` đang ở trạng thái feature-gated; cần xác nhận yêu cầu sản phẩm trước khi xem xét hỗ trợ persistence cho container.
- **Đề xuất khắc phục:** Bổ sung logic resolve và set quan hệ `originTerminal`, `destinationTerminal` trong `LoadService.java` và `LoadMapper.java`.

---

## 9. Unverified risks

### RISK-LC-01: Nguy cơ phát sinh request trùng lặp (Double click / Concurrency)
- **Mã nguy cơ:** `RISK-LC-01`
- **Mức độ rủi ro:** **P2** (Medium)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** `FormFooterBar.tsx:54-59` truyền `{...saveButtonProps}` và `loading={isLoading}` vào nút Submit. Khi Refine kích hoạt mutation, nút bấm được gắn cờ `loading` và Ant Design sẽ vô hiệu hóa click. Tuy nhiên, nếu xảy ra hiện tượng chậm trễ render trong micro-giây hoặc người dùng gõ phím Enter nhanh liên tục, form có thể bị trigger nhiều lần. Vì backend `LoadService.create` không có idempotency key và không kiểm tra trùng, việc nhận nhiều request cùng lúc sẽ sinh ra các đơn hàng nhân bản. Cần có kiểm thử thực tế với mạng có độ trễ để kết luận.

### RISK-LC-02: Nguy cơ tràn dung lượng cơ sở dữ liệu ở trường Ghi chú (`notes`)
- **Mã nguy cơ:** `RISK-LC-02`
- **Mức độ rủi ro:** **P2** (Medium)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trong [`src/features/loads/components/LoadForm.tsx:161`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L161), ô nhập `Input.TextArea` của `notes` không có thuộc tính `maxLength` hay rule giới hạn độ dài. Trong khi đó, backend JPA Entity quy định nghiêm ngặt `@Column(name = "notes", length = 2000)` ([`Load.java:105`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/entity/Load.java#L105)). Nếu người dùng dán nội dung dài hơn 2000 ký tự, backend sẽ ném lỗi 500 do lỗi cơ sở dữ liệu (`DataTruncation`). (Riêng trường `name` là cột `text` không giới hạn trong DB nên không có rủi ro tràn cột, nhưng thiếu giới hạn có thể làm vỡ layout hiển thị).

### RISK-LC-03: Định dạng mã nguy hiểm UN (`unNumber`) thiếu kiểm tra định dạng
- **Mã nguy cơ:** `RISK-LC-03`
- **Mức độ rủi ro:** **P3** (Low)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trường `unNumber` tại [`src/features/loads/components/LoadForm.tsx:240`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L240) chỉ kiểm tra `required: true`. Mã UN theo tiêu chuẩn an toàn vận tải thường có định dạng tiền tố "UN" kèm 4 chữ số (ví dụ: UN1203, UN1993). Cho phép nhập chuỗi bất kỳ có thể dẫn đến sai lệch dữ liệu an toàn.

### RISK-LC-04: Thiếu xác nhận hủy khi người dùng đã nhập dữ liệu dở dang (Unsaved Changes)
- **Mã nguy cơ:** `RISK-LC-04`
- **Mức độ rủi ro:** **P3** (Low)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Tại `LoadCreate.tsx`, hook `useForm` không bật `warnWhenUnsavedChanges: true` và nút Hủy chuyển hướng thẳng về `/loads`. Nếu người dùng đã nhập biểu mẫu dài mà vô tình bấm nút Hủy, dữ liệu sẽ mất ngay lập tức mà không có cảnh báo.

### RISK-LC-05: Giữ lại dữ liệu Hazmat khi unmount component (Data Retention)
- **Mã nguy cơ:** `RISK-LC-05`
- **Mức độ rủi ro:** **P3** (Low — Observed UI Behavior)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Khi người dùng bật switch `isHazmat`, nhập `hazmatClass` và `unNumber`, rồi tắt switch về `false`, Ant Design Form không có `preserve: false` nên vẫn giữ giá trị cũ trong form store và gửi lên server cùng với `isHazmat: false`. Mặc dù backend DTO nhận các trường này là tùy chọn, việc gửi dữ liệu thừa khi công tắc đã tắt là hành vi giao diện không sạch và tiềm ẩn rủi ro logic phụ thuộc.

### RISK-LC-06: Thứ tự thời gian Ngày hẹn lấy và Ngày hẹn giao hàng
- **Mã nguy cơ:** `RISK-LC-06`
- **Mức độ rủi ro:** **P3** (Low — Business Assumption)
- **Phân loại:** `REQUIREMENT_UNKNOWN`
- **Mô tả:** Giao diện và backend hiện tại cho phép chọn `requestedDeliveryDate < requestedPickupDate`. Chưa có văn bản đặc tả khẳng định đây là lỗi hay cho phép trong quy trình tạo nháp. Cần Product Owner thẩm định.

---

## 10. Missing functionality

> [!NOTE]
> **Định vị phạm vi & Đề xuất cải tiến:**  
> Các mục dưới đây phản ánh khoảng cách tính năng so với một hệ thống TMS hoàn chỉnh hoặc quan sát về tính nhất quán UX. Hiện tại dự án chưa có văn bản Tiêu chí chấp nhận (Acceptance Criteria) chính thức quy định bắt buộc phải có các tính năng này tại thời điểm tạo Load. Do đó, các mục này được phân loại là **Đề xuất cải tiến (Enhancement Suggestions / Requirement Unknown)**, không coi là lỗi chức năng đang chạy.

1. **`[ENHANCEMENT / REQUIREMENT_UNKNOWN]` Cơ chế tự động tính khoảng cách (`distance`) dựa trên địa chỉ:**
   Người dùng hiện phải tự đo và nhập số dặm (`distance`) thủ công. Có thể tích hợp thêm API định tuyến (Mapbox / OSRM) để tự động tính toán khoảng cách giữa Điểm lấy hàng và Điểm giao hàng nhằm giảm thiểu sai sót nhập liệu.
2. **`[ENHANCEMENT / REQUIREMENT_UNKNOWN]` Tự động điền địa chỉ qua Geocoding / Autocomplete:**
   Các ô nhập địa chỉ Line 1, City, State, ZipCode hoàn toàn phải gõ tay. Tích hợp Places Autocomplete API sẽ giúp chuẩn hóa địa chỉ và tọa độ GPS ngay khi nhập.
3. **`[ENHANCEMENT / REQUIREMENT_UNKNOWN]` Đính kèm tài liệu vận tải (Documents / Attachments) khi lập đơn:**
   Trong quy trình thực tế, khách hàng thường đính kèm phiếu đóng gói (Packing List) hoặc đơn đặt hàng (PO). Hiện tại hệ thống hỗ trợ upload tài liệu sau khi đơn đã tạo (thông qua tab Documents ở màn hình Show).
4. **`[UX_OBSERVATION]` Đồng bộ trải nghiệm tạo Load giữa trang Danh sách và Route Create:**
   Nút "+ Tạo mới" trên bảng danh sách `/loads` mở `ResourceCreateModal` dạng 2 cột generic, trong khi route `/loads/create` mở biểu mẫu 6 section chuyên nghiệp. Việc đồng bộ hành vi (ví dụ cấu hình nút trên list chuyển sang `/loads/create`) sẽ nâng cao trải nghiệm người dùng nhưng cần thống nhất về mặt thiết kế sản phẩm.

---

## 11. Integration issues

1. **Xung đột phân quyền giữa Tạo Load và Danh sách Điều phối viên:**
   Người dùng có vai trò `ACCOUNTANT` được cấp quyền `loads:create` trong `roleMatrix.ts` và backend `SecurityConfig.java:123` cho phép ACCOUNTANT gọi `POST /api/loads`. Tuy nhiên, dropdown Điều phối viên trên form gọi `GET /api/employees`, API này chỉ cấp cho `ADMIN` và `DISPATCHER` (`SecurityConfig.java:118`). Khi Kế toán lập đơn, dropdown này bị lỗi 403 Forbidden.
2. **Mất liên kết Bến bãi (Terminals) khi tích hợp sang Cơ sở dữ liệu:**
   Module Terminals hoạt động bình thường trên frontend và backend, nhưng mapper `LoadMapper` và service `LoadService` chưa kết nối 2 trường `originTerminalId` và `destinationTerminalId` vào entity `Load`.
3. **Quan sát điều hướng với luồng TMS Dispatch Flow (`/tms/dispatch`) [REQUIREMENT_UNKNOWN]:**
   Tại [`src/pages/tms-flow/DispatchPage.tsx:203`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx#L203), nút "New shipment" chuyển hướng người dùng đến `/loads/create`. Sau khi tạo thành công, `LoadCreate` có cấu hình mặc định `redirect: "list"` đưa về `/loads` ([`src/pages/loads/create.tsx:24`](file:///home/vumoi/logictics-app/src/pages/loads/create.tsx#L24)). Đây là hành vi điều hướng CRUD tiêu chuẩn của Refine. Hiện chưa có tiêu chí chấp nhận (Acceptance Criteria) yêu cầu phải lưu ngữ cảnh và quay lại `/tms/dispatch`. Ghi nhận là quan sát trải nghiệm người dùng (UX observation) để Product Owner cân nhắc xem có cần hỗ trợ redirect động (ví dụ qua query param `?returnTo=/tms/dispatch`) hay không, không kết luận là lỗi nghiệp vụ.

---

## 12. Test execution evidence

Đã thực thi kiểm tra trên repository hiện tại trong phiên làm việc:

```bash
# 1. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - Không có lỗi type)

# 2. Kiểm tra đóng gói Vite build
$ npm run build
Exit code: 0 (PASS - Biên dịch hoàn tất thành công)

# 3. Kiểm tra ESLint
$ npm run lint
Exit code: 0 (PASS - 0 errors, 4 warnings ở các file không liên quan)

# 4. Kiểm tra Unit & Component Test liên quan đến Load
$ npx vitest run src/tests/pages/loads/ src/tests/features/loads/
Test Files  8 passed (8)
     Tests  41 passed (41)
  Duration  8.02s
Exit code: 0 (PASS)

# 5. Kiểm tra toàn bộ Test Suite toàn dự án
$ npm run build && npm run lint && npx vitest run
Test Files  210 passed (210)
     Tests  1393 passed (1393)
  Duration  155.52s
Exit code: 0 (PASS - Toàn bộ 210 file test và 1393 test case xanh)

# 6. Kiểm tra định dạng Diff Git
$ git diff --check
Exit code: 0 (PASS - Không có lỗi whitespace thừa)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Phân biệt bằng chứng:**  
> - Các Unit Test đã chạy trong `LoadForm.test.tsx` (kiểm tra render 6 card sections, chuyển đổi hiển thị Hazmat, render AddressFields, nút Hủy) đã chạy và đạt PASS.  
> - Các kịch bản kiểm tra submit form, payload, phân quyền, validation backend và kiểm tra dữ liệu trùng được ghi nhận qua **phân tích mã nguồn tĩnh (Source Code Review)**, chưa được thực thi bằng live automated tests.  
> - **E2E Playwright:** `BLOCKED` do phiên làm việc không kích hoạt backend Spring Boot live (`E2E_REAL_OIDC=0`).  
> - **Live Mutation:** `NOT_TESTED` trên môi trường live/production tuân thủ nguyên tắc an toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-LC-02` | Backend Bug | **Khắc phục việc không lưu Terminal ID:** Bổ sung logic resolve quan hệ và cập nhật `LoadMapper.java` để lưu `originTerminalId` và `destinationTerminalId` vào bảng `loads`. | `.../service/LoadService.java`<br>`.../mapper/LoadMapper.java` |
| **P2** | `BUG-LC-01` | Config Mismatch | **Đồng bộ hóa trường Container trên LoadForm:** Tạm thời thay thế `EntityPicker(resource="containers")` bằng ô nhập `Input` (Text/UUID) trong `LoadForm.tsx` khớp với trạng thái feature gate cho đến khi container API được kích hoạt chính thức. | [`src/features/loads/components/LoadForm.tsx:251`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L251) |
| **P2** | `PERM-GAP` | Permission / API | **Xử lý quyền truy cập danh sách nhân viên cho Kế toán:** Cân nhắc cấp quyền `GET /api/employees` cho role `ACCOUNTANT` trong `SecurityConfig.java:118` hoặc xử lý graceful fallback trên UI (không ném lỗi chặn) khi role ACCOUNTANT không tải được employee. | `/home/vumoi/logictics_api/.../SecurityConfig.java:118`<br>[`src/components/EntityPicker.tsx`](file:///home/vumoi/logictics-app/src/components/EntityPicker.tsx) |
| **P2** | `RISK-LC-02` | Data Integrity | **Thêm giới hạn độ dài ký tự cho Ghi chú:** Đặt `maxLength={2000}` và `showCount` cho ô nhập `notes` trong `LoadForm.tsx` để đồng bộ với ràng buộc `@Column(length = 2000)` của backend DB. | [`src/features/loads/components/LoadForm.tsx:161`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L161) |
| **P2** | `UX-01` | UX Alignment | **Đồng bộ hóa nút Tạo mới trên trang danh sách `/loads`:** Cấu hình `headerButtons` trên `src/pages/loads/list.tsx` để nút "+ Tạo mới" điều hướng sang `/loads/create` thay vì mở modal generic thô. | [`src/pages/loads/list.tsx`](file:///home/vumoi/logictics-app/src/pages/loads/list.tsx) |
| **P3** | `API-VAL` | API Validation | **Bổ sung Bean Validation cho DTO Backend:** Cân nhắc thêm `@Min(0)` cho cước phí/khoảng cách, whitelist enum cho `type`, và validation ràng buộc Hazmat trên backend DTO. | `.../dto/load/CreateLoadRequest.java` |
| **P3** | `RISK-LC-05` | Data Cleanliness | **Làm sạch dữ liệu Hazmat khi unmount:** Bổ sung `preserve: false` vào Form.Item của `hazmatClass` và `unNumber` hoặc xóa giá trị khi `isHazmat` tắt. | [`src/features/loads/components/LoadForm.tsx:231`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L231) |
| **P3** | `RISK-LC-03` | Validation | **Kiểm tra định dạng mã UN:** Thêm pattern regex kiểm tra mã UN (ví dụ: `/^UN\d{4}$/`). | [`src/features/loads/components/LoadForm.tsx:241`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadForm.tsx#L241) |
| **P3** | `RISK-LC-04` | Usability | **Cảnh báo mất dữ liệu chưa lưu:** Bổ sung `warnWhenUnsavedChanges: true` vào `useForm` của `LoadCreate`. | [`src/pages/loads/create.tsx:18`](file:///home/vumoi/logictics-app/src/pages/loads/create.tsx#L18) |
| **P3** | `REQ-CONFIRM` | Requirement Unknown | **Xác nhận yêu cầu nghiệp vụ với PO:** Thẩm định yêu cầu thứ tự ngày (`delivery >= pickup`) và yêu cầu điều hướng quay lại luồng Dispatch (`?returnTo`). | PO / BA Confirmation |
