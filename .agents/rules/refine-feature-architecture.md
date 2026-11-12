# LogisticsX Refine Feature Architecture Rule

This rule applies to all frontend architecture work, type refactoring,
backend DTO integration, Refine resource design, feature organization,
mappers, pages, schemas, validators, and data-flow refactoring.

Project:

`/home/vumoi/logictics-app`

The existing architecture MUST be preserved unless a concrete problem
justifies a change.

Do not redesign the project from scratch.

---

# 1. Target Global File-Type Architecture

The project architecture strictly follows `AGENTS.md` (the highest priority rule) and `docs/adr/001-unified-runtime-foundation.md`.

The target architectural boundaries (`src/`) are organized globally by file type:

```text
src/
├── api/          # API calls: api/<domain>/<domain>.api.ts
├── components/   # Reusable and domain UI components: components/<domain>/
├── hooks/        # All hooks: hooks/<domain>/use*.ts
├── pages/        # One screen per file: pages/<domain>/
├── resources/    # Refine resource definitions: resources/*.resource.ts
├── types/        # Pure types only: types/<domain>/*.types.ts
├── utils/        # Pure shared utilities partitioned by topic
├── constants/    # Global routes, enums, constants
├── lib/          # Axios client, query client, i18n
├── locales/      # Internationalization dictionaries
├── config/       # Runtime config, bootstrap, health gate
├── providers/    # Refine auth, data, permissions, notification providers
├── router/       # AppRouter, ProtectedRoute, TenantGuard
├── styles/       # Global stylesheets
├── App.tsx       # Root runtime composition
└── main.tsx      # Application entry point
```

**BANNED & DECOMMISSIONED DIRECTORIES:**
- `src/app/`, `src/core/`, `src/common/`, `src/shared/`: **Explicitly banned** per ADR-001 (flattened into `src/App.tsx`, `src/config/`, `src/providers/`, `src/components/`, `src/hooks/`, `src/utils/`). Do NOT re-create them.
- `src/features/`: **Deprecated and actively being eliminated** per `AGENTS.md`. The target is to completely eliminate `src/features/` and move all code to global type-based folders (`api/`, `components/`, `hooks/`, `pages/`, `types/`, `resources/`). Do NOT create new files in `src/features/` and NEVER move files back into `src/features/`.

---

# 2. Responsibilities Of Current Layers

## App & Runtime Composition (`App.tsx`, `config/`, `router/`)

Replacing legacy `app/`:
- `main.tsx` initializes i18n and mounts `App`.
- `App.tsx` composes the unified runtime foundation, runtime config provider, and Refine providers.
- `config/` handles deploy-time runtime configuration loading (`runtime-config.json`), bootstrap, and `/api/health` gate.
- `router/` manages application routing, `ProtectedRoute`, and `TenantGuard`.

Do not move domain business logic into top-level composition.

---

## Technical Providers (`providers/`)

Replacing legacy `core/`:
`src/providers/` hosts technical infrastructure and Refine integrations:
- `providers/api/`: Axios client infrastructure, envelope unwrapping, correlation headers, HTTP error normalization.
- `providers/auth/`: OIDC integration, session management, token handling.
- `providers/permissions/`: Role matrix, access-control infrastructure, JWT role interpretation.
- `providers/dataProvider.ts`: Refine DataProvider.
- `providers/notificationProvider.ts`: Refine notification integration.

`providers/` MUST NOT contain domain-specific business logic.

---

## Global Domain & Utility Layers (`api/`, `components/`, `hooks/`, `pages/`, `resources/`, `types/`, `utils/`)

Replacing legacy `common/` and decommissioned `features/`:
- `api/`: API calling functions: `api/<domain>/<domain>.api.ts`.
- `components/`: Reusable components as well as domain components: `components/<domain>/`.
- `hooks/`: Domain hooks: `hooks/<domain>/use*.ts`.
- `pages/`: Thin screen pages: `pages/<domain>/`.
- `resources/`: Refine resource definitions: `resources/*.resource.ts`.
- `types/`: Pure types only: `types/<domain>/*.types.ts`.
- `utils/`: Shared pure functions (no React hooks, no API calls, used across 3+ places).

---

## config/

`src/config/` contains runtime configuration loading, bootstrap, and environment access:

```text
src/config/
├── AppBootstrap.tsx
├── RuntimeConfigProvider.tsx
└── env.ts
```

This layer loads `/runtime-config.json`, gates the application on `/api/health`, and provides runtime configuration context per ADR-001.

---

## constants/

Keep `constants/` as the application-wide constants layer.

