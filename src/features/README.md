# Kiến trúc Thư mục Tính năng (Feature Architecture & Boundary)

Tài liệu này định nghĩa cấu trúc phân tầng, cây thư mục thực tế trên đĩa và các quy tắc phụ thuộc áp dụng cho toàn bộ thư mục `src/features/` trong dự án LogisticsX.

---

## 1. Nguyên tắc Phân tầng và Hướng Phụ thuộc (Architectural Layers & Dependency Rules)

Hệ thống tuân thủ mô hình kiến trúc phân tầng 3 lớp nghiêm ngặt:

```text
┌─────────────────────────────────────────────────────────────┐
│                 TẦNG TRANG (Pages Layer)                    │
│   src/pages/ (View containers, route components, screens)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ phụ thuộc (import)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               TẦNG TÍNH NĂNG (Features Layer)               │
│   src/features/<domain>/ (Business logic, components, API)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ phụ thuộc (import)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               TẦNG DÙNG CHUNG (Shared Layer)                │
│   src/components, src/hooks, src/utils, src/formatters,     │
│   src/types, src/styles, src/config, src/providers...       │
└─────────────────────────────────────────────────────────────┘
```

### Các quy tắc phụ thuộc bất biến (Inviolable Rules):

1. **Hướng phụ thuộc một chiều (`pages → features → shared`)**:
   - `pages` import các thành phần từ `features` và `shared`.
   - `features` chỉ import từ `shared` (hoặc từ feature khác qua `index.ts`).
   - `shared` chỉ chứa các thành phần dùng chung không gắn với logic màn hình cụ thể.
2. **Tầng Shared độc lập (`shared ↛ features/pages`)**:
   - Tầng dùng chung (`src/components/`, `src/hooks/`, `src/utils/`, `src/formatters/`, `src/types/`, `src/styles/`, `src/config/`, `src/providers/`, `src/forms/`, `src/table/`) tuyệt đối **KHÔNG ĐƯỢC PHÉP** import từ `src/features/` hoặc `src/pages/`.
3. **Tầng Feature không phụ thuộc Pages (`features ↛ pages`)**:
   - Không một module nào trong `src/features/` được phép import từ `src/pages/`.
4. **Quan hệ giữa các Feature (Cross-Feature Dependencies qua Public API)**:
   - Khi Feature A muốn sử dụng component, hook, utility hoặc type từ Feature B, **CHỈ ĐƯỢC PHÉP IMPORT QUA `index.ts`** (Public API / Barrel Export) của Feature B (`@features/<feature-b>` hoặc `@/features/<feature-b>`).
   - Tuyệt đối cấm **Deep Import** trực tiếp vào các file con bên trong Feature B (ví dụ cấm `@features/<feature-b>/components/...` hoặc `@features/<feature-b>/api/...`).

---

## 2. Cấu trúc Chuẩn của một Feature (Standard Directory Structure)

Mỗi feature đại diện cho một domain nghiệp vụ độc lập, tổ chức theo các thư mục chức năng chuẩn hoá:

```text
src/features/<feature-name>/
├── api/                   # API clients, TanStack / React Query queries, mutations, endpoints
├── components/            # UI components riêng của domain (bảng, form, card, modal, drawer, tab)
├── hooks/                 # Custom hooks phục vụ logic nghiệp vụ riêng của domain
├── utils/                 # Helper functions, snapshot mappers, formatters, calculators nội bộ domain
├── config/                # Hằng số cấu hình, rules tĩnh, bảng ánh xạ trạng thái
├── types.ts (hoặc types/) # Định nghĩa kiểu TypeScript (DTO, Entity, Param, Payload)
├── index.ts               # Public API / Barrel export (chỉ xuất các symbol cho phép feature khác dùng)
└── <feature>.resource.ts  # Cấu hình đăng ký Refine resource (dành cho các domain có CRUD)
```

---

## 3. Cây Thư mục Thực tế trên Đĩa (Actual Directory Tree on Disk)

Dự án hiện có tổng cộng **33 features**. Toàn bộ mã nguồn đã được tái cấu trúc từ dạng phẳng vào các thư mục con chức năng chuyên biệt:

