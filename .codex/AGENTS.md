# LogisticsX — AGENTS.md

**v3.0 · Senior Edition · Performance First · No Git mặc định**

Áp dụng cho Admin Portal, TMS Portal, Customer Portal và frontend dùng chung. Mục tiêu: **đúng nghiệp vụ + an toàn đa tenant + giao diện rõ ràng + phản hồi nhanh trên dữ liệu lớn**.

Đây là bộ quy tắc điều khiển AI Agent, **không phải bằng chứng** ứng dụng đã được tối ưu. Mọi con số trong file là *mục tiêu*, không phải *kết quả đã đạt*.

---

## 0. Cách đọc file này

- **Thứ tự ưu tiên khi xung đột:** đúng dữ liệu & tiền > an toàn tenant > đúng luồng nghiệp vụ > giao diện rõ, nhất quán > phản hồi nhanh > dễ bảo trì > tối ưu vi mô.
- Yêu cầu trực tiếp của người dùng trong phiên thắng file này, **trừ khi** vi phạm Mục 2. Khi đó nêu rủi ro và hỏi lại, không tự làm.
- Không chắc → đọc code hoặc hỏi. **Không đoán** route, API, field, quyền, tên script.
- Tài liệu chuyên sâu chỉ nạp khi cần, không nạp mọi task:
  - `docs/PERFORMANCE_PLAYBOOK.md`: danh sách lớn, thuật toán gán/tuyến, render chậm, bundle, cache, benchmark.
  - Plan/progress UI-UX của dự án (vd. `docs/UI_UX_IMPLEMENTATION_PROGRESS.md`) nếu task thuộc kế hoạch đó.

---

## 1. Stack và phạm vi (xác minh phiên bản trong `package.json` trước khi dùng API)

- React 18 + TypeScript + Vite; Refine, Ant Design 5, React Router v6.
- TanStack Query / Refine query hooks; Zustand khi cần; Axios + DataProvider/adapter hiện có.
- SCSS + CSS variables; thư viện bản đồ **đang có trong dự án** (Mapbox / MapLibre / Leaflet: không tự đổi); Recharts; dayjs; Decimal.js khi liên quan tiền.
- Vitest, Testing Library, Playwright **chỉ khi** repo có cấu hình/script tương ứng.
- Tên API của Refine **khác nhau giữa v4 và v5** (vd. `tableQueryResult` vs `tableQuery`): đối chiếu phiên bản thật trước khi viết.

---

## 2. Quy tắc bất khả xâm phạm

1. **Git:** không dùng Git/GitHub mặc định. Không chạy `git status/diff/log/branch`, không đọc `.git`, không commit/push/reset/stash/PR. Chỉ làm đúng thao tác Git khi người dùng yêu cầu trực tiếp. Thiếu Git không phải blocker.
2. **Phạm vi:** đọc đúng phạm vi, sửa tối thiểu. Kiểm tra file thật, route, hooks, API, types, `package.json`. Không suy đoán tính năng từ tên file/tài liệu/video. Không refactor toàn repo.
3. **Không phá nghiệp vụ để lấy hiệu năng hoặc đẹp.** Bảo toàn multi-tenant, permission, auth, API contract, idempotency, audit, hóa đơn, thanh toán, quyết toán, payroll, state machine.
4. **Không che lỗi, không ngụy tạo dữ liệu.** Không bịa KPI/GPS/ETA/điểm AI; không lẫn dữ liệu tenant; không dùng 403 làm empty state; không toast thành công trước khi backend trả outcome; không bỏ validation/test để tăng tốc.
5. **Không mock trong code production.** Mock/dummy/localStorage không phải nguồn sự thật nghiệp vụ. Mock chỉ nằm trong test.
6. **Đo trước → tìm nguyên nhân → sửa → đo lại.** Không nói “nhanh hơn” chỉ vì dùng `useMemo`, `Map`, Worker hay Big-O thấp hơn. Chưa đo được → ghi `NOT MEASURED`.
7. **Không tự thêm** thư viện, skill, plugin, MCP; không đổi bundler; không nâng major version; không bật React Compiler, trừ khi được duyệt.
8. **Locale:** nội dung UI mặc định tiếng Việt. Không bắt Agent đồng bộ vi/en/ja và không đưa locale vào checklist mọi task. Nếu code đang dùng i18next thì giữ tương thích, không tự xóa hệ thống i18n.
9. **Lưu trữ phía client:** không lưu token nhạy cảm, payment/payroll/assignment state quan trọng vào `localStorage`. Vẫn dùng local UI state cho form, tab, selection, bộ lọc.
10. **Không tự đổi** schema, transaction, auth, pricing, quy tắc tài chính.
11. **Không báo PASS cho thứ chưa chạy.** Ghi rõ `PASS / FAIL / NOT RUN`.

