# Kiểm tra luồng xuyên module: End-to-End TMS Flow

> **Chế độ kiểm tra:** REPORT-ONLY (không sửa mã nguồn, không can thiệp cơ sở dữ liệu).  
> **Thời điểm thực hiện:** 27/10/2026.  
> **Phạm vi kiểm tra:** Lần vết luồng dữ liệu, tính đồng bộ trạng thái, cơ chế vô hiệu hóa cache (Query Invalidation), và tính nhất quán phân quyền (RBAC) xuyên suốt vòng đời vận hành TMS: từ Tạo Load ➔ Điều phối ➔ Thực thi & Chặng dừng ➔ POD/Chứng từ ➔ Hóa đơn ➔ Thanh toán ➔ Quyết toán ➔ Lương & Đối soát; kèm luồng Đổi Tenant và Phê duyệt AI Dispatch.

---

## Nguồn đối chiếu đã dùng

1. **Hợp đồng API backend (`logictics_api` - Spring Boot)**:
   - Vận hành & Đơn hàng: `LoadController.java`, `LoadTimelineController.java`, `TripExecutionController.java`, `TripController.java`.
   - Trí tuệ nhân tạo (AI): `AiDispatchController.java`, `AiDispatchService.java`.
   - Kế toán & Tài chính: `InvoiceController.java`, `BillingController.java`, `PaymentController.java`, `TaxAssessmentController.java`.
   - Lương & Quyết toán: `DriverSettlementController.java`, `PayrollController.java`, `DriverPayPolicyController.java`.
   - Cơ sở dữ liệu: Các migration V13, V14, V15, V17, V20, V22, V28, V36, V38 về tính toàn vẹn và bất biến tài chính.
2. **Tài liệu kiểm định từng module trước đó**:
   - `docs/audit/loads.md` (Chuyến hàng & Biểu mẫu tạo đơn).
   - `audit-reports/dispatch.md` (Điều phối xe & Hàng đợi AI).
   - `audit-reports/trip-execution.md` (Thực thi chuyến xe & Chặng dừng).
   - `audit-reports/invoices.md` (Hóa đơn & Chuỗi thanh toán bất biến).
   - `audit-reports/payments.md` (Thu tiền, thanh toán một phần & Giữ chỗ công nợ).
   - `audit-reports/settlements.md` (Quyết toán tài xế & Quy tắc bù trừ chi phí).
   - `audit-reports/payroll-runs.md` (Chạy bảng lương & Đối soát ngân hàng).
3. **Mã nguồn ứng dụng Frontend (`logictics-app` - React Refine)**:
   - Quản trị tuyến đường & Rào chắn quyền: `src/router/AppRouter.tsx`, `src/providers/permissions/roleMatrix.ts`, `src/components/resources/resourceCapabilities.ts`.
   - Xác thực & Chuyển đổi Tenant: `src/hooks/useSwitchTenant.ts`, `src/pages/tenant/SelectTenantPage.tsx`, `src/hooks/useCurrentTenant.ts`.
   - Khởi tạo & Điều phối: `src/pages/loads/create.tsx`, `src/features/loads/components/LoadForm.tsx`, `src/pages/ai-dispatch/AiDispatchPage.tsx`, `src/features/ai-dispatch/hooks/useAiDispatchActions.ts`, `src/hooks/tms-flow/useAiDecisionActions.ts`.
   - Thực thi & Chứng từ: `src/pages/trips/show.tsx`, `src/features/trips/components/TripStopsTimeline.tsx`, `src/features/trips/hooks/useTripStopActions.ts`, `src/features/documents/components/DocumentUploadModal.tsx`, `src/features/loads/components/LoadDocumentsPanel.tsx`.
   - Hóa đơn & Thu tiền: `src/pages/invoices/create.tsx`, `src/features/rates/components/RatingAcceptance.tsx`, `src/features/invoices/components/PrimaryInvoiceForm.tsx`, `src/features/payments/components/PaymentCommandForm.tsx`.
   - Quyết toán & Bảng lương: `src/pages/settlements/SettlementShow.tsx`, `src/features/settlements/components/CalculateSettlementModal.tsx`, `src/pages/payroll/PayrollEntryPage.tsx`, `src/pages/payroll/PayrollRunShow.tsx`.

---

## Bản đồ luồng tổng thể (E2E Flow Architecture)

