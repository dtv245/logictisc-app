# TypeScript Types & Data Architecture Rules

This rule applies to all TypeScript models, API contracts, DTOs, form models,
domain models, enums, constants, mappers, and type refactoring.

Project:
`/home/vumoi/logictics-app`

The project uses:
- React
- TypeScript
- Vite
- Refine
- React Router
- Ant Design
- TanStack Query
- Axios

The backend is Spring Boot.

---

# 1. Main Principle

TypeScript types must represent clear responsibilities.

Do not treat every backend DTO as an OOP class.

Prefer:

- `interface` for object/data contracts
- `type` for unions, aliases, mapped types and composition
- `class` only when runtime behavior is actually required

Never create classes only to mimic Java DTO classes.

Wrong:

```ts
class CustomerResponse {
  id!: string;
  name!: string;
}
```

Preferred:

```ts
export interface CustomerResponse {
  id: string;
  name: string;
}
```

---

# 2. Type Categories

Always determine what kind of type is being defined.

The main categories are:

1. API transport type
2. Domain model
3. Form/input model
4. View model
5. Shared/global type
6. Runtime value object

Do not mix these concepts unnecessarily.

---

# 3. API Transport Types

Types matching Spring Boot request/response DTOs belong close to the feature.

Example:

```text
features/customers/types/
├── customer.api.types.ts
└── customer.types.ts
```

Example:

```ts
export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
}
```

These represent API contracts.

They should reflect the backend contract accurately.

Do not silently rename backend fields inside transport types.

If backend returns:

```json
{
  "customerId": "...",
  "legalName": "..."
}
```

then the transport type should represent those fields accurately.

---

# 4. Domain Models

A frontend domain model may be different from the backend response.

Example:

Backend transport:

```ts
export interface CustomerResponse {
  customerId: string;
  legalName: string;
  createdAt: string;
}
```

Frontend domain model:

```ts
export interface Customer {
  id: string;
  name: string;
  createdAt: Date;
}
```

If the structures differ, use an explicit mapper.

Example:

```text
features/customers/mappers/
└── customer.mapper.ts
```

```ts
export function mapCustomerResponse(
  response: CustomerResponse,
): Customer {
  return {
    id: response.customerId,
    name: response.legalName,
    createdAt: new Date(response.createdAt),
  };
}
```

Preferred flow:

```text
Backend
   ↓
CustomerResponse
   ↓
mapper
   ↓
Customer
   ↓
React UI
```

Do not scatter transformation logic throughout components.

---

# 5. Form Models

Form state must not automatically reuse API response types.

Use form-specific types when the form represents different data.

Example:

```ts
export interface CustomerFormValues {
  name: string;
  email: string;
  phone?: string;
}
```

Then map it to the backend request:

```ts
export function toCreateCustomerRequest(
  values: CustomerFormValues,
): CreateCustomerRequest {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
  };
}
```

Do not mutate an API response object to make it work as form state.

---

# 6. Global Types

`src/types/` is only for truly application-wide types.

Allowed examples:

```text
src/types/
├── global.d.ts
├── env.d.ts
└── common.types.ts
```

Do NOT put domain types here.

Wrong:

```text
src/types/
├── customer.ts
├── load.ts
├── trip.ts
├── invoice.ts
└── driver.ts
```

Correct:

```text
features/customers/types/
features/loads/types/
features/trips/types/
features/finance/invoices/types/
features/employees/drivers/types/
```

---

# 7. Core API Types

Generic backend envelope types belong to:

```text
core/api/
```

Example:

```text
core/api/
├── api.types.ts
├── httpClient.ts
├── apiError.ts
└── normalizeApiError.ts
```

Example:

```ts
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: ApiError[];
  meta: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
}
```

These are infrastructure contracts and must not be duplicated inside every feature.

---

# 8. Feature Types

Each business feature owns its domain types.

Example:

```text
features/customers/
├── types/
│   ├── customer.types.ts
│   └── customer.api.types.ts
├── mappers/
├── validators/
├── api/
├── hooks/
└── components/
```

Loads:

```text
features/loads/
├── types/
│   ├── load.types.ts
│   └── load.api.types.ts
```

Trips:

```text
features/trips/
├── types/
│   ├── trip.types.ts
│   └── trip.api.types.ts
```

---

# 9. Naming Convention

Use explicit type names.

API responses:

```text
CustomerResponse
LoadResponse
TripResponse
InvoiceResponse
```

API requests:

```text
CreateCustomerRequest
UpdateCustomerRequest
CreateLoadRequest
UpdateLoadRequest
```

Domain:

```text
Customer
Load
Trip
Invoice
```

Form:

```text
CustomerFormValues
LoadFormValues
InvoiceFormValues
```

Filters:

```text
CustomerFilters
LoadFilters
TripFilters
```

Query params:

```text
CustomerQueryParams
LoadQueryParams
```

Do not use meaningless names such as:

```text
CustomerData
CustomerObj
CustomerInfo2
TempCustomer
ApiData
SomeType
```

unless the meaning is genuinely correct.

---

# 10. Reuse Types Properly

Do not duplicate identical type definitions.

Before creating a new type:

1. search for an existing equivalent
2. determine its ownership
3. reuse it if semantics match
4. move it only when ownership is wrong