**Dừng và hỏi** khi: đổi API contract, schema, phân quyền, công thức tiền; xóa/ghi đè dữ liệu; mở feature flag; cần cài thư viện; yêu cầu mâu thuẫn với Mục 2.

---

## 3. Lệnh và kiểm chứng

Đọc `package.json` → `scripts` thực tế. **Không bịa script.**

| Việc | Cách xác định | Khi nào chạy |
|---|---|---|
| Typecheck | script có sẵn (`tsc --noEmit` hoặc tương đương) | Mọi thay đổi TS |
| Lint | script `lint` nếu có | Mọi thay đổi |
| Unit test | Vitest, chỉ file/thư mục liên quan | Thay đổi logic, util, hook |
| E2E | Playwright, chỉ khi có config | Luồng nghiệp vụ nhiều bước |
| Build | `vite build` | Thay đổi rộng / trước bàn giao |
| Đo hiệu năng | `vite build` + `vite preview` | Tuyên bố cải thiện. **Không kết luận từ dev mode** |

- Task nhỏ: chạy **focused validation** trước. Full build/test khi thay đổi rộng hoặc chuẩn bị bàn giao.
- Task đụng thuật toán/khối lượng dữ liệu: có test tính đúng, edge case, dữ liệu rỗng, 10k bản ghi (khi khả thi), cancel, tenant switch.

---

## 4. Cấu trúc và quy ước code

- **Tổ chức theo loại file ở thư mục global** (`components/`, `hooks/`, `utils/`, `types/`, …). Không tạo feature-folder lồng nhiều cấp. Đọc cây thư mục thực tế trước khi tạo file mới.
- Hàm dùng lại từ 2 nơi trở lên → `utils/` global (định dạng tiền/ngày, `statusMap`, …). Component dùng lại → `components/` global. Không copy-paste.
- TypeScript strict: không thêm `any` mới (dùng `unknown` + thu hẹp kiểu); `@ts-ignore` phải có comment lý do.
- Một component một trách nhiệm. File >300 dòng hoặc hàm >50 dòng / lồng >3 cấp → cân nhắc tách.
- Comment giải thích **vì sao**, không lặp lại **cái gì**. Không để `console.log`, code chết, TODO không rõ chủ.
- Giữ tên, kiểu import, cách đặt file nhất quán với thư mục lân cận.

---

## 5. Quy trình cho mọi task

1. **Xác định phạm vi:** portal, route, tenant/role, API, dữ liệu vào, bước nghiệp vụ, acceptance criteria.
2. **Đọc có mục tiêu:** tìm theo symbol/route trước; đọc đoạn liên quan; không đọc lặp một file.
3. **Xác định bottleneck:** `NETWORK | CPU | RENDER | DOM | MEMORY | BUNDLE | UX | UNKNOWN`. Thu thập bằng chứng khi có công cụ.
4. **Chọn thiết kế:** ước lượng n, tần suất chạy, Time/Space, trade-off, cache invalidation. Ưu tiên phương án dễ kiểm chứng.
5. **Sửa tối thiểu:** giữ API/permission; tái dùng component và token có sẵn trước khi tạo mới.
6. **Kiểm thử có trọng tâm** (Mục 3).
7. **Bàn giao** theo mẫu Mục 11. Task thuộc plan UI/UX → đánh dấu hoàn thành ngay trong plan/progress doc (nếu tồn tại).

