# Screen-Owned API Loading

This mandatory project rule dictates the application data-fetching behavior, ensuring that APIs are strictly requested only when visually needed. It complements the existing Refine and TanStack Query architecture.

## 1. SCREEN-OWNED API LOADING
Every page, screen, tab, modal, or drawer may fetch only data that belongs to that currently active UI context.
A business API must not be called until the user accesses the screen that requires it.

**Examples:**
- Open Customers → fetch Customers
- Loads not opened → do not fetch Loads
- Click Loads → fetch Loads

## 2. NO EAGER FETCHING
Do not:
- Prefetch APIs for unvisited screens
- Fetch all child tab APIs from the parent
- Fetch all business resources during application bootstrap
- Use `Promise.all` to preload unrelated screens
- Mount hidden tabs containing active data queries
- Use TanStack Query `prefetchQuery` for future business screens
- Load modal/drawer data before the modal/drawer is opened

## 3. REFINE USAGE
Continue using official Refine hooks where appropriate:
- `useList`
- `useOne`
- `useMany`
- `useTable`
- `useForm`
- `useCreate`
- `useUpdate`
- `useDelete`

However, Refine queries must only become active when their owning screen is active.
If inactive tab components remain mounted, use the supported query `enabled` mechanism (`queryOptions: { enabled: isVisible }`) or conditionally render the screen. Use whichever approach is supported by the currently installed versions (TanStack Query v4).

## 4. CACHE
Cached data may be reused. Do not force a new request when valid cached data already exists.
Cache must remain isolated by actual query/resource/parameters. Do not combine unrelated screens into an artificial bulk cache.

## 5. MUTATIONS
After create/update/delete, invalidate/refetch only affected queries.
Do not globally refetch every resource.

## 6. ALLOWED EXCEPTIONS
Multiple requests are allowed when the SAME visible screen genuinely requires multiple endpoints.

Global startup data is allowed only when genuinely required application-wide, such as:
- Authentication/session status
- Current user
- Current tenant
- Required permissions
- Runtime configuration

A business resource list is not global merely because several screens may use it.

## 7. MODALS
Modal-specific remote data must be loaded when the modal opens.

**Example:**
- Customer list → fetch customer list
- Click Assign Driver → open modal → fetch eligible drivers
*(Do not fetch eligible drivers during Customer list initialization.)*

## 8. QUERY OWNERSHIP
Every query must have a clear owner:
- screen
- page
- tab
- modal
- drawer
- genuinely global provider

Avoid queries from generic layouts, `App.tsx`, router, or bootstrap unless the data is actually required globally.

## 9. NO OVER-ENGINEERING
Do not introduce custom:
- QueryService
- ScreenDataManager
- GlobalDataLoader
- CacheService
- PrefetchManager

Use Refine and TanStack Query lifecycle/cache capabilities natively.

## 10. RULE PRIORITY
This rule is mandatory for application data-fetching behavior.
It must coexist with:
- frontend-engineering rules
- React skill
- TypeScript skill
- UI design skill
- Refine conventions

Project-specific rules have priority over generic external skill advice.
