# LOGISTICSX — MASTER UI/UX IMPROVEMENT PLAN

> **Phiên bản:** `v1.0 / COMPLETE PLANNING BASELINE`  
> **Ngày lập:** 19/10/2026  
> **Trạng thái:** Đã bắt đầu triển khai; trạng thái từng task và bằng chứng nghiệm thu được ghi tại §16 và `docs/UI_UX_IMPLEMENTATION_PROGRESS.md`.
> **Nguồn chính:** `docs/CURRENT_UI_UX_FLOW_ANALYSIS.md` (bản hiện có); đối chiếu source runtime và `docs/ux/sprint0-triage.md`. File `CURRENT_UI_UX_FLOW_ANALYSIS(1).md` và hai video tham khảo không có trong working tree phiên này.
> **Nguồn tham chiếu:** Hai video UI/UX logistics đã phân tích trong cuộc trao đổi  
> **Baseline source theo báo cáo:** `cff6c8c89b80e5f5501feb4747caf786722a55c8` (báo cáo có tính cả working tree chưa commit)

## 0. Mục tiêu và phạm vi

### 0.1. Mục tiêu

Nâng cấp UX và tính nhất quán UI cho frontend LogisticsX bằng cách **giữ lại các workflow nghiệp vụ đang có**, khắc phục luồng bị đứt, phân biệt rõ dữ liệu thật/mẫu, chuẩn hóa design system, sau đó cải tiến những màn hình có giá trị vận hành cao. Hai video là **tham chiếu về bố cục, visual hierarchy và pattern tương tác**, không phải bằng chứng về chức năng backend của dự án.

**Kết quả cuối kỳ mong muốn:**

1. Các CTA trên route hoạt động không dẫn người dùng vào URL chưa đăng ký hoặc tính năng bị khóa mà không có giải thích.
2. Luồng Load → Trip → AI Dispatch/Optimization có trạng thái, điều hướng và phản hồi nhất quán.
3. Operations không gây hiểu nhầm giữa chỉ số live, dữ liệu mẫu, fallback và dữ liệu thiếu.
4. Ant Design, SCSS và các màn redesign cùng sử dụng hệ token được thống nhất.
5. Các màn hình ưu tiên có trạng thái loading/empty/error/permission/disabled, responsive, keyboard và regression test.

### 0.2. Phạm vi hiện có (đã đối chiếu source trong phiên triển khai)

- **Stack:** React 18, TypeScript, Vite, Refine, Ant Design 5, SCSS/CSS variables, React Router v6, TanStack Query, Zustand; Leaflet/MapLibre; Recharts; Vitest/Playwright.
- **Route:** Báo cáo ghi 55 mẫu URL đang đăng ký (31 CRUD + 24 tường minh), không phải 55 màn thiết kế độc lập hoặc 55 luồng đã hoạt động end-to-end.
- **Nhóm màn hình:** Operations, Load/Trip/Truck, AI Dispatch, Optimization, Documents, Notifications, Fleet, Profitability, Settlement, Payroll, Payslip…
- **Mức chắc chắn:** Phần lớn phát hiện từ source; browser fixture chỉ xác nhận UI giả lập, chưa xác nhận backend live.

### 0.3. Ngoài phạm vi **ở V1**

- Viết lại ứng dụng, thay framework, thay thư viện UI hoặc bổ sung motion library nặng chỉ để sao chép video.
- Tự bật feature flag `GATED` khi chưa có API contract/permission/runtime verification.
- Tự triển khai Inbox, Live Tracking, auto-assign hoặc năng lực AI giống video khi chưa được phê duyệt thành requirement.
- Biến giá trị mock/static thành dữ liệu có vẻ live hoặc dùng fixture để khẳng định backend thành công.
- Thay đổi state machine tài chính, payroll, settlement hay logic idempotency chỉ vì chỉnh giao diện.

## 1. Quy ước bằng chứng, ưu tiên và trạng thái

### 1.1. Nhãn bằng chứng

| Nhãn | Ý nghĩa |
|---|---|
| `SOURCE` | Có implementation trong source; chưa xác nhận backend xử lý thành công. |
| `BROWSER-FIXTURE` | Đã xác minh render/tương tác với fixture; không xác nhận backend thật. |
| `MOCK/STATIC` | Dữ liệu/hành vi mô phỏng hoặc hằng số. |
| `GATED` | Code tồn tại nhưng runtime/capability đang chặn. |
| `UNROUTED` | Component/page có source nhưng chưa có route đang đăng ký. |
| `PROPOSAL` | Giải pháp được đề xuất từ phân tích UX, **chưa phải lỗi đã xác minh**. |
| `NEEDS-LIVE` | Cần tài khoản, tenant, quyền và backend để kiểm chứng. |

### 1.2. Mức ưu tiên

| Priority | Tiêu chí | Cách xử lý |
|---|---|---|
| `P0` | Luồng chính đứt, CTA dẫn 404, hoặc hiển thị dữ liệu mẫu gây hiểu nhầm nghiêm trọng | Xác minh/sửa trước redesign; có thể tạm chặn CTA an toàn nếu chưa có backend. |
| `P1` | Thao tác lúng túng, thiếu đồng nhất, lỗi navigation state, thiếu phản hồi | Đưa vào sprint UX chính sau khi khóa phạm vi. |
| `P2` | Polish UI, animation, tiện ích, module thứ cấp | Làm sau các flow quan trọng; có thể nâng ưu tiên theo báo cáo mới. |
| `BLOCKED` | Phụ thuộc API/permission/contract chưa rõ | Không thực thi nghiệp vụ; ghi blocker và phương án giao diện an toàn. |

### 1.3. Trạng thái công việc

Trạng thái triển khai dùng trong phiên: `BACKLOG`, `VERIFYING`, `READY`, `IN_PROGRESS`, `IN_REVIEW`, `UI_SAFE_DONE`, `INTEGRATION_DONE`, `DONE`, `BLOCKED`.

`DONE` chỉ dùng khi acceptance criteria có bằng chứng. `UI_SAFE_DONE` xác nhận phần UX an toàn đã hoàn tất nhưng không tuyên bố API/backend integration; `INTEGRATION_DONE` yêu cầu xác nhận contract/runtime thật. Trạng thái hiện tại của từng ticket nằm ở §16.

## 2. Chiến lược triển khai

| Giai đoạn | Mục tiêu | Điều kiện hoàn thành |
|---|---|---|
| **S0 — Baseline & xác minh** | Khóa phạm vi, audit hiện trạng, lập test baseline | Danh sách flow/route/permission/data-mode + issue register có evidence. |
| **S1 — Flow safety (P0)** | Sửa/guard các CTA đứt, thao tác không rõ nguồn dữ liệu | Không còn CTA P0 rơi vào route chưa đăng ký; các chức năng gated thông báo trung thực. |
| **S2 — Design System** | Đồng bộ token, Ant Design theme, component chung | Visual conventions nhất quán, không phá CRUD/workflow. |
| **S3 — Operations Dashboard** | Chuẩn hóa KPI, priority shipment, brief, map, timeline | Demo/live rõ ràng; mọi panel có state và action hợp lệ. |
| **S4 — Load & Trip** | Cải thiện form/detail, AI GAP, điều hướng, tiến trình | Flow tạo/xem/load-trip rõ, những thao tác sửa có guard phù hợp. |
| **S5 — AI Dispatch & Optimization** | Cải thiện run/review/approval/history | UI phân biệt request thật và mô phỏng; hành động có feedback và state chính xác. |
| **S6 — Modules còn lại** | Documents, Notifications, Fleet, Finance, Settlements, Payroll, Payslips | Luồng trọng yếu theo domain được QA riêng, không thay đổi quy tắc nghiệp vụ. |
| **S7 — Polish + release gate** | Responsive, accessibility, performance, regression | Đạt checklist chung và có bằng chứng test. |

> **Lưu ý:** Các phase là thứ tự công việc, **không phải số tuần cam kết**. Regression, accessibility và kiểm soát dữ liệu phải làm xuyên suốt.

## 3. Backlog tích hợp từ báo cáo hoàn chỉnh

### 3.1. S0 — Baseline & xác minh

