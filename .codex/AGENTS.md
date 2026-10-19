# LogisticsX — Quy tắc phát triển Frontend dành cho AI Agent

> **Phiên bản:** 1.0 · **Ngày:** 19/10/2026  
> **Phạm vi:** Admin Portal, TMS Portal, Customer Portal, package frontend dùng chung; áp dụng cho code do lập trình viên và AI tạo/sửa.  
> **Tài liệu liên quan:** `plan.md`, `CURRENT_UI_UX_FLOW_ANALYSIS(1).md` (nếu có trong workspace).  
> **Mục tiêu:** Phát triển và cải thiện UI/UX an toàn, nhất quán, dễ bảo trì; không phá nghiệp vụ, bảo mật đa tenant, API contract hoặc các chức năng đang hoạt động.

## 0. Nguyên tắc ưu tiên

1. **Đọc `AGENTS.md` trước khi sửa code.** Với công việc UI/UX trong kế hoạch, đọc thêm task tương ứng ở `plan.md` và mục liên quan của báo cáo hiện trạng.
2. **Source code/runtime hiện tại là nguồn sự thật.** Báo cáo phản ánh một thời điểm và có thể đã cũ; xác minh mã nguồn, route, package, quyền và API thực tế trước khi sửa.
3. Chỉ thay đổi trong phạm vi user yêu cầu và những phụ thuộc trực tiếp. Không tự mở rộng thành refactor toàn dự án hoặc tạo tính năng mới.
4. **An toàn và đúng nghiệp vụ quan trọng hơn việc giao diện giống video.** Video chỉ là tham chiếu UX, không chứng minh sản phẩm đang có backend tương ứng.
5. Không tự ý xóa code, ghi đè thay đổi chưa commit, `git reset`, `git clean`, `git stash`, rebase, commit, push hoặc sử dụng GitHub. Chỉ thực hiện những hành động này khi user yêu cầu rõ.
6. Không tự thay đổi database, backend contract, authentication, permission, state machine, idempotency hay feature flag để cho một nút hoạt động.
7. Nếu thông tin mâu thuẫn hoặc chưa được xác minh: nêu rõ giả định, đánh dấu `BLOCKED` khi cần và triển khai phần độc lập an toàn.

### 0.1. Stack hiện tại — phải xác minh lại trong `package.json`

- **Frontend:** React 18, TypeScript, Vite.
- **Application framework:** Refine core v4, Refine Ant Design adapter v5.
- **UI:** Ant Design 5, Ant Design Icons, Lucide React.
- **Style:** SCSS/Sass, CSS variables, Grid/Flex, media/container queries.
- **Router:** React Router v6; **server state:** TanStack Query qua Refine và hooks trực tiếp; **map state:** Zustand.
- **API:** Axios, `DataProvider`, các API adapter theo feature.
- **Map:** Leaflet và MapLibre; **chart:** Recharts.
- **Locale:** i18next + Ant Design locale `vi`, `en`, `ja`; ngày/giờ dùng dayjs; tiền tệ dùng formatter/Decimal.js hiện có.
- **Testing:** Vitest, Testing Library, Playwright.

**Không cài thư viện mới nếu stack hiện có đáp ứng được.** Đặc biệt không tự thêm Tailwind, React Hook Form, Framer Motion, SignalR hoặc một map provider khác khi dự án chưa dùng hoặc chưa có yêu cầu được phê duyệt.

### 0.2. Nhãn bằng chứng bắt buộc

| Nhãn | Ý nghĩa |
|---|---|
| `SOURCE` | Có trong source, chưa chứng minh backend chạy thành công. |
| `BROWSER-FIXTURE` | Đã kiểm thử giao diện với dữ liệu/adapter giả lập. |
| `BROWSER-LIVE` | Đã quan sát phiên ứng dụng thật, ghi rõ tenant/role/mode. |
| `MOCK/STATIC` | Dữ liệu mẫu, fallback, hằng số hoặc mô phỏng. |
| `GATED` | Có code nhưng tính năng bị capability/feature flag khóa. |
| `UNROUTED` | Có file page/component nhưng chưa có runtime route. |
| `NEEDS-LIVE` | Cần quyền, tenant và backend thật để xác minh. |
| `PROPOSAL` | Giải pháp UX đề xuất, chưa xác nhận là bug. |

**Tuyệt đối không coi SOURCE hoặc BROWSER-FIXTURE là bằng chứng end-to-end với backend.**

---

## 1. Quy trình bắt buộc trước và sau khi code

Mỗi task tạo/sửa code phải có **Checklist trước khi code** và **Checklist sau khi code** trong câu trả lời hoặc PR. Chỉ đánh dấu `[x]` khi đã thực sự xác minh; chưa rõ hoặc chưa chạy phải dùng `[ ]`.