Use TypeScript composition where appropriate:

```ts
export interface CreateCustomerRequest {
  name: string;
  email: string;
}

export type UpdateCustomerRequest =
  Partial<CreateCustomerRequest>;
```

But do not use `Partial`, `Pick`, or `Omit` only to reduce typing if it makes the API contract unclear.

Explicit contracts are preferred when backend semantics differ.

---

# 11. Do Not Over-Share Types

A type used by two files inside the same feature is NOT automatically global.

Keep it inside that feature.

Rule:

```text
Used only by one feature
→ features/<feature>/types/

Generic infrastructure
→ core/

Truly application-wide
→ src/types/
```

---

# 12. OOP Rules

TypeScript is not Java.

Do not introduce Java-style architecture such as:

```text
CustomerDTO class
CustomerEntity class
CustomerModel class
CustomerBase class
AbstractCustomer class
```

unless runtime behavior actually requires it.

Use classes only when the object owns meaningful behavior or invariants.

Good examples:

```ts
class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error("Currency mismatch");
    }

    return new Money(
      this.amount + other.amount,
      this.currency,
    );
  }
}
```

Possible value objects:

* Money
* DateRange
* Coordinates

Do not use a class merely as a JSON container.

Prefer composition over inheritance.

Avoid deep inheritance trees.

---

# 13. Enums

Do not blindly convert every backend enum to a TypeScript `enum`.

For API string values, prefer a union or `as const` where practical.

Example:

```ts
export const CUSTOMER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type CustomerStatus =
  (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];
```

If a runtime constant is not needed:

```ts
export type CustomerStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED";
```

Domain-specific enums/constants belong to the feature.

---

# 14. Null and Optional Fields

Do not confuse:

```ts
field?: string;
```

with:

```ts
field: string | null;
```

These mean different things.

Match the backend contract accurately.

If backend always returns the property but it may be null:

```ts
phone: string | null;
```

If the property may be absent:

```ts
phone?: string;
```

Do not randomly add `?` to make TypeScript errors disappear.

---

# 15. Avoid `any`

Do not use:

```ts
any
```

to bypass typing problems.

Prefer:

```ts
unknown
```

for untrusted values.

Then narrow the value safely.

Example:

```ts
function isApiError(value: unknown): value is ApiError {
  // runtime check
}
```

`any` may only be used when technically unavoidable and must be justified.

---

# 16. Runtime Validation

TypeScript types disappear at runtime.

Do not assume:

```ts
response.data as CustomerResponse
```

validates server data.

If runtime validation is required:

* first inspect existing dependencies
* reuse the existing schema library if available
* do not install a new validation library without need

Potential schema locations:

```text
features/customers/schemas/
features/loads/schemas/
```

Do not duplicate the same rules in unrelated places.

---

# 17. Refine Integration

Refine providers should expose correctly typed contracts.

Example dependency flow:

```text
Refine
   ↓
dataProvider
   ↓
feature API / core API
   ↓
ApiResponse<T>
   ↓
backend
```

Do not leak `any` through Refine providers.

Generic data-provider helpers should use proper generics.

---

# 18. Imports and Dependencies

Types must respect architecture boundaries.

Allowed:

```text
features → core
features → common
features → constants
features → config
```

Forbidden:

```text
core → features
common → features
constants → features
config → features
```

Avoid circular imports.

When moving types, update all imports safely.

Use `import type` for type-only dependencies when appropriate:

```ts
import type { Customer } from "../types/customer.types";
```

---

# 19. Barrel Files

Do not create barrel `index.ts` files everywhere.

Use them only when they provide a stable public boundary.

Avoid barrels that cause:

* circular imports
* hidden dependencies
* large dependency graphs

Direct imports are acceptable.

---

# 20. Type Refactoring Workflow

Before modifying type architecture:

1. scan existing `types/` files
2. scan backend-related request/response models
3. scan imports/usages
4. identify duplicated types
5. identify incorrectly global types
6. identify feature-specific types
7. identify API transport types
8. identify domain models
9. identify form models
10. identify unsafe `any`
11. identify incorrect nullability
12. identify circular dependencies

Then produce a proposed migration.

Do not blindly move all files at once.

---

# 21. Safe Migration Order

When approved, migrate in this order:

1. Core API generic types
2. Global application types
3. Feature API request/response types
4. Feature domain models
5. Form/view models
6. Mappers
7. Constants/enums
8. Imports
9. Remove duplicates
10. Remove dead types

After each logical step:

* run TypeScript typecheck
* run ESLint
* run relevant tests

At the end:

* run production build
* inspect git diff

---

# 22. Never Hide Type Errors

Do not fix architecture by:

```ts
as any
as unknown as Something
// @ts-ignore
// @ts-nocheck
```

unless there is a documented unavoidable compatibility reason.

Fix the actual type relationship.

---

# 23. Final Goal

The final architecture should make this relationship obvious:

```text
Spring Boot DTO
      ↓
API Transport Type
      ↓
Mapper (when required)
      ↓
Frontend Domain Model
      ↓
Hook / Refine
      ↓
Component
```

And submission flow:

```text
Form Values
     ↓
Mapper
     ↓
Create/Update Request
     ↓
API
     ↓
Spring Boot
```

Types should document the application's contracts rather than hide architectural problems.
