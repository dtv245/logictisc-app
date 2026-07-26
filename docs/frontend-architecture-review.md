# Frontend hooks architecture review

## 1. Đánh giá hiện trạng trước migration

- `package.json` chưa có `@refinedev/core`, `@refinedev/react-router` hoặc
  `@refinedev/antd`, dù `src/App.tsx` import các package này.
- `src/App.tsx` import `src/pages/products/ProductList` không tồn tại, nên project
  không thể type-check/build.
- `src/providers/dataProvider.tsx` chỉ có một function rỗng; chưa có method CRUD,
  pagination, filter, sorter, response mapping hoặc error mapping.
- Các file auth, HTTP client, router, layout, dashboard và Lark callback đều rỗng.
- Chưa có `authProvider`, protected route, identity/permission hooks hoặc xử lý
  session hết hạn.
- Chưa có tenant source of truth, membership validation, switch-tenant flow hoặc
  cache isolation giữa các tenant.
- Chưa có custom CRUD hook nên không có hook trùng để loại bỏ. Không có resource
  nghiệp vụ/backend contract để tạo wrapper CRUD hợp lệ.
- Không có cache invalidation sau mutation hoặc khi chuyển tenant.
- Ant Design đang ở v6, trong khi `@refinedev/antd@6.0.3` chỉ khai báo peer support
  cho Ant Design v5. Migration giữ Ant Design 6 trực tiếp và không cài integration
  package có peer conflict.

## 2. Kiến trúc sau migration

```text
Page / Layout
  -> business hook (chỉ auth/tenant/error có logic thực)
  -> Refine hook (useLogin/useLogout/useGetIdentity/useCustomMutation/...)
  -> dataProvider hoặc authProvider
  -> shared Axios instance
  -> REST backend
```

- Page chỉ render và phát event; không gọi Axios.
- Business hook đóng gói OAuth, identity typing, tenant derivation và tenant cache
  boundary. Không tạo wrapper cho `useList`/`useOne` khi chưa có nghiệp vụ thêm.
- Refine quản lý query/mutation state, auth state, navigation và notification.
- Provider chuyển contract Refine sang contract REST và không để component biết
  envelope backend.
- Axios instance duy nhất cấu hình base URL, cookie, timeout, tenant header và
  chuẩn hóa lỗi.
- Backend vẫn là nguồn xác thực tenant membership. `X-Tenant-Key` chỉ là context,
  tuyệt đối không phải bằng chứng người dùng có quyền vào tenant.

## 3. Contract và adapter cần xác nhận với backend

Do repository không có OpenAPI/backend source, các điểm chưa thể suy ra được gom
vào adapter/env thay vì rải trong component:

- `queryAdapter.ts`: page của UI là 1-based, backend mặc định 0-based; `size`; sort
  dạng `sort=field,asc`; filter `eq` dùng tên field trực tiếp, operator khác dùng
  `field.operator=value`.
- `responseAdapter.ts`: hỗ trợ envelope `{ code, message, result }`, list trong
  `result.items`, `result.content` hoặc `result.data`, total trong
  `totalElements`, `total` hoặc `totalCount`.
- Update mặc định dùng `PATCH /resource/:id`.
- `getMany`, `createMany`, `updateMany`, `deleteMany` fallback bằng các request đơn
  vì chưa có bulk endpoint contract.
- Auth path, tenant-switch path và tenant header đều cấu hình qua `.env`.
- Tenant switch chấp nhận response record/envelope, envelope result rỗng hoặc HTTP
  204. Sau đó `/auth/me` phải trả đúng `tenantKey`; nếu không frontend dừng với
  lỗi 403.

## 4. Authentication và multi-tenant

```text
/login
  -> useLarkLogin -> useLogin -> authProvider.login
  -> browser redirect tới backend Lark login endpoint
  -> Lark + backend callback tạo HttpOnly session
  -> /auth/lark/callback
  -> useLogin(mode=callback) -> GET /auth/me
  -> Refine invalidates auth queries -> /dashboard
```

- Axios dùng `withCredentials: true`; frontend không lưu access/refresh token.
- Chỉ `tenantKey` không nhạy cảm được lưu trong `sessionStorage` để gắn context
  header. Session/token vẫn do backend kiểm soát.
- 401 xóa tenant context và chuyển `/login`; 403 chuyển `/403` nhưng không tự xóa
  session hợp lệ.
- Route `/login` và callback nằm ngoài protected tree. Người đã đăng nhập vào
  `/login` được chuyển về dashboard.
- Nếu identity chưa có tenant hiện tại, tenant guard chuyển `/select-tenant`.
- Khi switch tenant thành công: hủy query đang chạy, xóa query `data`/`access`,
  reset auth queries, tải lại identity/permissions, xác nhận tenant từ backend,
  rồi replace route về dashboard.

## 5. CRUD và cache

Không tạo custom CRUD wrapper khi chưa có resource nghiệp vụ. Page resource mới
nên gọi Refine trực tiếp và chỉ tạo business hook nếu có thêm default filter,
permission, mapping, notification hoặc related-resource invalidation:

```ts
const employeeList = useList<Employee, ApiError>({
  resource: "employees",
  pagination: { currentPage: 1, pageSize: 10 },
});
```

Các mutation chuẩn của Refine tự invalidate list/many tương ứng. Chỉ gọi
`useInvalidate` cho quan hệ nghiệp vụ thêm (ví dụ update employee cần invalidate
dashboard summary). Không xóa toàn cache cho CRUD đơn lẻ; xóa rộng chỉ xảy ra ở
tenant boundary.

## 6. Error policy

Axios interceptor chuyển mọi lỗi thành `ApiHttpError` theo shape:

```ts
interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}
```

Các status 400, 401, 403, 404, 409, 422 và 500 có fallback message riêng. Refine
notification provider hiển thị mutation errors bằng Ant Design; `useApiError` dùng
cho lỗi business xảy ra sau mutation (ví dụ backend không xác nhận tenant).

## 7. Checklist kiểm tra tích hợp

- [ ] Backend cho phép credentialed CORS từ origin frontend.
- [ ] Lark redirect URI trỏ đúng `/auth/lark/callback`.
- [ ] Đăng nhập Lark thành công và `/auth/me` trả identity.
- [ ] User từ chối/đăng nhập Lark thất bại hiển thị error, không spinner vô hạn.
- [ ] Session hết hạn trả 401 và chuyển `/login`.
- [ ] Truy cập `/dashboard` khi chưa đăng nhập bị bảo vệ.
- [ ] User đã đăng nhập không xem lại `/login`.
- [ ] 403 không xóa nhầm session và chuyển `/403`.
- [ ] List/create/update/delete map đúng response thật của backend.
- [ ] Pagination page 1 ở frontend thành page 0 ở backend.
- [ ] Filter/sorter query đúng OpenAPI backend.
- [ ] Validation 422 map đúng field errors.
- [ ] Chuyển tenant gọi backend và `/auth/me` trả tenant mới.
- [ ] Không còn dữ liệu hoặc permission cache của tenant cũ.
- [ ] Backend từ chối tenantKey không thuộc memberships của user.
- [ ] `npm run lint` và `npm run build` pass.
