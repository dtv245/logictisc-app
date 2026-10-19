# Lark Base — mapping chờ Cổng duyệt 1

Ngày kiểm tra: 2026-10-16. Trạng thái: **CHƯA DUYỆT; CHƯA CÓ SCHEMA BASE THẬT**.

Phạm vi: load và tài xế, backend `/home/vumoi/logictics_api`, frontend `/home/vumoi/logictics-app`.
Baseline và danh sách thay đổi có sẵn được ghi trong `lark-base-integration-baseline.md`.
Chưa triển khai Giai đoạn 2–4, chưa commit, chưa gọi API Lark có credential và chưa ghi dữ liệu vào Base nào.

## 1. Bằng chứng và giới hạn

- Mã nguồn backend: `integration/lark/base/LarkBaseService.java`, `LarkBaseClient.java`, `LarkBaseController.java`; `entity/Load.java`, `entity/Employee.java`; DTO tạo load/employee và nhóm `integration/lark/event/`.
- Tên cột bên dưới là **tên hardcode trong service**, không phải kết quả đọc schema Base thật. Chưa biết `field_id`, kiểu thực, `ui_type`, lựa chọn select, trường primary/formula, quyền ghi hay ràng buộc bắt buộc của từng cột Base.
- Đọc cấu hình cục bộ chỉ xuất trạng thái có/không, không xuất giá trị: `.env` có app credential, nhưng `LARK_BASE_APP_TOKEN`, `LARK_BASE_LOADS_TABLE_ID`, `LARK_BASE_DRIVERS_TABLE_ID` còn là placeholder. Credential webhook chưa được cấu hình trong `.env` hoặc environment hiện tại.
- Người dùng đã xác nhận: **“Chưa xác nhận; chỉ đọc cấu hình cục bộ”**. Không dùng app credential hiện có để gọi Lark và không suy đoán Base nào là thử nghiệm.
- Không tìm thấy bản xuất schema fields/tables thật trong tài liệu/cấu hình đã khảo sát. Fixture event được đặt tên `documented-record-changed.json` chỉ phục vụ test, không được dùng làm bằng chứng schema tenant.

Để xác minh mapping cần một bản xuất schema đã bỏ credential, hoặc đường dẫn cấu hình Base thử nghiệm được người dùng xác nhận. Bản xuất cần table name/ID và field ID/name/type/ui_type/property, gồm options/select, thiết lập date, quan hệ và quyền ghi nếu có. Không đưa app token, app secret, access token hoặc encrypt key vào tài liệu hay chat.

## 2. Mapping load đang tồn tại trong code

“Bắt buộc TMS” dựa trên entity/DTO hiện tại; không đồng nghĩa Base bắt buộc. Mọi dòng đều **chưa xác minh schema Base, chiều đồng bộ, nguồn sự thật và quyền sửa từ Base**.

