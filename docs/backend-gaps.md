# Backend gaps and production blockers

This file is the explicit ticket register required by `frontend-context.md`.
Frontend code must fail closed or feature-flag affected behavior; it must not
invent endpoints or replace backend authorization.

| ID | Status | Gap | Required resolution |
|---|---|---|---|
| BE-001 | BLOCKED | Spring has no CORS configuration. A real preflight from `http://localhost:5173` returns no `Access-Control-Allow-*` headers. | Whitelist exact origins; allow `GET, POST, PUT, DELETE, OPTIONS`; allow `Authorization, Content-Type, X-Request-Id`; expose `Content-Disposition`. Keep credentials disabled for the approved Bearer-only flow. |
| BE-002 | BLOCKED | Identity Server is outside the repository and `https://localhost:7001` is currently unreachable. OAuth client ID, redirect URIs, scopes and refresh/logout capabilities are unconfirmed. | Provide deployed discovery endpoint and SPA client configuration. Confirm refresh-token rotation or another secure renewal mechanism. |
| BE-003 | PHASE 4 | There is no `/api/me` or trusted JWT `employeeId` mapping. | Add and validate an employee claim or implement `GET /api/me`. Never ask users to select themselves. |
| BE-004 | PHASE 4 | Messaging trusts caller-supplied `employeeId`; notifications and mark-all-read are tenant-wide. | Bind messaging identity to the JWT principal and define per-user notification semantics before production enablement. |
| BE-005 | PHASE 2 | Upload has no enforced maximum size, MIME policy, content sniffing, malware quarantine, signed URL or idempotency contract. | Define and enforce the policy server-side. Keep `documentUpload` feature-flagged off until approved. |
| BE-006 | BLOCKED | `/api/health` hard-codes `status=UP` and derives database state only from the profile name. | Return truthful readiness from the contracted endpoint, or explicitly add `/actuator/health` to the frontend contract. |
| BE-007 | OPEN | Runtime OpenAPI describes all create operations as `200`, while controllers return `201`; it omits documented error responses and nullable fields. | Correct response annotations and schema nullability before client generation is considered safe. |
| BE-008 | OPEN | UUID/type mismatch, missing parameters, unsupported methods and media types can fall through to `500 INTERNAL_ERROR`. | Map framework client exceptions to stable `400`, `405` and `415` envelopes. |
| BE-009 | OPEN | OpenAPI claims MCP API key and `X-Tenant` resolution, while current Java source only resolves the JWT `tenant` claim. | Align documentation and implementation. The frontend will not send `X-Tenant`. |
| BE-010 | OPEN | Spring default `/logout` returns a form-login redirect but does not revoke OIDC tokens. | Disable the default endpoint or document it as unsupported. Frontend logout must use Identity Server metadata only. |
| BE-011 | HARDENING | The JWT converter creates an authority for any role string and `/api/**` has an authenticated fallback. | Whitelist supported roles and require every new API route to have an explicit matcher/method policy. |
| BE-012 | PHASE 3 | Load-dispatch invoice status comparison is case-sensitive (`Draft` versus `draft`). | Normalize invoice states before frontend relies on automatic issue behavior. |
| BE-013 | OPEN | Currency strings are not validated as ISO currency codes. | Define currency validation and rounding policy. |

## Dependency residual risk

Exact transitive overrides keep `brace-expansion` and `path-to-regexp` on
patched releases. `npm audit --omit=dev` still reports two moderate advisories
in React Router 6; the available automatic fix upgrades to Router 7 and would
violate the approved Refine v4/Router 6 stack.

Until an explicit stack migration is approved:

- navigation destinations are selected from application route constants;
- untrusted strings are never passed directly to `navigate` or link targets;
- this Vite SPA does not use React Router SSR hydration/deserialization;
- the residual audit result remains a Phase 0 FAIL for a zero-vulnerability
  production gate.
