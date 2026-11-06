STATUS: CHANGES_REQUESTED

# Review độc lập: invoices

Đã đối chiếu báo cáo cập nhật với source frontend/backend, route, permission, business logic và các test/source references được dẫn. Không chạy lại test trong lượt review này; `SOURCE_REVIEWED` không được xem là E2E hay kiểm thử backend đã chạy.

## Vấn đề cần bổ sung/chỉnh lý

1. **Endpoint rating và schema TaxAssessment trong bảng API không đúng với source.** Tại `audit-reports/invoices.md:69`, endpoint Accept ghi `/api/loads/{id}/rating/acceptance`, nhưng client và controller dùng `/api/loads/{id}/rating/accept` (`src/features/invoices/api/billingCommands.ts:8`, `/home/vumoi/logictics_api/src/main/java/com/company/logicstic/controller/RatingController.java:31-37`). Tại `:86`, body TaxAssessment liệt kê `taxType`, `taxRate`, `assessedTaxAmount`, `referenceDocumentId`, `details`; DTO thực tế yêu cầu `assessmentId`, `loadId`, `customerId`, `sourceType`, `sourceReference`, `jurisdiction`, `taxableBasis`, `taxAmount`, `currency`, cùng audit metadata (`/home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/invoice/TaxAssessmentRequest.java:10-23`). Sửa endpoint/schema trong bảng và kiểm tra permission rating acceptance riêng (`RatingController.java:20-21`); matcher `/api/invoices/**` không bao phủ rating route.

2. **TC-INV-22 kỳ vọng sai đối với retry idempotent cùng key.** `audit-reports/invoices.md:234` nói lần gọi lại Issue bị 409. Nhưng `BillingService.issue()` kiểm tra replay trước trạng thái invoice (`/home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/billing/BillingService.java:128-136`): cùng operation/key/input sẽ trả lại outcome đã lưu; chỉ request mới với key khác trên invoice đã phát hành mới đi tới `INVOICE_ALREADY_ISSUED`. Tách rõ case retry cùng key (replay thành công) và lệnh Issue mới dùng key khác (409).

3. **TC-INV-23 chưa kiểm tra hành vi giữ chỗ của payment PENDING.** Scenario tại `audit-reports/invoices.md:235` chỉ gửi một payment lớn hơn số dư invoice; nó sẽ bị từ chối ngay cả khi không có payment trước đó, nên không kiểm tra vòng lặp cộng `reserved` (`PaymentService.java:64-75`). Bổ sung scenario có payment PENDING đầu tiên chiếm một phần số dư, sau đó gửi payment thứ hai vượt phần còn lại; ghi riêng kiểm tra pending không được tính là đã thanh toán trong Customer Balance.

4. **TC-INV-25 được gắn nhãn UNIT_TEST_PASS nhưng không có test tương ứng trong bằng chứng chạy.** Báo cáo tại `audit-reports/invoices.md:237` dẫn logic `ActionButtons`/`invoiceMutability`, nhưng danh sách lệnh và 4 test files tại `:367-385` không chạy test ActionButtons; rà soát `src/tests` cũng không thấy test gọi `isLegacyDraftInvoice`. Có thể giữ kết luận source-level về guard, nhưng cần bỏ nhãn test đã pass hoặc bổ sung test component thực sự vào bằng chứng.

5. **Mô tả sort trong ACT-INV-04 không khớp cấu hình UI/provider.** `audit-reports/invoices.md:64` nói hỗ trợ sort `number`, `dueDate`, `totalAmount`, `status`. Invoice registry chỉ cho `number`, `type`, `status`, `dueDate` (`src/pages/resourceRegistry.ts:57-63`); cột `totalAmount` không khai báo `sorter` (`src/features/invoices/components/columns.tsx:212-222`), còn `type` có (`:179-184`). Cập nhật danh sách field sort đúng và nếu cần xác minh hành vi click header, bổ sung test tương ứng.

