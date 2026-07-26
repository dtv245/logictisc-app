# CONVENTIONS.md — Logictics Frontend

> Quy ước bắt buộc cho React 18 + TypeScript + Refine v4 + Ant Design 5 + Sass.
> Tài liệu này là **nguồn sự thật về cấu trúc**. Quy ước về hooks/comment/i18n
> chi tiết xem thêm `.codex/AGENTS.md`.

---

## 1. Cấu trúc thư mục

```
src/
├── app/          # bootstrap: main.tsx, App.tsx, providers/, router/, refine.config.tsx
├── features/     # feature-first, mỗi resource một folder
├── shared/       # dùng chung: components/, hooks/, utils/, lib/, constants/, types/
├── store/        # Zustand slices (chỉ client state)
├── styles/       # Sass 7-1 rút gọn
└── assets/
```

### Quy tắc phụ thuộc (một chiều, không có ngoại lệ)

```
app  ──►  features  ──►  shared  ──►  (không phụ thuộc ai)
 │            │            ▲
 └────────────┴────────────┘
              store ◄──── features, app
```

| Từ | Được import | Bị cấm |
| --- | --- | --- |
| `shared/*` | `shared/*` | `app`, `features`, `store` |
| `store/*` | `shared/*` | `app`, `features` |
| `features/a/*` | `shared`, `store`, chính `features/a` | `features/b` (feature khác) |
| `app/*` | tất cả | — |

Feature cần dữ liệu của feature khác → nâng phần dùng chung lên `shared/`,
**không** import chéo `features/a → features/b`.

---

## 2. Đặt tên

| Loại | Quy tắc | Ví dụ |
| --- | --- | --- |
| Thư mục | `kebab-case` | `features/load-board/` |
| Component | `PascalCase.tsx` | `ShipmentStatusTag.tsx` |
| Page trong feature | `List/Create/Edit/Show.tsx` | `pages/List.tsx` |
| Hook | `useCamelCase.ts` | `useShipmentTable.ts` |
| Util / service | `camelCase.ts` | `formatMoney.ts`, `shipmentsApi.ts` |
| Schema | `<entity>.schema.ts` | `shipment.schema.ts` |
| Style module | `<Name>.module.scss` | `ShipmentForm.module.scss` |
| Sass partial | `_kebab-case.scss` | `_breakpoints.scss` |
| Type / interface | `PascalCase`, không prefix `I` | `Shipment`, không `IShipment` |
| Constant | `UPPER_SNAKE_CASE` | `SHIPMENT_STATUS_OPTIONS` |
| Query key factory | `camelCaseKeys` | `shipmentKeys` |

---

## 3. Import & barrel

- **Bắt buộc dùng alias.** Cấm `../../`. Cho phép `./x` trong cùng thư mục.

  ```ts
  // ✅
  import { AppError } from '@shared/lib/http'
  import { ShipmentForm } from '@features/shipments'

  // ❌
  import { AppError } from '../../shared/lib/http'
  ```

- Alias khả dụng: `@app`, `@features`, `@shared`, `@store`, `@styles`, `@assets`.
  Alias phải khớp **1-1** giữa `vite.config.ts` và `tsconfig.app.json > paths`.

- `index.ts` **chỉ được chứa `export`**. Không khai báo hàm, không `createElement`,
  không mảng cấu hình. Barrel chứa logic là lỗi review.

- Public API của feature = `features/<feature>/index.ts`. Bên ngoài **chỉ** được
  import từ đó, cấm import sâu vào `features/<f>/pages/List`.

- Chống circular import: `shared` không bao giờ import ngược lên. Nếu ESLint báo
  vòng lặp, tách phần dùng chung xuống một tầng thấp hơn — không dùng dynamic
  import để "chữa cháy".

---

## 4. Refine

- **Resource khai báo tập trung** tại `app/refine.config.tsx`: `name`,
  `list`/`create`/`edit`/`show`, `meta: { label, icon, canDelete, parent }`.
  Không rải file `*.resource.ts` trong feature.

- Page **chỉ dùng hook Refine**: `useTable`, `useForm`, `useSelect`,
  `useModalForm`, `useShow`. **Cấm gọi `axios` / `httpClient` trực tiếp trong
  component.**

  ```tsx
  // ✅ pages/List.tsx
  const { tableProps } = useShipmentTable()

  // ❌
  useEffect(() => { httpClient.get('/shipments').then(setRows) }, [])
  ```

- API tùy biến (action `PATCH`, export, bulk) đặt tại `features/<f>/api/`,
  bọc bằng `useCustomMutation` / `useCustom` trong `features/<f>/hooks/`.
  Component không gọi thẳng hàm trong `api/`.

- `dataProvider` là nơi duy nhất xử lý: unwrap envelope, map
  filter/sort/pagination, chuẩn hoá lỗi. Không unwrap `data.data` trong page.

