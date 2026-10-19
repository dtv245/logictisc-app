# Lark Base — baseline Giai đoạn 0

Ngày chạy: 2026-10-16, múi giờ Asia/Ho_Chi_Minh. Phạm vi phiên: hoàn tất khảo sát/baseline, lập mapping nháp và **dừng tại Cổng duyệt 1** theo yêu cầu người dùng.

## 1. Mốc đầu phiên và bảo toàn công việc có sẵn

| Repo | Nhánh | HEAD đầu phiên | Trạng thái đầu phiên |
|---|---|---|---|
| `/home/vumoi/logictics-app` | `refactor/global-structure` | `cff6c8c89b80e5f5501feb4747caf786722a55c8` | Sạch |
| `/home/vumoi/logictics_api` | `main` | `45a136c34cc8381e35860db1088d228b196acb49` | 4 file tracked đã sửa; 27 file untracked |

Đã chạy `git status --short --branch`, `git diff --stat`, `git diff` ở cả hai repo trước mọi thay đổi. Đã đọc AGENTS.md của hai repo. Yêu cầu mới cho phép khảo sát trên backend có thay đổi dở và yêu cầu giữ nguyên chúng; không áp dụng thao tác dọn cây.

Snapshot tại `/tmp/larkbase-baseline-20261016/initial-state.json` giữ HEAD, status đầy đủ, hash diff và SHA256 của 955 file frontend, 1.857 file backend do Git liệt kê (tracked + untracked không bị ignore). Không lưu nội dung `.env` hay credential trong snapshot. Chưa commit/push/stage, không revert/reset/stash/format hay xóa file có sẵn.

Chỉ tạo hai tài liệu frontend trong phiên: tài liệu này và `docs/lark-base-mapping.md`. Không sửa file mã nguồn/cấu hình backend hay frontend. Maven/Vite/Vitest/analysis sinh build artifact/cache trong thư mục bị ignore; không thay đổi source.

## 2. Danh sách đầy đủ file backend chưa commit từ trước

Tất cả 31 file dưới đây thuộc phần webhook/event hoặc cấu hình/test/migration hỗ trợ nó; đây là công việc có sẵn, không phải implementation mới của phiên này.

Tracked đã sửa:

```text
.env.example
src/main/java/com/company/logicstic/config/SecurityConfig.java
src/main/java/com/company/logicstic/integration/lark/config/LarkProperties.java
src/main/resources/application.yml
```

Diff tracked: 37 dòng thêm, 1 dòng xóa. Nội dung liên quan gồm biến môi trường credential webhook để trống, public route POST `/api/lark/events`, thuộc tính verification token/encrypt key và cấu hình xử lý inbox/retry.

Untracked:

```text
src/main/java/com/company/logicstic/integration/lark/event/LarkBaseRecordChangedEvent.java
src/main/java/com/company/logicstic/integration/lark/event/LarkBaseRecordChangedHandler.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventConfiguration.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventController.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventDeduplicator.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventDispatcher.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventExecutor.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventHandler.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventMaintenance.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventProcessingProperties.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventSecurity.java
src/main/java/com/company/logicstic/integration/lark/event/LarkEventTenantScope.java
src/main/resources/db/migration/tenant/V41__create_lark_event_receipts.sql
src/main/resources/db/migration/tenant/V42__persist_lark_event_inbox.sql
src/test/java/com/company/logicstic/integration/lark/event/LarkBaseRecordChangedHandlerTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventConfigurationTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventControllerTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventDeduplicatorPostgresTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventDeduplicatorTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventEndpointSecurityTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventInboxTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventSecurityTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventTenantScopeTest.java
src/test/java/com/company/logicstic/integration/lark/event/LarkEventTestSupport.java
src/test/java/com/company/logicstic/integration/lark/event/MutableLarkEventClock.java
src/test/resources/lark/documented-record-changed.json
src/test/resources/lark/official-encrypted-example.json
```

Phân nhóm: 12 file main Java, 2 migration, 11 file test Java (gồm helper), 2 fixture. Không chỉnh sửa hoặc đưa các file này vào stage.

## 3. Luồng dữ liệu hiện tại đã đối chiếu source

### TMS → Base và đọc danh sách

