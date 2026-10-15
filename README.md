# Logistics frontend

React 18 + TypeScript + Vite application using Refine v4, React Router 6,
Ant Design 5, Axios, and TanStack Query 4.

## Cấu trúc thư mục (Target Global Architecture)

Dự án chuẩn hoá theo cấu trúc phân tầng theo loại file ở tầng global, loại bỏ hoàn toàn `src/features/` (chi tiết quy tắc tại `AGENTS.md`):

```
src/
├── api/          # hàm gọi API: api/<domain>/<domain>.api.ts
├── components/   # component dùng lại: components/<domain>/
├── hooks/        # mọi hook: hooks/<domain>/use*.ts
├── pages/        # mỗi màn hình một file: pages/<domain>/
├── resources/    # định nghĩa resource Refine
├── types/        # chỉ type thuần: types/<domain>/*.types.ts
├── utils/        # hàm thuần dùng chung, chia theo chủ đề
├── constants/    # routes, enum
├── lib/          # axios client, query client, i18n
├── locales/
├── App.tsx
└── main.tsx
```

File test nằm cạnh file được test.

### Nguyên tắc kiến trúc:
1. **Loại file quyết định thư mục**: hook -> `hooks/`, API -> `api/`, type -> `types/`.
2. **Chiều phụ thuộc một chiều (DAG)**: `App`/`resources` -> `pages` -> `components` -> `hooks` -> `api` -> `types`/`utils`/`lib`/`constants`. Tầng dưới không import tầng trên.
3. **`types/` chỉ chứa type thuần**: không resource config, không endpoint, không hằng số.
4. **Đường dẫn import tường minh**: Import bằng đường dẫn đầy đủ qua alias `@/`. Không tạo `index.ts` gom export.
5. **Page mỏng**: Chỉ ghép component và hook; logic ở hooks, gọi API ở api.
6. **`utils/` hàm thuần**: Không hook React, không gọi API, dùng từ 3 nơi trở lên.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Local development includes one UI-only account so the dashboard can be opened
while the external Identity Server is unavailable:

```text
Username: admin@logicstic.local
Password: Logicstic@2026
```

The account is enabled by `VITE_DEMO_AUTH_ENABLED=true`, works only in Vite
development mode, and does not grant access to protected backend APIs.

### API origin and the dev proxy

The Spring API has no CORS configuration, so in development the Vite dev server
proxies every `/api/**` request to the backend. `public/runtime-config.json`
therefore points `apiBaseUrl` at the app origin (`http://localhost:5173`) and
the browser only ever talks to the dev server (same-origin).

The proxy target defaults to `http://localhost:8080` (Docker Compose). If the
API runs through IntelliJ (`--spring.profiles.active=local`, port 18080), set:

```bash
# .env
API_PROXY_TARGET=http://localhost:18080
```

Quality checks:

```bash
npm run lint
npm run build
```

## Backend contract

Production authentication uses Authorization Code + PKCE. Access tokens stay
in memory and the Spring API is called with a Bearer token; the browser never
overrides the tenant with a custom header. Runtime endpoints and OAuth metadata
come from `public/runtime-config.json`, which must not contain secrets.

The production Refine composition lives in `src/app/runtime`. API resource
contracts, filter/sort allowlists and update methods live in
`src/app/runtime/resources.ts`; transport and envelope adaptation live in
`src/core/api`.

See [ADR-001](docs/adr/001-unified-runtime-foundation.md) for the architecture
decision and the [foundation integration contract](docs/foundation-integration-contract.md)
for current API, auth, tenant and resource assumptions.
