# Kế hoạch triển khai App bootstrap, health gate và diagnostics

Trạng thái: **Tạm dừng — hoàn thành 09/11; công việc 10 bị chặn bởi Playwright browser binary**

## A. Mục tiêu

Hoàn thiện lát cắt nền tảng kế tiếp sau runtime configuration để ứng dụng:

1. có entry point React chạy được;
2. tải và validate `/runtime-config.json` trước mọi provider nghiệp vụ;
3. gọi public `GET /api/health` không kèm Bearer token;
4. phân biệt cấu hình lỗi, API unreachable, CORS bị chặn, API unhealthy và `database=disabled`;
5. chặn fail-closed toàn bộ business navigation khi bootstrap chưa đạt;
6. cung cấp trang `/diagnostics` song ngữ, có request ID và khả năng sao chép request ID;
7. có unit, component và browser smoke test tương ứng.

Phạm vi này được chọn theo bước tiếp theo đã đề xuất sau khi hoàn thành runtime config. Đây là giả định cần được xác nhận ở mục D.

## B. Phạm vi

### Trong phạm vi lần này

- Chuẩn hóa frontend health contract theo đúng Java controller hiện tại.
- Bổ sung các nhánh kiểm thử còn thiếu cho health probe.
- Xây dựng state machine/policy thuần cho bootstrap.
- Xây dựng hook điều phối theo thứ tự runtime config → health probe.
- Hỗ trợ retry, hủy request khi unmount và chống kết quả request cũ ghi đè request mới.
- Thêm catalogue i18n cấp ứng dụng cho tiếng Việt và tiếng Anh.
- Thêm UI cho loading/config error/API error/CORS/database disabled.
- Hiển thị và cho phép sao chép `X-Request-Id` trên màn hình lỗi phù hợp.
- Thêm trang diagnostics chỉ hiển thị metadata không nhạy cảm.
- Thêm router công khai tối thiểu và entry point React.
- Thêm Playwright smoke test cho ba acceptance path: healthy, unreachable và database disabled.
- Sau mỗi công việc: cập nhật trạng thái trong file này, chạy kiểm tra riêng rồi mới chuyển bước.

### Ngoài phạm vi lần này

- Sửa backend CORS hoặc readiness; đây là các blocker `BE-001` và `BE-006`.
- OAuth/OIDC, login, callback, logout, refresh token và identity provider.
- Khởi tạo `Refine`, data provider, auth provider, access-control provider và notification provider.
- Protected routes, permission/role guard và tenant/company switching.
- Layout, sidebar, header, breadcrumb, theme/Sass và responsive business shell.
- Bất kỳ CRUD hoặc feature nghiệp vụ nào.
- Dashboard, reports, maps, realtime hoặc endpoint chưa tồn tại.
- Nâng cấp Refine/React Router hoặc tự động sửa dependency advisory.
- Tạo `public/runtime-config.json` mang giá trị theo môi trường deploy.
- Thêm secret, token, Lark secret hoặc endpoint giả định vào frontend.
- Sửa/xóa các thay đổi chưa commit hiện có ngoài đúng danh sách file được duyệt.

## C. Hiện trạng liên quan

### Sản phẩm và contract đã xác minh

- Frontend là back-office logistics đa tenant cho Spring Boot API; Java source là nguồn sự thật cuối cùng khi tài liệu mâu thuẫn.
- Các vai trò đã khai báo là `SUPERADMIN`, `OWNER`, `MANAGER`, `DISPATCHER`, `DRIVER`.
- Tenant hiện chỉ đến từ JWT claim; frontend không được tự gắn `X-Tenant*`.
- Authentication dự kiến dùng external OIDC Authorization Code + PKCE. Backend không có business endpoint `/login`, `/refresh`, `/logout` hoặc `/me`.
- Các phase nghiệp vụ có contract gồm master data, operations, finance và collaboration. Dashboard cùng nhiều module cũ chưa có API và không được dựng production route.
- List API dùng pagination một-based, page size tối đa 100, filter/sort whitelist; lỗi business API dùng envelope. Riêng health trả JSON trực tiếp.

