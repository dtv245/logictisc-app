/**
 * Cung cấp toàn bộ route path của ứng dụng từ một nguồn duy nhất.
 */

const createCrudRoutes = (resource: string) => ({
  // Giữ cùng một convention URL cho mọi resource để router và Refine metadata
  // không tự ghép path theo hai cách khác nhau.
  list: `/${resource}`,
  create: `/${resource}/create`,
  edit: `/${resource}/edit/:id`,
  show: `/${resource}/show/:id`,
});

export const routes = {
  callback: "/auth/callback",
  dashboard: "/dashboard",
  diagnostics: "/diagnostics",
  forbidden: "/403",
  login: "/login",
  // Màn hình điều phối, tách khỏi `dashboard` (Executive Overview): hai màn
  // hình trả lời hai câu hỏi khác nhau và cùng tồn tại.
  operations: "/operations",
  profile: "/profile",
  profitability: "/finance/profitability",
  optimization: "/optimization",
  optimizationRun: "/optimization/runs/:id",
  fleetReport: "/reports/fleet",
  payroll: "/payroll",
  payrollShow: "/payroll/:id",
  payrollReconciliation: "/payroll/reconciliation",
  myPayslips: "/profile/payslips",
  payslipShow: "/payslips/:id",
  aiDispatch: "/ai-dispatch",
  aiDispatchShow: "/ai-dispatch/:id",
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
    settlements: {
      ...createCrudRoutes("settlements"),
      show: "/settlements/:id",
      policies: "/settlements/policies",
      policyShow: "/settlements/policies/:id",
    },
    terminals: createCrudRoutes("terminals"),
    trips: createCrudRoutes("trips"),
    trucks: createCrudRoutes("trucks"),
  },
} as const;