| ID | Task / file hoặc khu vực cần kiểm tra | Priority | Evidence / dependency | Acceptance criteria |
|---|---|---|---|---|
| `BASE-001` | Kiểm tra `git status`, HEAD, scripts, route registry trước khi sửa; lưu baseline screenshot cho desktop/tablet/mobile | P0 | Báo cáo dựa trên working tree chưa commit và HEAD cũ | Không ghi đè thay đổi hiện có; có baseline rõ môi trường/commit. |
| `BASE-002` | Audit menu, routes, capability và role: `App.tsx`, `router/AppRouter.tsx`, `pages/resourceRegistry.ts`, `components/AppSider.tsx` | P0 | `SOURCE` / `GATED` / `UNROUTED` | Có bảng CTA → route → quyền → trạng thái hoạt động cho các màn ưu tiên. |
| `BASE-003` | Xác nhận data modes: production API, `/operations?demo=1`, dev proxy fallback, Playwright fixture | P0 | `SOURCE`, `MOCK/STATIC` | Test nêu rõ data mode, tenant và vai trò; không suy luận API từ UI success giả. |
| `BASE-004` | Chụp baseline visual cho Operations/Load/AI/Optimization với viewport cố định; đối chiếu video theo layout và flow, không copy camera effects | P1 | `PROPOSAL` | Có screenshot và danh sách khác biệt theo từng screen. |
| `BASE-005` | Kiểm tra các kết luận quan trọng bằng session/backend thật khi có quyền | P0 | `NEEDS-LIVE` | Mỗi issue có bằng chứng `source`, `fixture`, hoặc `live`, không trộn nhãn. |

| `BASE-006` | Đối chiếu mâu thuẫn trạng thái CRUD `ON/OFF` trong §4.3 với `foundationResourcePageRoutes`, `AppRouter.tsx`, role/tenant | P0 | `SOURCE` / báo cáo nội bộ không nhất quán | Một ma trận nguồn sự thật `route + role + tenant + capability + mode`; không tự bật đường đi bị khóa. |
| `BASE-007` | Kiểm tra từng phát hiện `UX-01..UX-08`, feature gap 13 mục, gắn reproduced/not-reproduced/blocked và testcase | P0 | §14–15 bản hoàn chỉnh; chưa có browser backend-live | 8/8 UX và 13/13 gap có trạng thái triage, owner/next step; không đánh dấu bug fixed chỉ do xuất hiện trong source. |

> **Quan sát bổ sung từ báo cáo hoàn chỉnh:** §4.3 có các hàng catalog CRUD ghi `OFF` nhưng đoạn tổng kết §4.3 và navigation tree lại mô tả một số resource `ON`; phải đối chiếu `foundationResourcePageRoutes` và runtime trước khi chốt route. Không chọn một bảng làm chân lý khi chính báo cáo có cách diễn đạt mâu thuẫn.

### 3.2. S1 — Flow safety và navigation (ưu tiên trước thay đổi visual)

| ID | Vấn đề / source gợi ý | Priority | Dependency / cách tiếp cận an toàn | Acceptance criteria |
|---|---|---|---|---|
| `NAV-001` | AI GAP `Fill` dẫn tới `/loads/edit/:id` bị khóa (`ShipmentDetailView`, GAP panel/widget, core resource capability) | P0 | `GATED`, cần xác minh quyền + contract sửa Load. **Không tự bật flag.** Nếu chưa cho edit, vô hiệu hóa CTA có giải thích. | Không dẫn 404; khi có quyền và API hợp lệ mở được editor đúng Load. |
| `NAV-002` | Không thống nhất `?focus=...` và `?focusField=...` khi mở editor | P0 | Phụ thuộc `NAV-001`, trường hợp field mapping | Một quy ước URL; trường hợp có field hợp lệ sẽ focus đúng field. |
| `NAV-003` | `NetworkMiniMap`/`NetworkRouteMap` mở `/map` chưa route | P0 | `UNROUTED`; không mount full map nếu source dữ liệu và quyền chưa sẵn | Click không đưa tới 404; dùng hành động hợp lệ hoặc trạng thái `Chưa khả dụng`. |
| `NAV-004` | Dispatch Timeline/Open dispatch dẫn `/load-board` chưa route | P0 | `UNROUTED`; xác nhận màn nghiệp vụ đích trước khi sửa link | Đích có route hợp lệ, giữ ngữ cảnh nếu có; nếu không, CTA được giải thích/ẩn. |
| `NAV-005` | KPI/CTA Fleet có thể dẫn `/accidents` hoặc `/fleet/mileage-attributions` chưa route | P0 | Kiểm tra các `href` theo permission/capability | Không có CTA hiện ra mà dẫn URL không được hỗ trợ. |
| `NAV-006` | Dashboard search gửi `/loads?search=`; mapping với filter list chưa chắc tương thích (`DashboardHeader`, Loads list) | P1 | `SOURCE`, xác minh input → query/filter | Keyword truyền đúng sang list, có empty/result/retry; back/refresh giữ được query. |
| `NAV-007` | Header hiển thị `⌘K` nhưng chưa có keyboard shortcut và search trigger thiếu Enter/Space (`DashboardHeader`) | P1 | Có thể dùng native button; không thêm lib | Click, Enter, Space và shortcut hoạt động (hoặc bỏ nhãn shortcut); focus hợp lý. |
| `NAV-008` | Load Detail mất nút Back khi đổi tab (`pages/loads/show.tsx`, `ShipmentHeader`) | P1 | Xác minh kiến trúc header/tab | Nút Back và tiêu đề vẫn hiện ổn định ở mọi tab được quyền xem. |
| `NAV-009` | AI Dispatch `View Trip` mở Trip list, không mở trip liên quan (`AiMovementPlanCard`) | P1 | Cần `tripId` thật từ response; không tự dựng ID | Có ID hợp lệ: mở đúng detail; thiếu ID: hành động diễn đạt trung thực. |
| `NAV-010` | Notification click chỉ tới list, không có target record (`NotificationHeaderIcon`) | P1 | Cần payload link/entity và permission; chưa chắc backend hỗ trợ | Nếu có đích hợp lệ, điều hướng đúng; nếu không, mở notification/list tương ứng. |
| `NAV-011` | AI session ID alias không đọc ID từ URL; tab/detail chủ yếu local state (`AiDispatchPage`) | P1 | Cần xác minh API session-by-ID trước deep-link | Refresh/deep link hiển thị đúng plan hoặc trạng thái không tìm thấy, không đánh lừa. |

**Tập tin liên quan từ báo cáo:** `src/router/AppRouter.tsx`, `src/components/AppSider.tsx`, `src/features/dashboard/components/DashboardHeader.tsx`, `src/features/dashboard/components/NetworkMiniMap.tsx`, `src/features/dashboard/components/DispatchTimeline.tsx`, `src/pages/loads/show.tsx`, `src/features/loads/components/redesign/ShipmentDetailView.tsx`, `src/pages/ai-dispatch/AiDispatchPage.tsx`.

### 3.3. S2 — Design System & shared components

> Báo cáo xác định global primary `#2563eb`, Operations purple `#703eff`, Load AI purple `#7C3AED` và `AntdLocaleProvider` chưa inject theme token chung. **Không tự chốt màu primary mới** trước khi duyệt thiết kế.

