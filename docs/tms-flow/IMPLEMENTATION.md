# TMS Operations Flow — trạng thái triển khai

Nguồn đặc tả: `tms_business_flow_ux_dom.md`. Kế hoạch đã duyệt: Phase 1 (Flow B) hoàn tất, Phase 2 (Flow A) chưa bắt đầu.

## 1. Trạng thái từng màn

| Màn | Trạng thái | Route / Test id chính |
|---|---|---|
| S01 Operations Dashboard | ✅ Phase 1 | `/tms` · `dashboard-kpi-*`, `shipment-card-SF-48291` |
| S02 New Shipment | ⏳ Placeholder Phase 2 | `/tms/shipments/new` · `new-shipment-phase2` |
| S03 Dispatch | ✅ Phase 1 | `/tms/dispatch?filter=&shipment=&q=` · `dispatch-filter-*` |
| S04 Auto-assign modal | ⛔ Chưa làm (Phase 2) | — |
| S05 Route Optimization | ⛔ Chưa làm (Phase 2) | — |
| S06 Edit stops modal | ⛔ Chưa làm (Phase 2) | — |
| S07 Inbox | ⛔ Chưa làm (Phase 2) | — |
| S08 Approve route change | ✅ Phase 1 | modal trong S03/S09 · `route-approval-dialog`, `route-approve-confirm/reject` |
| S09 Shipment Detail | ✅ Phase 1 | `/tms/shipments/:shipmentId` · `shipment-share-tracking`, `shipment-remote-approval` |
| S10 Share live tracking | ✅ Phase 1 | modal trong S09 · `tracking-copy-link`, `tracking-send` |
| S11 Live Tracking | ✅ Phase 1 | `/tms/tracking/:token` · `live-eta-SF-48291`, `live-view-map/list` |

Flow B chạy được: Dashboard → Dispatch → Approve reroute → Shipment Detail → Share tracking → Live tracking. S02 chỉ là placeholder để nút `New shipment` không rơi vào 404; form thật thuộc Phase 2.

## 2. Nguồn dữ liệu và provenance

- Toàn bộ dữ liệu là fixture trong browser: `src/api/tms-flow/tmsFlow.fixtures.ts`.
- Một cổng dữ liệu duy nhất `TmsFlowGateway` (`src/api/tms-flow/tmsFlow.api.ts`), implementation demo tại `src/api/tms-flow/tmsFlow.demo.ts`. Không screen nào import fixture trực tiếp.
- **Không có network call nào tới backend** cho các mutation của flow (dispatch queue, auto-assign, route approval, messaging, tracking link, telemetry chưa có contract).
- Mọi màn nằm dưới `/tms` đều có `FlowDemoBanner` ghi rõ dữ liệu mẫu; nút Reset đưa về snapshot ban đầu.
- Khi contract thật được xác nhận, chỉ thay implementation của gateway; screen/hook giữ nguyên.

### Đồng hồ demo

- `DEMO_NOW = 2026-10-05T15:20:00-07:00`, timezone `America/Los_Angeles`, ngày hiển thị cố định.
- Không dùng `Date.now()` cho ETA, freshness hay expiry. S11 tăng "updated Ns ago" bằng interval và chuyển stale theo ngưỡng 60 giây hoặc cờ `stale` của view.

### Scenario qua query

`?scenario=normal|stale-approval|network-error|stale-assignment|expired-link|read-only`.

- `stale-approval`: quyết định reroute trả `TmsFlowConflictError`, proposal không đổi.
- `expired-link`: S11 trả `TmsFlowExpiredLinkError`, không lộ dữ liệu shipment.
- `read-only`: provider đặt cờ permission, UI chặn mutation.

### Tracking token

- Token seed `demo-SF-48291-live` cho link "Open live map" ở S01.
- Link tạo ở S10 là idempotent `demo-<shipmentId>-link`; preferences lưu trong gateway singleton nên S11 đọc được ngay.
- Driver PII mặc định tắt với link khách hàng; `tracking-show-driver-contact` bật cả tên và số điện thoại (demo gộp một toggle, đặc tả tách hai).
- Token chỉ là dữ liệu demo; không log token, không dùng token thật, không đưa token vào screenshot.

## 3. Khác biệt so với kế hoạch đã duyệt

| # | Kế hoạch | Thực tế | Lý do |
|---|---|---|---|
| 1 | S09 dùng adapter shipment → `Load` để tái dùng `ShipmentHeroCard` | Không adapter; hero/load plan/route stops dựng từ type TMS | Tránh coupling type demo vào contract `Load` thật; tránh field giả |
| 2 | Mở rộng `NetworkRouteMap` optional props cho stop marker | Không sửa component dùng chung; `TmsFlowMap` chỉ bọc | Giảm rủi ro hồi quy dashboard; stop marker để Phase 2 (S05/S06) |
| 3 | i18n vi/en/ja đầy đủ cho mọi chuỗi | Copy màn hình giữ tiếng Anh literal; chỉ thêm `navigation.items.tms-flow` vào vi/en | `localeKeys.test.ts` yêu cầu vi/en cùng key set và key tĩnh; ja không có namespace `navigation`. Đây là nợ i18n cần chốt |
| 4 | S11 trong `docs/design/tms-flow/` screenshot | Chưa có screenshot | Chưa chạy Playwright/responsive trong Phase 1 |
| 5 | Route `/tms/routes/:routeId`, `/tms/inbox` | Chưa mount (const đã thêm) | S05/S07 thuộc Phase 2; chưa có nút nào trỏ tới |

## 4. Giả định cần BA xác nhận

Kế thừa nguyên bảng assumption của kế hoạch; các điểm đang ảnh hưởng Phase 1:

1. Một operator quyết định reroute; không undo; quyết định lần hai trả conflict. Đã cài.
2. Link tracking chỉ mở trong route authenticated (chưa anonymous/revoke). Đã cài.
3. Live tracking demo bằng interval, không WebSocket. Đã cài.
4. Toggle driver name + phone gộp một nút trong S10. Cần chốt có tách hai toggle không.
5. Freshness stale sau 60 giây là ngưỡng demo, chưa phải SLA thật.

## 5. Bằng chứng kiểm tra

Lần chạy ngày 2026-10-22, trong phiên này:

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run build` | 0 | `✓ built in 1.88s` (cảnh báo chunk >500 kB có sẵn) |
| `npm run lint` | 0 | 0 error, 4 warning `react-hooks/exhaustive-deps` có sẵn |
| `npx vitest run` | 0 | 208 file / 1371 test pass |

Test mới của flow:

- `src/api/tms-flow/tmsFlow.demo.test.ts` — 5 test: approve reroute cập nhật ETA + audit; quyết định lần hai conflict; stale-approval không mutate; ẩn driver PII đến khi opt-in; token hết hạn bị từ chối.
- `src/utils/tms-flow/selectors.test.ts` — 5 test: at-risk gồm delayed; bộ lọc approvals; tìm kiếm ID/customer/lane/PO; merge detail; đếm filter.

Sàn test ghi trong `docs/restructure/PROGRESS.md` là 1205 test; hiện tại 1371, không thấp hơn sàn.

## 6. Việc còn lại trước khi coi Phase 1 là hoàn tất

- Playwright Flow B + responsive 1440/1024/768/390/320 (kế hoạch §9) chưa chạy.
- Screenshot evidence vào `docs/design/tms-flow/`.
- Chốt phương án i18n cho copy màn hình demo (giữ tiếng Anh literal hay thêm key vi/en).
- Test component cho `ApproveRouteModal` (ready vs applied) và S10 privacy chưa viết.
