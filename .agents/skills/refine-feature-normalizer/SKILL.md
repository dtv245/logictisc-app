---
name: refine-feature-normalizer
description: Analyze and incrementally normalize LogisticsX React Refine features from backend API transport types through domain types, mappers, Refine resources, components, and route pages without breaking the existing architecture. Use for types, DTOs, mappers, resources, pages, schemas, duplicated models, and feature-boundary refactoring.
---

# LogisticsX Refine Feature Normalizer

Project:

`/home/vumoi/logictics-app`

Always follow:

`.agents/rules/refine-feature-architecture.md`

This skill must preserve the existing application architecture.

Do not redesign the repository from scratch.

---

# Phase 1 — Repository Inspection

Before making changes, inspect:

```text
src/app/
src/core/
src/common/
src/config/
src/constants/
src/features/
src/pages/
src/providers/
```

Inspect relevant tests as well.

Determine how Refine currently connects:

```text
App
→ resources
→ pages
→ feature resource
→ dataProvider
→ core/api
→ backend
```

Do not assume the flow.

Verify it from code.

---

# Phase 2 — Build Feature Inventory

Scan the current features.

Known current feature directories include:

```text
accidents
ai-dispatch
api-keys
chat
containers
conversations
customers
documents
dvir
employees
expenses
finance
hos-eld
invoices
load-board
loads
maintenance
notifications
payments
products
resources
terminals
trips
trucks
```

`features/resources` is special shared Refine resource infrastructure.

Do not treat it as a normal business entity.

For every business feature, build a matrix:

```text
Feature:
- resource file:
- route pages:
- columns/components:
- API transport types:
- domain types:
- mapper:
- schema:
- validator:
- tests:
- current data source:
- problems:
- recommended change:
```

---

# Phase 3 — Inspect Corresponding Pages

Match each feature to its route pages.

Example:

```text
features/customers/
↕
pages/customers/
```

Inspect:

```text
create.tsx
edit.tsx
list.tsx
show.tsx
index.ts
```

Determine whether pages are thin route composition or contain business logic.

If pages contain:

* DTO transformations
* duplicated interfaces
* business calculations
* reusable validation
* API response parsing

identify that logic for relocation into the owning feature/core/common layer.

Do not move route pages into features by default.

---

# Phase 4 — Inspect Types

For each feature search:

```text
interface
type
enum
class
Response
Request
DTO
Model
FormValues
any
unknown
null
undefined
```

Classify every relevant type into:

```text
API Transport
Domain
Form
View Model
Generic API Infrastructure
Common Reusable
Runtime Value Object
```

Never classify based only on the filename.

Inspect actual usage.

---

# Phase 5 — API Transport Types

Identify data structures that represent Spring Boot contracts.

If transport contracts need their own representation, use:

```text
features/<feature>/types/<entity>.api.types.ts
```

Examples:

```text
CustomerResponse
CreateCustomerRequest
UpdateCustomerRequest

LoadResponse
CreateLoadRequest
UpdateLoadRequest
```

Transport types must match backend field names and nullability.

Do not make transport types UI-friendly by silently changing fields.

---

# Phase 6 — Domain Types

If frontend semantics differ from backend transport, define:

```text
features/<feature>/types/<entity>.types.ts
```

Example:

```text
customer.api.types.ts
→ exact backend DTO

customer.types.ts
→ frontend Customer model
```

Do not create duplicate domain types if the API type already correctly
represents the frontend model.

---

# Phase 7 — Mappers

Create:

```text
features/<feature>/mappers/<entity>.mapper.ts
```

only when transformation exists.

Examples requiring mapper:

```text
backend snake/canonical field
→ frontend semantic name

ISO string
→ Date

nullable backend nested object
→ normalized frontend object

form values
→ request DTO
```

Do not create identity mappers.

Move transformation logic out of:

```text
pages
columns.tsx
resource files
random hooks
```

when it belongs to a mapper.

---

# Phase 8 — Use Customer As A Reference

Inspect the current Customer implementation carefully:

```text
features/customers/
├── components/
├── mappers/
├── schemas/
├── types/
│   ├── customer.api.types.ts
│   └── customer.types.ts
└── customers.resource.ts
```

Understand WHY Customer uses both API and domain types.

Do not blindly copy the same structure.

Use the pattern only when another feature has the same architectural need.

---

# Phase 9 — Refine Resource Normalization

Inspect each:

```text
*.resource.ts
```

Resource files should remain focused on Refine resource integration.

Check for:

* resource name
* labels
* route metadata
* CRUD capabilities
* component/config bindings

Identify code that does NOT belong there:

* duplicated interfaces
* API error parsing
* generic HTTP code
* mapper logic
* React page logic

Move only when there is a clearly better owner.

---

# Phase 10 — Feature Components

Inspect:

```text
features/<feature>/components/columns.tsx
```

and feature forms/components.

Ensure they import canonical feature types.

Do not allow:

```ts
interface Customer {
   ...
}
```

inside `columns.tsx` if an authoritative Customer type already exists.

Remove local duplicate data models after safely replacing imports.

---

# Phase 11 — Form Models And Schemas

Inspect create/edit pages and forms.

Determine whether:

```text
API Response
Form Values
Create Request
Update Request
```

