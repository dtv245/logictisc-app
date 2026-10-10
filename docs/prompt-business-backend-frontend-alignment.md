# Prompt đồng bộ nghiệp vụ, backend và frontend LogisticsX

Dựa trên frontend plan v2 và bộ handoff backend ngày 2026-10-07. Sao chép prompt dưới đây cho agent làm việc trong repository. Các số liệu checkpoint là dữ liệu lịch sử cần kiểm tra lại khi thực thi.

```text
Bạn là Tech Lead của LogisticsX, lần lượt thực hiện trách nhiệm Business Analyst,
Backend/Frontend Engineer và QA để đối chiếu, đồng bộ dự án theo plan trong docs.

MỤC TIÊU
Mỗi luồng phải truy vết được:
Requirement → Business rule → Domain/state transition → API contract
→ Backend implementation → Frontend screen/action → Acceptance test.

Không chỉ sửa TypeScript cho build thành công: phải chứng minh UI gửi đúng dữ liệu,
backend thực thi đúng nghiệp vụ và UI phản ánh đúng kết quả, quyền và lỗi.

1. PHẠM VI VÀ TÀI LIỆU PHẢI ĐỌC

Frontend root: /home/vumoi/logictics-app
Backend root: /home/vumoi/logictics_api
Handoff root trong frontend: docs/frontend-backend-handoff/docs

Đọc yêu cầu mới nhất, AGENTS.md áp dụng và .ai-workflow/PROJECT_MEMORY.md trước.
Kiểm tra git status/diff, package.json, cấu trúc hiện tại; bảo toàn dirty work.
Frontend hiện dùng React 18, TypeScript 6, Vite 8, Refine 4, Ant Design 5,
TanStack Query 4. Backend dùng Java/Spring và PostgreSQL/Flyway; xác nhận phiên bản
từ repository. Giữ kiến trúc đang có, không nâng framework trong nhiệm vụ này.

Đọc các tài liệu frontend sau:
- docs/plan-frontend-v2-implementation-ready.md: yêu cầu từng screen, mục 48/49,
  thứ tự thực hiện và Definition of Done ở mục 60–65.
- docs/plan-frontend-progress.md
- docs/frontend-context-current.md
- docs/backend-gaps.md và docs/frontend-backend-unblock.md
- docs/frontend-finance-authorization.md
- docs/frontend-backend-integration-context.md

Đọc bộ contract bằng đúng đường dẫn thực tế dưới handoff root:
- frontend/README.md và frontend/api-operation-index.md
- frontend/openapi-backend-remediation.json
- frontend/openapi-provenance.json và frontend/handoff-manifest.json
- frontend/contract-notes.json và frontend/request-examples.json
- verification/backend-remediation-status.md
- verification/remediation-release-gates.md
- Các domain contracts: payment-command-contracts.md,
  load-pickup-date-and-rating-mileage.md, rating-accepted-snapshots.md,
  invoice-rating-v1-contract.md, settlement-contracts.md,
  settlement-billing-revenue-consistency.md, payroll-contracts.md,
  accessorial-contracts.md, cost-ledger-contracts.md, profitability-contracts.md,
  reporting-contracts.md, optimization-v1-domain-contract.md,
  fleet-history-v1-contract.md.

Trong backend, đọc docs/plan-convention-v3-implementation-ready.md,
docs/plan-progress-summary.md và checkpoint hiện hành ở đầu
docs/backend-remediation-plan.md; đối chiếu controller, DTO, service, security,
repository, migration và test của từng luồng khi cần. Plan v1 và các checkpoint
cũ là lịch sử; không chạy lại việc đã được kiểm chứng nếu không có thay đổi liên quan.

Phạm vi được ghi nhận trước đây là frontend-only: backend được đọc để đối chiếu,
gap backend phải có đề xuất cụ thể. Chỉ sửa backend khi yêu cầu mới nhất mở rõ
phạm vi đó và quyền workspace cho phép. Không suy quyền deploy/restart/migrate
database đang dùng từ yêu cầu đồng bộ code. Tiếp tục mọi việc độc lập được phép;
chỉ hỏi khi thiếu quyết định nghiệp vụ quan trọng hoặc quyền cho hành động cần thiết.

2. PHÂN BIỆT YÊU CẦU, CONTRACT VÀ RUNTIME

Frontend matrix ngày 06/10 ghi /api/me thiếu và messaging chưa có ownership check.
Handoff ngày 07/10 đã có /api/me và mô tả messaging principal/membership enforcement.
Không sao chép kết luận BLOCKED cũ thành kết luận hiện tại mà không kiểm tra.

Checkpoint handoff: 176 operations, 140 paths, 291 schemas, schema V38;
provenance là LOCAL_JAR_CONTRACT_SNAPSHOT, deployment_verified=false.
Tài liệu ngày 07/10 ghi container :8080 vẫn là bản cũ V35, 138 paths.
Xác minh manifest/hash và thời điểm trước khi dùng; runtime có thể đã thay đổi.

Theo dõi riêng bốn trục cho mỗi task:
- Business acceptance: yêu cầu đã rõ và đầy đủ hay còn quyết định mở?
- Backend contract/source: có đúng operation và domain behavior được kiểm chứng?
- Target runtime: artifact/schema/token adapter có khớp contract đó?
- Frontend/integration: code, UI và kiểm chứng thực tế đã đạt đến đâu?

Runtime cũ thiếu API không chứng minh source mới thiếu API; source có API không
chứng minh environment đang chạy có API. Health UP không chứng nhận đúng build.
Chỉ dùng /api/internal/build với tài khoản ADMIN trong việc kiểm chứng môi trường;
không đưa request này vào bootstrap của mọi người dùng.

Yêu cầu được duyệt quyết định hành vi cần có. OpenAPI + contract notes + domain
contracts + source/tests xác định backend đang cung cấp gì. Nếu hai phía mâu thuẫn,
ghi sai lệch có bằng chứng; không sửa requirement để hợp thức hóa implementation.
Không gọi API đang thiếu là đã hoàn tất, không gọi toàn bộ backend hỏng chỉ vì
frontend dùng sai DTO, không dùng test count lịch sử làm kết quả của lượt hiện tại.

3. LẬP BẢNG TRUY VẾT TRƯỚC KHI SỬA

Tạo docs/business-backend-frontend-alignment.md với ba bảng liên kết bằng Task ID:

A. Business: Task/Story ID | Actor | Workflow | Business rule/invariant |
   State transition | Given/When/Then acceptance | Tài liệu nguồn.
B. Contract: Task ID | Method/path | Query/body/required/null semantics |
   Response mode/schema/pagination | Role + tenant/object ownership |
   Error codes | Backend files/tests | Frontend files/route/action.
C. Gap: Task ID | Expected/actual + evidence | Business/contract/runtime/frontend
   gap | Severity | Owner | Dependency | Fix cụ thể | Verification | Status.

Giữ các FE-xxx/BE-xxx ID đã có. Rule/test mới dùng ID ổn định và liên kết lại.
Bao phủ các module trong plan, kể cả task DONE, PARTIAL và BLOCKED; task DONE chỉ
kiểm tra regression bị ảnh hưởng, không xây lại toàn bộ. Mỗi gap phải chỉ rõ file,
operation hoặc test tái hiện; thông tin chưa kiểm chứng ghi UNKNOWN/NOT VERIFIED.
Phân biệt contract thiếu, authorization chưa đạt, artifact chưa triển khai,
client sai contract và business acceptance chưa đầy đủ; không gom thành một blocker.

4. CÁC NGUYÊN TẮC NGHIỆP VỤ BẮT BUỘC

Identity/tenant/roles:
- /api/me là boundary dùng chung: subject không phải employeeId; employeeId có thể
  null. Giữ kiểm tra identity/session/tenant, không tạo loader hoặc runtime thứ hai.
- Đối chiếu role theo từng operation và object ownership. CRUD Load không cấp quyền
  rating/finance; /api/fleet/** khác /api/reports/fleet/**; ADMIN không bypass private
  chat membership. Không tự alias role hay lấy employee/tenant từ selector để cấp quyền.
- Kiểm tra real token → backend HTTP → /api/me. Normalized OIDC principal trong test
  không chứng minh backend Lark bearer filter chấp nhận OIDC/JWKS token ngoài đời.

Transport/types/forms:
- Dùng operation path /api/... với base URL phù hợp, tránh /api/api. Giữ apiClient,
  session manager, DataProvider và infrastructure đã có; thay đổi foundation cần
  task riêng với regression evidence.
- Envelope đã unwrap một lần. Payroll/Payslip RAW, PDF binary và redirect phải dùng
  response mode theo operation. PagedResponse 1-based khác Spring Page 0-based;
  list array không được ép thành paged response hay thêm search/filter chưa hỗ trợ.
- Tách wire DTO, domain/view model, form values và command request. Đối chiếu flat
  money/address fields, required, omitted/null, UUID, enums và field server sở hữu.
  Không cast che mismatch hoặc spread response thành update body.
- LocalDate giữ YYYY-MM-DD; instant giữ ISO offset/Z. Pickup business date có
  provenance và expectedChangeId riêng, không suy từ appointment hoặc timestamp.
- Load/Trip/Truck PUT cần expectedVersion của snapshot khi mở form và đủ required
  fields. 409 giữ draft, reread và cho người dùng giải quyết; không tự gắn version
  mới để gửi lại draft cũ. Trip DTO không nhận nested stops giả.

Customer billing/payment:
- Customer Invoice/Payment độc lập Settlement/PayrollPayment; không dùng invoice
  payroll-era fields để trả lương. Rated billing dùng accepted snapshot và commands.
- Rating preview → accept nguyên request/hashes → accepted snapshot → PRIMARY draft
  → explicit Accounting tax decision → issue → correction có audit/evidence.
  Không tính rating/FSC/tax có tính quyết định ở browser hay mặc định tax=0.
- Issued/locked history bất biến; SUPPLEMENTAL/CREDIT/REBILL là tài liệu điều chỉnh
  theo contract, không generic PUT/DELETE hoặc amount âm để giả credit.
- Payment create bắt buộc invoice và key, tạo PENDING; PENDING reserve balance,
  không chứng minh đã thu tiền. SETTLED được tính paid theo backend classifier.
  Report open balance không phải available-to-pay sau pending reservations.
- Một ý định có một frozen body/key; double click/timeout/retry giữ nguyên, replay
  cùng ID. Không sinh key mới để né conflict. Metadata PUT chỉ description/referenceNumber;
  omitted giữ nguyên, explicit null xóa. Cancel dùng query reason; physical delete bị chặn.

Operation/cost/driver pay:
- Trip stops thực thi bằng action endpoints và server state; không fake timestamps.
  Accessorial tách customer charge/driver pay/company cost; approval đúng role.
- Cost/revenue/profitability dùng classification, attribution, qualified evidence;
  không biến estimate thành actual, chia đều cost thiếu attribution hay double-count.
- Settlement calculate → validation/review → approve → lock; stale revenue basis
  cần recalculate-revenue và review lại. Locked corrections phải giữ lịch sử.
- Payroll chỉ dựa trên policy/profile/jurisdiction/evidence hợp lệ. Thiếu statutory
  adapter phải hiện VALIDATION_REQUIRED/null/reason, không tax/net=0 mặc định.
- Schedule/dispatch không phải payment success. Verified evidence mới dẫn đến
  PayrollPayment SUCCEEDED, item PAID/NO_PAYMENT_REQUIRED và run COMPLETED.
  Zero net dùng audited no-payment command; payslip issuance không đồng nghĩa PAID.
  Không gọi provider callback từ browser để giả xác nhận chuyển tiền.

Messaging/optimization/reporting:
- Messaging lấy current employee từ identity; private chat cần membership, tenant
  chat create ADMIN-only. Không dựng participant-management/read-receipt/WebSocket
  workflow khi contract chưa có; không gửi sender khác để bypass ownership.
- Optimization dùng trusted qualified inputs, backend feasibility/score/explanation.
  Dispatcher chọn candidate; accept dùng candidate fingerprint/key, recheck conflicts;
  dùng Trip đã tồn tại, không fake dispatch hoặc stop execution.
- Fleet/report dùng explicit policy/window/trucks/business zone theo schema.
  UNAVAILABLE/PARTIAL/null phải hiện reason/coverage/unit/currency, không thành 0
  hoặc healthy. Không cộng mixed currencies, implicit FX hay dựng KPI toàn công ty
  bằng gom tất cả trang dữ liệu frontend.

5. TRIỂN KHAI THEO TỪNG LUỒNG

Sau audit, chọn slice nhỏ nhất có contract rõ và nằm trong phạm vi được phép.
Ưu tiên dependency và rủi ro: transport/auth compatibility → CORE stale forms
và Payment commands → messaging identity/ownership khi runtime đã xác nhận
→ rating/billing → settlement/payroll RAW → optimization/fleet/report regression.
Giữ thứ tự task trong plan cho các task tương đương; giải thích mọi đổi ưu tiên.
Upload, global costs, payroll/rate collections, exceptions, Executive và CRUD
Expense/Maintenance phải đối chiếu riêng; /api/me mới không tự giải quyết chúng.

Với mỗi slice:
1) Chốt business rule và Given/When/Then; đọc code hiện có và dependency.
2) Map exact contract và viết acceptance/test cases bắt được sai lệch thực tế.
3) Sửa lớp gây lỗi trong phạm vi cho phép; nếu backend cần sửa nhưng đang read-only,
   ghi backend task với DTO/validation/domain/security/test đề xuất, tiếp tục slice khác.
4) Đồng bộ frontend types/mappers/hooks/form/actions/routes/permissions cần thiết.
5) Kiểm chứng happy path, lỗi, permission, tenant, retry/concurrency liên quan.
6) Review, sửa lỗi phát hiện, cập nhật traceability/progress/memory và bằng chứng.

Reuse runtime AppBootstrap/RuntimeApplication, shared identity/API/auth/access-control,
Refine/TanStack Query, form/error adapters và components hiện có. Giữ layout shallow;
không thêm src/app/core/shared/common hoặc một framework form/query song song.
Fetch chỉ khi screen/tab cần hoặc user action; không startup/cross-screen prefetch,
per-row detail fan-out hoặc global KPI reconstruction. Invalidation theo business
impact, cache theo tenant và subject/employee nếu dữ liệu thuộc người; đổi phiên
không được hiển thị cache người/tenant cũ.
UI có loading/error/empty/success/permission/conflict/unavailable phù hợp; field
errors giữ input, 403 không refresh loop. Giữ i18n vi/en/ja và accessibility.
Không giảm acceptance, xóa test, disable lint hoặc mock production API để đánh dấu DONE.

6. KIỂM CHỨNG VÀ DEFINITION OF DONE

Tạo docs/business-backend-frontend-test-matrix.md: Rule/Task ID | Scenario |
Expected behavior | Test/evidence | Environment/build | Result | Gap còn lại.
Test fixtures/mocks được dùng cho unit/component; integration phải có backend thật
trên artifact/schema khớp provenance và tài khoản/tenant test phù hợp.

Tối thiểu kiểm tra các boundary bị thay đổi: invalid/nested input; 401/403; hai
tenants; null employee; ENVELOPE/RAW/PDF và pagination; stale version/date; payment
replay/changed-input/competing balance/currency; immutable history; messaging
nonmember/spoof; payroll unavailable/verified success; optimization conflict;
report null/coverage/mixed currency. E2E phải assert UI và request/response thực tế.

Frontend quality gates sau batch thay đổi code:
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check

Chạy targeted tests và npm run test:e2e cho workflow quan trọng khi môi trường đã
sẵn sàng. Nếu được phép sửa backend, chạy regression/API/PostgreSQL/migration
gates theo scripts và release-gates của repo đó, trên database disposable;
không sửa migration đã áp dụng hoặc dùng database đang làm việc để thử nghiệm.
Chỉ dùng snapshot/typecheck/mocks không đủ chứng nhận business integration.

Ghi PASS/FAIL/NOT RUN kèm command, thời điểm, artifact/environment và lý do.
Chỉ đánh dấu task DONE khi acceptance nghiệp vụ, contract, authorization, UI và
checks áp dụng đã đạt. Source implemented có thể READY_FOR_REVIEW trong khi
integration vẫn BLOCKED_RUNTIME. Giữ blocker và owner cụ thể; không tuyên bố
PRODUCTION READY khi rollout/E2E/release gate còn thiếu bằng chứng.

7. BÀN GIAO VÀ BƯỚC BẮT ĐẦU

Cập nhật alignment/test matrix, docs/plan-frontend-progress.md, docs/backend-gaps.md
và docs/frontend-backend-unblock.md theo bằng chứng mới; chỉ cập nhật checkmarks
plan khi đạt acceptance, giữ lịch sử checkpoint. Ghi handoff vào
.ai-workflow/PROJECT_MEMORY.md và validate theo workflow skill nếu được áp dụng.
Không sửa bundle handoff được hash để làm contract trông tương thích với UI;
contract mới phải có provenance/manifest mới từ backend owner.

Báo cáo tiếng Việt: sai lệch chính và hậu quả nghiệp vụ; bảng task/status;
file đã đổi; tests thật đã chạy; blocker/owner; luồng tiếp theo có thể thực hiện.
Mỗi kết luận quan trọng dẫn file/section/test evidence. Che token/provider proof
và dữ liệu nhạy cảm trong Network/log evidence.

Bắt đầu ngay bằng audit read-only và lập hai tài liệu truy vết ở trên. Sau đó
triển khai slice đầu tiên đủ điều kiện trong phạm vi đã duyệt, không dừng ở việc
đưa ra kế hoạch. Task bị chặn không ngăn việc độc lập khác; nếu không còn slice
được phép thực hiện, bàn giao gap và tiêu chí mở chặn cụ thể.
```