### 1.1. Checklist trước khi code

```md
## Checklist trước khi code
- [ ] Xác định portal, feature, resource, route và task ID từ plan.md (nếu có)
- [ ] Đã kiểm tra `git status`, HEAD và thay đổi chưa commit
- [ ] Xác định tenant, role, permission, capability và feature flag
- [ ] Xác định DTO, API contract, data owner, query key và invalidation
- [ ] Xác định component, hook, locale có thể tái sử dụng
- [ ] Phân biệt server state / UI state / derived state / subscription
- [ ] Xác định loading, empty, error, 403, disabled và responsive
- [ ] Xác định test cần chạy, dữ liệu mẫu hay backend live
- [ ] Liệt kê điều chưa chắc chắn và blocker (không tự giả định)
```

### 1.2. Checklist sau khi code

```md
## Checklist sau khi code
- [ ] Chỉ sửa các file trong scope; không ghi đè công việc chưa commit
- [ ] Không hardcode text UI, tenant, permission, API URL hoặc route đã có constant
- [ ] Rules of Hooks, dependency, cleanup và StrictMode đều đúng
- [ ] Query/mutation bảo vệ tenant và permission, tôn trọng feature flag
- [ ] Mutation có pending/error/conflict, tránh double-submit
- [ ] Cache/list/detail được invalidate/refetch đúng sau khi ghi thành công
- [ ] Loading/empty/error/forbidden/disabled được xử lý phù hợp
- [ ] Các locale đang hỗ trợ có key và bản dịch hợp lệ
- [ ] Đã kiểm tra keyboard, focus, responsive, contrast/reduced-motion nếu liên quan
- [ ] Đã chạy lint/typecheck/test/build (chỉ tick khi thật sự chạy)
- [ ] Báo cáo rõ SOURCE / FIXTURE / LIVE, PASS / FAIL / NOT RUN
- [ ] Đã cập nhật task/progress và ghi blocker còn tồn tại
```

**Cấm:** đánh dấu PASS khi mới đọc source, thấy mock toast thành công hoặc chạy dev proxy fallback.

---

## 2. Cấu trúc câu trả lời khi viết code

Khi **trả code trong chat**, theo thứ tự:

1. Mục tiêu, portal/feature và task ID.
2. Checklist trước khi code.
3. Danh sách file tạo/sửa.
4. Code đầy đủ hoặc patch/diff chính xác; không dùng `...` thay phần logic quan trọng.
5. Giải thích hook, luồng dữ liệu, quyền, rủi ro và quyết định kỹ thuật.
6. Locale keys tạo/sửa.
7. Checklist sau khi code; lệnh test, kết quả, blocker và bước tiếp theo.

Khi **AI sửa trực tiếp file trong repo**, không cần dán nguyên file dài ra chat; vẫn phải báo file thay đổi, quyết định kỹ thuật và bằng chứng kiểm thử theo các phần trên.

---

## 3. Kiến trúc và tổ chức source code

- Đọc cấu trúc hiện có trước khi tự tạo folder. Repo đang dùng `src/pages`, `src/features`, `src/components`, `src/forms`, `src/hooks`, `src/api`, `src/providers`, `src/styles`, `src/locales`.
- **Không mặc định tồn tại** `src/layouts/` hay `src/services/`; layout thực tế nằm tại `components/AppLayout`, API/service phân tán theo providers và features.
- Page chỉ composition; hook quản lý data/UI/action; adapter/service giao tiếp API; component chung ưu tiên presentation thuần.
- Tận dụng Refine, Ant Design và component đang có thay vì tự xây Button, Modal, Form, Table song song.
- Business logic phức tạp không đặt trong JSX. DTO, Form Values và View Model phải tách đúng ranh giới.
- File >~250 dòng, JSX lồng sâu, >3–4 Effects là **tín hiệu xem xét** tách, không phải lý do tự động refactor ngoài scope.
- Không tự suy runtime route từ tên file, comment, locale hoặc registry: đối chiếu `AppRouter`, `foundationResourcePageRoutes`, permission và feature capability.

### 3.1. Comment và tài liệu hóa