**Quy mô task:**
- *Nhỏ* (≤3 file, không đổi contract): làm thẳng.
- *Vừa* (nhiều file trong một route): nêu kế hoạch 3–5 dòng rồi làm.
- *Lớn* (nhiều route, thuật toán, tiền, auth): viết plan, chia bước nhỏ có thể kiểm chứng, không làm một mạch.

---

## 6. Tối ưu giao diện

### 6.1 Nguyên tắc

1. **Rõ ràng trước, đẹp sau.** Người điều phối nhìn là hiểu: trạng thái, việc cần làm, bước kế tiếp.
2. **Giảm tải nhận thức:** ít thứ trên màn hình cùng lúc; nhóm theo ý nghĩa; thông tin quan trọng nhất ở vị trí đầu tiên.
3. **Nhất quán hơn sáng tạo.** Cùng khái niệm → cùng component, cùng màu, cùng tên gọi, trên mọi portal. Dùng Ant Design 5 và token chung; không tự thêm kiểu mới.
4. **Một điểm nhấn mỗi màn hình** (thường là nút hành động chính). Cắt trang trí không phục vụ nội dung: gradient, bóng đổ lạ, animation không mang thông tin.
5. **Giao diện nhanh là một phần của giao diện đẹp.** Mọi thay đổi UI vẫn phải qua checklist hiệu năng ở 6.9.

### 6.2 Design tokens (một nguồn duy nhất)

- Màu, cỡ chữ, bo góc, khoảng cách khai báo **một chỗ**: `ConfigProvider theme` (token + `components`) và CSS variables cho phần ngoài Ant Design. **Cấm hard-code hex/px** trong page.
- Thang khoảng cách 4/8px; tối đa 2 mức `borderRadius`; thang chữ cố định (tiêu đề trang, tiêu đề section, body, caption).
- Màu ngữ nghĩa: primary / success / warning / error / info. Màu trạng thái nghiệp vụ (Load, Trip, Invoice, Payment…) nằm trong **một `statusMap` dùng chung**; không tự chọn màu trong từng bảng.
- Màu không phải tín hiệu duy nhất: trạng thái luôn có chữ trong `Tag`. Tương phản chữ/nền ≥ 4.5:1.
- Chữ số tiền/số lượng dùng `font-variant-numeric: tabular-nums`, căn phải.

```tsx
// Ví dụ hình dạng, xác minh tên token theo phiên bản Ant Design đang cài
<ConfigProvider
  theme={{
    token: { colorPrimary: tokens.primary, borderRadius: tokens.radius, fontSize: 14 },
    components: { Table: { cellPaddingBlock: 8 }, Form: { itemMarginBottom: 16 } },
  }}
>
```

### 6.3 Mẫu màn hình

| Loại | Cấu trúc bắt buộc |
|---|---|
| **List** | Tiêu đề + 1 nút chính → thanh lọc (≤4 bộ lọc hiển thị, phần còn lại trong “Bộ lọc nâng cao”) → bảng → phân trang server. Thanh thao tác hàng loạt chỉ hiện khi có chọn dòng. **Lọc/sắp xếp/trang đồng bộ lên URL** (back/forward và chia sẻ link hoạt động). |
| **Form (Create/Edit)** | Chia section theo nghĩa; nhãn trên ô nhập; lưới 2 cột ở desktop, 1 cột ở mobile; thanh hành động dính đáy (`Hủy` / `Lưu`). Chi tiết ở 6.6. |
| **Detail (Show)** | Header: mã + `Tag` trạng thái + hành động chính. Thân: `Descriptions` theo section. Dữ liệu phụ (lịch sử, tài liệu, thanh toán) trong `Tabs`, **chỉ tải khi mở tab**. |
| **Dashboard** | 4–6 KPI trên cùng, biểu đồ bên dưới. Mỗi widget có query, skeleton, error boundary riêng; widget lỗi không làm sập cả trang. Chưa có dữ liệu → “Chưa có dữ liệu”, **không** điền số giả. |
| **Bản đồ** | Tải lazy; giới hạn marker, gom cụm theo zoom khi có thật; danh sách bên cạnh đồng bộ với bản đồ; dọn layer/listener khi unmount. |

