# AUDIT: invoices

> **Người thực hiện:** Senior QA Engineer (TMS Domain)  
> **Dự án:** `logictics-app` (Frontend Logistics TMS) & `logictics_api` (Backend Spring Boot)  
> **Chức năng kiểm thử:** `invoices` (Hóa đơn, giá cước, thuế, công nợ)  
> **Thời điểm cập nhật theo Review:** 25/10/2026  
> **Phương pháp:** Phân tích mã nguồn tĩnh đối soát đa tầng (Frontend React Refine & Backend Spring Boot), kiểm tra máy trạng thái hóa đơn & chuỗi kế toán bất biến (Signed Billing Chain), đối soát quy tắc tính thuế và trần tín dụng (Credit Cap), và thực thi bộ kiểm thử tự động (Unit/Contract Tests với mock).

---

## 1. Tổng quan chức năng

Phân hệ **Hóa đơn & Kế toán Doanh thu (Invoices & Billing Operations)** là hạt nhân quản lý tài chính đầu ra của hệ thống TMS LogisticsX. Phân hệ chịu trách nhiệm tạo lập, phê duyệt, phát hành hóa đơn vận tải cho khách hàng (Customer Invoices), quản lý các dòng cước và thuế suất (Line Items & Tax Decisions), theo dõi tiến trình thu hồi công nợ (Balance / Accounts Receivable), và xử lý các nghiệp vụ kế toán chuyên sâu như xuất hóa đơn bổ sung phụ phí (Supplemental), ghi giảm cước / điều chỉnh (Credit Note), và lập hóa đơn thay thế toàn phần (Rebill).

