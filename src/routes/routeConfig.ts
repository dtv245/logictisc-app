export const routes = {
  callback: "/auth/lark/callback",
  dashboard: "/dashboard",
  forbidden: "/403",
  login: "/login",
  productCreate: "/products/create",
  productEdit: "/products/edit/:id",
  products: "/products",
  productShow: "/products/show/:id",
  selectTenant: "/select-tenant",
} as const;