| ID | Task | Priority | File gợi ý | Acceptance criteria |
|---|---|---|---|---|
| `DS-001` | Audit token thực tế, map global/Operations/Load/AntD; đưa ra bảng color semantic | P0 | `styles/_variables.scss`, `styles/global.scss`, `styles/_components.scss`, `features/dashboard/**`, `features/loads/components/redesign/**` | Danh sách token + nơi dùng + phương án migration; vẫn giữ đúng màu semantic status. |
| `DS-002` | Quyết định brand primary và inject Ant Design `ConfigProvider` theme token theo cơ chế provider hiện có | P0 | `main.tsx`, `components/AntdLocaleProvider.tsx` và nơi mount Antd | Form/button/modal từ AntD không lệch cơ bản so với shell; locale vi/en/ja giữ nguyên. |
| `DS-003` | Chuẩn hóa typography, spacing, radius, shadow và selected/focus style | P1 | SCSS globals, AppLayout, Ops primitives | Heading/body/metadata consistent; không làm giảm contrast hoặc làm vỡ layout. |
| `DS-004` | Kiểm soát component chung: Button, StatusTag, Card, Modal/Drawer, Form, AsyncState | P1 | `components/resources/**`, `forms/**`, `features/dashboard/**` | Không tạo bộ component song song không cần thiết; có state matrix default/loading/error/disabled/focus. |
| `DS-005` | Rà soát hai `PriorityShipmentCard` implementation và thiết kế hướng hợp nhất | P1 | `components/dashboard/PriorityShipmentCard.tsx`, `features/dashboard/components/PriorityShipmentCard.tsx` | Cùng presentation contract cho demo/live khi có dữ liệu; không tự sinh shipment giả ở live. |
| `DS-006` | Chuẩn hóa i18n UI mới | P2 | `locales/**`, các redesign component có hard-code | Chuỗi người dùng có bản dịch tương ứng khi sản phẩm yêu cầu vi/en/ja. |

### 3.4. S3 — Operations Dashboard (`/operations`)

| ID | Task | Priority | Evidence / blocker | Acceptance criteria |
|---|---|---|---|---|
| `OPS-001` | Phân tách trực quan mode Mẫu/Thật; gắn nhãn dữ liệu giả/fallback từng panel cần thiết | P0 | `MOCK/STATIC`; `OperationsDashboardPage`, `OperationsDashboardView`, `OperationsDashboardPreview` | Không có chỉ số tĩnh được trình bày là live; mode có thể nhận ra ngay. |
| `OPS-002` | Kiểm tra nguồn của 6 KPI, bỏ fallback gây hiểu nhầm hoặc thể hiện rõ `unavailable` | P0 | `useDashboardData`; hiện API + hằng số | Mỗi KPI có nhãn nguồn/trạng thái thực; API fail không biến thành thành công giả. |
| `OPS-003` | Làm rõ Priority Shipment: dữ liệu thật, selected state, route details | P1 | Hai `PriorityShipmentCard`; default sample trong live | Live không hiển thị shipment mẫu không được gắn nhãn; chọn card nhất quán. |
| `OPS-004` | Thiết kế Operations Brief có empty/loading/error; approve/reject chỉ khi callback + quyền tồn tại | P1 | Preview modal review có confirm disabled | Không có nút tạo cảm giác chạy được khi không có command. |
| `OPS-005` | Xem lại mini-map: empty/location freshness/marker/select/Full Map | P1 | Live không truyền vehicles/routes; map route chưa có | Empty state hữu ích; không hiển thị vị trí live giả; CTA an toàn. |
| `OPS-006` | Dispatch Timeline: empty state, trạng thái giờ và hành động mở đúng đích | P1 | Live không truyền drivers; demo `now=15:20` | Chỉ hiển thị mốc thời gian thực khi có dữ liệu thật; CTA không 404. |
| `OPS-007` | Layout, KPI hierarchy, density theo video; responsive grid và keyboard | P1 | `PROPOSAL`; grid 12 cột đã có | Desktop/tablet/mobile không tràn bất thường; điều hướng thao tác được bằng bàn phím. |

### 3.5. S4 — Load & Trip

| ID | Task | Priority | Dependency | Acceptance criteria |
|---|---|---|---|---|
| `LOAD-001` | Rà soát consistency list: click số Load → full detail; icon View → generic modal | P1 | Existing Refine ResourceActionContext | Hai cách xem có nhãn/hành vi rõ ràng; không vô ý mất nghiệp vụ ở full detail. |
| `LOAD-002` | Cải thiện form tạo Load: nhóm, validation, cảnh báo/feedback, dữ liệu nhập trước khi submit | P1 | Form/API hiện có; không tự thêm AI prefill từ video | Create success/error đúng theo API; không mất dữ liệu khi lỗi. |
| `LOAD-003` | Ổn định header + tabs chi tiết Load, back navigation, permission guard | P1 | `pages/loads/show.tsx`, `ShipmentDetailView` | Header nhất quán dù chuyển tab; tab theo role/capability. |
| `LOAD-004` | Cải thiện Shipment Hero, ETA, route, GAP, Agent, Documents và Timeline | P1 | Nhiều trường có thể không có GPS/AI data thật | Không ngụ ý telemetry live khi thiếu; each panel có trạng thái hợp lệ. |
| `LOAD-005` | Chuẩn hóa GAP fill/dismiss/rerun UI và cache invalidation sau mutation | P1 | `GATED` editor + AI hook + query keys | Không 404; xử lý lỗi hiển thị; sau thành công dữ liệu liên quan được refresh. |
| `TRIP-001` | Rà soát timeline stop transitions và phân công tài xế | P1 | Phải giữ state machine hiện có; cần backend verification | Chỉ cho phép action hợp lệ; pending/error/success, no double submit. |
| `TRIP-002` | Kiểm tra đồng bộ Trip actions với Load Timeline/Detail | P1 | Query invalidation chưa đầy đủ theo source | Dữ liệu liên quan không bị stale sau action đã xác nhận. |

### 3.6. S5 — AI Dispatch & Optimization

| ID | Task | Priority | Dependency | Acceptance criteria |
|---|---|---|---|---|
| `AI-001` | Phân biệt rõ AI runs/decisions dùng API thật với AI connection test, chat trả lời giả | P0 | Config test timeout 500ms; free chat template 400ms | Mọi UI mô phỏng đều có nhãn demo hoặc không tuyên bố đã kết nối/gửi thật. |
| `AI-002` | Rà soát input Run: trường nào được gửi/không gửi API, trạng thái validation/error | P1 | Cần đối chiếu request contract | UI không gợi ý rằng dữ liệu không gửi sẽ ảnh hưởng kết quả run. |
| `AI-003` | Plan History/detail URL và View Trip đúng ID | P1 | API session ID, Trip ID | Chọn/reload/deep link nhất quán hoặc giải thích giới hạn. |
| `AI-004` | Chuẩn hóa modal Approve/Reject và status sau command | P1 | Backend command + idempotency/permissions | Approve/reject không mất ngữ cảnh; lỗi giữ dữ liệu; không tự fabricate audit. |
| `AI-005` | Gỡ/hạn chế affordance chat chưa có handler (Share/voice/search/plus…) hoặc làm rõ disabled | P1 | Không có handlers theo báo cáo | Không có nút bấm cho cảm giác thành công giả. |
| `OPT-001` | Cải thiện entry Optimization cần UUID/evidence; form rõ điều kiện và cách lấy ID | P1 | API contract, policy/resources | Người dùng biết cách cung cấp thông tin và xử lý thiếu dữ liệu. |
| `OPT-002` | Cải thiện candidate comparison/accept modal | P1 | Backend quyết định accept; command conflict/replay hiện có | Compare dễ đọc; conflict có hướng rerun; không thay đổi semantics immutable outcome. |

### 3.7. S6 — Các module còn lại (đã phân loại gap; triển khai phụ thuộc contract)

| ID | Module | Gap từ báo cáo | Priority tạm | Điều kiện trước khi thực hiện |
|---|---|---|---|---|
| `DOC-001` | Documents | Search/filter/sort đang lọc **trang hiện tải**, không phải toàn bộ tập; lỗi query dễ trông như empty | P1 | Chốt server filter API và pagination semantics. |
| `DOC-002` | Documents | Upload picker chỉ ở trạng thái pending; contract upload đang `false` | BLOCKED | Có contract upload mới được triển khai lưu file thật. |
| `DOC-003` | Documents | Download báo success sớm; delete drawer đóng trước khi mutation thành công | P1 | Kiểm chứng blob download và mutation feedback. |
| `NOT-001` | Notifications | Badge đếm unread trong tối đa 5 bản ghi; click không đi tới đối tượng | P1 | API unread total/target link. |
| `FLT-001` | Fleet | CTA missing mileage mở route chưa có; Gantt còn placeholder | P2 | Chốt route/data/evidence. |
| `FIN-001` | Finance | Profitability và rating/invoice action có capability còn khóa | P2 / BLOCKED | Kiểm tra quyền và billing contract; không tự bật. |
| `SET-001` | Settlements | Kiểm tra form/validation/confirmation/transition và audit | P2 | Giữ nguyên finalized immutable/versioned semantics. |
| `PAY-001` | Payroll | Entry cần UUID, không có run-index; workflow command state chặt chẽ | P2 | Chốt nhu cầu run browser với backend; giữ idempotency. |
| `PAY-002` | Payroll reconciliation | Modal evidence, pending/error, hạn chế double-submit | P2 | Giữ evidence + frozen command semantics. |
| `PSL-001` | Payslips | Tối ưu hiển thị snapshot/PDF/unavailable payment | P2 | Không suy payment status nếu backend chưa có. |

