# `src/api` post-Refine audit

This audit was completed before deleting or relocating any API module. Direct
imports were checked with both repository-wide text search and GitNexus file
impact analysis.

## Classification

| Original file | Function/module | Group | Decision and reason |
| --- | --- | --- | --- |
| `api/authApi.ts` | `login` | B | Auth action, not resource CRUD. Moved unchanged to `services/authService.ts`. |
| `api/authApi.ts` | `getCurrentUser` | B | Identity action used by auth/access-control providers. Moved to `services/authService.ts`. |
| `api/authApi.ts` | `logout` | B | Auth/session action. Moved to `services/authService.ts`. |
| `api/authSession.ts` | `isRecord`, `unwrapResult` | B | Internal token-response mapping. Moved with the auth session service. |
| `api/authSession.ts` | `readAccessToken` | B | JWT response mapping, unrelated to standard CRUD. Moved to `services/authSession.ts`. |
| `api/authSession.ts` | `refreshAccessToken` | B | Special refresh action with single-flight behavior. Moved to `services/authSession.ts`. |
| `api/endpoints.ts` | `endpoints` | B | Central auth/tenant endpoint configuration. Already centralized; retained. |
| `api/endpoints.ts` | `normalizePath` | B | Internal resource-path normalization used by the Refine provider. Retained. |
| `api/endpoints.ts` | `getResourceEndpoint` | B | DataProvider implementation helper, not a competing CRUD call. Retained. |
| `api/endpoints.ts` | `getResourceItemEndpoint` | B | DataProvider implementation helper, not a competing CRUD call. Retained. |
| `api/errors.ts` | `statusMessages`, `isRecord`, `normalizeValidationErrors`, `readErrorPayload` | B | Internal Spring-to-Refine `HttpError` mapping. Retained. |
| `api/errors.ts` | `ApiHttpError`, `normalizeApiError` | B | Shared provider/auth error boundary. Retained. |
| `api/errors.ts` | `getApiErrorMessage` | C | Pure client-side message helper; currently unused but unrelated to CRUD. Left untouched. |
| `api/httpClient.ts` | `httpClient` | B | One shared Axios transport consumed by DataProvider and auth service. Retained. |
| `api/interceptors.ts` | `matchesEndpoint`, `attachInterceptors` | B | Cross-cutting Bearer, tenant, refresh, and error behavior. Retained. |
| `api/queryAdapter.ts` | `isConditionalFilter`, `serializeValue`, `appendFilter`, `appendQuery` | B | Internal mapping from Refine query contracts to Spring query params. Retained. |
| `api/queryAdapter.ts` | `buildQueryParams` | B | Required by DataProvider `getList` and `custom`; already correctly delegated. |
| `api/responseAdapter.ts` | `isRecord`, `readNumber` | B | Internal Spring response parsing. Retained. |
| `api/responseAdapter.ts` | `unwrapApiResponse`, `adaptListResponse`, `adaptRecordResponse` | B | Required to map Spring Page/envelopes into Refine responses. Retained. |
| `api/tenantSession.ts` | `canUseSessionStorage` | C | Pure browser capability check. Left untouched. |
| `api/tenantSession.ts` | `getActiveTenantKey`, `setActiveTenantKey`, `clearActiveTenantKey` | C | Client-side tenant context, not API CRUD. Left untouched. |
| `api/tokenStore.ts` | `tokenStore.clear/get/set` | B | Auth-session infrastructure. Moved unchanged to `services/tokenStore.ts`. |

No function matched group A. The repository has no resource-specific manual
CRUD module; all list/get/create/update/delete requests are already implemented
by `providers/dataProvider.ts`.

## Import evidence before relocation

- `authApi.ts`: directly imported by `authProvider.ts` and
  `accessControlProvider.ts`.
- `authSession.ts`: directly imported by `interceptors.ts` and `authApi.ts`.
- `tokenStore.ts`: directly imported by `interceptors.ts`, `authSession.ts`,
  and `authApi.ts`.
- `queryAdapter.ts`: only directly imported by `dataProvider.ts`.
- `responseAdapter.ts`: directly imported by `dataProvider.ts` and the auth
  service.
- `httpClient.ts`: directly imported by `dataProvider.ts` and the auth service.
- No resource page imports Axios, `httpClient`, or a deleted API path directly.

## File operations

Relocated without changing public function contracts:

- `src/api/authApi.ts` → `src/services/authService.ts`
- `src/api/authSession.ts` → `src/services/authSession.ts`
- `src/api/tokenStore.ts` → `src/services/tokenStore.ts`

No group-A file or function was deleted. The three old paths were removed only
after every direct importer was updated and a TypeScript check passed after
each relocation.