```mermaid
flowchart TD
    subgraph S1["1. Tạo Đơn Hàng (Loads)"]
        LoadCreate["/loads/create<br/>(LoadForm.tsx)"] -->|POST /api/loads| LoadCreated["Load: draft<br/>/loads/show/:id"]
    end

    subgraph S2["2. Điều Phối Xe & Tài Xế (Dispatch)"]
        LoadCreated -->|Đề xuất AI / Bàn làm việc| AiDispatch["/ai-dispatch hoặc /tms/dispatch<br/>(Human-in-the-loop)"]
        AiDispatch -->|Approve Suggestion| TripCreated["Trip: PENDING / ASSIGNED<br/>Tự động sinh TripStops"]
    end

    subgraph S3["3. Thực Thi Chuyến Xe (Trip Execution)"]
        TripCreated -->|POST /api/trips/{id}/stops/{sId}/depart| TripStops["Chặng dừng: ARRIVED ➔ DEPARTED<br/>/trips/show/:id"]
        TripStops -->|Hoàn thành chặng giao cuối| TripCompleted["Trip: COMPLETED"]
    end

    subgraph S4["4. Chứng Từ & Biên Nhận (POD)"]
        TripCompleted -->|Upload e-POD| DocUpload["/loads/show/:id ➔ Documents<br/>(DocumentUploadModal.tsx)"]
        DocUpload -->|POST /api/documents| DocStored["Chứng từ: POD / BOL"]
    end

    subgraph S5["5. Hóa Đơn Khách Hàng (Invoices)"]
        DocStored -.->|Yêu cầu đối soát| InvoiceGen["/loads/show/:id ➔ Rating<br/>(PrimaryInvoiceForm.tsx)"]
        InvoiceGen -->|POST /api/invoices/primary| InvoiceIssued["Hóa đơn: ISSUED<br/>Chuỗi kế toán bất biến"]
    end

    subgraph S6["6. Thu Tiền & Công Nợ (Payments)"]
        InvoiceIssued -->|POST /api/payments| PaymentPending["Lệnh thu tiền: PENDING<br/>(PaymentCommandForm.tsx)"]
        PaymentPending -->|Idempotency V1 Lock| PaymentApplied["Hóa đơn: PAID / PARTIALLY_PAID"]
    end

    subgraph S7["7. Quyết Toán Tài Xế (Settlements)"]
        TripCompleted & InvoiceIssued -->|POST /api/driver-settlements/calculate| SettlementCalc["Tính quyết toán theo kỳ<br/>(CalculateSettlementModal.tsx)"]
        SettlementCalc -->|Bù trừ Tạm ứng/Phụ phí| SettlementReview["Quyết toán: PENDING_APPROVAL"]
        SettlementReview -->|POST /api/driver-settlements/{id}/lock| SettlementLocked["Quyết toán: LOCKED<br/>(Đóng băng tài chính)"]
    end

    subgraph S8["8. Bảng Lương & Chi Trả (Payroll Runs)"]
        SettlementLocked -->|POST /api/payroll/runs/calculate| PayrollRun["Gom các settlement LOCKED<br/>Thuế đa vùng tài phán"]
        PayrollRun -->|POST /api/payroll/runs/{id}/lock| PayslipGen["Phát hành Payslip PDF<br/>Khóa bảng lương"]
        PayslipGen -->|Đối soát ngân hàng / Stripe| PayrollCompleted["PayrollRun: COMPLETED"]
    end

    classDef stage fill:#f8fafc,stroke:#334155,stroke-width:1px;
    class S1,S2,S3,S4,S5,S6,S7,S8 stage;
```

---

## Chi tiết từng chặng chuyển tiếp (Transition Checkpoints)