### Stack và convention thực tế

- React `18.3.1`, TypeScript `6.0.3`, Vite `8.1.5`, Ant Design `5.29.3`.
- Refine core thực tế là `@refinedev/core@4.58.0`; `@refinedev/antd@5.47.0` không có nghĩa là Refine core v5.
- React Router DOM là `6.30.4`; adapter là `@refinedev/react-router-v6@4.6.2`.
- TypeScript bật strict cùng `noUncheckedIndexedAccess` và `exactOptionalPropertyTypes`.
- Kiến trúc được duyệt là `app → features → core → shared`; alias `@app`, `@core`, `@features`, `@shared`, `@styles`, `@assets` đã đồng bộ giữa Vite và TypeScript.
- Runtime deployment config phải đến từ `/runtime-config.json`, không đến từ `VITE_*`.

### Code hiện có liên quan trực tiếp

- `src/core/config` đã có schema, loader, provider, hook và health probe.
- Health probe hiện sinh `X-Request-Id`, không gửi Authorization và đã phân biệt CORS/unreachable ở mức cơ bản.
- Các test health hiện chưa bao phủ HTTP error, response malformed, `status != UP`, abort và `database=disabled`.
- `HealthResponse.profiles` trong health probe là `string`, đúng Java source; `ApiHealthResponse.profiles` trong API client lại đang là `string[]`, nên contract nội bộ chưa thống nhất.
- Backend `HealthController` xác nhận `GET /api/health` là public và trả:
  - `status`: hiện hard-code `"UP"`;
  - `application`: `"logicstic"`;
  - `profiles`: chuỗi;
  - `database`: `"disabled"` nếu profile chứa `nodb`, ngược lại `"enabled"`.
- `docs/backend-gaps.md` ghi nhận:
  - `BE-001`: backend chưa có CORS configuration;
  - `BE-006`: health chưa phản ánh readiness thực;
  - Identity Server hiện chưa khả dụng.
- `src/shared` đã có i18n bootstrap, async/error primitives và test renderer; chưa có catalogue cấp ứng dụng cho bootstrap/diagnostics.
- `src/app/router/routes.ts` đã khai báo `/`, `/login`, `/auth/callback`, `/forbidden`, `/diagnostics`, nhưng chưa có router implementation.
- `index.html` import `/src/main.tsx`, trong khi `src/main.tsx` và `src/App.tsx` không tồn tại.
- Chưa có `<Refine>`, `BrowserRouter`, app provider composition, page hoặc feature implementation.
- `package.json` có script Playwright và dependency Playwright; `tsconfig.node.json` cũng đã include `playwright.config.ts`, nhưng repository chưa có config hoặc E2E spec.
- Worktree đang có một đợt migration lớn chưa commit. Các thay đổi đó được coi là tài sản của người dùng và không được ghi đè.

### Baseline kiểm tra gần nhất trước lượt lập kế hoạch

- Lint: đạt.
- Typecheck: đạt.
- Unit/component test: 29 file, 103 test đạt.
- Build: chưa đạt vì thiếu `src/main.tsx`.
- Dependency audit: còn hai advisory mức moderate thuộc React Router 6; automatic fix đòi Router 7 và nằm ngoài phạm vi.

Không lệnh build/test nào được chạy trong lượt lập kế hoạch này.

## D. Giả định và câu hỏi mở

### Giả định tạm thời

1. **Phạm vi lần này** là “App bootstrap + health gate + diagnostics”, không phải toàn bộ frontend.
2. Frontend tiếp tục dùng đúng stack đã cài: Refine core v4.58.0 và React Router v6; không áp API Refine v5 khi dependency chưa được migration.
3. Health path là contract cố định `/api/health`; không thêm `healthPath` vào runtime config nếu tài liệu/backend chưa yêu cầu.
4. `status=UP` nhưng `database=disabled` vẫn phải fail-closed và không mount business/provider tree.
5. `profiles` là chuỗi theo Java source, không tự chuyển thành mảng trong transport contract.
6. UI khởi động bằng locale fallback `vi`, sau đó đổi sang `defaultLocale` của runtime config đã validate.
7. Chỉ khởi tạo RuntimeConfigProvider và public router khi health gate đạt. OIDC, HTTP client và Refine providers được để cho lát cắt kế tiếp.
8. Trong thời gian auth/shell chưa được duyệt, `/` tạm redirect sang `/diagnostics`; không dựng dashboard hoặc login giả.
9. Diagnostics có thể công khai metadata `environment`, `application`, `profiles`, `status`, `database`, `requestId`; không hiển thị token, OAuth metadata, base URL, stack trace hoặc config thô.
10. Browser smoke test dùng network interception/mocked contract; nó không được coi là bằng chứng backend CORS/readiness production đã đạt.

