# QA-008 — Kiểm chứng nguồn dữ liệu khi backend offline

**Ngày chạy:** 20/10/2026  
**Kết quả:** đã quan sát Vite dev proxy fallback thật; response fallback là `MOCK/STATIC`, không phải backend success. Dashboard và Load screenshot là `BROWSER-FIXTURE`.

## Runtime Vite dev proxy fallback

Chạy dev server với target local không mở để kiểm tra nhánh `ECONNREFUSED`, không sửa `vite.config.ts`:

```sh
API_PROXY_TARGET=http://127.0.0.1:18081 npm run dev -- --host 127.0.0.1 --port 4174 --strictPort
```

Target được kiểm tra trước bằng `curl -sS --max-time 1 http://127.0.0.1:18081/api/health`: exit 7, connection refused. Sau đó gửi request qua Vite:

| Request | Kết quả runtime | Phân loại |
|---|---|---|
| `GET /api/health` | HTTP 200, `application=logicstic`, `database=enabled`, `status=UP` | `MOCK/STATIC`; không chứng minh API/database khỏe |
| `GET /api/me` | HTTP 200, tenant `local-development`, role `SUPERADMIN` | `MOCK/STATIC`; không có JWT/session thật |
| `GET /api/customers` | HTTP 200, `message=Success (dev mock)`, ba customer mẫu | `MOCK/STATIC` |
| `POST /api/customers` | HTTP 201, `code=CREATED`, `message=Created successfully (dev mock)`, ID cố định `00000000-0000-0000-0000-000000000099` | `MOCK/STATIC`; không tạo customer và không chứng minh nghiệp vụ hoàn tất |
| `PUT /api/customers/11111111-1111-1111-1111-111111111111` | HTTP 200, `code=UPDATED`, `message=Updated successfully (dev mock)` | `MOCK/STATIC`; không cập nhật dữ liệu và không chứng minh nghiệp vụ hoàn tất |

Terminal Vite ghi: `Backend API chưa chạy tại http://127.0.0.1:18081. Dev proxy đang kích hoạt chế độ Mock Fallback cho /api.`. Điều kiện proxy error và response nằm trong [vite.config.ts](../../vite.config.ts:67). Preview chỉ cấu hình proxy chuyển tiếp, không khai báo handler fallback.

## Cách nhận biết ba nguồn

| Nguồn | Dấu hiệu runtime/file | Nhãn |
|---|---|---|
| Backend thật | Response từ Spring API qua client; cần backend, JWT và tenant thật. HTTP 200 đơn lẻ không đủ. | `NEEDS-LIVE` |
| Vite proxy fallback | Cảnh báo terminal `[vite] ... Mock Fallback`; response có `Success (dev mock)`, `Created successfully (dev mock)` hoặc `Updated successfully (dev mock)`. | `MOCK/STATIC` |
| Operations preview | URL có `?demo=1`; UI cảnh báo “Đang xem dữ liệu mẫu Operations”; data nằm trong `OperationsDashboardPreview`, không gọi API. | `MOCK/STATIC` |
| Playwright fixture | Mở riêng `/e2e/fixtures/*.html`; dashboard inputs nằm trong `e2e/fixtures/dashboard-panels.tsx` và `dashboard-reference.data.ts`. | `BROWSER-FIXTURE` |

## Browser fixture sau khi sửa i18n harness

- `SCREENSHOT_DIR=ds003-before-after-i18n npm run test:e2e -- e2e/dashboard-panels.spec.ts --workers=1 --reporter=line` — exit 0, 3/3 tests; viewport check gồm 320, 390, 768, 1024, 1440 px.
- `SCREENSHOT_DIR=ds003-before-after-i18n npm run test:e2e -- e2e/loads-show-screenshot.spec.ts --workers=1 --reporter=line` — exit 0, 1/1 test; Load detail fixture chụp 320–1440 px.
- Ảnh tạo có chủ đích tại `docs/design/ds003-before-after-i18n/`; đây là baseline fixture sau khi nạp locale thật, không phải ảnh live.

**Kết luận:** HTTP success từ `/api/health`, `/api/me`, collection GET, POST hoặc PUT trong lần chạy này đều là fallback local. Không dùng mutation response đó để xác nhận CRUD, role, tenant hoặc workflow. Backend thật và tenant isolation vẫn `NEEDS-LIVE`.