- **Drawer** cho tạo/sửa nhanh (<8 trường). **Trang riêng** cho form phức tạp. **Modal** chỉ để xác nhận ngắn. Không lồng modal trong modal.

### 6.4 Năm trạng thái bắt buộc

Mọi màn hình dữ liệu phải xử lý đủ:

1. **Loading:** skeleton **đúng hình dạng** nội dung; `Spin` chỉ cho thao tác cục bộ. Không dùng spinner toàn trang cho lần tải đầu.
2. **Empty:** nói rõ vì sao trống và gợi ý hành động (“Chưa có chuyến nào. Tạo chuyến đầu tiên”). Phân biệt “chưa có dữ liệu” với “bộ lọc không khớp” (kèm nút xóa bộ lọc).
3. **Error:** nói chuyện gì xảy ra và cách xử lý, có nút thử lại; **giữ nguyên dữ liệu người dùng đã nhập**.
4. **403:** thông báo thiếu quyền. **Không** hiển thị như danh sách rỗng.
5. **Blocked / feature-gated:** nói rõ vì sao chưa dùng được. Không hiển thị nút dẫn tới API chưa sẵn sàng.

### 6.5 Bảng dữ liệu

- Phân trang/lọc/sắp xếp **phía server** cho tập lớn. Page size mặc định 20 hoặc 50.
- `rowKey` ổn định (ID thật). **Định nghĩa `columns` ngoài component hoặc `useMemo`.** Không tạo component mới trong `render` của cột.
- Mặc định hiện **≤7–8 cột**; cột phụ cho phép bật/tắt. Cột đầu và cột thao tác `fixed`, kèm `scroll.x`.
- Số căn phải, chữ căn trái. Chuỗi dài: `ellipsis` + `Tooltip`. Trạng thái dùng `Tag` từ `statusMap`.
- Thao tác từng dòng: tối đa 2 nút hiện sẵn + menu “Thêm”.
- Không nhét thứ nặng vào ô: biểu đồ, bản đồ, ảnh lớn.
- >200 dòng hiển thị cùng lúc: virtualization (`Table virtual` của Ant Design 5, **xác minh phiên bản**; yêu cầu `scroll.x/y` dạng số) và phải giữ sticky header, chọn dòng, focus, a11y.
- Mật độ: `size="small"` hoặc `middle` cho màn hình vận hành dày dữ liệu; nhất quán trong cùng portal.

### 6.6 Form

**Bố cục (form nhiều trường phải gọn, dễ đọc):**
- Nhóm trường theo ý nghĩa, mỗi nhóm một `Card`/section có tiêu đề (ví dụ: *Thông tin chung → Địa chỉ → Tài chính*). Không dồn một danh sách phẳng 20 ô.
- Trường bắt buộc đánh dấu rõ; trường tùy chọn/hiếm dùng gom vào “Thông tin bổ sung” (`Collapse`, mặc định đóng).
- >12 trường: thêm `Anchor` hoặc `Tabs`/`Steps` theo luồng nghiệp vụ thật (chỉ dùng `Steps` khi dữ liệu thật sự tuần tự).
- `Form.Item` có `extra`/`tooltip` cho trường dễ nhầm; ô nhập có đơn vị (kg, km, VND/USD) hiển thị rõ.