### Chặng 1: Tạo Load (`/loads/create`) ➔ Điều phối (`/tms/dispatch`, `/ai-dispatch`, `/trips`)
* **Dữ liệu chuyển giao**: Thông tin đơn hàng (`name`, `customerId`, `originAddress`, `destinationAddress`, `deliveryCostAmount`, `distance`).
* **Trạng thái**: Đơn hàng tạo mới với trạng thái `draft`.
* **Thực tế kiểm tra**:
  - Khi tạo xong tại `/loads/create`, hệ thống chuyển hướng về `/loads`.
  - Trên màn hình chi tiết chuyến hàng `/loads/show/:id`, tab "Trip & Truck" (`LoadTripPanel.tsx`) hiển thị thông tin xe được gán. Nếu chưa có xe, chỉ hiển thị trạng thái rỗng (`Empty`), **hoàn toàn không có nút "Tạo chuyến đi" (Create Trip) hay "Điều phối xe"**.
  - Form tạo Trip thủ công tại `/trips/create` (`resourceForms.ts:570-581`) chỉ gồm các trường: `name`, `truckId`, `totalDistance`, `status`. Form **không có trường chọn Chuyến hàng (`loadId`)**, không có giao diện tạo chặng dừng (`TripStop`).
  - **Kết luận Chặng 1**: Đứt gãy luồng tạo Trip thủ công từ Load. Việc kết nối giữa Load và Trip chỉ có thể diễn ra thông qua thuật toán AI Dispatch hoặc API backend ngầm.

### Chặng 2: Điều phối ➔ Thực thi chặng dừng & Cập nhật trạng thái (`/trips/show/:id`, `/loads/show/:id`)
* **Dữ liệu chuyển giao**: Khi AI Dispatch được duyệt hoặc chuyến xe được kích hoạt, hệ thống sinh ra danh sách `TripStop` (chặng nhận hàng Origin, chặng giao hàng Destination) liên kết với `load_id`.
* **Trạng thái**:
  - Chặng dừng: `PENDING` ➔ `ARRIVED` ➔ `SERVICE_STARTED` ➔ `SERVICE_COMPLETED` ➔ `DEPARTED`.
  - Chuyến xe: Khi tất cả chặng hoàn thành, backend `TripExecutionService.java` tự động đặt `Trip.status = COMPLETED`.
* **Thực tế kiểm tra**:
  - Tại `/trips/show/:id`, hook `useTripStopActions.ts:91-94` sau khi thực hiện chuyển trạng thái chặng dừng chỉ thực hiện:
    `invalidate({ resource: "trips", id: tripId, invalidates: ["detail"] })`.
  - Hook **không hề invalidate resource `loads` hay `load-timeline`**.
  - Phía backend `TripExecutionService.java`, không có logic tự động đổi trạng thái của `Load.status` sang `delivered` khi chặng giao hàng cuối cùng hoàn thành.
  - **Kết luận Chặng 2**: Bất đồng bộ trạng thái giữa Trip và Load. Trip báo `COMPLETED` nhưng Load trên giao diện `/loads/show/:id` vẫn giữ nguyên trạng thái cũ (`dispatched` hoặc `draft`).

### Chặng 3: Thực thi hoàn thành ➔ Bàn giao chứng từ POD (`/loads/show/:id` ➔ Documents)
* **Dữ liệu chuyển giao**: Tệp chứng từ biên nhận giao hàng (e-POD), phiếu cân (Scale Ticket), vận đơn (BOL).
* **Trạng thái**: Chứng từ được ghi nhận với loại `POD` hoặc `BOL` tại `LoadDocumentsPanel.tsx`.
* **Thực tế kiểm tra**:
  - Người dùng có thể upload tài liệu thật qua `DocumentUploadModal.tsx`, dữ liệu được lưu vào bảng chứng từ kèm `loadId`.
  - Tuy nhiên, trong mã nguồn cả frontend và backend, **không có cơ chế kiểm tra bắt buộc (POD Guard) trước khi sang bước xuất hóa đơn hoặc tính lương**.
  - **Kết luận Chặng 3**: Thiếu rào chắn nghiệp vụ kiểm tra POD. Chuyến hàng có thể bị xuất hóa đơn hoặc tính thù lao ngay cả khi chưa có biên nhận giao nhận hợp lệ.

