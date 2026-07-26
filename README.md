# Logictics frontend

React 18 + TypeScript + Vite application using Refine v4, React Router 6,
Ant Design 5, Axios, and TanStack Query 4.

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

The frontend keeps the short-lived access token in memory and sends it as a
Bearer token. The refresh token must be set by the backend as an HttpOnly cookie
(`withCredentials: true`). Configure credentialed CORS and allowed frontend
origins on the backend. Never put secrets or tokens in a `VITE_*` variable
because Vite exposes those values to the browser.

API paths and the tenant header are configurable in `.env`. Pagination/filter/
sort conversion is isolated in `src/api/queryAdapter.ts`; API envelope conversion
is isolated in `src/api/responseAdapter.ts`.

See [docs/refine-v4-integration.md](docs/refine-v4-integration.md) for package
versions, file responsibilities, API assumptions, authentication trade-offs,
and the backend confirmation checklist.
