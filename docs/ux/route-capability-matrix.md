# Route, role, tenant và capability runtime

**Ngày đối chiếu:** 20/10/2026  
**Bằng chứng:** `SOURCE`; role/tenant ngoài fixture là `NEEDS-LIVE`.  
Ma trận ghi source hiện tại; không bật route, capability hoặc feature flag.

## Cách xác định route runtime

- `App.tsx` tạo Refine resources bằng `createFoundationResources(t)` và truyền `foundationResourcePageRoutes` vào `AppRouter` ([App.tsx](../../src/App.tsx:155), [App.tsx](../../src/App.tsx:208)).
- Mọi trang nghiệp vụ nằm dưới `ProtectedRoute` rồi `TenantGuard`. Thiếu `tenantKey` sẽ chuyển tới `/select-tenant` ([AppRouter.tsx](../../src/router/AppRouter.tsx:170), [TenantGuard.tsx](../../src/router/TenantGuard.tsx:11)). Membership và tenant data thật cần `NEEDS-LIVE`.
- `ResourceAccessBoundary` dùng Refine `CanAccess`; access provider đọc JWT roles rồi áp dụng `ROLE_MATRIX` ([AppRouter.tsx](../../src/router/AppRouter.tsx:124), [accessControlProvider.ts](../../src/providers/accessControlProvider.ts:17), [roleMatrix.ts](../../src/providers/permissions/roleMatrix.ts:24)). Backend vẫn là nguồn authorization cuối cùng.
- Generic route phải có trong `appResourcePageRoutes`, resource có trong `supportedNames`, và `create`/`edit` qua `getResourceCapabilities`; `foundationApiResources` tự nó không mount UI route ([resourceRegistry.ts](../../src/pages/resourceRegistry.ts:98), [resourceRegistry.ts](../../src/pages/resourceRegistry.ts:139), [AppRouter.tsx](../../src/router/AppRouter.tsx:226)).

`JWT_ROLES` nghĩa là union các role JWT khai báo ở `src/types/roles.types.ts`; không suy ra role backend thật từ fixture.

## Trang có route riêng trong AppRouter

Tất cả route dưới đây yêu cầu đăng nhập và tenant. `API` nghĩa là trang dùng API ứng dụng; khi `vite dev` không kết nối được backend, proxy có thể thay response bằng `MOCK/STATIC` ([báo cáo QA-008](data-provenance-runtime.md)). Muốn khẳng định live cần `NEEDS-LIVE`.

| Route đang mount | Role/capability guard | Tenant | Mode / ghi chú |
|---|---|---|---|
| `/operations` | Không có `ResourceAccessBoundary` riêng trong `AppRouter`; route có auth + tenant guard. Không suy role UI từ route. | Bắt buộc `tenantKey`; role/tenant thật `NEEDS-LIVE`. | API/live mặc định; `?demo=1` chọn Operations preview `MOCK/STATIC` ([useOperationsPreview.ts](../../src/hooks/dashboard/useOperationsPreview.ts:7)). |
| `/optimization`, `/optimization/runs/:id` | `optimization / OPTIMIZATION_VIEW`; `ADMIN`, `DISPATCHER`. | Bắt buộc; dữ liệu tenant thật `NEEDS-LIVE`. | API; dev proxy có thể trả mock khi backend offline. |
| `/reports/fleet` | `fleet-reports / FLEET_REPORT_VIEW`; `ADMIN`, `ACCOUNTANT`, `PAYROLL`, `PAYROLL_MANAGER`. | Bắt buộc; `NEEDS-LIVE`. | API; mileage attribution là capability riêng, không phải route này. |
| `/ai-dispatch`, `/ai-dispatch/:id`, `/ai-dispatch/show/:id` | `ai-dispatch / AI_DISPATCH_VIEW`; `ADMIN`, `ACCOUNTANT`, `DISPATCHER`, `SUPERADMIN`, `OWNER`, `MANAGER`. | Bắt buộc; `NEEDS-LIVE`. | API; fixture không xác nhận phiên AI live. |
| `/finance/profitability` | `profitability / PROFITABILITY_VIEW`; `ADMIN`, `ACCOUNTANT`, `PAYROLL`, `PAYROLL_MANAGER`. | Bắt buộc; `NEEDS-LIVE`. | API; quyền xem không suy ra quyền ghi. |
| `/settlements`, `/settlements/:id` | `settlements / SETTLEMENT_VIEW`; nhóm payroll. | Bắt buộc; `NEEDS-LIVE`. | API; workflow giữ contract/state hiện có. |
| `/settlements/policies`, `/settlements/policies/:id` | `driver-pay-policies / POLICY_VIEW`; nhóm payroll. | Bắt buộc; `NEEDS-LIVE`. | API. |
| `/profile/payslips`, `/payslips/:id` | `payslips / PAYSLIP_VIEW`; `JWT_ROLES`. | Bắt buộc; `NEEDS-LIVE`. | API/download; tải file cần backend session thật. |
| `/payroll`, `/payroll/:id`, `/payroll/reconciliation` | `payroll / PAYROLL_VIEW`; nhóm payroll. Reconciliation đang mount vì `PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED=true`. | Bắt buộc; `NEEDS-LIVE`. | API. |
| `/dashboard` | Executive dashboard không mount; `EXECUTIVE_CONTRACT_CONFIRMED=false`, route redirect `/operations`. | Tenant guard chạy trước redirect. | Không phải executive dashboard runtime. |

