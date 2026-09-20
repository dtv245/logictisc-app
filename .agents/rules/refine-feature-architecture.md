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

# 1. Existing Architecture Is Intentional

The current project has these main boundaries:

```text
src/
├── app/
├── assets/
├── common/
├── config/
├── constants/
├── core/
├── features/
├── locales/
├── pages/
├── providers/
├── styles/
├── test/
└── main.tsx
```

Keep these architectural boundaries.

Do not remove:

* app/
* core/
* common/
* config/
* constants/
* features/
* pages/
* providers/

without explicit approval.

---

# 2. Responsibilities Of Existing Layers

## app/

`app/` is the application layer.

The current project already contains:

```text
app/
├── bootstrap/
├── diagnostics/
├── i18n/
├── router/
├── runtime/
└── App.tsx
```

Keep this responsibility.

`app/` may:

* bootstrap the application
* compose application runtime
* register Refine resources
* handle application routing
* handle top-level tenant/auth boundaries
* initialize application i18n
* handle application-wide diagnostics

Do not move feature business logic into `app/`.

---

## core/

`core/` is technical infrastructure.

The current project contains:

```text
core/
├── api/
├── auth/
├── config/
├── errors/
└── permissions/
```

Preserve this layer.

Examples of correct ownership:

```text
core/api/
→ Axios/client infrastructure
→ generic Refine data provider infrastructure
→ generic API envelope handling
→ HTTP errors
→ retries
→ query serialization

core/auth/
→ OIDC
→ JWT verification
→ session management
→ low-level authentication infrastructure

core/config/
→ runtime configuration infrastructure

core/permissions/
→ access-control infrastructure
→ JWT role interpretation
→ role matrix
```

`core` MUST NOT contain business-specific Customer, Load, Trip,
Employee, Invoice, Truck, etc. logic.

---

## common/

`common/` is reusable application code that is not owned by one
business feature.

The current project already has:

```text
common/
├── components/
├── formatters/
├── forms/
├── hooks/
├── i18n/
├── table/
├── testing/
├── types/
└── utils/
```

Do not blindly move everything shared-looking into common.

A file belongs in `common/` only when its semantics are generic enough
to be reused by unrelated business features.

Business knowledge must stay in the corresponding feature.

---

## config/

`config/` contains build-time/environment configuration.

Example:

```text
config/env.ts
```

Do not mix this responsibility with `core/config`.

Preferred distinction:

```text
src/config/
→ build-time/static environment configuration

core/config/
→ runtime configuration loading, validation, context and access
```

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

Business-domain constants must remain inside the feature.

Example:

```text
global route names
→ constants/routes.ts

generic UI defaults
→ constants/ui.ts

Load business status
→ features/loads/

Customer business type
→ features/customers/
```

---

# 3. Canonical Backend-To-UI Data Flow

For feature data, prefer this conceptual flow:

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
core/api
    ↓
Spring Boot
```

Do not skip architectural boundaries by putting backend-data
transformation directly inside pages or table components.

---

# 4. Customer Feature Is The Reference Pattern

The existing Customer feature currently demonstrates an important pattern:

```text
features/customers/
├── components/
│   └── columns.tsx
├── mappers/
│   └── customer.mapper.ts
├── schemas/
├── types/
│   ├── customer.api.types.ts
│   └── customer.types.ts
└── customers.resource.ts
```

Use this as a REFERENCE for API/domain separation.

Do NOT blindly copy every folder into every other feature.

A feature only needs:

* API types when backend DTO contracts require them
* domain types when frontend semantics differ
* mappers when transformation actually exists
* schemas when runtime/form validation is required
* validators when business validation exists

Do not create empty directories for architectural symmetry.

---

# 5. API Transport Types

Backend request/response contracts belong inside the owning feature.

Preferred naming:

```text
features/customers/types/customer.api.types.ts
features/loads/types/load.api.types.ts
features/trips/types/trip.api.types.ts
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
features/<feature>/types/<entity>.types.ts
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

Mappers belong in:

```text
features/<feature>/mappers/
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

Generic API infrastructure types belong to `core/api`.

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
core/api/api.types.ts
core/api/types.ts
common/types/api.ts
```

Before modifying these files:

1. inspect their actual contents
2. determine whether responsibilities overlap
3. choose one canonical definition for each semantic concept
4. update all imports safely
5. delete a duplicate only after proving it is redundant

Do NOT assume these files are duplicates based only on their names.

Preferred ownership:

```text
HTTP/API infrastructure contract
→ core/api/

generic non-API reusable application type
→ common/types/
```

---

# 10. Feature Type Ownership

A domain type belongs to its feature.

Examples:

```text
Accident
→ features/accidents/types/

AiDispatch
→ features/ai-dispatch/types/

ApiKey
→ features/api-keys/types/

Chat
→ features/chat/types/

Customer
→ features/customers/types/

Document
→ features/documents/types/

Dvir
→ features/dvir/types/

Employee
→ features/employees/types/

Finance
→ features/finance/types/

HosEld
→ features/hos-eld/types/

LoadBoard
→ features/load-board/types/

Load
→ features/loads/types/

Notification
→ features/notifications/types/

Product
→ features/products/types/

Trip
→ features/trips/types/

Truck
→ features/trucks/types/
```

Do not centralize all domain types in `common/types`.

---

# 11. Refine Resource Files

The project currently uses files such as:

```text
features/customers/customers.resource.ts
features/loads/loads.resource.ts
features/trips/trips.resource.ts
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

Resource files should import canonical feature types when necessary.

---

# 12. Generic Refine CRUD Infrastructure

The project already has generic CRUD infrastructure such as:

```text
common/components/ResourceCreatePage.tsx
common/components/ResourceEditPage.tsx
common/components/ResourceListPage.tsx
common/components/ResourceShowPage.tsx

features/resources/resourceCapabilities.ts
features/resources/ResourceFormFields.tsx
features/resources/resourceForms.ts
```

Preserve and reuse existing generic CRUD infrastructure when appropriate.

Do not recreate per-feature CRUD infrastructure that Refine and the existing
generic components already solve.

`features/resources/` is infrastructure for resource behavior,
not a normal business domain.

Do not normalize it as if it were Customer, Load, Trip, etc.

---

# 13. Pages Stay Route-Level

The current architecture intentionally separates:

```text
features/customers/
```

from:

```text
pages/customers/
├── create.tsx
├── edit.tsx
├── list.tsx
├── show.tsx
└── index.ts
```

Preserve this separation.

Pages are route-level composition.

Pages should remain thin.

A page may:

* compose feature components
* connect route parameters
* invoke Refine page-level hooks
* select appropriate resource/component
* render route-specific layout

Pages should NOT own:

* backend DTO transformation
* reusable domain logic
* domain constants
* business validation
* duplicated API error parsing
* reusable table-column definitions

Those belong to the feature/core/common layer.

---

# 14. Feature Components

Feature UI belongs in:

```text
features/<feature>/components/
```

Example:

```text
features/loads/components/columns.tsx
features/customers/components/columns.tsx
```

These components may know about their feature domain.

They must consume canonical types from:

```text
features/<feature>/types/
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
features/<feature>/schemas/
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

# 17. Refine And Core Boundaries

The project currently has Refine-related provider implementations in multiple places,
including:

```text
core/api/dataProvider.ts
core/auth/authProvider.ts
core/permissions/accessControlProvider.ts

providers/authProvider.ts
providers/notificationProvider.ts
```

Do not move or merge these files based only on naming.

First inspect their implementation and dependencies.

Target conceptual separation:

```text
Refine adapter
      ↓
technical infrastructure
```

If `providers/*` is a thin project-level adapter and `core/*`
contains infrastructure, preserve that distinction.

If two files implement the same responsibility, propose consolidation
before modifying them.

Never create another provider layer unnecessarily.

---

# 18. Common Hooks Must Actually Be Common

The current project includes hooks such as:

```text
common/hooks/useAuthStatus.ts
common/hooks/useCurrentTenant.ts
common/hooks/useCurrentUser.ts
common/hooks/useLarkLogin.ts
common/hooks/useLogoutUser.ts
common/hooks/useSwitchTenant.ts
common/hooks/useTenantList.ts
```

Do not automatically move them.

Inspect semantics and usage first.

Generic hooks may remain in `common/hooks`.

If a hook is clearly owned by authentication or tenant behavior,
propose a better owner before moving it.

Do not perform the move without verifying all imports and boundaries.

---

# 19. i18n Ownership

The current project contains:

```text
app/i18n/
common/i18n/
locales/
```

Do not merge or remove these based only on names.

Inspect responsibilities first.

Preferred conceptual separation may be:

```text
app/i18n
→ application-level i18n bootstrap/composition

common/i18n
→ generic reusable i18n helpers/resources

locales
→ user-visible translation content
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
feature types
resource files
mappers
common/components
providers
core/auth
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
features/<feature>/types/*.api.types.ts
       ↓
features/<feature>/mappers/
       ↓
features/<feature>/types/*.types.ts
       ↓
features/<feature>/*.resource.ts
       ↓
features/<feature>/components/
       ↓
pages/<feature>/
```

But only the layers that actually add value should exist.

Preserve the current Refine architecture.

Do not rewrite working code just to make directory trees symmetrical.
