# Kiểm kê i18n — Operations, Load và AI

Ngày kiểm tra: 20/10/2026. Phạm vi gồm Operations Brief, map, timeline, Priority Shipment, các component dashboard, Load redesign và AI Dispatch.

## Kết quả

- Các nhãn, hướng dẫn, trạng thái rỗng/lỗi, thao tác và bản tóm tắt preview trong phạm vi dùng key i18next; key mới có cùng cấu trúc trong `en.ts`, `vi.ts`, `ja.ts`.
- `localeKeys.test.ts` kiểm tra parity toàn bộ cây locale và các key mới. `operationsPanelLocales.test.tsx` đổi vi/en/ja và xác nhận Brief, map, timeline và Priority Shipment hiện đúng ngôn ngữ; `DashboardStates.test.tsx` kiểm tra các copy mặc định của trạng thái rỗng/lỗi/unavailable.
- Quét JSX text và thuộc tính hiển thị không tìm thấy câu/nhãn giao diện viết cứng. Hai placeholder còn là định dạng đầu vào, không phải copy: URL ví dụ `https://api.openai.com/v1` (`AiConfigModal.tsx`) và mẫu UUID (`AiDispatchRunForm.tsx`).
- Attribution `OpenStreetMap contributors` nằm trong catalog map; đây là tên và dòng ghi công nguồn bản đồ. Lý do dismiss Load gửi lên API cũng dùng key locale. Các status như `Executed`/`Approved`, nội dung `event.note`, field label, tên người/khách hàng/địa danh và số liệu preview là enum hoặc dữ liệu; không dịch dữ liệu nhận từ API hay fixture nghiệp vụ.

## Lệnh kiểm chứng

- `npx vitest run src/tests/pages/dashboard/DashboardResponsive.test.tsx src/features/loads/components/redesign/ShipmentGapsCard.test.tsx src/tests/components/AppSider.test.tsx src/tests/locales/localeKeys.test.ts src/tests/features/dashboard/operationsPanelLocales.test.tsx src/tests/features/dashboard/DashboardStates.test.tsx src/tests/features/loads/loadLocaleSwitching.test.tsx src/tests/features/ai-dispatch/aiDispatchLocaleSwitching.test.tsx --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 8 file / 49 test pass.
- `npm run build` — exit 0; `npm run lint` — exit 0, 0 errors / 4 warnings có sẵn.
- `rg --pcre2` trên các thư mục trong phạm vi để tìm literal JSX text/`placeholder`/`alt`/`aria-label`/`title`/`message`; rà thủ công các kết quả còn lại và phân loại placeholder kỹ thuật, enum, attribution và dữ liệu.

## Rollback

Hoàn nguyên các thay đổi trong ba locale, component locale-aware, hai test locale và file kiểm kê này. Không thay đổi route, capability hoặc API contract.
