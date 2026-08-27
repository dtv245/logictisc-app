# Project tree

Generated with:

```bash
tree -a -I '.git|.gitnexus|node_modules|dist|dist-ssr|coverage|playwright-report|test-results|.idea|tree.md' --dirsfirst
```

```text
.
├── .agents
├── .aiassistant
│   └── rules
│       └── refine.md
├── .claude
│   ├── skills
│   │   └── gitnexus
│   │       ├── gitnexus-cli
│   │       ├── gitnexus-debugging
│   │       ├── gitnexus-exploring
│   │       ├── gitnexus-guide
│   │       ├── gitnexus-impact-analysis
│   │       └── gitnexus-refactoring
│   └── settings.local.json
├── .codex
│   └── AGENTS.md
├── docs
│   ├── api-refactor-audit.md
│   ├── backend-gaps.md
│   ├── frontend-architecture-review.md
│   ├── phase-0-foundation.md
│   └── refine-v4-integration.md
├── e2e
│   └── bootstrap.spec.ts
├── public
│   ├── favicon.svg
│   ├── icons.svg
│   └── runtime-config.example.json
├── src
│   ├── app
│   │   ├── bootstrap
│   │   │   ├── AppBootstrap.test.tsx
│   │   │   ├── AppBootstrap.tsx
│   │   │   ├── BootstrapStateView.test.tsx
│   │   │   ├── BootstrapStateView.tsx
│   │   │   ├── bootstrapState.test.ts
│   │   │   ├── bootstrapState.ts
│   │   │   ├── index.ts
│   │   │   ├── useAppBootstrap.test.tsx
│   │   │   └── useAppBootstrap.ts
│   │   ├── diagnostics
│   │   │   ├── DiagnosticsPage.test.tsx
│   │   │   ├── DiagnosticsPage.tsx
│   │   │   └── index.ts
│   │   ├── i18n
│   │   │   ├── locales
│   │   │   │   ├── en.ts
│   │   │   │   └── vi.ts
│   │   │   ├── createApplicationI18n.test.ts
│   │   │   ├── createApplicationI18n.ts
│   │   │   ├── index.ts
│   │   │   └── resources.ts
│   │   ├── router
│   │   │   ├── AppRouter.test.tsx
│   │   │   ├── AppRouter.tsx
│   │   │   ├── index.ts
│   │   │   ├── routes.test.ts
│   │   │   └── routes.ts
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── index.ts
│   │   └── refine.config.ts
│   ├── assets
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components
│   │   ├── AppHeader.tsx
│   │   ├── AppLayout.tsx
│   │   ├── AppSider.tsx
│   │   ├── AppTitle.tsx
│   │   ├── ResourceCreatePage.tsx
│   │   ├── ResourceEditPage.tsx
│   │   ├── ResourceListPage.tsx
│   │   ├── ResourceShowPage.tsx
│   │   ├── crudColumns.tsx
│   │   └── index.ts
│   ├── config
│   │   └── env.ts
│   ├── constants
│   │   ├── routes.ts
│   │   └── ui.ts
│   ├── core
│   │   ├── api
│   │   │   ├── client.test.ts
│   │   │   ├── client.ts
│   │   │   ├── dataProvider.test.ts
│   │   │   ├── dataProvider.ts
│   │   │   ├── envelope.test.ts
│   │   │   ├── envelope.ts
│   │   │   ├── httpError.test.ts
│   │   │   ├── index.ts
│   │   │   ├── latestRequest.test.ts
│   │   │   ├── latestRequest.ts
│   │   │   ├── path.ts
│   │   │   ├── querySerializer.test.ts
│   │   │   ├── querySerializer.ts
│   │   │   └── types.ts
│   │   ├── auth
│   │   │   ├── authProvider.test.ts
│   │   │   ├── authProvider.ts
│   │   │   ├── index.ts
│   │   │   ├── jwtVerifier.test.ts
│   │   │   ├── jwtVerifier.ts
│   │   │   ├── oidcGateway.test.ts
│   │   │   ├── oidcGateway.ts
│   │   │   ├── sessionManager.test.ts
│   │   │   ├── sessionManager.ts
│   │   │   └── types.ts
│   │   ├── config
│   │   │   ├── RuntimeConfigProvider.test.tsx
│   │   │   ├── RuntimeConfigProvider.tsx
│   │   │   ├── healthProbe.test.ts
│   │   │   ├── healthProbe.ts
│   │   │   ├── index.ts
│   │   │   ├── loadRuntimeConfig.test.ts
│   │   │   ├── loadRuntimeConfig.ts
│   │   │   ├── runtimeConfigContext.ts
│   │   │   ├── runtimeConfigSchema.test.ts
│   │   │   ├── runtimeConfigSchema.ts
│   │   │   ├── types.ts
│   │   │   └── useRuntimeConfig.ts
│   │   ├── errors
│   │   │   └── httpError.ts
│   │   └── permissions
│   │       ├── accessControlProvider.test.ts
│   │       ├── accessControlProvider.ts
│   │       ├── index.ts
│   │       ├── jwtRoles.test.ts
│   │       ├── jwtRoles.ts
│   │       ├── roleMatrix.test.ts
│   │       ├── roleMatrix.ts
│   │       ├── tenantRoleClaims.test.ts
│   │       └── tenantRoleClaims.ts
│   ├── features
│   │   └── README.md
│   ├── hooks
│   │   ├── useApiError.ts
│   │   ├── useAuthStatus.ts
│   │   ├── useCurrentTenant.ts
│   │   ├── useCurrentUser.ts
│   │   ├── useLarkLogin.ts
│   │   ├── useLogoutUser.ts
│   │   ├── useSwitchTenant.ts
│   │   └── useTenantList.ts
│   ├── locales
│   │   └── en.ts
│   ├── pages
│   │   ├── accidents
│   │   │   ├── accidents.resource.ts
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── ai-dispatch
│   │   │   ├── ai-dispatch.resource.ts
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── auth
│   │   │   ├── LarkCallbackPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── containers
│   │   │   ├── columns.tsx
│   │   │   ├── containers.resource.ts
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── conversations
│   │   │   ├── columns.tsx
│   │   │   ├── conversations.resource.ts
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── customers
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── customers.resource.ts
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── dashboard
│   │   │   └── DashboardPage.tsx
│   │   ├── documents
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── documents.resource.ts
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── dvir
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── dvir.resource.ts
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── employees
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── employees.resource.ts
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── errors
│   │   │   ├── ForbiddenPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── expenses
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── expenses.resource.ts
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── hos-eld
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── hos-eld.resource.ts
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── invoices
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── invoices.resource.ts
│   │   │   ├── list.tsx
│   │   │   └── show.tsx
│   │   ├── load-board
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── load-board.resource.ts
│   │   │   └── show.tsx
│   │   ├── loads
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── loads.resource.ts
│   │   │   └── show.tsx
│   │   ├── maintenance
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── maintenance.resource.ts
│   │   │   └── show.tsx
│   │   ├── notifications
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── notifications.resource.ts
│   │   │   └── show.tsx
│   │   ├── payments
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── payments.resource.ts
│   │   │   └── show.tsx
│   │   ├── products
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── form.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── products.resource.ts
│   │   │   ├── show.tsx
│   │   │   └── types.ts
│   │   ├── tenant
│   │   │   └── SelectTenantPage.tsx
│   │   ├── terminals
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── show.tsx
│   │   │   └── terminals.resource.ts
│   │   ├── trips
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── show.tsx
│   │   │   └── trips.resource.ts
│   │   ├── trucks
│   │   │   ├── columns.tsx
│   │   │   ├── create.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── index.ts
│   │   │   ├── list.tsx
│   │   │   ├── show.tsx
│   │   │   └── trucks.resource.ts
│   │   ├── index.ts
│   │   └── resourceConfig.ts
│   ├── providers
│   │   ├── accessControlProvider.ts
│   │   ├── authProvider.ts
│   │   ├── dataProvider.ts
│   │   └── notificationProvider.ts
│   ├── routes
│   │   ├── AppRouter.tsx
│   │   ├── FullPageLoader.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── TenantGuard.tsx
│   ├── services
│   │   ├── http
│   │   │   ├── endpoints.ts
│   │   │   ├── errors.ts
│   │   │   ├── httpClient.ts
│   │   │   ├── interceptors.ts
│   │   │   ├── queryAdapter.ts
│   │   │   ├── responseAdapter.ts
│   │   │   └── tenantSession.ts
│   │   ├── authService.ts
│   │   ├── authSession.ts
│   │   └── tokenStore.ts
│   ├── shared
│   │   ├── components
│   │   │   ├── AccessibleAnnouncement.tsx
│   │   │   ├── AsyncState.test.tsx
│   │   │   ├── AsyncState.tsx
│   │   │   ├── ConfirmActionButton.test.tsx
│   │   │   ├── ConfirmActionButton.tsx
│   │   │   ├── ErrorStates.test.tsx
│   │   │   ├── ErrorStates.tsx
│   │   │   ├── StatusIndicator.test.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── asyncStateModel.ts
│   │   │   ├── index.ts
│   │   │   └── singleFlight.ts
│   │   ├── formatters
│   │   │   ├── dateTime.test.ts
│   │   │   ├── dateTime.ts
│   │   │   ├── index.ts
│   │   │   ├── money.test.ts
│   │   │   └── money.ts
│   │   ├── forms
│   │   │   ├── backendFieldErrors.test.ts
│   │   │   ├── backendFieldErrors.ts
│   │   │   └── index.ts
│   │   ├── i18n
│   │   │   ├── locales
│   │   │   │   ├── en.ts
│   │   │   │   └── vi.ts
│   │   │   ├── createI18n.test.ts
│   │   │   ├── createI18n.ts
│   │   │   ├── index.ts
│   │   │   └── resources.ts
│   │   ├── table
│   │   │   ├── actionAvailability.ts
│   │   │   ├── index.ts
│   │   │   ├── rowKeys.ts
│   │   │   ├── tableUrlState.test.tsx
│   │   │   ├── tableUrlState.ts
│   │   │   ├── tableUtilities.test.ts
│   │   │   └── useDebouncedTableSearch.ts
│   │   ├── testing
│   │   │   └── renderWithSharedProviders.tsx
│   │   ├── types
│   │   │   └── api.ts
│   │   └── index.ts
│   ├── styles
│   │   ├── _variables.scss
│   │   ├── app.scss
│   │   └── global.scss
│   ├── test
│   │   └── setup.ts
│   ├── types
│   │   ├── accident.ts
│   │   ├── ai-dispatch.ts
│   │   ├── api-key.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── common.ts
│   │   ├── customer.ts
│   │   ├── document.ts
│   │   ├── dvir.ts
│   │   ├── employee.ts
│   │   ├── finance.ts
│   │   ├── hos-eld.ts
│   │   ├── index.ts
│   │   ├── load-board.ts
│   │   ├── load.ts
│   │   ├── notification.ts
│   │   ├── tenant.ts
│   │   ├── trip.ts
│   │   └── truck.ts
│   ├── utils
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
├── .env.example
├── .gitignore
├── CONVENTIONS.md
├── PLAN.md
├── README.md
├── eslint.config.js
├── frontend-context.md
├── index.html
├── package-lock.json
├── package.json
├── playwright.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

79 directories, 358 files
```