| # | Feature | `components/` | `api/` | `hooks/` | `utils/` | `config/` | `types` | Public API `index.ts` | Refine Resource | Ngoại lệ cấu trúc |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | `accessorials` | Có | — | Có | — | — | Dùng shared | — | — | — |
| 2 | `accidents` | Có | — | — | — | — | `types.ts` | — | `accidents.resource.ts` | — |
| 3 | `ai-dispatch` | Có | Có | Có | — | — | `types/` | — | `ai-dispatch.resource.ts` | `styles/`, `types/` (nhiều file type) |
| 4 | `containers` | Có | — | — | — | — | Dùng shared | — | `containers.resource.ts` | — |
| 5 | `conversations` | Có | — | — | — | — | `types.ts` | — | `conversations.resource.ts` | — |
| 6 | `customers` | Có | — | — | — | — | Dùng shared | — | `customers.resource.ts` | — |
| 7 | `dashboard` | Có | `api.ts` | Có | Có | Có | `types.ts` | `index.ts` | — | `mocks/` |
| 8 | `documents` | Có | Có | Có | — | — | Dùng shared | — | `documents.resource.ts` | — |
| 9 | `dvir` | Có | — | — | — | — | `types.ts` | — | `dvir.resource.ts` | — |
| 10 | `employees` | Có | — | — | — | — | Dùng shared | — | `employees.resource.ts` | — |
| 11 | `executive` | Có | Có | Có | Có | Có | `types.ts` | — | — | — |
| 12 | `expenses` | Có | — | — | — | — | `types.ts` | — | `expenses.resource.ts` | — |
| 13 | `fleet` | Có | Có | — | Có | — | Dùng shared | — | — | — |
| 14 | `hos-eld` | Có | — | — | — | — | `types.ts` | — | `hos-eld.resource.ts` | — |
| 15 | `invoices` | Có | Có | — | Có | — | Dùng shared | — | `invoices.resource.ts` | — |
| 16 | `load-board` | Có | — | — | — | — | `types.ts` | — | `load-board.resource.ts` | — |
| 17 | `loads` | Có | Có | — | — | — | `types.ts` | — | `loads.resource.ts` | — |
| 18 | `maintenance` | Có | — | — | — | — | Dùng shared | — | `maintenance.resource.ts` | — |
| 19 | `map` | Có | — | Có | — | — | `types.ts` | — | — | `layers/`, `lib/`, `store/` |
| 20 | `notifications` | Có | — | Có | Có | — | `types.ts` | `index.ts` | `notifications.resource.ts` | — |
| 21 | `operations` | Có | — | — | Có | — | Dùng shared | — | — | `styles/` |
| 22 | `optimization` | Có | Có | Có | — | — | Dùng shared | — | — | `visualizations/` |
| 23 | `payments` | Có | Có | — | — | — | `types.ts` | — | `payments.resource.ts` | — |
| 24 | `payroll` | Có | Có | Có | Có | — | Dùng shared | — | — | — |
| 25 | `payslips` | Có | Có | — | Có | — | Dùng shared | — | — | — |
| 26 | `products` | Có | — | — | — | — | `types.ts` | — | `products.resource.ts` | — |
| 27 | `profitability` | Có | Có | — | — | — | Dùng shared | `index.ts` | — | — |
| 28 | `rates` | Có | Có | — | — | — | Dùng shared | — | — | — |
| 29 | `settlements` | Có | Có | Có | — | — | Dùng shared | — | — | — |
| 30 | `shipment-costs` | Có | — | — | — | — | Dùng shared | — | — | — |
| 31 | `terminals` | Có | — | — | — | Có | Dùng shared | `index.ts` | `terminals.resource.ts` | — |
| 32 | `trips` | Có | Có | Có | — | — | `types.ts` | — | `trips.resource.ts` | — |
| 33 | `trucks` | Có | — | — | — | — | Dùng shared | — | `trucks.resource.ts` | — |

---

## 4. Các Ngoại lệ Cấu trúc Đặc thù (Structural Exceptions)

Một số domain có tính chất kỹ thuật đặc thù, sở hữu các thư mục ngoại lệ được phê duyệt kiến trúc:

1. **`src/features/map/`**:
   - `layers/`: Chứa các hàm khởi tạo và cấu hình layer bản đồ MapLibre GL (`routeLayers.ts`, `vehicleLayers.ts`).
   - `lib/`: Chứa các thuật toán hình học/không gian thuần tuý (`geo.ts`, `h3.ts`, `polyline.ts`).
   - `store/`: Quản lý trạng thái bản đồ và tương tác người dùng qua Zustand store (`mapStore.ts`).
2. **`src/features/ai-dispatch/`**:
   - `styles/`: Chứa stylesheet SCSS riêng cho giao diện điều phối tự động AI (`ai-dispatch.scss`).
   - `types/`: Tách thành thư mục riêng chứa nhiều tệp kiểu (`ai-dispatch.types.ts`, `aiConfig.types.ts`) thay vì một tệp đơn lẻ.
3. **`src/features/operations/`**:
   - `styles/`: Chứa style riêng của Operations Dashboard (`operations.scss`).
4. **`src/features/optimization/`**:
   - `visualizations/`: Chứa các component trực quan hoá kết quả mô phỏng lộ trình xe và biểu đồ HOS (`routeGeometry.ts`, `CandidateHosTimeline.tsx`, `CandidateRouteMap.tsx`).
5. **`src/features/dashboard/`**:
   - `mocks/`: Chứa dữ liệu giả lập phục vụ phát triển giao diện dashboard chỉ số KPIs trước khi backend hoàn tất (`dashboardData.mock.ts`).

---

## 5. Quy tắc Đặt File Mới (Guidelines for Adding New Files)

Khi phát triển thêm tính năng hoặc mở rộng mã nguồn, lập trình viên **BẮT BUỘC** tuân thủ quy tắc sau:

| Loại tệp | Vị trí đặt file | Quy tắc đặt tên & chú thích |
|---|---|---|
| **API / Endpoint** | `src/features/<feature>/api/` | Tên tệp dạng `<feature>.api.ts` hoặc `<feature>.queries.ts`. Định nghĩa rõ endpoint path và query keys. |
| **Giao diện / Component** | `src/features/<feature>/components/` | Tên tệp PascalCase (ví dụ: `LoadCard.tsx`, `TripTimeline.tsx`, `columns.tsx`). |
| **Logic / Custom Hook** | `src/features/<feature>/hooks/` | Tên tệp camelCase bắt đầu bằng `use` (ví dụ: `useTripActions.ts`, `useVehicleTracking.ts`). |
| **Tiện ích riêng của domain** | `src/features/<feature>/utils/` | Tên tệp dạng `<feature>.<chức-năng>.ts` (ví dụ: `payroll.snapshot.ts`, `executive.metrics.ts`). |
| **Tiện ích dùng chung toàn hệ thống** | `src/utils/` hoặc `src/formatters/` | **KHÔNG** đặt tại feature utils nếu có từ 2 feature trở lên sử dụng. |
| **Cấu hình / Quy tắc nghiệp vụ** | `src/features/<feature>/config/` | Tên tệp dạng `<feature>.rules.ts` hoặc `<feature>.constants.ts`. |
| **Kiểu dữ liệu domain** | `src/features/<feature>/types.ts` | Kiểu dữ liệu đặc thù của riêng feature đặt tại đây. Tránh phụ thuộc vòng lặp type-only. |
| **Kiểu dữ liệu dùng chung hệ thống** | `src/types/common.types.ts` hoặc `src/types/api.types.ts` | Ví dụ: `Money`, `ISODateTime`, `ApiError`, `Pagination`. |
| **Chia sẻ cho Feature khác** | `src/features/<feature>/index.ts` | Mọi symbol cần dùng chéo feature phải được export tại `index.ts`. Không xuất các component hoặc helper nội bộ. |
| **Đăng ký Refine Resource** | `src/features/<feature>/<feature>.resource.ts` | Định nghĩa ResourceProps (`name`, `list`, `show`, `create`, `edit`, `meta`, `icon`). Sử dụng `@utils/resourceConfig`. |
