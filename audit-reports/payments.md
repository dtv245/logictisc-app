# AUDIT: payments

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `payments` (Thanh toán, thanh toán một phần, chống trùng)  
> **Thời điểm kiểm định:** 25/10/2026  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát đa tầng (Frontend React Refine & Backend Spring Boot API / Postgres Locks & Triggers), kiểm tra máy trạng thái thanh toán, cơ chế giữ chỗ công nợ (Balance Reservation), thuật toán chống trùng dấu vân tay (Fingerprint Idempotency), đối soát quy tắc bất biến tài chính (Financial Immutability), và thực thi bộ kiểm thử tự động (Unit/Contract Tests với mock).

---

## 1. Tổng quan chức năng

Phân hệ **Quản lý Thu tiền & Thanh toán Hóa đơn (Customer Payments / Accounts Receivable Collections)** là thành phần trọng yếu trong quản trị dòng tiền đầu vào của hệ thống TMS LogisticsX. Phân hệ chịu trách nhiệm tiếp nhận, ghi nhận và xử lý các khoản thanh toán từ khách hàng cho các hóa đơn vận tải (Customer Invoices).

### Đặc điểm kỹ thuật cốt lõi của phân hệ Payments:
1. **Mô hình Lệnh Kế toán Chuyên biệt (Dedicated Flat Payment Commands):**  
   - Không sử dụng generic CRUD thông thường để ghi dữ liệu thanh toán. Tuyến đường ghi dữ liệu qua API chỉ hỗ trợ 3 lệnh: Tạo mới (`create` với trạng thái `PENDING`), Sửa thông tin ghi chú (`update` metadata), và Hủy thanh toán (`cancel`).
   - Cấm hoàn toàn việc xóa vật lý bản ghi thanh toán (`DELETE` bị cấm cứng ở cả tầng Controller và Database Trigger).
2. **Cơ chế Giữ chỗ Số dư (Payment Balance Reservation):**  
   - Khoản thanh toán khi khởi tạo được ghi nhận ở trạng thái `PENDING` và đóng vai trò **giữ chỗ (reservation)** trên số dư còn lại của hóa đơn để chống tình trạng thu vượt công nợ (over-payment) khi có nhiều giao dịch xử lý đồng thời.
3. **Chống trùng lặp & Bảo đảm Idempotency Tuyệt đối (Idempotency Protection):**  
   - Áp dụng khóa tư vấn cấp tenant (`Tenant-local Advisory Lock`) trước khi truy vấn key;
   - Áp dụng khóa dòng bi quan trên hóa đơn (`Pessimistic Row Lock` qua `findByIdForUpdate`);
   - Tạo dấu vân tay chuẩn hóa 14 trường dữ liệu (`PAYMENT_CREATE_V1` hash). Replay an toàn nếu gửi lại cùng dữ liệu; phát hiện và chặn đứng xung đột (`409 Conflict: PAYMENT_IDEMPOTENCY_CONFLICT`) nếu cùng key nhưng sai khác dữ liệu.
4. **Bảo vệ Tính Bất biến của Lịch sử Tài chính (Financial Immutability):**  
   - Các trường tài chính cốt lõi (`amountAmount`, `amountCurrency`, `invoiceId`, `status`, `idempotencyKey`, `recordedAt`, `recordedByUserId`, địa chỉ billing) là bất biến sau khi tạo. Bất kỳ nỗ lực sửa đổi nào qua API đều bị từ chối với lỗi `409 Conflict: PAYMENT_FINANCIAL_FIELDS_IMMUTABLE`.
   - Migration V38 thiết lập bảng sự kiện bất biến `payment_command_events` và trigger bảo vệ `guard_payment_command_state` ở tầng cơ sở dữ liệu.