### 3.8. S7 — Cross-cutting quality

| ID | Task | Priority | Acceptance criteria |
|---|---|---|---|
| `QA-001` | Responsive theo viewport thực tế | P1 | Chạy ít nhất 1440, 1024, 768, 390, 320px; không tràn ngang ngoài chủ đích. |
| `QA-002` | Keyboard/focus/accessibility | P1 | Tab/Enter/Space/Escape được hỗ trợ theo component, modal restore focus; không chỉ dựa màu. |
| `QA-003` | Contrast và typography mật độ cao | P1 | Text regular nhắm ≥4.5:1, non-text ≥3:1; không có caption khó đọc. |
| `QA-004` | Loading/empty/error/permission/disabled states | P1 | Mỗi route ưu tiên có state matrix, thao tác recover được khi API thất bại. |
| `QA-005` | Reduced motion + CSS animation nhẹ | P2 | Hỗ trợ `prefers-reduced-motion`; không sao chép zoom/rotate camera từ video. |
| `QA-006` | Regression UI + workflow tests (Vitest/Testing Library/Playwright) | P0 xuyên suốt | Không làm hỏng auth/tenant, CRUD, AI approve, financial/payroll guard. |
| `QA-007` | Source/data provenance & observability | P0 | Snapshot/test report nêu demo/fixture/live; không đánh tráo nguồn. |

### 3.9. Bổ sung từ §14–15: các ticket chưa có ở V0.1

Những ticket dưới đây **bổ sung** cho bảng S0–S7; không tạo thêm task trùng khi cùng nguyên nhân. `BLOCKED` nghĩa là cần quyết định hợp đồng API/role/feature trước khi thực thi write.

| ID mới | Nhóm | Công việc cụ thể | File/điểm vào cần xác minh | Priority | Acceptance criteria / blocker |
|---|---|---|---|---|---|
| `SHELL-001` | Navigation/IA | Rà soát icon-only rail, tooltip tên phân hệ, phân nhóm, active/focus và khả năng tìm thấy module theo role | `src/components/AppSider.tsx`, `src/components/appNavigation.tsx`, `src/providers/permissions/roleMatrix.ts` | P1 | Mỗi mục được phép đều nhận diện được qua tên/tooltip, keyboard focus; nhóm chưa route không đánh lừa người dùng; screenshot nhiều role. |
| `CORE-001` | Core edit | Đối chiếu versioned-write contract cho **cả Load/Trip/Truck**, capability và UI edit; tách nhánh disabled UI với implementation sau xác minh | `src/components/resources/resourceCapabilities.ts`, `src/router/AppRouter.tsx`, `src/pages/{loads,trips,trucks}/edit.tsx` | BLOCKED/P0 | Nếu chưa đủ contract: không CTA giả; nếu đã đủ: quyền, version, conflict và lưu/đọc lại đều được kiểm thử backend. |
| `OPS-008` | Operations | Viết hợp đồng dữ liệu panel live (priority shipment, telemetry, vehicle/route, driver timeline, brief); bổ sung missing/unavailable/freshness state | `src/features/dashboard/components/OperationsDashboardView.tsx`, `src/features/dashboard/hooks/useDashboardData.ts`, `src/features/dashboard/api.ts` | P0/P1 | Chỉ dùng dữ liệu có nguồn/đơn vị/thời điểm; thiếu API thì panel `Chưa có dữ liệu`, không fallback sang sample; cần API contract để kết nối live. |
| `AI-006` | AI Dispatch | Hiển thị initial load error và retry thay vì chỉ `console.warn`; phân biệt empty từ error | `src/pages/ai-dispatch/AiDispatchPage.tsx`, `src/features/ai-dispatch/hooks/useAiDispatchActions.ts` | P1 | Mô phỏng lỗi GET `/sessions`/`/pending` có error/retry; không bị xem như lịch sử rỗng. |
| `AI-007` | AI/API | Đối chiếu hành vi lỗi/refresh/token của Axios nhánh AI với API client chuẩn, không đại tu transport khi chưa có test | `src/api/ai/ai.api.ts`, `src/features/ai-dispatch/api/aiDispatch.api.ts`, `src/providers/api/apiClient.ts` | P1 | 401/403/timeout không bị diễn giải thành thành công hoặc feature disabled không lý do; regression auth pass. |
| `DOC-004` | Documents | Giữ drawer đang mở cho tới khi delete API xác nhận; cập nhật selectedDoc theo refetch | `src/features/documents/components/DocumentDropboxView.tsx`, các inspector/actions | P1 | Delete fail: giữ ngữ cảnh + thông báo; success: đóng/refresh chính xác. |
| `DOC-005` | Documents | Kiểm chứng download với bearer-only session; chỉ báo thành công sau khi có Blob hợp lệ hoặc trình duyệt xác nhận hợp lý | Document download handler, `src/features/documents/api/documents.api.ts` | P1 | 401/403/error không tạo toast thành công giả; bảo vệ MIME/file name, dọn object URL khi có. |
| `NOT-002` | Notifications | Phân tích nhu cầu mark-read từng mục và contract; không tự tạo API endpoint | `src/features/notifications/hooks/useNotificationActions.ts`, `NotificationHeaderIcon.tsx` | BLOCKED/P2 | Nếu API có: action từng item, unread total, cache invalidate; chưa có: công khai giới hạn mark-all-read. |
| `FLT-002` | Fleet | Phân tích utilization-history/Gantt thật thay cho placeholder, chỉ làm khi có endpoint/evidence | `src/pages/fleet/FleetReportPage.tsx`, `src/features/fleet/components/FleetCharts.tsx` | BLOCKED/P2 | Không vẽ dữ liệu lịch sử từ số snapshot; có trạng thái unavailable khi chưa có API. |
| `FIN-002` | Payments | Rà soát read-only Payments, capability và dedicated payment commands đang tắt | `src/features/payments/api/paymentCommands.ts`, resource/capability | BLOCKED/P2 | UI không hứa create/edit/cancel khi chưa verified; nếu mở command phải có permission, guard, idempotency, backend tests. |
| `FIN-003` | Billing | Rà soát Rating Accept → Generate Invoice (flag dormant); tách preview có thật và bước write chưa được phép | `src/features/rates/api/rateRule.api.ts`, `src/features/invoices/components/PrimaryInvoiceForm.tsx` | BLOCKED/P2 | Rating preview vẫn xem được; accept/invoice chỉ hiển thị khi contract verified. |
| `EXEC-001` | Executive | Quyết định có đưa executive dashboard vào scope hay tiếp tục redirect `/dashboard` → `/operations` | `src/features/executive/config/executive.contract.ts`, `src/pages/dashboard/DashboardPage.tsx` | BLOCKED/P2 | Không đánh đồng executive components dormant với màn runtime; chỉ mở khi dữ liệu/quyền được xác nhận. |
| `I18N-001` | Locales | Bổ sung kiểm kê hard-code tiếng Việt/Anh trong Ops/Load/AI, tạo keys theo `i18next` | `src/locales/**`, `src/features/dashboard/**`, `src/features/loads/components/redesign/**` | P1 | Chuyển vi/en/ja không còn đoạn giao diện liên quan bị lẫn ngôn ngữ; fallback rõ. |
| `QA-008` | Regression | Kiểm tra request mock từ Vite dev proxy/fallback và fixture không bị tính là live success | `vite.config.ts`, `e2e/fixtures/**` | P0 | Test report thể hiện backend/fixture/demo rõ; mutation demo không được dùng làm bằng chứng business completed. |