**Hành vi:**
- Validate khi blur, `scrollToFirstError`. Thông báo lỗi chỉ cách sửa.
- Khi gửi: khóa nút + trạng thái loading, chống double-submit; **toast thành công chỉ sau khi backend xác nhận**.
- Cảnh báo khi rời trang có thay đổi chưa lưu.
- Dùng schema validation đã có trong dự án; không thêm thư viện mới.

**Hiệu năng form:**
- Dùng `Form.useWatch(['field'])` **hẹp**; không `useWatch` cả form. `shouldUpdate`/`dependencies` chỉ ở `Form.Item` thật sự phụ thuộc.
- Form lớn: tách mỗi section thành component riêng.
- `Select` dữ liệu lớn (khách hàng, xe, tài xế): **tìm kiếm từ server**, `filterOption={false}`, debounce 250–400ms, giới hạn 20–50 kết quả/trang. Không tải toàn bộ master data về client.
- Giá trị khởi tạo lấy từ query, **không copy sang state thứ hai**.
- `Form.List` lớn (>50 dòng): chuyển sang bảng chỉnh sửa có phân trang/virtual.

### 6.7 Nội dung chữ (microcopy) và định dạng

- **Nút nói đúng việc sẽ xảy ra:** “Lưu thay đổi”, “Tạo chuyến”, “Duyệt chi”, không “OK/Submit”. Cùng hành động giữ cùng tên xuyên suốt: nút “Duyệt” → toast “Đã duyệt” (sau khi backend xác nhận).
- Lỗi: nêu nguyên nhân + cách sửa, không xin lỗi chung chung, không để “Đã có lỗi xảy ra”.
- Viết hoa kiểu câu (sentence case), động từ chủ động, không thừa chữ.
- **Một khái niệm = một cách gọi.** Thuật ngữ nghiệp vụ lấy từ màn hình/tài liệu đã có; không tự đặt tên mới.
- **Tiền:** định dạng theo trường `currency` của bản ghi (không hard-code VND), bằng `Intl.NumberFormat`; tính toán bằng Decimal, không float.
- **Ngày giờ:** dùng dayjs; hiển thị theo định dạng Việt (DD/MM/YYYY, 24 giờ); lưu và truyền theo chuẩn backend; không tự quy đổi múi giờ nếu backend chưa quy định.

### 6.8 Responsive và khả năng truy cập

- Xác định viewport mục tiêu của từng portal; tối thiểu kiểm tra **1440 / 1024 / 768 / 390**. Breakpoint dùng của Ant Design (`xs/sm/md/lg/xl/xxl`), không tự đặt số mới.
- Nội dung rộng (bảng, mã, sơ đồ) cuộn trong container riêng; trang không cuộn ngang.
- Bàn phím: thứ tự Tab hợp lý, focus hiển thị rõ, `Esc` đóng modal/drawer, `Enter` gửi form hợp lệ.
- Nút chỉ có icon phải có `aria-label` + `Tooltip`. Mỗi ô nhập có nhãn.
- Tôn trọng `prefers-reduced-motion`. Chuyển động chỉ để cho thấy điều gì vừa thay đổi (mở, thu gọn, xác nhận).

### 6.9 Hiệu năng giao diện (INP / LCP / CLS)

**Mục tiêu p75 (khi đo được):** INP ≤ 200ms · LCP ≤ 2.5s · CLS ≤ 0.1. Đây là mục tiêu, không phải kết quả.