### Câu hỏi cần xác nhận

1. Bạn xác nhận phạm vi hiện tại đúng là bootstrap/health/diagnostics chứ không phải một feature khác?
2. Bạn đồng ý tiếp tục theo Refine core v4.58.0 hiện có, hay muốn lập một kế hoạch migration Refine v5 riêng trước?
3. Bạn đồng ý với hành vi tạm thời `/` → `/diagnostics` cho đến khi Authentication Router được duyệt?
4. Trang `/diagnostics` có được public với bộ metadata không nhạy cảm nêu trên không, hay cần hoãn trang chi tiết đến khi có auth guard?
5. Bạn đồng ý thêm Playwright config và smoke spec trong lát cắt này, dù live CORS/readiness vẫn bị backend blocker?
6. Acceptance ở giai đoạn này có thể dùng mocked browser contract và ghi rõ live integration là blocked bởi `BE-001`/`BE-006` không?

Nếu kế hoạch được duyệt mà không có điều chỉnh riêng, các giả định trên được dùng làm quyết định tạm thời; mọi phát hiện mới làm thay đổi chúng sẽ khiến công việc dừng để xin duyệt lại.

## E. Danh sách công việc

### API và luồng dữ liệu

- API duy nhất: public `GET {apiBaseUrl}/api/health`.
- Request headers: `Accept: application/json`, `X-Request-Id: <UUID>`; không có `Authorization`.
- Luồng đạt: `main` → i18n fallback → load/validate runtime config → đổi locale → health probe → kiểm tra database → RuntimeConfigProvider → public router → diagnostics.
- Luồng không đạt: lỗi được chuẩn hóa thành bootstrap state → error UI fail-closed → retry tạo attempt/request ID mới; request cũ bị abort hoặc bị bỏ qua.
- Không service/provider nghiệp vụ nào được tạo hoặc gọi trong lát cắt này.

Mọi dòng dưới đây đều phải cập nhật trạng thái trong `PLAN.md` sau khi hoàn thành; việc này được hiểu là thay đổi chung và không lặp lại trong mọi ô “File sẽ sửa”.