1. `POST /api/lark/base/sync/load/{loadId}` hoặc `/sync/driver/{employeeId}` vào `LarkBaseController`.
2. `LarkBaseService` tải Load/Employee từ tenant database qua repository, dựng map với tên cột hardcode. Hai hàm dùng transaction read-only ở DB nhưng có tác dụng ghi sang provider.
3. `LarkBaseTokenProvider` lấy tenant access token bằng app credential, cache trong bộ nhớ và lấy lại khi gần hết hạn. Không trả credential cho frontend.
4. Service luôn gọi `LarkBaseClient.createRecord`; provider trả record ID nhưng hệ thống không lưu liên kết. Client có `updateRecord`/`deleteRecord` sẵn, chưa được nối vào luồng sync. Chưa có upsert, hash/trạng thái đồng bộ hay lịch sử lỗi theo thực thể.
5. `GET /api/lark/base/loads` đọc danh sách record từ Base, không phải danh sách load kèm trạng thái sync tại TMS. Client nhận được `has_more`/`page_token` nhưng chỉ trả `items`, làm mất metadata phân trang ở response controller.
6. `LarkFailurePolicy` có phân loại timeout, lỗi provider, rate limit và Retry-After; chưa thấy retry/backoff cho thao tác ghi Base. Retry/backoff của webhook là luồng riêng.

### Base → webhook

1. `POST /api/lark/events` đi qua public matcher, sau đó `LarkEventSecurity` tự xác thực provider. Cấu hình có encrypt key thì kiểm tra chữ ký trên raw body/timestamp/nonce và giải mã; có verification token thì so token. Thiếu cả hai credential thì từ chối nhận.
2. URL verification trả challenge sau xác thực. Event schema 2.0 hợp lệ được `LarkEventDispatcher` đưa vào bảng receipt/inbox trước ACK.
3. Inbox loại trùng theo event ID, worker riêng xử lý bất đồng bộ; poller khôi phục công việc, có lease/renewal, backoff giới hạn và DEAD status. Routing tenant lấy từ cấu hình server, không lấy từ payload.
4. `LarkBaseRecordChangedHandler` xử lý `drive.file.bitable_record_changed_v1`, so file token với Base cấu hình, đọc added/edited/deleted, giữ before/after field values và phát `LarkBaseRecordChangedEvent` nội bộ.
5. Khảo sát toàn bộ Java source không thấy listener nhận sự kiện đó để cập nhật Load/Employee. Không có bằng chứng đồng bộ hai chiều, chống vòng lặp theo nội dung hoặc xử lý xung đột nghiệp vụ đã hoàn tất.

### Frontend

Tìm theo `LarkBase`, `lark/base`, `bitable`: hiện chỉ có type sinh sẵn trong `src/types/handoff.generated.ts`; chưa có API/hook/component/màn hình sync. Script hiện hữu là `python3 scripts/generate-handoff-types.py`, đọc bundle OpenAPI cùng manifest và semantic notes. Chưa chạy sinh type vì chưa có API mới và chưa qua Cổng duyệt 1.

## 4. Bộ kiểm tra thực chạy trong phiên

Wrapper lưu lệnh, exit code, thời gian và log riêng cho từng check tại `/tmp/larkbase-baseline-20261016/`. Khi chạy check, bỏ credential Lark inherited và vô hiệu hóa config import thực qua environment; không nạp `.env` để gọi provider. Không thay đổi package/lockfile/POM hay test fixture. Mặc định xác thực của repo được giữ trong lượt backend được dùng chốt baseline; xem ghi chú lượt đầu bên dưới.

| Repo / check | Lệnh thực chạy | Exit | Kết quả gốc |
|---|---|---|---|
| FE build | `npm run build` | 0 | PASS; tsc + Vite |
| FE lint | `npm run lint` | 0 | PASS |
| FE test | `npx vitest run --reporter=json --outputFile=/tmp/larkbase-baseline-20261016/frontend-tests.json` | 1 | 177 file; 1.205 test: 1.204 pass, 1 fail, 0 skip |
| BE build | `./mvnw -B -DskipTests package` | 0 | PASS; package, không chạy test; lần build này dùng class đã có. Full clean verify bên dưới đã biên dịch lại rồi dừng ở Surefire vì test lỗi. |
| BE lint | `./mvnw -q org.apache.maven.plugins:maven-checkstyle-plugin:3.3.1:check` | 1 | FAIL; quét 483 file, 472 file có tổng 23.782 vi phạm, dùng luật mặc định của plugin như tài liệu repo |
| BE static analysis | `./mvnw -q com.github.spotbugs:spotbugs-maven-plugin:4.8.2.0:check -Dspotbugs.maxHeap=512` | 1 | FAIL; 482 finding, 0 lỗi analyzer |
| BE full build/test, lượt chốt baseline | `python3 scripts/verify_backend_regression.py --container codex-remediation-d64b178496b7 --port 32768` | 1 | Maven `clean verify` exit 1; 120 suite file, 745 test: 732 pass, 3 failure, 10 error, 0 skip |
| BE runner test | `python3 -m unittest discover -s scripts/tests -v` | 0 | 26 pass, 0 fail |