**Tải nhanh (LCP, bundle):**
- Code-split theo route bằng `React.lazy` + `Suspense`. Thư viện nặng (biểu đồ, bản đồ, trình soạn thảo) tải lazy, chỉ khi widget hiển thị.
- Icon: import theo tên từ `@ant-design/icons`; cấm `import * as Icons`.
- Không thêm moment/lodash nguyên khối; dùng dayjs, import hàm lẻ.
- Chỉ tách chunk thủ công (`manualChunks`) **sau khi đo bundle**, với công cụ đã có sẵn trong repo.
- Ảnh: khai báo kích thước hoặc `aspect-ratio`; `loading="lazy"` cho ảnh ngoài màn hình đầu; không nhúng base64 lớn.
- Font: tối đa 2 họ, 3–4 độ đậm; `font-display: swap`; **phải có subset tiếng Việt** (latin + vietnamese). Preload font quan trọng nhất.
- Prefetch dữ liệu khi hover liên kết (`prefetchQuery` với query key có tenant, `staleTime` hợp lý) chỉ cho route hay dùng.

**Không giật layout (CLS):**
- Chừa chỗ cho skeleton/bảng (`min-height`); không chèn banner làm đẩy nội dung.
- `scrollbar-gutter: stable` ở vùng cuộn chính.
- Không đổi kích thước phần tử khi dữ liệu tải xong.

**Phản hồi nhanh (INP):**
- Ô tìm kiếm: state nhập giữ **cục bộ**; chỉ đẩy lên query sau debounce 250–400ms. Không để mỗi phím re-render cả bảng.
- Cập nhật hiển thị không khẩn: `useDeferredValue` / `useTransition` (không dùng để giả loading API).
- Không tính toán nặng trong JSX hay trong handler; tính nặng → backend hoặc Web Worker (có cancel, timeout).
- Animation chỉ dùng `transform`/`opacity`. Không animation trên hàng bảng; không hiệu ứng làm tăng INP. Màn hình dày dữ liệu có thể tắt motion của Ant Design.
- Giữ state sát nơi dùng; tách context; Zustand dùng selector. Không copy dữ liệu query sang state; không `useEffect` cho dữ liệu suy diễn.
- Dọn dẹp listener, observer, timer, layer bản đồ khi unmount.
- `useMemo` / `useCallback` / `React.memo` **chỉ khi** profiling chứng minh hoặc cần ổn định identity. Tuân Rules of Hooks và StrictMode.

**Cách đo UI:**
- Build production (`vite build` + `vite preview`), không đo ở dev mode.
- React Profiler (số lần render, thời gian commit); Chrome Performance với CPU throttle 4×; Lighthouse cho LCP/CLS/TBT.
- Cùng máy, viewport, dữ liệu; ≥3 lần; so median/percentile. Dữ liệu: nhỏ (100), vừa (1.000), lớn (10.000+ nếu hệ thống hỗ trợ). Không ép tải 10.000 bản ghi về client chỉ để benchmark.
- Không đo được → `NOT MEASURED` + kế hoạch đo.

### 6.10 Checklist giao diện trước khi bàn giao

- [ ] Dùng component và token chung; không hard-code màu/px.
- [ ] Đủ 5 trạng thái: loading, empty, error, 403, blocked.
- [ ] Form: nhóm section, `scrollToFirstError`, chống double-submit, toast sau outcome backend.
- [ ] Bảng: server pagination/lọc/sắp xếp; `columns` ổn định; ≤8 cột mặc định.
- [ ] Bộ lọc/trang đồng bộ URL (màn hình danh sách).
- [ ] Nút/lỗi/empty viết rõ việc, rõ cách xử lý; thuật ngữ nhất quán.
- [ ] Tiền, ngày định dạng đúng; tiền không dùng float.
- [ ] Kiểm tra 1440 / 1024 / 768 / 390; bàn phím và focus hoạt động.
- [ ] Route/thư viện nặng đã lazy; không import cả bộ icon.
- [ ] Không có layout shift khi dữ liệu tải xong.
- [ ] Số liệu hiệu năng: có đo hoặc ghi `NOT MEASURED`.

---

## 7. Hiệu năng logic, thuật toán, network

### 7.1 Chọn độ phức tạp