| STT | Công việc | File tạo mới | File sẽ sửa | Phụ thuộc | Rủi ro | Điều kiện hoàn thành |
|---|---|---|---|---|---|---|
| 01 | `[x]` Khóa baseline trước triển khai: kiểm tra lại status/diff, xác nhận các target file không bị thay đổi ngoài dự kiến và ghi trạng thái bắt đầu. | Không | `PLAN.md` | Kế hoạch được người dùng duyệt | Worktree lớn và nhiều file untracked có thể làm mất thay đổi người dùng nếu xử lý sai | Hoàn thành ngày 2026-07-29: status/diff đã được chụp read-only; target list đúng; không file code nào bị đổi |
| 02 | `[x]` Chuẩn hóa health contract và harden probe: đồng bộ `profiles: string`; tách network error khỏi JSON/contract error; bổ sung nhánh HTTP error, malformed body, `DOWN`, abort và dữ liệu `database=disabled`. | Không | `src/core/config/healthProbe.ts`; `src/core/config/healthProbe.test.ts`; `src/core/api/types.ts`; `src/core/api/client.test.ts` | 01; Java `HealthController` hiện tại | Phân loại malformed JSON nhầm thành CORS; thay type có thể ảnh hưởng client consumer | Hoàn thành ngày 2026-07-29: targeted tests 14/14 đạt; typecheck và lint đạt; contract khớp Java source; abort và malformed JSON được phân loại đúng |
| 03 | `[x]` Tạo policy/state model thuần cho bootstrap, gồm loading config, config error, probing, unreachable, CORS, unhealthy, database disabled và ready. | `src/app/bootstrap/bootstrapState.ts`; `src/app/bootstrap/bootstrapState.test.ts`; `src/app/bootstrap/index.ts` | Không | 02 | State thiếu nhánh có thể vô tình fail-open | Hoàn thành ngày 2026-07-29: 9 policy tests đạt; chỉ health hợp lệ với database `enabled` tạo `ready`; database lạ fail-closed |
| 04 | `[x]` Tạo hook điều phối runtime config → locale → health, hỗ trợ retry, AbortController và bỏ qua stale completion. | `src/app/bootstrap/useAppBootstrap.ts`; `src/app/bootstrap/useAppBootstrap.test.tsx` | `src/app/bootstrap/index.ts` | 03; loader/provider hiện có | Race condition khi retry/unmount; health chạy dù config lỗi | Hoàn thành ngày 2026-07-29: 6 orchestration tests đạt; đúng thứ tự; duplicate retry bị chặn; unmount abort; stale completion bị bỏ qua |
| 05 | `[x]` Tạo catalogue i18n cấp app và factory ghép shared + app resources cho `vi`/`en`. | `src/app/i18n/locales/en.ts`; `src/app/i18n/locales/vi.ts`; `src/app/i18n/resources.ts`; `src/app/i18n/createApplicationI18n.ts`; `src/app/i18n/createApplicationI18n.test.ts`; `src/app/i18n/index.ts` | Không | 03 | Lệch key giữa hai locale; copy bị hard-code trong component | Hoàn thành ngày 2026-07-29: app/shared namespace được ghép; runtime locale switching và key parity được kiểm chứng bằng 3 test |
| 06 | `[x]` Tạo BootstrapStateView cho loading và các failure state; retry có pending/disabled; request ID có nhãn và copy action; config details được sanitize. | `src/app/bootstrap/BootstrapStateView.tsx`; `src/app/bootstrap/BootstrapStateView.test.tsx` | `src/app/bootstrap/index.ts` | 03, 05; shared AntD/error primitives | Rò URL/config thô; lỗi chỉ phân biệt bằng màu; retry double-click | Hoàn thành ngày 2026-07-29: 8 component tests đạt; accessible state, retry pending, config sanitization và request-ID copy đều được kiểm chứng |
| 07 | `[x]` Tạo DiagnosticsPage responsive nhận dữ liệu bootstrap đã validate; chỉ hiển thị metadata được duyệt và request ID. | `src/app/diagnostics/DiagnosticsPage.tsx`; `src/app/diagnostics/DiagnosticsPage.test.tsx`; `src/app/diagnostics/index.ts` | Không | 05; health contract từ 02 | Metadata public có thể bị xem là nhạy cảm; UI bảng vỡ trên mobile | Hoàn thành ngày 2026-07-29: 4 component tests đạt ở `vi`/`en`; whitelist và không lộ URL/OAuth/feature flag được kiểm chứng |
| 08 | `[x]` Tạo public router tối thiểu: `/` redirect an toàn tới `/diagnostics`, `/diagnostics` render page, route khác dùng 404; router chỉ được mount sau ready. | `src/app/router/AppRouter.tsx`; `src/app/router/AppRouter.test.tsx`; `src/app/router/index.ts` | `src/app/router/routes.test.ts` nếu cần mở rộng assertion | 06, 07; route constants hiện có | Temporary redirect có thể bị hiểu là product route; React Router advisory/open redirect | Hoàn thành ngày 2026-07-29: 9 router/safety tests đạt; root redirect và wildcard 404 dùng route constants; auth route vẫn fail-closed |
| 09 | `[x]` Ghép AppBootstrap, App và entry point: khởi tạo i18n/AntD, chạy gate, chỉ bọc RuntimeConfigProvider/router ở state ready. | `src/app/bootstrap/AppBootstrap.tsx`; `src/app/bootstrap/AppBootstrap.test.tsx`; `src/app/App.tsx`; `src/app/App.test.tsx`; `src/app/index.ts`; `src/main.tsx` | `src/app/bootstrap/index.ts` | 04–08; `index.html` hiện có | Provider được mount quá sớm; blank/crash khi config hoặc API lỗi; React StrictMode gọi side effect lặp | Hoàn thành ngày 2026-07-29: 4 integration tests, typecheck, lint và production build đạt; router/provider chỉ mount sau ready |
| 10 | `[!]` **BLOCKED** — Đã thêm Playwright bootstrap smoke suite bằng network interception cho healthy, connection refused và `database=disabled`; chưa thể chạy browser. | `playwright.config.ts`; `e2e/bootstrap.spec.ts` | Không | 09; script/dependency Playwright hiện có | Chromium headless shell chưa có trong Playwright cache | `npm run test:e2e -- --list`, typecheck và lint đạt; `npm run test:e2e` thu thập 3 test nhưng cả 3 dừng trước khi chạy vì thiếu browser binary; chờ người dùng cho phép cài |
| 11 | `[ ]` Chạy full quality gate, review diff/scope, ghi kết quả và TODO/blocker vào kế hoạch; không tự sửa việc ngoài phạm vi. | Không | `PLAN.md` | 01–10 | Pre-existing audit/CORS/readiness blocker có thể bị nhầm là regression | Targeted/full test, lint, typecheck, build và E2E được báo cáo; dependency audit được phân loại; diff chỉ chứa file đã duyệt; các blocker còn lại được ghi rõ |

