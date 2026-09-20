# ADR-001: Unified runtime foundation

## Status

Accepted for `FOUNDATION-100` on 2026-08-30.

## Context

Before this decision was implemented, the repository contained two application
compositions:

- `src/App.tsx` mounted Refine with legacy providers and business routes.
- `src/app/App.tsx` mounted deploy-time runtime configuration, locale bootstrap,
  API health gating, and diagnostics.

The legacy transport assumed backend login/refresh/logout endpoints, a tenant
header, `PATCH`, and an envelope shape that did not match the Spring API. The
legacy entry and Phase 0 router were removed after the unified runtime became
the only production composition.

## Decision

Use one composition rooted at `src/app/App.tsx`:

```text
main
  -> initialize vi/en i18n
  -> AppBootstrap
     -> load /runtime-config.json
     -> apply configured locale
     -> public GET /api/health
     -> RuntimeConfigProvider
     -> RuntimeApplication
        -> OIDC/session dependencies
        -> Logistics API client
        -> Refine auth/data/access-control providers
        -> BrowserRouter
        -> public diagnostics/auth routes
        -> protected tenant-aware layout/business routes
```

The runtime dependency graph is created from validated runtime config and remains stable for that deployment configuration.

### Authentication

- Production uses Authorization Code + PKCE through `oidc-client-ts`.
- OIDC transaction state uses `sessionStorage`; token-bearing user state uses an in-memory store.
- Spring remains a resource server. The SPA never calls Spring `/login`, `/refresh`, or `/logout`.
- A 401 may trigger one single-flight OIDC renew/replay; a 403 never refreshes or logs out.
- Development demo auth remains opt-in and build-mode gated. It never creates a Bearer token.

### Identity and tenant

- JWT validation establishes the initial subject, roles, and tenant boundary.
- Protected `GET /api/me` confirms subject/email/tenant/roles and supplies `employeeId`.
- Tenant is never selected by an arbitrary request header.
- “Change tenant” clears the current session and starts a fresh Identity Server authentication so a new token/tenant claim is required. The SPA does not claim live multi-tenant switching is verified until the Identity Server exposes and documents that chooser.

### API and authorization

- The new `core/api` client is the only production transport.
- Resource definitions explicitly map supported resource names to `/api/**`, allowed filters/sorts, and `PUT` updates.
- `core/permissions` is the single UI role policy and fails closed. Spring remains final authorization authority.

### Routing and localization

- Diagnostics, login, callback, forbidden, and not-found are public after the health gate.
- Business layout and resources are protected and cannot flash before auth check.
- Foundation/auth/layout text is sourced from vi/en catalogues. Refine receives an i18n adapter and localized resource labels.

## Alternatives rejected

1. Keep `src/App.tsx` and patch legacy providers: rejected because it leaves deploy-time config/health/diagnostics disconnected and duplicates already tested core infrastructure.
2. Run both apps under separate route trees: rejected because provider/session/query boundaries would diverge and behavior would remain environment-dependent.
3. Let the browser switch tenant with `X-Tenant-Key`: rejected because it conflicts with backend JWT tenant routing and weakens the trust boundary.

## Consequences

- Existing business page components can be reused, but composition/providers/routes are replaced.
- Unsupported menu resources may be hidden until a backend contract exists.
- The external Identity Server remains the only blocker to live production-login and tenant-change proof; mocked OIDC tests are necessary but not sufficient for a production-ready verdict.
- Test/runtime dependencies and Vite/Vitest scripts must be declared in `package.json` instead of relying on extraneous `node_modules` state.
