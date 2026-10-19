# Ghi chú Tái thiết kế Thanh điều hướng bên trái (App Sider) dạng Icon Rail Phẳng

## 1. Bảng ánh xạ phần tử Thiết kế (Mockup) -> Component Code trong Repo

| Phần tử thiết kế (Mockup) | Component / Vị trí trong Repo | Mô tả hiện thực & Quy tắc ứng xử |
| :--- | :--- | :--- |
| **Rail hẹp cố định (64px)** | `AppSider.tsx` (`Layout.Sider`), `AppSider.scss` | Chiều rộng rail 64px (`width={64}`, `collapsedWidth={64}`). Nền `#F2F2F4` đồng nhất với layout, **không viền, không bóng, không thẻ tách rời** (`box-shadow: none !important; border: 0 !important;`). |
| **Logo / Brand Mark** | `AppTitle.tsx` (`.app-sider__logo`), `.app-sider__brand` | Khối vuông 40x40px bo tròn ~12px nền đen (`#111111`), dấu thương hiệu xe tải trắng (`#FFFFFF`). **Chỉ là nhận diện thương hiệu, không còn là nút kích hoạt AI GAP chat**. |
| **Cột icon điều hướng liên tục** | `NAV_ZONES`, `.app-sider__menu`, 1 AntD `<Menu>` duy nhất | MỘT cột liên tục gồm 6 khu vực chính (`operations`, `transport`, `fleet`, `partners`, `finance`, `payroll`), khoảng cách đều ~4-8px, không thẻ nhóm `app-sider__group`. Bàn phím dùng phím mũi tên điều hướng liền mạch từ trên xuống dưới. |
| **Mục đang chọn (Active)** | `.app-sider__zone--active`, `.ant-menu-item-selected` | Nền TRẮNG `#FFFFFF`, đổ bóng nhẹ `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`, icon đậm gần đen (`#111111`). Có `aria-current="page"`. |
| **Mục rê chuột (Hover)** | `:hover`, `.ant-menu-submenu-open` | Nền xám mờ nhẹ `rgba(0,0,0,0.04)`, chuyển động êm `transition: all 0.2s cubic-bezier(0.2, 0, 0, 1)`. Khi submenu đang mở, giữ nền hover. |
| **Khoảng trống & Thông báo** | `.app-sider__notifications`, `NotificationHeaderIcon` | Khoảng trống nhỏ (~16-24px) phía dưới Menu chính, chứa chuông thông báo (icon `Bell` từ `lucide-react`, container 44x44px bo 14px). Badge đỏ số lượng chưa đọc thật (tối đa `99+`), tự ẩn khi count = 0. |
| **Khu vực Quản trị (Admin)** | `.app-sider__footer` -> `zone:admin` (`AdminZoneIcon` / `Settings`) | Menu một mục độc lập ghim ở đáy, icon bánh răng Settings, mở flyout menu con Nhân viên (`res:employees`) và Hồ sơ & tài liệu (`res:documents`). |
| **Nút Trợ lý AI (AI Agent)** | `.app-sider__ai-agent-btn`, `AiAgentNavIcon` (`Sparkles`) | Vòng tròn nền tối ~34px (`#18181b`), viền tím (`#8b5cf6`), icon `Sparkles` trắng, đổ bóng tím nhẹ. Nhấp kích hoạt sự kiện `toggle-ai-gap-chat`. **Chỉ render khi widget AI GAP thực sự khả dụng** (`useAiFeatures` enabled hoặc dev force). Có `data-testid="app-sider-ai-agent-button"`. |
| **Avatar người dùng & Dropdown** | `.app-sider__account` (`Avatar` + `Dropdown`) | Tròn 32px viền trắng bóng nhẹ, hiển thị avatar người dùng thật từ hook `useCurrentUser` hoặc ký tự đầu tên. Nhấp mở dropdown (placement `topLeft` hướng vào nội dung) gồm: Đổi công ty, Đăng xuất. |
| **Nút Đăng xuất riêng ngoài rail** | ĐÃ BỎ | Đăng xuất được tích hợp trong dropdown tài khoản, tránh trùng lặp thao tác ngoài thanh rail hẹp. |
| **Flyout Submenu** | `.app-sider-popup.ant-menu-submenu-popup` | Mở sang phải khi click/hover, bo tròn 16px, đổ bóng mềm mại (`0 12px 32px rgba(0,0,0,0.1)`), gom nhóm theo tiêu đề chữ in hoa nhỏ (`navigation.sections.*`), phân cách bằng divider nhẹ. |
| **Mobile Drawer / Responsive** | CSS `@media (max-width: 767.98px)` | Rail giữ kích thước gọn 60px để tối ưu không gian nội dung trên thiết bị di động. |

---

## 2. Nguồn số liệu Badge (Thực tế vs Giả định)

