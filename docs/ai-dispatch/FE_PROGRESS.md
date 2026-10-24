# AI Dispatch — Tiến độ frontend

- Ngày cập nhật: 24/10/2026.
- Frontend HEAD: `b5c85f0` (nhánh `feat/complete-ux-review-tasks-20261020`), cây làm việc bẩn từ trước phiên.
- Backend tham chiếu: `/home/vumoi/logictics_api`, nhánh `main`, HEAD `2bc3944`; module AI chưa commit.
- Hợp đồng: `docs/ai-dispatch/API_CONTRACT.md` — **bản đối soát từ source**, chờ chủ dự án ký xác nhận.
- Quyết định: `docs/ai-dispatch/05-contract-decisions.md`.
- Baseline FE-04: `npm run lint` exit 0 (4 warning, 0 error); `npm run build` exit 0; `npx vitest run` exit 0 — **1384 test / 209 file**.
- Kiểm tra FE-05: `npm run lint` exit 0 (4 warning, 0 error); `npx tsc -b` exit 0; `npm run build` exit 0; `npx vitest run` exit 0 — **1400 test / 211 file**.
- Kiểm tra FE-06: `npm run lint` exit 0 (4 warning, 0 error); `npx tsc -b` exit 0; `npm run build` exit 0; `npx vitest run` exit 0 — **1445 test / 213 file**.
- Kiểm tra FE-07: `npm run lint` exit 0 (4 warning, 0 error); `npx tsc -b` exit 0; `npm run build` exit 0; `npx vitest run` exit 0 — **1453 test / 214 file**. Lần chạy đầy đủ đầu tiên timeout 1 test có sẵn (`resourceEditModalAdvanced`, không liên quan); chạy riêng file đó pass và lần chạy đầy đủ thứ hai pass toàn bộ.

## Chú giải

- ✅ DONE: tiêu chí đạt, kiểm tra xanh.
- 🟡 PARTIAL: chỉ triển khai được một phần do backend thiếu endpoint; phần còn lại ghi rõ.
- ⛔ BLOCKED: không thể triển khai đúng kế hoạch với backend hiện tại; không được mock thay thế.
- ⬜ TODO: chưa làm, đủ điều kiện để làm.

## Bảng tiến độ

| Ticket | Trạng thái | Ghi chú |
|---|---|---|
| FE-04 — Chốt hợp đồng | ✅ | `API_CONTRACT.md`, `05-contract-decisions.md`, `FE_PROGRESS.md`; lint/build/test xanh. |
| FE-05 — Types/errors/JSON | ✅ | `src/types/aiDispatch.ts`, `src/utils/aiDispatchError.ts`, `src/utils/aiDispatchJson.ts` + 2 test; 16 test mới. |
| FE-06 — Constants/formatters | ✅ | `src/constants/aiDispatch.ts`, `aiDispatchStatus`, `aiDispatchFormat` + 2 test; 45 test mới. `rejectionCode` không có trong source nên chỉ map mã lỗi liên quan. |
| FE-07 — API client + cờ mock | ✅ | `src/lib/apiClient.ts` holder + `VITE_AI_DISPATCH_MOCK` default `false`; 8 test mới; không tạo client thứ hai, không mock adapter. |
| FE-08 — API/query keys | 🟡 | Chỉ OP-01…OP-08, OP-10…OP-13; không có bulk/trace/provider list. |
| FE-09 — Read hooks | 🟡 | Bỏ polling 2s; sessions/detail/features/runs/gaps theo load. |
| FE-10 — Create/cancel session | ✅ điều kiện | `POST /api/ai/dispatch/runs` đồng bộ; cancel không guard terminal. |
| FE-11 — Approve/reject | 🟡 | Không `Idempotency-Key`, không approve-all; chống đôi chỉ ở UI. |
| FE-12 — Gaps/usage hooks | 🟡 | Gaps theo `loadId`; usage từ `/api/ai/runs`, không aggregate. |
| FE-13 — Routes/nav metadata | ⬜ | Giữ alias cũ; chưa mount page mới. |
| FE-14 — Shared states/SCSS | ⬜ | `src/styles/ai-dispatch.scss`; không đụng file SCSS cũ đang dirty. |
| FE-15 — RunPanel | 🟡 | Một load, mode HumanInTheLoop, `maxSuggestions`, `instructions`; không provider selector, không phạm vi N giờ. |
| FE-16 — LiveSessionView | ⛔ | Không có session QUEUED/RUNNING; đổi thành `RunResultView` nếu chủ dự án duyệt. |
| FE-17 — TraceTimeline | ⛔ | API không trả trace/tool input/output. |
| FE-18 — DecisionCard/Score | 🟡 | Điểm/4 metric thật chỉ có trong `RunResult`; session detail/pending trả số cố định. |
| FE-19 — Approve/reject/bulk | ⛔ | Không có bulk; approve/reject đơn lẻ có thể tách ticket riêng. |
| FE-20 — Bàn điều phối | 🟡 | Ghép RunPanel + RunResultView; không auto-run. |
| FE-21 — Lịch sử phiên | ⬜ | `GET /api/ai/dispatch/sessions`; `page` 0-based, `status` tự do. |
| FE-22 — Chi tiết phiên | 🟡 | Có detail; không trace, `Suggestion` thiếu `loadId`. |
| FE-23 — Gaps | 🟡 | Chỉ theo load; answer có thể sửa `Load.type` với rule `NOTE_CONFLICT`. |
| FE-24 — Usage | 🟡 | Bảng runs; không có endpoint aggregate/costEstimated. |
| FE-25 — Mapbox drawer | ⛔ | Thiếu `mapbox-gl`, token, toạ độ trong contract. |
| FE-26 — Bỏ key LLM khỏi widget | ⛔ | File đang dirty; cần chủ dự án duyệt trước khi sửa. |
| FE-27 — A11y/responsive bàn điều phối | ⬜ | Sau FE-20. |
| FE-28 — A11y/responsive màn còn lại | ⬜ | Sau FE-21…FE-25. |
| FE-29 — Manual test | ⬜ | Sau các màn. |
| FE-30 — LIVE + tổng kiểm tra | ⛔ | Cần backend chạy, dữ liệu tenant, contract được ký. |

## Việc tiếp theo

1. Chủ dự án ký xác nhận `API_CONTRACT.md` (đặc biệt các điểm lệch với tài liệu v1.0).
2. Quyết định có sửa backend để bổ sung: `loadId` trong `Suggestion`, bulk approve, idempotency, trace, global gaps, usage aggregate, role enforcement hay không.
3. Nếu đồng ý phạm vi hiện tại: tiếp tục **FE-08** (API + query keys cho các OP có thật), rồi FE-09/10/11.
4. Các ticket ⛔ không được triển khai bằng mock hoặc dữ liệu bịa.
