/** Exercises actual route registration and Refine resources while BE-031 is blocked. */
import { Refine, type AuthProvider } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "@/constants/routes";
import { initializeAppI18n } from "@/locales";
import { createFoundationResources, foundationResourcePageRoutes } from "@/pages/resourceRegistry";
import { createAccessControlProvider } from "@/providers/accessControlProvider";
import { normalizeJwtRoles } from "@/providers/permissions/jwtRoles";
import { AppRouter } from "@/router/AppRouter";

const { executiveMounted } = vi.hoisted(() => ({ executiveMounted: vi.fn() }));
vi.mock("@components", async (importOriginal) => ({
  ...await importOriginal<typeof import("@components")>(),
  AppLayout: () => <Outlet />,
}));
vi.mock("@router/ProtectedRoute", () => ({ ProtectedRoute: () => <Outlet /> }));
vi.mock("@router/TenantGuard", () => ({ TenantGuard: () => <Outlet /> }));
vi.mock("@pages/dashboard/DashboardPage", () => ({ DashboardPage: () => {
  executiveMounted();
  return <h1>Executive requests would mount</h1>;
} }));
vi.mock("@pages/dashboard/OperationsDashboardPage", () => ({ OperationsDashboardPage: () => <h1>Operations runtime</h1> }));

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

describe("current runtime route availability", () => {
  beforeEach(() => executiveMounted.mockClear());

  it.each([routes.dashboard, routes.login, routes.operations])(
    "reaches Operations without mounting blocked Executive queries from %s", async (entry) => {
      const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
      render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
        <Refine authProvider={authProvider} options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}>
          <CurrentPath />
          <AppRouter resourcePageRoutes={foundationResourcePageRoutes} />
        </Refine>
        </I18nextProvider>
      </MemoryRouter>);
      expect(await screen.findByRole("heading", { name: "Operations runtime" })).toBeInTheDocument();
      expect(screen.getByLabelText("Current path")).toHaveTextContent(routes.operations);
      expect(executiveMounted).not.toHaveBeenCalled();
    },
  );

  it.each([routes.resources.payments.create, "/payments/edit/payment", "/loads/edit/load", "/trips/edit/trip", "/trucks/edit/truck", routes.resources.conversations.list, routes.profile, routes.resources.terminals.list])("does not mount runtime-dependent commands from direct URL %s", async (entry) => {
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

  it("mounts AI Dispatch page without 404 when navigating to /ai-dispatch", async () => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    render(
      <MemoryRouter initialEntries={[routes.aiDispatch]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
          <Refine
            authProvider={authProvider}
            accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => normalizeJwtRoles(null, ["DISPATCHER"]) })}
            options={{ reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
          >
            <CurrentPath />
            <AppRouter resourcePageRoutes={foundationResourcePageRoutes} />
          </Refine>
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByText(i18n.t("errors.notFound"))).not.toBeInTheDocument();
    expect(await screen.findByText("AI Smart Vehicle Dispatch")).toBeInTheDocument();
    expect(screen.getByLabelText("Current path")).toHaveTextContent(routes.aiDispatch);
  });
});