### 3.10. Traceability — 8 UX Problems trong báo cáo §14

Bảng này nối **nguyên trạng ID từ báo cáo** sang mã task trong kế hoạch; không tự xác nhận đã sửa.

| Report ID | Mức nguồn | Chủ đề | Ticket xử lý | Status |
|---|---|---|---|---|
| `UX-01` | Cao | CTA vào route chưa đăng ký | `NAV-003`, `NAV-004`, `NAV-005`, `BASE-002` | `UI_SAFE_DONE` |
| `UX-02` | Cao | GAP Fill bị chặn, sai focus parameter | `NAV-001`, `NAV-002`, `LOAD-005`, `CORE-001` | `UI_SAFE_DONE`; core edit `BLOCKED` |
| `UX-03` | Cao | Operations mặc định pha API/static, fallback KPI | `OPS-001`, `OPS-002`, `OPS-003`, `OPS-008` | `UI_SAFE_DONE`; live integration `BLOCKED` |
| `UX-04` | Trung bình | Ops brief/map/timeline không có dữ liệu live | `OPS-004..006`, `OPS-008` | `UI_SAFE_DONE`; live API `BLOCKED` |
| `UX-05` | Trung bình | Free chat và test AI chỉ mô phỏng | `AI-001`, `AI-005`, `AI-007` | `UI_SAFE_DONE`; AI backend `BLOCKED` |
| `UX-06` | Trung bình | AI Dispatch alias ID/history không khôi phục | `NAV-011`, `AI-003`, `AI-006` | `BACKLOG` |
| `UX-07` | Trung bình | Sidebar icon-only, route/role discoverability | `SHELL-001`, `BASE-002` | `IN_REVIEW` |
| `UX-08` | Trung bình | Design tokens, typography, locale không đồng nhất | `DS-001..006`, `I18N-001` | `IN_REVIEW` (audit token xong; rollout còn lại) |

**Giới hạn:** Report đánh giá từ source/fixture; chưa có backend-live xác minh cho từng role/tenant. Không suy `gated` = backend không có chức năng.

### 3.11. Traceability — 13 Missing Features trong báo cáo §15

| # | Missing feature (đúng ngữ nghĩa runtime trong báo cáo) | Ticket tương ứng | Phụ thuộc quyết định | Mặc định |
|---|---|---|---|---|
| 01 | Full operational Map `UNROUTED` | `NAV-003`, `OPS-005` | Data/map route + permission | `BLOCKED` activation |
| 02 | Load board `UNROUTED` | `NAV-004` | Scope và route đích dispatch | `BLOCKED` activation |
| 03 | Accidents & mileage attribution `UNROUTED` | `NAV-005`, `FLT-001` | Registry + data/role | `BLOCKED` activation |
| 04 | Load/Trip/Truck edits `GATED` | `CORE-001`, `NAV-001..002` | Versioned writes runtime verification | `BLOCKED` |
| 05 | Document Upload `GATED` | `DOC-002` | Multipart/upload contract | `BLOCKED` |
| 06 | Payment mutations (read-only hiện tại) | `FIN-002` | Payment commands contract + auth | `BLOCKED` |
| 07 | Executive Dashboard `GATED/UNROUTED` | `EXEC-001` | Executive contract + data | `BLOCKED` |
| 08 | Operations live panels chưa có dataset | `OPS-008`, `OPS-001..006` | Dashboard endpoints | `BLOCKED` integration |
| 09 | AI GAP free chat/provider connection simulation | `AI-001`, `AI-005`, `AI-007` | AI backend endpoint/credential validation | `BLOCKED` real feature |
| 10 | AI Dispatch session detail/history incomplete | `AI-003`, `AI-006`, `NAV-011` | Session-by-ID contract | `BLOCKED` deep-link integration |
| 11 | Notification per-item read action chưa có trong UI | `NOT-002` | API mark-single-read + unread count | `BLOCKED` |
| 12 | Fleet utilization-history chart placeholder | `FLT-002` | Utilization-history API | `BLOCKED` |
| 13 | Rating accept / invoice generation gated | `FIN-003` | Billing contract/permission | `BLOCKED` |

> **Quy tắc nghiệm thu:** Với feature blocked, hoàn thành **UI-safe** (ẩn/disable CTA + trạng thái/giải thích) không đồng nghĩa hoàn thành capability/backend. Track hai outcome riêng `UI_SAFE_DONE` và `INTEGRATION_DONE`. Không đưa những feature chỉ có trong video (Inbox, Live Tracking, Auto-assign...) thành cam kết mới nếu yêu cầu dự án chưa xác nhận.

## 4. Sprint đề xuất (chỉ thứ tự, chưa gán thời lượng)

| Sprint | Công việc chọn | Deliverable | Gate |
|---|---|---|---|
| **0 — Triage** | `BASE-001..005`, kiểm chứng P0, xác định phạm vi và chủ sở hữu API | Issue register + screenshot baseline + dependency map | Các task P0 có tình trạng verified/blocked rõ. |
| **1 — Navigation safety** | `NAV-001..005`, `OPS-001..002`, `AI-001` | Fix/guard CTA và source labeling | Không 404 ngoài ý muốn/không có success giả. |
| **2 — Foundations** | `DS-001..005`, `NAV-006..008` | Theme + shared UX conventions | Visual regression và forms hiện có không lỗi. |
| **3 — Operations** | `OPS-003..007`, `NOT-001` nếu dependency sẵn | Operations Dashboard vNext | Demo/live/states rõ; responsive pass. |
| **4 — Load/Trip** | `LOAD-001..005`, `TRIP-001..002` | Load & Trip UX vNext | Create/detail/AI GAP/Trip flow kiểm chứng. |
| **5 — AI/Optimization** | `AI-002..005`, `OPT-001..002` | Decision UI vNext | Approval/conflict/history tests pass. |
| **6+ — Domain modules** | DOC/Fleet/Finance/Settlement/Payroll/Payslip theo giá trị và contract | Module UX upgrades | Regression domain + permission. |
| **Release gate** | `QA-001..007` tổng kết | QA report, known issues, release decision | Không còn blocker P0 chưa được chấp nhận rõ ràng. |

## 5. Phụ thuộc và quyết định phải chốt

| Quyết định | Tác động | Trạng thái |
|---|---|---|
| Brand primary giữ blue hay chuyển purple theo video? | DS tokens + toàn bộ màn | `OPEN` |
| Có quyền / API sửa core Load ở runtime không? | `NAV-001`, `NAV-002`, `LOAD-005` | `OPEN — BLOCKER` |
| `/map`, `/load-board`, mileage attribution có kế hoạch backend/route không? | `NAV-003..005`, `FLT-001` | `OPEN — BLOCKER` |
| API Dashboard có KPI/vehicles/drivers/brief thật không? | `OPS-001..006` | `OPEN — BLOCKER` |
| Có contract deep-link đối tượng cho AI plans/Trip/Notifications không? | `NAV-009..011`, `AI-003`, `NOT-001` | `OPEN` |
| Documents upload/filter server được chấp thuận chưa? | `DOC-001..003` | `OPEN — BLOCKER` |
| Scope redesign mong muốn: tương đồng visual hay thay đổi workflow? | Sprint 3–5 | `OPEN` |
| Vai trò/tenant/bộ dữ liệu nào để UAT? | Tất cả milestone | `OPEN` |

## 6. Quy tắc bắt buộc khi sửa code