- **Mỗi file TS/TSX/hook/service mới** phải có comment đầu file mô tả trách nhiệm và ranh giới dữ liệu.
- **Mỗi custom hook mới** có JSDoc mô tả nhiệm vụ, tham số quan trọng, giá trị trả về và tenant/cleanup nếu liên quan.
- Với hook sử dụng trong component, giải thích **vì sao** nếu việc dùng hook không hiển nhiên; nhóm hook cùng mục đích có thể dùng chung một comment ngắn, tránh comment lặp tên.
- **Mỗi `useEffect`/`useLayoutEffect` mới hoặc sửa** phải có comment mục đích; tài nguyên đăng ký phải có giải thích cleanup.
- Comment business rule, xử lý xung đột, idempotency, lý do memo hóa và invalidation khó hiểu.
- Không comment các thao tác hiển nhiên hoặc viết comment sai với code thực tế.

```tsx
/**
 * LoadListPage
 * Hiển thị Load của tenant hiện tại qua resource/hook của Refine.
 * Không trực tiếp gọi HTTP hoặc giữ bản sao server state trong useState.
 */
```

---

## 4. Rules of Hooks

- Hook chỉ gọi ở top level của React component hoặc custom hook.
- Không gọi trong `if`, `switch`, `for`, `while`, event handler, callback thường hay utility không phải hook.
- Custom hook phải bắt đầu bằng `use` và ưu tiên một trách nhiệm chính.
- Hook lấy dữ liệu phụ thuộc ID/tenant phải được gọi nhất quán, dùng `enabled`/skip theo **API thật của phiên bản hook đã cài**.
- Không tắt `StrictMode` để tránh Effect chạy hai lần ở development. Setup → cleanup → setup phải an toàn.
- Không tắt `react-hooks/exhaustive-deps` để tránh stale closure. Ngoại lệ cần lý do bằng văn bản, reviewer và test.

### 4.1. `useState` và derived state

- Chỉ lưu local UI state cần render: tab, modal, selection, filter chưa submit, draft chỉnh sửa.
- Dữ liệu lấy từ API thuộc Refine/TanStack Query, không copy vào `useState` rồi tự tạo loading/error lifecycle.
- Không lưu dữ liệu có thể tính từ props hoặc query. Dùng phép tính trực tiếp; `useMemo` khi đủ nặng hoặc cần identity ổn định.
- Với cập nhật phụ thuộc state cũ, dùng functional update.
- Draft form là ngoại lệ hợp lệ nếu có chính sách tránh ghi đè thao tác người dùng khi query refetch.

```tsx
// Danh sách này suy ra từ dữ liệu gốc, không cần một state thứ hai.
const activeLoads = loads.filter(
  (load) => load.status === LoadStatus.Dispatched,
);
```

### 4.2. `useEffect` và `useLayoutEffect`

- Dùng Effect để đồng bộ hệ thống bên ngoài: DOM, browser API, timer, event listener, observer, map instance, subscription, hoặc một số tình huống đồng bộ Ant Design Form async.
- Không dùng Effect để sort/filter, tính state suy ra, xử lý click, CRUD fetch thông thường, toast sau mutation hoặc điều hướng sau thao tác người dùng.
- Dependency phải đầy đủ. Subscription/timer/listener/observer phải cleanup; request thủ công phải xét abort/cancel/stale-result.
- Callback của Effect **không** được là `async`; đặt async function bên trong khi thật sự cần.
- `useLayoutEffect` chỉ dùng khi phải đo/đặt DOM **trước khi paint** để tránh nhấp nháy, có comment vì sao `useEffect` không đủ.
- **Không thực hiện mutation trong mount Effect**: tạo Load, Invoice, Trip, duyệt Payroll, gửi email/payment, xóa dữ liệu...

```tsx
// Đồng bộ trạng thái kết nối mạng với browser và hủy listener khi unmount.
useEffect(() => {
  const onOnline = () => setOnline(true);
  const onOffline = () => setOnline(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}, []);
```

### 4.3. `useMemo`, `useCallback`, `useRef`, `useReducer`, `useContext`

- `useMemo`: chỉ dùng khi có lợi ích hiệu năng/identity; comment mục đích cho logic không hiển nhiên. Không memo hóa mọi phép cộng/nối chuỗi.
- `useCallback`: khi dependency/child memo/subscription cần reference ổn định, không bắt buộc cho mọi handler.
- `useRef`: DOM/SDK/timer hoặc mutable value không cần render; **không dùng để né dependency** của Effect.
- `useReducer`: state machine hoặc nhóm state/transition liên quan, không dùng cho boolean đơn lẻ.
- `useContext`: current user/tenant/theme/locale/capability dùng chung; không biến Context thành kho server-state. Memo hóa object value khi có lợi.
- `useTransition`, `useDeferredValue`: cho rendering không khẩn cấp nặng; **không** thay thế loading của API mutation và **không** được coi là debounce API.

---

## 5. Refine, TanStack Query và API

