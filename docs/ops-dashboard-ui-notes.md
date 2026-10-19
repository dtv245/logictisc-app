# Ghi Chú Kỹ Thuật: Tối Ưu Hóa & Chịu Lỗi Màn Hình Operations Dashboard

**Tài liệu tham chiếu:** Màn hình điều phối vận hành (`/operations` — `OperationsDashboardPage`).  
**Mục tiêu:** Khắc phục lỗi tham số gọi API báo cáo `/api/reports/...`, chuẩn hóa serialization tập trung, cấu hình retry React Query, và tăng cường khả năng chịu lỗi độc lập từng block (per-block resilience).

---

## 1. Phân Tích Nguyên Nhân Gốc (Root Cause Analysis)

### 1.1. Lỗi 400 "Request parameter has an invalid type" (Lỗi từ FRONTEND)
- **Các endpoint bị ảnh hưởng:**
  - `/api/reports/operations/on-time-delivery` (2 kỳ: hiện tại & kỳ trước)
  - `/api/reports/operations/delays`
  - `/api/reports/operations/transit-time`
  - `/api/reports/operations/exceptions-summary`
  - `/api/reports/expenses` (2 kỳ)
  - `/api/reports/costs/known-operating-cpm` (2 kỳ)
  - `/api/reports/fleet/fuel`
  - `/api/reports/fleet/maintenance`
- **Nguyên nhân kỹ thuật:**
  - Tại backend `ReportController.java`, các endpoint này nhận tham số ngày qua annotation:
    ```java
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ```
  - Định dạng `DateTimeFormat.ISO.DATE_TIME` của Spring Boot yêu cầu chuỗi thời gian đầy đủ chuẩn ISO-8601 kèm múi giờ/offset (ví dụ: `2026-09-16T00:00:00.000Z`).
  - Frontend trước đây trong `useDashboardData.ts` chỉ format dạng date-only: `YYYY-MM-DD` (ví dụ: `from=2026-09-16&to=2026-10-16`). Spring Boot TypeConverter không parse được thành `OffsetDateTime` nên trả về lỗi HTTP 400 Bad Request kèm thông điệp: `"Request parameter has an invalid type"`.

### 1.2. Lỗi 500 "INTERNAL_ERROR / An unexpected error occurred" (Lỗi từ BACKEND)
- **Endpoint bị ảnh hưởng:** `/api/reports/financials/monthly?year=2026&month=5..10&currency=USD` (6 truy vấn song song cho 6 tháng).
- **Nguyên nhân kỹ thuật:**
  - Xem log thực tế tại container backend `logistics-api`:
    ```
    ERROR c.c.l.exception.GlobalExceptionHandler : database_failure sqlState=42P18 constraint=null requestId=...
    ERROR c.c.l.exception.GlobalExceptionHandler : api_failure status=500 code=INTERNAL_ERROR method=GET path=/api/reports/financials/monthly
    Caused by: java.lang.RuntimeException: org.postgresql.util.PSQLException
    ```
  - Trong `ReportController.java` dòng 93:
    `var maint = operatingCostCalculator.calculateMaintenance(from, to, null, reportCurrency);`
    Truy vấn SQL trong `calculateMaintenance` nhận tham số `truckId = null`. Trong PostgreSQL, mệnh đề JPQL `(:truckId is null or m.truck.id = :truckId)` khi tham số là null không rõ kiểu dữ liệu gây ra mã lỗi PostgreSQL `42P18` (`indeterminate_datatype`).
  - Đây là lỗi backend SQL thuần túy. Phía frontend cần hiển thị trạng thái lỗi trung thực trên widget tài chính và cung cấp nút "Thử lại", không làm vỡ các widget khác trên dashboard.

### 1.3. Lỗi 404 "RESOURCE_NOT_FOUND" trên Driver Ranking (Endpoint chưa có ở BACKEND)
- **Endpoint bị ảnh hưởng:** `/api/reports/drivers/ranking?sortBy=score&limit=10...`
- **Nguyên nhân kỹ thuật:**
  - Backend `ReportController.java` chưa có controller mapping cho `/reports/drivers/ranking`.
  - Frontend trước đây tại `useDriverRanking.ts` âm thầm nuốt lỗi (`if (useMockRankingEnv || rankingQuery.isError)`) và trả về dữ liệu mẫu (mock data), vi phạm quy tắc hiển thị trung thực. Khi backend lỗi 404, widget phải hiển thị thông báo lỗi thân thiện thay vì tạo ảo giác dữ liệu thật.

### 1.4. Cảnh báo Ant Design: `[antd: Table] index parameter of rowKey function is deprecated`
- **Vị trí:** `ProfitabilityRankingsTable.tsx` dòng 335 và 348 dùng `(r, i) => ...-${i}`.

---

## 2. Giải Pháp Triển Khai (Implemented Solutions)

### 2.1. Chuẩn hóa Tham Số Báo Cáo Tập Trung (Single Serializer Helper)
- **Vị trí:** `src/features/dashboard/api.ts`
- **Các hàm dùng chung:**
  - `serializeReportDateRange(from, to, defaultDays)`: Chuyển đổi khoảng ngày thành chuỗi UTC ISO-8601 chính xác:
    - `from`: đầu ngày UTC (`dayjs.utc(from).startOf("day").toISOString()`, ví dụ `2026-09-16T00:00:00.000Z`).
    - `to`: cuối ngày UTC (`dayjs.utc(to).endOf("day").toISOString()`, ví dụ `2026-10-16T23:59:59.999Z`).
  - `computeReportDateWindows(fromDate, toDate)`: Tính toán đồng bộ 2 kỳ so sánh (kỳ hiện tại `current` và kỳ trước `previous`) đảm bảo định dạng ISO-8601 chuẩn UTC.
