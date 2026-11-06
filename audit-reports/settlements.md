# AUDIT: settlements

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `settlements` (Quyết toán tài xế, chi phí, tạm ứng)  
> **Thời điểm kiểm định:** 25/10/2026  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát đa tầng (Frontend React / Ant Design & Backend Spring Boot API / Postgres Row Locks & Snapshots), kiểm tra máy trạng thái quyết toán tài xế, kiểm tra tính nhất quán giữa cước vận tải và lương tài xế (Billing / Driver Revenue Consistency theo quy tắc `BILL-DEC-006`), đối soát quy tắc bù trừ chi phí - tạm ứng (`ADVANCE`, `DEDUCTION`, `REIMBURSEMENT`), kiểm tra tính bất biến lịch sử tài chính (Financial Immutability V13/V28/V29), và thực thi bộ kiểm thử tự động (Unit/Component/Contract Tests).

---

## 1. Tổng quan chức năng

Phân hệ **Quyết toán Lương & Chi phí Tài xế (Driver Settlements & Compensation Management)** là trung tâm tính toán và chi trả thù lao cho tài xế trong hệ thống TMS LogisticsX. Phân hệ chịu trách nhiệm tổng hợp toàn bộ công việc hoàn thành trong kỳ thanh toán (quãng đường dặm chạy, số giờ làm việc, chuyến hàng phụ trách, % doanh thu cước vận chuyển, phụ phí detention/layover), đối soát các khoản chi phí phát sinh (tiền xăng, cầu đường, bến bãi) và các khoản tạm ứng cước (`ADVANCE`), khấu trừ (`DEDUCTION`), từ đó kết xuất Bảng quyết toán tài xế (Driver Settlement Statement) chuẩn xác trước khi chuyển sang hệ thống thanh toán lương (Payroll).

### Đặc điểm kỹ thuật & Nghiệp vụ cốt lõi:
1. **Phương pháp Tính Lương Đa Dạng (Driver Pay Policies):**  
   - Tính theo Dặm (`PER_MILE`): Căn cứ dặm thực tế/kế hoạch (`actual/planned all miles`), cấm dùng fallback dặm cũ.
   - Tính theo Giờ (`HOURLY`): Căn cứ dữ liệu chấm công `time_entries.total_hours`.
   - Tính theo % Doanh thu Cước (`PERCENT_REVENUE`): Căn cứ doanh thu cước ròng hợp lệ của hóa đơn (`PRIMARY_INVOICE_REVENUE`, `NET_ELIGIBLE_REVENUE`), không tính trên thuế hay cước báo giá.
   - Tính theo Chuyến (`PER_LOAD`) hoặc Cố định (`FLAT_RATE`, `DAILY`).
   - Phụ phí phát sinh (`ACCESSORIAL_PAY`): Chỉ thanh toán phụ phí tài xế đã được phê duyệt (`driver_pay_amount` với `status: APPROVED`).
2. **Quy tắc Bù trừ Chi phí & Tạm ứng (Expenses & Advances Reconciliation):**  
   - Hệ thống tự động thu thập các khoản chi phí `Expense` phát sinh trong kỳ của tài xế:
     + `REIMBURSEMENT`: Hoàn trả chi phí tài xế tự chi (cộng vào lương thực nhận).
     + `DEDUCTION` / `ADVANCE` / `PENALTY`: Khấu trừ khoản tạm ứng hoặc tiền phạt (trừ vào lương thực nhận).
   - Kiểm tra tiền tệ đồng nhất (`CurrencyGuard.requireSameCurrency`) và chống tái sử dụng nguồn (`preventSourceReuse`).