- CRUD chuẩn ưu tiên `useList`, `useOne`, `useMany`, `useTable`, `useShow`, `useCreate`, `useUpdate`, `useDelete`, `useCustom`, `useCustomMutation` khi tương thích với phiên bản Refine **thực tế**.
- Component trình bày **không gọi trực tiếp `axios`/`fetch`**. API adapter hoặc DataProvider là nơi giao tiếp mạng; giữ lại các adapter có sẵn.
- Dùng `enabled`/skip cho truy vấn phụ thuộc tenant, ID hợp lệ, permission hoặc dữ liệu khác.
- **Custom tenant-scoped query key phải có tenant scope** hoặc dùng key factory đã đảm bảo scope, ví dụ `['loads', tenantId, loadId]`.
- **Không tự sửa query key nội bộ của Refine** theo một ví dụ chung. Với Refine phải kiểm tra DataProvider/context/cache isolation, key thực tế và cách clear/invalidate khi tenant đổi.
- Mutation invalidate/refetch đúng các consumer liên quan: list, detail, summary, timeline, báo cáo. **Không** dùng `window.location.reload()` như cách cập nhật cache.
- Trước khi đổi invalidation, kiểm tra cả Refine query key lẫn custom feature key; không tự đoán tên key.
- Hỗ trợ AbortSignal/cancellation nếu adapter/query hiện có cho phép; chống stale result và cập nhật nhầm tenant.
- Không dùng 403 hoặc lỗi network như một empty state thành công.

### 5.1. Quy tắc an toàn cho mutation

- Chỉ ghi dữ liệu từ hành động đã được người dùng/luồng nghiệp vụ cho phép; không ghi vì render/mount.
- Pending phải chống double-submit; success chỉ hiển thị sau khi biết kết quả thực tế.
- Phân biệt validation error, 401, 403, conflict, lỗi mạng và **kết quả chưa chắc chắn**.
- Tôn trọng version/ETag/idempotency và cơ chế frozen command hiện có. **Không tạo idempotency key mới khi kết quả lệnh trước chưa rõ**, nhất là Payment, Payroll, Optimization.
- 401 tuân theo cơ chế refresh/replay; 403 giữ session và báo không có quyền. Không nuốt lỗi hoặc tự đánh dấu success.
- Không xóa toàn bộ cache tùy tiện làm mất dữ liệu đúng ngữ cảnh hoặc gây lẫn tenant.

---

## 6. Multi-tenant, Auth, Permission và Feature Flags

- Tenant ID chỉ đến từ context/session/contract hiện hành; **không hardcode hoặc tự chọn tenant mặc định**.
- Query, cache, mutation, local UI state và subscription phải an toàn khi đổi tenant. Không để dữ liệu tenant cũ hiện trên tenant mới.
- Frontend permission chỉ quyết định UI; backend vẫn phải kiểm quyền.
- Dùng access-control provider/hook/component sẵn có thay vì rải `permissions.includes('...')` trong JSX.
- **Không đoán permission string** như `loads.read` khi chưa xác minh role matrix/API. Cần đúng `resource`/`action`/context hiện hành.
- Route tồn tại **không đồng nghĩa** chức năng được phép. Kiểm tra đồng thời tenant + role + capability + feature flag + backend contract.
- **Không tự bật** những flag đang khóa, nhất là:
  - `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED`
  - `DOCUMENT_UPLOAD_CONTRACT_CONFIRMED`
  - `BILLING_COMMANDS_RUNTIME_VERIFIED`
  - `PAYMENT_COMMANDS_RUNTIME_VERIFIED`
  - Các contract Executive, Map và module dormant khác.
- Nếu contract chưa rõ, có thể ẩn/vô hiệu hóa CTA với thông báo trung thực, sau đó đánh dấu `BLOCKED`; **không** dựng API/luồng ghi giả.
- Không tự đổi cơ chế đăng nhập OIDC/Lark, JWT/session, tenant guard hay role matrix khi chỉ làm UI.

---

## 7. Router và điều hướng

- Dùng route constants/helper sẵn có; kiểm tra `AppRouter.tsx`, resource registry, `AppSider.tsx`, menu filter quyền và capability trước khi tạo link.
- Validate route params (UUID nếu contract yêu cầu) trước query và navigation.
- Không dẫn vào route `UNROUTED` như `/map`, `/load-board` hoặc màn edit `GATED` nếu chưa có đích/runtime hợp lệ.
- **Không chữa 404 bằng cách mở route/feature flag thiếu contract.** Cần sửa CTA, cung cấp trạng thái unavailable an toàn hoặc chờ xác nhận API.
- Phân biệt generic View modal với trang chi tiết domain có tab/AI/timeline.
- Giữ Back/heading/action hợp lý ở mọi tab chi tiết; bảo toàn filter/selection/deep-link khi nghiệp vụ cần.
- Navigation sau mutation xảy ra trong handler sau **thành công đã xác minh**, không phát sinh ngẫu nhiên từ Effect.
- Nếu ID trong URL không được dùng để khôi phục đối tượng (ví dụ AI plan alias), không gọi đó là deep link đã hoàn chỉnh.