`pom.xml` không có lint script hoặc binding Checkstyle/SpotBugs. Hai lệnh static trên lấy đúng từ `docs/lark-employee-login.md` của backend; không dùng `clean verify` để suy lint đã đạt.

Frontend failure: `src/tests/components/resourceFormBackendErrors.test.tsx:183`, case `ResourceCreateModal — lỗi field từ backend / gắn được nhiều field cùng lúc`, không tìm thấy thông báo “Tên không được để trống”. Ghi lại nguyên trạng, không sửa mã/test hoặc tăng timeout. Bản `docs/restructure/PROGRESS.md` trước đó ghi 1.205 pass; baseline thực chạy phiên này vẫn có đủ 1.205 test nhưng 1 lỗi, nên không gọi bộ kiểm tra xanh. Vitest JSON đếm cả describe suites thành 450 suite; số file thực là 177, không báo nhầm thành 450 file.

Backend test dùng container `codex-remediation-d64b178496b7`, nhãn disposable, bind loopback port 32768. Script có các test tạo thêm database disposable riêng; không dùng `logistics-postgres` hoặc DB làm việc. Target migration là V42, gồm các migration webhook chưa commit. Container được giữ lại theo mặc định script, không tự xóa.

Lượt chốt baseline: DB `codex_regression_20261016011421715355`, diagnostics `/tmp/logisticsx-regression-8saa9b_0/maven.log`, metadata và tổng hợp tại `/tmp/larkbase-baseline-20261016/backend-test-corrected.json`. Maven thất bại tại Surefire, runner không tới cổng kiểm chứng artifact/Flyway cuối; không coi log có migration thành công là toàn bộ gate đã đạt.

Ba suite lỗi, đều thuộc phần webhook/event có sẵn:

| Suite | Tổng | Pass | Failure | Error |
|---|---:|---:|---:|---:|
| `LarkEventInboxTest` | 6 | 0 | 0 | 6 |
| `LarkEventDeduplicatorTest` | 3 | 0 | 0 | 3 |
| `LarkEventControllerTest` | 7 | 3 | 3 | 1 |

Triệu chứng gồm H2 check constraint `CK_LARK_EVENT_RECEIPT_STATUS` báo invalid/database closed khi insert, `Event receiver unavailable`, và HTTP 503 thay vì 200. Chưa kết luận nguyên nhân gốc và chưa sửa helper/migration/source. Nhóm Lark Base hiện có 4/4 test pass; nhóm webhook/event có 25 pass, 3 failure, 10 error trên 38 test; các suite mang tên `*PostgresTest` có 232 test pass, 0 failure/error/skip. Các số này là thành phần của tổng 745, không cộng thêm vào tổng. Chưa có test chứng minh upsert hay đồng bộ hai chiều vì các luồng đó chưa được triển khai.

**Lượt backend đầu không dùng chốt baseline:** `python3 scripts/run_isolated_remediation.py` tạo container trên và DB `codex_regression_20261016010921617644`, exit 1, 745 test: 682 pass, 5 failure, 58 error, 0 skip. Harness ban đầu đặt thêm `LARK_ENABLED=false`, làm các test auth dựa trên mặc định repo bị lỗi “Lark authentication is disabled”; không quy các lỗi này cho source có sẵn. Đã bỏ override đó (và override Base enabled không cần thiết), giữ nguyên log `/tmp/logisticsx-regression-6ofwabdv/maven.log` cùng `backend-test.json`, rồi chạy runner kiểm chứng trên **database mới** trong cùng server disposable. Không sửa test/source để xử lý sự cố môi trường chạy. Hai báo cáo static đã sao chép sang thư mục evidence trước lượt `clean` tiếp theo, không cần chạy lại vì source không đổi.