Ưu tiên **loại bỏ việc không cần làm** trước khi dùng thuật toán phức tạp: giảm request, giảm dữ liệu, giảm DOM, giảm render, giảm vòng lặp. Sau đó mới memo/cache/index/worker (khi có căn cứ).

| Tình huống | Không làm | Ưu tiên và điều kiện |
|---|---|---|
| Ghép đơn ↔ tài xế/xe/trip theo ID | `find` lặp trong `map`: O(n·m) | `Map<ID, Entity>` dựng một lần: O(n+m) thời gian, O(m) bộ nhớ |
| Kiểm tra thành viên nhiều lần | `includes` trong vòng lặp | `Set.has`, tạo O(n) |
| Sắp xếp/lọc khi gõ hoặc render | `sort()`/`filter()` lặp toàn danh sách | Chỉ tính lại khi dữ liệu/thứ tự đổi; tập lớn → sort/filter/paginate phía server |
| Top-k đơn/tải ưu tiên | Sort toàn bộ chỉ để lấy vài phần tử | k ≪ n: heap O(n log k); dữ liệu ít thì `sort` thường dễ bảo trì hơn |
| Tìm ID trong tập đã sắp | Quét toàn bộ mỗi lần | Binary search nếu thật sự sorted; nhiều truy vấn ID → map |
| Duyệt quan hệ/tuyến xe | Lồng vòng lặp không giới hạn | Graph + adjacency list; Dijkstra/A* khi phù hợp; giới hạn node/edge/thời gian |
| Tối ưu gán xe/tuyến nhiều điểm | Brute force O(n!), subset O(2ⁿ) trên UI | Heuristic có giới hạn vòng lặp, hoặc chạy ở backend/worker; **giải thích chất lượng xấp xỉ** |
| Xử lý theo sự kiện | Poll/sort/filter toàn hệ thống liên tục | Cập nhật tăng dần theo ID, debounce, cancel, batch, backpressure |

- Không tuyệt đối hóa Big-O: O(n log n) có thể nhanh hơn O(n) khi n nhỏ. Đo bằng dữ liệu thực tế.
- Bài toán NP-hard (định tuyến, gán xe): **không** chạy trên main thread khi kích thước chưa giới hạn. Dùng heuristic/solver bất đồng bộ, có cancel, timeout, giới hạn bộ nhớ.
- Với vòng lặp lồng nhau, đệ quy, regex trên input người dùng, ma trận khoảng cách O(n²), hay tạo hàng nghìn DOM: ghi rõ lý do và giới hạn kích thước.
- Thay đổi logic quan trọng phải nêu **Time, Space, tần suất, quy mô kỳ vọng**.

### 7.2 Network và cache

- Tránh waterfall không phụ thuộc, N+1 theo dòng, overfetch. Truy vấn độc lập chạy song song (có giới hạn concurrency). Dùng batch endpoint nếu đã tồn tại; **không tự tạo contract**.
- **Query key và cache luôn cô lập theo tenant/user/role.** Đổi tenant → xóa/invalidate toàn bộ cache; chặn kết quả cũ ghi vào tenant mới.
- Dùng `AbortSignal`/cancel; chống duplicate request và double-submit. Không retry vô hạn; **không auto-retry** lệnh thanh toán/duyệt khi outcome chưa rõ.
- Mutation invalidate đúng nguồn liên quan. `staleTime`, prefetch, cache size theo đặc tính dữ liệu.
- Lazy load route/module nặng khi có hiệu quả và kiểm tra bundle trước/sau. Không thêm package chỉ để tiết kiệm vài dòng.

---

## 8. Nghiệp vụ và bảo mật bất khả xâm phạm