---

## 8. Ant Design Form, Modal và thông báo

- Form phức tạp phải có `Form.useForm<FormValues>()` hoặc convention typed tương đương đang dùng.
- Không quản lý **cùng một field** bằng cả Ant Design Form và `useState`.
- `Form.useWatch` chỉ theo dõi field cần thiết. Không watch tất cả chỉ để tiện code.
- `initialValues` không tự cập nhật theo async query. Đồng bộ `setFieldsValue` khi record identity thay đổi nhưng **không ghi đè dirty draft** khi refetch.
- Có validation phía client đúng contract, lỗi field từ backend, pending, cancel/discard và focus lỗi phù hợp.
- Ưu tiên `App.useApp()` để lấy `message`, `notification`, `modal` đúng context/locale/theme.
- Ưu tiên shared modal frame/confirmation/focus/dirty-form guard đã có trong repo.
- Không dùng toast thành công để che API không hoạt động, hoặc đóng modal trước khi mutation thực sự thành công nếu cần giữ dữ liệu.

---

## 9. TypeScript và business models

- Tránh `any`, ép kiểu `as` chỉ để tắt lỗi, `!` khi chưa validate, `@ts-ignore` không giải thích.
- Phân biệt DTO, FormValues, ViewModel; validate dữ liệu ngoài ở adapter/boundary; lỗi không chắc kiểu dùng `unknown` rồi normalize.
- Sử dụng enum/union/discriminated union cho trạng thái có trong contract; không tự thêm status mới để hợp giao diện.
- Props và hook public cần type/interface rõ, đặc biệt type trả về của custom hook.
- Logic nghiệp vụ quan trọng nên tách khỏi JSX, có comment giải thích điều kiện và nguồn chính sách.
- Giữ nguyên state machine Trip Stops, Settlement, Payroll, Payment Attempts, Optimization Accept.
- Tiền tệ, thuế và tính toán chính xác phải dùng formatter/Decimal.js hoặc quy tắc tài chính có sẵn; không tự tính bằng float tùy tiện.

---

## 10. i18n — không hardcode text người dùng

- Mọi text UI phải qua i18next: page/card/modal/table title, button, input label, placeholder, validation, status, toast, tooltip, breadcrumb, empty/error state, confirm, aria-label.
- Frontend được báo cáo có các locale **`vi`, `en`, `ja`**. Khi sửa text, cập nhật **tất cả locale đang được portal đó đăng ký**, không chỉ `vi/en`.
- Theo cấu trúc locale **thực tế** trong repo; không tự tạo namespace/folder song song nếu không cần.
- Locale key có tên rõ nghĩa và theo feature, ví dụ `loads.details.route.title`, không dùng key chung như `title`, `button`.
- Không ghép câu từ nhiều key; dùng interpolation/pluralization để mỗi ngôn ngữ có thứ tự từ tự nhiên.
- Enum/status hiển thị phải dịch; không đổi giá trị enum gửi API.
- Tất cả title **hiển thị cho người dùng** phải dùng `t()`, kể cả `aria-label`. Technical ID, mã máy, brand và API payload không cần dịch nếu có lý do.

```tsx
const { t } = useTranslation('loads');
const pageTitle = t('details.title');
const confirmText = t('delete.confirm', { number: load.number });
```

---

## 11. Design System, UI/UX và CSS

- Kiểm tra `styles/_variables.scss`, `global.scss`, `_components.scss`, `AppLayout.scss`, `AppSider.scss`, token Operations và Load redesign trước khi đổi giao diện.
- Báo cáo ghi global primary xanh nhưng Operations/Load AI dùng tím. **Không tự ý đổi brand color toàn hệ thống**; chỉ làm khi đã có quyết định design token.
- Nếu triển khai Design System, đồng bộ **Ant Design ConfigProvider theme** với SCSS/CSS variables. `AntdLocaleProvider` cấu hình locale không đồng nghĩa Ant Design đã được theme thống nhất.
- Dùng semantic colors (`primary`, `success`, `warning`, `error`, `surface`, `text`) thay vì rải HEX. Giữ màu trạng thái nghiệp vụ đúng ý nghĩa.
- Thống nhất typography, spacing, radius, shadow, border và trạng thái hover/focus/selected/disabled/loading.
- Không thêm hàng loạt override global làm vỡ CRUD/form và các portal khác.
- Chỉ hợp nhất những component trùng lặp (ví dụ các `PriorityShipmentCard`) sau khi so sánh prop/data contract và mode live/demo.
- Video tham chiếu chỉ định hướng layout, hierarchy, micro-interaction; **không** sao chép zoom/3D camera transition của video quảng bá vào app.