Current examples include:

```text
constants/
├── routes.ts
└── ui.ts
```

Global constants belong here.

Business-domain constants and enums belong in `src/constants/` or their respective domain types in `src/types/<domain>/`.

Example:

```text
global route names
→ constants/routes.ts

generic UI defaults
→ constants/ui.ts

Load business status
→ types/loads/

Customer business type
→ types/customers/
```

---

# 3. Canonical Backend-To-UI Data Flow

For domain data, prefer this conceptual flow:

```text
Spring Boot DTO
      ↓
API Transport Type
      ↓
Mapper (only when necessary)
      ↓
Frontend Domain Type
      ↓
Refine Resource / Hook / Component
      ↓
Route Page
```

For create/update operations:

```text
Page / Form
    ↓
Form Values
    ↓
Validation / Schema
    ↓
Request Type
    ↓
Request Mapper (only when necessary)
    ↓
Refine dataProvider
    ↓
src/providers/api
    ↓
Spring Boot
```

Do not skip architectural boundaries by putting backend-data
transformation directly inside pages or table components.

---

# 4. Global Architecture Reference Pattern

The target structure organizes domain artifacts across global type-based folders:

```text
src/
├── api/customers/customer.api.ts
├── components/customers/columns.tsx
├── hooks/customers/
├── pages/customers/
│   ├── create.tsx
│   ├── edit.tsx
│   ├── list.tsx
│   └── show.tsx
├── resources/customers.resource.ts
└── types/customers/customer.types.ts
```

Use this as a REFERENCE for API/domain separation across all domains.

Do NOT create empty directories for architectural symmetry.

A domain only needs:

* API types when backend DTO contracts require them
* domain types when frontend semantics differ
* mappers when transformation actually exists
* schemas when runtime/form validation is required
* validators when business validation exists

---

# 5. API Transport Types

Backend request/response contracts belong inside `src/types/<domain>/` or `src/api/<domain>/`.

Preferred naming:

```text
types/customers/customer.types.ts
types/loads/load.types.ts
types/trips/trip.types.ts
```

Examples:

```ts
export interface CustomerResponse {
  id: string;
  legalName: string;
  status: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  legalName: string;
}

export interface UpdateCustomerRequest {
  legalName?: string;
}
```

API transport types must match the Spring Boot contract accurately.

Do not silently rename backend fields in API transport types.

Do not convert strings to Date, Money, or UI-friendly structures
inside transport types.

---

# 6. Frontend Domain Types

Frontend domain types belong in:

```text
types/<domain>/<entity>.types.ts
```

Example:

```ts
export interface Customer {
  id: string;
  name: string;
  createdAt: Date;
}
```

A domain type may differ from the backend API transport type.

If no meaningful difference exists between the API type and frontend
domain type, do NOT create a second type only for architectural appearance.

Avoid needless duplication.

---

# 7. Mappers

Mappers (when required) belong in `src/utils/` or domain utilities:

```text
utils/<domain>/mapper.ts
```

Create a mapper only when real transformation is required.

Example:

```ts
export function mapCustomerResponse(
  response: CustomerResponse,
): Customer {
  return {
    id: response.id,
    name: response.legalName,
    createdAt: new Date(response.createdAt),
  };
}
```

Mapper responsibilities may include:

* backend field name → frontend field name
* ISO date string → Date
* backend nested DTO → frontend-friendly domain object
* request-form mapping
* nullable transport structure normalization

Do NOT create identity mappers such as:

```ts
return { ...response };
```

unless they provide a meaningful boundary required by the architecture.

Do not perform this transformation repeatedly inside pages,
columns, or React components.

---

# 8. TypeScript Is Not Java

Do not recreate Java DTO/entity inheritance structures in TypeScript.

Do not introduce classes merely because Spring Boot uses classes.

Prefer:

```ts
interface
type
```

for data contracts.

Use classes only when runtime behavior, invariants, encapsulation or
value-object behavior is required.

Good possible class candidates:

```text
Money
DateRange
Coordinates
```

Bad class candidates:

```text
CustomerResponse
LoadResponse
EmployeeResponse
```

when they only store data.

Prefer composition over inheritance.

---

# 9. Generic API Types

Generic API infrastructure types belong to `src/types/api.types.ts` or `src/providers/api/`.

Examples:

```ts
ApiResponse<T>
ApiError
ResponseMeta
PaginationMeta
HttpError
```

The current project contains:

```text
types/api.types.ts
providers/api/apiClient.ts
```

Preferred ownership:

```text
HTTP/API transport contract
→ types/api.types.ts, providers/api/

generic reusable non-API types
→ types/
```

---

# 10. Pure Domain Type Ownership

Pure domain types belong to `src/types/<domain>/`:

Examples:

```text
Accident
→ types/accidents/

AiDispatch
→ types/ai-dispatch/

ApiKey
→ types/api-keys/

Customer
→ types/customers/

Document
→ types/documents/

Load
→ types/loads/

Notification
→ types/notifications/

Trip
→ types/trips/

Truck
→ types/trucks/
```

Do NOT put resource configuration, endpoints, or constants in `types/`.

---

# 11. Refine Resource Files

Resource definition files live in `src/resources/`:

```text
resources/customers.resource.ts
resources/loads.resource.ts
resources/trips.resource.ts
```

Keep this convention.

A `*.resource.ts` file should define Refine resource-related metadata
and feature integration.

It may define things such as:

* resource name
* route metadata
* labels
* CRUD capabilities
* icon/meta information
* feature-specific resource configuration

Do NOT use `*.resource.ts` as a dumping ground for:

* API DTO declarations
* Axios implementation
* React page components
* generic validation
* unrelated business utilities

---

# 12. Generic Refine CRUD Infrastructure

The project has generic CRUD infrastructure in `src/components/resources/`:

```text
components/resources/ResourceCreatePage.tsx
components/resources/ResourceEditPage.tsx
components/resources/ResourceListPage.tsx
components/resources/ResourceShowPage.tsx
components/resources/resourceCapabilities.ts
components/resources/ResourceFormFields.tsx
components/resources/resourceForms.ts
```

Preserve and reuse existing generic CRUD infrastructure when appropriate.

Do not recreate per-feature CRUD infrastructure that Refine and the existing
generic components already solve.

---

# 13. Pages Stay Route-Level

The global architecture separates page routes from components and hooks:

```text
pages/<domain>/
├── create.tsx
├── edit.tsx
├── list.tsx
└── show.tsx
```

Pages are route-level composition.

Pages should remain thin:
* compose domain components (`src/components/<domain>/`)
* call hooks for state/logic (`src/hooks/<domain>/`)
* connect route parameters
* invoke Refine page-level hooks

Pages should NOT own:
* direct API calls (live in `src/api/<domain>/`)
* heavy business logic (lives in `src/hooks/<domain>/`)
* reusable types (live in `src/types/<domain>/`)
* reusable table columns (live in `src/components/<domain>/`)

---

# 14. Domain Components

Domain UI components belong in:

```text
components/<domain>/
```

Example:

```text
components/loads/
components/customers/columns.tsx
```

These components consume canonical types from:

```text
types/<domain>/
```

Do not redefine the same interface locally inside `columns.tsx`,
forms or pages.

---

# 15. Form Types And Schemas

If form state differs from API requests, define a separate form model.

Example:

```ts
export interface CustomerFormValues {
  name: string;
  email: string;
}
```

Use:

```text
types/<domain>/ (or utils/)
```

for runtime/form schemas when needed.

Do not force API response types to double as form state.

Preferred flow:

```text
FormValues
    ↓
schema validation
    ↓
request mapper
    ↓
CreateXRequest / UpdateXRequest
```

---

# 16. Validation

Generic validation belongs in common.

Business validation belongs in its feature.

Generic examples:

```text
email format
phone format
required value
generic file limits
```

Business examples:

```text
Load pickup/delivery rule
Driver license rule
Invoice calculation rule
Customer credit rule
```

Do not build one global mega-validator.

---

# 17. Refine Provider Implementations

The project maintains its Refine provider implementations cleanly inside `src/providers/`:

```text
providers/authProvider.ts
providers/dataProvider.ts
providers/notificationProvider.ts
providers/permissions/roleMatrix.ts
providers/api/apiClient.ts
```

Do not create duplicate provider layers.

---

# 18. Domain & Shared Hooks

Hooks are organized under `src/hooks/`:
- Shared hooks live directly in `src/hooks/` (e.g., `useCurrentTenant.ts`, `useCurrentUser.ts`, `usePaginatedTable.ts`).
- Domain-specific hooks live under `src/hooks/<domain>/use*.ts` (e.g., `hooks/payroll/usePayrollActions.ts`).

---

# 19. i18n Organization

i18n catalogs and initialization live in `src/locales/`:

```text
locales/
├── vi.ts
├── en.ts
├── ja.ts
└── index.ts
```

If actual code does not match this separation,
propose changes before modifying it.

---

# 20. Dependency Direction