- Header `X-Tenant-ID` do interceptor gắn. Không set header thủ công ở feature.

- Đổi tenant: gọi `useSwitchTenant`, hook này sở hữu toàn bộ việc
  `queryClient.clear()`. Cấm gọi `queryClient` thao tác cache tenant ở component.

---

## 5. Ant Design

- Theme tập trung ở `app/providers/theme.ts`, áp qua `ConfigProvider`.
  **Cấm hardcode màu / spacing / radius trong `.tsx` hoặc `.scss`.**

  ```scss
  // ✅
  padding: $spacing-lg;
  // ❌
  padding: 24px;
  color: #2563eb;
  ```

- Ưu tiên component của `antd` + `@refinedev/antd` (`List`, `Create`, `Edit`,
  `Show`, `useTable`). Chỉ tạo wrapper trong `shared/components` khi pattern lặp
  lại **≥ 2 lần** thật sự.

- Form: dùng `Form` của Antd, rule validate sinh từ Zod schema trong
  `features/<f>/schemas/` qua `shared/lib/zodAntd.ts`. Không viết rule inline
  trùng với schema.

- **Cấm override `.ant-*` trong file `.module.scss`.** Nếu bắt buộc, gom vào
  `styles/vendor/_antd-overrides.scss` kèm comment nêu lý do và link issue.

---

## 6. Sass

Kiến trúc 7-1 rút gọn:

```
src/styles/
├── abstracts/   _index.scss, _variables.scss, _mixins.scss, _functions.scss, _breakpoints.scss
├── base/        _reset.scss, _typography.scss
├── vendor/      _antd-overrides.scss
└── main.scss    chỉ @use, không khai báo rule
```

- Dùng `@use` / `@forward`. **Cấm `@import`** (đã deprecated trong Dart Sass).
- `abstracts/` được Vite auto-inject qua `css.preprocessorOptions.scss.additionalData`
  → trong file style **không cần** `@use "abstracts"`.
- Biến Sass map **1-1** với Antd design token, tham chiếu CSS variable do
  `theme.ts` phát ra. `theme.ts` là single source of truth.
- Style component dùng **CSS Module + BEM-lite**:

  ```scss
  .card { }
  .card__title { }
  .card--compact { }
  ```

- **Cấm `!important`.** Cấm selector sâu quá 3 cấp. Cấm style global ngoài
  `styles/base/`.

---

## 7. Data layer

- **Một axios instance duy nhất**: `shared/lib/http.ts`. Không `axios.create()`
  ở nơi khác.
- Lỗi chuẩn hoá về `AppError { code, message, fields }` (đồng thời tương thích
  `HttpError` của Refine qua alias `statusCode` / `errors`).
- Mọi response được validate bằng Zod. Type FE suy ra từ schema:

  ```ts
  export const shipmentSchema = z.object({ id: z.string(), /* ... */ })
  export type Shipment = z.infer<typeof shipmentSchema>   // ✅
  // ❌ export interface Shipment { id: string /* ... */ }  (khai báo trùng)
  ```

- Query key theo convention `[resource, action, params]`, sinh từ factory trong
  `features/<f>/api/queryKeys.ts`. `staleTime` khai báo tập trung ở
  `shared/lib/queryClient.ts`, không rải `staleTime` trong từng hook.
- **Zustand chỉ giữ client state** (auth flag, tenant đang chọn, UI toggle).
  **Cấm cache dữ liệu server trong Zustand** — đó là việc của TanStack Query.

---

## 8. Vite & env

- Alias trong `vite.config.ts` phải khớp `tsconfig.app.json > paths`.
- `manualChunks` tách vendor: `react`, `antd`, `refine`.
- `envPrefix: 'VITE_'`.
- **Env chỉ đọc qua `shared/lib/env.ts`** (validate bằng Zod).
  Cấm `import.meta.env` rải rác ngoài file đó.
- Route theo feature dùng `React.lazy` + `Suspense`. Page component phải là
  `export default` để `lazy()` không cần `.then(m => ...)`.

---

## 9. Checklist review PR

- [ ] Không còn import `../../`
- [ ] `index.ts` không chứa logic
- [ ] Không import chéo giữa hai feature
- [ ] Không gọi axios/httpClient trong component
- [ ] Không hardcode màu / spacing trong tsx & scss
- [ ] Không `!important`, không `.ant-*` ngoài `styles/vendor/`
- [ ] Type suy ra từ Zod schema, không khai báo interface trùng
- [ ] Zustand không chứa server data
- [ ] Resource mới đã khai báo trong `app/refine.config.tsx`
- [ ] Text hiển thị nằm trong locale, không hardcode
- [ ] `npm run build` và `npm run lint` xanh
