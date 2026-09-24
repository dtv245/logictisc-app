# Foundation integration contract

This document is the implementation contract for `FOUNDATION-100` and ADR-001.

## Runtime configuration

`GET /runtime-config.json` is same-origin, cache-disabled, and contains no secret. Required fields are validated by `runtimeConfigSchema`. `apiBaseUrl` is the origin/base before `/api`; OAuth redirects are absolute SPA URLs.

## Public health

```http
GET {apiBaseUrl}/api/health
Accept: application/json
X-Request-Id: <uuid>
```

No Authorization or tenant header is sent. A business-ready response is HTTP 200 with `status=UP` and `database=enabled`. Config error, network error, CORS, non-2xx, malformed JSON, non-UP, and disabled database all fail closed.

## OIDC and session

- Flow: Authorization Code + PKCE.
- Authority: `identityBaseUrl`; issuer/JWKS/audience are validated from runtime config.
- Access-token audience: `logisticsx.api`.
- Required token claims: `exp`, non-empty `tenant`, supported `role`/`roles`; `sub` must match OIDC profile when present.
- Tokens: in-memory only. OIDC state/nonce/PKCE verifier: sessionStorage only.
- 401: at most one single-flight renew and one replay.
- 403: no renew, no logout.
- Logout: Identity Server end-session endpoint when published; otherwise local session clear.

## Current user

```http
GET {apiBaseUrl}/api/me
Authorization: Bearer <access-token>
Accept: application/json
X-Request-Id: <uuid>
```

Success data:

```ts
interface CurrentUserResponse {
  subject: string;
  email: string | null;
  tenantId: string;
  roles: string[];
  employeeId: string;
}
```

The response subject and tenant must match the validated session boundary. A mismatch clears the session and fails authentication. UI display name falls back through OIDC name, preferred username, email, and subject.

## Tenant change

The SPA does not send `X-Tenant*`. The current tenant is the validated token `/api/me` tenant. A tenant-change action clears local session and starts a fresh Identity Server login; only the new signed token may change tenant.

## Refine resources

All endpoints use one-based `page`/`pageSize`, envelope `ApiResponse.data`, and `PUT` updates unless a resource explicitly says otherwise.

**Source of truth:** `foundationApiResources` in `src/pages/resourceRegistry.ts`. That object is what the running application actually registers; this table documents the same contract for backend reviewers. A resource absent from that object has no runtime route or menu entry even when a page component exists.

| Resource | Collection path | Allowed filters | Allowed sorts |
|---|---|---|---|
| customers | `/api/customers` | search, status | name, email, status |
| employees | `/api/employees` | search, status, roleId | firstName, lastName, email, status |
| drivers | `/api/drivers` | search, status | firstName, lastName, email, status |
| terminals | `/api/terminals` | search, type, countryCode | code, name, type, countryCode |
| trucks | `/api/trucks` | search, status, type | number, type, status, licensePlate |
| loads | `/api/loads` | search, status, customerId, truckId, dispatcherId | number, name, status, customerId |
| trips | `/api/trips` | search, status, truckId | number, name, status, totalDistance |
| invoices | `/api/invoices` | status, type, customerId, employeeId | number, type, status, dueDate |
| payments | `/api/payments` | status, invoiceId | recordedAt, status, referenceNumber |
| documents | `/api/documents` | type, status, loadId, truckId, employeeId | fileName, type, status |
| notifications | `/api/notifications` | none | none |
| roles | `/api/roles` | search | name |

Read-only resources: `documents`, `notifications` and `drivers` are registered without Refine `create`/`edit` actions, so the UI offers no create or edit route for them regardless of backend capability. `notifications` additionally sets `canDelete: false`.

Messaging uses feature adapters because conversations live at `/api/messages/conversations` and messages require principal-scoped parameters/actions; the generic `/conversations` resource must not call an invented endpoint.

## Transport and authorization

The transport is `src/providers/api/` (`createApiClient` plus envelope, error, query-serialization and retry helpers). The single UI role policy is `src/providers/permissions/`, which fails closed. Spring remains the final authorization authority.

## CORS

Backend CORS allows configured exact SPA origins, methods `GET,POST,PUT,PATCH,DELETE,OPTIONS`, headers `Authorization,Content-Type,X-Request-Id,Accept`, and exposes `Content-Disposition,X-Request-Id`. Credentials remain disabled for Bearer-only API calls.

## Routes

Routes are declared in `src/router/AppRouter.tsx` against the constants in `src/constants/routes.ts`.

| Route | Access | Purpose |
|---|---|---|
| `/diagnostics` | Public after health gate | Safe diagnostics |
| `/login` | Guest | Demo credentials in development or production OIDC action |
| `/auth/callback` | Public callback | Complete OIDC transaction |
| `/403` | Public | Forbidden recovery |
| `/select-tenant` | Authenticated | Current tenant and re-authenticate-to-change action |
| `/dashboard`, supported resources | Authenticated and tenant-bound | Business shell |

