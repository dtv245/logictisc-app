---
name: types-refactor
description: Analyze and refactor TypeScript type architecture in the React Refine frontend. Use for backend DTO synchronization, type organization, domain models, request/response types, mappers, OOP cleanup, duplicate types, unsafe any, imports, and feature boundaries.
---

# TypeScript Type Architecture Refactor

Use this skill when working on TypeScript data models, backend DTOs,
request/response contracts, domain models, form models, mappings, or type organization.

Always follow the project's `types-architecture` rule.

---

## Phase 1 — Inspect

Before changing anything:

1. Inspect the current project tree.

2. Inspect:

```text
src/types/
src/core/
src/common/
src/features/
src/providers/
```

3. Search for:

```text
interface
type
enum
class
any
Response
Request
DTO
Model
FormValues
```

4. Inspect the Spring Boot API contracts that the frontend currently consumes
   when those contracts are available in the workspace.

5. Inspect all imports of the types being changed.

6. Detect:

* duplicated interfaces
* duplicated enums
* unsafe `any`
* incorrect optional properties
* incorrect nullability
* unused types
* misplaced domain types
* circular imports
* redundant classes
* API/domain coupling
* form/API model coupling

Do not modify code during this phase.

---

## Phase 2 — Classify

Classify every relevant type into one of:

```text
API transport
Domain
Form
View model
Core infrastructure
Application-global
Runtime value object
```

Use this placement:

```text
API generic
→ core/api/

Application-global
→ src/types/

Domain-specific
→ features/<feature>/types/

Form-specific
→ features/<feature>/types/ or forms/

Business constants
→ features/<feature>/constants/

Generic constants
→ src/constants/

Runtime schemas
→ features/<feature>/schemas/
```

---

## Phase 3 — Design

Before editing, produce:

### Current problems

List actual problems found in the repository.

### Proposed target tree

Show the exact resulting type-related directory tree.

### Move table

For every file that should move, show:

```text
CURRENT
→ TARGET
→ REASON
```

Example:

```text
src/types/customer.ts
→ src/features/customers/types/customer.types.ts
→ Customer is feature-owned, not application-global
```

### Duplicate types

Show which definitions should become the canonical source.

### API/domain split

Identify where API transport and frontend models should be separated.

Then STOP if the user has not explicitly approved implementation.

---

## Phase 4 — Implement

After approval, refactor incrementally.

Do not perform a massive blind rewrite.

### API contracts

Preserve exact backend field semantics.

Example:

```ts
export interface CustomerResponse {
  id: string;
  legalName: string;
}
```

Do not rename backend fields inside the transport interface.

If frontend needs different naming, create a domain model and mapper.

---

### Domain model

Example:

```ts
export interface Customer {
  id: string;
  name: string;
}
```

Mapper:

```ts
export function toCustomer(
  response: CustomerResponse,
): Customer {
  return {
    id: response.id,
    name: response.legalName,
  };
}
```

---

### Request flow

Use:

```text
FormValues
   ↓
request mapper
   ↓
CreateXRequest / UpdateXRequest
   ↓
API
```

Avoid submitting UI state objects directly unless their contract genuinely matches the backend request.

---

## Phase 5 — OOP Cleanup

Inspect every TypeScript class.

For each class determine whether runtime behavior is actually required.

If a class is only:

```ts
class X {
  field1!: string;
  field2!: number;
}
```

prefer an interface.

Keep classes only when they provide meaningful:

* behavior
* invariants
* encapsulation
* value-object semantics

Prefer composition over inheritance.

Do not recreate Java DTO/entity architecture in React.

---

## Phase 6 — Imports

After moves:

1. update every affected import
2. prefer `import type` for type-only imports
3. detect circular imports
4. remove dead imports
5. verify aliases such as `@/`
6. do not introduce barrel files unless useful

---

## Phase 7 — Validate

Run the existing project commands.

At minimum, where available:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Do not claim success unless commands actually pass.

If a command fails because of an unrelated existing issue,
report it separately instead of hiding it.

---

## Phase 8 — Review

Inspect:

```bash
git diff
```

Check:

* no backend contract accidentally changed
* no feature imports from wrong layers
* no duplicate types left
* no new `any`
* no circular dependencies
* no unnecessary classes
* no accidental business logic changes
* no broken Refine provider types

---

# Required Final Report

After implementation report:

1. Types moved
2. Types created
3. Duplicate types removed
4. Classes converted to interfaces
5. Mappers added
6. API contracts preserved
7. `any` removed
8. Nullability fixes
9. Import changes
10. Tests/typecheck/build results
11. Remaining risks