Nhóm payroll ở bảng trên là `ADMIN`, `ACCOUNTANT`, `PAYROLL`, `PAYROLL_MANAGER` ([roleMatrix.ts](../../src/providers/permissions/roleMatrix.ts:22)).

## Generic resource routes được mount

Mẫu đường dẫn là `/<resource>` và `/<resource>/show/:id`; create/edit chỉ xuất hiện khi capability tương ứng bật. Các route này qua `CanAccess` với action `list`, `show`, `create` hoặc `edit`. Capability UI không cấp quyền backend.

| Resource / route thật | Role/action theo source | UI capability runtime | Tenant | Mode |
|---|---|---|---|---|
| `customers`: list, create, edit, show | `ADMIN`, `ACCOUNTANT`, `DISPATCHER`; CRUD | create/edit/delete bật | Guard; membership `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `employees`: list, create, edit, show | `ADMIN`, `DISPATCHER`; CRUD | create/edit/delete bật | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `loads`: list, create, show; **edit không mount** | `ADMIN`, `ACCOUNTANT`, `DISPATCHER`; CRUD | create/delete bật; edit tắt vì `CORE_VERSIONED_WRITES_RUNTIME_VERIFIED=false` | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `trips`: list, create, show; **edit không mount** | `ADMIN`, `DISPATCHER`; CRUD | create/delete bật; edit tắt cùng core versioned-write gate | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `trucks`: list, create, show; **edit không mount** | `ADMIN`, `ACCOUNTANT`, `DISPATCHER`; CRUD | create/delete bật; edit tắt cùng core versioned-write gate | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `invoices`: list, create, edit, show | `ADMIN`, `ACCOUNTANT`; CRUD | create/edit bật, delete tắt; edit còn giới hạn `isLegacyDraftInvoice` | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |
| `payments`: list, show; **create/edit không mount** | `ADMIN`, `ACCOUNTANT` có role actions trong matrix | create/edit tắt vì `PAYMENT_COMMANDS_RUNTIME_VERIFIED=false`; delete tắt | Guard; `NEEDS-LIVE` | API read-only; command chưa runtime-verified |
| `documents`: list, show | `ADMIN`, `ACCOUNTANT`, `DISPATCHER`; read/download/delete | create/edit tắt (read-only resource); delete capability chuyên biệt bật | Guard; `NEEDS-LIVE` | API; download/delete cần session thật |
| `notifications`: list, show | `JWT_ROLES`; read và mark-all-read | create/edit/delete tắt | Guard; `NEEDS-LIVE` | API; count/mutation cần backend xác minh |
| `terminals`: list, create, edit, show | read: `JWT_ROLES`; create/edit: `SUPERADMIN`, `ADMIN`, `OWNER`, `MANAGER`, `DISPATCHER`; delete không gồm `DISPATCHER` | generic create/edit/delete bật | Guard; `NEEDS-LIVE` | API; dev fallback có thể là mock |

## Giải quyết CRUD ON/OFF trong báo cáo cũ

- **Runtime UI ON:** `customers`, `employees`, `loads`, `trips`, `trucks`, `invoices`, `payments`, `documents`, `notifications`, `terminals` có Refine resource và list/show route. Create/edit chỉ ON theo capability trong bảng trên.
- **Runtime UI OFF dù có UI catalog:** `expenses`, `maintenance`, `hos-eld`, `accidents`, `dvir`, `containers`, `load-board`, `products` có trong `appResources`/`appResourcePageRoutes`, nhưng không có trong `foundationApiResources`, nên bị `supportedNames` lọc khỏi Refine và router.
- **API registry không đồng nghĩa page route:** `drivers` và `roles` có trong `foundationApiResources` và role matrix, nhưng không có trong `appResources`/`appResourcePageRoutes`; hiện không có generic page route cho hai resource này.
- **Delete không phải route:** capability/action delete tác động nút hoặc action; generic route map chỉ khai báo list/create/edit/show.
- **`dashboard`:** có trong UI catalog nhưng bị loại khỏi `supportedNames` do executive contract false; `/dashboard` redirect sang `/operations`.

Kết luận ON/OFF dựa trên chuỗi runtime: `App.tsx` truyền foundation registry → registry lọc allowlist + capability → `AppRouter` mount phần còn lại. Không kết luận route bật chỉ từ UI catalog hoặc API registry.

## Giới hạn kiểm chứng

- **SOURCE:** route tree, role matrix, capability booleans, allowlist và mode selector đã đọc trực tiếp.
- **NEEDS-LIVE:** JWT thật cho từng role, quyền được backend chấp nhận, tenant membership/data isolation, và request qua Spring API. Phiên này không có authenticated backend session.
- Không route, role, tenant hoặc capability nào được bật/tắt để lập ma trận.
