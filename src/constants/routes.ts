/**
 * Cung cấp toàn bộ route path của ứng dụng từ một nguồn duy nhất.
 */

const createCrudRoutes = (resource: string) => ({
  list: `/${resource}`,
  create: `/${resource}/create`,
  edit: `/${resource}/edit/:id`,
  show: `/${resource}/show/:id`,
});

export const routes = {
  callback: "/auth/lark/callback",
  dashboard: "/dashboard",
  forbidden: "/403",
  login: "/login",
  selectTenant: "/select-tenant",
  resources: {
    accidents: createCrudRoutes("accidents"),
    aiDispatch: createCrudRoutes("ai-dispatch"),
    containers: createCrudRoutes("containers"),
    conversations: createCrudRoutes("conversations"),
    customers: createCrudRoutes("customers"),
    documents: createCrudRoutes("documents"),
    dvir: createCrudRoutes("dvir"),
    employees: createCrudRoutes("employees"),
    expenses: createCrudRoutes("expenses"),
    hosEld: createCrudRoutes("hos-eld"),
    invoices: createCrudRoutes("invoices"),
    loadBoard: createCrudRoutes("load-board"),
    loads: createCrudRoutes("loads"),
    maintenance: createCrudRoutes("maintenance"),
    notifications: createCrudRoutes("notifications"),
    payments: createCrudRoutes("payments"),
    products: createCrudRoutes("products"),
    terminals: createCrudRoutes("terminals"),
    trips: createCrudRoutes("trips"),
    trucks: createCrudRoutes("trucks"),
  },
} as const;