### Các phân hệ mã nguồn tham gia luồng Invoices:
1. **Giao diện Quản trị Hóa đơn Generic Refine (Invoices CRUD):**
   - Tuyến đường: `/invoices`, `/invoices/show/:id`, `/invoices/create`, `/invoices/edit/:id` ([`src/pages/invoices/`](file:///home/vumoi/logictics-app/src/pages/invoices/)).
   - Bảng danh sách hóa đơn & Cột nghiệp vụ: [`src/features/invoices/components/columns.tsx`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx).
   - Định nghĩa form nhập liệu hóa đơn: [`src/components/resources/resourceForms.ts:583-595`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts#L583-L595).
   - Ràng buộc cấu hình năng lực Refine: [`src/components/resources/resourceCapabilities.ts:24`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L24).
   - Kiểm soát hiển thị nút sửa theo trạng thái: [`src/components/ActionButtons.tsx:50`](file:///home/vumoi/logictics-app/src/components/ActionButtons.tsx#L50) và [`src/components/ResourceShowPage.tsx:66`](file:///home/vumoi/logictics-app/src/components/ResourceShowPage.tsx#L66).
2. **Phân hệ Xuất hóa đơn Định mức & Chuỗi Kế toán Bất biến (Immutable Billing Commands):**
   - Panel Tài chính Đơn hàng (Load Financial Panel): [`src/features/loads/components/LoadFinancialPanel.tsx:26-34`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadFinancialPanel.tsx#L26-L34).
   - Thao tác chấp thuận giá cước & form tạo hóa đơn: [`src/features/rates/components/RatingAcceptance.tsx:14-32`](file:///home/vumoi/logictics-app/src/features/rates/components/RatingAcceptance.tsx#L14-L32) (chứa nút Accept rating và component con [`PrimaryInvoiceForm.tsx`](file:///home/vumoi/logictics-app/src/features/invoices/components/PrimaryInvoiceForm.tsx)).
   - Lệnh kế toán billing client: [`src/features/invoices/api/billingCommands.ts`](file:///home/vumoi/logictics-app/src/features/invoices/api/billingCommands.ts).
   - Kiểm tra tính bất biến của hóa đơn: [`src/features/invoices/utils/invoiceMutability.ts`](file:///home/vumoi/logictics-app/src/features/invoices/utils/invoiceMutability.ts).
3. **Backend Dịch vụ & Bộ điều khiển Kế toán (Spring Boot API):**
   - Bộ điều khiển hóa đơn CRUD: `com.company.logicstic.controller.InvoiceController.java` & `InvoiceService.java`.
   - Bộ điều khiển lệnh billing chuyên biệt: `com.company.logicstic.controller.BillingController.java` & `BillingService.java`.
   - Bộ điều khiển thẩm định thuế: `com.company.logicstic.controller.TaxAssessmentController.java` & `TaxAssessmentService.java`.
   - Dịch vụ đối soát hóa đơn: `com.company.logicstic.service.calculation.InvoiceReconciliationService.java`.
   - Bộ điều khiển thanh toán & đặt chỗ: `com.company.logicstic.controller.PaymentController.java` & `PaymentService.java`.
   - Bộ điều khiển báo cáo công nợ: `com.company.logicstic.controller.ReportController.java` (`/api/customers/{customerId}/balance` qua `RevenueCalculator.java`).

---

## 2. Danh sách route

| Đường dẫn URL | Component phụ trách | Mounting Runtime | Rào chắn phân quyền / Capability Gate | Hành vi chuyển hướng / Bảo vệ |
| :--- | :--- | :--- | :--- | :--- |
| `/invoices` | `InvoiceList` ([`src/pages/invoices/list.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/list.tsx)) | Refine Resource Router tại [`src/pages/index.ts:235`](file:///home/vumoi/logictics-app/src/pages/index.ts#L235) | `ResourceAccessBoundary` (`action="list", resource="invoices"`). | Yêu cầu đăng nhập (`ProtectedRoute`) và tenant (`TenantGuard`). Chỉ người dùng thuộc nhóm `ACCOUNTING` (`ADMIN`, `ACCOUNTANT`) được phép truy cập. Các role khác (`DISPATCHER`, `DRIVER`, `PAYROLL`) bị chặn 403. |
| `/invoices/show/:id` | `InvoiceShow` ([`src/pages/invoices/show.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/show.tsx)) | Refine Resource Router tại [`src/pages/index.ts:235`](file:///home/vumoi/logictics-app/src/pages/index.ts#L235) | `ResourceAccessBoundary` (`action="show", resource="invoices"`). | Xem chi tiết thông tin hóa đơn tổng thể. Hiện dùng component generic `ResourceShowPage`. Nút Edit trên thanh tiêu đề chỉ hiển thị nếu hóa đơn thỏa mãn `isLegacyDraftInvoice(record)`. |
| `/invoices/create` | `InvoiceCreate` ([`src/pages/invoices/create.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/create.tsx)) | Refine Resource Router tại [`src/pages/index.ts:235`](file:///home/vumoi/logictics-app/src/pages/index.ts#L235) | `ResourceAccessBoundary` (`action="create", resource="invoices"`). | Cho phép tạo hóa đơn thông thường với form 2 cột generic. *(Lưu ý: Không hỗ trợ nhập các dòng chi tiết Line Items)*. |
| `/invoices/edit/:id` | `InvoiceEdit` ([`src/pages/invoices/edit.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/edit.tsx)) | Refine Resource Router tại [`src/pages/index.ts:235`](file:///home/vumoi/logictics-app/src/pages/index.ts#L235) | `ResourceAccessBoundary` (`action="edit", resource="invoices"`). | Mở trang chỉnh sửa hóa đơn generic `ResourceEditPage`. Trên danh sách và trang show, nút bấm điều hướng tới route này đã được ẩn đối với hóa đơn không phải draft thuần túy. Nếu người dùng mở URL trực tiếp (deep-link) của hóa đơn đã phát hành/rated, submit sẽ bị backend từ chối `409 Conflict: INVOICE_HISTORY_IMMUTABLE`. |

> [!NOTE]
> **Đặc điểm cấu hình Capability và Guard nút Edit:**  
> 1. Tại [`src/components/resources/resourceCapabilities.ts:24`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L24):
>    `invoices: { create: true, delete: false, edit: true }`
>    Nút xóa (`Delete`) bị vô hiệu hóa / ẩn hoàn toàn trên giao diện UI (`delete: false`).
> 2. Tại [`src/components/ActionButtons.tsx:50`](file:///home/vumoi/logictics-app/src/components/ActionButtons.tsx#L50) và [`src/components/ResourceShowPage.tsx:66`](file:///home/vumoi/logictics-app/src/components/ResourceShowPage.tsx#L66):
>    `const canEdit = capabilities.edit && (resource !== "invoices" || isLegacyDraftInvoice(record));`
>    Hệ thống kiểm tra `isLegacyDraftInvoice(record)` ([`invoiceMutability.ts:2-6`](file:///home/vumoi/logictics-app/src/features/invoices/utils/invoiceMutability.ts#L2-L6)), chỉ cho phép hiển thị nút Edit nếu `status === "DRAFT"` và không có `ratingSnapshotId`, `invoicePurpose`, hay `billingChainId`. Với mọi hóa đơn đã phát hành (`ISSUED`, `PAID`, `PARTIALLY_PAID`) hoặc rated invoice, nút Edit **hoàn toàn không được render** trên UI.

---

## 3. Danh sách UI action

| ID | Vùng màn hình | Loại Control | Hàm xử lý nội bộ | API / Event kích hoạt | Kết quả mong đợi & Ghi nhận QA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACT-INV-01** | Bảng danh sách `/invoices`: Số hiệu hóa đơn | `Link` (table-number-link) | Chuyển hướng router | Không gọi API (Client Navigation) | Điều hướng trực tiếp sang màn hình xem chi tiết `/invoices/show/:id`. |
| **ACT-INV-02** | Bảng danh sách: Cột hạn thanh toán | Tag & Text hiển thị (`DueDateCell`) | `calculateOverdueDays()` | Không gọi API | Hiển thị ngày đến hạn; nếu quá hạn và chưa thanh toán đủ hiển thị thêm Tag đỏ cảnh báo: `"Quá hạn X ngày"`. |
| **ACT-INV-03** | Bảng danh sách: Cột công nợ (Balance) | Text hiển thị (`MoneyCell`) | Render `record.balance ?? record.openBalance` | Không gọi API | **LỖI DỮ LIỆU (BUG-INV-01):** Backend DTO `InvoiceView` không hề có trường `balance` hoặc `openBalance`, dẫn đến cột này **VĨNH VIỄN HIỂN THỊ DẤU GẠCH NGANG `—`** trên danh sách. |
| **ACT-INV-04** | Bảng danh sách: Phân trang & Sắp xếp | `Pagination` / `TableHeader` | `useTable` (Refine hook) | `GET /api/invoices?page=X&pageSize=Y&orderBy=Z` | Tải dữ liệu trang mới, sắp xếp theo `number`, `dueDate`, `totalAmount`, `status`. |
| **ACT-INV-05** | Bảng danh sách: Nút "Create" | `Button` (Primary) | `navigate("/invoices/create")` | Không gọi API | Mở form tạo hóa đơn mới `ResourceCreatePage`. |
| **ACT-INV-06** | Form tạo `/invoices/create`: Bấm "Save" | Form Submit (`ResourceCreatePage`) | `formProps.onFinish()` qua `buildResourceMutation` | `POST /api/invoices` | **THIẾU LINE ITEMS (BUG-INV-02):** Form chỉ cho nhập các số tiền tổng, **hoàn toàn không có phần nhập chi tiết các mục dòng hàng (Line Items)**. Hóa đơn generic tạo ra có nguy cơ làm đổ vỡ dịch vụ đối soát doanh thu downstream `InvoiceReconciliationService`. |
| **ACT-INV-07** | Bảng danh sách & Chi tiết: Nút "Edit" | `Button` (Edit) trong `ActionButtons` / `ResourceShowPage` | `actionContext.showEdit(id)` | Không gọi API | **HỢP LỆ VỚI GUARD:** Nút Edit chỉ render khi `isLegacyDraftInvoice(record)` trả về `true`. Với hóa đơn đã phát hành (`ISSUED`, `PAID`) hoặc có mục đích kế toán (`invoicePurpose`), nút Edit bị ẩn hoàn toàn, không hiển thị trên danh sách hay trang show. |
| **ACT-INV-08** | Deep-link form sửa `/invoices/edit/:id`: Bấm "Save" | Form Submit (`ResourceEditPage`) | `formProps.onFinish()` qua `buildResourceMutation` | `PUT /api/invoices/{id}` | Nếu người dùng nhập trực tiếp URL `/invoices/edit/:id` của một hóa đơn đã phát hành hoặc rated, backend chặn và trả về lỗi `409 Conflict: INVOICE_HISTORY_IMMUTABLE`. |
| **ACT-INV-09** | Tab Rating trong `LoadFinancialPanel`: Nút "Accept" rating | `Button` ("Accept") trong `RatingAcceptance.tsx:30` | `accept()` qua `createRatingAcceptance` | `POST /api/loads/{id}/rating/acceptance` | **TÍNH NĂNG BỊ KHÓA (FEATURE_GATED):** Cờ `BILLING_COMMANDS_RUNTIME_VERIFIED = false` tại `billingCommands.ts:6` khiến `RatingAcceptance` return `null` tại dòng 20, chặn cả thao tác Accept rating trước khi tới form hóa đơn. |
| **ACT-INV-10** | Tab Rating trong `LoadFinancialPanel`: Form Billing Primary | Component `PrimaryInvoiceForm.tsx` (nhúng trong `RatingAcceptance`) | `generate()` / `issue()` | `POST /api/invoices/billing/primary` & `/issue` | Bị ẩn cùng toàn bộ component `RatingAcceptance`. |
| **ACT-INV-11** | Màn hình chi tiết `/invoices/show/:id`: Thao tác nghiệp vụ | *Không có* | *Không có* | *Không có* | **THIẾU TÍNH NĂNG (NOT_IMPLEMENTED):** Trang chi tiết hóa đơn là trang text thuần túy, **hoàn toàn không có các nút bấm thực thi Billing Commands** (Phát hành, Tạo Credit Note, Lập lại Rebill, Bổ sung Supplemental). |

---

## 4. API liên quan

### 4.1. Bảng đối soát Endpoints luồng Invoices, Billing & Tax

| Phân hệ | Phương thức | Endpoint | Controller / Service Backend | Request Body / Params | Response Model |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Invoices CRUD** | `GET` | `/api/invoices` | `InvoiceController.search` | `status, type, customerId, employeeId, page, pageSize, orderBy, descending` *(Chặn `employeeId` bằng 400)* | `ApiResponse<PagedResponse<InvoiceView>>` |
| **Invoices CRUD** | `GET` | `/api/invoices/{id}` | `InvoiceController.getById` | *Path variable: id (UUID)* | `ApiResponse<InvoiceView>` |
| **Invoices CRUD** | `POST` | `/api/invoices` | `InvoiceController.create` | `{ type, status, subtotalAmount, subtotalCurrency, taxTotalAmount, taxTotalCurrency, totalAmount, totalCurrency, taxBehavior?, notes?, dueDate?, loadId?, customerId? }` | `ApiResponse<InvoiceView>` |
| **Invoices CRUD** | `PUT` | `/api/invoices/{id}` | `InvoiceController.update` | `{ type, status, subtotalAmount, subtotalCurrency, taxTotalAmount, taxTotalCurrency, totalAmount, totalCurrency, taxBehavior?, notes?, dueDate?, loadId?, customerId? }` | `ApiResponse<InvoiceView>` |
| **Invoices CRUD** | `DELETE` | `/api/invoices/{id}` | `InvoiceController.delete` | *Path variable: id (UUID)* | `ApiResponse<Void>` |
| **Tax Assessment** | `POST` | `/api/invoices/tax-assessments` | `TaxAssessmentController.capture` | `TaxAssessmentRequest: { jurisdiction, taxType, taxRate, assessedTaxAmount, assessedTaxCurrency, referenceDocumentId, details }` | `ApiResponse<TaxAssessment>` |
| **Tax Assessment** | `GET` | `/api/invoices/tax-assessments/{id}` | `TaxAssessmentController.get` | *Path variable: id (UUID)* | `ApiResponse<TaxAssessment>` |
| **Billing Primary** | `POST` | `/api/invoices/billing/primary` | `BillingController.primary` | `{ idempotencyKey: string, snapshotId: UUID, taxDecision: TaxDecision, lineTaxes: List<LineTax> }` | `ApiResponse<BillingInvoice>` |
| **Billing Issue** | `POST` | `/api/invoices/billing/{id}/issue` | `BillingController.issue` | `{ idempotencyKey: string (max 120 ký tự) }` | `ApiResponse<BillingInvoice>` |
| **Billing Regenerate** | `POST` | `/api/invoices/billing/{id}/regenerate` | `BillingController.regenerate` | `{ expectedSnapshotId: UUID, generation: GenerateInvoiceRequest }` | `ApiResponse<BillingInvoice>` |
| **Billing Supplemental**| `POST` | `/api/invoices/billing/{id}/supplemental` | `BillingController.supplemental` | `{ generation: GenerateInvoiceRequest, chargeIds: List<UUID>, reasonCode: string, reason: string }` | `ApiResponse<BillingInvoice>` |
| **Billing Credit** | `POST` | `/api/invoices/billing/{id}/credit` | `BillingController.credit` | `{ idempotencyKey: string, lines: List<CreditLine>, taxDecision: TaxDecision, reasonCode: string, reason: string }` | `ApiResponse<BillingInvoice>` |
| **Billing Rebill** | `POST` | `/api/invoices/billing/{id}/rebill` | `BillingController.rebill` | `{ generation: GenerateInvoiceRequest, creditEvidenceIds: List<UUID>, reasonCode: string, reason: string }` | `ApiResponse<BillingInvoice>` |
| **Billing Detail** | `GET` | `/api/invoices/billing/{id}` | `BillingController.get` | *Path variable: id (UUID)* | `ApiResponse<BillingInvoice>` |
| **Customer Balance** | `GET` | `/api/customers/{customerId}/balance` | `ReportController.getCustomerBalance` | *Path variable: customerId; param: currency* | `ApiResponse<CustomerBalanceReport>` |

### 4.2. Xử lý mã phản hồi HTTP và Khung lỗi

- **HTTP 200 OK / 201 Created:** Xử lý trả về bọc trong vỏ `ApiResponse.data`. Phía frontend hook Refine tự động kích hoạt cập nhật cache hoặc chuyển hướng trang.
- **HTTP 400 Bad Request:**
  - `INVOICE_LEGACY_PAYROLL_FIELD`: Khi truyền `employeeId` (dưới dạng UUID hợp lệ), `periodStart`, `periodEnd`, `totalDistanceDriven` trong truy vấn search hoặc create/update body (`InvoiceService.java:43,107`). Nếu client truyền non-UUID (ví dụ chuỗi `xxx`), Spring MVC trả HTTP 400 dạng `MethodArgumentTypeMismatchException` trước khi vào service.
  - `INVOICE_VALIDATION_REQUIRED`: Khi thiếu `idempotencyKey`, thiếu snapshotId hoặc lineTaxes rỗng trong billing request (`BillingService.java:33,46`).
  - `INVOICE_TAX_DECISION_REQUIRED`: Khi thiếu quyết định thuế rõ ràng hoặc thiếu lý do (`BillingService.java:58`).
  - `INVOICE_TAX_ASSESSMENT_REQUIRED`: Khi thuế là `REQUIRED` nhưng không có chứng thư thẩm định `assessmentId` (`BillingService.java:62,218`).
  - `INVALID_TAX_ASSESSMENT`: Khi tổng tiền phân bổ thuế dòng không khớp chính xác 100% với số thuế trên assessment hoặc sai lệch currency (`BillingService.java:82`).
  - `INVOICE_INCREMENTAL_CHARGE_REQUIRED`: Khi supplemental chọn các dòng cước không phải accessorial phụ phí tăng thêm hợp lệ (`BillingService.java:186`).
  - `INVOICE_FULL_CREDIT_REQUIRED`: Khi thực hiện rebill mà các chứng cứ credit không đảo nợ đủ 100% số tiền cước và thuế của hóa đơn gốc (`BillingService.java:240`).
- **HTTP 403 Forbidden:**
  - Cấu hình backend tại [`SecurityConfig.java:82-83`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L82-L83) quy định: `.requestMatchers("/api/invoices/**").hasAnyRole("ADMIN", "ACCOUNTANT")`. Bất kỳ người dùng nào không sở hữu role `ADMIN` hoặc `ACCOUNTANT` (như `DISPATCHER`, `DRIVER`, `PAYROLL`) đều bị từ chối 403 Forbidden. Cấu hình này bảo vệ cả billing commands và tax assessments.
  - `Accounting actor must map to tenant employee`: Khi người dùng đăng nhập không ánh xạ được với nhân viên trong bảng `employees` của tenant (`BillingController.java:23` và `TaxAssessmentController.java:24`).
- **HTTP 404 Not Found:**
  - `ResourceNotFoundException`: Khi `invoiceId`, `customerId`, `loadId`, `snapshotId` hoặc `assessmentId` không tồn tại trong cơ sở dữ liệu.
- **HTTP 409 Conflict:**
  - `INVOICE_HISTORY_IMMUTABLE`: Khi cố tình gọi `PUT` hoặc `DELETE` trên hóa đơn đã phát hành (`countsAsRevenue() == true`) hoặc hóa đơn rated (`invoicePurpose != null`) (`InvoiceService.java:101`).
  - `INVOICE_IDEMPOTENCY_CONFLICT`: Khi gửi cùng `idempotencyKey` nhưng nội dung payload bị thay đổi (`BillingService.java:41`).
  - `INVOICE_PRIMARY_EXISTS`: Khi đơn hàng đã có hóa đơn gốc tồn tại trước đó (`BillingService.java:108`) hoặc vi phạm unique index DB `ux_rated_primary_business_key`.
  - `INVOICE_ALREADY_ISSUED`: Khi cố tình gọi lệnh `issue` trên hóa đơn không còn ở trạng thái `DRAFT` (`BillingService.java:132`).
  - `INVOICE_OVER_CREDIT`: Khi số tiền/thuế/số lượng dòng credit vượt quá giá trị còn lại của dòng hóa đơn gốc (`BillingService.java:212`).
  - `INVOICE_REBILL_EXISTS`: Khi hóa đơn gốc đã có một hóa đơn thay thế Rebill trước đó (`BillingService.java:230`).
- **HTTP 422 Unprocessable Content:**
  - `PAYMENT_EXCEEDS_INVOICE_BALANCE`: Khi tạo payment với số tiền vượt quá công nợ còn lại sau khi trừ các khoản đã giữ chỗ (`request.amountAmount() > totalAmount - reserved`, `PaymentService.java:75`).

---

## 5. Business rules

### 5.1. Vòng đời Trạng thái Hóa đơn & Phân biệt Giữ chỗ vs Thanh toán Thực tế

1. **Vòng đời Phát hành Hóa đơn:**
   ```
   [ DRAFT ] ─────────── (POST /api/invoices/billing/{id}/issue) ───────────► [ ISSUED ]
      │
   (cancelled)
      ▼
   [ CANCELLED ]
   ```
   - Hóa đơn rated khởi tạo ở trạng thái `DRAFT`. Khi phát hành qua lệnh `issue`, hóa đơn chuyển sang `ISSUED`.
   - Các trạng thái `ISSUED`, `SENT`, `PARTIALLY_PAID`, `PAID` được xác định là ghi nhận doanh thu vào báo cáo tài chính (`InvoiceStatus.countsAsRevenue() == true`).
   - Quy tắc Bất biến Lịch sử Kế toán: Hóa đơn đã ghi nhận doanh thu hoặc có `invoicePurpose != null` bị cấm tuyệt đối chỉnh sửa qua CRUD thông thường (`InvoiceService.requireEditable()`).

2. **Phân biệt Khoản Giữ Chỗ (Payment Reservation) và Tiền Đã Thanh Toán Thực Tế (Settled Payments):**
   - **Tạo Phiếu thu (`PaymentService.create()`):**
     + Khi tạo phiếu thu, payment được lưu ở trạng thái mặc định là `PENDING` (`PaymentService.java:77`).
     + **Mã nguồn KHÔNG hề tự động chuyển trạng thái của invoice sang `PARTIALLY_PAID` hay `PAID`**.
     + Để ngăn ngừa tình trạng thu trùng / thanh toán vượt số dư khi có nhiều giao dịch đang xử lý đồng thời, hệ thống tính toán **khoản giữ chỗ (reserved amount)**:
       $$\text{reserved} = \sum_{\text{payment } \notin \{\text{CANCELLED, VOID}\}} \text{payment.amountAmount}$$
     + Nếu `request.amountAmount() > invoice.totalAmount - reserved`, hệ thống từ chối với lỗi 422 `PAYMENT_EXCEEDS_INVOICE_BALANCE`.
   - **Báo cáo Công nợ Khách hàng (`RevenueCalculator.java:71-84`):**
     + Chỉ những payment có trạng thái thực sự hoàn tất (`completed`, `paid`, `succeeded`, `settled`) mới được cộng dồn vào `paidAmount`:
       $$\text{paidAmount} = \sum_{\text{payment.status } \in \{\text{COMPLETED, PAID, SUCCEEDED, SETTLED}\}} \text{payment.amountAmount}$$
       $$\text{openBalance} = \text{totalAmount} - \text{paidAmount}$$
     + Các payment ở trạng thái `PENDING` tuy được tính vào `reserved` để chặn tạo thêm payment, nhưng **chưa được coi là tiền đã trả trong báo cáo doanh thu/công nợ**.
   - **Khoảng trống Hiện thực:** Trong `PaymentController.java`, backend hiện chỉ có các endpoint `create`, `update`, `cancel` (và `@Deprecated delete`), **hoàn toàn chưa có endpoint hoặc tiến trình nền để hoàn tất/settle payment (completion workflow)**, cũng như chưa có cơ chế đồng bộ trạng thái `PARTIALLY_PAID`/`PAID` ngược lại cho `Invoice`.

### 5.2. Chuỗi Hóa đơn có Chữ ký & Dấu Kinh tế (Signed Billing Chain & Economic Signs)
1. **Dấu Kinh tế (Economic Sign):**  
   - Mỗi hóa đơn trong chuỗi thanh toán có một dấu kinh tế bắt buộc:
     - Hóa đơn gốc (`PRIMARY`), Hóa đơn phụ phí (`SUPPLEMENTAL`), Hóa đơn thay thế (`REBILL`): $\text{economicSign} = +1$ (tăng doanh thu/công nợ).
     - Hóa đơn điều chỉnh giảm / ghi có (`CREDIT`): $\text{economicSign} = -1$ (giảm trừ doanh thu/công nợ).
   - Nếu `invoicePurpose` và `economicSign` không đồng nhất, backend ném lỗi 400 `INVOICE_ECONOMIC_SIGN_INVALID` (`Invoice.java:96`).
2. **Kiểm soát Trần Tín dụng (Credit Cap):**  
   - Khi tạo Credit Note (`BillingService.credit`), hệ thống kiểm tra số tiền lũy kế đã credit trên từng dòng hàng:
     $$\sum \text{credited\_amount} + \text{new\_credit\_amount} \le \text{original\_line\_amount}$$
     $$\sum \text{credited\_tax} + \text{new\_credit\_tax} \le \text{original\_line\_tax}$$
   - Nếu vượt quá, hệ thống từ chối ngay với lỗi `409 Conflict: INVOICE_OVER_CREDIT` (`BillingService.java:212`).
3. **Quy tắc Lập lại Hóa đơn (Rebill):**  
   - Hóa đơn Rebill chỉ được phép tạo khi và chỉ khi hóa đơn cũ đã được đảo nợ hoàn toàn 100% bằng các credit notes hợp lệ (`INVOICE_FULL_CREDIT_REQUIRED`, `BillingService.java:240`).
   - Rebill bắt buộc phải sử dụng một snapshot giá cước mới (`new accepted snapshot`), không được dùng lại snapshot cũ (`BillingService.java:242`).

### 5.3. Quy tắc Quyết định Thuế & Thẩm định Thuế (Tax Decision Policy & Assessment)
1. Quyết định thuế trong billing phải là `REQUIRED` hoặc `NOT_REQUIRED` kèm mã lý do (`reasonCode`), diễn giải (`reason`), và tham chiếu nguồn (`sourceReference`) ([`BillingService.java:55-58`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L55-L58)).
2. Nếu là `REQUIRED`, bắt buộc phải có `assessmentId` của một bản thẩm định thuế đã được thu nhận qua `POST /api/invoices/tax-assessments`.
3. Phân bổ thuế dòng (`lineTaxes`):
   - Mã tiền tệ phân bổ phải khớp tiền tệ hóa đơn (`CURRENCY_MISMATCH`).
   - Tổng số tiền thuế phân bổ trên các dòng hàng phải khớp chính xác 100% với số thuế ghi trên bản thẩm định (`BillingService.java:81-83`). Bất kỳ sai lệch nào đều bị từ chối 400 `INVALID_TAX_ASSESSMENT`.
4. Nếu là `NOT_REQUIRED`, hóa đơn phải có audit đầy đủ lý do miễn trừ thuế và `tax_total_amount` phải bằng 0.

### 5.4. Quy tắc Tính Công nợ & Quá hạn trên Giao diện
1. **Công nợ hiển thị trên bảng danh sách:**
   - Cột Balance đọc từ `record.balance ?? record.openBalance`.
   - Do DTO backend không cung cấp trường này, UI hiển thị `—`.
2. **Quy tắc Quá hạn (Overdue Rules):**  
   - Hóa đơn được coi là quá hạn khi: `!isPaid && overdueDays > 0` (ngày hiện tại đã vượt quá `dueDate` theo múi giờ dự án) ([`columns.tsx:126-128`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx#L126-L128)).
   - Hóa đơn đã thanh toán đầy đủ (`status === "paid"` hoặc `balance <= 0`), đã hủy (`cancelled`), hoặc vô hiệu (`voided`) thì **không bao giờ bị gắn cờ quá hạn**, bất kể ngày đến hạn trong quá khứ ([`columns.tsx:18-28`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx#L18-L28)).

---

## 6. Phân quyền

### 6.1. Ma trận đối soát phân quyền Frontend & Backend

| Vai trò người dùng (JWT Role) | Quyền UI Invoices (`roleMatrix.ts:33`) | Quyền gọi API CRUD `/api/invoices/**` | Quyền gọi API Billing `/api/invoices/billing/**` | Quyền Tax Assessment `/api/invoices/tax-assessments/**` | Đánh giá an ninh & Trải nghiệm |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **ADMIN** | Toàn quyền (`CRUD`, `BILLING_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Có thể xem, lập hóa đơn, thẩm định thuế và thực thi toàn bộ lệnh kế toán. |
| **ACCOUNTANT** | Toàn quyền (`CRUD`, `BILLING_*`) | Cho phép (`hasAnyRole`) | Cho phép | Cho phép | **HỢP LỆ:** Vai trò chuyên trách của bộ phận kế toán tài chính. |
| **DISPATCHER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **HỢP LỆ:** Điều phối viên không có quyền can thiệp vào hóa đơn tài chính của khách hàng. |
| **DRIVER** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **HỢP LỆ:** Tài xế không có quyền xem hoặc sửa hóa đơn khách hàng. |
| **PAYROLL** | Bị từ chối (`Forbidden`) | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **Bị chặn 403 Forbidden** | **HỢP LỆ:** Nhân viên tính lương nội bộ không truy cập hóa đơn bán hàng. |

### 6.2. Kiểm tra Ranh giới Đa khách hàng & Nhân viên Tenant (Tenant Boundary)
- **Tầng database:** Bảng `invoices` và `tax_assessments` thuộc tenant schema riêng biệt.
- **Tầng controller (Actor Validation):**
  - Trong `BillingController.java:23`: Actor bắt buộc phải ánh xạ tới một nhân viên thuộc tenant (`employees.findByEmail(auth.getName())`). Nếu không tìm thấy, hệ thống ném 403 `ForbiddenException("Billing actor must map to tenant employee")`.
  - Trong `TaxAssessmentController.java:23-24`: Áp dụng kiểm tra tương tự, nếu không ánh xạ được nhân viên tenant sẽ ném 403 `ForbiddenException("Accounting actor must map to tenant employee")`.

---

## 7. Test cases

| ID | Nhóm kiểm thử | Kịch bản kiểm thử | Thao tác kiểm định | Kết quả mong đợi | Trạng thái kiểm định & Bằng chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-INV-01** | Happy Path | Hiển thị bảng danh sách hóa đơn và format tiền tệ | Render `InvoiceTableHarness` với dữ liệu hóa đơn | Cột `number` hiển thị link, `totalAmount` format tiền tệ, có class `tabular-nums` và `align: right`. | `UNIT_TEST_PASS` (Component)<br>Khớp [`invoiceColumns.test.tsx:102-118`](file:///home/vumoi/logictics-app/src/tests/features/invoices/invoiceColumns.test.tsx#L102-L118). |
| **TC-INV-02** | Happy Path | Hiển thị cảnh báo quá hạn khi chưa thanh toán đủ | Hóa đơn có `dueDate` trong quá khứ, `status: issued` | Hiển thị Tag đỏ `table-overdue-tag` với nội dung `"Quá hạn X ngày"`. | `UNIT_TEST_PASS` (Component)<br>Khớp [`invoiceColumns.test.tsx:165-189`](file:///home/vumoi/logictics-app/src/tests/features/invoices/invoiceColumns.test.tsx#L165-L189). |
| **TC-INV-03** | Boundary | Không hiển thị cảnh báo quá hạn khi đã thanh toán đủ | Hóa đơn quá hạn nhưng `status: paid` hoặc `balance: 0` | Không hiển thị tag quá hạn, chỉ hiển thị ngày đến hạn bình thường. | `UNIT_TEST_PASS` (Component)<br>Khớp [`invoiceColumns.test.tsx:191-211`](file:///home/vumoi/logictics-app/src/tests/features/invoices/invoiceColumns.test.tsx#L191-L211). |
| **TC-INV-04** | Navigation | Link từ số hiệu hóa đơn sang trang chi tiết | Click vào số hiệu hóa đơn trên bảng | Thẻ `<a>` có class `table-number-link` và href dạng `/invoices/show/:id`. | `UNIT_TEST_PASS` (Component)<br>Khớp [`invoiceColumns.test.tsx:93-100`](file:///home/vumoi/logictics-app/src/tests/features/invoices/invoiceColumns.test.tsx#L93-L100). |
| **TC-INV-05** | Data Defect | Hiển thị cột Balance trên bảng danh sách | Kiểm tra dữ liệu cột `balance` của hóa đơn từ API | **LỖI DỮ LIỆU (BUG-INV-01):** Cột hiển thị `—` vì backend DTO `InvoiceView` không có trường balance. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`InvoiceView.java:9-35`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/invoice/InvoiceView.java#L9-L35) và [`columns.tsx:225-234`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx#L225-L234). |
| **TC-INV-06** | State Conflict | Sửa hóa đơn đã phát hành (ISSUED) qua API CRUD | Gửi `PUT /api/invoices/{id}` khi invoice có `status: ISSUED` | Backend từ chối với mã lỗi `409 Conflict: INVOICE_HISTORY_IMMUTABLE`. | `SOURCE_REVIEWED`<br>Khớp logic `requireEditable` tại [`InvoiceService.java:100-103`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/InvoiceService.java#L100-L103). |
| **TC-INV-07** | Business Gap | Tạo hóa đơn qua form Generic thiếu dòng hàng Line Items | Mở form `/invoices/create` và kiểm tra cấu trúc form | Form chỉ có các ô nhập tổng tiền, không có bảng thêm Line Items; DB không lưu line items. | `SOURCE_REVIEWED`<br>Khớp định nghĩa [`resourceForms.ts:583-595`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts#L583-L595) và [`CreateInvoiceRequest.java:10-28`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/invoice/CreateInvoiceRequest.java#L10-L28). |
| **TC-INV-08a**| Contract Wire | Chặn filter `employeeId` cũ tại tầng frontend wire | Gọi `provider.getList` với filter `employeeId` | Frontend wire client ném lỗi `FILTER_FIELD_NOT_ALLOWED` và không gửi request ra mạng. | `UNIT_TEST_PASS` (Contract)<br>Khớp [`handoffWire.test.ts:88-89`](file:///home/vumoi/logictics-app/src/tests/contracts/handoffWire.test.ts#L88-L89). |
| **TC-INV-08b**| Legacy API Rejection | Lọc hóa đơn theo `employeeId` qua API backend | Gửi `GET /api/invoices?employeeId=00000000-0000-0000-0000-000000000001` (UUID hợp lệ) | Backend ném lỗi 400 `INVOICE_LEGACY_PAYROLL_FIELD`. (Nếu gửi non-UUID `xxx`, Spring MVC trả 400 TypeMismatch). | `SOURCE_REVIEWED`<br>Khớp [`InvoiceController.java:41`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/InvoiceController.java#L41) và [`InvoiceService.java:42-44`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/InvoiceService.java#L42-L44). |
| **TC-INV-09** | Feature Gate | Kiểm tra component RatingAcceptance và PrimaryInvoiceForm | Kiểm tra render component trong tab Rating của `LoadFinancialPanel` | Toàn bộ component trả về `null` vì `BILLING_COMMANDS_RUNTIME_VERIFIED = false`. | `SOURCE_REVIEWED`<br>Khớp [`LoadFinancialPanel.tsx:26-34`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadFinancialPanel.tsx#L26-L34), [`RatingAcceptance.tsx:20`](file:///home/vumoi/logictics-app/src/features/rates/components/RatingAcceptance.tsx#L20) và [`billingCommands.ts:6`](file:///home/vumoi/logictics-app/src/features/invoices/api/billingCommands.ts#L6). |
| **TC-INV-10** | Missing UI | Thực thi lệnh phát hành (Issue) từ trang chi tiết hóa đơn | Mở trang `/invoices/show/:id` | Trang chi tiết chỉ là ResourceShowPage generic, không có nút bấm Issue hay Credit. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`src/pages/invoices/show.tsx:3`](file:///home/vumoi/logictics-app/src/pages/invoices/show.tsx#L3). |
| **TC-INV-11** | Tax Validation | Quyết định thuế REQUIRED nhưng không có assessmentId | Gửi `POST /api/invoices/billing/primary` với `taxDecision.requirement = REQUIRED`, không có `assessmentId` | Backend từ chối 400: `INVOICE_TAX_ASSESSMENT_REQUIRED`. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`BillingService.java:62`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L62). |
| **TC-INV-12** | Credit Cap | Tạo Credit Note vượt quá số tiền của dòng hóa đơn gốc | Gửi `POST /api/invoices/billing/{id}/credit` với `amount > originalLineAmount` | Backend từ chối với lỗi `409 Conflict: INVOICE_OVER_CREDIT`. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`BillingService.java:212`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L212). |
| **TC-INV-13** | Rebill Integrity| Lập hóa đơn thay thế Rebill khi chưa credit đủ 100% cước | Gửi `POST /api/invoices/billing/{id}/rebill` khi tổng credit < original subtotal | Backend từ chối với lỗi `400 Bad Request: INVOICE_FULL_CREDIT_REQUIRED`. | `SOURCE_REVIEWED`<br>Khớp mã nguồn [`BillingService.java:240`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L240). |
| **TC-INV-14** | Permission Policy | Kiểm tra chính sách phân quyền cho vai trò DISPATCHER | Kiểm tra ma trận phân quyền frontend và matcher backend | Frontend matrix từ chối quyền invoices; Backend matcher trả 403 Forbidden. | `UNIT_TEST_PASS` (Policy) & `SOURCE_REVIEWED`<br>Khớp [`roleMatrix.test.ts:31`](file:///home/vumoi/logictics-app/src/tests/providers/permissions/roleMatrix.test.ts#L31) và [`SecurityConfig.java:82-83`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/config/SecurityConfig.java#L82-L83). |
| **TC-INV-15** | Capability Gate | Kiểm tra nút Xóa (Delete) trên giao diện hóa đơn | Mở bảng danh sách `/invoices` và xem cột hành động | Nút Delete bị ẩn hoàn toàn do `resourceCapabilities.invoices.delete = false`. | `SOURCE_REVIEWED`<br>Khớp cấu hình tại [`resourceCapabilities.ts:24`](file:///home/vumoi/logictics-app/src/components/resources/resourceCapabilities.ts#L24). |
| **TC-INV-16** | Positive Path | Tạo PRIMARY hóa đơn thành công với tax assessment hợp lệ | Gửi `POST /api/invoices/billing/primary` với assessment và allocations chính xác | Backend tạo hóa đơn PRIMARY ở trạng thái DRAFT, ghi nhận audit command, snapshot linkage. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:32-118`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L32-L118). |
| **TC-INV-17** | Tax Not Required| Tạo PRIMARY với quyết định thuế NOT_REQUIRED | Gửi `POST /api/invoices/billing/primary` với `taxDecision.requirement = NOT_REQUIRED` kèm reason | Backend chấp nhận, gán tax = 0 và ghi nhận lý do miễn trừ vào audit log. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:55-58`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L55-L58). |
| **TC-INV-18** | Tax Validation | Lệch tiền tệ assessment hoặc tổng thuế dòng không khớp | Gửi PRIMARY với `lineTaxes` có tổng lệch so với `assessment.amount` hoặc sai currency | Backend từ chối 400: `INVALID_TAX_ASSESSMENT` hoặc `CURRENCY_MISMATCH`. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:70-83`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L70-L83). |
| **TC-INV-19** | Idempotency | Gửi lại cùng `idempotencyKey` và cùng nội dung input hash | Gửi lại cùng request PRIMARY đã thành công trước đó | Backend trả về kết quả hóa đơn đã tạo mà không thực hiện duplicate insert. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:37-40`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L37-L40). |
| **TC-INV-20** | Idempotency Conflict | Gửi cùng `idempotencyKey` nhưng thay đổi nội dung payload | Gửi cùng idempotencyKey với thông số khác (snapshotId khác) | Backend phát hiện hash sai lệch và ném lỗi `409 Conflict: INVOICE_IDEMPOTENCY_CONFLICT`. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:41`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L41). |
| **TC-INV-21** | Primary Duplicate | Tạo hóa đơn PRIMARY thứ hai cho cùng Load, Customer, Currency | Gửi `POST /api/invoices/billing/primary` khi Load đã có PRIMARY invoice | Backend từ chối `409 Conflict: INVOICE_PRIMARY_EXISTS`; DB bảo vệ bởi index `ux_rated_primary_business_key`. | `SOURCE_REVIEWED`<br>Khớp [`BillingService.java:108`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L108) và migration V26. |
| **TC-INV-22** | Issue Command | Phát hành hóa đơn DRAFT sang ISSUED và xử lý xung đột | Gửi `POST /api/invoices/billing/{id}/issue` trên DRAFT invoice, sau đó gửi lại | Lần 1 chuyển sang ISSUED thành công; lần 2 gửi lại bị từ chối `409 Conflict: INVOICE_ALREADY_ISSUED`. | `SOURCE_REVIEWED`<br>Khớp logic [`BillingService.java:124-142`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L124-L142). |
| **TC-INV-23** | Payment Reservation | Tạo payment PENDING và kiểm tra khoản giữ chỗ (Reserved) | Tạo payment mới cho invoice có số tiền còn lại $100; gửi payment $120 | Backend từ chối 422: `PAYMENT_EXCEEDS_INVOICE_BALANCE` dựa trên tổng reserved amount của các payment active. | `SOURCE_REVIEWED`<br>Khớp logic [`PaymentService.java:64-75`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/PaymentService.java#L64-L75). |
| **TC-INV-24** | Bypass Analysis | Gọi generic create với status ghi nhận doanh thu | Gửi `POST /api/invoices` với `status: ISSUED` qua generic CRUD | DB cho phép lưu vì `invoice_purpose` là null (né constraint V26); hóa đơn có status ISSUED nhưng không có snapshot/audit. | `SOURCE_REVIEWED`<br>Khớp [`InvoiceService.java:58-64`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/InvoiceService.java#L58-L64) và migration V26. |
| **TC-INV-25** | UI Guard Visibility| Kiểm tra ẩn nút Edit với hóa đơn đã phát hành trên bảng | Render `ActionButtons` với invoice có `status: "ISSUED"` | Nút Edit không được hiển thị nhờ `isLegacyDraftInvoice` trả về false. | `UNIT_TEST_PASS` (Predicate)<br>Khớp logic [`ActionButtons.tsx:50`](file:///home/vumoi/logictics-app/src/components/ActionButtons.tsx#L50) và [`invoiceMutability.ts:2-6`](file:///home/vumoi/logictics-app/src/features/invoices/utils/invoiceMutability.ts#L2-L6). |

---

## 8. Confirmed bugs

### BUG-INV-01: Cột Công nợ (Balance) trên Danh sách Hóa đơn vĩnh viễn hiển thị dấu gạch ngang '—'
- **Mã lỗi:** `BUG-INV-01`
- **Mức độ nghiêm trọng:** **P2** (Medium — Data Presentation / Accounts Receivable Visibility)
- **Phân loại:** `BUG_CONFIRMED` (Xác nhận qua đối soát DTO Backend và Frontend Component)
- **Mô tả:**
  - Trên giao diện bảng danh sách hóa đơn ([`src/features/invoices/components/columns.tsx:225-234`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx#L225-L234)), hệ thống cấu hình cột "Công nợ / Số dư" (`columns.invoices.balance`) đọc từ trường `record.balance ?? record.openBalance`.
  - Tuy nhiên, phía backend DTO `InvoiceView.java` ([`InvoiceView.java:9-35`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/invoice/InvoiceView.java#L9-L35)), record chỉ trả về:
    `id, number, type, status, taxBehavior, notes, dueDate, loadId, customerId, customerName, subtotalAmount, taxTotalAmount, totalAmount, ...` mà **hoàn toàn không có trường `balance` hoặc `openBalance`**.
  - Thực thể `Invoice.java` cũng không có cột lưu số dư công nợ.
  - Hậu quả: Toàn bộ danh sách hóa đơn tại `/invoices` luôn hiển thị giá trị `—` (ô trống) ở cột Công nợ. Nhân viên kế toán không thể biết được hóa đơn nào đã được thanh toán bao nhiêu, còn nợ bao nhiêu mà không cần mở chi tiết từng phiếu thu tiền bên module Payments.
  - Ngoài ra, hàm kiểm tra hóa đơn đã thanh toán đủ `isInvoiceFullyPaid(record)` ([`columns.tsx:23-26`](file:///home/vumoi/logictics-app/src/features/invoices/components/columns.tsx#L23-L26)) bị vô hiệu hóa nhánh kiểm tra theo số dư (`balance <= 0`), buộc phải dựa hoàn toàn vào chuỗi trạng thái (`status === "paid"`).
- **Bước tái hiện:**
  1. Đăng nhập với tài khoản Kế toán (`ACCOUNTANT`), truy cập đường dẫn `/invoices`.
  2. Quan sát cột "Công nợ" (Balance) trên tất cả các dòng hóa đơn.
- **Kết quả mong đợi:** Cột Công nợ hiển thị số tiền còn phải thu của hóa đơn (Số tiền tổng trừ đi các khoản thanh toán đã xác nhận).
- **Kết quả thực tế (từ Source Review):** DTO không có trường dữ liệu, component fallback hiển thị dấu gạch ngang `"—”`.
- **Đề xuất sửa:**
  1. Trong backend `InvoiceRepository` hoặc `InvoiceService.search`, bổ sung tính toán số dư công nợ còn lại dựa trên các khoản thanh toán đã hoàn tất.
  2. Bổ sung trường `BigDecimal balance` vào record `InvoiceView.java` và type `InvoiceResponse` trong [`src/types/invoice.dto.ts`](file:///home/vumoi/logictics-app/src/types/invoice.dto.ts).

---

### BUG-INV-02: Form Tạo hóa đơn Generic không hỗ trợ Dòng hàng (Line Items) và Rủi ro Làm Đổ vỡ Đối soát Doanh thu Downstream
- **Mã lỗi:** `BUG-INV-02`
- **Mức độ nghiêm trọng:** **P1** (High — Business Financial Integrity Gap & Downstream Crash Risk)
- **Phân loại:** `BUG_CONFIRMED` (Xác nhận qua đối soát mã nguồn và hợp đồng kỹ thuật)
- **Mô tả & Căn cứ kỹ thuật (Source Fact):**
  - Trong form tạo hóa đơn generic của frontend ([`src/components/resources/resourceForms.ts:583-595`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts#L583-L595)), hệ thống chỉ cung cấp các ô nhập tự do: `subtotalAmount`, `taxTotalAmount`, `totalAmount` mà **hoàn toàn không có phần nhập chi tiết các mục dòng hàng (Line Items)**.
  - Phía backend DTO `CreateInvoiceRequest.java:10-28` cũng không có trường nhận `lineItems`.
  - Backend `InvoiceService.create()` ([`InvoiceService.java:57-63`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/InvoiceService.java#L57-L63)) trực tiếp lưu hóa đơn mà không tạo dòng hàng, không kiểm tra đẳng thức `subtotal + tax == total`, và không gọi kiểm tra đối soát.
- **Rủi ro Hệ quả Downstream (Downstream Impact Inference):**
  - Trong module tính toán tài chính doanh thu, `RevenueCalculator.java:60-62` gọi `invoiceReconciliationService.reconcile(invoice)` đối với tất cả các hóa đơn hợp lệ.
  - Tại [`InvoiceReconciliationService.java:24-42`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/calculation/InvoiceReconciliationService.java#L24-L42), hệ thống so sánh `subtotalAmount` đã ghi nhận với tổng tiền của các dòng hàng (`linesSum`):
    ```java
    if (roundedRecorded.compareTo(roundedLines) != 0) {
        throw new InvoiceReconciliationException(invoice.getId(), roundedRecorded, roundedLines);
    }
    ```
  - Nếu một hóa đơn generic được tạo ra với `subtotalAmount > 0` và không có dòng hàng nào (`linesSum = 0`), khi `RevenueCalculator` chạy để lập báo cáo doanh thu, `InvoiceReconciliationService` sẽ ném ngoại lệ `InvoiceReconciliationException`, làm gián đoạn và crash toàn bộ tiến trình báo cáo tài chính của tenant.
- **Bối cảnh Hợp đồng Tích hợp (Contract Context):**
  - Theo tài liệu handoff kỹ thuật ([`docs/frontend-backend-handoff/docs/frontend-backend-integration-context.md:494-504`](file:///home/vumoi/logictics-app/docs/frontend-backend-handoff/docs/frontend-backend-integration-context.md#L494-L504)), generic `/api/invoices` là legacy CRUD route, không dùng để bypass rated billing commands. Hiện chưa có văn bản yêu cầu sản phẩm quy định generic route bắt buộc phải hỗ trợ rated line items. Tuy nhiên, sự tồn tại của route legacy tạo hóa đơn không dòng hàng là một lỗ hổng gây xung đột trực tiếp với yêu cầu đối soát bắt buộc của `RevenueCalculator`.
- **Đề xuất xử lý:**
  1. Nếu duy trì luồng tạo hóa đơn thủ công (Manual Invoice): Bổ sung `lineItems` vào `CreateInvoiceRequest.java`, component nhập Line Items trên frontend, và validation kiểm tra `subtotal + tax == total`.
  2. Nếu hóa đơn bắt buộc phải xuất phát từ định mức cước (Rated Billing): Vô hiệu hóa route tạo generic `POST /api/invoices` và chỉ cho phép tạo hóa đơn qua Billing Commands (`/api/invoices/billing/primary`).

---

## 9. Unverified risks

### RISK-INV-01: Không có cơ chế Khóa Lạc quan (Optimistic Locking) khi Chỉnh sửa Hóa đơn CRUD
- **Mã nguy cơ:** `RISK-INV-01`
- **Mức độ rủi ro:** **P2** (Medium — Concurrency / Data Overwrite)
- **Phân loại:** `RISK_UNVERIFIED` (Suy luận từ phân tích mã nguồn)
- **Mô tả:** 
  - Trong `resourceMutationContracts` ([`src/types/handoff.generated.ts:681`](file:///home/vumoi/logictics-app/src/types/handoff.generated.ts#L681)), tài nguyên `invoices` được cấu hình `"versioned": false`. Entity `Invoice.java` kế thừa `BaseAuditableEntity` nhưng không có trường `@Version`.
  - Backend `InvoiceService.update()` ([`InvoiceService.java:68`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/InvoiceService.java#L68)) sử dụng `findByIdForUpdate(id)` (khóa bi quan trong phạm vi transaction ngắn) nhưng hoàn toàn không kiểm tra phiên bản dữ liệu từ client (`expectedVersion`).
  - Rủi ro: Nếu hai kế toán viên cùng mở màn hình chỉnh sửa một hóa đơn nháp cùng lúc, người bấm Save sau sẽ ghi đè dữ liệu của người trước mà không có cảnh báo xung đột đồng thời.

### RISK-INV-02: Rủi ro Tiền tệ Không Đồng nhất giữa các Trường trong cùng một Hóa đơn Generic
- **Mã nguy cơ:** `RISK-INV-02`
- **Mức độ rủi ro:** **P2** (Medium — Financial Integrity / Multi-currency)
- **Phân loại:** `RISK_UNVERIFIED` (Suy luận từ phân tích mã nguồn)
- **Mô tả:**
  - Trong `CreateInvoiceRequest.java:19-24`, client gửi 3 cặp số tiền và tiền tệ riêng biệt: `subtotalCurrency`, `taxTotalCurrency`, `totalCurrency`.
  - Backend `InvoiceService.java` không hề có validation kiểm tra sự đồng nhất giữa 3 loại tiền tệ này (`CurrencyGuard.requireSameCurrency`).
  - Người dùng có thể gửi request với `subtotalCurrency = "USD"`, `taxTotalCurrency = "VND"`, `totalCurrency = "EUR"`, backend vẫn lưu cả 3 mã tiền tệ khác nhau vào các cột của bảng `invoices`.
  - Khi đối soát thanh toán tại `PaymentService.java:63`, hệ thống chỉ kiểm tra `totalCurrency`, gây nguy cơ sai lệch nghiêm trọng về báo cáo thuế và doanh thu đa tiền tệ.

### RISK-INV-03: Lỗ hổng Né tránh Ràng buộc Billing Commands qua Tuyến đường Tạo Generic Invoice
- **Mã nguy cơ:** `RISK-INV-03`
- **Mức độ rủi ro:** **P1** (High — Security / Financial Governance Bypass)
- **Phân loại:** `RISK_UNVERIFIED` (Suy luận từ phân tích mã nguồn và migration SQL)
- **Mô tả:**
  - `CreateInvoiceRequest.java:12` chấp nhận bất kỳ giá trị `@NotBlank String status`. Khi client gửi request tạo hóa đơn với `status: "ISSUED"`, `InvoiceService.create()` lưu trực tiếp vào cơ sở dữ liệu mà không ép về `DRAFT`.
  - Theo `InvoiceStatus.java:14-16`, trạng thái `ISSUED` trả về `countsAsRevenue() == true`.
  - Đáng chú ý, ràng buộc cơ sở dữ liệu trong migration V26 ([`V26__link_rated_primary_invoices_and_command_audit.sql:18-33`](file:///home/vumoi/logictics_api/src/main/resources/db/migration/tenant/V26__link_rated_primary_invoices_and_command_audit.sql#L18-L33)) được định nghĩa:
    `ADD CONSTRAINT ck_rated_invoice_identity CHECK (invoice_purpose IS NULL OR (...))`
  - Do hóa đơn tạo qua generic CRUD có `invoice_purpose = null`, toàn bộ các ràng buộc nghiêm ngặt của hệ thống billing rated (bắt buộc có snapshot giá cước, có billing chain, có thẩm định thuế, tổng tiền khớp thuế, kiểm tra idempotency, audit trail) **hoàn toàn bị bỏ qua**.
  - Rủi ro: Một actor có quyền kế toán có thể gọi trực tiếp API `POST /api/invoices` để ghi nhận doanh thu phát hành mà không cần thông qua thẩm định thuế và phê duyệt giá cước của hệ thống. Cần chặn tạo hóa đơn với trạng thái ghi nhận doanh thu qua generic route (chỉ cho phép tạo `DRAFT`).

### RISK-INV-04: Nguy cơ Xung đột khi Truy cập Trực tiếp (Deep-link) vào URL Sửa Hóa đơn Bất biến
- **Mã nguy cơ:** `RISK-INV-04`
- **Mức độ rủi ro:** **P3** (Low — UX Direct Navigation Handling)
- **Phân loại:** `RISK_UNVERIFIED`
- **Mô tả:**
  - Dù nút Edit trên danh sách và trang show đã bị ẩn đối với hóa đơn không phải draft thuần túy (`isLegacyDraftInvoice`), nhưng nếu người dùng cố ý nhập URL trực tiếp dạng `/invoices/edit/:id` của một hóa đơn đã `ISSUED` hoặc rated, component `ResourceEditPage` vẫn mở ra và hiển thị form chỉnh sửa.
  - Khi người dùng bấm Save, backend `InvoiceService.requireEditable()` sẽ trả về `409 Conflict: INVOICE_HISTORY_IMMUTABLE`. Dù backend đã đóng vai trò chốt chặn an toàn thành công, giao diện frontend thiếu một route guard để chuyển hướng hoặc hiển thị trang báo lỗi Read-only ngay khi truy cập deep-link.

---

## 10. Missing functionality

1. **`[FEATURE_GATED]` Bộ tính năng Chấp thuận Cước và Form Lập hóa đơn Định mức bị khóa ở Runtime:**  
   - Vị trí: Tab "Rating" trong `LoadFinancialPanel` ([`src/features/loads/components/LoadFinancialPanel.tsx:26-34`](file:///home/vumoi/logictics-app/src/features/loads/components/LoadFinancialPanel.tsx#L26-L34)), hiển thị view `FscPreview`.
   - Trong view này, component `RatingAcceptance.tsx:20` kiểm tra:
     `if (!runtimeVerified) return null;`
     với cờ cấu hình `BILLING_COMMANDS_RUNTIME_VERIFIED = false` ([`billingCommands.ts:6`](file:///home/vumoi/logictics-app/src/features/invoices/api/billingCommands.ts#L6)).
   - Do cờ này mang giá trị `false`, toàn bộ component `RatingAcceptance` trả về `null`, chặn cả **nút bấm Chấp thuận giá cước (Accept rating)** lẫn component con lập hóa đơn **`PrimaryInvoiceForm.tsx`**.
   - *Đánh giá QA:* Đây là trạng thái có chủ đích nhằm kiểm soát tính năng trước khi nghiệm thu tích hợp đầy đủ (Feature Gate), không tự thân là một lỗi hư hỏng mã nguồn.
2. **`[NOT_IMPLEMENTED]` Thiếu Giao diện thực thi Billing Commands trên Trang Chi tiết Hóa đơn:**  
   Backend Spring Boot đã hỗ trợ đầy đủ bộ API kế toán chuyên sâu: `issue` (phát hành hóa đơn), `regenerate` (tạo lại draft khi đổi cước), `supplemental` (hóa đơn phụ phí tăng thêm), `credit` (hóa đơn điều chỉnh giảm / credit note), `rebill` (lập hóa đơn thay thế toàn phần sau credit đảo nợ). Tuy nhiên, trang chi tiết `/invoices/show/:id` hiện chỉ là trang hiển thị text tĩnh generic, **hoàn toàn không có nút bấm, modal hay giao diện nào** để người dùng kế toán gọi các lệnh này.
3. **`[NOT_IMPLEMENTED]` Thiếu Endpoint / Workflow Hoàn tất Thanh toán (Payment Completion/Settlement):**  
   Hệ thống có thể tạo payment ở trạng thái `PENDING` và hủy payment, nhưng hoàn toàn thiếu API và quy trình nghiệp vụ để xác nhận thanh toán thành công (`SETTLED`/`COMPLETED`) và tự động cập nhật trạng thái hóa đơn sang `PARTIALLY_PAID` hoặc `PAID`.
4. **`[NOT_IMPLEMENTED]` Chưa có tính năng In / Xuất hóa đơn định dạng PDF:**  
   Trong quy trình vận hành logistics thực tế, kế toán cần xuất hóa đơn dạng file PDF có mã số thuế, chữ ký điện tử và danh sách chi tiết các chặng dừng để gửi cho khách hàng. Hệ thống hiện chưa có endpoint hay component sinh file PDF hóa đơn.

---

## 11. Integration issues

1. **Thiếu Workflow Hoàn tất Thanh toán và Mất đồng bộ Trạng thái Hóa đơn:**  
   - Khi một khoản thanh toán được tạo qua `PaymentService.create()`, backend chỉ ghi nhận trạng thái `PENDING` và cộng dồn vào khoản giữ chỗ (`reserved`).
   - Backend không có endpoint để chuyển payment sang `SETTLED`/`COMPLETED`, và không có logic tự động chuyển trạng thái của hóa đơn tương ứng sang `PARTIALLY_PAID` hoặc `PAID`.
   - Kết quả: Trạng thái hóa đơn trên thực tế bị tách rời khỏi tiến trình thanh toán, và các khoản payment `PENDING` không được tính vào số tiền đã thu trong báo cáo công nợ khách hàng (`RevenueCalculator`).
2. **Ngắt kết nối giữa Phân hệ Xuất hóa đơn (Billing) và Quyết toán Doanh thu (Settlements):**  
   Trong backend `BillingService.issue()` ([`BillingService.java:136`](file:///home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java#L136)), lệnh phát hành hóa đơn có gọi `settlementRevenue.issued(invoiceId, loadId, actor)` để cập nhật doanh thu vào chu kỳ quyết toán của tài xế. Tuy nhiên, vì giao diện frontend hiện bị khóa không thể gọi lệnh `issue`, luồng tích hợp tự động đồng bộ doanh thu sang bảng quyết toán tài xế không thể vận hành thông qua thao tác của người dùng trên UI.

---

## 12. Test execution evidence

Đã thực thi kiểm tra toàn bộ các bộ test tự động liên quan đến Invoices, Resource Forms và Contract Models trong phiên làm việc:

```bash
# 1. Kiểm tra Unit & Component Test cho phân hệ Invoices và Contracts
$ npx vitest run src/tests/features/invoices/ src/tests/components/resourceFormEnums.test.ts src/tests/contracts/editorSnapshot.test.tsx src/tests/contracts/handoffWire.test.ts
Test Files  4 passed (4)
     Tests  48 passed (48)
  Duration  9.79s
Exit code: 0 (PASS)

# Chi tiết các test suite đã vượt qua:
✓ src/tests/features/invoices/invoiceColumns.test.tsx (7 tests pass)
  - Cột number render Link tới trang chi tiết với class table-number-link
  - Cột totalAmount và balance được format tiền tệ, align right và tabular-nums
  - Dữ liệu rỗng / null hiển thị '—' với class table-cell-empty
  - Cột status bọc trong StatusTag với màu ngữ nghĩa chính xác
  - Cột dueDate: hiển thị cảnh báo 'Quá hạn X ngày' khi quá hạn và chưa thanh toán đủ
  - Cột dueDate: không hiển thị tag quá hạn khi đã thanh toán đủ (status = paid hoặc balance = 0)
  - Cột actions cố định bên phải với chiều rộng 130px
✓ src/tests/components/resourceFormEnums.test.ts (5 tests pass)
✓ src/tests/contracts/editorSnapshot.test.tsx (8 tests pass)
✓ src/tests/contracts/handoffWire.test.ts (28 tests pass)
  - Chặn generic payment writes và chặn deprecated invoice employee filters (throw FILTER_FIELD_NOT_ALLOWED)
  - Kiểm tra raw errors, validation envelope và request idempotency freeze

# 2. Kiểm tra TypeScript toàn bộ dự án
$ npx tsc --noEmit
Exit code: 0 (PASS - 0 lỗi compile)

# 3. Kiểm tra định dạng Diff Git
$ git diff --check
Exit code: 0 (PASS - Không vi phạm whitespace/formatting)
```

> [!CAUTION]
> **Ranh giới kiểm thử và Ghi nhận bằng chứng:**  
> - Các test case `UNIT_TEST_PASS` được kiểm chứng bởi 48 unit và component test cases chạy tự động bằng Vitest trong phiên làm việc trên **tầng giao diện và contract với dữ liệu mock**.  
> - Các test case ghi `SOURCE_REVIEWED` là kết quả phân tích, đối soát tĩnh trực tiếp từ mã nguồn Java backend (`logictics_api`), migration database, và TypeScript frontend (`logictics-app`). Đây là suy luận kỹ thuật, **không phải kết quả chạy kiểm thử live trên hệ thống đang chạy**.  
> - **Chưa có kiểm thử tích hợp Runtime/Backend Live (Live Backend Integration):** Chưa kiểm thử thực tế trên server live cho các hành vi: ghi nhận hóa đơn vào DB thật, tính toán số dư thực tế qua bảng payments thật, kiểm tra ma trận phân quyền thực tế qua Spring Security context, và các lệnh Billing Commands bất biến.  
> - **E2E Playwright:** `BLOCKED` do phiên làm việc không chạy môi trường backend Spring Boot live cục bộ.  
> - **Live Mutation:** `NOT_TESTED` trên cơ sở dữ liệu production nhằm tuân thủ quy tắc an toàn dữ liệu.

---

## 13. Đề xuất ưu tiên sửa

| Mức ưu tiên | Mã vấn đề | Phân loại | Hành động đề xuất | File cần xử lý |
| :---: | :---: | :---: | :--- | :--- |
| **P1** | `BUG-INV-02` | Financial Integrity | **Xử lý Xung đột Hóa đơn Generic và Đối soát Doanh thu:** Quyết định rõ phương án: (1) Nếu duy trì generic invoice thì bổ sung `lineItems` và kiểm tra khớp số trước khi lưu; (2) Nếu bắt buộc rated invoice thì khóa route tạo generic `POST /api/invoices`, tránh gây lỗi ngoại lệ `InvoiceReconciliationException` trong `RevenueCalculator`. | `.../dto/invoice/CreateInvoiceRequest.java`<br>`.../service/InvoiceService.java:58-75`<br>[`src/components/resources/resourceForms.ts:583`](file:///home/vumoi/logictics-app/src/components/resources/resourceForms.ts#L583) |
| **P1** | `RISK-INV-03` | Security & Governance | **Chặn Tạo Hóa đơn có Trạng thái Doanh thu qua Generic Route:** Trong `InvoiceService.create()`, ép buộc `status` luôn là `DRAFT`; cấm client truyền trực tiếp `ISSUED`, `SENT`, `PAID` để ngăn chặn né tránh billing commands và database constraints. | `.../service/InvoiceService.java:58-64` |
| **P2** | `BUG-INV-01` | Accounts Receivable | **Trả về Số dư Công nợ (Balance) trên Danh sách Hóa đơn:** Trong backend, bổ sung tính toán số dư còn lại (totalAmount trừ payments) vào `InvoiceView.java`; cập nhật type `InvoiceResponse` để cột Balance trên bảng danh sách hiển thị đúng số tiền nợ thực tế. | `.../dto/invoice/InvoiceView.java:9-35`<br>`.../service/InvoiceService.java:40-49`<br>[`src/types/invoice.dto.ts:19-48`](file:///home/vumoi/logictics-app/src/types/invoice.dto.ts#L19-L48) |
| **P2** | `RISK-INV-02` | Multi-currency | **Ràng buộc Đồng nhất Loại tiền tệ trên Hóa đơn:** Bổ sung kiểm tra `CurrencyGuard.requireSameCurrency` giữa subtotalCurrency, taxTotalCurrency và totalCurrency trong `InvoiceService.create()` và `update()`. | `.../service/InvoiceService.java:58-75` |
| **P2** | `RISK-INV-01` | Concurrency | **Áp dụng Khóa Lạc quan (Optimistic Locking) cho Hóa đơn:** Bổ sung cột `@Version` trong entity `Invoice.java`, cấu hình `"versioned": true` trong `resourceMutationContracts` và truyền `expectedVersion` khi gọi `PUT /api/invoices/{id}`. | `.../entity/Invoice.java`<br>[`src/types/handoff.generated.ts:681`](file:///home/vumoi/logictics-app/src/types/handoff.generated.ts#L681) |
| **P2** | `INT-INV-01` | Synchronization | **Xây dựng Quy trình Hoàn tất Thanh toán (Payment Settlement):** Xây dựng endpoint hoàn tất thanh toán và logic tự động chuyển trạng thái hóa đơn sang `PARTIALLY_PAID`/`PAID`, đồng bộ với `RevenueCalculator`. | `.../controller/PaymentController.java`<br>`.../service/PaymentService.java:60-84` |
| **P3** | `NOT_IMPLEMENTED` | Feature Gap | **Xây dựng Giao diện thực thi Billing Commands trên Trang Chi tiết:** Tích hợp các nút bấm và modal thực thi lệnh phát hành (`issue`), ghi giảm (`credit`), và lập lại (`rebill`) trên trang `/invoices/show/:id`. | [`src/pages/invoices/show.tsx`](file:///home/vumoi/logictics-app/src/pages/invoices/show.tsx)<br>[`src/features/invoices/api/billingCommands.ts`](file:///home/vumoi/logictics-app/src/features/invoices/api/billingCommands.ts) |
| **P3** | `FEATURE_GATED` | Feature Gate | **Kích hoạt Form Lập hóa đơn từ Đơn hàng (PrimaryInvoiceForm):** Bật cờ `BILLING_COMMANDS_RUNTIME_VERIFIED = true` sau khi hoàn tất kiểm thử tích hợp luồng rating acceptance và billing commands. | [`src/features/invoices/api/billingCommands.ts:6`](file:///home/vumoi/logictics-app/src/features/invoices/api/billingCommands.ts#L6) |