### Chặng 4: Chuyến hàng hoàn thành ➔ Lập hóa đơn (`/invoices/create`, `RatingAcceptance`)
* **Dữ liệu chuyển giao**: `loadId`, `customerId`, cước vận tải `deliveryCostAmount`, phụ phí phát sinh (`accessorials`).
* **Trạng thái**: Hóa đơn chuyển từ `DRAFT` ➔ `ISSUED` (chuỗi ký bất biến).
* **Thực tế kiểm tra**:
  - *Cách 1 (Form generic `/invoices/create`)*: Người dùng chọn `loadId` và `customerId`. Tuy nhiên, biểu mẫu không tự động prefill cước phí `deliveryCostAmount` từ Load sang `subtotalAmount`. Người dùng phải tự gõ lại toàn bộ số tiền, dễ gây sai lệch tài chính.
  - *Cách 2 (Luồng Rating Acceptance tại `LoadFinancialPanel.tsx`)*: Cho phép chấp thuận giá cước và tạo hóa đơn chuẩn (`PrimaryInvoiceForm.tsx`). Luồng này đảm bảo tính bất biến (`Signed Billing Chain`). Tuy nhiên, chỉ vai trò `ACCOUNTING` mới thấy và kích hoạt được hành động này.
  - **Kết luận Chặng 4**: Handoff thủ công bị thiếu cơ chế auto-prefill; luồng Rating tự động hoạt động tốt nhưng phân tách ranh giới vai trò chặt chẽ.

### Chặng 5: Hóa đơn phát hành ➔ Thu tiền & Chống trùng (`/payments/create`)
* **Dữ liệu chuyển giao**: `invoiceId`, số tiền thu `amountAmount`, phương thức thanh toán, mã idempotency key.
* **Trạng thái**: Lệnh thanh toán ở trạng thái `PENDING` (đóng vai trò giữ chỗ hạn mức), sau khi xử lý thành công chuyển sang `APPLIED` và cập nhật số dư nợ hóa đơn (`remainingBalance`).
* **Thực tế kiểm tra**:
  - Tại `/payments/create`, component `PaymentCommandForm.tsx` yêu cầu người dùng chọn hóa đơn. Biểu mẫu không hiển thị tóm tắt công nợ hiện tại (Tổng tiền, Đã trả, Số dư còn lại).
  - Người dùng dễ nhập số tiền vượt quá công nợ còn lại, dẫn đến backend từ chối `409 Conflict: PAYMENT_BALANCE_EXCEEDED`.
  - Cơ chế chống trùng (Idempotency V1) hoạt động tốt: nếu bấm đúp hoặc gửi lại cùng fingerprint, backend replay kết quả an toàn.
  - Sau khi thanh toán thành công, hàm `refreshEvidence` tại `PaymentCommandForm.tsx:34-40` thực hiện invalidate đồng thời cả `payments`, `invoices`, và query khách hàng.
  - **Kết luận Chặng 5**: Cơ chế tài chính an toàn tuyệt đối ở backend; UX frontend cần cải thiện hiển thị số dư còn nợ.