### Nhật ký thực thi

- **2026-07-29 — Công việc 01 hoàn thành:** `git status --short` xác nhận worktree migration lớn đúng như kế hoạch; `git diff --check` đạt; GitNexus index được làm mới bằng chế độ `--index-only` nên không inject file vào source. Impact analysis đánh giá `probeHealth` có một direct test consumer và `ApiHealthResponse` có ba direct import consumer, mức rủi ro LOW, không có execution flow bị ảnh hưởng. MCP GitNexus đang lệch storage version với CLI nên kết quả impact được lấy từ CLI hiện hành; đây không làm thay đổi phạm vi công việc 02.
- **2026-07-29 — Công việc 02 hoàn thành:** `ApiHealthResponse.profiles` đã đồng bộ thành chuỗi; lỗi network được tách khỏi lỗi parse/contract nên malformed JSON không còn bị nhận nhầm là CORS; HTTP error, `DOWN`, `database=disabled` và abort đã có coverage. Đã chạy targeted Vitest (2 file, 14 test), `npm run typecheck`, `npm run lint`; tất cả đạt.
- **2026-07-29 — Công việc 03 hoàn thành:** đã thêm discriminated union và pure resolver cho toàn bộ bootstrap state. Chỉ `healthy` với database `enabled` được phép `ready`; `disabled` có state riêng và mọi giá trị database khác được chuyển thành `api-unhealthy`. Đã chạy targeted Vitest (1 file, 9 test), `npm run typecheck`, `npm run lint`; tất cả đạt.
- **2026-07-29 — Công việc 04 hoàn thành:** hook điều phối config → locale → health đã có retry single-flight, AbortController và run ID chống stale completion. Lần kiểm tra đầu phát hiện callback dependency inline gây effect loop (2/6 test fail); implementation được chỉnh sang dependency ref cập nhật trong effect, sau đó targeted Vitest 6/6, typecheck và lint đều đạt.
- **2026-07-29 — Công việc 05 hoàn thành:** đã thêm namespace `app` cho bootstrap/diagnostics và factory ghép với namespace `shared`, không sửa shared implementation. Đã kiểm chứng catalogue `vi`/`en` có cùng key và cả hai namespace đổi locale runtime đồng bộ. Targeted Vitest 3/3, typecheck và lint đều đạt.
- **2026-07-29 — Công việc 06 hoàn thành:** `BootstrapStateView` đã bao phủ loading, config error, unreachable, CORS, unhealthy và database-disabled; raw config detail được rút xuống error code/field name, request ID có copy action và retry có pending/disabled. Lần test đầu có 2 assertion chưa khớp accessible DOM của Ant Design; đã sửa test theo role thực tế. Kết quả cuối: 8/8 test, typecheck và lint đạt.
- **2026-07-29 — Công việc 07 hoàn thành:** `DiagnosticsPage` chỉ nhận ready state và render sáu field whitelist bằng Ant Design `Descriptions` responsive; status/database có nhãn + icon, request ID có copy action. Test ở cả `vi`/`en` xác nhận không lộ API/identity URL, OAuth metadata hoặc feature flag. Lần test đầu có một assertion trùng giá trị fixture; sau khi sửa assertion, 4/4 test, typecheck và lint đạt.
- **2026-07-29 — Công việc 08 hoàn thành:** router công khai tối thiểu đã được thêm với basename Vite, root redirect tới diagnostics, direct diagnostics và wildcard 404 có recovery về route constant. `/login` chưa triển khai được kiểm chứng là 404 thay vì dựng giả. Targeted Vitest 2 file/9 test, typecheck và lint đều đạt.
- **2026-07-29 — Công việc 09 hoàn thành:** đã tạo AppBootstrap/App/main entry, ghép i18n + Ant Design và chỉ mount RuntimeConfigProvider/router sau ready. Lần kiểm tra đầu: 4/4 UI test và lint đạt nhưng strict typecheck/build bắt literal fixture bị widen cùng import bare alias; đã sửa bằng contract types và public `@app/index`. Kết quả cuối: 4/4 test, typecheck, lint, build đạt. Build còn cảnh báo chunk Ant Design 635.47 kB sau minify; ghi nhận để tối ưu ở giai đoạn layout/performance, không đổi scope hiện tại.
- **2026-07-29 — Công việc 10 BLOCKED:** đã tạo Playwright config và 3 smoke case cho healthy, connection refused/retry và database-disabled. `playwright test --list` thu thập đủ 3 test; typecheck và lint đạt. Lần chạy thật thất bại trước test vì thiếu executable `chromium_headless_shell-1234` trong Playwright cache. Theo kế hoạch, không tự chạy `npx playwright install`; công việc 11 chưa bắt đầu.

