# Hướng dẫn cấu hình Mapbox cho bản đồ màn Điều phối (`VITE_MAPBOX_ACCESS_TOKEN`)

Tài liệu này hướng dẫn cách lấy và cấu hình token Mapbox GL JS cho bản đồ ở màn điều phối (`/tms/dispatch`).

---

## 1. Cách lấy Public Access Token (`pk.`)

1. Đăng nhập vào [Mapbox Account Dashboard](https://account.mapbox.com/access-tokens/).
2. Nhấn **Create a token**.
3. Đặt tên token dễ nhận biết (ví dụ: `logictics-app-dispatch-web`).
4. Giữ nguyên nhóm **Public scopes** mặc định (`styles:tiles`, `styles:read`, `fonts:read`, `datasets:read`).
   > **Cảnh báo bảo mật:** Tuyệt đối **KHÔNG** bật bất kỳ Secret scope nào và **KHÔNG** dùng token bắt đầu bằng `sk.` ở frontend. Ứng dụng đã có chốt chặn tự động từ chối mọi token bắt đầu bằng `sk.`.
5. Tại mục **URL restrictions**, thêm danh sách domain được phép gọi token:
   - Môi trường phát triển (Local): `http://localhost:5173/*`, `http://127.0.0.1:5173/*`
   - Môi trường Staging / Production: thêm domain chính thức của hệ thống (ví dụ `https://tms.ten-cong-ty.vn/*`).
6. Nhấn **Create token** và sao chép chuỗi token bắt đầu bằng `pk.`.

---

## 2. Cấu hình biến môi trường

Thêm biến `VITE_MAPBOX_ACCESS_TOKEN` vào file `.env.local` (hoặc cấu hình CI/CD build environment):

```dotenv
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoi...
```

- **Không** commit token thật vào Git (`.env.example` chỉ giữ dòng mẫu `pk.your_public_mapbox_token_here`).
- **Không** đưa token vào `public/runtime-config.json`.
- Khi thiếu `VITE_MAPBOX_ACCESS_TOKEN`, trình duyệt không hỗ trợ WebGL, hoặc khởi tạo lỗi, màn điều phối sẽ tự động hiển thị khung dự phòng dạng chữ `"Điểm lấy → Điểm giao"` kèm thông báo `"Chưa hiển thị được bản đồ. Thông tin lô vẫn đúng."` (chi tiết kỹ thuật được ghi vào `console.warn`).

---

## 3. Lưu ý về hạn mức tính phí (Map Loads & Directions API)

- **Mapbox GL JS (Map Loads for Web):**
  - Mapbox tính phí theo mỗi lần khởi tạo `new mapboxgl.Map(...)` (miễn phí 50.000 lượt tải bản đồ/tháng).
  - Trong `MapboxDispatchMapCanvas.tsx`, ứng dụng **chỉ khởi tạo đúng 1 instance `Map`** khi mở màn điều phối. Khi nhân viên chọn lô hàng khác hoặc đổi giao diện sáng/tối, bản đồ chỉ cập nhật dữ liệu qua `GeoJSONSource.setData()` và `map.fitBounds()`, **không** tạo lại instance `Map`.
- **Mapbox Directions API (`mapbox/driving`):**
  - Miễn phí 100.000 request/tháng.
  - Hook `useMapboxRoute.ts` làm tròn tọa độ điểm lấy (A) và điểm giao (B) đến **5 chữ số thập phân** (~1,1 mét) để làm khóa cache TanStack Query với `staleTime = 30 phút`, tắt `refetchOnWindowFocus` và giới hạn `retry = 1`.
  - Nếu Directions API lỗi hoặc hết hạn mức, bản đồ tự động vẽ đường thẳng đứt nét nối A–B kèm thông báo `"Chưa tính được đường đi, đang hiển thị đường thẳng tham khảo"` và không tính số km từ đường thẳng làm số liệu giao hàng.