Preferred dependency direction:

```text
app
 ↓
pages
 ↓
features
 ↓
core / common
```

More specifically:

```text
app
→ pages
→ features
→ providers
→ core
→ common
→ config
→ constants
```

Not every layer must import every lower layer.

Forbidden dependencies include:

```text
core → features
common → features
config → features
constants → features
```

Avoid cross-feature imports.

If feature A needs business data owned by feature B,
analyze whether:

* the dependency is legitimate
* a shared business abstraction exists
* the page should compose both
* a common generic concept can be extracted

Do not solve cross-feature imports by moving domain logic into common.

---

# 21. No Circular Dependencies

All architecture refactoring must check for circular dependencies.

Pay special attention to:

```text
index.ts barrel files
types
resource files
mappers
components
providers
```

Prefer `import type` for type-only imports:

```ts
import type { Customer } from "../types/customer.types";
```

Do not create barrel files everywhere.

---

# 22. Refactoring Rules

Before modifying a feature:

1. inspect its complete folder
2. inspect corresponding pages
3. inspect its resource file
4. inspect all type definitions
5. inspect backend-facing field names
6. inspect component usage
7. inspect Refine hooks and dataProvider usage
8. inspect tests
9. inspect imports
10. inspect related backend contract if available

Never refactor based only on filenames.

---

# 23. Feature Standardization Decision

For each feature, determine which structure it actually needs.

Possible minimal feature:

```text
feature/
├── components/
└── feature.resource.ts
```

Feature with domain types:

```text
feature/
├── components/
├── types/
│   └── feature.types.ts
└── feature.resource.ts
```

Feature with API/domain separation:

```text
feature/
├── components/
├── types/
│   ├── feature.api.types.ts
│   └── feature.types.ts
├── mappers/
│   └── feature.mapper.ts
└── feature.resource.ts
```

Feature with forms/validation:

```text
feature/
├── components/
├── types/
├── mappers/
├── schemas/
├── validators/
└── feature.resource.ts
```

Choose the smallest structure that accurately represents the feature.

---

# 24. Do Not Force A Mapper

Create a mapper only when:

* field names differ
* value representations differ
* normalization is required
* nested response structures must be reshaped
* API/domain separation provides real value

If:

```ts
CustomerResponse === Customer
```

semantically and structurally,

then using one canonical type may be better than creating a duplicate
type and identity mapper.

Architecture must reduce complexity, not manufacture it.

---

# 25. Do Not Force API Type Files

If a feature has no custom request/response contract beyond an already canonical
domain type, do not create `<feature>.api.types.ts` merely to make folders match.

Use API-specific types when they represent a real transport contract.

---

# 26. No Unsafe Type Fixes

Do not fix type problems by introducing:

```ts
any
as any
as unknown as X
// @ts-ignore
// @ts-nocheck
```

unless unavoidable and documented.

Fix the real contract or transformation.

---

# 27. Nullability Must Match Backend

Do not use optional properties merely to silence TypeScript.

These are different:

```ts
phone?: string
```

and:

```ts
phone: string | null
```

Match backend semantics accurately.

---

# 28. Before Architecture Changes

When asked to normalize features or types, first produce:

```text
Feature
API transport types
Domain types
Mapper
Resource
Pages
Schemas
Current problems
Recommended action
```

Do this for every affected feature.

Do not modify files until the requested scope is understood.

For large migrations, propose batches.

---

# 29. Incremental Migration

Never refactor all 300+ files in one uncontrolled step.

Prefer feature-by-feature migration.

Suggested approach:

```text
1. establish canonical generic API types
2. normalize Customer reference pattern
3. migrate one simple feature
4. typecheck/test
5. migrate next feature
6. repeat
7. clean duplicates last
```

Do not break working Refine behavior while reorganizing architecture.

---

# 30. Verification

After every logical batch run available checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run relevant targeted tests first when possible.

Do not claim success unless commands actually pass.

Inspect:

```bash
git diff
```

before declaring the migration complete.

---

# 31. Final Goal

A developer should be able to trace a business entity like this:

```text
Spring Boot DTO
       ↓
types/<domain>/*.types.ts (pure types)
       ↓
api/<domain>/*.api.ts & utils/ (mappers)
       ↓
hooks/<domain>/use*.ts (logic)
       ↓
components/<domain>/
       ↓
pages/<domain>/ (thin screens)
(and resources/<domain>.resource.ts)
```

Only the layers that actually add value should exist.

Preserve the Refine architecture while maintaining the global file-type organization specified in `AGENTS.md`.