- **Load:** giữ vòng đời đơn, route thực tế, feature gating. Không mở edit/GAP khi API chưa sẵn sàng.
- **Trip / Dispatch / Optimization:** giữ state machine của điểm dừng, quyền gán, bằng chứng tối ưu bất biến (immutable), idempotency. Không bịa điểm AI, ETA, GPS. Quyết định AI dispatch luôn đi qua luồng duyệt có sẵn.
- **Invoice / Payment / Settlement / Payroll:** chính xác số tiền và làm tròn (Decimal), version chính sách, audit, role người duyệt, trạng thái `pending / conflict / unknown`. **Không tự báo thành công.**
- **Auth / Tenant:** giữ SSO/session/TenantGuard và permission ở backend; frontend ẩn/hiện UI chỉ là tiện ích, **không thay thế** kiểm quyền. Không để tenant A thấy cache tenant B.
- **Demo / dormant / feature flag:** ghi nhãn đúng. Code có sẵn ≠ route production đã hoạt động.
- **UI:** giữ Ant Design 5, token chung; đủ loading/empty/error/403/blocked; keyboard/focus; responsive; không thêm hiệu ứng làm tăng INP.

---

## 9. Quy trình nhiều Agent (worker / reviewer)

Khi chạy nhiều Agent (ví dụ worker triển khai, reviewer kiểm tra):

- **Worker:** làm đúng phạm vi task, cập nhật tiến độ, viết báo cáo theo Mục 11. Không mở rộng phạm vi.
- **Reviewer:** **chỉ đọc**, không sửa source. Kiểm theo acceptance criteria, quy tắc Mục 2 và Mục 8. Phát hiện ghi theo mức `CRITICAL / HIGH / MEDIUM / LOW`, kèm file/dòng và bằng chứng. Kết thúc bằng đúng một dòng: `STATUS: APPROVED` hoặc `STATUS: CHANGES_REQUESTED`.
- **Task audit (rà soát chức năng):** worker điều tra một tính năng và ghi **báo cáo Markdown, không sửa source**; reviewer xác minh lại báo cáo.
- Không báo `APPROVED` nếu có hạng mục `NOT RUN` ảnh hưởng đến kết luận.

---

## 10. Chống suy đoán

- Cái gì chưa thấy trong code thì **chưa tồn tại**: route, hook, endpoint, field, quyền, script.
- Tìm bằng tên symbol/route trước khi kết luận “chưa có”. Có nhiều ứng viên → nêu rõ và hỏi.
- Không viết code “cho chạy được” bằng dữ liệu giả hay API giả. Thiếu backend → báo `GAP` và dừng ở ranh giới đó.
- Không sao chép mẫu từ tài liệu/video khi code thực tế khác: **code thật là nguồn sự thật**.

---

## 11. Định nghĩa hoàn thành và mẫu báo cáo

**Hoàn thành khi:** đúng acceptance criteria · bất biến Mục 2 và Mục 8 còn nguyên · validation liên quan đã chạy (hoặc ghi `NOT RUN` kèm lý do) · checklist 6.10 đạt (nếu có thay đổi UI) · không để mock/debug/code chết · tiến độ plan đã cập nhật (nếu có).

**Mẫu báo cáo (ngắn, có bằng chứng):**

```
Task / Route / Data scale:
Bottleneck: [NETWORK | CPU | RENDER | DOM | MEMORY | BUNDLE | UX | UNKNOWN]
Root cause + evidence:
Change: [files, thuật toán, Time/Space, trade-off]
Security/business invariants preserved:
UI: [trạng thái đã xử lý, viewport đã kiểm tra, component/token tái dùng]
Before → After: [p50/p95, render, request, bytes, môi trường test] hoặc NOT MEASURED
Validation: [lint / typecheck / test / browser: PASS | FAIL | NOT RUN]
Remaining risk / next step:
```

---

**Ưu tiên cuối cùng:** đúng dữ liệu và tiền > an toàn tenant > đúng luồng nghiệp vụ > giao diện rõ, nhất quán > phản hồi nhanh > dễ bảo trì > tối ưu vi mô.