## F. Chiến lược kiểm tra

Không chạy cài đặt dependency. Mọi lệnh dưới đây lấy từ script thực tế trong `package.json`; đối số file chỉ thu hẹp phạm vi Vitest.

| Công việc | Kiểm tra ngay sau công việc | Kết quả bắt buộc trước khi sang bước sau |
|---|---|---|
| 01 | `git status --short`; `git diff --check` | Không thay đổi ngoài dự kiến; không whitespace error trong tracked diff |
| 02 | `npm run test -- src/core/config/healthProbe.test.ts src/core/api/client.test.ts`; `npm run typecheck`; `npm run lint` | Tất cả đạt |
| 03 | `npm run test -- src/app/bootstrap/bootstrapState.test.ts`; `npm run typecheck`; `npm run lint` | Tất cả đạt; database disabled fail-closed |
| 04 | `npm run test -- src/app/bootstrap/useAppBootstrap.test.tsx`; `npm run typecheck`; `npm run lint` | Tất cả đạt; retry/abort/stale completion được kiểm chứng |
| 05 | `npm run test -- src/app/i18n/createApplicationI18n.test.ts`; `npm run typecheck`; `npm run lint` | Tất cả đạt; locale key parity đạt |
| 06 | `npm run test -- src/app/bootstrap/BootstrapStateView.test.tsx`; `npm run typecheck`; `npm run lint` | Tất cả đạt; state UI và interaction đạt |
| 07 | `npm run test -- src/app/diagnostics/DiagnosticsPage.test.tsx`; `npm run typecheck`; `npm run lint` | Tất cả đạt; field whitelist đạt |
| 08 | `npm run test -- src/app/router/AppRouter.test.tsx src/app/router/routes.test.ts`; `npm run typecheck`; `npm run lint` | Tất cả đạt; route fail-closed |
| 09 | `npm run test -- src/app/bootstrap/AppBootstrap.test.tsx src/app/App.test.tsx`; `npm run typecheck`; `npm run lint`; `npm run build` | Tất cả đạt; Vite resolve entry và tạo production bundle |
| 10 | `npm run test:e2e` | Healthy tiếp tục; unreachable retry không crash; database disabled chặn route. Thiếu browser binary được báo là blocker thay vì tự cài |
| 11 | `npm run test`; `npm run test:coverage`; `npm run typecheck`; `npm run lint`; `npm run build`; `npm run test:e2e`; `npm run audit:dependencies`; `git diff --check`; `git status --short` | Không regression. Hai advisory Router 6 chỉ được ghi nhận là residual risk nếu không đổi; live CORS/readiness vẫn ghi BLOCKED |

