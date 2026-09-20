# Frontend Engineering Rules (Logistics App)

This document defines the mandatory frontend engineering rules for this repository, overriding generic recommendations with project-specific architecture, Refine conventions, and Ant Design patterns.

## 1. Project Directory Structure
This repository enforces a strict, flat-feature architecture. 
**APPROVED DIRECTORY LAYER (`src/`):**
- `assets/`: Static assets (images, icons).
- `components/`: Global, reusable UI components. Do NOT place domain-specific components here.
- `hooks/`: Application-wide reusable hooks.
- `validators/`: Reusable generic validators (e.g., `email.validator.ts`).
- `formatters/`: Formatting logic (raw data -> display representation).
- `forms/`: Shared form infrastructure (e.g., `backendFieldErrors.ts`).
- `table/`: Global table utilities.
- `utils/`: Generic helpers.
- `types/`: Frontend application data structures, DTOs, and form structures.
- `constants/`: Global constants.
- `config/`: Application configuration.
- `providers/`: Refine integrations (`dataProvider.ts`, `authProvider.ts`, etc.).
- `features/`: Domain-specific modules containing what the application *does* with data.
- `pages/`: Route-level screens composing Refine hooks, feature components, and layouts.
- `router/`: Application routing configuration.
- `locales/`: Internationalization dictionaries.
- `styles/`: Global stylesheets.
- `test/`: Testing setup and utilities.

**BANNED DIRECTORIES / LAYERS:**
Do NOT create the following folders or architectural layers unless explicitly requested:
- `src/app/`, `src/common/`, `src/core/`, `src/shared/`
- `services/`, `repositories/`, `use-cases/`, `domain/`, `entities/`, `infrastructure/`
Do NOT create abstraction layers merely for theoretical separation.

## 2. Types Architecture
All structured application data types MUST live at the root of `src/types/` in a flat structure. Do NOT create `features/*/types/`, `types/dto/`, or `types/models/`.
- `*.types.ts`: Frontend/application data structures (e.g., `customer.types.ts`).
- `*.dto.ts`: Backend transport structures (e.g., `CreateCustomerDto`, `CustomerResponseDto`).
- `*.form.types.ts`: Form structures, ONLY when they differ meaningfully from DTO/domain types.
- `api.types.ts`: Generic API structures (`ApiResponse<T>`, `ApiError`).
**Rule:** Types must contain STRUCTURE ONLY. No formatting, validation, API requests, mappers, or side effects.

## 3. Features & Mappers
`src/features/` organizes what the application does with data.
- **Responsibilities:** Feature UI, feature-specific mapping, business validation, Refine resource configuration.
- **Mappers:** Only create mappers to transform between *meaningfully different* structures. Do NOT create identity mappers.
- **Business Validation:** Belongs in the feature folder (e.g., `features/loads/load.validation.ts`). Do NOT put domain validation in `src/validators/` or `src/forms/`.

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
- `types` MUST NOT import `features`, `pages`, `components`, or `providers`.
- Shared infrastructure (`components`, `hooks`, `validators`, `formatters`, `forms`) MUST NOT depend on business pages.

## 8. Code Quality & Testing
- Follow existing ESLint, Prettier, and TypeScript configurations. Do not modify them unless explicitly requested.
- Preserve current tests. Test application behavior, NOT Refine or Ant Design implementation details.