---

## 12. Operations Dashboard và độ tin cậy dữ liệu

- `/operations` mặc định từng chứa dữ liệu **API pha hằng số/mẫu**; `/operations?demo=1` là preview có nhãn. Luôn kiểm tra lại source hiện hành.
- Mỗi KPI/panel phải phân biệt rõ: `live`, `sample`, `fallback`, `unavailable`, `loading`, `error` khi có nguy cơ gây hiểu nhầm.
- **Không** lấp dữ liệu thiếu bằng KPI, vị trí GPS, ETA, tuyến đường hoặc tài xế giả trông như dữ liệu thật.
- Polling theo chu kỳ hoặc đồng hồ cố định không được gọi là real-time/streaming nếu không có nguồn xác minh.
- Nút Approve trong demo không được trình bày như mutation backend đã thành công. Khi thiếu callback/contract phải disabled hoặc giữ rõ trạng thái mô phỏng.
- Trước khi gộp hai `PriorityShipmentCard`, xác minh default data fallback và live data source.
- Mọi Dashboard CTA phải dẫn đến route đang hoạt động và được phép; không có CTA dẫn đến page dormant.

---

## 13. AI Dispatch, GAP và Optimization

- Phân biệt AI command backend thật với free chat mô phỏng, test connection ảo, localStorage config và plan state cục bộ.
- Không bịa score/đề xuất tài xế/ETA/route hoặc hiển thị chúng như kết quả AI đã được backend xác nhận.
- Approve/Reject cần permission, pending, mô tả tác động, confirm và kết quả backend thật trước khi cập nhật trạng thái thành công.
- Giữ nguyên evidence của optimization run, conflict, immutable result và frozen/idempotent mutation.
- Alias có plan ID/history chưa khôi phục được sau reload thì ghi `BLOCKED`, không tự tuyên bố deep link đã hoạt động.
- Không tự xây Inbox, live tracking, auto-assign theo video nếu chúng chưa thành requirement có phê duyệt.

---

## 14. Map, subscription và realtime

- Ưu tiên Leaflet/MapLibre theo đúng module hiện tại. **Không mặc định dùng Mapbox** chỉ vì ví dụ cũ dùng nó.
- Instance map, marker, observer, timer, event listener phải khởi tạo và cleanup theo vòng đời component/tenant.
- Đồng bộ selection list/map/detail bằng nguồn state rõ ràng nếu nghiệp vụ có những vùng này.
- Location phải có bằng chứng dữ liệu và timestamp phù hợp; không tự coi địa chỉ hoặc mock marker là GPS live.
- Cung cấp tương tác thay thế bản đồ khi thông tin quan trọng không thể dùng bằng keyboard.
- **SignalR/WebSocket chỉ áp dụng khi feature thực sự dùng hoặc đã được phê duyệt.** Không tự thêm SignalR chỉ vì bản quy tắc ban đầu có ví dụ.
- Với sự kiện realtime: kiểm tenant/resource/event ID/version nếu có, chống dữ liệu đến sai thứ tự, unsubscribe khi đổi tenant/resource/unmount.

---

## 15. Loading, Error, Empty và Authorization

Screen hoặc panel có dữ liệu phải xử lý trạng thái **phù hợp với nghiệp vụ**:

- Initial loading và background refresh (nếu có).
- Success có dữ liệu.
- Empty thật sự, không phải lỗi mạng giả dạng danh sách rỗng.
- API error có thông báo đã dịch, Retry hợp lý và không lộ stack trace.
- Unauthorized/Forbidden (401/403) và feature unavailable/disabled.
- Pending, conflict, outcome chưa rõ với thao tác ghi dữ liệu khi cần.

Không nuốt lỗi bằng `catch {}` vô nghĩa. Không ép tất cả component nhỏ có 6 trạng thái nếu không liên quan; **mỗi screen cần xử lý đầy đủ những trạng thái có thể xảy ra với nó**.

---

## 16. Accessibility, responsive và performance