3. **Tính Đồng bộ Doanh thu Hóa đơn - Lương Tài xế (Billing / Driver Revenue Consistency - `BILL-DEC-006`):**  
   - Trước khi khóa: Nếu hóa đơn có doanh thu biến động (`revenue drift`), hệ thống từ chối duyệt hoặc khóa với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE`, yêu cầu tính lại doanh thu (`recalculate-revenue`).
   - Sau khi khóa (`LOCKED`): Hóa đơn bổ sung cước hoặc credit note phát sinh sau sẽ tự động sinh quyết toán con điều chỉnh (`ADJUSTMENT`), tuyệt đối không sửa đổi quyết toán gốc đã khóa.
4. **Bảo vệ Tính Bất biến Lịch sử Kế toán (Financial Immutability):**  
   - Không hỗ trợ thao tác "Mở khóa" (`unlock`) hay xóa bỏ bản ghi đã `LOCKED`.
   - Mọi điều chỉnh đều sinh ra các bản ghi quyết toán con: `ADJUSTMENT` (điều chỉnh tăng/giảm) hoặc `REVERSAL` (đảo nợ toàn phần).
   - Khi chuyển sang `LOCKED`, các dòng thu nhập liên quan đến chuyến hàng được tự động chuyển thành chi phí vận tải thực tế (`shipment_costs`).

### Các phân hệ mã nguồn tham gia luồng Settlements:
1. **Giao diện Quản trị Quyết toán Frontend:**
   - Tuyến đường: `/settlements`, `/settlements/:id`, `/settlements/policies`, `/settlements/policies/:id` ([`src/router/AppRouter.tsx:258-285`](file:///home/vumoi/logictics-app/src/router/AppRouter.tsx#L258-L285)).
   - Trang danh sách: [`src/pages/settlements/SettlementList.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementList.tsx).
   - Trang chi tiết quy trình: [`src/pages/settlements/SettlementShow.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementShow.tsx).
   - Modal Tính quyết toán: [`src/features/settlements/components/CalculateSettlementModal.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/CalculateSettlementModal.tsx).
   - Modal Tạo điều chỉnh: [`src/features/settlements/components/CreateAdjustmentModal.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/CreateAdjustmentModal.tsx).
   - Quản lý Lệnh chuyển trạng thái: [`src/features/settlements/hooks/useSettlementActions.ts`](file:///home/vumoi/logictics-app/src/features/settlements/hooks/useSettlementActions.ts) và [`SettlementActions.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementActions.tsx).
   - Bảng Dòng quyết toán & Công việc nguồn: [`SettlementLinesTable.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementLinesTable.tsx).
2. **Backend Spring Boot API & Database Engine:**
   - Bộ điều khiển: [`com.company.logicstic.controller.DriverSettlementController.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/DriverSettlementController.java).
   - Động cơ tính toán lương: [`com.company.logicstic.service.payroll.DriverPayEngine.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/DriverPayEngine.java).
   - Kiểm soát đồng bộ doanh thu: [`com.company.logicstic.service.payroll.SettlementRevenueGuard.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/SettlementRevenueGuard.java) & `SettlementRevenueService.java`.
   - Dịch vụ đối soát số học: [`com.company.logicstic.service.payroll.SettlementReconciliationService.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/SettlementReconciliationService.java).
   - Migration bảo vệ lịch sử: `V10`, `V13`, `V28`, `V29`.

---

## 2. Danh sách route

| Đường dẫn URL | Component phụ trách | Mounting Runtime | Rào chắn phân quyền / Capability Gate | Hành vi chuyển hướng & Trải nghiệm thực tế |
| :--- | :--- | :--- | :--- | :--- |
| `/settlements` | `SettlementListPage` ([`src/pages/settlements/SettlementList.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementList.tsx)) | `AppRouter.tsx:259` | `ResourceAccessBoundary` (`action="SETTLEMENT_VIEW", resource="settlements"`). | Yêu cầu đăng nhập (`ProtectedRoute`) và tenant (`TenantGuard`). Chỉ người dùng thuộc nhóm `PAYROLL` (`ADMIN`, `ACCOUNTANT`, `PAYROLL`, `PAYROLL_MANAGER`) được phép truy cập. Các vai trò khác (`DISPATCHER`, `DRIVER`) bị chặn 403 Forbidden. |
| `/settlements/:id` | `SettlementShowPage` ([`src/pages/settlements/SettlementShow.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementShow.tsx)) | `AppRouter.tsx:267` | `ResourceAccessBoundary` (`action="SETTLEMENT_VIEW", resource="settlements"`). | Kiểm tra tính hợp lệ của tham số `id` (`isUuid(id)`). Nếu không phải UUID hợp lệ, trả về `<NotFoundState />`. Hiển thị chi tiết 5 tabs và các nút thao tác chuyển trạng thái theo máy trạng thái backend. |
| `/settlements/policies` | `DriverPayPolicyListPage` ([`src/pages/settlements/DriverPayPolicyList.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/DriverPayPolicyList.tsx)) | `AppRouter.tsx:271` | `ResourceAccessBoundary` (`action="POLICY_VIEW", resource="driver-pay-policies"`). | Màn hình quản lý danh sách các chính sách lương tài xế theo phương pháp tính thù lao. |
| `/settlements/policies/:id` | `DriverPayPolicyShowPage` ([`src/pages/settlements/DriverPayPolicyShow.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/DriverPayPolicyShow.tsx)) | `AppRouter.tsx:279` | `ResourceAccessBoundary` (`action="POLICY_VIEW", resource="driver-pay-policies"`). | Xem chi tiết chính sách lương và lịch sử các phiên bản chính sách (`policyVersion`). |

> [!NOTE]
> **Đặc điểm kiến trúc Tuyến đường Quyết toán:**  
> Tuyến đường `/settlements` **không sử dụng Generic CRUD Create/Edit page** (`ResourceCreatePage` / `ResourceEditPage`). Thao tác tạo quyết toán được thực hiện thông qua modal chuyên dụng `CalculateSettlementModal` kích hoạt trên trang danh sách; thao tác chỉnh sửa dữ liệu tài chính không được phép trực tiếp mà phải thông qua quy trình phê duyệt hoặc tạo quyết toán điều chỉnh `ADJUSTMENT`.

---

## 3. Danh sách UI action

| ID | Vùng màn hình | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-SETTLE-01** | Bảng danh sách: Số quyết toán | `Link` (table-number-link) | Chuyển hướng router | Không gọi API (Client Navigation) | Click vào `settlementNumber` điều hướng sang màn hình chi tiết `/settlements/:id`. |
| **ACT-SETTLE-02** | Bảng danh sách: Nút "Calculate Settlement" | `Button` (Primary) | `setIsCalcModalOpen(true)` | Không gọi API | Mở modal tính quyết toán `CalculateSettlementModal`. Nút được bảo vệ bởi `<CanAccess action="SETTLEMENT_CALCULATE">`. |
| **ACT-SETTLE-03** | Modal tính quyết toán: Bấm "Calculate" | `Button` ("Calculate") | `form.validateFields()` -> `calculateSettlement(values)` | `POST /api/driver-settlements/calculate` | Gửi `driverId` và `payPeriodId`. Backend tính toán thù lao theo chính sách có hiệu lực và trả về bản ghi quyết toán mới ở trạng thái `CALCULATED`. Đóng modal và refresh bảng danh sách. |
| **ACT-SETTLE-04** | Bảng danh sách: Nút "Pay Policies" | `Button` | Router Link | Không gọi API | Điều hướng sang `/settlements/policies`. Được bảo vệ bởi `<CanAccess action="POLICY_VIEW">`. |
| **ACT-SETTLE-05** | Bảng danh sách: Nút "Refresh" | `Button` | `refetch()` | `GET /api/driver-settlements` | Tải lại danh sách quyết toán từ máy chủ. |
| **ACT-SETTLE-06** | Bảng danh sách: Bộ lọc `SettlementFilters` | `Select` dropdowns | `onFilterChange(newFilters)` | `GET /api/driver-settlements?payPeriodId=...&driverId=...&status=...&settlementType=...` | Lọc dữ liệu theo kỳ lương, tài xế, trạng thái và loại quyết toán. |
| **ACT-SETTLE-07** | Bảng danh sách: Ô tìm kiếm (Search) | `Input` (Search) | `setSearchTerm(e.target.value)` | Không gọi API (Client-side Filter) | Lọc tức thời trên bảng theo số quyết toán, tên tài xế hoặc mã kỳ lương. |
| **ACT-SETTLE-08** | Trang chi tiết: Nút "Gửi duyệt" (`submitReview`) | `Button` (ConfirmActionModal) | `actions.execute({ action: "submitReview" })` | `POST /api/driver-settlements/{id}/submit-review` | Chỉ hiển thị khi `status === "CALCULATED"`. Chuyển trạng thái sang `IN_REVIEW`. Invalidate cache chi tiết và danh sách. |
| **ACT-SETTLE-09** | Trang chi tiết: Nút "Phê duyệt" (`approve`) | `Button` (ConfirmActionModal) | `actions.execute({ action: "approve" })` | `POST /api/driver-settlements/{id}/approve` | Chỉ hiển thị khi `status === "IN_REVIEW"`. Chuyển trạng thái sang `APPROVED`. *(Lưu ý: Nếu có biến động doanh thu hóa đơn, backend ném 409 `SETTLEMENT_REVENUE_BASIS_STALE`)*. |
| **ACT-SETTLE-10** | Trang chi tiết: Nút "Khóa quyết toán" (`lock`) | `Button` (ConfirmActionModal) | `actions.execute({ action: "lock" })` | `POST /api/driver-settlements/{id}/lock` | Chỉ hiển thị khi `status === "APPROVED"`. Chuyển trạng thái sang `LOCKED`. Tự động tạo bản ghi chi phí vận tải `shipment_costs`. Quyết toán trở thành bất biến vĩnh viễn. |
| **ACT-SETTLE-11** | Trang chi tiết: Nút "Yêu cầu kiểm chứng" | `Button` | Mở Modal nhập `reason` | `POST /api/driver-settlements/{id}/require-validation` | Hiển thị khi status là `CALCULATED`, `VALIDATION_REQUIRED`, `IN_REVIEW`, `APPROVED`. Nhập lý do (tối đa 1000 ký tự). Chuyển trạng thái sang `VALIDATION_REQUIRED`. |
| **ACT-SETTLE-12** | Trang chi tiết: Nút "Giải quyết kiểm chứng" | `Button` (ConfirmActionModal) | `actions.execute({ action: "resolveValidation" })` | `POST /api/driver-settlements/{id}/resolve-validation` | Chỉ hiển thị khi `status === "VALIDATION_REQUIRED"`. Xóa lý do kiểm chứng và đưa trạng thái trở lại `CALCULATED`. |
| **ACT-SETTLE-13** | Trang chi tiết: Nút "Tạo điều chỉnh" (Adjustment) | `Button` (`CreateAdjustmentModal`) | `actions.execute({ action: "adjustments", payload })` | `POST /api/driver-settlements/{id}/adjustments` | Chỉ hiển thị khi quyết toán đã finalized (`LOCKED`, `PAYMENT_SCHEDULED`, `PAID`). Nhập dòng điều chỉnh (EARNING, DEDUCTION, REIMBURSEMENT) kèm lý do. Tạo quyết toán con `ADJUSTMENT`. |
| **ACT-SETTLE-14** | Trang chi tiết: Nút "Đảo nợ / Hủy" (Reversal) | `Button` (Modal Reversal) | `actions.execute({ action: "reversal", payload: { reason } })` | `POST /api/driver-settlements/{id}/reversal` | Chỉ hiển thị khi quyết toán đã finalized. Nhập lý do đảo nợ (tối đa 300 ký tự). Tạo quyết toán con `REVERSAL` đảo ngược 100% các dòng. |
| **ACT-SETTLE-15** | Trang chi tiết: Lệnh Tính lại Doanh thu (Recalculate Revenue) | *Không có trên UI* | *Không có* | `POST /api/driver-settlements/{id}/recalculate-revenue` | **LỖI THIẾU THAO TÁC UI (BUG-SETTLE-01):** Khi gặp lỗi 409 `SETTLEMENT_REVENUE_BASIS_STALE`, giao diện **hoàn toàn không có nút bấm hay modal nào** để kế toán thực thi tính lại doanh thu, làm tắc nghẽn quy trình duyệt. |
| **ACT-SETTLE-16** | Trang chi tiết: Tabs dữ liệu | `Tabs` ("summary", "lines", "source", "adjustments", "audit") | `setTab(key)` | Không gọi API | Chuyển đổi giữa các góc nhìn: Tổng quan, Bảng dòng thù lao, Công việc nguồn, Lịch sử quyết toán con, và Lịch sử kiểm toán. |

---

## 4. API liên quan

### 4.1. Bảng đối soát Endpoints phân hệ Settlements

| Phương thức | Endpoint | Controller / Service Backend | Request Body / Params | Response Model |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/driver-settlements` | `DriverSettlementController.list` | `payPeriodId?, driverId?, status?, settlementType?` | `ApiResponse<List<DriverSettlementView>>` |
| `POST` | `/api/driver-settlements/calculate` | `DriverSettlementController.calculate` | `CalculateSettlementRequest`: `{ driverId: UUID, payPeriodId: UUID }` | `ApiResponse<DriverSettlementView>` (HTTP 201 Created) |
| `GET` | `/api/driver-settlements/{id}` | `DriverSettlementController.get` | *Path variable: id (UUID)* | `ApiResponse<DriverSettlementView>` |
| `POST` | `/api/driver-settlements/{id}/submit-review` | `DriverSettlementController.submitForReview` | *Path variable: id (UUID)* | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/approve` | `DriverSettlementController.approve` | *Path variable: id (UUID)* | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/lock` | `DriverSettlementController.lock` | *Path variable: id (UUID)* | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/require-validation` | `DriverSettlementController.requireValidation` | `ValidationRequest`: `{ reason: String (max 1000 ký tự) }` | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/resolve-validation` | `DriverSettlementController.resolveValidation` | *Path variable: id (UUID)* | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/adjustments` | `DriverSettlementController.adjustment` | `SettlementAdjustmentRequest`: `{ idempotencyKey, reason, lines: List<Line> }` | `ApiResponse<DriverSettlementView>` (HTTP 201 Created) |
| `POST` | `/api/driver-settlements/{id}/reversal` | `DriverSettlementController.reversal` | `SettlementReversalRequest`: `{ reason: String (max 300 ký tự) }` | `ApiResponse<DriverSettlementView>` (HTTP 201 Created) |
| `POST` | `/api/driver-settlements/{id}/recalculate-revenue`| `DriverSettlementController.recalculateRevenue` | `Recalculate`: `{ idempotencyKey, expectedSnapshotId, reasonCode, reason }` | `ApiResponse<DriverSettlementView>` (HTTP 200 OK) |
| `POST` | `/api/driver-settlements/{id}/billing-adjustments`| `DriverSettlementController.billingAdjustment` | `Adjustment`: `{ idempotencyKey, affectedDocumentId, reasonCode, reason }` | `ApiResponse<Impact>` (HTTP 200 OK) |

### 4.2. Xử lý mã phản hồi HTTP và Khung lỗi

- **HTTP 200 OK / 201 Created:** Xử lý trả về bọc trong cấu trúc chuẩn `ApiResponse.data`.
- **HTTP 400 Bad Request:**
  - `VALIDATION_FAILED`: Dữ liệu đầu vào vi phạm Bean Validation (thiếu `driverId`, `payPeriodId`, hoặc `reason` rỗng).
  - `MILEAGE_VALIDATION_REQUIRED`: Khi tính lương dặm (`PER_MILE`) nhưng thiếu dữ liệu dặm thực tế/kế hoạch hợp lệ của phân công (`assignment.actualMiles`).
  - `REVENUE_PAY_VALIDATION_REQUIRED`: Khi tính lương % nhưng hóa đơn cước bị thiếu, chưa phát hành, hoặc không có dòng cước hợp lệ.
  - `ACCESSORIAL_PAY_VALIDATION_REQUIRED`: Khi phụ phí chưa được phê duyệt hoặc thiếu thông tin phân công tài xế tại thời điểm xảy ra phụ phí.
  - `EXPENSE_PAY_VALIDATION_REQUIRED`: Khi chi phí hoặc tạm ứng có số tiền rỗng hoặc âm (`amount < 0`).
  - `INVALID_SETTLEMENT_TRANSITION`: Khi cố tình chuyển trạng thái sai quy trình (ví dụ từ `CALCULATED` nhảy thẳng sang `LOCKED`).
  - `SETTLEMENT_ACTOR_REQUIRED`: Khi không xác định được nhân viên (`Employee`) thực hiện phê duyệt hoặc khóa.
  - `REVERSAL_REASON_REQUIRED`: Khi đảo nợ nhưng thiếu lý do hoặc lý do vượt quá 300 ký tự.
  - `SETTLEMENT_NOT_FINALIZED`: Khi cố tình tạo `ADJUSTMENT` hoặc `REVERSAL` trên quyết toán chưa ở trạng thái `LOCKED`, `PAYMENT_SCHEDULED` hoặc `PAID`.
- **HTTP 403 Forbidden:**
  - Cấu hình backend tại `SecurityConfig.java:112-113` giới hạn cho `ADMIN`, `ACCOUNTANT`, `PAYROLL`, `PAYROLL_MANAGER`. Các vai trò khác bị 403 Forbidden.
  - `Authenticated payroll actor required`: Người dùng không ánh xạ được với bản ghi `Employee` trong tenant hiện tại ([`DriverSettlementController.java:149-151`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/DriverSettlementController.java#L149-L151)).
- **HTTP 404 Not Found:**
  - `Parent settlement not found` hoặc `Settlement not found`: Khi `id` không tồn tại trong tenant.
- **HTTP 409 Conflict:**
  - `SETTLEMENT_REVENUE_BASIS_STALE`: Khi hóa đơn liên quan có biến động doanh thu (phát sinh supplemental, rebill hoặc credit) khiến snapshot doanh thu bị lệch so với thực tế ([`SettlementRevenueGuard.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/SettlementRevenueGuard.java)).
  - `SETTLEMENT_REVENUE_IDEMPOTENCY_CONFLICT`: Khi gửi cùng `idempotencyKey` trong lệnh billing-adjustments nhưng payload bị thay đổi.
