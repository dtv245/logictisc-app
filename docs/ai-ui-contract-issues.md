# Đối chiếu Hợp đồng API AI Thực tế (Backend Contract Real vs v0 Draft)

Tài liệu này ghi nhận việc đối chiếu chi tiết giữa **Bản nháp v0 ban đầu** và **Hợp đồng Backend thật đã triển khai** (tại `logictics_api/docs/ai-gap-dispatch-api-contract.md` cùng các Spring Boot Controllers trong `com.company.logicstic.ai.*`).

---

## 1. Bảng Đối chiếu Đường dẫn Endpoints (API Endpoints Comparison)

| Nghiệp vụ | Bản v0 Nháp ban đầu | Backend Thật (`logictics_api`) | Trạng thái thích ứng của Frontend |
|---|---|---|---|
| **Cờ tính năng** | `GET /ai/features` | `GET /api/ai/features` và `GET /api/ai/config` | Frontend gọi `/api/ai/features`, fallback đọc `/api/ai/config` và mock store. |
| **Danh sách AI Gaps** | `GET /loads/{id}/ai-gaps` | `GET /api/ai/gaps?loadId={id}` | Frontend chuẩn hóa sang `GET /api/ai/gaps?loadId=...`. Đồng thời unwrap envelope `ApiResponse<AiGapView.Summary>`. |
| **Kích hoạt kiểm tra Gap** | *(Chưa định nghĩa)* | `POST /api/ai/gaps/check` | Đã thêm vào `aiEndpoints.checkGaps` nhận `{ loadIds: [...] }`. |
| **Bỏ qua Gap cảnh báo** | `POST /loads/{id}/ai-gaps/{gapId}/dismiss` | `POST /api/ai/gaps/{id}/dismiss` | Chuẩn hóa sang `POST /api/ai/gaps/{id}/dismiss` với body `{ reason: "..." }`. |
| **Trả lời / Giải quyết Gap** | *(Chưa định nghĩa)* | `POST /api/ai/gaps/{id}/answer` | Đã thêm vào `aiEndpoints.answerGap` với body `{ value, confirmProposed, notes }`. |
| **Kích hoạt chạy Dispatch** | *(Không rõ)* | `POST /api/ai/dispatch/runs` | Định nghĩa `aiEndpoints.dispatchRuns` với body `{ loadId, mode: "HumanInTheLoop", maxSuggestions: 5 }`. |
| **Trạng thái AI Load** | `GET /loads/{id}/ai-dispatch` | `GET /api/ai/loads/{loadId}/status` | Chuẩn hóa sang `GET /api/ai/loads/{loadId}/status`. Trả về `gapStatus`, `blockingGapsCount`, `dispatchStatus`, `capabilities`. |
| **Phê duyệt đề xuất xe** | `POST .../approve` | `POST /api/ai/dispatch/decisions/{id}/approve` | Chuẩn hóa sang `POST /api/ai/dispatch/decisions/{id}/approve` với body `{ notes?: string }`. |
| **Từ chối đề xuất xe** | `POST .../reject` | `POST /api/ai/dispatch/decisions/{id}/reject` | Chuẩn hóa sang `POST /api/ai/dispatch/decisions/{id}/reject` với body `{ reason: string }` (bắt buộc 3–500 ký tự). |
| **Tổng quan danh sách Load** | `GET /loads/ai-overview` | `POST /api/ai/loads/overview` | Chuẩn hóa sang `POST /api/ai/loads/overview` với body `{ loadIds: [...] }` (tránh giới hạn độ dài URL khi truyền 100 UUIDs). |
| **Chạy lại AI theo Load** | `POST /loads/{id}/ai-gaps/rerun` | `POST /api/ai/loads/{loadId}/rerun` | Chuẩn hóa sang `POST /api/ai/loads/{loadId}/rerun` với body `{ target: "gap" \| "dispatch" \| "both" }`. |
| **Lịch sử chạy AI (Audit)** | `GET /ai/runs` | `GET /api/ai/runs` | Chuẩn hóa sang `GET /api/ai/runs?loadId=...&page=0&size=20`. |

---

## 2. Đối chiếu Định dạng Dữ liệu & Enums (Data Models & Enums)