- Kiểm tra những viewport có thay đổi đáng kể: **1440, 1024, 768, 390, 320px**; ghi rõ viewport nào được test thật.
- Dùng `button`/`a` cho tương tác, không dùng `div onClick` thay nút. Có label, aria-label cho icon button, keyboard Tab/Enter/Space/Escape và focus-visible.
- Modal phải trap/return focus hợp lý; bảng, drawer, form có thể sử dụng trên mobile, không cắt mất CTA.
- Mục tiêu WCAG AA: chữ thường ≥4.5:1; chữ lớn ≥3:1; thành phần UI quan trọng ≥3:1. Trạng thái không chỉ biểu thị bằng màu.
- Vùng chạm mobile ưu tiên khoảng **44×44px** khi có thể.
- Tôn trọng `prefers-reduced-motion`; chỉ thêm animation hữu ích, ưu tiên CSS transition hiện có.
- Không dùng `useMemo`/virtualization bừa bãi. Đo vấn đề thực, tối ưu list lớn/map render/query khi cần.

---

## 17. Các cảnh báo nghiệp vụ đặc thù LogisticsX

| Module | Quy tắc bắt buộc |
|---|---|
| Load | Create/show có code; edit có thể bị GATED. GAP Fill/`focus`/`focusField` phải kiểm cả route và contract. |
| Trip | Giữ thứ tự transition của Stop và quyền assignment; không tự thêm status picker tùy ý. |
| Documents | Upload có thể GATED; không toast success download/upload khi chưa xác nhận outcome; kiểm server pagination với local filter. |
| Notifications | Unread badge preview chưa chắc là tổng toàn hệ thống; không tự bịa API mark-read từng mục. |
| Optimization | Giữ immutable result/evidence, conflict, retry và frozen-command semantics. |
| Fleet | Không tạo chart lịch sử/Gantt từ snapshot; CTA bổ sung mileage phải có route hợp lệ. |
| Invoices/Payments | Tôn trọng read-only/capability, tiền tệ, quyền, audit và idempotency. |
| Settlements/Payroll | Giữ nguyên state machine, validation, idempotency, reconciliation; không mô phỏng thanh toán thành công. |
| Auth/Tenant | Không đổi SSO/session/TenantGuard chỉ để sửa UX. |
| Executive/Map/Load Board | Source dormant không đồng nghĩa được phép bật route production. |

---

## 18. Code quality và ESLint

- Tuân theo ESLint/TSConfig **đang được cài**. Không copy nguyên cấu hình ESLint mẫu nếu plugin chưa có hoặc project dùng cấu hình khác.
- `react-hooks/rules-of-hooks` và `exhaustive-deps` phải đạt; không mặc định suppress.
- Không `any`, `as any`, `@ts-ignore`, non-null assertion hoặc `eslint-disable` thiếu lý do và kiểm thử.
- Không để `console.log`/`debugger` trong code production; log lỗi qua cơ chế hiện có và không ghi secret/PII.
- Không hardcode tenant ID, role, permission, API URL, route khi có constants, status, format ngày/tiền/đơn vị hoặc timeout nghiệp vụ.
- Không xóa test hoặc sửa snapshot chỉ để làm test PASS mà không xác minh yêu cầu thực tế.

---

## 19. Test và nghiệm thu

Trước khi đánh dấu `DONE`:

1. Đọc `package.json`, chỉ chạy script thật sự tồn tại: lint/typecheck/test/build phù hợp.
2. Viết hoặc cập nhật test cho hook/component/state transition có thay đổi.
3. Kiểm tra UI bằng Playwright/browser khi có điều kiện, **phân biệt fixture và backend live**.
4. Kiểm thử success, loading, empty, lỗi API, 403, GATED, tenant switch, mobile, conflict **nếu có thể xảy ra trong luồng đã sửa**.
5. Kiểm tra `vi/en/ja` khi thay đổi text hoặc component dùng chung.
6. Ghi rõ lệnh, kết quả `PASS`/`FAIL`/`NOT RUN`, nguyên nhân không chạy và rủi ro còn tồn tại.

Các flow nên có regression: Load create/detail/GAP Edit gating; Operations demo/live; AI approve/reject; Optimization conflict; Documents query/delete/upload gating; Notifications count; Settlement/Payroll state machine; route safety theo role/tenant.

---

## 20. Triển khai theo `plan.md`

