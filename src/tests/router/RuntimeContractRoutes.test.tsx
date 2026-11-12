/** Exercises actual route registration and Refine resources while BE-031 is blocked. */
import { Refine, type AuthProvider } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "@/constants/routes";
import { initializeAppI18n } from "@/locales";
import { createFoundationResources, foundationApiResources, foundationResourcePageRoutes } from "@/pages/resourceRegistry";
import { createAccessControlProvider } from "@/providers/accessControlProvider";
import { normalizeJwtRoles } from "@/providers/permissions/jwtRoles";
import { AppRouter } from "@/router/AppRouter";

const { tmsMounted } = vi.hoisted(() => ({ tmsMounted: vi.fn() }));
vi.mock("@/components/AppLayout", () => ({
  AppLayout: () => <Outlet />,
}));
vi.mock("@router/ProtectedRoute", () => ({ ProtectedRoute: () => <Outlet /> }));
vi.mock("@router/TenantGuard", () => ({ TenantGuard: () => <Outlet /> }));
vi.mock("@pages/tms-flow/OperationsDashboardPage", () => ({ OperationsDashboardPage: () => {
  tmsMounted();
  return <h1>TMS runtime</h1>;
} }));

const authProvider: AuthProvider = {
  check: async () => ({ authenticated: true }),
  login: async () => ({ success: true }),
  logout: async () => ({ success: true }),
  onError: async () => ({}),
  getIdentity: async () => ({ id: "1", tenantKey: "tenant-mock", roles: ["DISPATCHER"] }),
};
function CurrentPath() {
  const { pathname } = useLocation();
  return <output aria-label="Current path">{pathname}</output>;
}
function DriverRouteTestPage() {
  return <h1>Driver route mounted</h1>;
}

describe("current runtime route availability", () => {
  beforeEach(() => tmsMounted.mockClear());

  it("keeps the driver directory and detail routes in the runtime allowlist", () => {
    expect(foundationApiResources.drivers.collectionPath).toBe("/api/drivers");
    expect(foundationResourcePageRoutes.map(({ path }) => path)).toContain(routes.resources.drivers.list);
    expect(foundationResourcePageRoutes.map(({ path }) => path)).toContain("/drivers/:id");
  });

  it("matches /drivers inside the authenticated tenant route tree", async () => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    render(
      <MemoryRouter initialEntries={[routes.resources.drivers.list]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
          <Refine
            authProvider={authProvider}
            accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => normalizeJwtRoles(null, ["DISPATCHER"]) })}
            options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
          >
            <AppRouter resourcePageRoutes={[{ action: "list", component: DriverRouteTestPage, path: routes.resources.drivers.list, resource: "drivers" }]} />
          </Refine>
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Driver route mounted" })).toBeInTheDocument();
  });

  it.each([routes.login, routes.tmsFlow.root])(
    "reaches TMS from %s", async (entry) => {
      const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
      render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
        <Refine authProvider={authProvider} options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}>
          <CurrentPath />
          <AppRouter resourcePageRoutes={foundationResourcePageRoutes} />
        </Refine>
        </I18nextProvider>
      </MemoryRouter>);
      expect(await screen.findByRole("heading", { name: "TMS runtime" })).toBeInTheDocument();
      expect(tmsMounted).toHaveBeenCalled();
      expect(screen.getByLabelText("Current path")).toHaveTextContent(routes.tmsFlow.root);
    },
  );

  it.each([routes.resources.payments.create, "/payments/edit/payment", "/loads/edit/load", "/trips/edit/trip", "/trucks/edit/truck", routes.resources.conversations.list, routes.profile])("does not mount runtime-dependent commands from direct URL %s", async (entry) => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    render(<MemoryRouter initialEntries={[entry]}><I18nextProvider i18n={i18n}><Refine authProvider={authProvider} options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}><AppRouter resourcePageRoutes={foundationResourcePageRoutes} /></Refine></I18nextProvider></MemoryRouter>);
    expect(await screen.findByText(i18n.t("errors.notFound"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("excludes Executive and blocked CRUD from Refine menus while retaining document reads", async () => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    const resources = createFoundationResources(i18n.t);
    const names = resources.map((resource) => resource.name);
    for (const blocked of ["dashboard", "expenses", "maintenance", "conversations", "shipment-costs", "rate-rules"]) {
      expect(names).not.toContain(blocked);
    }
    expect(names).toContain("loads");
    const documents = resources.find((resource) => resource.name === "documents");
    expect(documents?.list).toBe(routes.resources.documents.list);
    expect(documents?.create).toBeUndefined();
    expect(documents?.edit).toBeUndefined();
  });

  it("does not mount the removed standalone AI Dispatch page", async () => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    render(
      <MemoryRouter initialEntries={["/ai-dispatch"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
          <Refine
            authProvider={authProvider}
            accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => normalizeJwtRoles(null, ["DISPATCHER"]) })}
            options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
          >
            <AppRouter resourcePageRoutes={foundationResourcePageRoutes} />
          </Refine>
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText(i18n.t("errors.notFound"))).toBeInTheDocument();
  });
});