### 2.1 Cấu trúc Envelope
- **Backend Thật**: Toàn bộ response tuân theo cấu trúc chuẩn `ApiResponse<T>`:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "...",
    "data": { ... },
    "errors": [],
    "meta": { "timestamp": "...", "path": "...", "version": "v1" }
  }
  ```
- **Xử lý phía Frontend**: Lớp transport `src/api/ai/ai.api.ts` tự động bóc tách envelope qua `res.data?.data ?? res.data`.

### 2.2 Phân hệ Gaps
- **Trường tên thuộc tính**:
  - Backend: `fieldName` (ví dụ: `originLocationLatitude`, `deliveryCostAmount`, `notes`).
  - Bản nháp v0: `fieldKey` và `fieldLabel`.
  - **Frontend thích ứng**: Chuẩn hóa đa tầng `gap.fieldName ?? gap.fieldKey ?? ""`, ánh xạ đầy đủ 12 trường của `GapRuleEngine.java` qua `FIELD_KEY_TO_FORM_MAP` trong `src/api/ai/fieldKeyMapping.ts`.
- **Trường câu hỏi**:
  - Backend: `questionNatural` (câu hỏi tự nhiên do LLM sinh) và `questionTemplate` (mẫu câu hỏi tĩnh).
  - Bản nháp v0: `question`.
  - **Frontend thích ứng**: Ưu tiên `gap.questionNatural ?? gap.questionTemplate ?? gap.question`.
- **Mức độ (Severity)**:
  - Backend: `BLOCKING`, `WARNING` (In hoa).
  - Bản nháp v0: `blocking`, `warning` (In thường).
  - **Frontend thích ứng**: Chuẩn hóa `.toUpperCase()` khi so sánh logic, kiểu TypeScript hỗ trợ `AiGapSeverity = "BLOCKING" | "WARNING" | "blocking" | "warning"`.
- **Trạng thái (Status)**:
  - Backend: `OPEN`, `RESOLVED`, `DISMISSED`, `NEEDS_HUMAN`.
  - Bản nháp v0: `open`, `resolved`, `dismissed`, `needs_human`.
  - **Frontend thích ứng**: Chuẩn hóa `.toUpperCase()` khi so sánh logic, kiểu TypeScript hỗ trợ cả hai tập giá trị.

### 2.3 Phân hệ Dispatch
- **Định danh đề xuất**:
  - Backend: `decisionId` (UUID của `AiDispatchDecision`).
  - Bản nháp v0: `id` hoặc `suggestionId`.
  - **Frontend thích ứng**: Hỗ trợ `candidate.decisionId ?? candidate.id`.
- **Thông tin xe**:
  - Backend: `truckNumber` và `truckId`.
  - Bản nháp v0: `truckPlate`.
  - **Frontend thích ứng**: `candidate.truckNumber ?? candidate.truckPlate ?? "Xe chưa gán"`.
- **Điểm số tối ưu (Score)**:
  - Backend: `BigDecimal score` từ `0.0` đến `1.0` (ví dụ: `0.88500000`).
  - Bản nháp v0: `0` đến `100`.
  - **Frontend thích ứng**: Tự động nhận diện nếu `score <= 1.0` thì nhân 100 hiển thị dạng `Math.round(score * 100)%`.
- **Phân bổ 4 Tiện ích (Breakdown 4 Utilities)**:
  - Backend: Cung cấp `metrics: { deadheadMiles, expectedMarginRatio, hosRemainingHours, onTimeProbability }`.
  - **Frontend thích ứng**: Tự động tính toán điểm 4 tiện ích từ `metrics` nếu không có sẵn mảng `utilities`, đảm bảo các thanh tiến trình hiển thị đúng số và nhãn chữ (Margin %, On-time %, Deadhead dặm, HOS giờ).

---

## 3. Danh mục Mã Lỗi Nghiệp vụ (Business Error Codes)

Frontend đã khai báo và xử lý chính xác các mã lỗi nghiệp vụ của Backend theo hợp đồng tại `src/api/ai/ai.types.ts` (`AI_ERROR_CODES`):

| Mã lỗi Backend | HTTP Status | Kịch bản xảy ra | Xử lý giao diện Frontend |
|---|---|---|---|
| `BLOCKED_BY_GAP` | 400 | Load còn gap BLOCKING chưa giải quyết, không thể chạy điều phối. | Hiển thị thẻ thông báo chặn kèm link cuộn tới danh sách Gap. |
| `GAP_NOT_FOUND` | 404 | Không tìm thấy gap tương ứng. | Thông báo lỗi không tìm thấy dữ liệu. |
| `GAP_CANNOT_DISMISS_BLOCKING` / `CANNOT_DISMISS_BLOCKING_GAP` | 400 | Người dùng cố tình gửi request bỏ qua gap chặn. | Chặn ngay ở UI (ẩn nút Bỏ qua), nếu API trả về thì hiện alert lỗi. |
| `GAP_ALREADY_RESOLVED` | 400 | Gap đã được người khác xử lý hoặc đã đóng. | Làm mới danh sách gaps. |
| `AI_DISPATCH_DISABLED` | 403 | Tính năng điều phối AI bị tắt ở hệ thống/tenant. | Ẩn toàn bộ UI khu điều phối theo cờ tính năng. |
| `AUTONOMOUS_MODE_LOCKED` | 400 / 403 | Yêu cầu chế độ Autonomous trong khi hệ thống chỉ hỗ trợ Human-in-the-Loop. | Frontend tuyệt đối không cung cấp tùy chọn Autonomous, chỉ hiển thị nhãn HITL. |
| `DECISION_NOT_PENDING` | 400 | Quyết định không ở trạng thái chờ duyệt (đã được duyệt/từ chối trước đó). | Thông báo và kích hoạt làm mới danh sách đề xuất. |
| `REJECTION_REASON_REQUIRED` | 400 | Từ chối đề xuất không có lý do hoặc lý do rỗng. | Form validation chặn ngay tại client (yêu cầu 3–500 ký tự). |
| `FEASIBILITY_FAILED` | 409 | Revalidation thất bại (HOS hết hạn, xe trùng lịch, GPS quá hạn). | Bắt lỗi 409, hiển thị alert màu đỏ nêu rõ `details.reasons` bằng tiếng Việt và làm mới đề xuất. |
| `LLM_BUDGET_EXCEEDED` / `RATE_LIMITED` | 429 | Hạn mức token hoặc tần suất gọi vượt ngưỡng. | Đọc `retryAfterSeconds` hoặc header `Retry-After`, đếm ngược thời gian chờ trên nút Chạy lại. |
| `LLM_PROVIDER_TIMEOUT` | 504 | LLM timeout, backend tự fallback về Optimization Engine. | Hiển thị nhãn nguồn xếp hạng "Xếp hạng theo điểm tối ưu" (`optimization_fallback`). |

---

## 4. Xác minh Thực tế & Điểm Lệch về Khung Chat và Cờ Tính năng (Session Diagnosis)

1. **Khung Chat LLM hai chiều tự do**:
   - **Thực tế Backend**: Backend Spring Boot (`com.company.logicstic.ai.*`) **hoàn toàn không có** endpoint chat tự do (`POST /api/ai/chat`). Hệ thống AI chỉ hoạt động theo cơ chế **Rule Engine + LLM câu hỏi đơn lập** (phát hiện gap và sinh `questionNatural` cho từng trường).
   - **Xử lý Frontend**: Loại bỏ ô nhập chat tự do giả lập ở client, giữ nguyên giao diện danh sách thẻ gap tương tác (có câu hỏi của AI, nút "Điền trên form" và nút "Bỏ qua"), kèm nhãn minh bạch: *"Dữ liệu được rà soát tự động theo bộ quy tắc vận tải LogisticsX"*.

2. **Cờ tính năng & Xác thực `/api/ai/features`**:
   - **Thực tế Backend**: Endpoint `GET /api/ai/features` yêu cầu xác thực Bearer Token (`401 UNAUTHORIZED` nếu gọi bằng axios trơn không có header). Cờ mặc định trong `application.yml` là `app.ai.gap-enabled: false`.
   - **Xử lý Frontend**:
     - Bổ sung `getAuthHeaders()` tự động gắn `Authorization: Bearer <token>` vào mọi request.
     - Xử lý trạng thái hiển thị thông minh: Ở môi trường `DEV`, nếu cờ tắt hoặc lỗi mạng/401, widget vẫn hiển thị nút xám kèm Tooltip nêu rõ nguyên nhân (thay vì âm thầm trả về `null` gây khó hiểu cho lập trình viên/quản trị viên).
     - Render widget qua React Portal (`createPortal(..., document.body)`) để triệt tiêu mọi nguy cơ bị clip hoặc đổi containing block bởi CSS cha của `.app-content`.