- Đọc task ID, priority, acceptance criteria, evidence, dependencies của `plan.md` trước khi thực hiện.
- Kiểm tra task còn đúng với source/runtime không; không sửa một vấn đề đã biến mất.
- Ưu tiên xác minh baseline và P0 route/data-truth trước các đợt redesign visual lớn, trừ khi user yêu cầu scope khác.
- Triển khai thay đổi nhỏ, có thể kiểm soát; không tranh thủ refactor module không liên quan.
- Khi bắt đầu sửa theo plan, tạo/cập nhật `docs/UI_UX_IMPLEMENTATION_PROGRESS.md` với: Task ID, phase, trạng thái, files, test, evidence, blocker, next step.
- Dùng trạng thái: `BACKLOG`, `VERIFYING`, `READY`, `IN_PROGRESS`, `IN_REVIEW`, `UI_SAFE_DONE`, `INTEGRATION_DONE`, `DONE`, `BLOCKED`, `DEFERRED`.
- `DONE` chỉ khi đạt acceptance criteria và có test/bằng chứng thích hợp. `UI_SAFE_DONE` khi UI an toàn nhưng backend thật chưa được xác minh.
- Cập nhật trạng thái trong `plan.md` **theo thực tế**, không xóa ticket chưa xử lý, không tự tuyên bố dự án hoàn thành.
- Nếu một task thiếu API, permission, contract, môi trường: ghi `BLOCKED`, nêu điều kiện cần xác minh, hoàn thiện UI an toàn nếu có thể rồi chuyển task độc lập tiếp theo.
- Kết thúc milestone: báo Task IDs, files changed, test cụ thể, kết quả, blocker, task tiếp theo; không tự ước tính % hoàn thành.

### 20.1. Bảo vệ working tree và rollback

- Bắt đầu bằng `git status --short` và kiểm tra branch/HEAD; chỉ đọc/truy vết, không tự thực hiện hành động Git phá hủy.
- Trước khi sửa file dirty, đọc diff hiện có để tránh ghi đè thay đổi của user.
- Sửa ít nhất đủ giải quyết task, xem lại diff và chạy focused tests.
- Thay đổi global theme/layout hoặc nghiệp vụ rủi ro cao phải có kế hoạch rollback rõ ràng.
- **Không** reset/clean/stash/rebase/commit/push/GitHub nếu chưa được yêu cầu.

---

## 21. Checklist bàn giao / Pull Request

```md
### Architecture
- [ ] Đúng portal/feature/scope và cấu trúc repo
- [ ] Tái sử dụng Refine/Ant Design; component không gọi HTTP trực tiếp
- [ ] Không đổi nghiệp vụ/API contract ngoài phạm vi

### Hooks & Data
- [ ] Rules of Hooks, dependency, cleanup, StrictMode đúng
- [ ] Tenant isolation, query key/invalidation đã xác minh
- [ ] Permission và feature flags đúng runtime
- [ ] Pending/error/conflict/uncertain outcome được xử lý

### UI & i18n
- [ ] Locale đầy đủ theo portal (vi/en/ja nếu đang hỗ trợ)
- [ ] Không hardcode user-facing title, label, toast, aria-label
- [ ] Design tokens, loading/empty/error/disabled nhất quán
- [ ] Keyboard/focus/contrast/responsive/reduced-motion phù hợp

### Verification
- [ ] Lint: PASS / FAIL / NOT RUN (kèm lệnh)
- [ ] Typecheck: PASS / FAIL / NOT RUN
- [ ] Unit/component tests: PASS / FAIL / NOT RUN
- [ ] Build: PASS / FAIL / NOT RUN
- [ ] Browser fixture: PASS / FAIL / NOT RUN
- [ ] Backend live/UAT: PASS / FAIL / NOT RUN
- [ ] `plan.md` và progress cập nhật đúng trạng thái
- [ ] Không có dữ liệu demo giả danh live; CTA không dẫn sai route
```

---

## 22. Câu hỏi bắt buộc trước khi hoàn thành code

1. Dữ liệu đang xử lý là local UI state, derived state, server state hay subscription?
2. Hook/Effect có thực sự cần, dependency/cleanup và StrictMode đã đúng chưa?
3. Thao tác liên quan tenant, role, permission, capability hay feature flag nào?
4. Route, DTO, API, status và query key đã được xác minh trong repo chưa?
5. Loading/error/empty/conflict/kết quả không chắc chắn có được hiển thị trung thực không?
6. User-facing text đã dịch đầy đủ theo locale thực tế chưa?
7. UI có dùng token/component hiện có và hỗ trợ a11y/responsive phù hợp không?
8. Kiểm thử đã **thực sự chạy** hay mới dựa vào source/fixture?
9. Có bảo toàn thay đổi chưa commit, nghiệp vụ và phạm vi user yêu cầu không?
10. Đã ghi lại tiến độ, bằng chứng và blocker chưa?

> **Quy tắc bất khả xâm phạm:** Không dữ liệu giả danh live · Không rò rỉ tenant · Không bịa API/permission · Không tự bật feature flag · Không báo success khi chưa có outcome · Không thao tác Git phá hủy khi chưa có yêu cầu.