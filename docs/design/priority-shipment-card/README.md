# Thẻ chuyến vận chuyển trên dashboard

Component: `src/components/dashboard/PriorityShipmentCard.tsx`.
SCSS và test component đặt cạnh file. Type thuần ở `src/types/dashboard/priority-shipment.types.ts`.

Ảnh bàn giao: [desktop](./desktop.png), [mobile 390px](./mobile-390.png), [mobile 320px](./mobile-320.png).

`DashboardPriorityShipment` ghép component với `usePriorityShipments`, dùng resource `loads` và quyền `list` sẵn có của Refine. Cả `/dashboard` và `/operations` dùng chung `OperationsDashboardView`, đã thay đúng vị trí thẻ chuyến ưu tiên bằng component mới. Không thay các khu vực dashboard khác.

## Dữ liệu

- Lấy tối đa 20 load `in_transit`, giữ thứ tự mặc định của API. `requestedDeliveryDate` không thuộc allowlist sort của cả frontend và backend.
- Hiển thị mã load, điểm đi/đến, khách hàng, trạng thái, số xe và giờ giao đã hẹn từ API hiện có.
- `requestedDeliveryDate` chỉ là giờ giao đã hẹn; không dùng làm ETA hoặc tự tạo khung giờ giao.
- Không dùng `assignedDispatcherName` làm tên tài xế.
- DTO load chưa cung cấp telemetry, ETA dự báo, tuyến tránh, tiến độ GPS, pallet hoặc tải trọng. Các giá trị đó để trống (`—`), nhận qua props khi có nguồn dữ liệu thật.
- Thiếu dữ liệu hiển thị trạng thái trống; loading/lỗi có thông báo và nút thử lại. Mất quyền đọc sẽ ẩn cả dữ liệu đã cache.
- Dữ liệu Oakland/Sacramento trong ảnh tham chiếu chỉ nằm trong fixture E2E, không được import vào ứng dụng.

## Kiểm tra giao diện

Chạy `npm run dev -- --host 127.0.0.1 --port 4173`, mở:

- `/e2e/fixtures/priority-shipment-card.html`: so bố cục tiếng Anh với ảnh tham chiếu.
- Thêm `?locale=vi`: tiếng Việt.
- Thêm `?state=empty`, `?state=loading`, `?state=error`: trạng thái tương ứng.

Lệnh: `npx playwright test e2e/priority-shipment-card.spec.ts --project=chromium`.
Ảnh desktop và mobile được lưu trong thư mục này. Kiểm tra không tràn ngang và các ô telemetry không đè nhau ở 390px/320px.

## Ảnh xe tải

Asset minh họa: `src/assets/dashboard/priority-truck.png`, tạo bằng công cụ `image_gen` tích hợp, nền trong suốt. Đây là hình minh họa chung, không phải ảnh chiếc xe thực tế của load.

Prompt cuối cùng (ảnh người dùng cung cấp chỉ dùng để tham chiếu góc nhìn):

> Use case: product-mockup. Asset type: transparent truck cutout for a logistics dashboard. Input image: reference only for the exact truck pose and proportions, NOT an edit target. Generate only the photorealistic ivory / warm-white European cab-over semi truck with long cream refrigerated box trailer shown in the reference. Three-quarter front-left view, cab on LEFT facing towards viewer and left, trailer extends RIGHT into distance. Complete vehicle, all wheels visible. Low camera at roughly cab grille height; match the reference perspective and proportions. Clean realistic materials, dark teal windshield, silver grille, dark tyres, neutral soft studio lighting. Horizontal composition, truck fills almost all the image width with a small margin. Background fully TRANSPARENT, very subtle contact shadow only under wheels. No dashboard, UI, cards, labels, dots, connection lines, typography, logos, scenery, or border. Deliver a single isolated truck image, suitable for placing on a pale grey UI card.

## Bằng chứng kiểm tra trong phiên 2026-10-16

| Lệnh | Baseline trước khi sửa | Sau thay đổi |
| --- | --- | --- |
| `npm run build` | exit 0 | exit 0 |
| `npm run lint` | exit 0; 0 lỗi, 1 warning | exit 0; 0 lỗi, cùng 1 warning |
| `npx vitest run` | exit 0; 181 file; 1.246 pass, 0 fail | exit 0; 183 file; 1.260 pass, 0 fail |
| `npx playwright test e2e/priority-shipment-card.spec.ts --project=chromium` | Chưa có test này | exit 0; 2 pass, 0 fail |

Test mới: 9 test component và 5 test hook. Kiểm tra loading/lỗi/trống, retry, chuyển chuyến, mất bản ghi đang chọn, giữ giá trị 0, số liệu tuyến tránh, không giả ETA/telemetry/tài xế và quyền đọc dữ liệu. Playwright dùng fixture riêng, kiểm tra ảnh đã tải và bố cục desktop/mobile. Đây là kiểm tra cấu trúc/bố cục và đối chiếu ảnh bằng mắt, không phải khẳng định pixel giống tuyệt đối.

Playwright ban đầu không mở được web server trong sandbox (exit 1), đã chạy lại bằng quyền mở server cục bộ được duyệt. Một lượt desktop thất bại vì kiểm tra ảnh trước khi ảnh tải xong; đã đổi sang chờ ảnh tải, các lượt cuối đạt 2/2. Không thay đổi package.json hay lockfile, chưa commit/push.

Đã giữ nguyên thay đổi có sẵn trong repo sau khi người dùng cho phép tiếp tục. Với file đang sửa dở `src/features/dashboard/components/OperationsDashboardView.tsx`, phiên này chỉ đổi 1 dòng import và 1 dòng render để tích hợp thẻ mới; không di chuyển file.

Cảnh báo cũ giữ nguyên: `useDriverRanking.ts:57` có dependency dư trong useMemo; build có chunk lớn. `git diff --check` toàn repo exit 2 vì dòng trống cuối file đã tồn tại ở `src/features/dashboard/api.ts:146`, `src/formatters/dateTime.ts:213`, `src/pages/dashboard/OperationsDashboardPage.tsx:17`, `src/pages/loads/show.tsx:164`. Kiểm tra riêng file tích hợp dashboard bằng `git diff --check -- src/features/dashboard/components/OperationsDashboardView.tsx` exit 0.

Chưa kiểm chứng luồng tải dữ liệu với backend thật hoặc thiết bị telemetry thật. Những ô chưa có nguồn API vẫn để `—`.