## 5. Điểm cần xử lý sau Cổng duyệt 1

- Chưa có schema thật. Xem toàn bộ mapping/điểm thiếu và câu hỏi phê duyệt trong `docs/lark-base-mapping.md`; không coi tên field trong code hoặc fixture là schema Base đã xác minh.
- Upsert phải bảo vệ cả gọi đồng thời và retry sau timeout/partial failure; lưu `record_id` đơn thuần chưa đủ chống trùng. Record cũ không có UUID/link cần cách nối được người dùng duyệt.
- Xác nhận tài xế hợp lệ: API hiện nhận Employee bất kỳ; searchDrivers hiện chưa lọc thực sự theo DRIVER.
- RBAC: `/api/lark/base/**` hiện chỉ rơi vào fallback authenticated; cần role/scope rõ trước khi mở nút sync. Không tự quyết role nghiệp vụ ở phiên baseline.
- Cờ `LarkBaseProperties.enabled` hiện không được service kiểm tra trước ghi Base. Cần cơ chế giới hạn sandbox/tenant phù hợp trước khi chạy ghi thật.
- Không tự map trạng thái, tách họ/tên, phân giải quan hệ theo tên, hoặc ghi ngược các field tài chính/nhân sự chưa được duyệt.
- Chưa chứng minh field Person/DateTime/Select của Base thật; format tên/ISO hiện tại chỉ đúng nếu schema đích tương thích.
- GitNexus query không trả flow; context bị lỗi storage version `42` so với runtime `40`. Đã dùng source search/read để đối chiếu, chưa sửa/reindex graph. Trước implementation phải xử lý khả năng impact analysis theo AGENTS.md backend.
- **Kiểm thử Lark thật: CHƯA CHẠY**. Người dùng giới hạn chỉ đọc cấu hình cục bộ; Base token/table IDs là placeholder, chưa xác nhận sandbox. Không có lần ghi provider nào trong phiên.

## 6. Kế hoạch commit để người dùng duyệt sau

Hiện chưa tạo commit và chưa xin duyệt commit implementation chưa tồn tại. Cách chia dự kiến, cần chốt lại theo diff cuối:

1. FE docs: `docs(lark-base): record baseline and approved field mapping` — tài liệu baseline/mapping; chỉ gọi mapping approved sau khi người dùng đã duyệt.
2. BE webhook: `feat(lark): add durable verified event inbox` — phần thay đổi có sẵn, review và xác minh độc lập, không nhận là code mới của phiên này.
3. BE sync: `feat(lark-base): persist idempotent load and driver sync` — migration mới/link, upsert/retry/status API, OpenAPI và test; xử lý inbound theo quyết định đã duyệt.
4. FE integration: `feat(lark-base): show load sync status and retry actions` — API/hook/component, generated types qua script và test. UI tối thiểu nằm trong màn hình hiện có; hỏi lại nếu cần thêm màn hình phức tạp.
5. Verification docs nếu cần: bằng chứng so baseline và checklist Lark thử nghiệm.

Không trộn việc dời file với sửa logic; không push. Không commit nhóm webhook có sẵn nếu chưa được người dùng duyệt rõ phạm vi.

## 7. Đối chiếu cuối Giai đoạn 0–1

Đã đối chiếu lại toàn bộ hash file gốc và HEAD/diff/status backend với snapshot đầu phiên: không file gốc nào ở hai repo bị thay đổi; backend giữ nguyên cả 31 file chưa commit và đúng diff cũ. Frontend chỉ thêm hai tài liệu nêu trên. Evidence máy đọc được: `/tmp/larkbase-baseline-20261016/preservation.json` và `summary.json`.

Giai đoạn 0 đã thu thập baseline thực tế, **bộ kiểm tra chưa xanh**. Giai đoạn 1 có mapping nháp nhưng chưa xác minh schema và chưa được duyệt. Giai đoạn 2–4 chưa triển khai; checklist kiểm thử thật đã soạn, mọi case Lark thật chưa chạy. Không có secret được thêm vào source/tài liệu; không gọi API Lark có credential và không ghi Base production/thử nghiệm.