Kiểm thử live với backend không được tuyên bố thành công cho đến khi `BE-001` và `BE-006` được xử lý. Mocked unit/E2E test chỉ xác nhận hành vi frontend theo contract.

## G. Rủi ro và rollback

### Rủi ro chính

1. **Worktree chưa commit:** nhiều file nền tảng đang untracked/modified; Git không thể khôi phục an toàn mọi file bằng checkout.
2. **Health không phản ánh readiness thực:** frontend chỉ có thể fail-closed với `database=disabled` được trả về; không thể phát hiện database hỏng nếu backend vẫn hard-code `UP`.
3. **CORS live bị chặn:** unit/browser interception có thể đạt trong khi trình duyệt thật vẫn không gọi được backend.
4. **Refine version mismatch với yêu cầu chung:** code phải theo core v4.58.0 đang cài; dùng API v5 sẽ tạo lỗi type/runtime.
5. **Public diagnostics:** metadata môi trường/profile có thể bị xem là thông tin vận hành nhạy cảm.
6. **Async race:** retry hoặc StrictMode có thể tạo request trùng/stale result nếu orchestration không cleanup đúng.
7. **Router residual advisory:** chưa có bản vá tương thích tự động trong stack được duyệt.
8. **Playwright browser availability:** package đã có nhưng browser binary có thể thiếu trong máy hiện tại.

### Cách rollback và bảo vệ thay đổi hiện có

- Trước mỗi công việc, lưu status/diff read-only và kiểm tra nội dung target file.
- Mỗi công việc chỉ chạm đúng file ở một dòng của bảng; nếu thấy overlap mới, dừng và xin duyệt lại.
- Không dùng `git reset --hard`, `git checkout --`, `git clean`, `npm audit fix` hoặc thao tác destructive tương đương.
- Với file sửa, rollback bằng inverse patch đúng các hunk do công việc đó tạo; không phục hồi cả file từ `HEAD` vì có thể xóa migration của người dùng.
- Với file mới, chỉ xóa đúng file của lát cắt khi người dùng yêu cầu rollback; không xóa cả thư mục hoặc glob.
- Sau mỗi bước, targeted tests phải đạt. Nếu không đạt và chưa tìm được fix đúng scope, rollback riêng bước đó, giữ nguyên lịch sử/status trong `PLAN.md`, báo nguyên nhân và dừng.
- Nếu backend contract hoặc yêu cầu quyền truy cập diagnostics thay đổi, cập nhật mục D/E, giải thích impact và xin phê duyệt lại trước khi tiếp tục.

## H. Đề xuất bước bắt đầu

Sau khi được phê duyệt, bắt đầu bằng **Công việc 01 — khóa baseline**, vì worktree hiện chứa migration chưa commit và đây là điều kiện để không ghi đè thay đổi của người dùng. Công việc code đầu tiên sau đó là **Công việc 02 — chuẩn hóa health contract và test**, vì toàn bộ state machine, UI và router gate phụ thuộc vào contract này.

File kế hoạch đã được tạo tại `PLAN.md`. Chưa có file code nào được tạo/sửa/xóa và chưa có lệnh cài đặt, build, test hoặc migrate nào được chạy trong lượt lập kế hoạch.

**Yêu cầu phê duyệt:** Bạn có đồng ý với kế hoạch này, bao gồm các giả định ở mục D, hay cần chỉnh sửa gì trước khi bắt đầu?