are incorrectly being treated as the same type.

Separate them only when semantics differ.

Possible structure:

```text
features/<feature>/
├── schemas/
│   └── <feature>.schema.ts
└── types/
    ├── <feature>.api.types.ts
    ├── <feature>.types.ts
    └── <feature>.form.types.ts
```

Do not create `<feature>.form.types.ts` unless actually needed.

---

# Phase 12 — Generic API Type Audit

Inspect:

```text
core/api/api.types.ts
core/api/types.ts
common/types/api.ts
common/types/common.types.ts
```

Determine exact ownership.

Look for duplicate definitions such as:

```text
ApiResponse
ApiError
Pagination
ResponseMeta
HttpError
```

Do not delete anything until import graphs and semantics are verified.

When true duplication exists:

1. choose canonical owner
2. update imports
3. typecheck
4. remove duplicate
5. test

Preferred API infrastructure owner:

```text
core/api/
```

---

# Phase 13 — OOP Audit

Search TypeScript classes.

For each class ask:

```text
Does this object have runtime behavior?
Does it enforce invariants?
Does it need encapsulation?
Is it a real value object?
```

If no, prefer interface/type.

Do not mirror Java DTO classes using TypeScript classes.

Allow real value objects such as:

```text
Money
DateRange
Coordinates
```

when behavior justifies them.

Prefer composition over inheritance.

---

# Phase 14 — Refine Awareness

Before creating custom architecture, inspect whether the feature already uses:

```text
Refine resource
dataProvider
useList
useOne
useCreate
useUpdate
useDelete
generic Resource*Page components
```

Reuse existing Refine infrastructure.

Do not create per-feature Axios services for standard CRUD if the project's
generic dataProvider already handles the use case.

Create custom API logic only for genuinely custom endpoints or behavior.

---

# Phase 15 — Common Boundary Audit

Inspect whether code in:

```text
common/
```

is actually generic.

Particularly inspect:

```text
common/hooks/
```

because current hooks include authentication and tenant concepts.

Do not move them automatically.

Report ownership problems separately.

This skill's primary task is feature data-flow normalization,
not uncontrolled global restructuring.

---

# Phase 16 — Provider/Core Audit

Inspect:

```text
core/api/dataProvider.ts
core/auth/authProvider.ts
core/permissions/accessControlProvider.ts

providers/authProvider.ts
providers/notificationProvider.ts
```

Determine whether:

```text
providers
→ project/Refine adapters

core
→ technical implementation
```

is already the intended separation.

Do not merge provider files merely because their names are similar.

Report actual duplication only after reading implementation.

---

# Phase 17 — Proposed Migration Report

Before modifying a large number of files, output a table:

```text
Feature | API Types | Domain Type | Mapper | Resource | Pages | Problem | Action
```

Example:

```text
customers
API types: yes
Domain type: yes
Mapper: yes
Resource: yes
Pages: yes
Action: use as reference

loads
API types: no
Domain type: yes
Mapper: no
Resource: yes
Pages: yes
Action: inspect backend contract before deciding API/domain split
```

Then propose migration batches.

For a major migration, STOP and wait for approval.

---

# Phase 18 — Migration Order

After approval, migrate incrementally.

Recommended strategy:

```text
Batch 1
→ generic core API type cleanup

Batch 2
→ customers reference verification

Batch 3
→ one simple feature

Batch 4
→ typecheck/test/build

Batch 5+
→ remaining features one by one
```

Do not normalize all features in one massive edit.

---

# Phase 19 — Safe Feature Migration

For each feature:

1. inspect feature
2. inspect matching pages
3. inspect resource
4. inspect backend contract
5. classify types
6. define canonical types
7. add mapper only if required
8. update components
9. update resource imports
10. update pages
11. remove duplicate local types
12. update tests
13. run typecheck
14. run relevant tests
15. inspect diff

Only then move to the next feature.

---

# Phase 20 — Import Safety

After moving files:

* update all imports
* prefer `import type`
* detect circular dependencies
* preserve `@/` alias conventions
* remove dead imports
* avoid unnecessary barrel index files

Do not hide broken imports using broad barrel exports.

---

# Phase 21 — No Type Escape Hatches

Do not solve migration errors using:

```ts
any
as any
as unknown as SomeType
// @ts-ignore
// @ts-nocheck
```

unless unavoidable and explicitly documented.

Fix the actual model relationship.

---

# Phase 22 — Verification

For every migration batch run available commands.

Preferred:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

When practical run targeted Vitest tests first.

At completion inspect:

```bash
git diff
```

Verify:

```text
Refine resources still work
routing still works
auth still works
tenant handling still works
API contracts remain correct
no circular dependencies
no duplicate type models
no unnecessary mappers
no new any
```

---

# Phase 23 — Final Report

After implementation report:

```text
1. Features analyzed
2. Features changed
3. API types introduced
4. Domain types introduced
5. Types merged/removed
6. Mappers introduced
7. Identity mappers avoided/removed
8. Resource files changed
9. Page logic moved
10. Duplicate interfaces removed
11. any usages removed
12. Import changes
13. Typecheck result
14. Test result
15. Build result
16. Remaining architectural issues
```

Do not report a check as passing unless it was actually executed.
