# Frontend Engineering Rules (Logistics App)

This document defines the mandatory frontend engineering rules for this repository, overriding generic recommendations with project-specific architecture, Refine conventions, and Ant Design patterns.

## 1. Project Directory Structure
This repository enforces a global file-type architecture (migrating away from `src/features/` to global type-based folders organized by domain as defined in `AGENTS.md`).
**APPROVED DIRECTORY LAYER (`src/`):**
- `api/`: API calling functions: `api/<domain>/<domain>.api.ts`.
- `assets/`: Static assets (images, icons).
- `components/`: Reusable and domain UI components: `components/<domain>/`.
- `hooks/`: Reusable and domain hooks: `hooks/<domain>/use*.ts`.
- `pages/`: Route-level screen components: `pages/<domain>/` (one file per screen).
- `resources/`: Refine resource definitions: `resources/*.resource.ts`.
- `types/`: Pure type definitions: `types/<domain>/*.types.ts`.
- `utils/`: Shared pure functions partitioned by topic (pure only, used across 3+ places).
- `constants/`: Global routes, enums, constants.
- `lib/`: Shared clients and infrastructure (axios client, query client, i18n).
- `locales/`: Internationalization dictionaries.
- `config/`: Application bootstrap and runtime configuration.
- `providers/`: Refine providers (auth, data, access control, notification).
- `router/`: Application routing configuration.
- `styles/`: Global stylesheets.
- `formatters/`, `forms/`, `table/`, `validators/`: Shared cross-cutting utilities.

**BANNED DIRECTORIES / LAYERS:**
Do NOT create the following folders or architectural layers:
- `src/features/` (deprecated/banned for new code; existing modules are actively being moved to global structure per `AGENTS.md`. Never add new files here or move files back into `src/features/`).
- `src/app/`, `src/common/`, `src/core/`, `src/shared/` (banned per ADR-001).
- `services/`, `repositories/`, `use-cases/`, `domain/`, `entities/`, `infrastructure/`.
Do NOT create abstraction layers merely for theoretical separation.

## 2. Types Architecture
Structured application data types live under `src/types/<domain>/*.types.ts` (pure types only) or shared API types in `src/types/`.
- `types/<domain>/*.types.ts`: Pure types partitioned by domain.
- `*.dto.ts`: Backend transport structures.
- `api.types.ts`: Generic API structures (`ApiResponse<T>`, `ApiError`).
**Rule:** `types/` must contain PURE TYPES ONLY. No resource config, no endpoints, no constants, no formatting, no validation, and no side effects.

## 3. Domain Logic, API & Utilities
Business logic is organized by global file types rather than feature folders:
- **API calls:** Live in `src/api/<domain>/<domain>.api.ts`.
- **Hooks & Business Logic:** Live in `src/hooks/<domain>/use*.ts`.
- **UI Components:** Live in `src/components/<domain>/`.
- **Pages:** Live in `src/pages/<domain>/` (thin pages composing components and hooks).
- **Pure Helpers & Mappers:** Live in `src/utils/` (partitioned by topic, used in 3+ places). Only create mappers between meaningfully different structures.
- **Refine Resources:** Live in `src/resources/*.resource.ts`.

## 4. Refine Framework Integration
This project uses `@refinedev/core` (v4). 
- **Hooks:** Prefer Refine APIs (`useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete`, `useTable`, `useForm`) instead of custom data fetching logic.
- **Providers:** Refine provider implementations (auth, data, access control, notification) belong in `src/providers/`. Verify if functionality can be cleanly handled by existing providers before creating new API/auth directories.
- **Custom Hooks:** Do not wrap every Refine hook just to rename it. A custom hook must add meaningful behavior (e.g., specific domain queries).

## 5. Ant Design & UI Components
This project relies on `antd` (v5). Use official Ant Design patterns and do not replace them with unnecessary custom components.
- **Core Components:** Prefer official `<Form>`, `<Table>`, `<Modal>`, `<Drawer>`, `<Input>`, `<Select>`, `<DatePicker>`, `notification`, `message`.
- **Validation:** Use Ant Design Form validation for simple UI validation (`required`, `email`, `pattern`). 
- **Server Validation:** Backend validation is authoritative. Preserve field-level validation errors from the backend via the `dataProvider` and `forms/backendFieldErrors.ts` to map onto Ant Design Form fields.

## 6. React & TypeScript Guidelines
- **TypeScript:** Use strict TS (v6). Do NOT use `any`, `as any`, `as unknown as`, `@ts-ignore`, `@ts-nocheck` unless strictly necessary for 3rd party interop (must be documented). 
- **OOP:** Use interfaces/types for DTOs and plain data. Do not create Java-style classes for DTOs. Use classes ONLY when an object genuinely owns behavior and invariants. Prefer composition over inheritance.
- **React (v18):** Use functional components and hooks. Keep components focused. Avoid unnecessary `useEffect`, duplicated state, or derived state stored in `useState`. Do not optimize blindly.
- **Pages:** Keep `src/pages/` thin. Pages should primarily compose Refine hooks, feature components, and layouts. Do not implement large business rules or DTO transformations inside page components.

## 7. Dependency Direction
- Strictly follow the dependency hierarchy defined in `AGENTS.md`:
  `App/resources -> pages -> components -> hooks -> api -> types/utils/lib/constants`.
  Lower layers MUST NOT import upper layers.
- `types` MUST contain pure types only and must not import from higher layers.
- Import files using full paths via `@/`. Do NOT create `index.ts` re-export bundles.

## 8. Code Quality & Testing
- Follow existing ESLint, Prettier, and TypeScript configurations. Do not modify them unless explicitly requested.
- Preserve current tests. Test application behavior, NOT Refine or Ant Design implementation details.