1. **Trước mỗi task:** đọc source thực tế tại HEAD mới nhất; báo cáo là baseline, không thay cho audit tại thời điểm sửa. Kiểm tra `git status` và giữ nguyên thay đổi chưa commit của người khác.
2. **Không thêm route chỉ để giấu lỗi** khi backend/permission chưa sẵn. Sửa CTA bằng cách điều hướng đến luồng được phép, hoặc disable với lý do rõ.
3. **Không tự bật** các flags như `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED`, `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED`, `BILLING_COMMANDS_RUNTIME_VERIFIED`, `PAYMENT_COMMANDS_RUNTIME_VERIFIED`… khi chưa được phê duyệt contract.
4. **Không giả tính năng:** demo và fixture được gắn nhãn; `testAiConnection`, chatbot mô phỏng, Operations static phải nói đúng trạng thái.
5. **Không phá semantics:** giữ permission/JWT role matrix, Refine data provider, tenant-scoped query keys, các guard và idempotency/immutable history của Optimization, Settlement và Payroll.
6. **Tận dụng stack:** Ant Design 5, CSS/SCSS hiện có, Vitest, Playwright; không tự thêm component framework/map/motion library mới nếu không có lý do.
7. **Mỗi PR/change set nhỏ:** lý do → file sửa → ảnh trước/sau → test (bao gồm negative/error) → rollback note. Không gộp thay đổi nền tảng và toàn bộ redesign thành một patch.
8. **Nếu thiếu API:** chỉ làm UI states và nhãn tính năng khi được chấp thuận; không báo DONE cho workflow chưa kiểm chứng backend.

## 7. Definition of Ready (DoR)

- [ ] Task có ID, owner, mục đích người dùng, màn hình và route liên quan.
- [ ] Có evidence `SOURCE`/`FIXTURE`/`LIVE` cụ thể; ảnh trước/sau hoặc reproduction steps nếu phù hợp.
- [ ] Xác định rõ yêu cầu chỉ UX/visual hay có đổi contract/backend.
- [ ] Permission, feature flag và data mode được ghi nhận.
- [ ] Có acceptance criteria và test scenarios cho success/error/empty/disabled.
- [ ] Không còn blocker quan trọng, hoặc phần an toàn để thực hiện đã được tách riêng.

## 8. Definition of Done (DoD)

- [ ] Code lint/typecheck/test theo **scripts thực tế trong `package.json`** (không mặc định tên lệnh chưa kiểm tra).
- [ ] Có regression test phù hợp: unit/component và Playwright với fixture; live verification nếu task đòi hỏi backend.
- [ ] UI đúng design tokens được phê duyệt, có loading/empty/error và keyboard focus.
- [ ] Không có 404 từ CTA, không có success báo trước kết quả API, không có dữ liệu mock không nhãn.
- [ ] Kiểm tra ít nhất desktop, tablet và mobile cho màn có thay đổi.
- [ ] Không thay đổi bất ngờ auth/tenant/role/financial state machine; không phá các màn CRUD còn lại.
- [ ] Có ảnh/clip bằng chứng trước/sau và ghi các giới hạn chưa được live-test.
- [ ] Issue ID được cập nhật `DONE` **chỉ sau nghiệm thu**.

## 9. Kịch bản kiểm thử trọng yếu

| Test ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| `T-NAV-01` | Trong Load Detail, bấm GAP Fill khi quyền edit chưa được xác nhận | Không 404; nút ẩn/disabled có lý do hoặc chuyển đúng flow được phép. |
| `T-NAV-02` | Từ Operations, bấm Full Map, Dispatch, KPI link | Không đi vào URL unregistered; trạng thái và target chính xác. |
| `T-NAV-03` | Dùng Enter/Space/shortcut để mở Dashboard Search | Hoạt động như mô tả hoặc nhãn shortcut được bỏ; focus không mất. |
| `T-OPS-01` | Mở `/operations`, đổi sang `?demo=1` rồi trở lại | Mode/badge rõ; không hiển thị static như live. |
| `T-OPS-02` | API Dashboard timeout/error/empty | KPI/panel thể hiện trạng thái thật; không tự thay thành số liệu demo. |
| `T-LOAD-01` | Tạo Load hợp lệ và mở full detail | Form/API/redirect/detail cập nhật theo kết quả thực. |
| `T-LOAD-02` | Đổi tab Load Detail và Back | Header/Back không biến mất. |
| `T-AI-01` | Bấm Test connection AI / gửi chat khi backend không tích hợp | UI nêu đây là mô phỏng hoặc chặn, không thông báo kết nối thật. |
| `T-AI-02` | Approve/Reject plan khi lỗi hoặc network uncertain | Không nhân đôi lệnh; giữ trạng thái/input; hiển thị lỗi trung thực. |
| `T-OPT-01` | Optimization accept với conflict/stale evidence | Có feedback, hướng rerun, không ghi nhầm accepted. |
| `T-DOC-01` | Documents filter trên nhiều trang | Ghi rõ phạm vi lọc; khi được nâng cấp backend, kết quả toàn tập chuẩn. |
| `T-SEC-01` | User thiếu quyền ở route/button của Load, payroll, finance | Không lộ thao tác được quyền; backend 403 không bị coi thành empty. |

## 10. Intake cho các báo cáo tiếp theo

### 10.1. Quy trình cập nhật

1. Tiếp nhận báo cáo mới, ghi **tên tài liệu/ngày/HEAD hoặc môi trường**, phạm vi được quét và mức xác minh.
2. Trích xuất issue → đối chiếu theo `module + route + triệu chứng + root cause` để tránh nhân đôi.
3. Nếu issue trùng: bổ sung evidence mới vào task cũ; **không tự tăng độ tin cậy** nếu chỉ thêm suy đoán.
4. Nếu mâu thuẫn: đánh dấu `CONFLICTING_EVIDENCE`; chỉ giải quyết sau khi kiểm tra source/runtime mới.
5. Gán task mới hoặc thay đổi priority theo tác động người dùng và API dependency.
6. Cập nhật changelog, dependency map và sprint scope; đưa vào `READY` khi đủ DoR.

### 10.2. Issue template

```md
### [ISSUE-ID] Tiêu đề ngắn
- Module / route:
- Report / version / evidence: SOURCE | BROWSER-FIXTURE | BROWSER-LIVE | MOCK | GATED | UNROUTED | PROPOSAL
- Hiện trạng / reproduction:
- User impact:
- Root cause (đã xác minh / giả thuyết):
- File/component cần kiểm tra:
- Giải pháp UI/UX:
- Phụ thuộc API / permission / feature flag:
- Priority: P0 | P1 | P2 | BLOCKED
- Acceptance criteria:
- Test cases:
- Status: BACKLOG
```

### 10.3. Tình trạng tài liệu

| Tài liệu | Phạm vi | Trạng thái |
|---|---|---|
| `CURRENT_UI_UX_FLOW_ANALYSIS.md` | Bản nháp trước; §14–17 chưa hoàn thành | `SUPERSEDED / REFERENCE` |
| `CURRENT_UI_UX_FLOW_ANALYSIS(1).md` | Bản hoàn chỉnh 17 mục: có 8 UX problems, 13 missing features, 5 Mermaid flow và summary | `RECEIVED / INTEGRATED` |
| 2 video tham chiếu Logistics UI/UX | Bố cục/pattern giao diện mục tiêu | `REFERENCE ONLY` |
| Repo đang chạy + backend/session/UAT | Chưa được cung cấp để thực thi code và E2E live | `NOT PROVIDED / VERIFY BEFORE CODE` |

## 11. Changelog

| Version | Date | Notes |
|---|---|---|
| `v0.1` | 19/10/2026 | Khởi tạo master plan từ báo cáo hiện trạng đầu tiên và hai video tham chiếu. |
| `v1.0` | 19/10/2026 | Tích hợp đủ §14–17 báo cáo hoàn chỉnh; traceability 8 UX và 13 missing features; bổ sung 14 ticket, dependency, rollout, handoff, regression; **chưa chỉnh source code**. |

## 12. Hướng dẫn triển khai theo milestone (handoff cho developer / Claude Code)

> Đây là hướng dẫn làm việc trong **repo của người dùng**; không phải xác nhận rằng `plan.md` đã được chạy. Mỗi milestone tạo một change set riêng. Không cần GitHub; có thể dùng Git cục bộ và hệ thống quản lý mã nguồn sẵn có.

### 12.1. Milestone M0 — Verification & safety baseline

