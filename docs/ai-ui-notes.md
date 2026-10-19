# Kế hoạch Triển khai Giao diện Tính năng AI (LogisticsX TMS)

Tài liệu ghi nhận kế hoạch kiến trúc, phân chia file, các mặc định an toàn đã chọn cho hai tính năng AI:
1. **AI hỏi (gap)**: Phát hiện và hiển thị thông tin thiếu/mâu thuẫn trên đơn hàng (load), đưa ra câu hỏi gợi ý và cơ chế điền nhanh.
2. **AI điều phối (dispatch)**: Hiển thị gợi ý ghép xe/tài xế theo bảng xếp hạng tối ưu kèm tiện ích để điều phối viên Phê duyệt (Approve) hoặc Từ chối (Reject).

---

## 1. Hiện trạng & Baseline (Giai đoạn 0)
- **Branch**: `refactor/global-structure`.
- **Working tree**: Giữ nguyên tài liệu phiên trước (`docs/lark-base-integration-baseline.md`, `docs/lark-base-mapping.md`).
- **Baseline kiểm thử ban đầu**:
  - `npm run build`: PASS (0 lỗi, built in 1.46s).
  - `npm run lint`: PASS (0 lỗi).
  - `npx vitest run`: 1.204 passed / 1 failed (177 test files). Test fail là `FleetReportPage.test.tsx` do timeout khi chạy song song tải cao; khi chạy đơn lẻ đạt 19/19 passed.
- **Tình trạng hợp đồng Backend**:
  - Kiểm tra backend repo `logictics_api`: Chưa có `docs/ai-gap-dispatch-api-contract.md` và chưa có controller/OpenAPI cho các endpoint AI mới.
  - Áp dụng quy tắc: Xây dựng lớp API + Types tạm trong thư mục `src/api/ai/` kèm đánh dấu `TEMP`, cung cấp mock adapter in-memory để chạy và test độc lập.

---

## 2. Kế hoạch Tổ chức Mã nguồn (File Plan)

Tuân thủ cấu trúc phân tầng mới của dự án (`AGENTS.md`):

### 2.1. Lớp API & Type tạm (`src/api/ai/`)
- `src/api/ai/ai.types.ts`: Toàn bộ TypeScript interfaces & types tạm thời cho AI Features, Gap, Dispatch Suggestions, Capabilities, Overview, Runs. Đánh dấu `// TEMP: API types v0 contract`.
- `src/api/ai/ai.api.ts`: Danh mục endpoints, query keys, và client functions gọi API.
- `src/api/ai/ai.mock.ts`: Dữ liệu mẫu (mock data generator) và mock client adapter mô phỏng trọn vẹn vòng đời backend (debounce, polling, 409 error, 429 rerun, approve, reject).
- `src/api/ai/fieldKeyMapping.ts`: File duy nhất ánh xạ `fieldKey` từ backend gap sang `form field ID / name` trên giao diện `LoadForm`.

### 2.2. Lớp Custom Hooks (`src/hooks/ai/`)
- `src/hooks/ai/useAiFeatures.ts`: Đọc cờ tính năng `GET /ai/features` (`enabled`, `dryRun`).
- `src/hooks/ai/useLoadAiGaps.ts`: Quản lý danh sách gap của load, trạng thái `aiState` (`debouncing`, `running`, `idle`, `disabled`, `error`), cơ chế poll backoff thông minh (dừng khi idle/error/tab ẩn), hành động dismiss và rerun (xử lý 429 `retryAfterSeconds`).
- `src/hooks/ai/useLoadAiDispatch.ts`: Quản lý gợi ý điều phối (`dispatchState`, expiration countdown, approve với xử lý 409, reject với lý do 3-500 ký tự và thay thế tài xế).
- `src/hooks/ai/useLoadsAiOverview.ts`: Hook gộp gọi `GET /loads/ai-overview` theo danh sách tối đa 100 load IDs hiển thị trên bảng.
- `src/hooks/ai/useAiRuns.ts`: Lấy lịch sử chạy AI `GET /ai/runs`, kiểm soát nghiêm ngặt theo `capabilities.canViewRuns`.

### 2.3. Lớp Giao diện UI (`src/components/ai/`)
- `src/components/ai/AiFeatureBanner.tsx`: Banner thông báo chế độ thử nghiệm nhẹ nhàng khi `dryRun = true`.
- `src/components/ai/LoadAiGapsSection.tsx`: Khu vực AI hỏi — danh sách gap chặn (blocking) và cảnh báo (warning), nút "Điền thông tin" scroll và focus trường form, dialog bỏ qua (dismiss) cho warning, trạng thái `needs_human`.
- `src/components/ai/LoadAiDispatchSection.tsx`: Khu vực AI điều phối — hiển thị trạng thái theo `dispatchState` (`blocked_by_gap` có link tới khu gap), thẻ ứng viên với điểm tiện ích 4 thanh số có nhãn chữ, nhãn nguồn xếp hạng (LLM / fallback), dialog Approve & Reject.
- `src/components/ai/LoadAiPanel.tsx`: Container tích hợp cả hai khu vực hiển thị trong màn hình Chi tiết Load (`LoadShow`).
- `src/components/ai/AiRunHistoryDrawer.tsx`: Drawer xem lịch sử chạy AI, bảng chi tiết chỉ hiển thị token/chi phí khi có quyền.
- `src/components/ai/LoadAiOverviewBadge.tsx`: Badge nhỏ hiển thị trên bảng danh sách đơn hàng (`LoadList`).

---

## 3. Các Mặc định An toàn Đã chọn (Safe Defaults)
1. **Bảo mật dữ liệu AI (XSS Prevention)**: Mọi trường text do AI sinh (`question`, `aiReasoning`, `summary`, `reasons`) đều render bằng React Text thuần (`Typography.Text`, `span`), tuyệt đối không dùng HTML injection hoặc dangerouslySetInnerHTML.
2. **Cách ly Cache Đa Tenant**: Query key luôn bao gồm `tenant?.tenantKey` và `user?.id`. Tuyệt đối không gửi `tenantId` thủ công từ client lên query params/body (backend tự trích từ Bearer token).
3. **Phân quyền theo Capabilities**: Toàn bộ UI action dựa trên cờ `capabilities` từ response (`canRerun`, `canApprove`, `canReject`, `canViewRuns`). Không hardcode kiểm tra role string.
4. **Xử lý 429 Khi Chạy lại**: Nếu nhận HTTP 429, đọc `retryAfterSeconds` (hoặc header `Retry-After`) và đếm ngược hiển thị trên nút rerun trước khi cho phép bấm lại.
5. **Chống Bấm Đúp**: Mọi nút kích hoạt action mutation (Approve, Reject, Dismiss, Rerun) đều chuyển sang `loading={true}` và `disabled={true}` trong khi mutation đang pending.
6. **Không UI Autonomous**: Chỉ hiển thị nhãn trạng thái chế độ HITL (Human-in-the-Loop), không cung cấp nút/toggle bật Autonomous.