### Các phân hệ mã nguồn tham gia luồng Payments:
1. **Frontend Refine & Dedicated Commands:**
   - Tuyến đường: `/payments`, `/payments/show/:id`, `/payments/create`, `/payments/edit/:id` ([`src/pages/payments/`](file:///home/vumoi/logictics-app/src/pages/payments/)).
   - Bảng danh sách & Cột nghiệp vụ: [`src/features/payments/components/columns.tsx`](file:///home/vumoi/logictics-app/src/features/payments/components/columns.tsx).
   - Form thao tác lệnh thanh toán: [`src/features/payments/components/PaymentCommandForm.tsx`](file:///home/vumoi/logictics-app/src/features/payments/components/PaymentCommandForm.tsx).
   - Client API & Đóng băng Intent: [`src/features/payments/api/paymentCommands.ts`](file:///home/vumoi/logictics-app/src/features/payments/api/paymentCommands.ts).
   - Khai báo Resource Refine: [`src/features/payments/payments.resource.ts`](file:///home/vumoi/logictics-app/src/features/payments/payments.resource.ts).
   - Ràng buộc cấu hình năng lực: [`src/components/resources/resourceCapabilities.ts:23`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L23).
2. **Backend Spring Boot API & Database Engine:**
   - Bộ điều khiển API: [`com.company.logicstic.controller.PaymentController.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/PaymentController.java).
   - Dịch vụ xử lý thanh toán: [`com.company.logicstic.service.PaymentService.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java).
   - DTO & Payload Contracts: `CreatePaymentRequest.java`, `UpdatePaymentRequest.java`, `PaymentView.java`.
   - Cơ sở dữ liệu & Triggers: `V36__add_payment_financial_integrity_and_idempotency.sql` và `V38__protect_payment_command_history.sql`.
   - Đối soát báo cáo doanh thu & công nợ: [`com.company.logicstic.service.calculation.RevenueCalculator.java:71-84`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/calculation/RevenueCalculator.java#L71-L84).

---

## 2. Danh sách route

| Đường dẫn URL | Component phụ trách | Mounting Runtime | Rào chắn phân quyền / Capability Gate | Hành vi chuyển hướng & Trải nghiệm thực tế |
| :--- | :--- | :--- | :--- | :--- |
| `/payments` | `PaymentList` ([`src/pages/payments/list.tsx`](file:///home/vumoi/logictics-app/src/pages/payments/list.tsx)) | Refine Resource Router tại [`src/pages/index.ts:238`](file:///home/vumoi/logictics-app/src/pages/index.ts#L238) | `ResourceAccessBoundary` (`action="list", resource="payments"`). | Yêu cầu đăng nhập (`ProtectedRoute`) và tenant (`TenantGuard`). Chỉ người dùng thuộc nhóm `ACCOUNTING` (`ADMIN`, `ACCOUNTANT`) được truy cập. Các vai trò khác bị chặn 403. Nút "Create" trên thanh tiêu đề bảng bị **ẨN** do capability `create: false`. |
| `/payments/show/:id` | `PaymentShow` ([`src/pages/payments/show.tsx`](file:///home/vumoi/logictics-app/src/pages/payments/show.tsx)) | Refine Resource Router tại [`src/pages/index.ts:238`](file:///home/vumoi/logictics-app/src/pages/index.ts#L238) | `ResourceAccessBoundary` (`action="show", resource="payments"`). | Hiển thị thông tin phiếu thu qua `ResourceShowPage`. Khung hủy thanh toán `<PaymentCommandForm action="cancel" />` ở cuối trang bị **ẨN** ở runtime do phụ thuộc cờ `PAYMENT_COMMANDS_RUNTIME_VERIFIED`. |
| `/payments/create` | `PaymentCreate` ([`src/pages/payments/create.tsx`](file:///home/vumoi/logictics-app/src/pages/payments/create.tsx)) | Refine Resource Router tại [`src/pages/index.ts:238`](file:///home/vumoi/logictics-app/src/pages/index.ts#L238) | `ResourceAccessBoundary` (`action="create", resource="payments"`). | **BỊ KHÓA Ở RUNTIME (FEATURE_GATED):** Khi người dùng truy cập trực tiếp URL, `PaymentCommandForm.tsx:26` kiểm tra `if (!runtimeVerified)` và hiển thị thông báo cảnh báo màu vàng: *"Waiting for backend runtime verification"*, hoàn toàn không hiển thị form nhập liệu. |
| `/payments/edit/:id` | `PaymentEdit` ([`src/pages/payments/edit.tsx`](file:///home/vumoi/logictics-app/src/pages/payments/edit.tsx)) | Refine Resource Router tại [`src/pages/index.ts:238`](file:///home/vumoi/logictics-app/src/pages/index.ts#L238) | `ResourceAccessBoundary` (`action="edit", resource="payments"`). | **BỊ KHÓA Ở RUNTIME (FEATURE_GATED):** Tương tự route Create, form bị chặn hiển thị cảnh báo `contractAlignment.runtimePending`. Nút Edit trên danh sách và show page cũng bị ẩn hoàn toàn do capability `edit: false`. |

> [!NOTE]
> **Cấu hình Capability Gate:**  
> Tại [`src/components/resources/resourceCapabilities.ts:23`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L23):
> ```typescript
> payments: {
>   create: PAYMENT_COMMANDS_RUNTIME_VERIFIED,
>   delete: false,
>   edit: PAYMENT_COMMANDS_RUNTIME_VERIFIED
> }
> ```
> Vì hằng số `PAYMENT_COMMANDS_RUNTIME_VERIFIED = false` tại [`paymentCommands.ts:10`](file:///home/vumoi/logictics-app/src/features/payments/api/paymentCommands.ts#L10), toàn bộ các nút tạo mới (`Create`), chỉnh sửa (`Edit`) và xóa (`Delete`) đều bị vô hiệu hóa hoặc ẩn khỏi giao diện người dùng.

---

## 3. Danh sách UI action

| ID | Vùng màn hình | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-PAY-01** | Bảng danh sách `/payments`: Số tham chiếu | `Link` (table-number-link) | Chuyển hướng router | Không gọi API (Client Navigation) | Click vào `referenceNumber` điều hướng sang màn hình xem chi tiết `/payments/show/:id`. Nếu rỗng hiển thị `—`. |
| **ACT-PAY-02** | Bảng danh sách: Cột số tiền | Text hiển thị (`MoneyCell`) | `formatPaymentAmount()` | Không gọi API | Format số tiền theo tiền tệ bản ghi (`amountCurrency`), căn phải, class `tabular-nums`. |
| **ACT-PAY-03** | Bảng danh sách: Cột trạng thái | `StatusTag` | Ánh xạ qua `paymentStatusMap` | Không gọi API | Hiển thị tag màu ngữ nghĩa: `succeeded` (xanh), `pending` (vàng), `failed` (đỏ). |
| **ACT-PAY-04** | Bảng danh sách: Cột hóa đơn | `Link` (table-number-link) | Chuyển hướng router | Không gọi API (Client Navigation) | Click vào số hóa đơn (`#invoiceNumber` hoặc `invoiceId`) điều hướng sang `/invoices/show/:invoiceId`. |
| **ACT-PAY-05** | Bảng danh sách: Cột thời gian ghi nhận | Text hiển thị | `formatDateTime()` | Không gọi API | Format ngày giờ ghi nhận `recordedAt` theo locale `vi-VN`. |
| **ACT-PAY-06** | Bảng danh sách: Nút "Create" | `Button` (Create) | `navigate("/payments/create")` | Không gọi API | **BỊ ẨN (FEATURE_GATED):** Ẩn hoàn toàn trên bảng danh sách do `resourceCapabilities.payments.create = false`. |
| **ACT-PAY-07** | Bảng danh sách: Cột hành động | Nút "Edit" / "Delete" | `ActionButtons` | Không gọi API | **BỊ ẨN:** Cả hai nút Edit và Delete đều không hiển thị do capability đều là `false`. Chỉ hiển thị nút "Show" (Xem chi tiết). |
| **ACT-PAY-08** | Form tạo `/payments/create`: Khởi tạo | Màn hình tải trang | Render `PaymentCommandForm` | Không gọi API | **BỊ CHẶN (FEATURE_GATED):** Hiển thị Alert warning: *"Waiting for backend runtime verification"*. Form không render các ô nhập liệu. |
| **ACT-PAY-09** | Form tạo `/payments/create`: Bấm "Save" | `Button` ("Save") | `commands.create(values)` | `POST /api/payments` | *(Khi mở gate)*: Gửi lệnh tạo thanh toán PENDING kèm `idempotencyKey` và `inputHash`. Chống bấm đúp (double-click) qua `flight.current` ref. |
| **ACT-PAY-10** | Form tạo `/payments/create`: Xử lý Timeout / Retry | `Button` ("Retry") | `commands.retryCreate()` | `POST /api/payments` | *(Khi mở gate)*: Khi xảy ra lỗi mạng hoặc timeout, nút chuyển thành "Retry", gửi lại chính xác cùng payload và cùng `idempotencyKey` ban đầu mà không tạo ra key mới. |
| **ACT-PAY-11** | Form sửa `/payments/edit/:id`: Bấm "Save" | `Button` ("Save") | `commands.update(id, values)` | `PUT /api/payments/{id}` | *(Khi mở gate)*: Chỉ gửi `description` và `referenceNumber`. Nếu thanh toán không ở trạng thái PENDING, form hiển thị cảnh báo `paymentCommands.pendingOnly` và chặn thao tác. |
| **ACT-PAY-12** | Form sửa `/payments/edit/:id`: Nút "Xóa mô tả" | `Button` | `form.setFieldValue("description", null)` | Không gọi API | Gán giá trị `null` rõ ràng cho trường `description` để xóa mô tả trên máy chủ. |
| **ACT-PAY-13** | Trang chi tiết `/payments/show/:id`: Form Hủy thanh toán | Form Cancel | `commands.cancel(id, reason)` | `POST /api/payments/{id}/cancel` | **BỊ ẨN (FEATURE_GATED):** Bị ẩn ở runtime do cờ `PAYMENT_COMMANDS_RUNTIME_VERIFIED = false`. *(Khi mở gate)*: Cho phép nhập `reason` (1..1000 ký tự) để hủy payment PENDING. |

---

## 4. API liên quan

### 4.1. Bảng đối soát Endpoints phân hệ Payments

| Phương thức | Endpoint | Controller / Service Backend | Request Body / Params | Response Model |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/payments` | `PaymentController.search` | `status?, invoiceId?, page=1, pageSize=20, orderBy="recordedAt", descending=true` | `ApiResponse<PagedResponse<PaymentView>>` |
| `GET` | `/api/payments/{id}` | `PaymentController.getById` | *Path variable: id (UUID)* | `ApiResponse<PaymentView>` |
| `POST` | `/api/payments` | `PaymentController.create` | `CreatePaymentRequest`: `{ status="PENDING", invoiceId, amountAmount, amountCurrency, idempotencyKey, billingAddressLine1, billingAddressCity, billingAddressState, billingAddressZipCode, billingAddressCountry, description?, referenceNumber?, stripePaymentMethodId?, stripePaymentIntentId?, recordedAt=null }` | `ApiResponse<PaymentView>` (HTTP 201 Created) |
| `PUT` | `/api/payments/{id}` | `PaymentController.update` | `UpdatePaymentRequest`: `{ description?, referenceNumber? }` *(Chặn mọi trường tài chính khác)* | `ApiResponse<PaymentView>` (HTTP 200 OK) |
| `POST` | `/api/payments/{id}/cancel` | `PaymentController.cancel` | *Path variable: id (UUID); Query param: `reason` (String, max 1000 ký tự, không rỗng)* | `ApiResponse<PaymentView>` (HTTP 200 OK) |
| `DELETE` | `/api/payments/{id}` | `PaymentController.delete` | *Path variable: id (UUID)* | **Luôn trả về lỗi 409 Conflict: `PAYMENT_DELETE_FORBIDDEN`** |

### 4.2. Xử lý mã phản hồi HTTP và Khung lỗi

- **HTTP 200 OK / 201 Created:** Xử lý trả về bọc trong cấu trúc `ApiResponse.data`.
- **HTTP 400 Bad Request:**
  - `VALIDATION_FAILED`: Khi thiếu các trường bắt buộc của Jakarta Bean Validation (`invoiceId`, `idempotencyKey`, các trường billing address).
  - `PAYMENT_COMMAND_INVALID`: Khi `idempotencyKey` rỗng hoặc dài quá 200 ký tự ([`PaymentService.java:128`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L128)).
  - `PAYMENT_CREATION_STATE_INVALID`: Khi client gửi `status` khác `PENDING` hoặc cố tình truyền giá trị cho trường `recordedAt` ([`PaymentService.java:130`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L130)).
  - `PAYMENT_AMOUNT_INVALID`: Khi số tiền thanh toán `<= 0`, hoặc có nhiều hơn 2 chữ số thập phân (scale > 2), hoặc vượt quá định dạng `NUMERIC(18,2)` ([`PaymentService.java:132`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L132)).
  - `PAYMENT_CURRENCY_UNSUPPORTED`: Khi mã tiền tệ không phải mã ISO hợp lệ hoặc không có chữ số thập phân tiêu chuẩn ([`PaymentService.java:135`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L135)).
  - `PAYMENT_METADATA_REQUIRED`: Khi gọi `PUT` với request body rỗng ([`PaymentService.java:88`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L88)).
  - `PAYMENT_CANCEL_REASON_REQUIRED`: Khi gọi `/cancel` nhưng thiếu param `reason`, hoặc `reason` rỗng, hoặc vượt quá 1000 ký tự ([`PaymentService.java:103`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L103)).
- **HTTP 403 Forbidden:**
  - Phân quyền URL: Cấu hình `SecurityConfig.java:84-85` yêu cầu vai trò `ADMIN` hoặc `ACCOUNTANT`.
  - Phân quyền Actor: `PaymentService.actor()` yêu cầu người dùng phải ánh xạ tới nhân viên hợp lệ của tenant (`requireMappedEmployee()`), nếu không ném 403: *"Authorized accounting employee required"*.
- **HTTP 404 Not Found:**
  - `ResourceNotFoundException`: Khi `paymentId` hoặc `invoiceId` không tồn tại trong tenant schema.
- **HTTP 409 Conflict:**
  - `PAYMENT_IDEMPOTENCY_CONFLICT`: Khi gửi cùng một `idempotencyKey` nhưng nội dung dữ liệu tạo mới bị thay đổi so với lần gọi trước ([`PaymentService.java:55`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L55)).
  - `PAYMENT_INVOICE_NOT_COLLECTIBLE`: Khi hóa đơn không ở trạng thái thu tiền (`ISSUED`, `SENT`, `PARTIALLY_PAID`), hoặc hóa đơn có dấu kinh tế âm (`economicSign < 0`), hoặc là hóa đơn điều chỉnh giảm (`invoicePurpose == 'CREDIT'`) ([`PaymentService.java:62`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L62)).
  - `PAYMENT_LEGACY_STATE_UNRESOLVED`: Khi lịch sử thanh toán của hóa đơn chứa bản ghi có số tiền không hợp lệ (`amount <= 0`) hoặc trạng thái không thuộc tập cho phép ([`PaymentService.java:70,163`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L70)).
  - `PAYMENT_FINANCIAL_FIELDS_IMMUTABLE`: Khi cố tình sửa đổi các trường tài chính qua `PUT /api/payments/{id}` ([`PaymentService.java:89`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L89)).
  - `PAYMENT_METADATA_STATE_CONFLICT`: Khi cố tình sửa metadata của một thanh toán không còn ở trạng thái `PENDING` ([`PaymentService.java:91`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L91)).
  - `PAYMENT_CANCEL_STATE_CONFLICT`: Khi cố tình hủy một thanh toán không ở trạng thái `PENDING` (ví dụ đã SETTLED, SUCCEEDED...) ([`PaymentService.java:106`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L106)).
  - `PAYMENT_DELETE_FORBIDDEN`: Khi gọi `DELETE /api/payments/{id}`. Hệ thống từ chối xóa vật lý và hướng dẫn chuyển sang hủy thanh toán ([`PaymentService.java:114`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L114)).
- **HTTP 422 Unprocessable Content:**
  - `PAYMENT_EXCEEDS_INVOICE_BALANCE`: Khi số tiền thanh toán vượt quá số dư còn lại của hóa đơn sau khi đã trừ đi các khoản giữ chỗ (`request.amountAmount() > invoice.totalAmount - reserved`) ([`PaymentService.java:75`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L75)).
  - `CURRENCY_MISMATCH`: Khi loại tiền tệ của khoản thanh toán không trùng khớp chính xác với loại tiền tệ của hóa đơn ([`PaymentService.java:63,152`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L63)).

---

## 5. Business rules

### 5.1. Vòng đời Trạng thái Thanh toán (Payment Status Lifecycle)
Tập trạng thái của Payment được quy định chặt chẽ:
```
           (POST /api/payments)
                    │
                    ▼
              [ PENDING ] ──────── (POST /cancel) ────────► [ CANCELLED ]
                    │
            *(Chưa có API chuyển)*
                    │
                    ▼
    [ COMPLETED / PAID / SUCCEEDED / SETTLED ]
```
1. **Khởi tạo:** Mọi payment tạo mới luôn bắt đầu ở trạng thái `PENDING`.
2. **Hủy thanh toán:** Chỉ payment đang ở `PENDING` mới được chuyển sang `CANCELLED`. Nếu payment đã ở `CANCELLED`, gọi lại cancel sẽ trả về kết quả thành công (idempotent cancel).
3. **Khoảng trống Hiện thực Workflow:** Trong API hiện tại, **hoàn toàn không có endpoint nào để chuyển payment từ `PENDING` sang `SETTLED` hoặc `COMPLETED`**. Backend chưa triển khai webhook nhận kết quả từ cổng thanh toán bên thứ ba hay lệnh xác nhận thủ công từ kế toán.

### 5.2. Cơ chế Giữ chỗ Số dư (Payment Balance Reservation) & Thanh toán một phần
1. **Thuật toán Giữ chỗ (Reservation):**
   - Khi tạo một payment mới cho một hóa đơn có tổng tiền `totalAmount`, hệ thống duyệt qua toàn bộ các payment đã có của hóa đơn đó:
     $$\text{reserved} = \sum_{\text{existing.status } \notin \{\text{CANCELLED, VOID}\}} \text{existing.amountAmount}$$
   - Mọi payment ở trạng thái active (bao gồm cả `PENDING`, `SETTLED`, `COMPLETED`...) đều được cộng vào `reserved`.
   - Điều kiện cho phép thanh toán:
     $$\text{request.amountAmount} \le \text{invoice.totalAmount} - \text{reserved}$$
   - Nếu điều kiện bị vi phạm, hệ thống ném lỗi 422: `PAYMENT_EXCEEDS_INVOICE_BALANCE`.
2. **Thanh toán một phần (Partial Payment):**  
   - Hệ thống cho phép thực hiện nhiều lần thanh toán một phần cho cùng một hóa đơn (ví dụ hóa đơn $100 có thể thanh toán $40 lần thứ nhất, $60 lần thứ hai).
   - **LƯU Ý NGHIỆP VỤ QUAN TRỌNG:** Backend `PaymentService.create()` **KHÔNG hề tự động cập nhật trạng thái của hóa đơn cha (`Invoice.status`)**. Khi một khoản thanh toán được tạo thành công, `Invoice.status` vẫn giữ nguyên trạng thái cũ (ví dụ `ISSUED`), không tự động chuyển thành `PARTIALLY_PAID` hay `PAID`!

### 5.3. Quy tắc Chống trùng lặp & Dấu vân tay Idempotency
1. **Cơ chế Khóa Đa tầng (Multi-level Locking):**
   - Tầng 1: `commands.lockKey(key)` gọi khóa tư vấn PostgreSQL trên hash của `idempotencyKey` trong tenant. Ngăn chặn tuyệt đối 2 transaction xử lý đồng thời cùng một key.
   - Tầng 2: `invoiceRepository.findByIdForUpdate(invoiceId)` khóa dòng dữ liệu của hóa đơn bằng câu lệnh `SELECT ... FOR UPDATE`, ngăn ngừa xung đột tính toán số dư khi nhiều giao dịch thanh toán khác nhau cùng nhắm vào một hóa đơn.
2. **Thuật toán Dấu vân tay (`PAYMENT_CREATE_V1`):**
   - Hash SHA-256 được tính toán từ 14 trường dữ liệu chuẩn hóa:
     `format`, `status`, `invoiceId`, `amount`, `currency`, `description`, `referenceNumber`, `stripePaymentMethodId`, `stripePaymentIntentId`, và 5 trường địa chỉ thanh toán.
   - Không đưa `idempotencyKey`, `recordedAt`, hay `recordedByUserId` vào hash.
   - Chuẩn hóa số thập phân: `toPlainString()` với 2 chữ số sau dấu phẩy (ví dụ `"40.0"` và `"40.00"` cho ra cùng một hash).
3. **Phản hồi Idempotency:**
   - **Cùng key + Cùng input hash:** Hệ thống không tạo bản ghi mới mà trả về chính xác bản ghi Payment đã tạo trước đó (Idempotent Replay, HTTP 200/201).
   - **Cùng key + Khác input hash:** Hệ thống từ chối ngay lập tức với lỗi `409 Conflict: PAYMENT_IDEMPOTENCY_CONFLICT`.

### 5.4. Quy tắc Bất biến Dữ liệu Tài chính (Financial Immutability)
1. **Chỉ sửa đổi Metadata:** Khi gọi `PUT /api/payments/{id}`, client chỉ được phép truyền `description` và `referenceNumber`.
   - Nếu client gửi bất kỳ trường tài chính nào (`amountAmount`, `amountCurrency`, `invoiceId`, `status`, `idempotencyKey`...), dù giá trị là `null`, Jackson `@JsonAnySetter` sẽ phát hiện và backend ném lỗi `409 Conflict: PAYMENT_FINANCIAL_FIELDS_IMMUTABLE`.
2. **Cấm Xóa vật lý (No Physical Delete):** Lệnh `DELETE /api/payments/{id}` luôn bị từ chối với lỗi `409 Conflict: PAYMENT_DELETE_FORBIDDEN`. Trigger database `guard_payment_command_state` chặn cứng lệnh SQL `DELETE` và ném exception `23514`.

### 5.5. Phản ánh trên Báo cáo Doanh thu & Công nợ Khách hàng
1. Tại [`RevenueCalculator.java:71-84`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/calculation/RevenueCalculator.java#L71-L84):
   $$\text{paidAmount} = \sum_{\text{payment.status } \in \{\text{COMPLETED, PAID, SUCCEEDED, SETTLED}\}} \text{payment.amountAmount}$$
   $$\text{openBalance} = \text{totalAmount} - \text{paidAmount}$$
2. **Điểm ngắt kết nối nghiệp vụ:** Trong khi `PaymentService.create()` tính các payment `PENDING` vào khoản giữ chỗ (`reserved`), thì `RevenueCalculator` **hoàn toàn bỏ qua các payment `PENDING`**. Do đó, chừng nào payment chưa được chuyển sang `SETTLED`/`COMPLETED`, báo cáo công nợ của khách hàng (`/api/customers/{customerId}/balance`) vẫn coi như khoản nợ đó **chưa hề được thanh toán**.

---

## 6. Phân quyền

### 6.1. Ma trận đối soát phân quyền Frontend & Backend

| Vai trò người dùng (JWT Role) | Quyền UI Payments (`roleMatrix.ts:34`) | Quyền gọi API `/api/payments/**` | Quyền Tạo thanh toán (`POST`) | Quyền Sửa / Hủy (`PUT` / `/cancel`) | Đánh giá an ninh |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **ADMIN** | Toàn quyền (`READ`, `create`, `edit`, `PAYMENT_CANCEL`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Quyền quản trị tài chính tối cao. |
| **ACCOUNTANT** | Toàn quyền (`READ`, `create`, `edit`, `PAYMENT_CANCEL`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Chuyên viên kế toán công nợ. |
| **DISPATCHER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403** | **Bị chặn 403** | **AN TOÀN:** Điều phối viên không được truy cập dòng tiền. |
| **DRIVER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403** | **Bị chặn 403** | **AN TOÀN:** Tài xế không có quyền xem hay thu tiền khách. |
| **PAYROLL** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403** | **Bị chặn 403** | **AN TOÀN:** Kế toán lương nội bộ không quản lý thanh toán bán hàng. |

### 6.2. Kiểm tra Ranh giới Đa khách hàng & Nhân viên Tenant (Tenant Boundary)
- **Tầng database:** Bảng `payments` và `payment_command_events` nằm trong schema riêng biệt của từng tenant, phân tách vật lý qua `TenantRoutingDataSource`.
- **Tầng ứng dụng (Actor Mapping):** Hàm `PaymentService.actor()` kiểm tra `currentUserService.requireMappedEmployee()`. Người dùng gửi request bắt buộc phải là một nhân viên có thật trong bảng `employees` của chính tenant đó. Nếu JWT hợp lệ nhưng không tìm thấy employee tương ứng trong tenant, hệ thống ném `403 ForbiddenException`.
- **Cross-tenant Isolation:** Truy vấn xem hoặc thao tác trên payment thuộc tenant khác sẽ nhận phản hồi `404 Not Found` (do routing kết nối đúng database của tenant hiện tại và không tìm thấy bản ghi).

---

## 7. Test cases

| ID | Nhóm kiểm thử | Kịch bản kiểm thử | Thao tác kiểm định | Kết quả mong đợi | Trạng thái kiểm định & Bằng chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PAY-01** | UI Presentation | Render bảng danh sách và format dữ liệu cột | Render `paymentColumns` với mock Payment data | Cột `referenceNumber` render dạng router link có class `table-number-link table-mono-cell`, `amountAmount` căn phải định dạng VND tabular-nums. | `UNIT_TEST_PASS` (Component)<br>Khớp [`paymentColumns.test.tsx:89-105`](file:///home/vumoi/logictics-app/src/tests/features/payments/paymentColumns.test.tsx#L89-L105). |
| **TC-PAY-02** | UI Status Tag | Ánh xạ tone màu trạng thái thanh toán | Render các trạng thái: `succeeded`, `pending`, `failed` | `succeeded` -> success (xanh lá), `pending` -> warning (vàng), `failed` -> error (đỏ). | `UNIT_TEST_PASS` (Component)<br>Khớp [`paymentColumns.test.tsx:107-133`](file:///home/vumoi/logictics-app/src/tests/features/payments/paymentColumns.test.tsx#L107-L133). |
| **TC-PAY-03** | UI Navigation | Link từ số hóa đơn sang trang chi tiết Invoice | Click vào link hóa đơn dạng `#1002` | Thẻ `<a>` có href dạng `/invoices/show/:invoiceId` và class `table-number-link`. | `UNIT_TEST_PASS` (Component)<br>Khớp [`paymentColumns.test.tsx:135-156`](file:///home/vumoi/logictics-app/src/tests/features/payments/paymentColumns.test.tsx#L135-L156). |
| **TC-PAY-04** | UI Navigation | Format ngày giờ ghi nhận thanh toán | Kiểm tra cột `recordedAt` với ISO string | Format theo chuẩn tiếng Việt, có class `tabular-nums`. Nếu rỗng hiển thị `—`. | `UNIT_TEST_PASS` (Component)<br>Khớp [`paymentColumns.test.tsx:158-187`](file:///home/vumoi/logictics-app/src/tests/features/payments/paymentColumns.test.tsx#L158-L187). |
| **TC-PAY-05** | Feature Gate | Kiểm tra các form Payment ở trạng thái dormant | Render `PaymentCommandForm` với action create, edit, cancel | Cả 3 form không gửi request ra mạng, hiển thị Alert "Waiting for backend runtime verification". | `UNIT_TEST_PASS` (Contract)<br>Khớp [`paymentActivation.test.tsx:7-19`](file:///home/vumoi/logictics-app/src/tests/contracts/paymentActivation.test.tsx#L7-L19). |
| **TC-PAY-06** | Generic Blocking | Chặn các lệnh generic CRUD write trên resource payments | Gọi `provider.create`, `provider.update`, `provider.deleteOne` | Frontend handoff provider ném lỗi `COMMAND_RESOURCE`, không gửi request generic ra mạng. | `UNIT_TEST_PASS` (Contract)<br>Khớp [`handoffWire.test.ts:83-87`](file:///home/vumoi/logictics-app/src/tests/contracts/handoffWire.test.ts#L83-L87). |
| **TC-PAY-07** | Client Validation | Chặn làm tròn số tiền âm thầm tại client | Gọi `createPaymentPayload` với `amountAmount = 1.001` | Ném lỗi client-side `PAYMENT_AMOUNT_INVALID`. | `UNIT_TEST_PASS` (Contract)<br>Khớp [`handoffWire.test.ts:95`](file:///home/vumoi/logictics-app/src/tests/contracts/handoffWire.test.ts#L95). |
| **TC-PAY-08** | Client Validation | Loại bỏ trường `recordedAt` giả mạo từ client | Gọi `createPaymentPayload` có chứa `recordedAt: "spoof"` | Payload trả về không chứa thuộc tính `recordedAt`. | `UNIT_TEST_PASS` (Contract)<br>Khớp [`handoffWire.test.ts:96`](file:///home/vumoi/logictics-app/src/tests/contracts/handoffWire.test.ts#L96). |
| **TC-PAY-09** | Double Submit | Chống bấm đúp và đóng băng intent khi timeout | Gọi liên tiếp `create()` 2 lần trong trạng thái pending/timeout | Chỉ phát 1 request ra mạng; nếu sửa dữ liệu bị ném lỗi `COMMAND_INTENT_FROZEN`; `retryCreate()` gửi lại đúng payload cũ. | `UNIT_TEST_PASS` (Contract)<br>Khớp [`handoffWire.test.ts:99-109`](file:///home/vumoi/logictics-app/src/tests/contracts/handoffWire.test.ts#L99-L109). |
| **TC-PAY-10** | Positive Path | Tạo thanh toán PENDING hợp lệ qua API | Gửi `POST /api/payments` với đầy đủ thông tin hợp lệ | Trả về HTTP 201 Created, `status: "PENDING"`, ghi nhận audit event `CREATE`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:44-84`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L44-L84) và test Postgres. |
| **TC-PAY-11** | Idempotency Replay| Gửi lại cùng `idempotencyKey` và cùng input hash | Gửi lại cùng request thanh toán đã tạo trước đó | Trả về HTTP 201/200 với cùng `id` của payment cũ mà không tạo thêm bản ghi mới. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:51-56`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L51-L56). |
| **TC-PAY-12** | Idempotency Conflict| Gửi cùng `idempotencyKey` nhưng thay đổi dữ liệu | Gửi cùng key nhưng đổi `amount` hoặc địa chỉ billing | Trả về HTTP 409 Conflict: `PAYMENT_IDEMPOTENCY_CONFLICT`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:54-55`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L54-L55). |
| **TC-PAY-13** | Concurrency | Hai request cùng gửi cùng key và cùng input đồng thời | Kích hoạt 2 thread gửi request song song qua barrier | Nhờ khóa tư vấn Postgres, chỉ tạo 1 payment duy nhất và cả 2 thread nhận cùng `id`. | `SOURCE_REVIEWED`<br>Khớp test tích hợp `PaymentCommandPostgresTest:79-86`. |
| **TC-PAY-14** | Over-reservation| Thanh toán vượt quá số dư còn lại của hóa đơn | Hóa đơn $100 đã có $40 giữ chỗ; gửi thêm payment $70 | Backend từ chối với HTTP 422: `PAYMENT_EXCEEDS_INVOICE_BALANCE`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:74-75`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L74-L75). |
| **TC-PAY-15** | Currency Mismatch | Loại tiền tệ của payment không khớp với hóa đơn | Hóa đơn là `USD`, gửi payment là `EUR` | Backend từ chối với HTTP 422: `CURRENCY_MISMATCH`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:63,148-154`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L63). |
| **TC-PAY-16** | Uncollectible | Thanh toán cho hóa đơn DRAFT, CREDIT hoặc CANCELLED | Gửi payment cho hóa đơn có `status: DRAFT` hoặc purpose `CREDIT` | Backend từ chối HTTP 409: `PAYMENT_INVOICE_NOT_COLLECTIBLE`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:60-62`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L60-L62). |
| **TC-PAY-17** | Metadata Edit | Sửa `description` và `referenceNumber` của payment PENDING | Gửi `PUT /api/payments/{id}` với `description: "New text"` | Cập nhật thành công, HTTP 200 OK, ghi nhận audit event `METADATA`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:85-99`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L85-L99). |
| **TC-PAY-18** | Immutability | Cố tình sửa các trường tài chính qua API `PUT` | Gửi `PUT /api/payments/{id}` có trường `amountAmount` | Backend từ chối HTTP 409: `PAYMENT_FINANCIAL_FIELDS_IMMUTABLE`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:89`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L89). |
| **TC-PAY-19** | Metadata Conflict | Sửa metadata khi payment không ở trạng thái PENDING | Gửi `PUT /api/payments/{id}` khi status là `CANCELLED` | Backend từ chối HTTP 409: `PAYMENT_METADATA_STATE_CONFLICT`. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:91`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L91). |
| **TC-PAY-20** | Cancel Success | Hủy payment PENDING thành công kèm lý do | Gửi `POST /api/payments/{id}/cancel?reason=Customer%20request` | Trạng thái chuyển sang `CANCELLED`, giải phóng khoản giữ chỗ (released reservation). | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:101-110`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L101-L110). |
| **TC-PAY-21** | Cancel Idempotency| Hủy lại payment đã ở trạng thái CANCELLED | Gửi lại lệnh cancel trên payment đã CANCELLED | Trả về HTTP 200 OK giữ nguyên bản ghi hủy đầu tiên, không tạo event audit trùng. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:105`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L105). |
| **TC-PAY-22** | Delete Forbidden | Gọi lệnh xóa vật lý payment qua API `DELETE` | Gửi `DELETE /api/payments/{id}` | Backend từ chối HTTP 409: `PAYMENT_DELETE_FORBIDDEN`. Trigger DB chặn cứng. | `SOURCE_REVIEWED`<br>Khớp [`PaymentService.java:113-115`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L113-L115) và V38 trigger. |
| **TC-PAY-23** | Permission | Người dùng vai trò DISPATCHER gọi API payments | Gửi request với role `DISPATCHER` | Bị Spring Security chặn HTTP 403 Forbidden; frontend matrix từ chối quyền. | `UNIT_TEST_PASS` & `SOURCE_REVIEWED`<br>Khớp [`roleMatrix.ts:34`](file:///home/vumoi/logictics-app/src/providers/permissions/roleMatrix.ts#L34) và [`SecurityConfig.java:84-85`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L84-L85). |
| **TC-PAY-24** | Cross Tenant | Truy cập payment của tenant khác | Gửi `GET /api/payments/{id}` với ID thuộc tenant khác | Backend trả về HTTP 404 Not Found do phân vùng database độc lập. | `SOURCE_REVIEWED`<br>Khớp test tích hợp `PaymentCommandPostgresTest:149-155`. |

---

## 8. Confirmed bugs

### BUG-PAY-01: Ghi nhận Thanh toán không Tự động Đồng bộ Trạng thái Hóa đơn sang PARTIALLY_PAID hoặc PAID
- **Mã lỗi:** `BUG-PAY-01`
- **Mức độ nghiêm trọng:** **P2** (Medium — Business Workflow & Data Synchronization Gap)
- **Phân loại:** `BUG_CONFIRMED` (Xác nhận qua đối soát mã nguồn backend)
- **Mô tả:**
  - Khi khách hàng thanh toán tiền cước cho hóa đơn, quy trình kế toán chuẩn quy định: nếu thanh toán một phần, hóa đơn phải chuyển sang trạng thái `PARTIALLY_PAID`; nếu thanh toán đủ 100% số dư, hóa đơn phải chuyển sang trạng thái `PAID`.
  - Tuy nhiên, trong toàn bộ mã nguồn xử lý lệnh tạo thanh toán [`PaymentService.java:44-84`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L44-L84):
    + Hệ thống nạp hóa đơn qua `invoiceRepository.findByIdForUpdate(request.invoiceId())`.
    + Kiểm tra số dư và tạo payment với `payment.setStatus("PENDING")`.
    + **Hoàn toàn không có bất kỳ dòng code nào cập nhật `invoice.setStatus(...)` hay gọi `invoiceRepository.save(invoice)`**.
  - Hậu quả: Dù khách hàng đã thanh toán một phần hay toàn bộ số tiền của hóa đơn, trạng thái của hóa đơn trên danh sách `/invoices` vĩnh viễn giữ nguyên là `ISSUED` (hoặc `SENT`), không hề phản ánh tiến trình thanh toán thực tế trừ khi nhân viên kế toán tự sửa bằng tay qua CRUD (mà CRUD lại bị chặn 409 nếu invoice là rated).
- **Bước tái hiện:**
  1. Hóa đơn `INV-001` có tổng tiền $1,000, trạng thái `ISSUED`.
  2. Tạo thanh toán qua `POST /api/payments` với số tiền $1,000.
  3. Kiểm tra lại thông tin hóa đơn qua `GET /api/invoices/{id}`.
- **Kết quả mong đợi:** Hóa đơn chuyển trạng thái sang `PAID` (hoặc `PARTIALLY_PAID` nếu thanh toán chưa đủ).
- **Kết quả thực tế (từ Source Review):** Trạng thái hóa đơn vẫn là `ISSUED`.
- **Đề xuất sửa:** Trong `PaymentService` (hoặc khi thanh toán chuyển sang trạng thái hoàn tất), bổ sung hàm đối soát số dư còn lại của hóa đơn: nếu `balance <= 0` thì set `invoice.setStatus("PAID")`, nếu `0 < balance < totalAmount` thì set `invoice.setStatus("PARTIALLY_PAID")`.

---

### BUG-PAY-02: Thanh toán tạo qua API Vĩnh viễn ở trạng thái PENDING và Bị Loại khỏi Báo cáo Công nợ Khách hàng
- **Mã lỗi:** `BUG-PAY-02`
- **Mức độ nghiêm trọng:** **P2** (Medium — Financial Reporting & Settlement Disconnect)
- **Phân loại:** `BUG_CONFIRMED` (Xác nhận qua đối soát mã nguồn và tài liệu kiến trúc)
- **Mô tả:**
  - Khi tạo thanh toán, `PaymentService.create()` luôn gán cứng `payment.setStatus("PENDING")` ([`PaymentService.java:77`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L77)).
  - Trong bộ điều khiển [`PaymentController.java`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/PaymentController.java), hệ thống chỉ cung cấp 5 endpoint: `search`, `getById`, `create`, `update`, `cancel` (và `@Deprecated delete`). **Hoàn toàn không có endpoint nào (như `/settle` hay `/complete`) để hoàn tất thanh toán**.
  - Trong khi đó, dịch vụ tính toán tài chính và công nợ khách hàng [`RevenueCalculator.java:74-76`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/calculation/RevenueCalculator.java#L74-L76) quy định:
    ```java
    if (("completed".equalsIgnoreCase(payment.getStatus()) || "paid".equalsIgnoreCase(payment.getStatus())
            || "succeeded".equalsIgnoreCase(payment.getStatus()) || "settled".equalsIgnoreCase(payment.getStatus()))
            && payment.getAmountAmount() != null) {
        paidAmount = paidAmount.add(payment.getAmountAmount());
    }
    ```
    Hệ thống **chỉ cộng vào `paidAmount` các khoản thanh toán có trạng thái `completed`, `paid`, `succeeded`, `settled`**.
  - Hậu quả: Mọi khoản thanh toán tạo qua API chuẩn đều bị kẹt vĩnh viễn ở `PENDING`. Khi kế toán xem báo cáo công nợ của khách hàng qua `GET /api/customers/{customerId}/balance`, `paidAmount` luôn bằng 0 và `openBalance` vẫn bằng nguyên 100% tổng tiền hóa đơn, dẫn đến số liệu công nợ phải thu bị sai lệch nghiêm trọng.
- **Bước tái hiện:**
  1. Hóa đơn của khách hàng A có tổng tiền $5,000.
  2. Tạo thanh toán thành công $5,000 cho hóa đơn này qua `POST /api/payments`.
  3. Gọi API báo cáo công nợ: `GET /api/customers/{customerId}/balance`.
- **Kết quả mong đợi:** Báo cáo phản ánh đã thu $5,000, số nợ còn lại (`openBalance`) là $0.
- **Kết quả thực tế (từ Source Review):** `paidAmount` là $0, `openBalance` vẫn là $5,000 vì payment ở trạng thái `PENDING` bị thuật toán loại trừ.
- **Đề xuất sửa:** Xây dựng workflow hoàn tất thanh toán (`POST /api/payments/{id}/settle` hoặc webhook đồng bộ từ cổng thanh toán) để chuyển payment sang `SETTLED`, đồng thời cập nhật số dư công nợ khách hàng.

---

## 9. Unverified risks

### RISK-PAY-01: Cột `payments.tenant_id` là UUID Ngẫu nhiên Không Phản ánh Ranh giới Dữ liệu Thực tế
- **Mã nguy cơ:** `RISK-PAY-01`
- **Mức độ rủi ro:** **P2** (Medium — Data Architecture & Future Migration Risk)
- **Phân loại:** `RISK_UNVERIFIED` (Xác nhận từ mã nguồn và tài liệu handoff)
- **Mô tả:**
  - Tại [`PaymentService.java:80`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L80), mã nguồn ghi:
    ```java
    // Opaque legacy field retained. Physical datasource routing remains the tenant boundary.
    payment.setTenantId(UUID.randomUUID());
    ```
  - Khi lưu bản ghi payment, trường `tenant_id` được gán bằng một `UUID.randomUUID()` ngẫu nhiên thay vì ID thực tế của tenant.
  - Tài liệu kỹ thuật [`payment-command-contracts.md:13`](file:///home/vumoi/logictics_api/docs/payment-command-contracts.md#L13) ghi nhận: *"The legacy payments.tenant_id UUID remains opaque compatibility data. No active Java query uses it as the tenant boundary; physical datasource routing controls isolation."*
  - Rủi ro: Nếu có bất kỳ công cụ báo cáo bên ngoài (BI tools, ETL pipeline, direct SQL query) đọc dữ liệu từ bảng `payments` mà dựa vào cột `tenant_id` để phân nhóm khách hàng thì sẽ cho ra kết quả hoàn toàn vô nghĩa và sai lệch.

### RISK-PAY-02: Thiếu Nút Thao tác Nhanh "Thanh toán" từ Màn hình Chi tiết Hóa đơn
- **Mã nguy cơ:** `RISK-PAY-02`
- **Mức độ rủi ro:** **P3** (Low — UX Friction & Navigation Gap)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:**
  - Trong luồng vận hành thực tế của kế toán, khi xem một hóa đơn chưa thanh toán tại `/invoices/show/:id`, kế toán muốn bấm ngay nút *"Ghi nhận thanh toán"* (Record Payment) để mở form thanh toán với thông tin `invoiceId`, số tiền còn nợ và đơn vị tiền tệ được điền tự động.
  - Hiện tại, trang chi tiết `/invoices/show/:id` không có nút bấm nào liên kết sang phân hệ Payments. Kế toán buộc phải nhớ mã hóa đơn, chuyển sang menu Payments để nhập liệu thủ công, làm tăng nguy cơ nhập nhầm mã hóa đơn.

---

## 10. Missing functionality

1. **`[FEATURE_GATED]` Toàn bộ Giao diện Thao tác Lệnh Thanh toán (PaymentCommandForm) bị Khóa ở Runtime:**  
   - Hằng số `PAYMENT_COMMANDS_RUNTIME_VERIFIED = false` tại [`paymentCommands.ts:10`](file:///home/vumoi/logictics-app/src/features/payments/api/paymentCommands.ts#L10) khiến toàn bộ các tính năng tương tác của phân hệ Payments trên giao diện người dùng bị đình trệ:
     + Nút "Create" trên bảng danh sách bị ẩn;
     + Nút "Edit" và "Delete" trên các dòng bảng bị ẩn;
     + Truy cập trực tiếp `/payments/create` hoặc `/payments/edit/:id` bị chặn bởi màn hình cảnh báo dormant;
     + Khung thao tác Hủy thanh toán (`action="cancel"`) trên trang chi tiết `/payments/show/:id` bị ẩn hoàn toàn.
   - *Đánh giá QA:* Đây là cơ chế Feature Gate có chủ đích nhằm kiểm soát tiến độ bàn giao frontend-backend trước khi nghiệm thu tích hợp trực tiếp, không phải lỗi hư hỏng mã nguồn.
2. **`[NOT_IMPLEMENTED]` Thiếu API và Quy trình Nghiệp vụ Hoàn tất Thanh toán (Payment Settlement / Completion):**  
   - Hệ thống mới chỉ có khả năng ghi nhận trạng thái `PENDING` và chuyển sang `CANCELLED`.
   - Hoàn toàn chưa có API chuyển trạng thái sang `SETTLED`, `SUCCEEDED` hay `COMPLETED`, dẫn đến đứt gãy luồng ghi nhận công nợ thực tế.
3. **`[NOT_IMPLEMENTED]` Chưa Triển khai Cổng Thanh toán Công cộng (Public Payment Link & Stripe Portal):**  
   - Tài liệu thiết kế [`docs/docs/customer-payments.md`](file:///home/vumoi/logictics_api/docs/docs/customer-payments.md) mô tả chi tiết luồng thanh toán không cần đăng nhập qua link `/public/payments/{tenantId}/{token}` và tích hợp thẻ tín dụng qua Stripe SetupIntent.
   - Tuy nhiên, trong mã nguồn Java của backend hoàn toàn không có controller hay service nào phục vụ đường dẫn `/public/payments/**`. Tính năng này mới chỉ dừng ở mức thiết kế ý niệm trên tài liệu.

---

## 11. Integration issues

1. **Mất đồng bộ Nghiệp vụ giữa Payments và Invoices:**  
   - Sau khi tạo payment thành công cho một hóa đơn, trạng thái của hóa đơn không hề thay đổi. Hóa đơn không nhận biết được số tiền đã thanh toán, khiến người dùng không thể phân biệt được hóa đơn nào đã thu tiền, hóa đơn nào còn nợ trên giao diện Quản trị Hóa đơn.
2. **Sai lệch giữa Khoản Giữ Chỗ (Reservation) và Báo cáo Doanh thu (Revenue Reporting):**  
   - Phân hệ Payments sử dụng trạng thái `PENDING` để giữ chỗ số dư chống thu vượt trần. Nhưng phân hệ Báo cáo Tài chính (`RevenueCalculator`) lại đòi hỏi trạng thái `SETTLED`/`COMPLETED` mới tính là đã thanh toán.
   - Sự không nhất quán này dẫn đến việc: Khách hàng đã nộp tiền và phiếu thu đã tạo, nhưng hệ thống vẫn báo cáo khách hàng đang nợ 100% số tiền.

---

## 12. Test execution evidence

Đã thực thi kiểm tra toàn bộ các bộ test tự động liên quan đến Payments, Columns, Activation và Wire Contracts trong phiên làm việc:

```bash
# 1. Chạy các test suite chuyên biệt cho Payments và Contracts
$ npx vitest run src/tests/features/payments/ src/tests/contracts/paymentActivation.test.tsx src/tests/contracts/handoffWire.test.ts
Test Files  3 passed (3)
     Tests  36 passed (36)
  Duration  9.02s
Exit code: 0 (PASS)

# Chi tiết các test suite đã vượt qua:
✓ src/tests/features/payments/paymentColumns.test.tsx (7 tests pass)
  - Cột referenceNumber: render dạng router Link, có class table-number-link và table-mono-cell
  - Cột amountAmount: align right, tabular-nums, định dạng tiền tệ VND chuẩn
  - Cột status: ánh xạ chính xác tone và nhãn chữ semantic cho succeeded, pending, failed
  - Cột invoiceId: render Link tới invoice show với số hóa đơn có tiền tố '#'
  - Cột recordedAt: format datetime theo chuẩn vi-VN với tabular-nums
  - Hiển thị '—' với class table-cell-empty khi dữ liệu trống
  - Cột thao tác: hiển thị nút hành động với capability tương ứng (ẩn Edit/Delete)
✓ src/tests/contracts/paymentActivation.test.tsx (1 test pass)
  - Dormant Payment forms make no production request (hiển thị Alert "Waiting for backend runtime verification")
✓ src/tests/contracts/handoffWire.test.ts (28 tests pass)
  - Chặn các lệnh generic CRUD write (provider.create, update, deleteOne ném COMMAND_RESOURCE)
  - Bắt buộc kiểm tra định dạng tiền tệ không làm tròn âm thầm (PAYMENT_AMOUNT_INVALID)
  - Loại bỏ trường recordedAt giả mạo từ client
  - Đóng băng intent và chống bấm đúp khi timeout (COMMAND_INTENT_FROZEN, retryCreate giữ nguyên payload)

# 2. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - 0 lỗi compile)

# 3. Kiểm tra định dạng Diff Git
$ git diff --check
Exit code: 0 (PASS - Không vi phạm whitespace/formatting)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Ghi nhận bằng chứng:**  
> - Các kết quả `UNIT_TEST_PASS` được kiểm chứng bởi 36 test cases tự động chạy bằng Vitest trên **tầng giao diện và contract với dữ liệu mock**.  
> - Các kết quả ghi `SOURCE_REVIEWED` là kết quả phân tích mã nguồn chi tiết từ `PaymentService.java`, migration SQL V36/V38 và integration test `PaymentCommandPostgresTest.java` của backend `logictics_api`.  
> - **Chưa có kiểm thử tích hợp Runtime/Backend Live (Live Backend Integration):** Phiên làm việc không kết nối tới môi trường database PostgreSQL live cục bộ, không thực hiện ghi dữ liệu thật trên production nhằm tuân thủ quy tắc bảo toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-PAY-02` | Financial Integrity | **Xây dựng Endpoint / Workflow Hoàn tất Thanh toán (Settlement):** Bổ sung endpoint `POST /api/payments/{id}/settle` để chuyển payment từ `PENDING` sang `SETTLED`, giúp `RevenueCalculator` ghi nhận số tiền đã thu vào báo cáo công nợ. | `.../controller/PaymentController.java`<br>`.../service/PaymentService.java` |
| **P2** | `BUG-PAY-01` | Synchronization | **Tự động Đồng bộ Trạng thái Hóa đơn khi có Thanh toán:** Bổ sung logic kiểm tra số dư và cập nhật `invoice.setStatus("PARTIALLY_PAID" | "PAID")` sau khi ghi nhận hoặc hoàn tất thanh toán. | `.../service/PaymentService.java:76-84` |
| **P2** | `RISK-PAY-01` | Data Architecture | **Ghi nhận Đúng `tenant_id` Thực tế:** Thay thế `UUID.randomUUID()` bằng ID tenant thực tế lấy từ context khi lưu bản ghi Payment mới. | `.../service/PaymentService.java:80` |
| **P3** | `FEATURE_GATED`| Feature Gate | **Kích hoạt Giao diện Lệnh Thanh toán (PaymentCommandForm):** Chuyển cờ `PAYMENT_COMMANDS_RUNTIME_VERIFIED = true` tại frontend sau khi backend hoàn tất kiểm thử tích hợp runtime. | [`src/features/payments/api/paymentCommands.ts:10`](file:///home/vumoi/logictics-app/src/features/payments/api/paymentCommands.ts#L10) |
| **P3** | `RISK-PAY-02` | UX Navigation | **Thêm Nút "Ghi nhận thanh toán" trên Trang Chi tiết Hóa đơn:** Trên trang `/invoices/show/:id`, bổ sung nút hành động dẫn trực tiếp sang `/payments/create?invoiceId={id}` để kế toán thao tác thuận tiện. | [`src/pages/invoices/show.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/show.tsx) |
| **P3** | `NOT_IMPLEMENTED`| Feature Gap | **Triển khai Cổng Thanh toán Công cộng (Public Payment Portal):** Hiện thực hóa controller `/public/payments/**` và tích hợp Stripe theo đúng tài liệu đặc tả thiết kế nếu dự án yêu cầu khách hàng tự trả tiền online. | `.../controller/PublicPaymentController.java` |
