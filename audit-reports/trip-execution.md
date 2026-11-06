# AUDIT: trip-execution

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `trip-execution` (Thực hiện Trip, Stops, Timeline, hoàn thành chuyến)  
> **Thời điểm kiểm định:** 25/10/2026 (Cập nhật sau Codex Review độc lập đợt 2)  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát liên tầng (Frontend React Refine & Backend Spring Boot), đối soát máy trạng thái (State Machine) của Chặng dừng và Chuyến xe, kiểm tra cơ chế phân quyền RBAC/SecurityConfig, và thực thi bộ kiểm thử tự động (Unit/Contract Tests với mock).

---

## 1. Tổng quan chức năng

Phân hệ **Thực hiện Chuyến xe & Chặng dừng (Trip Execution & Stops Lifecycle)** là phân hệ phụ trách theo dõi, ghi nhận tiến độ di chuyển thực tế của phương tiện từ điểm xuất phát, qua các điểm nhận/trả hàng trung gian cho đến khi kết thúc chuyến đi. Đồng thời, phân hệ chịu trách nhiệm tính toán thời gian lưu xe (Dwell Time / Detention), quản lý phân công tài xế đồng hành, tổng hợp dặm đường vận hành và phát hành các sự kiện thực thi vào Dòng thời gian đơn hàng (Load Timeline).