- **HTTP 422 Unprocessable Content:**
  - `CURRENCY_MISMATCH`: Khi tiền tệ của chi phí, tạm ứng (`Expense`) hoặc hóa đơn không trùng khớp với tiền tệ của chính sách lương tài xế.

---

## 5. Business rules

### 5.1. Vòng đời Trạng thái Quyết toán Tài xế (Settlement Status Lifecycle)

Quy trình phê duyệt quyết toán tuân thủ nghiêm ngặt máy trạng thái hữu hạn một chiều:

```
[ CALCULATED ] ────────► [ IN_REVIEW ] ────────► [ APPROVED ] ────────► [ LOCKED ] ──► [ PAYMENT_SCHEDULED ] ──► [ PAID ]
      ▲                        │                       │                     │
      │                        ▼                       ▼                     ▼
      └── [ resolve ] ◄── [ VALIDATION_REQUIRED ] ◄────┘              (Chỉ tạo con: ADJUSTMENT / REVERSAL)
```

1. **`CALCULATED` (Đã tính toán):** Quyết toán được tạo mới từ việc chạy động cơ tính lương (`DriverPayEngine.calculate()`).
2. **`IN_REVIEW` (Đang soát xét):** Người phụ trách chuyển trạng thái qua lệnh `submitReview`.
3. **`APPROVED` (Đã phê duyệt):** Kế toán trưởng phê duyệt qua `approve`. Trước khi duyệt, hệ thống kiểm tra `SettlementRevenueGuard`: nếu doanh thu cước bị trôi lệch (`drift`), hệ thống từ chối duyệt với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE`.
4. **`LOCKED` (Đã khóa sổ):** Quản lý khóa quyết toán qua lệnh `lock`. Tại thời điểm này:
   - Các dòng thù lao (`EARNING`) có liên kết tới `load` hoặc `trip` được tự động chuyển thành chi phí vận tải thực tế (`shipment_costs`).
   - Quyết toán trở thành bất biến vĩnh viễn, **cấm tuyệt đối việc mở khóa (`unlock`)**.
5. **`VALIDATION_REQUIRED` (Yêu cầu kiểm chứng):** Khi phát hiện sai lệch số liệu (dặm, giờ công, phụ phí), bất kỳ trạng thái nào trước khi khóa đều có thể chuyển sang `VALIDATION_REQUIRED` kèm lý do. Để tiếp tục, bắt buộc phải giải quyết kiểm chứng qua `resolveValidation` để quay về `CALCULATED`.

### 5.2. Quy tắc Xử lý Chi phí & Khấu trừ Tạm ứng (Expenses & Advances)
1. **Phân loại dòng quyết toán (`SettlementLineClass`):**
   - `EARNING`: Thù lao lao động của tài xế.
   - `DEDUCTION`: Khấu trừ tiền phạt hoặc **thu hồi tiền tạm ứng (`ADVANCE`)**.
   - `REIMBURSEMENT`: Hoàn trả các khoản chi phí hợp lệ mà tài xế đã chi trả thay cho công ty.
2. **Công thức tính toán số dư thực nhận:**
   $$\text{settlementNet} = \text{grossEarnings} + \text{reimbursementAmount} - \text{deductionAmount}$$
3. **Quy tắc phân loại Chi phí Vận hành (`Shipment Costs`):**
   - Theo tài liệu kỹ thuật [`settlement-contracts.md:17`](file:///home/vumoi/logictics_api/docs/settlement-contracts.md#L17): Khi quyết toán chuyển sang `LOCKED`, chỉ các dòng `EARNING` hoặc `cost-correction` có gắn `loadId` hoặc `tripId` mới được ghi nhận vào chi phí chuyến hàng (`shipment_costs`).
   - Các khoản tạm ứng (`ADVANCE`) và hoàn trả (`REIMBURSEMENT`) **hoàn toàn không được tính vào chi phí vận hành chuyến hàng**, đảm bảo báo cáo lợi nhuận chuyến hàng (`Profitability`) không bị sai lệch.

### 5.3. Quy tắc Điều chỉnh & Hủy quyết toán đã Khóa sổ (Adjustments & Reversals)
1. **Quyết toán Điều chỉnh (`ADJUSTMENT`):**  
   - Được tạo qua `POST /api/driver-settlements/{id}/adjustments` khi quyết toán cha đã finalized (`LOCKED`, `PAYMENT_SCHEDULED`, `PAID`).
   - Quyết toán con mang loại `settlementType: "ADJUSTMENT"`, liên kết với cha qua `parentSettlementId` và tăng số thứ tự `sequenceNumber`.
   - Quyết toán con phải trải qua đầy đủ chu trình soát xét: `CALCULATED -> IN_REVIEW -> APPROVED -> LOCKED`.
2. **Quyết toán Đảo nợ Toàn phần (`REVERSAL`):**  
   - Được tạo qua `POST /api/driver-settlements/{id}/reversal`.
   - Hệ thống tự động đảo ngược toàn bộ các dòng của quyết toán cha:
     + `EARNING` chuyển thành `DEDUCTION`;
     + `DEDUCTION` chuyển thành `EARNING`;
     + `REIMBURSEMENT` chuyển thành `DEDUCTION`.
   - Một quyết toán cha chỉ được phép có tối đa một quyết toán con loại `REVERSAL` (kiểm tra tính duy nhất).

### 5.4. Quy tắc Đồng bộ Doanh thu Hóa đơn - Lương Tài xế (`BILL-DEC-006`)
1. **Khi chưa khóa sổ:**
   - Nếu hóa đơn liên quan bị thay đổi cước phí (xuất thêm supplemental, áp dụng credit note hoặc rebill), `SettlementRevenueGuard` sẽ chặn lệnh `approve` và `lock`.
   - Kế toán phải gọi lệnh `recalculate-revenue` để hệ thống nạp snapshot doanh thu mới, tính lại lương và đưa trạng thái về `CALCULATED`.
2. **Khi đã khóa sổ:**
   - Việc phát hành hóa đơn bổ sung sau khi quyết toán tài xế đã `LOCKED` sẽ tự động sinh ra một bản ghi `ADJUSTMENT` con (hoặc bản ghi kiểm toán `NO_PAY_ADJUSTMENT_REQUIRED`), tuyệt đối không sửa đổi quyết toán gốc.

---

## 6. Phân quyền

### 6.1. Ma trận đối soát phân quyền Frontend & Backend

| Vai trò người dùng (JWT Role) | Quyền UI Settlements (`roleMatrix.ts:54`) | Quyền gọi API `/api/driver-settlements/**` | Quyền Tính toán (`calculate`) | Quyền Phê duyệt / Khóa (`approve` / `lock`) | Đánh giá an ninh |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **ADMIN** | Toàn quyền (`SETTLEMENT_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Quyền quản trị tối cao. |
| **ACCOUNTANT** | Toàn quyền (`SETTLEMENT_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Kế toán đối soát doanh thu và chi phí. |
| **PAYROLL** | Toàn quyền (`SETTLEMENT_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Chuyên viên tính lương và quyết toán tài xế. |
| **PAYROLL_MANAGER** | Toàn quyền (`SETTLEMENT_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Quản lý phê duyệt và khóa sổ lương. |
| **DISPATCHER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403** | **Bị chặn 403** | **AN TOÀN:** Điều phối viên không được xem hay can thiệp thù lao tài xế. |
| **DRIVER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403** | **Bị chặn 403** | **AN TOÀN:** Tài xế không có quyền tự quyết toán lương của mình. |

### 6.2. Kiểm tra Ranh giới Đa khách hàng (Tenant Boundary)
- **Tầng database:** Bảng `driver_settlements`, `settlement_lines`, `settlement_revenue_commands` nằm trong tenant schema riêng biệt.
- **Tầng ứng dụng (Actor Mapping):** Hàm `actorId()` trong `DriverSettlementController.java:147-153` bắt buộc người dùng thực hiện các lệnh chuyển trạng thái phải ánh xạ tới một bản ghi `Employee` hợp lệ trong chính tenant đó. Nếu JWT hợp lệ nhưng không tìm thấy employee, ném lỗi 403 `ForbiddenException`.

---

## 7. Test cases

| ID | Nhóm kiểm thử | Kịch bản kiểm thử | Thao tác kiểm định | Kết quả mong đợi | Trạng thái kiểm định & Bằng chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SETTLE-01** | Happy Path | Hiển thị bảng danh sách quyết toán và format số tiền | Render `SettlementList` với mock data | Cột `settlementNumber` render link, cột `net` hiển thị tiền tệ chuẩn, hiển thị đủ các thẻ trạng thái. | `UNIT_TEST_PASS` (Component)<br>Khớp [`SettlementList.test.tsx:28-45`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementList.test.tsx#L28-L45). |
| **TC-SETTLE-02** | Happy Path | Xem chi tiết quyết toán với 5 tabs đầy đủ | Mở trang `/settlements/:id` | Hiển thị Header, Summary, Lines table, Source work, Adjustments và Audit tabs; không tải trước các tab ẩn. | `UNIT_TEST_PASS` (Component)<br>Khớp [`SettlementShow.test.tsx:40-62`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L40-L62). |
| **TC-SETTLE-03** | Workflow | Gửi duyệt quyết toán từ trạng thái CALCULATED | Bấm nút "Gửi duyệt" (`submitReview`) | Modal xác nhận hiển thị; bấm xác nhận gọi `POST .../submit-review`, trạng thái chuyển sang `IN_REVIEW`. | `UNIT_TEST_PASS` (Hook & Action)<br>Khớp [`useSettlementActions.test.tsx:24-38`](file:///home/vumoi/logictics-app/src/tests/features/settlements/useSettlementActions.test.tsx#L24-L38). |
| **TC-SETTLE-04** | Workflow | Phê duyệt quyết toán từ trạng thái IN_REVIEW | Bấm nút "Phê duyệt" (`approve`) | Gọi `POST .../approve`, trạng thái chuyển sang `APPROVED`, invalidate cache detail và list. | `UNIT_TEST_PASS` (Hook & Action)<br>Khớp [`useSettlementActions.test.tsx:40-52`](file:///home/vumoi/logictics-app/src/tests/features/settlements/useSettlementActions.test.tsx#L40-L52). |
| **TC-SETTLE-05** | Workflow | Khóa quyết toán từ trạng thái APPROVED | Bấm nút "Khóa quyết toán" (`lock`) | Gọi `POST .../lock`, trạng thái chuyển sang `LOCKED`; các nút chuyển trạng thái thông thường bị ẩn. | `UNIT_TEST_PASS` (Hook & Action)<br>Khớp [`useSettlementActions.test.tsx:54-68`](file:///home/vumoi/logictics-app/src/tests/features/settlements/useSettlementActions.test.tsx#L54-L68). |
| **TC-SETTLE-06** | Validation Workflow| Yêu cầu kiểm chứng và giải quyết kiểm chứng | Gọi `requireValidation` kèm lý do, sau đó gọi `resolveValidation` | Trạng thái chuyển sang `VALIDATION_REQUIRED` hiển thị cảnh báo vàng kèm lý do; giải quyết xong chuyển về `CALCULATED`. | `UNIT_TEST_PASS` (Component & Hook)<br>Khớp [`SettlementShow.test.tsx:95-115`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L95-L115). |
| **TC-SETTLE-07** | Immutability | Quyết toán đã LOCKED giữ nguyên Read-only | Kiểm tra các nút hành động trên quyết toán LOCKED | Không có nút Unlock hay Edit; chỉ có nút tạo con "Tạo điều chỉnh" (Adjustment) và "Đảo nợ" (Reversal). | `UNIT_TEST_PASS` (Component)<br>Khớp [`SettlementShow.test.tsx:75-88`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L75-L88). |
| **TC-SETTLE-08** | Adjustment Form| Tạo quyết toán điều chỉnh với số tiền dương | Nhập lý do, chọn loại dòng DEDUCTION (tạm ứng), nhập số tiền và bấm xác nhận | Gửi payload với `idempotencyKey` ổn định, tạo quyết toán con `ADJUSTMENT` và điều hướng sang bản ghi mới. | `UNIT_TEST_PASS` (Component)<br>Khớp [`CreateAdjustmentModal.test.tsx:25-45`](file:///home/vumoi/logictics-app/src/tests/features/settlements/CreateAdjustmentModal.test.tsx#L25-L45). |
| **TC-SETTLE-09** | Reversal | Đảo nợ quyết toán đã khóa | Bấm nút "Đảo nợ", nhập lý do đảo nợ (max 300 ký tự) | Gọi `POST .../reversal`, tạo quyết toán con `REVERSAL` đảo ngược 100% các dòng thù lao/khấu trừ. | `UNIT_TEST_PASS` (Component)<br>Khớp [`SettlementShow.test.tsx:117-135`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L117-L135). |
| **TC-SETTLE-10** | Concurrency | Chống bấm đúp (double-click) trên các nút lệnh | Kích hoạt liên tiếp 2 lệnh phê duyệt cùng lúc | Cơ chế `flight.current` ref chặn lệnh thứ hai, chỉ gửi 1 request duy nhất lên máy chủ. | `UNIT_TEST_PASS` (Hook)<br>Khớp [`useSettlementActions.test.tsx:95-108`](file:///home/vumoi/logictics-app/src/tests/features/settlements/useSettlementActions.test.tsx#L95-L108). |
| **TC-SETTLE-11** | Permission | Chặn điều phối viên DISPATCHER truy cập quyết toán | Đăng nhập với role `DISPATCHER`, truy cập `/settlements` | `ResourceAccessBoundary` chặn hiển thị; hiển thị màn hình `ForbiddenState`. API trả về 403 Forbidden. | `UNIT_TEST_PASS` (Router)<br>Khớp [`roleMatrix.ts:54`](file:///home/vumoi/logictics-app/src/providers/permissions/roleMatrix.ts#L54) và [`SettlementShow.test.tsx:137-148`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L137-L148). |
| **TC-SETTLE-12** | Route Integrity | Truy cập URL với định dạng UUID sai (malformed ID) | Truy cập `/settlements/invalid-id` | Trả về ngay `<NotFoundState />`, không phát request lỗi lên backend API. | `UNIT_TEST_PASS` (Component)<br>Khớp [`SettlementShow.test.tsx:149-158`](file:///home/vumoi/logictics-app/src/tests/pages/settlements/SettlementShow.test.tsx#L149-L158). |
| **TC-SETTLE-13** | Revenue Consistency| Phát hiện doanh thu hóa đơn bị thay đổi khi phê duyệt | Hóa đơn bị thay đổi cước; gọi `POST .../approve` | Backend `SettlementRevenueGuard` từ chối với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE`. | `SOURCE_REVIEWED`<br>Khớp logic [`SettlementRevenueGuard.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/SettlementRevenueGuard.java) và `BILL-DEC-006`. |
| **TC-SETTLE-14** | Advance Deduction | Tự động khấu trừ tiền tạm ứng của tài xế | Tài xế có bản ghi Expense loại `ADVANCE` $200 trong kỳ | Động cơ tính lương tự động sinh dòng `DEDUCTION` $200, trừ vào `settlementNet`. | `SOURCE_REVIEWED`<br>Khớp logic [`DriverPayEngine.java:166-181`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/DriverPayEngine.java#L166-L181). |
| **TC-SETTLE-15** | Expense Currency | Chi phí hoặc tạm ứng lệch tiền tệ với chính sách lương | Lương tính bằng `VND`, expense tính bằng `USD` | Backend từ chối tính lương với lỗi 422: `CURRENCY_MISMATCH`. | `SOURCE_REVIEWED`<br>Khớp [`DriverPayEngine.java:172`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/DriverPayEngine.java#L172). |
| **TC-SETTLE-16** | Duplicate Source | Chống tái sử dụng chi phí/công việc đã quyết toán | Chạy tính lương cho kỳ chồng lấn đã có settlement | Backend ném lỗi `SOURCE_ALREADY_SETTLED`, chặn trùng lặp chi trả. | `SOURCE_REVIEWED`<br>Khớp [`DriverPayEngine.java:182`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/DriverPayEngine.java#L182). |
| **TC-SETTLE-17** | Shipment Cost Sync | Tự động tạo chi phí vận tải khi khóa sổ | Khóa quyết toán có 2 dòng lương gắn với `loadId` | Backend tạo 2 bản ghi `shipment_costs` tương ứng với ID bất biến; dòng tạm ứng không tạo cost. | `SOURCE_REVIEWED`<br>Khớp [`DriverPayEngine.java:240`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/payroll/DriverPayEngine.java#L240) và migration V13. |
| **TC-SETTLE-18** | UI Missing Action | Hiển thị thao tác khi gặp lỗi SETTLEMENT_REVENUE_BASIS_STALE | Kế toán bị lỗi 409 khi duyệt quyết toán | **LỖI (BUG-SETTLE-01):** UI chỉ hiện Alert đỏ, không có nút bấm "Tính lại doanh thu" để khắc phục lỗi. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`SettlementActions.tsx:14-22`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementActions.tsx#L14-L22). |

---

## 8. Confirmed bugs

### BUG-SETTLE-01: Thiếu Nút bấm và Modal "Tính lại Doanh thu" (Recalculate Revenue) trên Giao diện khi gặp Lỗi SETTLEMENT_REVENUE_BASIS_STALE
- **Mã lỗi:** `BUG-SETTLE-01`
- **Mức độ nghiêm trọng:** **P1** (High — Business Process Blocker / Missing UI Recovery Action)
- **Phân loại:** `BUG_CONFIRMED` (Xác nhận qua đối soát mã nguồn Frontend & Backend API)
- **Mô tả:**
  - Theo quy tắc kiến trúc `BILL-DEC-006` và tài liệu [`settlement-billing-revenue-consistency.md:15-22`](file:///home/vumoi/logictics_api/docs/settlement-billing-revenue-consistency.md#L15-L22): Khi một hóa đơn vận tải có sự thay đổi về doanh thu (ví dụ bổ sung phụ phí Supplemental hoặc áp dụng Credit Note) trước khi quyết toán tài xế được khóa, backend `SettlementRevenueGuard` sẽ chặn lệnh Phê duyệt (`approve`) hoặc Khóa (`lock`) với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE`.
  - Để khắc phục và tiếp tục quy trình, nhân viên kế toán bắt buộc phải thực thi lệnh Tính lại doanh thu (`POST /api/driver-settlements/{id}/recalculate-revenue`) để nạp snapshot doanh thu mới và đưa quyết toán về trạng thái `CALCULATED`.
  - Backend đã hỗ trợ đầy đủ API này tại [`DriverSettlementController.java:30-35`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/DriverSettlementController.java#L30-L35). Phía frontend cũng đã viết sẵn hàm client API tại [`settlementRevenue.api.ts:10-14`](file:///home/vumoi/logictics-app/src/features/settlements/api/settlementRevenue.api.ts#L10-L14).
  - **TUY NHIÊN**, trên giao diện trang chi tiết [`SettlementShow.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementShow.tsx) và thanh công cụ hành động [`SettlementActions.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementActions.tsx), **hoàn toàn KHÔNG CÓ nút bấm hay modal nào cho phép kế toán thực thi lệnh này**!
  - Hậu quả: Khi gặp lỗi `SETTLEMENT_REVENUE_BASIS_STALE`, giao diện chỉ hiển thị thông báo lỗi màu đỏ. Người dùng kế toán **bị tắc nghẽn hoàn toàn**, không thể bấm bất kỳ thao tác nào trên web để giải quyết lỗi và không thể đưa bảng quyết toán tài xế đi tiếp chu trình duyệt lương!
- **Bước tái hiện:**
  1. Tạo quyết toán tài xế theo tỷ lệ % doanh thu cho đơn hàng L-101. Trạng thái là `IN_REVIEW`.
  2. Bên phân hệ Hóa đơn, kế toán xuất thêm một hóa đơn phụ phí Supplemental cho đơn hàng L-101.
  3. Quay lại trang chi tiết quyết toán `/settlements/:id`, bấm nút "Phê duyệt" (`approve`).
  4. Hệ thống báo lỗi 409: `SETTLEMENT_REVENUE_BASIS_STALE`.
- **Kết quả mong đợi:** Giao diện hiển thị nút hoặc modal hành động: *"Tính lại doanh thu"* (Recalculate Revenue) để kế toán bấm cập nhật lại số liệu.
- **Kết quả thực tế (từ Source Review):** Không có nút bấm hay modal nào. Người dùng không thể thực hiện lệnh `recalculate-revenue` từ giao diện người dùng.
- **Đề xuất sửa:** Trong [`SettlementActions.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementActions.tsx) và [`useSettlementActions.ts`](file:///home/vumoi/logictics-app/src/features/settlements/hooks/useSettlementActions.ts), bổ sung nút hành động "Tính lại doanh thu" (hiển thị khi gặp lỗi `SETTLEMENT_REVENUE_BASIS_STALE` hoặc khi quyết toán chưa khóa) mở modal xác nhận gọi `POST /api/driver-settlements/{id}/recalculate-revenue`.

---

## 9. Unverified risks

### RISK-SETTLE-01: Phân trang Phía Client (Client-side Pagination) gây Nguy cơ Giảm Hiệu năng khi Dữ liệu Lớn
- **Mã nguy cơ:** `RISK-SETTLE-01`
- **Mức độ rủi ro:** **P2** (Medium — Performance & Scalability)
- **Phân loại:** `RISK_UNVERIFIED` (Suy luận từ phân tích mã nguồn)
- **Mô tả:**
  - Endpoint backend `GET /api/driver-settlements` ([`DriverSettlementController.java:44-54`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/DriverSettlementController.java#L44-L54)) trả về toàn bộ danh sách `List<DriverSettlementView>` mà không nhận tham số phân trang (`page`, `pageSize`, `Pageable`).
  - Phía frontend [`SettlementList.tsx:184-188`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementList.tsx#L184-L188) cấu hình phân trang tại client: `pagination={{ pageSize: 15 }}`.
  - Rủi ro: Khi doanh nghiệp vận hành lâu năm với hàng chục nghìn lượt quyết toán tài xế, mỗi lần vào trang `/settlements`, toàn bộ hàng chục nghìn bản ghi (kèm danh sách chi tiết) sẽ bị tải ồ ạt về trình duyệt, gây nghẽn băng thông mạng, tăng thời gian phản hồi (TTFB) và làm tràn bộ nhớ trình duyệt của người dùng.

### RISK-SETTLE-02: Nguy cơ Sai lệch Kỳ Lương do Sử dụng Múi giờ UTC Cứng
- **Mã nguy cơ:** `RISK-SETTLE-02`
- **Mức độ rủi ro:** **P3** (Low — Timezone Edge Case)
- **Phân loại:** `RISK_UNVERIFIED` (Xác nhận từ tài liệu `settlement-contracts.md:7`)
- **Mô tả:**
  - Tài liệu đặc tả ghi rõ: *"settlement period boundaries currently use UTC. Region-specific payroll jurisdiction does not silently change historical settlement calendar semantics."*
  - Toàn bộ ranh giới ngày bắt đầu và kết thúc kỳ lương của tài xế được tính theo múi giờ UTC. Tại Việt Nam (UTC+7), một chuyến hàng hoàn thành lúc 02:00 sáng ngày 01/04 (giờ VN) thì theo giờ UTC vẫn là ngày 31/03. Nếu kế toán viên không nắm rõ quy tắc này, có thể thắc mắc tại sao chuyến hàng lại rơi vào kỳ thanh toán của tháng trước.

---

## 10. Missing functionality

1. **`[NOT_IMPLEMENTED]` Thiếu Thao tác Phục hồi Biến động Doanh thu (Recalculate Revenue UI Action):**  
   Như đã phân tích tại `BUG-SETTLE-01`, backend đã có API và frontend đã có hàm client, nhưng UI chưa tích hợp nút gọi lệnh phục hồi doanh thu.
2. **`[NOT_IMPLEMENTED]` Chưa có Tính năng Xuất Bảng Quyết toán Tài xế định dạng PDF / Excel:**  
   Trong quy trình quản lý đội xe thực tế, sau khi khóa quyết toán, kế toán cần in hoặc gửi file PDF "Phiếu quyết toán cước tài xế" (Driver Settlement Statement) có liệt kê rõ chi tiết từng chuyến hàng, số dặm, phụ phí, hoàn trả chi phí và các khoản khấu trừ tạm ứng để tài xế đối soát và ký xác nhận. Hệ thống hiện chưa có endpoint hay component kết xuất file PDF này.
3. **`[NOT_IMPLEMENTED]` Chưa có Endpoint Phân trang Server-side cho Danh sách Quyết toán:**  
   Backend chưa hỗ trợ `Pageable` cho API danh sách quyết toán.

---

## 11. Integration issues

1. **Đồng bộ Hai chiều giữa Quyết toán Tài xế (Settlements) và Chi phí Vận tải (Shipment Costs):**  
   - Cơ chế một chiều từ Settlements sang Shipment Costs hoạt động rất tốt: Khi quyết toán chuyển sang `LOCKED`, các dòng thù lao tự động sinh ra `shipment_costs`.
   - Tuy nhiên, chiều ngược lại: Nếu một chi phí phát sinh (`Expense` tạm ứng hoặc tiền phạt) bị chỉnh sửa sau khi đã chạy tính toán quyết toán nhưng trước khi khóa, hệ thống chưa có cơ chế tự động cảnh báo `expense drift` (tương tự như `revenue drift` của hóa đơn). Kế toán phải tự nhớ xóa quyết toán đi tính lại.
2. **Tích hợp với Bảng Lương Tổng thể (Payroll Runs):**  
   - Sau khi quyết toán ở trạng thái `LOCKED`, nó sẵn sàng để được gom vào bảng lương `PayrollRun` (`LOCKED -> PAYMENT_SCHEDULED -> PAID`).
   - Việc đồng bộ trạng thái khi thanh toán lương qua module Payroll hoạt động đúng thiết kế thông qua các lệnh liên kết.

---

## 12. Test execution evidence

Đã thực thi kiểm tra toàn bộ các bộ test tự động chuyên biệt cho phân hệ Settlements và các thành phần liên quan trong phiên làm việc:

```bash
# 1. Chạy toàn bộ các test suite cho phân hệ Settlements
$ npx vitest run src/tests/features/settlements/ src/tests/pages/settlements/ src/tests/types/settlement.contract.test.ts
Test Files  9 passed (9)
     Tests  48 passed (48)
  Duration  14.31s
Exit code: 0 (PASS)

# Chi tiết 9 test suites đã vượt qua:
✓ src/tests/pages/settlements/SettlementShow.test.tsx (8 tests pass)
  - Sử dụng số liệu tổng, nguồn công việc và bằng chứng thời gian từ backend; không tải trước các tab ẩn
  - Yêu cầu xác nhận khi thực thi hành động, vô hiệu hóa nút khi đang xử lý, chỉ refetch bản ghi hiện tại
  - Khóa quyết toán LOCKED thành read-only, chỉ cung cấp thao tác tạo quyết toán điều chỉnh con
  - Khóa quyết toán PAID thành read-only, chỉ cho phép tạo điều chỉnh con
  - Hiển thị thông báo kiểm chứng kèm lý do và chỉ cho phép thao tác giải quyết kiểm chứng
  - Yêu cầu nhập lý do đảo nợ và gửi lệnh tạo quyết toán con REVERSAL
  - Chặn các URL không có quyền hoặc sai định dạng UUID tiếp cận API
  - Phân biệt rõ các trạng thái Loading, Empty và Lỗi truy vấn kèm nút thử lại
✓ src/tests/pages/settlements/SettlementList.test.tsx (5 tests pass)
✓ src/tests/features/settlements/useSettlementActions.test.tsx (11 tests pass)
  - Chỉ cho phép các bước chuyển trạng thái hợp lệ cho từng state (CALCULATED, IN_REVIEW, APPROVED, VALIDATION_REQUIRED, LOCKED, PAID, CANCELLED)
  - Chặn lệnh trực tiếp từ người dùng không có thẩm quyền
  - Chặn các lệnh sai trạng thái dù có quyền
  - Đảm bảo single-flight chống bấm đúp và chỉ invalidate cache của tenant hiện tại
  - Giữ nguyên lỗi xung đột nghiệp vụ, không xóa cache khi lỗi, cho phép thử lại
✓ src/tests/features/settlements/settlementColumns.test.tsx (6 tests pass)
✓ src/tests/pages/settlements/DriverPayPolicyList.test.tsx (3 tests pass)
✓ src/tests/features/settlements/DriverPayPolicyForm.test.tsx (4 tests pass)
✓ src/tests/features/settlements/CreateAdjustmentModal.test.tsx (2 tests pass)
  - Bắt buộc nhập lý do và số tiền dương rõ ràng, không sửa đổi lịch sử quyết toán cha
  - Ánh xạ đúng trường dữ liệu server, giữ nguyên idempotencyKey khi retry, liên kết quyết toán con
✓ src/tests/features/settlements/settlement.query.test.tsx (3 tests pass)
✓ src/tests/types/settlement.contract.test.ts (6 tests pass)

# 2. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - 0 lỗi compile)

# 3. Kiểm tra định dạng Git Diff
$ git diff --check
Exit code: 0 (PASS - Không vi phạm định dạng whitespace)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Ghi nhận bằng chứng:**  
> - Các kết quả `UNIT_TEST_PASS` được kiểm chứng bởi 48 test cases tự động chạy bằng Vitest trên **tầng giao diện, hooks, components và contracts với dữ liệu mock**.  
> - Các kết quả ghi `SOURCE_REVIEWED` là kết quả đối soát mã nguồn trực tiếp từ `DriverSettlementController.java`, `DriverPayEngine.java`, `SettlementRevenueGuard.java`, `SettlementReconciliationService.java` và migration SQL V10/V13/V28/V29 của backend `logictics_api`.  
> - **Chưa có kiểm thử tích hợp Runtime/Backend Live (Live Backend Integration):** Phiên làm việc không kết nối tới môi trường database PostgreSQL live cục bộ nhằm tuân thủ quy tắc an toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-SETTLE-01` | Process Blocker | **Bổ sung Nút bấm & Modal "Tính lại Doanh thu" trên UI:** Trong `SettlementActions.tsx` và `useSettlementActions.ts`, tích hợp nút "Tính lại doanh thu" khi nhận lỗi 409 `SETTLEMENT_REVENUE_BASIS_STALE`, gọi `POST /api/driver-settlements/{id}/recalculate-revenue` để giải phóng tắc nghẽn quy trình phê duyệt. | [`src/features/settlements/components/SettlementActions.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementActions.tsx)<br>[`src/features/settlements/hooks/useSettlementActions.ts`](file:///home/vumoi/logictics-app/src/features/settlements/hooks/useSettlementActions.ts) |
| **P2** | `RISK-SETTLE-01`| Performance | **Triển khai Phân trang Server-side (Pageable):** Cập nhật `DriverSettlementController.list` nhận các tham số `page`, `pageSize`, `Sort` và trả về `PagedResponse<DriverSettlementView>` để tránh quá tải bộ nhớ client khi số lượng bản ghi lớn. | `.../controller/DriverSettlementController.java`<br>[`src/pages/settlements/SettlementList.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementList.tsx) |
| **P3** | `NOT_IMPLEMENTED`| Feature Gap | **Xây dựng Tính năng In / Xuất Phiếu Quyết toán PDF:** Bổ sung component và template xuất file PDF "Driver Settlement Statement" chi tiết để gửi cho tài xế ký nhận trước khi trả lương. | [`src/pages/settlements/SettlementShow.tsx`](file:///home/vumoi/logictics-app/src/pages/settlements/SettlementShow.tsx) |
| **P3** | `RISK-SETTLE-02`| UX / Timezone | **Hiển thị Chú thích Múi giờ UTC trên Bộ lọc Kỳ lương:** Thêm tooltip hoặc chú thích rõ ràng tại bộ chọn kỳ lương: *"Ranh giới kỳ lương được xác định theo múi giờ UTC"* để người dùng không nhầm lẫn với giờ địa phương. | [`src/features/settlements/components/SettlementFilters.tsx`](file:///home/vumoi/logictics-app/src/features/settlements/components/SettlementFilters.tsx) |
