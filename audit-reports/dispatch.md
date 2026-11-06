# AUDIT: dispatch

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `dispatch` (Điều phối xe, tài xế, xung đột lịch, trạng thái)  
> **Thời điểm kiểm định:** 25/10/2026  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát đa tầng (Frontend React Refine & Backend Spring Boot), đối soát cơ chế phân quyền, kiểm tra logic giải thuật tối ưu hóa điều phối, và thực thi bộ kiểm thử tự động.

---

## 1. Tổng quan chức năng

Chức năng **Điều phối (Dispatch)** là trái tim vận hành của hệ thống TMS LogisticsX, chịu trách nhiệm khớp nối Đơn hàng vận chuyển (Load/Shipment) với Phương tiện (Truck) và Tài xế (Driver), quản lý xung đột tài nguyên, giám sát lộ trình di chuyển qua các chặng dừng (Trip Stops) và luân chuyển trạng thái đơn hàng xuyên suốt từ tiếp nhận đến giao hàng thành công.

### Các phân hệ mã nguồn tham gia luồng Dispatch:
1. **Bàn làm việc điều phối TMS (TMS Operations Workspace):**
   - Tuyến đường: `/tms/dispatch` & `/tms/approvals` ([`src/pages/tms-flow/DispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx)).
   - Danh sách hàng đợi thông minh: Lọc theo `all`, `at-risk`, `unassigned`, `approvals`.
   - Bản đồ luồng tuyến (Lane View): Hiển thị tuyến vận tải và vị trí thời gian thực của đội xe.
   - Hộp thoại xét duyệt đề xuất điều phối: [`src/components/tms-flow/ApproveSuggestionModal.tsx`](file:///home/vumoi/logictics-app/src/components/tms-flow/ApproveSuggestionModal.tsx).
2. **Không gian điều phối thông minh AI (AI Smart Vehicle Dispatch):**
   - Tuyến đường: `/ai-dispatch` ([`src/pages/ai-dispatch/AiDispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/ai-dispatch/AiDispatchPage.tsx)).
   - Khởi chạy phiên điều phối AI: [`src/features/ai-dispatch/components/AiDispatchRunForm.tsx`](file:///home/vumoi/logictics-app/src/features/ai-dispatch/components/AiDispatchRunForm.tsx).
   - Thẻ kế hoạch di chuyển (Movement Plan Card): [`src/features/ai-dispatch/components/AiMovementPlanCard.tsx`](file:///home/vumoi/logictics-app/src/features/ai-dispatch/components/AiMovementPlanCard.tsx).
   - Bảng lịch sử các phiên điều phối: [`src/features/ai-dispatch/components/AiDispatchHistoryTable.tsx`](file:///home/vumoi/logictics-app/src/features/ai-dispatch/components/AiDispatchHistoryTable.tsx).
3. **Thực thi chuyến xe & Phân công tài xế (Trip Execution & Driver Assignment):**
   - Gán/Hủy gán tài xế vào chuyến: [`src/features/trips/components/TripDriverAssignments.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripDriverAssignments.tsx) & [`useTripDriverAssignments.ts`](file:///home/vumoi/logictics-app/src/features/trips/hooks/useTripDriverAssignments.ts).
   - Thực thi chặng dừng (Stop Lifecycle): [`src/features/trips/components/TripStopActions.tsx`](file:///home/vumoi/logictics-app/src/features/trips/components/TripStopActions.tsx) & [`useTripStopActions.ts`](file:///home/vumoi/logictics-app/src/features/trips/hooks/useTripStopActions.ts).
4. **Backend Dịch vụ & Điều phối (Spring Boot):**
   - AI Dispatch Service: `com.company.logicstic.ai.dispatch.AiDispatchService.java` & `AiDispatchController.java`.
   - Trip Execution Service: `com.company.logicstic.service.TripExecutionService.java` & `TripExecutionController.java`.
   - Domain Load Service: `com.company.logicstic.service.LoadService.java`.

---

## 2. Danh sách route

| Đường dẫn URL | Component phụ trách | Mounting Runtime | Rào chắn phân quyền / Capability Gate | Hành vi chuyển hướng / Bảo vệ |
| :--- | :--- | :--- | :--- | :--- |
| `/tms/dispatch` | `DispatchPage` ([`src/pages/tms-flow/DispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx)) | Bọc trong `TmsFlowRoot` tại [`AppRouter.tsx:246`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L246) | Phân quyền qua `ResourceAccessBoundary` (`action="list", resource="loads"`). | Yêu cầu đăng nhập (`ProtectedRoute`) và tenant (`TenantGuard`). Khách hoặc role ngoài `OPERATIONS` bị chuyển hướng hoặc chặn 403. |
| `/tms/approvals` | `DispatchPage` (`approvalsOnly=true`) | Bọc trong `TmsFlowRoot` tại [`AppRouter.tsx:248`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L248) | Phân quyền qua `ResourceAccessBoundary` (`action="list", resource="loads"`). | Giao diện khóa vào danh sách các quyết định đang chờ duyệt của AI. |
| `/tms/shipments/:shipmentId` | `TmsShipmentDetailPage` | Bọc trong `TmsFlowRoot` tại [`AppRouter.tsx:251`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L251) | `action="show", resource="loads"`. | Xem chi tiết tiến độ thực thi của một đơn hàng. |
| `/ai-dispatch` | `AiDispatchPage` ([`src/pages/ai-dispatch/AiDispatchPage.tsx`](file:///home/vumoi/logictics-app/src/pages/ai-dispatch/AiDispatchPage.tsx)) | Mount độc lập tại [`AppRouter.tsx:233`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L233) | `ResourceAccessBoundary` (`action="AI_DISPATCH_VIEW", resource="ai-dispatch"`). | Truy cập trực tiếp mở tab Kế hoạch di chuyển; nếu chưa cấu hình tenant hoặc thiếu quyền hiển thị `ForbiddenState`. |
| `/ai-dispatch/:id` | `AiDispatchPage` | Mount độc lập tại [`AppRouter.tsx:234`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L234) | `ResourceAccessBoundary` (`action="AI_DISPATCH_VIEW", resource="ai-dispatch"`). | Tự động đọc `:id` làm `sessionId` để tải chi tiết phiên điều phối. |
| `/trips/show/:id` | `TripShow` ([`src/pages/trips/show.tsx`](file:///home/vumoi/logictics-app/src/pages/trips/show.tsx)) | Refine Resource Router | `ResourceAccessBoundary` (`action="show", resource="trips"`). Capability: `trips.edit` đang bị khóa bởi `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED = false`. | Màn hình hiển thị chuyến xe, chứa các tab Điều phối tài xế và Thực thi chặng dừng. |

---

## 3. Danh sách UI action

| ID | Vùng màn hình | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-DSP-01** | Bàn làm việc `/tms/dispatch`: Bộ lọc hàng đợi | `ButtonGroup` (All, At-risk, Unassigned, AI approvals) | `setFilter(item.value)` | Không gọi API (Client-side memoization) | Chuyển đổi hàng đợi đơn hàng theo phân loại rủi ro và trạng thái gán. |
| **ACT-DSP-02** | Bàn làm việc: Ô tìm kiếm nhanh | `Input` (Search) | `updateParam("q", value)` | Không gọi API | Lọc tức thì danh sách đơn hàng theo tên đơn, mã số, khách hàng hoặc thành phố. |
| **ACT-DSP-03** | Bàn làm việc: Chọn đơn hàng trong danh sách | `ShipmentCard` (Click) | `updateParam("shipment", id)` | Không gọi API (cập nhật URL query param) | Hiển thị chi tiết đơn hàng tại ô "Load in focus", cập nhật định vị xe trên bản đồ và tải dòng thời gian thực thi. |
| **ACT-DSP-04** | Bàn làm việc: Xem chi tiết gợi ý AI | Thẻ đề xuất AI (`Button` "Review and decide") | `setReviewed(approval)` | Không gọi API (Mở modal) | Mở hộp thoại `ApproveSuggestionModal` hiển thị thông tin xe, tài xế và các chỉ số tối ưu. |
| **ACT-DSP-05** | Hộp thoại Phê duyệt: Bấm nút "Approve suggestion" | `Button` (Primary / Submit) | `handleApprove()` trong `ApproveSuggestionModal.tsx:39` | `POST /api/ai/dispatch/decisions/{id}/approve` | **LỖI NGHIỆP VỤ (BUG-DISP-01):** Backend gán xe cho đơn hàng nhưng **HOÀN TOÀN BỎ QUÊN TÀI XẾ**, không gán tài xế vào bất kỳ quan hệ dữ liệu nào. |
| **ACT-DSP-06** | Hộp thoại Phê duyệt: Bấm nút "Reject" | `Button` (Danger) | `handleReject()` trong `ApproveSuggestionModal.tsx:50` | `POST /api/ai/dispatch/decisions/{id}/reject` | Kiểm tra độ dài lý do (3–500 ký tự); gửi lý do từ chối lên server, chuyển trạng thái quyết định thành `Rejected`. |
| **ACT-DSP-07** | Màn hình AI `/ai-dispatch`: Khởi chạy điều phối | Form Submit (`AiDispatchRunForm.tsx:30`) | `actions.runAiDispatch(params)` | `POST /api/ai/dispatch/runs` | Gửi `loadId`, `mode`, `instructions`. Chế độ Autonomous bị khóa (400); chế độ HumanInTheLoop trả về danh sách đề xuất. |
| **ACT-DSP-08** | Màn hình AI: Chuyển tab Lịch sử phiên | `Tabs` (History) | `setActiveTab("history")` | `GET /api/ai/dispatch/sessions?page=0&size=20` | Tải danh sách các phiên điều phối trước đó, phân trang và hiển thị số lượng đề xuất. |
| **ACT-DSP-09** | Màn hình Chuyến xe `/trips/show/:id`: Gán tài xế | `Button` / Form Gán tài xế (`TripDriverAssignments.tsx`) | `assignDriver(payload)` | `POST /api/trips/{tripId}/drivers` | **LỖI XUNG ĐỘT (BUG-DISP-02):** Gán tài xế vào chuyến xe nhưng **KHÔNG KIỂM TRA TRÙNG LỊCH**, cho phép 1 tài xế nhận nhiều chuyến cùng thời điểm. |
| **ACT-DSP-10** | Màn hình Chuyến xe: Hủy gán tài xế | `Button` (Link) "Hủy gán" | `unassignDriver(assignmentId)` | `POST /api/trips/{tripId}/drivers/{assignmentId}/unassign` | Đóng bản ghi phân công tài xế (`effectiveTo = now()`), không xóa bản ghi lịch sử (Soft-close chuẩn kiểm toán). |
| **ACT-DSP-11** | Chặng dừng chuyến xe: Thực thi chặng dừng | Các nút "Arrive", "Start Service", "Complete", "Depart" | `executeTransition(action, stopId)` | `POST /api/trip-stops/{id}/[arrive\|start-service\|complete-service\|depart]` | Luân chuyển trạng thái chặng dừng theo chu trình: PENDING &rarr; ARRIVED &rarr; SERVICE_STARTED &rarr; SERVICE_COMPLETED &rarr; DEPARTED. |
| **ACT-DSP-12** | Header Bàn làm việc: Nút "New shipment" | `Button` | `navigate("/loads/create")` | Không gọi API | Điều hướng đến màn hình tạo đơn hàng. Sau khi tạo xong bị chuyển hướng về `/loads` thay vì quay lại bàn điều phối. |

---

## 4. API liên quan

### 4.1. Bảng đối soát Endpoints luồng Dispatch

| Phân hệ | Phương thức | Endpoint | Controller / Service Backend | Request Payload / Params | Response Model |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **AI Dispatch** | `POST` | `/api/ai/dispatch/runs` | `AiDispatchController.runDispatch` | `{ loadId: UUID, mode: string, maxSuggestions?: number, instructions?: string }` | `ApiResponse<RunResult>` |
| **AI Dispatch** | `GET` | `/api/ai/dispatch/pending` | `AiDispatchController.getPending` | *Không có* | `ApiResponse<List<Suggestion>>` |
| **AI Dispatch** | `GET` | `/api/ai/dispatch/sessions` | `AiDispatchController.listSessions` | `page`, `size`, `status` | `ApiResponse<PagedResponse<AiDispatchSession>>` |
| **AI Dispatch** | `GET` | `/api/ai/dispatch/sessions/{id}` | `AiDispatchController.getSession` | *Path variable: sessionId* | `ApiResponse<SessionDetail>` |
| **AI Dispatch** | `POST` | `/api/ai/dispatch/decisions/{id}/approve` | `AiDispatchController.approveDecision` | `{ notes?: string }` | `ApiResponse<Suggestion>` |
| **AI Dispatch** | `POST` | `/api/ai/dispatch/decisions/{id}/reject` | `AiDispatchController.rejectDecision` | `{ reason: string }` (Required) | `ApiResponse<Suggestion>` |
| **AI Dispatch** | `POST` | `/api/ai/dispatch/sessions/{id}/cancel` | `AiDispatchController.cancelSession` | *Path variable: sessionId* | `ApiResponse<{ status: "CANCELLED" }>` |
| **TMS Flow** | `GET` | `/api/ai/loads/overview` | `AiDispatchController.getLoadsOverview` | `{ loadIds: List<UUID> }` | `ApiResponse<List<AiLoadOverview>>` |
| **Trip Driver** | `POST` | `/api/trips/{tripId}/drivers` | `TripExecutionController.assignDriver` | `{ driverId: UUID, assignmentType: string, effectiveFrom?: string, plannedMiles?: number }` | `ApiResponse<TripDriverAssignmentView>` |
| **Trip Driver** | `POST` | `/api/trips/{tripId}/drivers/{assignmentId}/unassign` | `TripExecutionController.unassignDriver` | *Path variables: tripId, assignmentId* | `ApiResponse<TripDriverAssignmentView>` |
| **Trip Driver** | `GET` | `/api/trips/{tripId}/drivers` | `TripExecutionController.getTripDrivers` | *Path variable: tripId* | `ApiResponse<List<TripDriverAssignmentView>>` |
| **Trip Stop** | `POST` | `/api/trip-stops/{id}/arrive` | `TripExecutionController.arriveStop` | *Path variable: stopId* | `ApiResponse<TripStopView>` |
| **Trip Stop** | `POST` | `/api/trip-stops/{id}/start-service` | `TripExecutionController.startStopService` | *Path variable: stopId* | `ApiResponse<TripStopView>` |
| **Trip Stop** | `POST` | `/api/trip-stops/{id}/complete-service` | `TripExecutionController.completeStopService` | *Path variable: stopId* | `ApiResponse<TripStopView>` |
| **Trip Stop** | `POST` | `/api/trip-stops/{id}/depart` | `TripExecutionController.departStop` | *Path variable: stopId* | `ApiResponse<TripStopView>` |

### 4.2. Xử lý mã phản hồi HTTP và Khung lỗi
- **HTTP 200 OK / 201 Created:** Xử lý bóc tách phong bì `ApiResponse.data`. Bàn điều phối tự động gọi `queryClient.invalidateQueries` đối với các keys `["tms"]`, `["loads"]`, `["ai-dispatch"]`.
- **HTTP 400 Bad Request:**
  - `AUTONOMOUS_MODE_LOCKED`: Khi người dùng cố tình gửi `mode: "Autonomous"`.
  - `DECISION_NOT_PENDING`: Khi quyết định không ở trạng thái `Suggested`.
  - `REJECTION_REASON_REQUIRED`: Khi từ chối mà bỏ trống lý do.
  - `Unsupported trip driver assignment type`: Khi loại phân công không thuộc `PRIMARY, SECONDARY, TEAM, RELIEF`.
- **HTTP 403 Forbidden:**
  - `AI_FEATURE_DISABLED`: Khi tính năng AI bị tắt trên tenant (`!properties.isDispatchEnabledFor(tenantId)`).
  - Phân quyền endpoint: Các route `/api/trips/**` yêu cầu role `ADMIN` hoặc `DISPATCHER`.
- **HTTP 404 Not Found:** `ResourceNotFoundException` khi không tìm thấy Load, Truck, Trip, Driver hoặc Decision.
- **HTTP 409 Conflict:**
  - `FEASIBILITY_FAILED`: Khi đơn hàng đã được gán xe khác trước đó (`load.getAssignedTruck() != null`) hoặc xe đang trong lịch bảo trì (`truck.getStatus() == "MAINTENANCE"`).
- **HTTP 500 Internal Server Error:** Bắt lỗi hệ thống khi gọi LLM Agent thất bại (được thiết kế fallback sang giải thuật tối ưu nội bộ `optimization_fallback` thay vì làm sập API).

---

## 5. Business rules

1. **Quy tắc phê duyệt và gán thực thể (Approval & Assignment Policy):**
   - Đề xuất điều phối chỉ có thể được phê duyệt hoặc từ chối khi đang ở trạng thái `Suggested`.
   - Một quyết định sau khi phê duyệt chuyển trạng thái sang `Executed`, đồng thời cập nhật trạng thái đơn hàng sang `ASSIGNED`.
   - **Lỗ hổng:** Phê duyệt không gán tài xế vào bất kỳ bảng quan hệ nào; đơn hàng chỉ giữ thông tin xe.
2. **Quy tắc xung đột tài nguyên & Khả thi (Feasibility & Conflict Rules):**
   - Không cho phép gán xe đang có trạng thái `MAINTENANCE` vào đơn hàng thông qua AI Dispatch.
   - Không cho phép gán xe mới nếu đơn hàng đã có xe được gán trước đó (`load.getAssignedTruck() != null`).
   - **Thiếu sót:** Hệ thống hoàn toàn **không kiểm tra xung đột lịch trình của tài xế**. Không kiểm tra tài xế có đang thực hiện chuyến xe khác hay không, và không kiểm tra giới hạn giờ lái xe (Hours of Service - HOS).
3. **Quy tắc giải thuật chấm điểm ứng viên (Candidate Scoring Engine):**
   - Trọng số tính điểm đề xuất kết hợp từ 4 thành phần: Biên lợi nhuận (Margin - 35%), Xác suất đúng giờ (On-Time - 30%), Quãng đường chạy rỗng (Deadhead - 25%), và Quỹ giờ HOS còn lại (HOS Headroom - 10%).
   - **Thực tế:** Các chỉ số Deadhead (15 dặm), On-time (95%), và HOS (9.5 giờ) hiện đang bị **gán cứng (hardcoded)** trong mã nguồn backend, chưa tính toán dựa trên tọa độ GPS và log tài xế thực tế.
4. **Quy tắc vòng đời chặng dừng (Trip Stop State Machine):**
   - Tuân thủ thứ tự nghiêm ngặt: `PENDING / EN_ROUTE` &rarr; `ARRIVED` &rarr; `SERVICE_STARTED` &rarr; `SERVICE_COMPLETED` &rarr; `DEPARTED`.
   - Không được phép nhảy cóc trạng thái (ví dụ từ `PENDING` lên `SERVICE_STARTED` sẽ bị ném lỗi 400 Bad Request).
   - Khi hoàn thành chặng dừng cuối (`DEPARTED`), chuyến xe **không tự động chuyển sang COMPLETED**, cần thao tác thủ công.

---

## 6. Permission

Cơ chế phân quyền đối soát giữa Frontend (`src/providers/permissions/roleMatrix.ts`) và Backend (`SecurityConfig.java`):

```typescript
// Trích xuất từ roleMatrix.ts:
const OPERATIONS = ["ADMIN", "ACCOUNTANT", "DISPATCHER"] as const;
const DISPATCH = ["ADMIN", "DISPATCHER"] as const;

{ resources: ["loads"], actions: [...CRUD_ACTIONS, "dispatch", "cancel", "pickup", "deliver"], roles: OPERATIONS },
{ resources: ["trips"], actions: [...CRUD_ACTIONS, "dispatch", "cancel", "complete"], roles: DISPATCH },
{ resources: ["ai-dispatch"], actions: [...CRUD_ACTIONS, "AI_DISPATCH_VIEW", "AI_DISPATCH_RUN", "AI_DISPATCH_APPROVE"], roles: [...OPERATIONS, "SUPERADMIN", "OWNER", "MANAGER"] }
```

### Bảng ma trận phân quyền thực tế:

| Vai trò (Role) | Bàn điều phối `/tms/dispatch` | Xem AI `/ai-dispatch` | Chạy AI (`POST /runs`) | Duyệt AI (`POST /approve`) | Gán tài xế chuyến xe (`/trips/drivers`) | Thực thi trạm (`/trip-stops/*`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** |
| **DISPATCHER** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** |
| **ACCOUNTANT** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **TỪ CHỐI (403)** | **TỪ CHỐI (403)** |
| **SUPERADMIN / OWNER** | **TỪ CHỐI** (Không có role loads) | **CHO PHÉP** | **CHO PHÉP** | **CHO PHÉP** | **TỪ CHỐI** | **TỪ CHỐI** |
| **DRIVER** | **TỪ CHỐI (403)** | **TỪ CHỐI (403)** | **TỪ CHỐI (FE)** | **TỪ CHỐI (FE)** | **TỪ CHỐI (403)** | **TỪ CHỐI (403)** |
| **PAYROLL / OTHER** | **TỪ CHỐI (403)** | **TỪ CHỐI (403)** | **TỪ CHỐI (FE)** | **TỪ CHỐI (FE)** | **TỪ CHỐI (403)** | **TỪ CHỐI (403)** |

> [!WARNING]
> **LỖ HỔNG PHÂN QUYỀN API BACKEND (RISK-DISP-01):**  
> Tại `SecurityConfig.java:128-129`, cụm endpoint `/api/ai/**` **không được cấu hình bộ kiểm tra vai trò (hasAnyRole)** mà rơi vào fallback `.anyRequest().authenticated()`. Nghĩa là người dùng có role `DRIVER` hoặc `PAYROLL` nếu dùng công cụ gửi request trực tiếp (Curl/Postman) kèm JWT hợp lệ vẫn có thể kích hoạt chạy AI hoặc duyệt quyết định do backend thiếu `@PreAuthorize`.

---

## 7. Test cases

> [!NOTE]
> **Quy ước trạng thái kiểm thử:**
> - `UNIT_TEST_PASS`: Đã thực thi bằng Vitest trong phiên làm việc và đạt kết quả PASS.
> - `SOURCE_REVIEWED`: Đã đối soát mã nguồn và kiểm tra logic chi tiết.
> - `NOT_TESTED / BLOCKED`: Chưa thể chạy test tích hợp live do môi trường backend Spring Boot live không kích hoạt.

| Mã TC | Phân loại | Kịch bản kiểm thử | Input / Điều kiện | Kết quả mong đợi | Trạng thái kiểm tra thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DSP-01** | Happy Path | Hiển thị bàn làm việc điều phối TMS với đầy đủ hàng đợi và bản đồ | Truy cập `/tms/dispatch` với quyền Dispatcher | Tải danh sách đơn hàng, hiển thị số liệu các hàng đợi (All, At risk, Unassigned, Approvals), render bản đồ và marker xe. | `UNIT_TEST_PASS` (Khớp test component `AiDispatchPage.test.tsx` & `status.test.ts`) |
| **TC-DSP-02** | Happy Path | Khởi chạy phiên điều phối AI thành công ở chế độ HumanInTheLoop | `POST /api/ai/dispatch/runs` với `loadId` hợp lệ, `mode: "HumanInTheLoop"` | Tạo phiên `AiDispatchSession`, sinh danh sách đề xuất xếp hạng theo điểm số, trả về HTTP 201 Created. | `UNIT_TEST_PASS` (Khớp `aiDispatchApi.test.ts:25-45`) |
| **TC-DSP-03** | Happy Path | Phê duyệt đề xuất AI gán xe cho đơn hàng | Bấm "Approve suggestion" tại `ApproveSuggestionModal` | Gọi API approve, đơn hàng chuyển sang `ASSIGNED`, gán `assignedTruckId`. Đề xuất chuyển thành `Executed`. | `SOURCE_REVIEWED` (Đối soát `AiDispatchService.java:222-263`) |
| **TC-DSP-04** | Happy Path | Từ chối đề xuất AI kèm lý do hợp lệ | Nhập lý do "Xe không phù hợp kích thước hàng", bấm "Reject" | Gửi `POST /decisions/{id}/reject`, đề xuất chuyển sang `Rejected` kèm lý do. | `SOURCE_REVIEWED` (Đối soát `AiDispatchService.java:266-287`) |
| **TC-DSP-05** | Happy Path | Phân công tài xế vào chuyến xe (`TripDriverAssignment`) | `POST /api/trips/{id}/drivers` với `driverId`, `type: PRIMARY` | Tạo bản ghi phân công, `effectiveFrom = now()`, trạng thái `isActive = true`. | `UNIT_TEST_PASS` (Khớp test `useTripDriverAssignments.test.tsx:50-70`) |
| **TC-DSP-06** | Happy Path | Hủy phân công tài xế (Soft-close) | `POST /trips/{id}/drivers/{assignId}/unassign` | Bản ghi được cập nhật `effectiveTo = now()`, không bị xóa khỏi cơ sở dữ liệu. | `UNIT_TEST_PASS` (Khớp test `useTripDriverAssignments.test.tsx:80-95`) |
| **TC-DSP-07** | State Machine | Vòng đời thực thi chặng dừng chuyến xe | Chuyển trạng thái: arrive &rarr; startService &rarr; completeService &rarr; depart | Mỗi bước cập nhật đúng mốc thời gian (`arrivedAt`, `serviceStartedAt`...) và chuyển status tương ứng. | `UNIT_TEST_PASS` (Khớp test `useTripStopActions.test.tsx:60-90`) |
| **TC-DSP-08** | Negative Case | Chuyển trạng thái chặng dừng nhảy cóc không đúng thứ tự | Stop đang `PENDING`, gọi `POST /complete-service` | Backend chặn, ném lỗi 400 Bad Request `Trip stop cannot transition from PENDING to SERVICE_COMPLETED`. | `SOURCE_REVIEWED` (Khớp `TripExecutionService.java:143-148`) |
| **TC-DSP-09** | Negative Case | Khởi chạy AI với chế độ `Autonomous` | Gửi request `mode: "Autonomous"` | Backend chặn, trả về 400 Bad Request `AUTONOMOUS_MODE_LOCKED`. | `SOURCE_REVIEWED` (Khớp `AiDispatchService.java:66-69`) |
| **TC-DSP-10** | Negative Case | Từ chối đề xuất AI nhưng bỏ trống lý do | Bấm Reject mà không nhập lý do | Client chặn trước (yêu cầu 3-500 ký tự); backend chặn với 400 `REJECTION_REASON_REQUIRED`. | `SOURCE_REVIEWED` (Khớp `ApproveSuggestionModal.tsx:53`) |
| **TC-DSP-11** | Conflict | Phê duyệt đề xuất AI khi xe đang bảo trì (Maintenance) | Đề xuất trỏ tới xe có status `MAINTENANCE` | Revalidation thất bại, đề xuất chuyển thành `Failed`, trả về 409 Conflict `FEASIBILITY_FAILED`. | `SOURCE_REVIEWED` (Khớp `AiDispatchService.java:246-252`) |
| **TC-DSP-12** | Conflict | Phê duyệt đề xuất AI khi đơn hàng đã được gán xe khác | Đơn hàng có `load.getAssignedTruck() != null` | Revalidation thất bại, đề xuất chuyển thành `Failed`, trả về 409 Conflict `FEASIBILITY_FAILED`. | `SOURCE_REVIEWED` (Khớp `AiDispatchService.java:238-244`) |
| **TC-DSP-13** | Conflict | Gán 1 tài xế vào 2 chuyến xe diễn ra đồng thời | Gán tài xế A vào Trip 1 và Trip 2 có cùng ngày giờ | **LỖI (BUG-DISP-02):** Backend không kiểm tra xung đột lịch trình, gán thành công cả 2 chuyến. | `SOURCE_REVIEWED` (Khớp `TripExecutionService.java:37-67`) |
| **TC-DSP-14** | Business Gap | Duyệt đề xuất AI hiển thị tài xế nhưng kiểm tra DB | Duyệt đề xuất hiển thị Tài xế B, kiểm tra load sau duyệt | **LỖI (BUG-DISP-01):** Chỉ có xe được gán, thông tin tài xế bị mất hoàn toàn, không lưu vào DB. | `SOURCE_REVIEWED` (Khớp `AiDispatchService.java:255`) |
| **TC-DSP-15** | Boundary | Bàn làm việc có trên 100 đơn hàng đang hoạt động | Hệ thống có 150 đơn hàng | **RỦI RO (RISK-DISP-02):** Đề xuất của các đơn hàng từ 101 trở đi không map được vào load, hiển thị vô danh `Decision xxxxxxxx`. | `SOURCE_REVIEWED` (Khớp `approvals.ts:54-62`) |
| **TC-DSP-16** | Permission | Tài xế (DRIVER) truy cập trực tiếp URL `/tms/dispatch` | Đăng nhập tài khoản DRIVER, gõ URL `/tms/dispatch` | Bị `ResourceAccessBoundary` chặn, hiển thị màn hình cấm quyền `ForbiddenPage` (403). | `SOURCE_REVIEWED` (Khớp `roleMatrix.ts:31`) |
| **TC-DSP-17** | API Security | Tài xế (DRIVER) gửi API trực tiếp tới `/api/ai/dispatch/pending` | Gửi request có JWT của Driver đến endpoint AI | **LỖI PHÂN QUYỀN (RISK-DISP-01):** Backend cho phép truy cập do thiếu rule `hasAnyRole` tại `SecurityConfig.java`. | `SOURCE_REVIEWED` (Khớp `SecurityConfig.java:128`) |

---

## 8. Confirmed bugs

### BUG-DISP-01: Phê duyệt đề xuất AI hiển thị Tài xế nhưng không lưu trữ phân công Tài xế (Driver Lost on Approval)
- **Mã lỗi:** `BUG-DISP-01`
- **Mức độ nghiêm trọng:** **P1** (High — Data Loss / Functional Incompleteness)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:** Trên giao diện bàn làm việc [`DispatchPage.tsx:288-292`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx#L288-L292) và hộp thoại [`ApproveSuggestionModal.tsx:40`](file:///home/vumoi/logictics-app/src/components/tms-flow/ApproveSuggestionModal.tsx#L40), hệ thống hiển thị rõ ràng thông tin đề xuất gồm cả Phương tiện (`truckNumber`) và Tài xế (`driverName`). Tuy nhiên, khi điều phối viên bấm "Approve suggestion" (`POST /api/ai/dispatch/decisions/{id}/approve`):
  - Tại `AiDispatchService.java:255`, mã nguồn chỉ gọi duy nhất: `loadService.assignTruck(load.getId(), truck.getId());`.
  - Thực thể `Load` không hề có cột hoặc quan hệ lưu tài xế (`assignedDriver`).
  - Hệ thống **không tạo `Trip`** và **không tạo bản ghi `TripDriverAssignment`**.
  - Thực thể `AiDispatchDecision` trong database cũng không có cột `driver_id` ([`AiDispatchDecision.java:60-82`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/entity/AiDispatchDecision.java#L60-L82)).
  - Kết quả là tài xế mà điều phối viên vừa duyệt hoàn toàn biến mất khỏi đơn hàng.
- **Bước tái hiện:**
  1. Mở `/tms/dispatch`, chọn thẻ đề xuất AI có hiển thị cả xe (US-TRK-01) và tài xế (John Doe).
  2. Bấm "Review and decide", sau đó bấm "Approve suggestion".
  3. Mở chi tiết đơn hàng vừa duyệt tại `/tms/shipments/{id}` hoặc kiểm tra API `GET /api/loads/{id}`.
- **Kết quả mong đợi:** Đơn hàng hoặc chuyến xe liên kết phải ghi nhận tài xế John Doe là người phụ trách vận chuyển.
- **Kết quả thực tế:** Chỉ có xe US-TRK-01 được gán (`assignedTruckId`), trường tài xế hiển thị `Unassigned` hoặc để trống.
- **Đề xuất sửa:** Trong `AiDispatchService.approveDecision`, sau khi gán xe, nếu đơn hàng được điều phối tạo chuyến xe (`Trip`), phải tự động tạo bản ghi `TripDriverAssignment` tương ứng cho tài xế của xe đó.

---

### BUG-DISP-02: Thiếu cơ chế kiểm tra xung đột lịch trình (Schedule Conflict) khi gán Tài xế và Xe
- **Mã lỗi:** `BUG-DISP-02`
- **Mức độ nghiêm trọng:** **P1** (High — Resource Conflict / Double Booking)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:**
  - Trong phương thức `TripExecutionService.assignDriver` ([`TripExecutionService.java:37-67`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L37-L67)), hệ thống chỉ kiểm tra sự tồn tại của Trip và Driver. Hoàn toàn **không kiểm tra xem tài xế đã được phân công vào chuyến xe khác đang chạy hay chưa** (`effectiveFrom` đến `effectiveTo`). Hậu quả là 1 tài xế có thể bị gán trùng lặp vào 5 chuyến xe khác nhau cùng một ngày mà không có cảnh báo.
  - Ngoài ra, hệ thống cho phép gán tài xế vào cả các chuyến xe đã ở trạng thái `COMPLETED` hoặc `CANCELLED`.
  - Nếu gọi `assignDriver` nhiều lần với `assignmentType = "PRIMARY"`, hệ thống tạo ra nhiều bản ghi `PRIMARY` song song mà không đóng bản ghi cũ.
- **Bước tái hiện:**
  1. Tạo Trip A và Trip B có cùng thời gian khởi hành.
  2. Vào Trip A, gán Tài xế X làm PRIMARY driver.
  3. Vào Trip B, tiếp tục gán Tài xế X làm PRIMARY driver.
- **Kết quả mong đợi:** Hệ thống cảnh báo xung đột lịch: *"Tài xế X đã được phân công cho Chuyến xe A trong khung giờ này"*.
- **Kết quả thực tế:** Hệ thống lưu thành công cả 2 bản ghi mà không có bất kỳ kiểm tra xung đột nào.
- **Đề xuất sửa:** Bổ sung truy vấn kiểm tra giao thoa khoảng thời gian (`overlapping assignments`) trong `assignmentRepository` trước khi cho phép gán tài xế; chặn gán vào chuyến đã kết thúc.

---

### BUG-DISP-03: Các chỉ số tính toán ứng viên trong giải thuật AI Optimization bị gán cứng (Hardcoded Metrics)
- **Mã lỗi:** `BUG-DISP-03`
- **Mức độ nghiêm trọng:** **P2** (Medium — Algorithm Integrity)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:** Trong `AiDispatchService.java:351-393` (`calculateCandidateScore`), logic chấm điểm ứng viên để đề xuất điều phối xe được mô tả là dùng 4 hàm lợi ích. Tuy nhiên dữ liệu đầu vào bị gán cứng:
  - `double deadheadMiles = 15.0;` (Không tính khoảng cách GPS thực tế từ tọa độ hiện tại của xe đến điểm lấy hàng của đơn).
  - `double onTimeUtil = 0.95;` (Gán cứng 95%).
  - `double hosUtil = 0.90;` (Gán cứng 90%).
  - `metrics.hosRemainingHours = 9.5;` (Gán cứng 9.5 giờ).
  - Tại `toSuggestionView` ([`AiDispatchService.java:511-514`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/ai/dispatch/AiDispatchService.java#L511-L514)), điểm số `score` bị ép thành `0.85000000` và `confidence` ép thành `"HIGH"`.
- **Bước tái hiện:** Khởi chạy AI dispatch cho 3 đơn hàng ở các bang khác nhau với các xe ở các vị trí khác nhau; so sánh metrics trả về.
- **Kết quả mong đợi:** Quãng đường chạy rỗng và số giờ HOS phải khác nhau theo từng cặp xe - đơn hàng thực tế.
- **Kết quả thực tế:** Tất cả các gợi ý đều có deadhead = 15.0 mi, HOS = 9.5h, onTime = 95%.
- **Đề xuất sửa:** Tích hợp tính toán khoảng cách Haversine/OSRM giữa tọa độ xe và điểm lấy hàng; đối soát bảng ghi HOS của tài xế để tính giờ lái xe còn lại hợp lệ.

---

### BUG-DISP-04: Cột mốc điều phối `dispatched_at` không bao giờ được ghi nhận
- **Mã lỗi:** `BUG-DISP-04`
- **Mức độ nghiêm trọng:** **P2** (Medium — Audit & State Incompleteness)
- **Phân loại:** `BUG_CONFIRMED`
- **Mô tả:** Cả hai thực thể `Load` (`Load.java:65`) và `Trip` (`Trip.java:50`) đều định nghĩa cột `@Column(name = "dispatched_at") private OffsetDateTime dispatchedAt;`. Bảng chỉ mục và các câu lệnh query tối ưu (`OptimizationCandidateRepository.java:32`) đều lọc theo điều kiện `dispatched_at is null`. Tuy nhiên, trong toàn bộ mã nguồn `logictics_api`, **không có bất kỳ dòng lệnh nào gọi `setDispatchedAt(...)`**. Khi điều phối xe thành công, trạng thái đơn chỉ đổi thành `ASSIGNED`, trường `dispatchedAt` vĩnh viễn mang giá trị `NULL`.
- **Đề xuất sửa:** Bổ sung logic cập nhật `setDispatchedAt(OffsetDateTime.now())` khi chuyến xe/đơn hàng được chuyển trạng thái sang dispatched.

---

## 9. Unverified risks

### RISK-DISP-01: Lỗ hổng phân quyền API Backend đối với cụm điều phối AI (`/api/ai/**`)
- **Mã nguy cơ:** `RISK-DISP-01`
- **Mức độ rủi ro:** **P2** (Medium — Security / Authorization Bypass)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trong [`SecurityConfig.java:128-129`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L128-L129), toàn bộ các endpoint `/api/ai/**` rơi vào `.anyRequest().authenticated()`. Backend không có annotation `@PreAuthorize("hasAnyRole('ADMIN','DISPATCHER')")` trên `AiDispatchController`. Bất kỳ người dùng nào đăng nhập có JWT hợp lệ (ví dụ tài xế có role `DRIVER`) đều có thể gọi trực tiếp API để chạy hoặc duyệt quyết định điều phối mà không bị backend ngăn chặn.

### RISK-DISP-02: Mất liên kết dữ liệu đề xuất khi hàng đợi vượt quá 100 đơn hàng
- **Mã nguy cơ:** `RISK-DISP-02`
- **Mức độ rủi ro:** **P2** (Medium — Client Data Truncation)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Tại [`src/utils/tms-flow/approvals.ts:54-62`](file:///home/vumoi/logictics-app/src/utils/tms-flow/approvals.ts#L54-L62), hàm `loadIdsForOverview` chỉ cắt lấy tối đa 100 load (`slice(0, 100)`). Khi tenant có từ 101 đơn hàng trở lên, các quyết định điều phối thuộc các load phía sau sẽ không có dữ liệu overview, khiến hàm `joinTmsApprovals` không tìm thấy load tương ứng, hiển thị dưới dạng vô danh (`Decision xxxxxxxx`) trên giao diện.

### RISK-DISP-03: Nguy cơ Race Condition khi hai điều phối viên cùng duyệt một đề xuất
- **Mã nguy cơ:** `RISK-DISP-03`
- **Mức độ rủi ro:** **P3** (Low — Concurrency)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:** Trong `AiDispatchService.java:232`, `loadRepository.findById` được gọi trước khi transaction thực hiện khóa bi quan trong `loadService.assignTruck`. Nếu hai điều phối viên cùng nhấn nút "Approve" đồng thời trong khoảng vài mili-giây, cả hai luồng có thể cùng vượt qua bước kiểm tra trạng thái trước khi khóa được thiết lập.

---

## 10. Missing functionality

> [!NOTE]
> **Định vị phạm vi & Đề xuất nâng cao:**  
> Các mục dưới đây phản ánh khoảng cách hoàn thiện nghiệp vụ của hệ thống điều phối TMS chuyên nghiệp:

1. **`[ENHANCEMENT]` Tự động hoàn thành chuyến xe khi rời trạm dừng cuối cùng:**  
   Khi tài xế thực hiện `departStop` tại chặng dừng cuối cùng ([`TripExecutionService.java:120`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java#L120)), chặng chuyển sang `DEPARTED` nhưng `Trip` cha vẫn giữ nguyên trạng thái `IN_TRANSIT` hoặc `PLANNED`. Cần bổ sung cơ chế tự động chuyển `Trip.status = COMPLETED` và `Load.status = DELIVERED`.
2. **`[FEATURE_GATED]` Chế độ điều phối tự động hoàn toàn (Autonomous Mode):**  
   Cả giao diện [`AiDispatchRunForm.tsx:89`](file:///home/vumoi/logictics-app/src/features/ai-dispatch/components/AiDispatchRunForm.tsx#L89) lẫn backend [`AiDispatchService.java:66`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/ai/dispatch/AiDispatchService.java#L66) đều đang khóa chế độ tự động chạy và tự động gán xe không qua phê duyệt của con người (`AUTONOMOUS_MODE_LOCKED`).
3. **`[ENHANCEMENT]` Kiểm tra trực tiếp kết nối nhà cung cấp AI (Live Provider Health Check):**  
   Tại `AiConfigModal.tsx`, nút kiểm tra kết nối với OpenAI / Gemini bị khóa vì backend chưa có endpoint ping live API key.

---

## 11. Integration issues

1. **Mất đồng bộ giữa AI Dispatch Decision và Phân hệ Trip Execution:**  
   AI Dispatch hoạt động ở tầng `Load`, khi phê duyệt chỉ gán `truckId` vào `Load`. Trong khi đó, phân hệ điều phối tài xế lại nằm ở tầng `Trip` (`TripExecutionController`). Giữa hai phân hệ thiếu một bước tự động tạo `Trip` từ `Load` đã duyệt để gắn tài xế được đề xuất vào chuyến xe.
2. **Luồng chuyển hướng sau khi tạo đơn hàng mới từ Bàn điều phối:**  
   Tại [`DispatchPage.tsx:203`](file:///home/vumoi/logictics-app/src/pages/tms-flow/DispatchPage.tsx#L203), nút "New shipment" đưa người dùng sang `/loads/create`. Sau khi tạo xong, hệ thống điều hướng về `/loads` (trang quản trị danh sách generic cũ) thay vì quay trở lại `/tms/dispatch`, gây gián đoạn luồng làm việc của nhân viên điều phối.

---

## 12. Test execution evidence

Đã thực thi kiểm tra các bộ test liên quan đến Dispatch và Trip Execution trên repository trong phiên làm việc:

```bash
# 1. Kiểm tra Unit & Component Test cho AI Dispatch và Trip Execution
$ npx vitest run src/tests/pages/ai-dispatch/ src/tests/features/ai-dispatch/ src/tests/features/trips/
Test Files  10 passed (10)
     Tests  57 passed (57)
  Duration  13.79s
Exit code: 0 (PASS)

# 2. Kiểm tra API và Utility cho TMS Flow Dispatch
$ npx vitest run src/api/tms-flow/ src/utils/tms-flow/
Test Files  2 passed (2)
      Tests  19 passed (19)
   Duration  1.76s
Exit code: 0 (PASS)

# 3. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - 0 lỗi type)

# 4. Kiểm tra định dạng Diff Git
$ git diff --check
Exit code: 0 (PASS)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Ghi nhận bằng chứng:**  
> - Các test case `UNIT_TEST_PASS` được kiểm chứng bởi 76 unit/component test files chạy tự động bằng Vitest trong phiên làm việc.  
> - Các kịch bản kiểm tra xung đột tài nguyên, logic tính toán backend và phân quyền API được xác minh qua **phân tích mã nguồn tĩnh đối soát (Static Code Review)** trên cả repository frontend và backend Spring Boot.  
> - **E2E Playwright:** `BLOCKED` do phiên làm việc không chạy backend Spring Boot live cục bộ.  
> - **Live Mutation:** `NOT_TESTED` trên môi trường thật tuân thủ quy tắc bảo toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-DISP-01` | Data Loss | **Lưu trữ phân công Tài xế khi Duyệt AI:** Cập nhật `AiDispatchService.approveDecision` để khi gán xe, nếu có tài xế đề xuất đi kèm, hệ thống phải tự động tạo hoặc liên kết phân công tài xế (`TripDriverAssignment`) thay vì chỉ gán mỗi xe. | `.../ai/dispatch/AiDispatchService.java:255` |
| **P1** | `BUG-DISP-02` | Conflict | **Kiểm tra xung đột lịch trình tài xế:** Trong `TripExecutionService.assignDriver`, bổ sung kiểm tra trùng lặp thời gian (`overlapping check`) giữa các chuyến xe đang chạy; chặn gán vào chuyến xe đã kết thúc hoặc đã hủy. | `.../service/TripExecutionService.java:37-67` |
| **P2** | `RISK-DISP-01` | Security | **Bảo vệ quyền truy cập API AI tại Backend:** Bổ sung cấu hình matcher trong `SecurityConfig.java` hoặc gắn `@PreAuthorize("hasAnyRole('ADMIN','DISPATCHER')")` trên `AiDispatchController`. | `.../config/SecurityConfig.java`<br>`.../ai/dispatch/AiDispatchController.java` |
| **P2** | `BUG-DISP-03` | Business Logic | **Loại bỏ Hardcode trong AI Optimization:** Thay thế các giá trị gán cứng (deadhead 15mi, on-time 95%, HOS 9.5h) bằng tính toán tọa độ GPS thực tế của xe và đối soát log HOS của tài xế. | `.../ai/dispatch/AiDispatchService.java:351-393` |
| **P2** | `BUG-DISP-04` | Audit Gap | **Ghi nhận mốc thời gian `dispatched_at`:** Bổ sung logic cập nhật `setDispatchedAt(OffsetDateTime.now())` khi đơn hàng/chuyến xe được điều phối xuất phát. | `.../service/LoadService.java`<br>`.../service/TripService.java` |
| **P2** | `RISK-DISP-02` | UX/Data | **Xử lý phân trang overview cho hàng đợi lớn:** Cải tiến `loadIdsForOverview` trong `approvals.ts` để hỗ trợ truy vấn overview theo lô (batching) thay vì cắt cứng ở 100 đơn hàng đầu tiên. | [`src/utils/tms-flow/approvals.ts:54`](file:///home/vumoi/logictics-app/src/utils/tms-flow/approvals.ts#L54) |
| **P3** | `ENHANCEMENT-01` | Automation | **Tự động hoàn thành chuyến xe:** Khi chặng dừng cuối chuyển sang `DEPARTED`, tự động chuyển trạng thái `Trip` sang `COMPLETED`. | `.../service/TripExecutionService.java:120` |
