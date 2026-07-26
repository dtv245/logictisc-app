# Logictics frontend

React 19 + TypeScript + Vite application using Refine v5 core, React Router 7,
Ant Design 6, Axios, and TanStack Query.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Backend contract

The frontend uses an HttpOnly-cookie session by default (`withCredentials: true`).
Configure CORS credentials and allowed frontend origins on the backend. Never put
the Lark client secret, tenant access token, user access token, or refresh token
in a `VITE_*` variable because Vite exposes those values to the browser.

API paths and the tenant header are configurable in `.env`. Pagination/filter/
sort conversion is isolated in `src/api/queryAdapter.ts`; API envelope conversion
is isolated in `src/api/responseAdapter.ts`.

See [docs/frontend-architecture-review.md](docs/frontend-architecture-review.md)
for the architecture, migration notes, assumptions, and test checklist.