### Chặng 6: Hoàn thành chuyến xe & Hóa đơn ➔ Quyết toán tài xế (`/settlements`)
* **Dữ liệu chuyển giao**: Chuyến xe đã chạy của tài xế (`trips`), dặm đường (`loadedMiles`, `emptyMiles`), giờ làm việc, doanh thu cước ròng của hóa đơn (`PRIMARY_INVOICE_REVENUE` theo quy tắc `BILL-DEC-006`), các khoản tạm ứng (`ADVANCE`) và phụ phí đã duyệt (`driver_pay_amount` với `status: APPROVED`).
* **Trạng thái**: Quyết toán trải qua: `DRAFT` ➔ `PENDING_APPROVAL` ➔ `APPROVED` ➔ `LOCKED`.
* **Thực tế kiểm tra**:
  - Quyết toán được khởi tạo qua modal `CalculateSettlementModal.tsx` tại `/settlements`.
  - Phụ phí vận tải (`accessorials`) chỉ được tính vào lương tài xế nếu đã được kế toán phê duyệt (`APPROVED`). Nếu điều phối viên tạo phụ phí nhưng kế toán chưa duyệt, phụ phí sẽ bị loại bỏ khỏi kỳ quyết toán mà không có cảnh báo rõ ràng.
  - Nếu hóa đơn có doanh thu biến động (`revenue drift`) trước khi khóa, backend từ chối khóa với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE`, buộc người dùng phải bấm "Tính lại doanh thu" (`recalculate-revenue`).
  - Khi quyết toán chuyển sang `LOCKED`, toàn bộ dòng thu nhập bị đóng băng vĩnh viễn; mọi thay đổi phát sinh sau này bắt buộc phải tạo bản ghi điều chỉnh (`ADJUSTMENT`).
  - **Kết luận Chặng 6**: Luồng nghiệp vụ đối soát tài chính rất chặt chẽ, tuân thủ đúng nguyên tắc bất biến; thiếu hàng đợi duyệt phụ phí tập trung.

### Chặng 7: Quyết toán đã khóa ➔ Bảng lương & Chi trả ngân hàng (`/payroll`)
* **Dữ liệu chuyển giao**: Các bản ghi quyết toán `DriverSettlement` có trạng thái `LOCKED`, cùng loại tiền tệ và thuộc kỳ thanh toán (`payPeriodId`).
* **Trạng thái**:
  - `PayrollRun`: `CALCULATED` ➔ `IN_REVIEW` ➔ `APPROVED` ➔ `LOCKED` ➔ `PAYMENT_SCHEDULED` ➔ `COMPLETED`.
  - Tuyệt đối không có trạng thái tên là `PAID` cho Run (theo quy tắc V20). Run chỉ đạt `COMPLETED` khi 100% các dòng lương con đạt `PAID` hoặc `NO_PAYMENT_REQUIRED`.
* **Thực tế kiểm tra**:
  - Tại `/payroll`, người dùng chọn kỳ thanh toán để khởi tạo Run (`PayrollEntryPage.tsx`).
  - Mỗi quyết toán tài xế chỉ được gom vào duy nhất một dòng lương (`PayrollRunItem`), được khóa bi quan chống chạy trùng.
  - Khi Run được duyệt và chuyển sang `LOCKED`, hệ thống phát hành phiếu lương điện tử (`Payslip`) bất biến dưới dạng tệp PDF.
  - Chi trả qua cổng ngân hàng hoặc đối soát ngoại tuyến (`reconcile-bank`) cập nhật trạng thái chi trả và hoàn tất bảng lương.
  - **Kết luận Chặng 7**: Luồng hoàn tất tài chính hoàn chỉnh, bảo đảm tính toàn vẹn dữ liệu từ quyết toán sang chi trả.

### Chặng 8: Luồng chuyển đổi Tenant (`useSwitchTenant`)
* **Dữ liệu chuyển giao**: Làm mới phiên làm việc qua Identity Server và cấp lại Access Token mang `tenantId` mới.
* **Trạng thái**: Xóa cache phiên cũ và chuyển hướng về trang chủ (`LandingRedirect`).
* **Thực tế kiểm tra**:
  - Trong `src/hooks/useSwitchTenant.ts:20-21`, hàm lọc cache định nghĩa:
    `const isTenantScopedQuery = (queryKey: readonly unknown[]): boolean => ["data", "access", "auth"].includes(String(queryKey[0]));`
  - Khi người dùng đổi tenant, code chỉ hủy và xóa các query có `queryKey[0]` nằm trong danh sách trên (`useSwitchTenant.ts:52-57`).
  - Toàn bộ các query nghiệp vụ khác như `["loads", ...]`, `["trips", ...]`, `["settlements", ...]`, `["invoices", ...]`, `["load-documents", ...]`, `["tms", ...]`, `["ai-dispatch", ...]` **hoàn toàn KHÔNG bị xóa khỏi bộ nhớ TanStack Query**.
  - **Kết luận Chặng 8**: Nguy cơ rò rỉ dữ liệu chéo giữa các tổ chức / khách hàng thuê bao (Cross-Tenant Data Leak) khi chuyển đổi tenant trong cùng một phiên trình duyệt.

### Chặng 9: Luồng phê duyệt điều phối AI (`/ai-dispatch`, `/tms/approvals`)
* **Dữ liệu chuyển giao**: Gợi ý điều phối (ghép xe, tài xế, lộ trình chặng dừng, điểm đón/trả).
* **Trạng thái**: Kế hoạch di chuyển ở trạng thái `pending` ➔ người dùng bấm Phê duyệt ➔ `approved` / `executed` (tự động tạo `Trip` trên backend).
* **Thực tế kiểm tra**:
  - Tại `useAiDispatchActions.ts:138-142`, chế độ tự động hoàn toàn (`params.mode === "automatic"`) bị khóa cứng (`AUTONOMOUS_MODE_LOCKED`), bắt buộc người dùng thao tác phê duyệt thủ công (Human-in-the-loop).
  - Sau khi phê duyệt thành công, `useAiDispatchActions.ts:215-219` gọi:
    `invalidate({ resource: "trips", invalidates: ["list"] })`, `invalidate({ resource: "loads", invalidates: ["list"] })`.
  - Cơ chế này chỉ làm mới danh sách (list), **không làm mới chi tiết (detail) của bản ghi Load** (`["loads", loadId]`). Khi người dùng quay lại trang chi tiết đơn hàng, giao diện vẫn có thể hiển thị trạng thái cũ nếu chưa được refetch.
  - **Kết luận Chặng 9**: Luồng phê duyệt tuân thủ an toàn Human-in-the-loop; cơ chế invalidate cache chi tiết cần được bổ sung.

---

## Tổng hợp phát hiện xuyên module (Cross-Module Findings)

- `[e2e-001] [CRITICAL] [LEAK-DATA] [CONFIRMED] src/hooks/useSwitchTenant.ts:20-21,52-57` — Hàm lọc cache khi chuyển tenant chỉ xóa các key thuộc `["data", "access", "auth"]`, bỏ sót toàn bộ domain queries — Khi người dùng đổi tenant, `isTenantScopedQuery` bỏ sót các query key như `["settlements", ...]`, `["loads", ...]`, `["invoices", ...]`, `["tms", ...]`, `["load-documents", ...]`. Dữ liệu của tenant trước vẫn tồn đọng trong RAM TanStack Query — Sửa ở frontend?: Có — Thay hàm lọc bằng `queryClient.clear()` để làm sạch tuyệt đối toàn bộ bộ nhớ đệm khi đổi tenant.
- `[e2e-002] [HIGH] [GAP-API] [CONFIRMED] src/pages/trips/create.tsx:3, src/components/resources/resourceForms.ts:570-581` — Màn hình tạo chuyến xe thủ công bị đứt gãy luồng liên kết với Chuyến hàng — Biểu mẫu `/trips/create` chỉ có các trường `name`, `truckId`, `totalDistance`, `status`; không có trường chọn `loadId`, không có giao diện tạo chặng dừng `TripStop`. Trang `/loads/show/:id` cũng không có nút tạo Trip — Sửa ở frontend?: Có — Bổ sung trường chọn Load và bảng nhập chặng dừng trên form tạo Trip, hoặc cung cấp nút "Tạo chuyến xe từ đơn hàng" trên trang chi tiết Load.
- `[e2e-003] [HIGH] [BUG-LOGIC] [CONFIRMED] src/features/trips/hooks/useTripStopActions.ts:91-94, logictics_api:TripExecutionService.java` — Hoàn thành chặng dừng cuối không đồng bộ trạng thái Chuyến hàng sang `delivered` và không invalidate cache Load — Khi tài xế hoàn tất chặng giao hàng cuối, Trip chuyển sang `COMPLETED` nhưng backend không đổi `Load.status` sang `delivered`, đồng thời frontend hook chỉ invalidate cache của Trip, không invalidate `loads` và `load-timeline` — Sửa ở frontend?: Có một phần (cần phối hợp backend) — Hook cần gọi invalidate cả `loads` và `load-timeline`; backend cần kích hoạt sự kiện cập nhật trạng thái Load khi Trip kết thúc.
- `[e2e-004] [HIGH] [GAP-DOC] [CONFIRMED] src/features/documents/components/DocumentUploadModal.tsx:12-25, src/features/invoices/components/PrimaryInvoiceForm.tsx` — Thiếu rào chắn kiểm tra chứng từ giao hàng (POD) trước khi xuất Hóa đơn và tính Quyết toán — Cả frontend và backend đều không kiểm tra sự tồn tại của tài liệu `POD` đã upload trước khi cho phép xuất hóa đơn hoặc tính bảng lương tài xế — Sửa ở frontend?: Có — Thêm điều kiện cảnh báo/chặn nút xuất hóa đơn và tính quyết toán nếu chuyến hàng chưa có chứng từ giao nhận hợp lệ.
- `[e2e-005] [MEDIUM] [UX-TRAP] [CONFIRMED] src/components/resources/resourceForms.ts:583-595, src/pages/invoices/create.tsx` — Biểu mẫu tạo hóa đơn thủ công không tự động điền cước phí và khách hàng từ Chuyến hàng đã chọn — Khi chọn `loadId` trên form `/invoices/create`, form không tự động điền `customerId`, `subtotalAmount`, `subtotalCurrency` từ Load, buộc kế toán phải nhập tay lại và dễ gây sai lệch số liệu — Sửa ở frontend?: Có — Thêm watcher theo dõi `loadId` để tự động điền dữ liệu tương ứng vào biểu mẫu hóa đơn.
- `[e2e-006] [MEDIUM] [BUG-LOGIC] [CONFIRMED] src/hooks/ai/useLoadAiDispatch.ts:62-64, src/features/ai-dispatch/hooks/useAiDispatchActions.ts:215-219` — Bất đồng bộ định dạng query key khi làm mới cache sau phê duyệt điều phối AI — Hook `useLoadAiDispatch` gọi `queryClient.invalidateQueries(["loads", loadId])` không khớp với cấu trúc query key nội bộ của Refine dataProvider, còn `useAiDispatchActions` chỉ invalidate `list` mà không invalidate `detail` — Sửa ở frontend?: Có — Sử dụng `useInvalidate` của Refine và chỉ định cả `invalidates: ["detail", "list"]` kèm `id: loadId`.
- `[e2e-007] [MEDIUM] [BUG-LOGIC] [CONFIRMED] src/features/settlements/hooks/useSettlementActions.ts:40-48, src/pages/settlements/SettlementShow.tsx` — Lỗi lệch doanh thu hóa đơn (Revenue Drift) thiếu thông tin đối soát trực quan trên giao diện Quyết toán — Khi doanh thu hóa đơn thay đổi, backend từ chối khóa quyết toán với lỗi `409 Conflict: SETTLEMENT_REVENUE_BASIS_STALE` nhưng modal tính lại doanh thu không hiển thị bảng so sánh chênh lệch giữa số cũ và số mới — Sửa ở frontend?: Có — Hiển thị bảng đối soát doanh thu cũ vs mới trong modal tính lại doanh thu.
- `[e2e-008] [MEDIUM] [UX-TRAP] [CONFIRMED] src/features/payments/components/PaymentCommandForm.tsx:61-67` — Biểu mẫu thu tiền không hiển thị số dư nợ còn lại của hóa đơn — Người dùng không biết chính xác số dư nợ còn lại của hóa đơn khi lập lệnh thanh toán, dễ dẫn đến lỗi nhập vượt hạn mức (`409 Conflict: PAYMENT_BALANCE_EXCEEDED`) — Sửa ở frontend?: Có — Hiển thị thẻ tóm tắt công nợ của hóa đơn được chọn và nút "Điền toàn bộ số dư nợ".
- `[e2e-009] [LOW] [GAP-DOC] [CONFIRMED] src/features/accessorials/components/AccessorialChargesTable.tsx, src/providers/permissions/roleMatrix.ts:51-52` — Thiếu giao diện tập trung phê duyệt phụ phí tài xế trước kỳ tính quyết toán — Phụ phí do điều phối viên tạo bắt buộc phải có vai trò `ACCOUNTING` duyệt (`ACCESSORIAL_APPROVE`) mới được đưa vào quyết toán tài xế, nhưng kế toán chỉ có thể duyệt lẻ từng phụ phí trong từng Load — Sửa ở frontend?: Có — Bổ sung màn hình hàng đợi phê duyệt phụ phí tập trung cho kế toán.
- `[e2e-010] [LOW] [GAP-API] [CONFIRMED] src/features/ai-dispatch/hooks/useAiDispatchActions.ts:138-142` — Chế độ tự động hóa AI (Autonomous Mode) bị khóa ở backend, bắt buộc phê duyệt thủ công — Frontend khóa lựa chọn `mode: "automatic"` do backend cấu hình `AUTONOMOUS_MODE_LOCKED`, hệ thống vận hành thuần túy theo cơ chế Human-in-the-loop — Sửa ở frontend?: Không — Giữ nguyên cơ chế bảo vệ an toàn Human-in-the-loop.

---

## Phân tích Ma trận Quyền hạn xuyên suốt (Role Matrix Consistency)

Bảng đối chiếu phân quyền theo từng vai trò xuyên suốt toàn bộ chuỗi mắt xích E2E:

| Phân hệ / Mắt xích | Thao tác chính | ADMIN | DISPATCHER | ACCOUNTANT | PAYROLL_MANAGER | DRIVER |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Đơn hàng (Loads)** | Tạo, xem, cập nhật đơn hàng | ✅ | ✅ | ✅ | ❌ | ❌ |
| **2. Điều phối (AI & Trips)** | Khởi chạy AI, gán xe, duyệt phương án | ✅ | ✅ | ❌ | ❌ | ❌ |
| **3. Thực thi (Stops & POD)** | Đổi trạng thái chặng, nộp chứng từ POD | ✅ | ✅ | ❌ | ❌ | Chặn UI |
| **4. Định mức & Giá (Rates)** | Xem trước & Chấp thuận bảng giá cước | ✅ | ❌ | ✅ | ❌ | ❌ |
| **5. Hóa đơn (Invoices)** | Lập, phát hành, điều chỉnh hóa đơn | ✅ | ❌ | ✅ | ❌ | ❌ |
| **6. Thu tiền (Payments)** | Lập lệnh thu tiền, đối soát công nợ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **7. Duyệt phụ phí (Accessorials)** | Phê duyệt phụ phí tài xế/lưu xe | ✅ | ❌ (chỉ tạo) | ✅ | ❌ | ❌ |
| **8. Quyết toán (Settlements)** | Tính, khóa, bù trừ chi phí tài xế | ✅ | ❌ | ✅ | ✅ | ❌ |
| **9. Bảng lương (Payroll Runs)** | Gom quyết toán, tính thuế, chi trả ngân hàng | ✅ | ❌ | ✅ | ✅ | ❌ |
| **10. Phiếu lương (Payslips)** | Xem phiếu lương cá nhân điện tử | ✅ | ✅ | ✅ | ✅ | ✅ (chỉ bản thân) |

> [!NOTE]
> **Nhận xét về tính phân tách trách nhiệm (Separation of Duties - SoD):**  
> Ma trận quyền hạn được thiết kế rất chặt chẽ và chuẩn mực. Nhân viên điều phối (`DISPATCHER`) phụ trách trọn vẹn luồng vật lý (Xe, Tài xế, Chặng dừng, Chứng từ), hoàn toàn không được can thiệp vào các con số tài chính (Hóa đơn, Giá cước, Quyết toán lương). Kế toán (`ACCOUNTANT`) kiểm soát dòng tiền vào (Khách hàng ➔ Doanh thu ➔ Thu tiền) và phối hợp cùng Quản lý lương (`PAYROLL_MANAGER`) kiểm soát dòng tiền ra (Quyết toán ➔ Bảng lương ➔ Chi trả tài xế). Quản trị viên (`ADMIN`) có quyền điều phối toàn diện hệ thống.

---

## Khuyến nghị và các bước tiếp theo

1. **Khắc phục ngay rủi ro rò rỉ dữ liệu Tenant (`[e2e-001]`)**:
   - Sửa hàm `switchTenant` trong `src/hooks/useSwitchTenant.ts` để gọi `queryClient.clear()` thay vì dùng predicate chọn lọc hạn chế, ngăn chặn triệt để nguy cơ lộ dữ liệu giữa các tenant khi đổi phiên.
2. **Nối lại mắt xích tạo Trip thủ công (`[e2e-002]`)**:
   - Bổ sung trường chọn Load và giao diện quản lý chặng dừng trên biểu mẫu `/trips/create`, hoặc cung cấp nút "Điều phối chuyến xe" trực tiếp từ trang chi tiết `/loads/show/:id`.
3. **Đồng bộ hóa trạng thái Chuyến hàng khi Chuyến xe hoàn thành (`[e2e-003]`)**:
   - Bổ sung logic tự động chuyển trạng thái `Load.status = delivered` tại backend khi chặng dừng giao hàng cuối cùng hoàn thành, đồng thời bổ sung lệnh invalidate cache `loads` tại frontend hook `useTripStopActions`.
4. **Bổ sung điều kiện kiểm tra chứng từ POD (`[e2e-004]`)**:
   - Thiết lập quy tắc kiểm tra chứng từ bắt buộc trước khi chuyển hóa đơn sang trạng thái sẵn sàng xuất hoặc trước khi phê duyệt quyết toán lương.
5. **Chuẩn hóa cơ chế Invalidate Query của Refine (`[e2e-006]`)**:
   - Rà soát các hook AI Dispatch và TMS Flow, chuyển đổi toàn bộ lệnh invalidate thủ công sang hook `useInvalidate` của Refine để đảm bảo đồng bộ hoàn toàn giữa cache danh sách (`list`) và chi tiết (`detail`).