- **Inputs:** báo cáo đã tích hợp, repo hiện tại, quyền UAT, routes/feature flags.
- **Đọc trước:** `package.json`, `src/App.tsx`, `src/router/AppRouter.tsx`, `src/pages/resourceRegistry.ts`, `src/components/resources/resourceCapabilities.ts`, `src/components/AppSider.tsx`, `vite.config.ts`.
- **Làm:** kiểm tra status working tree, chụp UI fixture/live tách riêng, tạo route inventory theo role, phân loại `mock/live/gated/unrouted`, xác minh mâu thuẫn `ON/OFF` §4.3, tái hiện `UX-01..08`.
- **Output:** một `verification_matrix.md` hoặc PR note gồm từng route, CTA, owner, evidence, risk; screenshot baseline các viewport.
- **Gate:** không sửa business logic nếu chưa phân loại chính xác những đường write bị gate.

### 12.2. Milestone M1 — P0 route + data truth fixes

- **Scope:** `NAV-001..005`, `OPS-001..002`, `AI-001`, `BASE-006..007`, `QA-008`.
- **Thao tác:** map các CTA sang route hợp lệ; nếu route/permission/API chưa sẵn thì disable/ẩn với lý do; thống nhất tham số focus chỉ **sau khi** xác nhận editor; nguồn KPI phải có nhãn chính xác; chat/provider test không được giả kết quả production.
- **Negative tests bắt buộc:** route chưa đăng ký, user thiếu quyền, API lỗi/thiếu field, missing tenant, backend offline/dev proxy fallback.
- **Gate:** không còn P0 CTA được hiển thị mà đẩy người dùng tới 404; không có dữ liệu mẫu mang nhãn live.

### 12.3. Milestone M2 — Design system và shell

- **Scope:** `DS-001..006`, `I18N-001`, `SHELL-001`, `NAV-006..008`.
- **Thao tác:** đề xuất lựa chọn color-primary, mapping SCSS → CSS variables → Ant Design theme ConfigProvider; chuẩn hóa button/status/card/heading/focus/empty/error; giải quyết keyboard `⌘K`, sidebar tooltip và navigation back.
- **Gate:** snapshot các màn trọng yếu không bị thay đổi vô ý; vi/en/ja còn hoạt động; responsive và keyboard regression đạt.

### 12.4. Milestone M3 — Operations UI + honest data

- **Scope:** `OPS-003..008`, `DS-005`.
- **Thao tác:** hợp nhất presentation `PriorityShipmentCard`, bỏ fallback shipment tự phát sinh ở live, hoàn thiện loading/empty/error/last-updated cho map/timeline/brief, cải thiện density/layout theo video.
- **Gate:** dữ liệu demo có nhãn, live không chứa sample ẩn; không tự tạo realtime khi API chưa có.

### 12.5. Milestone M4 — Loads, Trips, AI & Optimization

- **Scope:** `LOAD-001..005`, `TRIP-001..002`, `NAV-009..011`, `AI-002..007`, `OPT-001..002`.
- **Thao tác:** chuẩn hóa form/detail/back/tab, state GAP, session errors/deep-link, compare/approval dialogs, state guards/caching; giữ nguyên stop transitions và immutable optimization outcome.
- **Gate:** source+fixture regression; backend-live verification cho mutation khi có quyền. `CORE-001` không được unblock nếu contract chưa xác nhận.

### 12.6. Milestone M5 — Documents, Notifications, Fleet, Finance

- **Scope:** `DOC-001..005`, `NOT-001..002`, `FLT-001..002`, `FIN-001..003`, `EXEC-001`, `SET-001`, `PAY-001..002`, `PSL-001`.
- **Thao tác:** sửa tương tác đọc dữ liệu trước; những feature mới/backend-dependent tách proposal; không thay settlement/payroll/finalized state máy.
- **Gate:** có riêng trạng thái `UI_SAFE_DONE` và `INTEGRATION_DONE` cho các feature GATED/UNROUTED.

### 12.7. Milestone M6 — Release/UAT

- **Scope:** `QA-001..008`, các issue còn mở; regression theo role/tenant/mode; security/error test.
- **Gate:** báo cáo kết quả chạy lệnh thực tế từ `package.json` (typecheck/test/build/e2e tùy scripts), screenshot, blocker list, rollback plan; không tự đánh DONE nếu chỉ chạy fixture.

## 13. Ưu tiên triển khai chi tiết và dependency order

| Thứ tự | Nhóm | Ticket | Có thể làm frontend an toàn ngay? | Cần backend/owner? | Done khi nào? |
|---|---|---|---|---|---|
| 1 | Baseline/truth | `BASE-001..007`, `QA-008` | Có (audit/docs/fixtures) | Cần UAT live để tăng độ tin cậy | Route/data matrix được kiểm chứng, phân loại source/fixture/live. |
| 2 | Đường đi P0 | `NAV-001..005` | Có phần guard/disable, route mapping hợp lệ | Có với core edits/map/board | Không có link hỏng; chưa tuyên bố edit/map live khi không có contract. |
| 3 | Demo/live | `OPS-001..003`, `OPS-008`, `AI-001` | Có để hiển thị trạng thái trung thực | Có với panel live/AI backend | Không có mock không nhãn; integration chỉ DONE sau UAT. |
| 4 | Visual consistency | `DS-001..006`, `SHELL-001`, `I18N-001` | Có sau chốt brand + UX | Design owner chốt tokens | Theme rollout không phá các phân hệ. |
| 5 | Main workflows | `LOAD-*`, `TRIP-*`, `AI-*`, `OPT-*` | Có với presentation/read-only | Có với write/deep-link API | Regression flow và permission ở từng module. |
| 6 | Module expansion | `DOC-*`, `NOT-*`, `FLT-*`, `FIN-*`, `EXEC-*` | Có với UI-safe | Có với tính năng còn GATED | State hợp lệ và mọi contract được verified. |
| 7 | Polish/release | `QA-*` | Có | Cần UAT/authenticated flow | Đủ DoD + QA report. |

**Phân nhóm kết quả:** `DOCUMENTED` = ticket/plan đã tạo; `UI_SAFE_DONE` = hành vi trước mắt đã an toàn; `INTEGRATION_DONE` = API/backend thật được xác nhận; `DONE` = đã nghiệm thu cả scope yêu cầu. Đừng đánh đồng bốn trạng thái này.

## 14. Các tiêu chí nghiệm thu quan trọng bổ sung từ báo cáo hoàn chỉnh

| Test ID | Given / when | Then / bằng chứng |
|---|---|---|
| `T-ROUTE-REG` | Bấm CTA từ Ops, Fleet và GAP trên mỗi role cho phép | Không 404 ngoài dự kiến; gated hiển thị lý do. |
| `T-CORE-EDIT` | `/loads/edit/:id` disabled và khi contract được xác minh | Disabled không có link giả; enabled giữ `focusField` và xử lý conflict đúng. |
| `T-OPS-FALLBACK` | Report API trả HTTP 200 nhưng thiếu field OTD/delay/exception | Hiển thị `unavailable`/source hợp lệ, **không** tự gán 94/3/2 thành số thật. |
| `T-OPS-LIVE` | Ops default không có vehicles/brief/drivers | Map/timeline/brief thể hiện thiếu dữ liệu; sample shipment không xuất hiện vô nhãn. |
| `T-AI-SIM` | Bấm test provider hoặc gửi chat tự do khi không có backend thật | Có nhãn mô phỏng hoặc UI disabled; không trả success “đã kiểm tra kết nối thực”. |
| `T-AI-DEEP` | Mở `/ai-dispatch/:id`, F5, quay lại | Truy xuất đúng ID khi API hỗ trợ hoặc báo hạn chế rõ; lỗi GET có retry. |
| `T-SHELL-ROLE` | Đăng nhập hai role với capability khác nhau | Sidebar hiển thị đúng mục được phép; tooltip/focus không phụ thuộc fixture `can=true` toàn bộ. |
| `T-LOCALE` | Đổi vi/en/ja ở dashboard/load/AI | Không còn label cứng ở vùng đã sửa; fallback rõ ràng. |
| `T-DOC-DL` | Tải file trong session chỉ dùng bearer và trường hợp 401/403 | Không hiển thị success giả; có xử lý lỗi; sau success file hợp lệ. |
| `T-DOC-DEL` | Delete từ inspector thất bại hoặc thành công | Fail giữ inspector, success mới đóng + refresh; không stale selection. |
| `T-NOT-SINGLE` | Backend chưa có mark-read từng thông báo | Không hiển thị hành động đánh dấu từng mục có vẻ hoạt động được. |
| `T-FLT-GANTT` | Fleet chỉ có health snapshot, chưa có history | Không dựng Gantt có vẻ dữ liệu thật; hiển thị unavailable/placeholder có nhãn. |
| `T-REG-FIN` | Test financial/payroll/optimization ở conflict/uncertain request | Giữ guard, frozen idempotency keys, audit và trạng thái bất biến. |