6. **Dẫn chiếu customer-balance calculation sai file/đoạn.** `audit-reports/invoices.md:148-153` dẫn `RevenueCalculator.java:71-84` cho báo cáo công nợ khách hàng; đoạn đó tính paid/open amount cho load revenue. Endpoint customer balance được delegate tại `RevenueCalculator.java:104-106` sang `CustomerBalanceCalculator.calculate()`, nơi filter trạng thái invoice và settled payment nằm ở `/home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/calculation/CustomerBalanceCalculator.java:42-70`. Sửa dẫn chiếu để reviewer có thể kiểm tra đúng business path. Ngoài ra, đề xuất tính balance từng invoice tại `:260-261` cần nêu cách xử lý `economicSign`/CREDIT; customer balance hiện nhân tổng invoice với economic sign (`CustomerBalanceCalculator.java:42-52`), nên công thức `total - payments` chung chưa mô tả đủ signed billing documents.

7. **Mô tả downstream reconciliation chưa chính xác về thứ tự lọc trạng thái.** `audit-reports/invoices.md:274-281` nói reconciliation chạy với “hóa đơn hợp lệ”; source gọi `invoiceReconciliationService.reconcile(invoice)` trước khi kiểm tra `countsAsRevenue()` (`RevenueCalculator.java:60-65`). Vì vậy invoice draft/non-revenue trong danh sách đầu vào cũng đi qua reconcile. Hãy điều chỉnh phạm vi ảnh hưởng và thêm case kiểm tra downstream với status phù hợp; hiện kết luận crash vẫn là suy luận source-level, chưa phải lỗi được tái hiện trên backend.

8. **Mã lỗi khi assessment không tồn tại cần phân biệt theo endpoint.** `audit-reports/invoices.md:112` gộp `assessmentId` vào nhóm trả `ResourceNotFoundException`. Với primary billing, assessment không tìm thấy được xử lý thành `400 INVOICE_TAX_ASSESSMENT_REQUIRED` (`BillingService.java:67`); GET assessment riêng có thể có hành vi 404. Tách hai request/path thay vì ghi một expected status chung.

9. **Các mục “Missing functionality” cần giữ ở mức gap/đề xuất nếu chưa có tiêu chí sản phẩm.** Tại `audit-reports/invoices.md:342-347`, việc thiếu UI Billing Commands trên trang show và thiếu PDF được nêu như chức năng chưa triển khai, nhưng báo cáo chưa dẫn acceptance criteria yêu cầu các capability đó phải nằm ở trang này hoặc phải có PDF. Giữ đây là gap quan sát được/đề xuất cần product xác nhận, không nâng thành bug đã xác nhận. `FEATURE_GATED` tại `:335-341` được phân loại hợp lý là trạng thái gate, không tự thân là bug.

## Các điểm đã đối chiếu phù hợp

- Nút Edit được giới hạn bằng `isLegacyDraftInvoice` ở list/show; phần cập nhật tại `audit-reports/invoices.md:42-53, 67-68` đã phản ánh guard. Direct deep-link là nhánh riêng và được ghi thành risk, không khẳng định đã chạy E2E.
- `employeeId=xxx` bị Spring UUID binding từ chối trước service; test wire chỉ chứng minh filter bị chặn ở frontend. Phân tách TC-INV-08a/08b tại `:219-220` đã sửa đúng ranh giới bằng chứng.
- API `InvoiceView` không trả balance/openBalance, còn cột UI fallback theo hai field này; BUG-INV-01 là kết luận source-level phù hợp (`audit-reports/invoices.md:243-261`).
- Bảng quyền invoice/tax assessments và mô tả PENDING reservation so với settled payments đã được bổ sung; feature gate không bị coi là lỗi mặc định.
- BUG-INV-02 hiện phân biệt source fact với downstream inference (`audit-reports/invoices.md:265-287`). Giữ nhãn inference và không mô tả source audit như runtime reproduction.

## Kết luận

Chưa APPROVED vì bảng API còn sai endpoint/schema, TC-INV-22 kỳ vọng sai với idempotent retry, TC-INV-23/25 chưa được bằng chứng trích dẫn hỗ trợ như mô tả, và một số dẫn chiếu/expected behavior cần chỉnh. Các nhận xét này đánh giá chất lượng báo cáo kiểm thử, không khẳng định chức năng đã PASS và không yêu cầu sửa source trong lượt review.
