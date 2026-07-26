# Refine v4 integration

## Packages

The compatible dependency set used by this repository is:

```bash
npm install \
  @refinedev/core@4.58.0 \
  @refinedev/antd@5.47.0 \
  @refinedev/react-router-v6@4.6.2 \
  @refinedev/simple-rest@5.0.11 \
  @tanstack/react-query@4 \
  react@18 react-dom@18 react-router-dom@6 \
  antd@5 @ant-design/icons@5 axios
```

`@refinedev/simple-rest` is installed only as a reference. The application uses
the custom Spring REST provider in `src/providers/dataProvider.ts`.

## Structure and file responsibilities

```text
src/
  api/
    httpClient.ts          shared Axios instance
    interceptors.ts        Bearer/tenant headers, refresh retry, error mapping
    queryAdapter.ts        Refine filters/sort/pagination -> Spring query
    responseAdapter.ts     Spring Page/envelope -> Refine result
    errors.ts              Spring errors -> Refine HttpError
    endpoints.ts           centralized backend/resource endpoint mapping
    tenantSession.ts       client-side active-tenant state
  providers/
    dataProvider.ts        complete Refine v4 DataProvider
    authProvider.ts        complete Refine v4 AuthProvider
  services/
    authService.ts         login/logout/me domain actions
    authSession.ts         refresh request and token response mapping
    tokenStore.ts          in-memory access token
  resources/products/
    ProductList.tsx        useTable example
    ProductCreate.tsx      useForm create example
    ProductEdit.tsx        useForm edit example
    ProductShow.tsx        useShow example
    ProductForm.tsx        shared typed Ant Design form
  routes/
    AppRouter.tsx          existing React Router v6 tree, extended for products
    routeConfig.ts         route constants
```

`src/App.tsx` registers the providers and resource routes with `<Refine>`.
`src/main.tsx` remains the Vite entry and loads the Refine Ant Design reset
before the application's existing CSS. The existing `ConfigProvider` theme
tokens are unchanged.

The post-integration API audit and relocation decisions are documented in
`docs/api-refactor-audit.md`.

## Spring list contract

The default list adapter accepts Spring Data `Page<T>`:

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 10
}
```

It also accepts an envelope such as `{ "result": { ...page } }` and alternate
item keys `items`/`data`, plus total keys `total`/`totalCount`. Customize only
`src/api/responseAdapter.ts` if the real wrapper differs.

Pagination and sorting defaults:

- Refine page 1 becomes Spring `page=0`.
- `pageSize` becomes `size`.
- Every sorter becomes a repeated `sort=field,asc|desc` parameter.
- Equality becomes `field=value`.
- Other filters become `field.operator=value`, for example
  `name.contains=box`.
- Conditional `and`/`or` filters are serialized as a JSON `filter` parameter.

The filter convention is an explicit assumption. If the backend uses Spring
Specification, RSQL, FIQL, QueryDSL bindings, or a custom search DTO, change
only `src/api/queryAdapter.ts`.

Updates use `PATCH /{resource}/{id}` by default. The current `getMany` and bulk
methods safely fall back to individual REST calls because no bulk endpoint
contract was supplied.

## Authentication decision

Recommended production model:

1. `POST /auth/login` returns a short-lived access token.
2. The access token is kept only in JavaScript memory.
3. The backend sets a long-lived refresh token as a cookie with `HttpOnly`,
   `Secure`, and an appropriate `SameSite` policy.
4. Axios sends `Authorization: Bearer <access-token>`.
5. On the first 401, one shared `POST /auth/refresh` request obtains a new
   access token and retries the original request once.
6. A failed refresh clears auth state; Refine redirects to `/login`.

This avoids localStorage token persistence and reduces the impact of token
exfiltration through XSS. An HttpOnly cookie cannot be read to construct a
Bearer header, so it is used for refresh while the access token stays in
memory. Cookie auth requires CSRF-aware configuration, credentialed CORS, and
strict allowed origins.

`localStorage` survives reloads and is simple, but any successful XSS can read
and exfiltrate the token. `sessionStorage` shortens persistence but remains
JavaScript-readable. If the backend cannot issue an HttpOnly refresh cookie,
that limitation should be confirmed before deliberately switching storage.

The token mapper accepts `accessToken`, `access_token`, `token`, or `jwt`, at
the response root or inside `result`/`data`.

## Error mapping

The Axios response interceptor maps errors to Refine's `HttpError` contract:

```ts
{
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}
```

It recognizes common Spring `ProblemDetail` fields (`status`, `title`,
`detail`), custom `message`/`error`, object-based `errors`, and validation
arrays using `field`/`fieldName` plus `defaultMessage`/`message`. Refine AntD
then maps 400/422 field errors into `Form.Item`.

## Backend points to confirm

- Exact base URL and whether resource endpoint is `/products` or another path.
- Whether list response is a raw `Page<T>` or wrapped in `result`/another key.
- Filter grammar expected by Specification/QueryDSL and supported operators.
- Whether update expects `PATCH` or `PUT`.
- Exact login request fields (`username`/`password` are assumed).
- Exact access-token response field.
- Whether `/auth/refresh` reads an HttpOnly cookie and rotates it.
- Whether `/auth/logout` revokes the refresh token and clears its cookie.
- Shape of `/auth/me`, Spring validation errors, and general error responses.
- Credentialed CORS origin, cookie domain/path, `Secure`, `SameSite`, and CSRF
  policy for the deployed frontend/backend topology.
- Product fields in the real domain; the sample assumes `name`, `sku`,
  `description`, `price`, `stockQuantity`, and `active`.