| Trường TMS | Kiểu TMS; bắt buộc TMS | Tên Base service đang dùng | Payload hiện tại | Cần chốt/kiểm chứng |
|---|---|---|---|---|
| `Load.number` | `Long`, DB sinh; không null | `Load Number` | Số, bỏ qua nếu null | Base là Number, Text hay AutoNumber? Nếu chỉ là mã định danh, cần chốt biểu diễn giữ nguyên số lớn; không ghi vào cột tự sinh/formula. Không dùng thay UUID. |
| `Load.name` | `String`; bắt buộc | `Load Name` | Chuỗi, bỏ qua nếu trắng | Xác nhận Text, giới hạn độ dài, được sửa từ Base hay chỉ hiển thị. |
| `Load.status` | `String`; bắt buộc | `Status` | Chuỗi nguyên trạng, bỏ qua nếu trắng | Text hay SingleSelect? Cần danh mục option thật và mapping hai chiều. DTO chỉ yêu cầu không trắng, không chứng minh một enum đóng. Không tự tạo option hay diễn giải nhãn lạ thành trạng thái. |
| `Load.customer.name` | Quan hệ `customer` bắt buộc; lấy tên để hiển thị | `Customer` | Chuỗi tên nếu có | Text hay liên kết record? Cần ID ổn định nếu sửa ngược; tên có thể trùng/đổi, không được tìm customer theo tên để gán. |
| `Load.assignedTruck.number` | Quan hệ tùy chọn; chuỗi số xe | `Truck Number` | Chuỗi nếu có xe và số xe | Text hay liên kết record? Thiếu UUID xe trong payload; cần chính sách bỏ gán và định danh nếu hai chiều. |
| `Load.assignedDispatcher.firstName` + `lastName` | Quan hệ tùy chọn | `Dispatcher` | Ghép `firstName + " " + lastName`, trim | Text hay Person? Tên ghép không phải Lark user ID, không phân giải ngược an toàn. Nếu Person phải có mapping ID/loại ID được xác nhận. |
| `Load.requestedDeliveryDate` | `OffsetDateTime`; tùy chọn | `Delivery Date` | `toString()` dạng ISO có offset | Text hay DateTime? Nếu DateTime, cần đổi cùng instant sang epoch milliseconds và chốt múi giờ hiển thị; nếu ngày nghiệp vụ, phải chốt ngày/múi giờ riêng. Không suy từ timezone máy chạy. |

## 3. Mapping tài xế đang tồn tại trong code

`syncDriver(employeeId)` đang tải **bất kỳ Employee nào theo UUID**, chưa kiểm tra role tài xế. `EmployeeService.searchDrivers` có chú thích DRIVER nhưng implementation đang gọi search chung với `roleId=null`; không coi danh sách đó là bộ lọc tài xế đã được bảo đảm.

| Trường TMS | Kiểu TMS; bắt buộc TMS | Tên Base service đang dùng | Payload hiện tại | Cần chốt/kiểm chứng |
|---|---|---|---|---|
| `Employee.firstName` + `lastName` | Hai `String`; bắt buộc | `Full Name` | Ghép tên và trim | Text hay Person? Ghép tên làm mất ranh giới first/last; nếu cho sửa từ Base cần hai cột riêng hoặc quy tắc rõ, không tự tách theo dấu cách. |
| `Employee.email` | `String`, email; bắt buộc | `Email` | Gửi nguyên chuỗi | Text/Email; chốt chuẩn hóa và kiểm tra duy nhất khi sửa ngược. Không dùng email làm khóa liên kết record. |
| `Employee.phoneNumber` | `String`; tùy chọn | `Phone` | Gửi nếu không trắng | Text/PhoneNumber; giữ dấu `+`, số 0 đầu và extension; không đổi thành số, không tự đoán mã quốc gia. |
| `Employee.status` | `String`; bắt buộc | `Status` | Chuỗi nếu không trắng | Xác nhận options, hoa/thường và ý nghĩa active/inactive; sửa status có thể ảnh hưởng đăng nhập. |
| `Employee.salaryType` | `String`; bắt buộc | `Salary Type` | Chuỗi nếu không trắng | Text/SingleSelect; cần danh mục thật. Đây là chế độ lương nhân sự hiện có, không tự suy thành chính sách driver pay. Quyền đọc/sửa phải được chốt. |

## 4. Trường và quy tắc còn thiếu

