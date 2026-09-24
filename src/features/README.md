# Feature boundary

Business modules are added API-by-API after Phase 0. Each implemented module
must contain:

```text
api.ts
types.ts
queries.ts
schema.ts
routes.ts
components/
pages/
```

Implementation order is fixed by `frontend-context.md`: Roles, Customers,
Employees/Drivers, Terminals and Trucks are Phase 1. No placeholder in this
directory may call a missing endpoint or ship production mock data.