- **Áp dụng:**
  - `useDashboardData.ts`: Áp dụng `computeReportDateWindows` cho toàn bộ 12 query báo cáo hoạt động và chi phí.
  - `useDriverRanking.ts`: Áp dụng `serializeReportDateRange` cho truy vấn xếp hạng tài xế.
  - Bổ sung `currency: filters.currency` cho `fuelQuery` và `maintenanceQuery` theo đúng hợp đồng của backend `ReportController`.

### 2.2. Chuẩn hóa Thông Điệp Lỗi Thân Thiện (Friendly Error Normalization)
- **Vị trí:** `src/features/dashboard/api.ts` — `normalizeWidgetError`
- **Quy tắc chuyển đổi:**
  - `403 / FORBIDDEN`: `"Không có quyền xem thông tin này"`
  - `404 / RESOURCE_NOT_FOUND`: `"Dữ liệu hoặc báo cáo chưa khả dụng"`
  - `400 / MALFORMED_REQUEST`: `"Tham số báo cáo không hợp lệ"`
  - `500+ / 0 / Network Error`: `"Dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau."`
  - **Chống rò rỉ thông điệp kỹ thuật thô:** Loại bỏ triệt để các chuỗi tiếng Anh như `"Request parameter has an invalid type"`, `"An unexpected error occurred"`, `"Request failed with status code..."` khỏi giao diện người dùng.
  - Giữ lại `requestId` nếu backend cung cấp để hiển thị mã tra cứu phụ trong Alert (`Mã yêu cầu: {requestId}`).

### 2.3. Khả Năng Chịu Lỗi Từng Khối Độc Lập (Per-Block Resilience)
- **Xu hướng tài chính 6 tháng (`FinancialSection`):**
  - `useDashboardData` tính toán `monthlyTrend.error` khi các truy vấn tháng gặp sự cố.
  - `FinancialSection` truyền `monthlyTrendError` vào `WidgetContainer`. Khi backend trả 500, widget hiển thị khung báo lỗi tiếng Việt kèm nút "Thử lại", không làm vỡ các widget chi phí bên cạnh.
- **Thẻ KPIs tổng quan (`KpiCards`):**
  - Thẻ "Doanh Thu" và "Lợi Nhuận Thuần" nhận `monthlyTrendLoading` và `monthlyTrendError`. Khi API tài chính lỗi, thẻ hiển thị trạng thái lỗi cục bộ thay vì hiển thị $0 hoặc 0% sai lệch.
  - Các thẻ OTD, Chi Phí Vận Hành, Đội Xe tiếp tục tải và hiển thị độc lập.
- **Bảng xếp hạng tài xế (`DriverRankingTable`):**
  - Bỏ cơ chế tự động nuốt lỗi bằng mock data trong `useDriverRanking.ts`. Chỉ sử dụng mock khi cờ `VITE_USE_MOCK_RANKING === "true"` được cấu hình rõ ràng.
  - Khi backend 404, widget hiển thị trạng thái lỗi trung thực kèm nút "Thử lại".

### 2.4. Cấu Hình React Query Retry Policy
- **Vị trí:** `src/App.tsx`
- **Cơ chế:**
  - Mã lỗi 4xx (`status >= 400 && status < 500`): **Không retry** (thất bại ngay lập tức để tránh gửi liên tục các request sai tham số hoặc thiếu tài nguyên).
  - Mã lỗi 5xx (`status >= 500`) và lỗi mạng: Ủy quyền cho `shouldRetryQuery` retry tối đa 2 lần với thuật toán exponential backoff qua `queryRetryDelay`.

### 2.5. Khắc phục Cảnh Báo Deprecation Ant Design
- **Vị trí:** `src/features/dashboard/components/ProfitabilityRankingsTable.tsx`
- **Khắc phục:**
  - Bảng Tuyến đường: `rowKey={(r) => `${r.originState ?? ""}-${r.destinationState ?? ""}-${r.loadCount ?? ""}-${r.totalRevenue ?? ""}`}`
  - Bảng Xe: `rowKey={(r) => r.truckId || r.truckNumber || `${r.loadCount ?? ""}-${r.totalRevenue ?? ""}`}`
  - Loại bỏ hoàn toàn tham số `index` thứ hai khỏi hàm `rowKey`.

---

## 3. Ma Trận Kiểm Thử & Xác Nhận (Verification Matrix)

| Thành phần | Test Suite | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| Serializer & Error Normalizer | `src/tests/features/dashboard/dashboardUtils.test.ts` | **PASS (32/32)** | Xác nhận format UTC ISO-8601 và không leak lỗi kỹ thuật |
| Màn hình Dashboard & Responsive | `src/tests/pages/dashboard/DashboardResponsive.test.tsx` | **PASS (10/10)** | Kiểm tra hiển thị responsive toàn bộ thẻ & bảng |
| Bản đồ & Dữ liệu Dashboard | `src/tests/pages/dashboard/VehicleTrackingMap.test.tsx`, `dashboardData.test.ts` | **PASS (4/4)** | Xác nhận dữ liệu tọa độ xe và tracking |
| Chính sách Retry API | `src/tests/providers/api/retryPolicy.test.ts` | **PASS (6/6)** | Kiểm tra chặn 4xx, cho phép 5xx retry |
| Toàn bộ Test Suite | `npx vitest run` | **PASS (1228/1228)** | Không làm giảm baseline, tăng 8 test mới |