| Nội dung | Hiện trạng | Quyết định còn mở |
|---|---|---|
| UUID load/employee, `record_id`, table và tenant scope | Không gửi UUID TMS vào Base; không lưu liên kết sync tại TMS | Có thêm cột UUID/khóa ngoài trên Base thử nghiệm không? Xử lý record cũ đã tạo thế nào: liên kết theo danh sách xác nhận, để nguyên hay tạo mới? Không tự ghép theo tên/email. |
| Giá trị trống | Các field tùy chọn đang bị bỏ khỏi payload | Khi nguồn xóa giá trị, có xóa giá trị đích không hay giữ nguyên? Phân biệt bỏ field với gửi giá trị rỗng/null theo kiểu thật. |
| Tiền load | `deliveryCostAmount: BigDecimal(18,2)` + currency, chưa sync | Có nằm trong phạm vi không? Đây là giá cước báo khách, không phải chi phí vận hành. Nếu cần, phải có cặp amount/currency, precision/scale và quy tắc làm tròn; không mặc định tiền tệ hay đổi tiền. |
| Tiền lương | `salaryAmount: BigDecimal(18,2)` + currency, chưa sync | Có được xuất sang Base và ai được xem/sửa? Không tự mở rộng payload sang lương. |
| MultiSelect | Không có field đang gửi | Nếu schema thực dùng MultiSelect, cần mapping tập giá trị; không tự biến scalar thành mảng hay tách theo dấu phẩy. |
| Person | Hiện chỉ gửi chuỗi tên | Cần loại ID và mapping Lark user đã xác minh; không suy open ID từ email/Employee UUID. |
| Customer/truck dạng relation | Hiện chỉ gửi tên/số xe | Cần record ID của bảng liên quan nếu thực tế là relation; không tự tạo bảng/record liên quan. |
| Status và thao tác nghiệp vụ | Payload chỉ có chuỗi status | Nếu nhận sửa từ Base phải tuân thủ command/validation của hệ thống; không ghi trực tiếp để bỏ qua lịch sử, phân quyền hoặc quy tắc chuyển trạng thái. |
| Record tạo/xóa trên Base | Handler nhận added/edited/deleted và phát sự kiện nội bộ | Có được tạo/xóa thực thể TMS từ Base không? Record bị xóa thì đánh dấu lỗi, tạo lại hay ngừng sync? Không tự xóa TMS. |
| Quyền kích hoạt/xem sync | `/api/lark/base/**` hiện rơi vào fallback yêu cầu đăng nhập, không có matcher role riêng | Ai được xem trạng thái, đẩy load và đẩy tài xế? Chốt cả tenant/sandbox scope trước khi bật UI. |
| Tài xế hợp lệ | API nhận Employee UUID, chưa lọc DRIVER | Dùng role DRIVER hay tiêu chí nghiệp vụ nào khác? Có cho sync người không hoạt động không? |

## 5. Quy tắc kỹ thuật cần đối chiếu schema