## 15. Rủi ro, quy tắc rollback và tình trạng hoàn thành

| Risk | Tác động | Biện pháp |
|---|---|---|
| Đổi theme trên toàn AntD cùng lúc | Nhiều màn CRUD, modal, table bị thay style ngoài ý muốn | Rollout token theo module, screenshot baseline & visual test từng vùng. |
| Thấy UI `success` dưới Vite proxy fallback | Tưởng backend thật đã xử lý | Ghi data mode trong test; tắt/kiểm chứng proxy theo môi trường; test live có auth. |
| Bật GATED sớm | Phá contract versioned write, billing/payment hoặc permission | Giữ cờ khóa, tách UI-safe task và feature enablement có approval. |
| Refactor query keys không xét tenant | Cache cũ hiện sai tenant hoặc không invalidate | Test multitenant và invalidate theo query key thực tế. |
| Cải tiến approval dialog làm mất replay semantics | Double submit/nhầm kết quả thanh toán/tối ưu | Giữ frozen command/idempotency, kiểm thử error/timeout/conflict. |
| Thêm map module `UNROUTED` vội | Không có GPS và dữ liệu xe dẫn đến giao diện giả | Chỉ làm khi có API/role/scope, trước đó CTA phải an toàn. |
| Sao chép hình video nguyên xi | UX không khớp nghiệp vụ và responsive | Chỉ tham khảo cấu trúc/visual hierarchy; bám report+requirements thực. |

**Rollback:** mỗi nhóm sửa có ảnh baseline + file touched + kiểm thử liên quan; nếu regression, revert change set riêng chứ không sửa chồng lên workflow đang chạy. Không xóa thay đổi local chưa commit khi không được phép.

### 15.1. Trạng thái tại thời điểm bàn giao kế hoạch

- [x] Nhận bản báo cáo mới có đủ 17 mục.
- [x] Đọc và tích hợp §14 (8 UX problems), §15 (13 missing features), §16 (5 Mermaid flow), §17 (summary).
- [x] Ánh xạ các phát hiện vào Backlog S0–S7 và thêm ticket còn thiếu; phân biệt `GATED`, `UNROUTED`, `MOCK/STATIC`, `SOURCE`.
- [x] Lập thứ tự milestone, phụ thuộc, tiêu chí nghiệm thu, handoff cho người triển khai.
- [ ] Xác minh source tại HEAD thực tế và session backend-live (chưa có repo/session cung cấp trong lần lập plan).
- [ ] Chốt brand color, scope redesign, owner và contract API.
- [ ] Thực hiện sửa source UI/UX.
- [ ] Chạy Vitest/Playwright/live UAT trên ứng dụng đã sửa.
- [ ] Nghiệm thu và đánh dấu task `DONE` theo Definition of Done.

---

## 16. Trạng thái triển khai thực tế — 19/10/2026

Plan có **76 ticket triển khai**; 8 mã `UX-01..UX-08` là nhãn traceability, không tính thành ticket riêng. Build, lint và toàn bộ Vitest đã chạy trong phiên này. Chi tiết files/tests/blocker/next step nằm trong [`docs/UI_UX_IMPLEMENTATION_PROGRESS.md`](docs/UI_UX_IMPLEMENTATION_PROGRESS.md).

| Milestone | Task ID | Trạng thái | Bằng chứng / blocker |
|---|---|---|---|
| M0 | `BASE-001..003`, `BASE-007` | `DONE` | Git/source/scripts/routes/data modes và UX/gap inventory được ghi tại `docs/ux/sprint0-triage.md`; cây bẩn ban đầu được giữ nguyên. |
| M0 | `BASE-004..005` | `BLOCKED` | Thiếu hai video và fixture/authenticated session cho AI/Optimization; live backend/tenant chưa được cung cấp. Ảnh fixture hiện có được phân loại riêng. |
| M0 | `BASE-006` | `IN_REVIEW` | Route/capability được đối chiếu source; role + tenant runtime cần UAT. |
| M1 | `NAV-001..006` | `UI_SAFE_DONE` | GAP Fill bị khóa có giải thích, focus query thống nhất; route chưa mount không còn CTA gây 404; dashboard search dùng indexed Refine filter. |
| M1 | `NAV-007..008` | `DONE` | Search trigger dùng button/keyboard shortcut; Load header/back giữ nguyên khi đổi tab; test component đã pass. |
| M1 | `NAV-009..011` | `BACKLOG` | Cần `tripId`, notification target hoặc API session-by-ID để hoàn thiện chính xác. |
| M1 | `CORE-001` | `BLOCKED` | `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false`; không bật flag. |
| M2 | `DS-001` | `DONE` | Bảng token hiện tại đã có trong `docs/ux/sprint0-triage.md`; không đổi brand primary. |
| M2 | `DS-002` | `BLOCKED` | Cần Product Owner chốt brand primary trước khi inject AntD theme toàn cục. |
| M2 | `DS-003..006`, `I18N-001` | `BACKLOG` | Chưa rollout typography/tokens hoặc kiểm kê locale toàn app. |
| M2 | `SHELL-001` | `IN_REVIEW` | Route menu không còn khai báo mục unsupported; còn nghiệm thu role, keyboard và screenshot. |
| M3 | `OPS-001..006` | `UI_SAFE_DONE` | Preview/live rõ ràng, KPI thiếu hiển thị unavailable, không dùng shipment mẫu làm live; brief/map/timeline có empty/disabled states. |
| M3 | `OPS-007` | `IN_REVIEW` | Fixture có 1440/1024/768/390; chưa xác minh 320px và live breakpoints đầy đủ. |
| M3 | `OPS-008` | `BLOCKED` | Thiếu backend contract/dataset cho brief, telemetry, vehicles, routes, drivers. |
| M4 | `LOAD-003`, `LOAD-005` | `UI_SAFE_DONE` | Header Load giữ ổn định; GAP Fill không điều hướng vào editor bị khóa. Không xác nhận core write integration. |
| M4 | `LOAD-001..002`, `LOAD-004`, `TRIP-001..002` | `BACKLOG` | Chưa đủ kiểm tra/triển khai riêng cho các flow còn lại. |
| M4 | `AI-001` | `UI_SAFE_DONE` | Connection test và chat mô phỏng được nói rõ/không báo success live. |
| M4 | `AI-002..007`, `OPT-001..002` | `BACKLOG` | Deep-link/history và command UI cần contract/acceptance riêng; chưa thay approval semantics. |
| M5 | `DOC-002`, `NOT-002`, `FLT-002`, `FIN-002..003`, `EXEC-001` | `BLOCKED` | Thiếu upload/notification/history/billing/payment/executive contract hoặc quyết định scope; flags vẫn khóa. |
| M5 | `DOC-001`, `DOC-003..005`, `NOT-001`, `FLT-001`, `FIN-001`, `SET-001`, `PAY-001..002`, `PSL-001` | `BACKLOG` | Chưa triển khai; tiếp tục giữ nguyên financial/settlement/payroll state machine. |
| M6 | `QA-006` | `UI_SAFE_DONE` | Build/lint/full Vitest và Playwright dashboard fixture chạy thành công; không phải live UAT. |
| M6 | `QA-008` | `IN_REVIEW` | Data mode đã được kiểm kê; còn xác minh sâu proxy/fallback trên môi trường runtime. |
| M6 | `QA-001..005`, `QA-007` | `BACKLOG` | Chưa hoàn thành đủ viewport 320px, accessibility/contrast/reduced-motion và provenance gate toàn app. |

**Tổng trạng thái:** `DONE` 7; `UI_SAFE_DONE` 16; `BLOCKED` 11; `IN_REVIEW` 4; `BACKLOG` 38. Chưa có ticket nào `INTEGRATION_DONE`.