- Mockup hiển thị các badge số giả định: `24` (đỏ), `6` (đen), `3` (tím).
- **Quy tắc bắt buộc**: KHÔNG ĐƯỢC BỊA DỮ LIỆU. Không đưa số giả định 24, 6, 3 vào code chạy thật.
- **Nguồn số liệu thực tế trong repo**:
  - `NotificationHeaderIcon`: Dùng hook thông báo (`useList` trên resource `notifications` / unread count) -> Hiển thị badge số lượng thông báo chưa đọc thật (tối đa 99+). Tự ẩn khi không có thông báo chưa đọc.
  - Các mục khác (`trips`, `loads`, `fleet`): Chưa có endpoint/hook đếm số lượng cảnh báo thời gian thực trên thanh sider -> **Ghi nhận: Chưa có dữ liệu thật, không render badge số giả**.

---

## 3. Hệ thống Token & Bộ Icon Lucide (lucide-react)

- **Thư viện icon**: Dùng `lucide-react` (đã có sẵn trong repo phiên bản `^1.55.0`).
- **Quy chuẩn icon**: `size={20}`, `strokeWidth={1.5}`, `color="currentColor"`.
- **Ánh xạ icon cụ thể**:
  - `zone:operations` -> `LayoutGrid`
    - Màn hình: Trung tâm điều hành (`Monitor`), Dashboard (`BarChart3`), AI điều phối (`Bot`), Tối ưu điều phối (`Rocket`).
  - `zone:transport` -> `Send`
    - Màn hình: Bảng điều phối (`Kanban`), Đơn hàng (`Package`), Chuyến xe (`Compass`), Container (`Box`), Bến bãi (`MapPin`).
  - `zone:fleet` -> `Truck`
    - Màn hình: Xe tải (`Truck`), Bảo trì (`Wrench`), HOS/ELD (`Clock`), DVIR (`ClipboardCheck`), Tai nạn (`AlertTriangle`), Báo cáo đội xe (`LineChart`).
  - `zone:partners` -> `Building2`
    - Màn hình: Khách hàng (`Users`), Hàng hóa (`ShoppingBag`).
  - `zone:finance` -> `Receipt`
    - Màn hình: Hóa đơn (`FileText`), Thanh toán (`CreditCard`), Chi phí (`BadgeDollarSign`), Lợi nhuận (`TrendingUp`).
  - `zone:payroll` -> `Wallet`
    - Màn hình: Quyết toán (`FileCheck`), Chính sách lương (`Sliders`), Bảng lương (`DollarSign`), Đối soát (`Scale`), Phiếu lương (`UserCheck`).
  - `zone:admin` -> `Settings`
    - Màn hình: Nhân viên (`UserCog`), Hồ sơ & tài liệu (`FolderArchive`).
  - Tiện ích đáy: Thông báo (`Bell`), Trợ lý AI (`Sparkles`), Đăng xuất (`LogOut`), Đổi công ty (`Building2`).

---

## 4. Checklist Kiểm tra Thủ công (Manual Verification Checklist)

1. **Hiển thị & Bố cục phẳng**:
   - [x] Thanh rail 64px, nền `#f2f2f4` tiệp hoàn toàn với nền layout, không còn khung card trắng bọc nhóm.
   - [x] Logo ô vuông bo góc 40x40px nền đen ghim trên cùng.
   - [x] Cột 6 icon chính xếp liền mạch, khoảng cách đều 4-8px.
   - [x] Icon chuông thông báo tách biệt phía dưới Menu chính với badge đỏ số lượng thật.
   - [x] Cụm đáy ghim cố định: Bánh răng Quản trị -> Nút AI Agent vòng tròn tím -> Avatar người dùng tròn 32px.
2. **Hành vi & Phân quyền**:
   - [x] Active item có nền trắng, đổ bóng nhẹ, icon đậm màu than gần đen.
   - [x] Submenu flyout mở sang phải khi hover/click, tự ẩn Tooltip của icon tương ứng để không chồng lấn giao diện.
   - [x] Khóa quyền truy cập tự động ẩn zone/màn hình tương ứng (đã kiểm chứng qua unit test).
   - [x] Bấm nút AI Agent kích hoạt CustomEvent `toggle-ai-gap-chat` mở khung chat AI GAP.
   - [x] Không còn nút Đăng xuất riêng ngoài rail; đăng xuất thực hiện thông qua dropdown của Avatar.
3. **Màn hình thấp & Cuộn độc lập**:
   - [x] Trên màn hình có chiều cao thấp (viewport 550px), cột icon ở giữa cuộn dọc độc lập ẩn scrollbar; logo và cụm đáy vẫn ghim cố định không bị đẩy khỏi màn hình.
4. **Trợ năng (Accessibility)**:
   - [x] Mỗi icon khu vực có `aria-label` và Tooltip khi hover/focus.
   - [x] Phân khu active có thuộc tính `aria-current="page"`.
   - [x] Hỗ trợ điều hướng bằng phím Tab, Enter, Space.