Tài liệu/ví dụ chính thức của Lark phân biệt payload Text, Number, SingleSelect, MultiSelect, DateTime và Person. Ví dụ DateTime dùng milliseconds; Person dùng mảng đối tượng ID; SingleSelect dùng chuỗi và MultiSelect dùng mảng chuỗi. Đây chỉ là quy tắc định dạng để đánh giá mapping, **không chứng minh cột Base của dự án có kiểu tương ứng**. Nguồn: [ví dụ field và record của Lark](https://github.com/larksuite/openclaw-lark/blob/main/skills/feishu-bitable/references/examples.md).

Khi có quyền đọc Base thử nghiệm, lấy metadata qua GET bảng và GET fields, phân trang đến hết; không gọi tạo field hay ghi record để thử kiểu. API metadata được liệt kê trong [hướng dẫn chính thức của Lark](https://open.larksuite.com/document/home/agile-project-cycle-management-based-on-bitable/introduction).

Chưa chốt batch size, QPS hoặc thời hạn idempotency của provider từ tài liệu cũ; phải kiểm tra đúng API triển khai trước Giai đoạn 2. Upsert cần xử lý cả trường hợp provider đã tạo record nhưng client timeout/chưa lưu được liên kết; chỉ thêm bảng `record_id` chưa đủ chứng minh không trùng.

## 6. Cổng duyệt 1 — người dùng quyết định

Chưa có quyết định nào dưới đây được mặc định chấp thuận. Cần trả lời:

1. **Schema thử nghiệm:** cấp bản xuất schema đã bỏ credential hoặc vị trí cấu hình của Base thử nghiệm; xác nhận quyền đọc metadata. Hiện giữ giới hạn chỉ đọc cấu hình cục bộ.
2. **Chiều đồng bộ:** TMS → Base, hay hai chiều? Có cần Base tạo/xóa load hoặc tài xế không, hay chỉ sửa record đã liên kết?
3. **Nguồn sự thật và quyền sửa theo field:** với từng dòng trong bảng load/tài xế, chọn TMS hoặc Base là nguồn chính; ghi rõ field nào cho phép Base sửa. Đặc biệt status, phân công xe/dispatcher, email và salary type. Không cần đưa salary amount/currency vào phạm vi nếu không muốn.
4. **Xung đột:** nếu TMS và Base đều thay đổi kể từ lần sync thành công, chọn ghi đè theo nguồn chính, bỏ qua, hay báo lỗi/chờ xử lý; cho biết có ngoại lệ theo field không. Chốt thêm giá trị trống có xóa đích không.
5. **Định danh, ngày giờ và phạm vi:** có thêm UUID TMS vào Base không; xử lý record cũ/record bị xóa; dispatcher/customer/truck là text hay relation/person; múi giờ IANA và ngày giao hàng là instant hay ngày nghiệp vụ; tiêu chí tài xế hợp lệ và role được thao tác sync.

Mẫu bảng trả lời dùng sau khi có schema thật:

| Domain / field hoặc nhóm field | Chiều cho phép | Nguồn chính | Base được sửa? | Khi xung đột | Khi trống |
|---|---|---|---|---|---|
| Load: number, name, status, customer, truck, dispatcher, delivery date | Chờ duyệt | Chờ duyệt | Chờ duyệt | Chờ duyệt | Chờ duyệt |
| Driver: full name, email, phone, status, salary type | Chờ duyệt | Chờ duyệt | Chờ duyệt | Chờ duyệt | Chờ duyệt |

Nếu các field cùng nhóm khác chính sách, tách thành từng dòng. **Dừng tại đây; chỉ sang Giai đoạn 2 sau khi mapping và quyết định được duyệt.**

## 7. Checklist Lark thật để dùng ở Giai đoạn 4

Tất cả mục dưới đây hiện **CHƯA CHẠY**. Chỉ chạy trên Base thử nghiệm đã xác nhận, với dữ liệu tổng hợp không chứa thông tin nhân sự thật.

- Đẩy load và tài xế mới: nội dung đúng kiểu/schema, lưu liên kết và thời gian/trạng thái.
- Đẩy lại, hai yêu cầu đồng thời, timeout sau khi provider tạo record: vẫn một record cho cùng thực thể và scope.
- Sửa field được phép trên Base: áp dụng đúng TMS nếu duyệt hai chiều; field cấm sửa bị xử lý đúng chính sách đã duyệt.
- Event do chính hệ thống ghi, gửi lại event ID, restart worker sau ACK: không lặp cập nhật, không mất công việc đã nhận.
- Hai bên sửa cùng lúc: đúng chính sách xung đột, lỗi/trạng thái thấy được qua API/UI.
- Challenge hợp lệ, chữ ký/token sai, timestamp sai: trả mã đúng, không sửa nghiệp vụ; không ghi payload/credential ra log.
- Mất mạng/rate limit: retry có backoff/Retry-After theo contract, không tạo trùng; UI thấy trạng thái và lỗi đã làm sạch.
- Bỏ gán, ngày giờ qua DST, option lạ, phone có số 0 đầu, người/quan hệ thiếu mapping: không đoán dữ liệu.
- Đúng role/tenant/sandbox; không ghi Base production. Nếu một chiều, các case ghi ngược được kiểm tra là không cập nhật TMS.
