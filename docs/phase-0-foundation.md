# Phase 0 integration foundation

## Scope

Phase 0 contains runtime configuration, API availability, OAuth/OIDC session
infrastructure, the custom Refine data provider, permission guards, shared UI
states and their tests. It contains no business feature implementation.

## Runtime bootstrap

1. Load and validate `/runtime-config.json`.
2. Probe public `/api/health` without an Authorization header.
3. Distinguish a CORS-blocked response from an unreachable API using a
   secondary `no-cors` reachability probe.
4. Refuse business navigation when configuration is invalid, the API is
   unhealthy, or `database=disabled`.
5. Initialize OIDC, HTTP and Refine providers only after those checks pass.

Runtime config is public deployment metadata. It must never contain credentials
or tokens.

## Session isolation

OIDC authorization state and nonce may use `sessionStorage` only for the
redirect round trip. Access and refresh tokens use memory storage. A full page
reload may therefore require a new authorization redirect, which is safer than
persisting bearer credentials in browser storage.

JWT `tenant` is the only tenant source implemented by the backend. The frontend
does not send a tenant override header and clears server-state cache whenever
the authenticated session changes.

## Query keys

Feature modules must use exactly:

```text
[resource, "list", filters]
[resource, "detail", id]
[resource, "options", search]
```

Tenant isolation comes from the validated token and session-bound query cache,
not an arbitrary URL/header tenant value.

## Verification boundary

Unit and mocked integration tests may pass without external services. Live
OAuth, browser CORS and truthful readiness remain FAIL until the corresponding
entries in `backend-gaps.md` are resolved.