### Các phân hệ mã nguồn tham gia luồng Trip Execution:
1. **Màn hình Chi tiết & Thực thi Chuyến xe (Trip Execution Page):**
   - Tuyến đường: `/trips/show/:id` ([`src/pages/trips/show.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx)).
   - Bảng tổng hợp dặm đường (Trip Mileage Summary): [`src/features/trips/components/TripMileageSummary.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripMileageSummary.tsx).
   - Tab Chặng dừng & Tiến trình (Stops & Timeline): [`src/features/trips/components/TripStopsTimeline.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopsTimeline.tsx).
   - Bộ nút chuyển trạng thái chặng dừng (Trip Stop Actions): [`src/features/trips/components/TripStopActions.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopActions.tsx).
   - Tab Phân công tài xế (Driver Assignments): [`src/features/trips/components/TripDriverAssignments.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripDriverAssignments.tsx).
   - Tab Chi tiết chuyến xe (Full Details): Mô tả thông tin số hiệu, xe, trạng thái, các mốc thời gian `dispatchedAt`, `completedAt`, `cancelledAt`.
2. **Dòng thời gian thực thi điều phối TMS (TMS Flow Timeline):**
   - Tuyến đường bàn làm việc: `/tms/dispatch` & `/tms/shipments/:shipmentId`.
   - Component hiển thị lịch sử sự kiện: [`src/components/tms-flow/TmsTimeline.tsx`](file:///home/vumoi/logictics-app/src/components/tms-flow/TmsTimeline.tsx).
   - Hook truy vấn sự kiện đơn hàng: [`src/hooks/tms-flow/useTmsQueries.ts`](file:///home/vumoi/logictics-app/src/hooks/tms-flow/useTmsQueries.ts).
3. **Backend Dịch vụ & Bộ điều khiển (Spring Boot API):**
   - Bộ điều khiển thực thi chuyến xe: `com.company.logicstic.controller.TripExecutionController.java` & `TripExecutionService.java`.
   - Bộ điều khiển quản lý chuyến xe cơ bản: `com.company.logicstic.controller.TripController.java` & `TripService.java`.
   - Bộ điều khiển tài xế & nhân viên: `com.company.logicstic.controller.DriverController.java` & `EmployeeService.java`.
   - Bộ điều khiển dòng thời gian đơn hàng: `com.company.logicstic.controller.LoadTimelineController.java` & `LoadTimelineService.java`.
   - Bộ điều khiển phụ phí và lưu xe: `com.company.logicstic.controller.AccessorialController.java` & `AccessorialService.java`.

---

## 2. Danh sách route

| Đường dẫn URL | Component phụ trách | Mounting Runtime | Rào chắn phân quyền / Capability Gate | Hành vi chuyển hướng / Bảo vệ |
| :--- | :--- | :--- | :--- | :--- |
| `/trips/show/:id` | `TripShow` ([`src/pages/trips/show.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx)) | Refine Resource Router tại [`src/pages/index.ts:227`](file:///home/vumoi/logictics-app/src/pages/index.ts#L227) | `ResourceAccessBoundary` (`action="show", resource="trips"`). | Yêu cầu đăng nhập (`ProtectedRoute`) và tenant (`TenantGuard`). Chỉ cấp quyền cho nhóm `DISPATCH` (`ADMIN`, `DISPATCHER`). Role `ACCOUNTANT`, `DRIVER` hoặc khách bị chặn 403 / thông báo cấm quyền. |
| `/trips` | `TripList` ([`src/pages/trips/list.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/list.tsx)) | Refine Resource Router tại [`src/pages/index.ts:227`](file:///home/vumoi/logictics-app/src/pages/index.ts#L227) | `ResourceAccessBoundary` (`action="list", resource="trips"`). | Bảng danh sách chuyến xe dành cho `DISPATCH`. Cột số hiệu chứa link điều hướng sang `/trips/show/:id`. |
| `/trips/create` | `TripCreate` ([`src/pages/trips/create.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/create.tsx)) | Refine Resource Router tại [`src/pages/index.ts:227`](file:///home/vumoi/logictics-app/src/pages/index.ts#L227) | `ResourceAccessBoundary` (`action="create", resource="trips"`). | Tạo Trip mới với tên, xe, khoảng cách tổng. **Lưu ý:** Hiện chưa có tính năng thêm chặng dừng khi tạo qua UI. |
| `/trips/edit/:id` | `TripEdit` ([`src/pages/trips/edit.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/edit.tsx)) | Refine Resource Router tại [`src/pages/index.ts:227`](file:///home/vumoi/logictics-app/src/pages/index.ts#L227) | **BỊ KHÓA BỞI CAPABILITY GATE:** `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false` tại [`resourceCapabilities.ts:21`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L21). | Nút Edit bị ẩn trên toàn bộ UI Refine. *(Lưu ý: Tầng backend raw API `PUT /api/trips/{id}` tại `TripController.java:67` vẫn hỗ trợ cập nhật status kèm trường bắt buộc `expectedVersion`, nhưng UI Refine bị vô hiệu hóa).* |
| `/tms/dispatch` | `DispatchPage` ([`src/pages/tms-flow/DispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx)) | Mount qua `TmsFlowRoot` tại [`AppRouter.tsx:246`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L246) | `ResourceAccessBoundary` (`action="list", resource="loads"`). | Chứa panel "Execution timeline" gọi `TmsTimeline.tsx` để xem dòng sự kiện đơn hàng. |

---

## 3. Danh sách UI action

| ID | Vùng màn hình | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-TE-01** | Header `/trips/show/:id` | `Tabs` ("Stops & Timeline", "Driver Assignments", "Full Details") | `setActiveTab(key)` | Không gọi API (Client State) | Chuyển đổi giữa tiến trình chặng dừng, danh sách phân công tài xế và bảng chi tiết metadata chuyến xe. |
| **ACT-TE-02** | Thẻ chặng dừng: Chuyển sang Đến nơi | `Button` ("Arrive") | `executeTransition("arrive", stopId)` | `POST /api/trip-stops/{id}/arrive` | Chuyển trạng thái stop từ `PENDING` &rarr; `ARRIVED`, ghi nhận mốc `arrivedAt = now()`. Nút chuyển thành "Start Service". |
| **ACT-TE-03** | Thẻ chặng dừng: Bắt đầu phục vụ | `Button` ("Start Service") | `executeTransition("startService", stopId)` | `POST /api/trip-stops/{id}/start-service` | Chuyển trạng thái stop từ `ARRIVED` &rarr; `SERVICE_STARTED`, ghi nhận `serviceStartedAt = now()`. Nút chuyển thành "Complete Service". |
| **ACT-TE-04** | Thẻ chặng dừng: Hoàn tất phục vụ | `Button` ("Complete Service") | `executeTransition("completeService", stopId)` | `POST /api/trip-stops/{id}/complete-service` | Chuyển trạng thái stop từ `SERVICE_STARTED` &rarr; `SERVICE_COMPLETED`, ghi nhận `serviceCompletedAt = now()`. Nút chuyển thành "Depart". |
| **ACT-TE-05** | Thẻ chặng dừng: Rời trạm | `Button` ("Depart") | `executeTransition("depart", stopId)` | `POST /api/trip-stops/{id}/depart` | Chuyển stop thành `DEPARTED`, tính `dwellMinutes`. **Quan sát mã nguồn:** Backend chỉ cập nhật Stop (`TripExecutionService.java:120-126`), chưa có logic tự động hoàn tất Trip khi chặng cuối rời trạm; trên UI không có nút hoàn tất Trip chuyên biệt. *(Quy tắc cập nhật trạng thái Load sang DELIVERED cần được xác nhận theo đặc tả nghiệp vụ)*. |
| **ACT-TE-06** | Thẻ chặng dừng: Dữ liệu tải lỗi | `Alert` / `Button` ("Retry") | `queryResult.refetch()` | `GET /api/trips/{tripId}/stops` | Cho phép người dùng thử tải lại danh sách chặng dừng nếu gặp sự cố mạng hoặc timeout. |
| **ACT-TE-07** | Tab Tài xế: Mở hộp thoại gán | `Button` ("Assign Driver") | `handleOpenModal()` | Không gọi API (Mở modal) | Hiển thị modal gán tài xế, reset form về giá trị mặc định (`assignmentType: "PRIMARY"`). |
| **ACT-TE-08** | Modal Gán tài xế: Nhập thông tin & Submit | Form Submit (`TripDriverAssignments.tsx:64`) | `handleAssignSubmit()` | `POST /api/trips/{tripId}/drivers` | **Khoảng cách UX & Xác thực (GAP-TE-04 / GAP-TE-05):** Ô nhập tài xế là `<Input>` text thô (UUID), không có dropdown chọn tài xế và không có client regex validation cho UUID. Đồng thời backend chưa kiểm tra vai trò DRIVER của nhân viên được gán. |
| **ACT-TE-09** | Tab Tài xế: Hủy phân công tài xế | Popconfirm & `Button` ("Unassign") | `unassignDriver(assignmentId)` | `POST /api/trips/{tripId}/drivers/{assignmentId}/unassign` | Đóng phân công (`effectiveTo = now()`), giữ nguyên bản ghi lịch sử phục vụ kiểm toán (Soft-close chuẩn mực). |
| **ACT-TE-10** | Thẻ tổng hợp dặm đường (TripMileageSummary) | Bảng Statistic (4 Thẻ chỉ số) | Render từ props | Không gọi API | **Khoảng cách Dữ liệu (GAP-TE-03):** 4 thẻ Planned, Actual, Loaded, Empty Miles hiển thị nhãn không khả dụng ("N/A" / "Không khả dụng") do DTO `TripView` không trả về và entity `Trip` chưa có logic ghi dữ liệu. |
| **ACT-TE-11** | Bàn điều phối `/tms/dispatch`: Dòng thời gian | Component `TmsTimeline.tsx` | Render `events` | `GET /api/loads/{loadId}/timeline` | **Khoảng cách Sự kiện (BUG-TE-01):** Các thao tác chuyển trạng thái stop không gọi `recordEvent()`, do đó không sinh sự kiện thực thi vào dòng thời gian của đơn hàng. |

---

## 4. API liên quan

### 4.1. Bảng đối soát Endpoints luồng Trip Execution & Timeline

| Nhóm nghiệp vụ | Phương thức | Endpoint | Controller / Service Backend | Request Body / Params | Response Model |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Stops Listing** | `GET` | `/api/trips/{tripId}/stops` | `TripExecutionController.getTripStops` | *Path variable: tripId* | `ApiResponse<List<TripStopView>>` |
| **Stop Arrive** | `POST` | `/api/trip-stops/{id}/arrive` | `TripExecutionController.arriveStop` | *Path variable: id (stopId)* | `ApiResponse<TripStopView>` |
| **Stop Start Service** | `POST` | `/api/trip-stops/{id}/start-service` | `TripExecutionController.startStopService` | *Path variable: id (stopId)* | `ApiResponse<TripStopView>` |
| **Stop Complete Service** | `POST` | `/api/trip-stops/{id}/complete-service` | `TripExecutionController.completeStopService` | *Path variable: id (stopId)* | `ApiResponse<TripStopView>` |
| **Stop Depart** | `POST` | `/api/trip-stops/{id}/depart` | `TripExecutionController.departStop` | *Path variable: id (stopId)* | `ApiResponse<TripStopView>` |
| **Driver Listing** | `GET` | `/api/trips/{tripId}/drivers` | `TripExecutionController.getTripDrivers` | *Path variable: tripId* | `ApiResponse<List<TripDriverAssignmentView>>` |
| **Driver Assign** | `POST` | `/api/trips/{tripId}/drivers` | `TripExecutionController.assignDriver` | `{ driverId: UUID, assignmentType: string, effectiveFrom?: string, plannedMiles?: number }` | `ApiResponse<TripDriverAssignmentView>` |
| **Driver Unassign** | `POST` | `/api/trips/{tripId}/drivers/{assignmentId}/unassign` | `TripExecutionController.unassignDriver` | *Path variables: tripId, assignmentId* | `ApiResponse<TripDriverAssignmentView>` |
| **Trip Update (Raw API)**| `PUT` | `/api/trips/{id}` | `TripController.update` | `{ expectedVersion: number (bắt buộc, @PositiveOrZero), name: string, totalDistance: number, status: string, truckId?: UUID }` *(Kiểm tra `ExpectedVersionGuard.require` tại `TripService.java:55`)* | `ApiResponse<TripView>` |
| **Driver Search** | `GET` | `/api/drivers` | `DriverController.search` | `search, status, page, pageSize, orderBy, descending` *(Hiện truyền `roleId=null` nên trả về toàn bộ Employee)* | `ApiResponse<PagedResponse<EmployeeView>>` |
| **Load Timeline** | `GET` | `/api/loads/{loadId}/timeline` | `LoadTimelineController.getTimeline` | *Path variable: loadId* | `ApiResponse<LoadTimelineResponse>` |
| **Stop Detention** | `POST` | `/api/trip-stops/{stopId}/calculate-detention` | `AccessorialController.calculateDetention` | `{ freeMinutes?: number, hourlyRate?: number }` | `ApiResponse<DetentionCalculationResult>` |

### 4.2. Xử lý mã phản hồi HTTP và Khung lỗi

- **HTTP 200 OK / 201 Created:** Xử lý trả về bọc trong vỏ `ApiResponse.data`. Phía frontend hook `useTripStopActions` tự động kích hoạt `refetch()` chặng dừng và gọi `invalidate({ resource: "trips", invalidates: ["detail"] })`.
- **HTTP 400 Bad Request:**
  - Chuyển trạng thái stop sai quy tắc máy trạng thái: *"Trip stop cannot transition from X to Y"* (`TripExecutionService.java:146`).
  - Phân công loại tài xế không hợp lệ: *"Unsupported trip driver assignment type: X"* (`TripExecutionService.java:49`).
  - Hủy gán phân công không thuộc về Trip: *"Assignment X does not belong to Trip Y"* (`TripExecutionService.java:70`).
  - Hủy gán phân công đã đóng từ trước: *"Assignment X is already closed"* (`TripExecutionService.java:73`).
  - Thiếu hoặc sai định dạng trường `expectedVersion` khi gọi `PUT /api/trips/{id}` (`UpdateTripRequest.java:9`).
  - Gửi body sai kiểu dữ liệu UUID trong `AssignDriverRequest`: `HttpMessageNotReadableException` được chuyển thành 400 `MALFORMED_REQUEST` bởi `GlobalExceptionHandler.java:123-142`.
- **HTTP 403 Forbidden:**
  - Cấu hình backend tại [`SecurityConfig.java:123`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L123) quy định: `.requestMatchers("/api/trips/**", "/api/trip-stops/**").hasAnyRole("ADMIN", "DISPATCHER")`. Người dùng không sở hữu 2 role này (bao gồm cả `ACCOUNTANT` và `DRIVER`) khi gửi request tới các route này đều bị Spring Security từ chối với mã lỗi 403.
- **HTTP 404 Not Found:**
  - `ResourceNotFoundException`: Khi `tripId`, `stopId`, `driverId` hoặc `assignmentId` không tồn tại trong cơ sở dữ liệu.
- **HTTP 409 Conflict:**
  - Xung đột phiên bản khi gọi `PUT /api/trips/{id}` với `expectedVersion` không khớp version hiện tại trong cơ sở dữ liệu (`ExpectedVersionGuard.java`).

---

## 5. Business rules

### 5.1. Máy trạng thái Chặng dừng (TripStop State Machine)
Mỗi chặng dừng (TripStop) trong chuyến xe bắt buộc phải tuân theo chu trình tiến trình nghiêm ngặt một chiều:

```
[ PENDING / EN_ROUTE ] 
          │
          ▼  (arriveStop)
     [ ARRIVED ]
          │
          ▼  (startStopService)
 [ SERVICE_STARTED ]
          │
          ▼  (completeStopService)
[ SERVICE_COMPLETED ]
          │
          ▼  (departStop)
     [ DEPARTED ]  ---> (Completed / Final State)
```

1. **Nguyên tắc không nhảy cóc (No State Skipping):** Hệ thống không cho phép nhảy thẳng từ `PENDING` sang `SERVICE_STARTED` hoặc từ `ARRIVED` sang `DEPARTED`. Nếu vi phạm, `requireStatus` tại `TripExecutionService.java:146` sẽ ném ngoại lệ 400 Bad Request ngay lập tức.
2. **Xác lập mốc thời gian thực tế:** Mỗi lần chuyển trạng thái, hệ thống đóng dấu thời gian máy chủ `OffsetDateTime.now()` vào cột tương ứng (`arrivedAt`, `serviceStartedAt`, `serviceCompletedAt`, `departedAt`).
3. **Tính toán thời gian lưu trạm (Dwell Time):**
   - Khi chặng dừng có cả `arrivedAt` và `departedAt`, hệ thống tính thời gian dừng chờ:
     $$\text{dwellMinutes} = \text{Duration.between}(\text{arrivedAt}, \text{departedAt}).\text{toMinutes()}$$
   - Logic này được đối soát tại `TripExecutionService.java:171-176`. Giá trị được trả về qua trường `dwellMinutes` của `TripStopView`.

### 5.2. Quản lý phân công tài xế (Driver Assignment Lifecycle)
1. **Bảo toàn lịch sử phục vụ kiểm toán (Soft-close Audit Trail):**
   - Khi hủy phân công một tài xế khỏi chuyến xe (`unassignDriver`), hệ thống **tuyệt đối không xóa bản ghi** khỏi bảng `trip_driver_assignments` ([`TripExecutionService.java:65-80`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L65-L80)). Trường `effectiveTo` được cập nhật thành thời điểm hiện tại (`OffsetDateTime.now()`).
   - Bản ghi được phân loại là không còn hoạt động (`isActive = false`) khi `effectiveTo != null && effectiveTo <= now()`.
2. **Vai trò phân công hợp lệ:** Chỉ chấp nhận 4 loại vai trò phân công: `PRIMARY`, `SECONDARY`, `TEAM`, `RELIEF` (`TripExecutionService.java:30`).

### 5.3. Khoảng trống nghiệp vụ & Điểm cần làm rõ (Gaps & Requirements to Clarify)
1. **Khoảng cách giữa Stop Departure và Hoàn tất Chuyến xe:**
   - Trong `TripExecutionService.departStop`, hệ thống chỉ cập nhật `TripStop`, không tự động đánh giá để chuyển `Trip.status` sang `COMPLETED`.
   - Về phía API, backend có hỗ trợ `PUT /api/trips/{id}` nhận `status` và `expectedVersion` (`UpdateTripRequest.java:8-19`), tuy nhiên `TripMapper.java:27-38` không tự động gán `completedAt` khi chuyển sang `COMPLETED`.
   - Hiện hệ thống chưa có lệnh chuyên biệt (Command) như `POST /api/trips/{id}/complete` hay action hoàn tất trên UI.
   - **Lưu ý về cập nhật trạng thái Đơn hàng (`Load`):** Việc "stop cuối DEPARTED thì tự động chuyển tất cả Load sang DELIVERED" hiện **chưa có trong tài liệu đặc tả nghiệp vụ (REQUIREMENT_UNKNOWN)**. Trong mô hình chuyến xe gom nhiều đơn hàng (multi-load/consolidated), mỗi Load có điểm trả hàng (Delivery Stop) riêng; cần xác nhận quy tắc nghiệp vụ cập nhật Load status theo từng stop cụ thể trước khi triển khai tự động hóa.
2. **Thiếu kiểm tra xác thực vai trò Tài xế khi phân công (Driver Role Verification Gap):**
   - Tại `TripExecutionService.assignDriver` ([`TripExecutionService.java:38-60`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L38-L60)), hệ thống chỉ tìm kiếm `Employee` theo ID rồi gán vào chuyến xe, **hoàn toàn không kiểm tra xem nhân viên đó có thuộc vai trò DRIVER hay không**. Bất kỳ nhân viên nào trong bảng `employees` (kể cả kế toán hay nhân viên văn phòng) đều có thể bị gán làm tài xế lái xe.
   - Đồng thời, endpoint `/api/drivers` ([`EmployeeService.java:51-52`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/EmployeeService.java#L51-L52)) đang truyền `roleId=null`, khiến câu truy vấn trả về toàn bộ danh sách nhân viên thay vì chỉ lọc những người có role DRIVER.
3. **Kiểm tra xung đột phân công tài xế:**
   - `TripExecutionService.assignDriver` hiện chưa kiểm tra trùng lặp lịch trình hoặc trạng thái hiện tại của chuyến xe (`COMPLETED`, `CANCELLED`). Cần xác nhận quy tắc kiểm soát lịch trình của doanh nghiệp.

---

## 6. Phân quyền

### 6.1. Ma trận đối soát phân quyền Frontend & Backend

| Vai trò người dùng (JWT Role) | Quyền UI Trips (`roleMatrix.ts`) | Quyền thực thi Chặng dừng (`useCan`) | Quyền gọi API Trips (`SecurityConfig.java:123`) | Quyền xem Load Timeline (`SecurityConfig.java:122`) | Đánh giá an ninh & Trải nghiệm |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **ADMIN** | Toàn quyền (`DISPATCH`) | `canExecute = true` | Cho phép (`hasAnyRole`) | Cho phép | **HỢP LỆ:** Có thể xem và thực thi toàn bộ các thao tác chuyến xe. |
| **DISPATCHER** | Toàn quyền (`DISPATCH`) | `canExecute = true` | Cho phép (`hasAnyRole`) | Cho phép | **HỢP LỆ:** Vai trò vận hành chính của bàn điều phối. |
| **ACCOUNTANT** | **Bị từ chối** (`Forbidden`) | `canExecute = false` | **Bị chặn** (`403 Forbidden`) | **Cho phép** (`hasAnyRole`) | **HỢP LỆ & TÁCH BIỆT:** Kế toán bị từ chối truy cập phân hệ Chuyến xe (Trips) ở cả UI (`roleMatrix.ts:32`) và API backend (`SecurityConfig.java:123`), nhưng có quyền xem Đơn hàng (`/api/loads/**`) và xem Load Timeline. |
| **DRIVER** | Bị từ chối (`Forbidden`) | `canExecute = false` | Bị chặn (`403 Forbidden`) | Bị chặn (`403 Forbidden`) | **QUAN SÁT PHÂN QUYỀN (RISK-TE-02):** Backend chỉ cấp quyền cho `ADMIN` và `DISPATCHER`. Cần xác nhận chính sách nghiệp vụ xem tài xế có được tự thao tác chặng dừng hay không. |
| **PAYROLL / VIEWER** | Bị từ chối (`Forbidden`) | `canExecute = false` | Bị chặn (`403 Forbidden`) | Bị chặn (`403 Forbidden`) | **HỢP LỆ:** Không có quyền truy cập dữ liệu vận hành chuyến xe. |

### 6.2. Phân tích cơ chế Khóa tính năng (Capability Gating)
- Tại [`src/components/resources/resourceCapabilities.ts:21`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L21):
  ```typescript
  export const CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false;
  // ...
  trips: { create: true, delete: true, edit: CORE_VERSIONED_WRITES_RUNTIME_VERIFIED },
  ```
- Nút chỉnh sửa chuyến xe (`Edit`) bị ẩn trên toàn bộ giao diện bảng danh sách và trang chi tiết của Refine.

---

## 7. Test cases

| ID | Nhóm kiểm thử | Kịch bản kiểm thử | Thao tác kiểm định | Kết quả mong đợi | Trạng thái kiểm định & Bằng chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-TE-01** | UI Render | Render nút hành động Arrive khi stop chưa đến nơi | Kiểm tra giao diện stop ở trạng thái PENDING hoặc EN_ROUTE | UI hiển thị nút bấm "Arrive". | `UNIT_TEST_PASS` (UI Render)<br>Khớp [`TripStopActions.test.tsx:24-40`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L24-L40) (Test xác nhận nút Arrive xuất hiện; không có test click Arrive trong component suite). Hook test [`useTripStopActions.test.tsx:88-96`](file:///home/vumoi/logictics-app/src/tests/features/trips/useTripStopActions.test.tsx#L88-L96) kiểm tra endpoint `/api/trip-stops/stop-1/arrive` với mutation mock, không nối với click UI. |
| **TC-TE-02** | UI Render | Render các nút chuyển trạng thái Stop theo từng trạng thái | Kiểm tra nút tương ứng khi stop ở ARRIVED, SERVICE_STARTED, SERVICE_COMPLETED | UI render nút Start Service khi ARRIVED, Complete Service khi SERVICE_STARTED, Depart khi SERVICE_COMPLETED. | `UNIT_TEST_PASS` (UI Render)<br>Khớp [`TripStopActions.test.tsx:42-54`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L42-L54) (Start Service), [`:56-68`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L56-L68) (Complete Service), và [`:70-82`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L70-L82) (Depart). Hook test `:83-134` dùng mutation mock và không xác nhận chuyển trạng thái DB backend. |
| **TC-TE-03** | State Machine | Thử gọi transition sai thứ tự (vd: PENDING &rarr; DEPARTED) | Request vi phạm máy trạng thái | Backend ném ngoại lệ 400: *"cannot transition from X to Y"*. UI không hiển thị nút sai trạng thái. | `SOURCE_REVIEWED`<br>Khớp logic `requireStatus` tại [`TripExecutionService.java:143-148`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L143-L148). |
| **TC-TE-04** | Dwell Time | Tính toán Dwell Time khi stop có arrivedAt và departedAt | Stop có đủ `arrivedAt` và `departedAt` | Hệ thống tính Duration theo phút giữa 2 mốc thời gian. | `SOURCE_REVIEWED`<br>Khớp logic tính toán Duration tại [`TripExecutionService.java:171-176`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L171-L176). Test contract [`tripExecution.contract.test.ts:32-50`](file:///home/vumoi/logictics-app/src/tests/types/tripExecution.contract.test.ts#L32-L50) chỉ là fixture/model-shape coverage cho kiểu `TripStopExecution` (fixture gán `dwellMinutes: 0`), không kiểm tra type mapping hay xác nhận số phút tính ra. |
| **TC-TE-05** | Final State | Stop đã DEPARTED hiển thị nhãn Completed | Stop có trạng thái `DEPARTED` | Ẩn toàn bộ nút thao tác chuyển trạng thái, hiển thị tag xanh "Completed". | `UNIT_TEST_PASS` (UI Component)<br>Khớp [`TripStopActions.test.tsx:84-95`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L84-L95). |
| **TC-TE-06** | Driver Assignment | Gán tài xế mới với vai trò PRIMARY | Gọi action `assignDriver` với payload hợp lệ | Hook gửi POST tới `/api/trips/:tripId/drivers` và invalidate cache; backend lưu bản ghi phân công. | `UNIT_TEST_PASS` (Hook Mock) & `SOURCE_REVIEWED` (Backend)<br>Hook test: [`useTripDriverAssignments.test.tsx:82-112`](file:///home/vumoi/logictics-app/src/tests/features/trips/useTripDriverAssignments.test.tsx#L82-L112); Backend: `TripExecutionService.java:38-62`. |
| **TC-TE-07** | Driver Soft-close | Hủy phân công tài xế đang hoạt động | Bấm nút "Unassign" trên bảng tài xế | Gửi request POST tới endpoint `unassign` (không dùng HTTP DELETE); backend gán `effectiveTo = now()` để đóng phân công. | `UNIT_TEST_PASS` (Hook Mock) & `SOURCE_REVIEWED` (Backend)<br>Hook test: [`useTripDriverAssignments.test.tsx:114-136`](file:///home/vumoi/logictics-app/src/tests/features/trips/useTripDriverAssignments.test.tsx#L114-L136); Backend: `TripExecutionService.java:65-80`. |
| **TC-TE-08** | Validation Gap | Nhập text không phải UUID khi gán tài xế | Nhập text thô vào ô Driver UUID | Ô input không có client regex validation cho UUID. Gửi lên backend kiểu UUID dự kiến nhận 400 Bad Request (suy ra từ source binding `AssignDriverRequest.java:9-14` và `GlobalExceptionHandler.java:123-142`, chưa có runtime request thật). | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`TripDriverAssignments.tsx:238-257`](file:///home/vumoi/logictics-app/src/features/trips/components/TripDriverAssignments.tsx#L238-L257), `AssignDriverRequest.java:9-14` và `GlobalExceptionHandler.java:123-142`. |
| **TC-TE-09** | Concurrency Guard | Chống submit trùng lặp khi click liên tiếp | Bấm nút hành động khi đang trong trạng thái gửi | Hook sử dụng `isSubmittingRef.current` để khóa request trùng lặp trước khi mutation hoàn tất. | `SOURCE_REVIEWED`<br>Khớp logic guard tại [`useTripStopActions.ts:73-77`](file:///home/vumoi/logictics-app/src/features/trips/hooks/useTripStopActions.ts#L73-L77). *(Chưa có unit test mô phỏng kịch bản rapid-click đồng thời)*. |
| **TC-TE-10** | Empty State | Chuyến xe chưa có bất kỳ chặng dừng nào | Trip có `stops: []` | Hiển thị thẻ Card rỗng với thông báo "No stops recorded for this trip". | `SOURCE_REVIEWED`<br>Khớp khối render Empty tại [`TripStopsTimeline.tsx:79-90`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopsTimeline.tsx#L79-L90). |
| **TC-TE-11** | Permission | Người dùng không có quyền edit trips thao tác chuyển trạng thái | Giả lập `useCan` trả về `can = false` | Hook chặn mutation và thông báo lỗi cấm quyền; component ẩn nút thao tác. | `UNIT_TEST_PASS` (Hook & Component)<br>Khớp [`useTripStopActions.test.tsx:159-175`](file:///home/vumoi/logictics-app/src/tests/features/trips/useTripStopActions.test.tsx#L159-L175) và [`TripStopActions.test.tsx:142-151`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripStopActions.test.tsx#L142-L151). |
| **TC-TE-12** | Mileage Stats | Kiểm tra hiển thị dặm đường fallback | Component nhận props null/undefined | Hiển thị localized fallback text "Không khả dụng" thay vì hiển thị 0 mi. | `UNIT_TEST_PASS` (Component Level)<br>Khớp [`TripMileageSummary.test.tsx:22-48`](file:///home/vumoi/logictics-app/src/tests/features/trips/TripMileageSummary.test.tsx#L22-L48). Chuỗi tích hợp: `TripView` không có field &rarr; `TripShow` không truyền &rarr; component fallback. |
| **TC-TE-13** | Timeline Gap | Kiểm tra phát sinh sự kiện sau khi chuyển trạng thái stop | Hoàn tất Arrive và Depart tại Stop | Chuyển trạng thái stop không gọi `recordEvent()`; timeline chỉ rỗng khi không có event nào khác được lưu. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`TripExecutionService.java:93-126`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L93-L126) và `LoadTimelineService.java:33`. |
| **TC-TE-14** | Completion Gap | Chặng dừng cuối Departed kiểm tra trạng thái Trip | Depart chặng dừng cuối cùng | `TripExecutionService.departStop` chỉ cập nhật Stop, không tự động chuyển `trip.status` sang `COMPLETED`. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`TripExecutionService.java:120-126`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L120-L126). |
| **TC-TE-15** | Conflict Risk | Gán 1 tài xế vào 2 chuyến xe diễn ra đồng thời | Gán tài xế A vào Trip 1 và Trip 2 | Service hiện không có logic kiểm tra xung đột trùng lặp khoảng thời gian giữa các chuyến xe. | `SOURCE_REVIEWED`<br>Khớp quan sát mã nguồn tại [`TripExecutionService.java:38-62`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L38-L62). |
| **TC-TE-16** | Role Security | Tài xế (Role DRIVER) gọi API Arrive Stop | Gửi request có JWT của Driver tới `/api/trip-stops/{id}/arrive` | Backend chặn 403 Forbidden do `SecurityConfig.java:123` chỉ cho phép `ADMIN` và `DISPATCHER`. | `SOURCE_REVIEWED`<br>Khớp cấu hình tại [`SecurityConfig.java:123`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L123). |

---

## 8. Confirmed bugs & Khoảng cách kiến trúc

### BUG-TE-01: Các thao tác chuyển trạng thái Chặng dừng không phát sinh sự kiện vào Dòng thời gian Đơn hàng (Stop Transitions Do Not Emit Timeline Events)
- **Mã lỗi:** `BUG-TE-01`
- **Mức độ nghiêm trọng:** **P1** (High — Execution Tracking Gap)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:** 
  - Phân hệ bàn làm việc điều phối TMS ([`src/pages/tms-flow/DispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx)) tích hợp component `TmsTimeline.tsx` để giám sát tiến độ thực thi thực tế của các đơn hàng vận chuyển.
  - Phía backend, `LoadTimelineController.java:25` cung cấp endpoint `GET /api/loads/{loadId}/timeline` đọc dữ liệu từ `LoadEventRepository`.
  - Đối soát mã nguồn backend xác nhận: Trong `LoadTimelineService.java:33`, phương thức `recordEvent(UUID loadId, RecordLoadEventRequest req)` **hoàn toàn không được gọi bởi bất kỳ controller hoặc service nào trong toàn bộ mã nguồn backend Java production**.
  - Khi tài xế hoặc điều phối viên thực hiện các thao tác chuyển trạng thái chặng dừng (`arriveStop`, `startStopService`, `completeStopService`, `departStop` tại `TripExecutionService.java:93-126`), hệ thống chỉ cập nhật bảng `trip_stops` mà **hoàn toàn không ghi bất kỳ bản ghi nào vào bảng `load_events`**.
  - Hậu quả: Các hành động thực thi chặng dừng không phát sinh sự kiện nào vào dòng thời gian. Khi đơn hàng không có sự kiện nào khác được nạp trước đó, timeline sẽ hiển thị rỗng:
    - Bàn điều phối hiển thị nhãn: `"No timeline events for this load."` ([`DispatchPage.tsx:121-124`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx#L121-L124)).
    - Trang chi tiết đơn hàng hiển thị: `"No execution events recorded for this load."` ([`ShipmentDetailPage.tsx:261-264`](file:///home/vumoi/logictics-app/src/pages/tms-flow/ShipmentDetailPage.tsx#L261-L264)).
    - Mặc định của component hiển thị: `"No execution events recorded yet."` ([`TmsTimeline.tsx:13`](file:///home/vumoi/logictics-app/src/components/tms-flow/TmsTimeline.tsx#L13)).
- **Đối soát luồng mã nguồn:**
  1. `TripExecutionService.java:93-126`: Các hàm `arriveStop`, `startStopService`, `completeStopService`, `departStop` chỉ gọi `tripStopRepository.save(stop)`.
  2. `grep -rn "recordEvent"` trên backend chỉ trả về duy nhất định nghĩa method tại `LoadTimelineService.java:33`.
- **Đề xuất khắc phục & Cảnh báo an toàn trạng thái (Important Remediation Rule):**
  > [!WARNING]
  > **Không được làm hỏng trạng thái của Load khi ghi event!**  
  > Trong `LoadTimelineService.java:60-64`, phương thức có logic:
  > ```java
  > if (req.newStatus() != null && !req.newStatus().isBlank()) {
  >     load.setStatus(req.newStatus());
  >     loadRepository.save(load);
  > }
  > ```
  > Nếu gọi `recordEvent` và truyền trạng thái của stop (như `ARRIVED`, `SERVICE_STARTED`, `DEPARTED`) vào trường `req.newStatus()`, hệ thống sẽ **ghi đè sai trạng thái của Load** (vì Load có tập trạng thái riêng: `CREATED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`...).  
  > **Giải pháp đúng:** Khi phát hành sự kiện từ stop transition, trường `newStatus` trong `RecordLoadEventRequest` phải để `null` (hoặc giữ nguyên trạng thái hiện tại của Load), chỉ ghi nhận `eventType` (ví dụ: `"STOP_ARRIVED"`, `"STOP_DEPARTED"`), vị trí và `note`. Việc chuyển trạng thái Load chỉ được thực hiện khi có quy tắc nghiệp vụ rõ ràng theo từng loại stop (Pickup/Delivery).

---

### BUG-TE-02: Thiếu lệnh chuyên biệt (Command) và cơ chế tự động hoàn tất Chuyến xe khi rời trạm cuối
- **Mã lỗi:** `BUG-TE-02`
- **Mức độ nghiêm trọng:** **P1** (High — Lifecycle Command & Automation Gap)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:**
  - Trong `TripExecutionService.departStop` ([`TripExecutionService.java:120-126`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L120-L126)), khi chặng dừng cuối cùng chuyển sang `DEPARTED`, hệ thống chỉ lưu `stop.setStatus("DEPARTED")` và `stop.setDepartedAt(now)`.
  - Thực thể chuyến xe cha (`Trip`) hoàn toàn không được tự động cập nhật: `trip.status` giữ nguyên trạng thái cũ, trường `trip.completedAt` vẫn là `NULL`.
  - Về phía API: Backend có hỗ trợ endpoint cập nhật chuyến xe `PUT /api/trips/{id}` (`TripController.java:67-75`), DTO `UpdateTripRequest.java:8-19` có nhận `expectedVersion` và trường `status`. Tuy nhiên, mapper `TripMapper.java:27-38` chỉ map `name`, `truck`, `totalDistance`, `status` mà **bỏ qua trường `completedAt`**, khiến mốc thời gian hoàn thành không được tự động thiết lập.
  - Về phía giao diện: Trên trang chi tiết [`TripShow.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx), **hoàn toàn không có nút hành động chuyên biệt nào để hoàn thành chuyến xe** (như "Complete Trip"). Đồng thời, route chỉnh sửa `/trips/edit/:id` lại đang bị khóa bởi capability gate `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false` ([`resourceCapabilities.ts:21`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L21)).
  - **Lưu ý nghiệp vụ về trạng thái Đơn hàng (`Load`):** Việc tự động chuyển trạng thái Load sang `DELIVERED` khi chuyến xe kết thúc hiện **chưa có đặc tả nghiệp vụ xác nhận (REQUIREMENT_UNKNOWN)**. Đối với các chuyến xe gom nhiều đơn hàng, mỗi đơn hàng có điểm trả hàng riêng, việc cập nhật trạng thái Load cần được xác định theo từng stop cụ thể thay vì chuyển hàng loạt.
- **Đề xuất sửa:**
  1. Bổ sung endpoint command chuyên biệt: `POST /api/trips/{id}/complete` để cập nhật `trip.status = COMPLETED` và `completedAt = OffsetDateTime.now()`.
  2. Bổ sung nút hành động "Complete Trip" trên header [`TripShow.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx) khi tất cả các chặng dừng đã ở trạng thái `DEPARTED`.
  3. Xác nhận với Product Owner về quy tắc tự động hoàn tất và quy tắc luân chuyển trạng thái cho các đơn hàng liên kết.

---

### GAP-TE-03: Khoảng cách hợp đồng dữ liệu & Thiếu logic ghi nhận 4 chỉ số Dặm đường (Trip Mileage Data Contract & Population Gap)
- **Mã vấn đề:** `GAP-TE-03`
- **Mức độ nghiêm trọng:** **P2** (Medium — Data Contract & Feature Gap)
- **Phân loại:** `DATA_CONTRACT_GAP`
- **Mô tả:**
  - Component `TripMileageSummary.tsx` ([`src/features/trips/components/TripMileageSummary.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripMileageSummary.tsx)) được thiết kế để hiển thị 4 chỉ số dặm đường: *Planned Distance, Actual Distance, Loaded Miles, Empty Miles (Deadhead)*.
  - Tuy nhiên, trong [`TripShow.tsx:157-159`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx#L157-L159), component này chỉ được truyền duy nhất 1 prop:
    ```tsx
    <TripMileageSummary legacyTotalDistance={trip.totalDistance} />
    ```
  - Backend DTO `TripView.java` ([`TripView.java:8-20`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/trip/TripView.java#L8-L20)) hoàn toàn không có 4 trường này.
  - **Quan sát mã nguồn backend:** Mặc dù entity `Trip.java:62-72` có khai báo 4 cột (`plannedDistanceMiles`, `actualDistanceMiles`, `loadedMiles`, `emptyMiles`), trong toàn bộ mã nguồn backend Java production **không có bất kỳ service nào tính toán hay gọi setter để ghi dữ liệu vào 4 trường này**.
  - Do đó, việc chỉ bổ sung 4 trường vào DTO `TripView` là chưa đủ để giải quyết vấn đề hiển thị, vì cơ sở dữ liệu hiện tại chưa có nguồn nạp dữ liệu cho các chỉ số này.
- **Đề xuất khắc phục:**
  1. Xác định tiêu chí nghiệm thu (Acceptance Criteria) và nguồn tính toán các chỉ số dặm đường (ví dụ: tích hợp OSRM/Google Maps Distance Matrix cho planned distance, đối soát GPS telemetry cho actual/loaded/empty miles).
  2. Xây dựng logic ghi/cập nhật 4 chỉ số này trong `TripService` hoặc `TripExecutionService`.
  3. Cập nhật record `TripView.java`, type `TripResponse` và truyền đầy đủ props vào `TripMileageSummary` trong `TripShow.tsx`.

---

### GAP-TE-04: Ô nhập phân công tài xế là Text thô, thiếu Driver Selector và thiếu Client Validation (UX & Validation Gap)
- **Mã vấn đề:** `GAP-TE-04`
- **Mức độ nghiêm trọng:** **P2** (Medium — UX & Client Validation Gap)
- **Phân loại:** `UX_VALIDATION_GAP`
- **Mô tả:**
  - Trong hộp thoại phân công tài xế ([`TripDriverAssignments.tsx:238-257`](file:///home/vumoi/logictics-app/src/features/trips/components/TripDriverAssignments.tsx#L238-L257)), trường `driverId` được thiết kế dưới dạng ô `<Input placeholder="Enter driver ID (UUID)" />` thô.
  - Form chỉ có rule `{ required: true }`, hoàn toàn không có regex kiểm tra định dạng UUID ở phía client. Trong khi đó, backend DTO `AssignDriverRequest.java:9-14` yêu cầu trường `driverId` kiểu `UUID`.
  - Chưa có tiêu chí sản phẩm (PRD) chính thức yêu cầu bắt buộc có Select dropdown hay regex client. Tuy nhiên, việc yêu cầu điều phối viên tự tra cứu và nhập thủ công chuỗi UUID 36 ký tự mang lại trải nghiệm người dùng kém và tiềm ẩn rủi ro phát sinh lỗi 400 Bad Request từ server nếu nhập sai định dạng.
- **Đề xuất cải tiến:** Thay thế thẻ `<Input>` bằng component `<Select>` hỗ trợ tìm kiếm tài xế; bổ sung regex validation UUID nếu giữ ô input. *(Lưu ý: Nguồn dữ liệu chọn tài xế cần đối soát cùng `GAP-TE-05` dưới đây trước khi triển khai)*.

---

### GAP-TE-05: API danh sách Driver và logic gán Driver không xác thực vai trò DRIVER của nhân viên (Driver Role Verification Gap)
- **Mã vấn đề:** `GAP-TE-05`
- **Mức độ nghiêm trọng:** **P2** (Medium — Business Integrity & Role Verification Gap)
- **Phân loại:** `BUSINESS_INTEGRITY_GAP`
- **Mô tả:**
  - Trong backend, endpoint `/api/drivers` ([`DriverController.java:29-40`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/DriverController.java#L29-L40)) gọi `EmployeeService.searchDrivers` ([`EmployeeService.java:44-52`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/EmployeeService.java#L44-L52)). Mặc dù JavaDoc/comment ghi rõ *"filter by role name = DRIVER"*, method này lại truyền `roleId = null` vào `employeeRepository.search(...)`. Do câu query JPQL tại [`EmployeeRepository.java:37`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/repository/EmployeeRepository.java#L37) có điều kiện `(:roleId IS NULL OR e.role.id = :roleId)`, khi `roleId` null nó bỏ qua hoàn toàn việc lọc role. Hậu quả là endpoint `/api/drivers` hiện có thể trả về **toàn bộ nhân viên của công ty** (kể cả kế toán, giám đốc, nhân sự).
  - Tương tự, tại `TripExecutionService.assignDriver` ([`TripExecutionService.java:38-60`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L38-L60)), hệ thống chỉ tìm `Employee` theo ID rồi lưu assignment, **hoàn toàn không kiểm tra xem Employee có vai trò là tài xế (`DRIVER`) hay không**. Khóa ngoại trong database (`V2__create_trip_driver_assignments.sql:17-20`) cũng chỉ tham chiếu chung tới bảng `employees`. Bất kỳ nhân viên nào trong tenant đều có thể bị gán làm tài xế cho chuyến xe.
  - **Cảnh báo về nguồn dữ liệu UI:** Đề xuất sử dụng `/api/drivers` để làm nguồn dữ liệu cho Select dropdown ở frontend là **chưa an toàn** cho tới khi endpoint `/api/drivers` thực sự được sửa để lọc đúng role DRIVER và backend `assignDriver` có validation kiểm tra vai trò tài xế.
- **Đề xuất khắc phục:**
  1. Trong `EmployeeService.searchDrivers`, tìm Role có code/name là `DRIVER` và truyền `roleId` tương ứng vào `employeeRepository.search`.
  2. Trong `TripExecutionService.assignDriver`, bổ sung kiểm tra: Nếu `driver.getRole()` không phải là role tài xế, ném ngoại lệ 400 Bad Request: *"Employee X is not a qualified driver"*.

---

## 9. Unverified risks

### RISK-TE-01: Cho phép phân công tài xế trùng lịch hoặc gán vào chuyến xe đã kết thúc
- **Mã nguy cơ:** `RISK-TE-01`
- **Mức độ rủi ro:** **P2** (Medium — Resource Overbooking / State Inconsistency)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trong phương thức `TripExecutionService.assignDriver` ([`TripExecutionService.java:38-62`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L38-L62)):
  - Hệ thống chỉ kiểm tra sự tồn tại của Trip và Driver. Hoàn toàn không kiểm tra trạng thái của chuyến xe (`trip.getStatus()`). Người dùng có thể gửi request gán tài xế vào một chuyến xe đã ở trạng thái `COMPLETED` hoặc `CANCELLED`.
  - Hệ thống chưa có logic kiểm tra xung đột thời gian (`overlapping check`) với các chuyến xe khác mà tài xế đang đảm nhiệm.
  - *Lưu ý:* Đây là quan sát từ phân tích mã nguồn tĩnh (Source Observation). Cần xác nhận quy tắc kiểm soát lịch trình của doanh nghiệp trước khi thiết lập logic chặn cứng.

### RISK-TE-02: Phân quyền API Backend giới hạn cho ADMIN và DISPATCHER đối với các thao tác Chặng dừng
- **Mã nguy cơ:** `RISK-TE-02`
- **Mức độ rủi ro:** **P2** (Medium — Security & Authorization Policy Gap)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trong [`SecurityConfig.java:123`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L123), quy tắc bảo vệ endpoint được cấu hình:
  ```java
  .requestMatchers("/api/trips/**", "/api/trip-stops/**").hasAnyRole("ADMIN", "DISPATCHER")
  ```
  Nếu hệ thống định hướng tài xế thực tế (Role `DRIVER`) tự thao tác Arrive/Depart trên ứng dụng di động, request gửi tới `/api/trip-stops/{id}/*` sẽ bị Spring Security từ chối với mã lỗi `403 Forbidden`. Tuy nhiên, nếu quy trình nghiệp vụ quy định chỉ Điều phối viên mới có quyền cập nhật tiến trình chuyến xe, cấu hình hiện tại là đúng.
- **Khuyến nghị:** Cần xác nhận chính sách phân quyền (Authorization Policy) chính thức từ bộ phận nghiệp vụ trước khi quyết định có mở quyền cho role `DRIVER` hay không.

### RISK-TE-03: Không kiểm soát thứ tự thực hiện giữa các Chặng dừng độc lập trong Chuyến xe
- **Mã nguy cơ:** `RISK-TE-03`
- **Mức độ rủi ro:** **P3** (Low — Sequential Integrity)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Phương thức `arriveStop`, `startStopService`, `departStop` chỉ kiểm tra máy trạng thái của riêng từng chặng dừng (`requireStatus(stop, ...)`). Backend hoàn toàn không kiểm tra thứ tự thực hiện giữa các chặng dừng theo trường `order`. Điều này tiềm ẩn nguy cơ thao tác nhầm Chặng dừng #2 trước Chặng dừng #1 nếu người dùng không tuân thủ quy trình.

---

## 10. Missing functionality

> [!NOTE]
> **Định vị phạm vi & Đề xuất hoàn thiện chức năng:**  
> Các tính năng dưới đây là thành phần nghiệp vụ cốt lõi của phân hệ Quản lý & Thực thi Chuyến xe trong TMS nhưng hiện chưa được xây dựng hoặc đang bị khóa:

1. **`[NOT_IMPLEMENTED]` Không có API và UI để Thêm/Tạo Chặng dừng mới (Add Trip Stop):**  
   Backend `TripExecutionController` chỉ cung cấp `GET /trips/{id}/stops` và các hành động chuyển trạng thái chặng. Hoàn toàn không có endpoint `POST /api/trips/{id}/stops` hoặc `POST /api/trip-stops`. Khi tạo một chuyến xe mới qua `/trips/create`, chuyến xe được lưu với 0 chặng dừng và không có cách nào bổ sung chặng dừng cho chuyến xe đó qua giao diện.
2. **`[NOT_IMPLEMENTED]` Endpoint Tính phí lưu xe (Detention Calculation) chưa được kết nối lên UI:**  
   Backend đã phát triển sẵn API tính phí lưu xe khi dừng quá giờ quy định: `POST /api/trip-stops/{stopId}/calculate-detention` ([`AccessorialController.java:52`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/AccessorialController.java#L52)). Tuy nhiên, trên giao diện `TripStopsTimeline.tsx` và `TripStopActions.tsx`, hoàn toàn không có nút bấm, modal hay bất kỳ luồng xử lý nào kết nối đến API này.
3. **`[FEATURE_GATED]` Chức năng Chỉnh sửa Chuyến xe (`trips.edit`) bị khóa ở tầng Runtime:**  
   Thuộc tính `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false` tại `resourceCapabilities.ts:21` khiến tính năng cập nhật thông tin chuyến xe bị vô hiệu hóa trên toàn bộ hệ thống frontend Refine.

---

## 11. Integration issues

1. **Ngắt kết nối giữa Thực thi Chặng dừng (Trip Execution) và Dòng thời gian Đơn hàng (Load Timeline):**  
   Mô hình dữ liệu có thực thể `LoadEvent` liên kết với cả `Load`, `Trip` và `TripStop`. Tuy nhiên, phân hệ thực thi chuyến xe hoàn toàn không phát sinh sự kiện nào vào dòng thời gian. Khi hàng hóa đang vận chuyển, nhân viên điều phối theo dõi đơn hàng tại bàn điều phối TMS vẫn thấy dòng thời gian rỗng nếu không có nguồn sự kiện nào khác nạp trước đó.
2. **Thiếu cơ chế đồng bộ trạng thái giữa Chuyến xe và Đơn hàng con:**  
   Một chuyến xe (`Trip`) chứa các chặng dừng phục vụ các đơn hàng (`Load`). Hiện chưa có đặc tả nghiệp vụ và chưa có mã nguồn tự động cập nhật trạng thái đơn hàng tương ứng theo tiến trình từng chặng dừng (ví dụ: Pickup departed &rarr; Load status `IN_TRANSIT`; Delivery departed &rarr; Load status `DELIVERED`).

---

## 12. Test execution evidence

Đã thực thi kiểm tra toàn bộ các bộ test tự động liên quan đến Trips, Trip Execution và Contract Models trong phiên làm việc:

```bash
# 1. Kiểm tra Unit & Component Test cho phân hệ Trips & Trip Execution
$ npx vitest run src/tests/pages/trips/ src/tests/features/trips/ src/tests/types/trip*
Test Files  8 passed (8)
     Tests  34 passed (34)
  Duration  7.03s
Exit code: 0 (PASS)

# Chi tiết các test suite đã vượt qua:
✓ src/tests/types/trip.contract.test.ts (2 tests pass)
✓ src/tests/types/tripExecution.contract.test.ts (3 tests pass)
✓ src/tests/features/trips/TripMileageSummary.test.tsx (3 tests pass)
✓ src/tests/features/trips/TripStopActions.test.tsx (9 tests pass)
✓ src/tests/features/trips/tripColumns.test.tsx (5 tests pass)
✓ src/tests/features/trips/useTripDriverAssignments.test.tsx (4 tests pass)
✓ src/tests/features/trips/useTripStopActions.test.tsx (5 tests pass)
✓ src/tests/pages/trips/TripShow.test.tsx (3 tests pass)

# 2. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - 0 lỗi compile)

# 3. Kiểm tra định dạng Diff Git
$ git diff --check
Exit code: 0 (PASS - Không vi phạm whitespace/formatting)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Ghi nhận bằng chứng:**  
> - Các test case `UNIT_TEST_PASS` được kiểm chứng bởi 34 unit và component test cases chạy tự động bằng Vitest trong phiên làm việc trên **tầng giao diện và hook với dữ liệu mock**.  
> - Các kết quả chạy test tự động trên được cung cấp từ việc chạy Vitest trong môi trường hiện tại, không thay thế cho kiểm thử tích hợp backend live.  
> - **Chưa có kiểm thử tích hợp Runtime/Backend Live (Live Backend Integration):** Chưa kiểm thử thực tế trên server live cho các hành vi: persistence vào DB, tính toán dwell thực tế trên server, ma trận phân quyền thực tế qua Spring Security, và kiểm tra xung đột phân công tài xế.  
> - **E2E Playwright:** `BLOCKED` do phiên làm việc không chạy môi trường backend Spring Boot live cục bộ.  
> - **Live Mutation:** `NOT_TESTED` trên cơ sở dữ liệu production nhằm tuân thủ quy tắc an toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-TE-01` | Event Gap | **Tích hợp phát sinh sự kiện vào Load Timeline (An toàn trạng thái):** Trong `TripExecutionService.java`, tại các hàm `arriveStop`, `startStopService`, `completeStopService`, `departStop`, gọi `loadTimelineService.recordEvent(...)` khi chặng dừng có liên kết với đơn hàng (`stop.getLoad() != null`). **Lưu ý:** Để `req.newStatus() = null` để tránh ghi đè sai trạng thái của Load. | `.../service/TripExecutionService.java:93-126`<br>`.../service/LoadTimelineService.java:33` |
| **P1** | `BUG-TE-02` | Command Gap | **Xây dựng lệnh và nút hoàn tất Chuyến xe:** Xây dựng endpoint command chuyên biệt `POST /api/trips/{id}/complete` cập nhật `status = COMPLETED` và `completedAt = now()`. Bổ sung nút "Complete Trip" trên header `TripShow.tsx` khi toàn bộ chặng dừng đã DEPARTED. Làm rõ đặc tả nghiệp vụ về tự động hóa và cập nhật trạng thái Load. | `.../controller/TripController.java`<br>`.../service/TripService.java`<br>[`src/pages/trips/show.tsx:140`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx#L140) |
| **P2** | `GAP-TE-05` | Integrity / Validation | **Xác thực vai trò DRIVER khi tìm kiếm và phân công:** Sửa `EmployeeService.searchDrivers` để truyền `roleId` của role DRIVER; bổ sung validation trong `TripExecutionService.assignDriver` kiểm tra nhân viên phải có vai trò DRIVER trước khi cho phép gán. | `.../service/EmployeeService.java:44-53`<br>`.../service/TripExecutionService.java:38-60` |
| **P2** | `GAP-TE-03` | Data Contract | **Xây dựng nguồn tính toán và expose 4 chỉ số Dặm đường:** Xác định acceptance criteria cho dặm đường (planned, actual, loaded, empty); xây dựng logic ghi nhận vào entity `Trip`; bổ sung 4 trường vào DTO `TripView.java` và truyền props vào `TripMileageSummary` trong `TripShow.tsx`. | `.../entity/Trip.java:62-72`<br>`.../dto/trip/TripView.java:8-20`<br>[`src/pages/trips/show.tsx:157`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx#L157) |
| **P2** | `GAP-TE-04` | UX / Validation | **Cải tiến hộp thoại gán tài xế sang Driver Selector an toàn:** Sau khi xử lý `GAP-TE-05`, thay thế ô input raw UUID bằng component Select dropdown tìm kiếm tài xế đã được lọc role DRIVER; bổ sung validate regex UUID ở client. | [`src/features/trips/components/TripDriverAssignments.tsx:238`](file:///home/vumoi/logictics-app/src/features/trips/components/TripDriverAssignments.tsx#L238) |
| **P2** | `RISK-TE-02` | Policy Gap | **Làm rõ chính sách phân quyền cho vai trò DRIVER:** Xác định yêu cầu nghiệp vụ xem tài xế có được tự cập nhật chặng dừng trên app hay không trước khi quyết định điều chỉnh `SecurityConfig.java:123`. | `.../config/SecurityConfig.java:123` |
| **P2** | `RISK-TE-01` | Business Integrity | **Kiểm tra xung đột lịch trình tài xế:** Làm rõ quy tắc nghiệp vụ về kiểm soát lịch trình; bổ sung logic chặn gán tài xế vào chuyến xe đã kết thúc hoặc bị hủy trong `TripExecutionService.assignDriver`. | `.../service/TripExecutionService.java:38-62` |
| **P3** | `NOT_IMPLEMENTED` | Feature Gap | **Xây dựng API & UI thêm Chặng dừng cho Trip:** Bổ sung endpoint `POST /api/trips/{id}/stops` và giao diện thêm điểm dừng trên màn hình chi tiết chuyến xe. | `.../controller/TripExecutionController.java`<br>[`src/features/trips/components/TripStopsTimeline.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopsTimeline.tsx) |
| **P3** | `NOT_IMPLEMENTED` | Feature Gap | **Nối API tính phí lưu xe (Detention) lên UI:** Tích hợp nút "Calculate Detention" tại thẻ chặng dừng đã có `dwellMinutes` vượt mức miễn phí để gọi endpoint `/api/trip-stops/{id}/calculate-detention`. | [`src/features/trips/components/TripStopsTimeline.tsx:192`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopsTimeline.tsx#L192) |
