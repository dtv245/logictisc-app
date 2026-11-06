STATUS: CHANGES_REQUESTED

# Review độc lập: `trip-execution`

## Kết luận

Bản báo cáo hiện tại đã khắc phục phần lớn nhận xét trước: quyền ACCOUNTANT được mô tả đúng, request cập nhật Trip có `expectedVersion`, timeline không còn bị khẳng định luôn rỗng, và E2E/backend live được phân biệt với unit test dùng mock. Tuy nhiên, vẫn còn bằng chứng test không khớp dữ liệu thực tế và thiếu test case cho khoảng trống xác thực role DRIVER vừa được nêu.

Đây là source audit, không chạy lại test hoặc E2E. Số liệu test trong báo cáo gốc chưa được review này xác minh bằng cách chạy lệnh.

## Vấn đề cần bổ sung

1. **TC-TE-01 trích sai ID stop trong bằng chứng hook — `audit-reports/trip-execution.md:179`.**
   Báo cáo nói hook test gửi đến `/api/trip-stops/stop-1/arrive`, nhưng `src/tests/features/trips/useTripStopActions.test.tsx:88-96` gọi `executeTransition("arrive", "stop-2")` và kiểm tra URL `/api/trip-stops/stop-2/arrive`. Sửa lại endpoint trong mô tả. Phần nói component test chỉ xác nhận nút xuất hiện, không kiểm tra click Arrive, là chính xác.

2. **TC-TE-06 gọi payload mock là hợp lệ dù `driverId` không phải UUID — `audit-reports/trip-execution.md:184`.**
   Hook test truyền `driverId: "drv-1"` (`src/tests/features/trips/useTripDriverAssignments.test.tsx:88-105`), trong khi backend yêu cầu `UUID` (`/home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/trip/AssignDriverRequest.java:9-14`). Test này dùng mock và không gửi request tới backend; do đó không chứng minh payload hợp lệ hoặc backend lưu thành công. Đổi thành mô tả hook gửi payload mock, hoặc dùng UUID hợp lệ và giữ kết luận backend ở mức `SOURCE_REVIEWED`.

3. **GAP-TE-05 chưa có test case tương ứng — `audit-reports/trip-execution.md:280-290` và bảng test `:177-194`.**
   Source xác nhận `/api/drivers` đang bỏ qua lọc role vì `EmployeeService.searchDrivers` truyền `roleId=null` (`/home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/EmployeeService.java:44-52`; điều kiện repository bỏ qua lọc khi null tại `/home/vumoi/logictics_api/src/main/java/com/company/logicstic/repository/EmployeeRepository.java:30-38`). `TripExecutionService.assignDriver` cũng chỉ tìm Employee theo ID rồi lưu assignment, không kiểm tra role (`/home/vumoi/logictics_api/src/main/java/com/company/logicstic/service/TripExecutionService.java:38-60`). Báo cáo đã nhận diện khoảng trống này, nhưng bảng test không có ca kiểm tra danh sách `/api/drivers` chỉ chứa DRIVER hoặc từ chối gán nhân viên role khác. Bổ sung các ca đó và ghi rõ chưa có backend integration test chạy; không đánh dấu PASS từ source audit.

## Các phần đã đối chiếu đạt

- Request body `PUT /api/trips/{id}` có `expectedVersion` bắt buộc; permission Trips và Load Timeline được tách đúng.
- Các endpoint Stop, state transition, dwell calculation và thiếu cập nhật Trip tự động khớp source. Báo cáo phân biệt việc không có command/UI chuyên biệt với raw API có thể cập nhật `status`; không tự suy ra Load phải thành `DELIVERED`.
- Không có caller production của `LoadTimelineService.recordEvent` trong luồng Trip Stops; cảnh báo `newStatus=null` để tránh ghi đè status Load là đúng. Các empty-state label hiện khớp source.
- Khoảng trống mileage/driver được trình bày như data/UX gap, role DRIVER là policy risk, và `FEATURE_GATED` không bị tính thành bug mặc định.
- Báo cáo ghi unit/hook tests dùng mock, backend live chưa kiểm thử và E2E `BLOCKED`; không đánh đồng source audit với E2E.
