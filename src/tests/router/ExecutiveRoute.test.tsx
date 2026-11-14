/**
 * Executive route registration and permission guard.
 *
 * The page is mocked so this file proves only the routing contract: the URL
 * from `routes.executiveReport` is mounted inside the authenticated tenant
 * tree, and `reports:EXECUTIVE_VIEW` gates it. Dispatcher and driver roles hit
 * the forbidden screen without the page ever mounting.
 */

import { Refine, type AuthProvider } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { MemoryRouter, Outlet } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { routes } from "@/constants/routes";
import { initializeAppI18n } from "@/locales";
import { createAccessControlProvider } from "@/providers/accessControlProvider";
import { normalizeJwtRoles } from "@/providers/permissions/jwtRoles";
import { AppRouter } from "@/router/AppRouter";

const pageMounted = vi.hoisted(() => vi.fn());

vi.mock("@/components/AppLayout", () => ({ AppLayout: () => <Outlet /> }));
vi.mock("@router/ProtectedRoute", () => ({ ProtectedRoute: () => <Outlet /> }));
vi.mock("@router/TenantGuard", () => ({ TenantGuard: () => <Outlet /> }));
vi.mock("@/pages/executive/ExecutiveOverviewPage", () => ({
  ExecutiveOverviewPage: () => {
    pageMounted();
    return <h1>Executive runtime</h1>;
  },
}));

const authProvider: AuthProvider = {
  check: async () => ({ authenticated: true }),
  login: async () => ({ success: true }),
  logout: async () => ({ success: true }),
  onError: async () => ({}),
  getIdentity: async () => ({ id: "1", tenantKey: "tenant-mock", roles: ["ADMIN"] }),
};

const renderRoute = async (role: string) => {
  const i18n: I18nInstance = await initializeAppI18n({
    locale: "en",
    fallbackLocale: "en",
  });
  render(
    <MemoryRouter
      initialEntries={[routes.executiveReport]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <I18nextProvider i18n={i18n}>
        <Refine
          authProvider={authProvider}
          accessControlProvider={createAccessControlProvider({
            getJwtRoles: async () => normalizeJwtRoles(null, [role]),
          })}
          options={{
            reactQuery: {
              clientConfig: { defaultOptions: { queries: { retry: false } } },
            },
          }}
        >
          <AppRouter resourcePageRoutes={[]} />
        </Refine>
      </I18nextProvider>
    </MemoryRouter>,
  );
  return i18n;
};

describe("Executive route", () => {
  it.each(["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"])(
    "mounts /reports/executive for %s",
    async (role) => {
      pageMounted.mockClear();
      await renderRoute(role);

      expect(
        await screen.findByRole("heading", { name: "Executive runtime" }),
      ).toBeInTheDocument();
      expect(pageMounted).toHaveBeenCalled();
    },
  );

  it.each(["DISPATCHER", "DRIVER", "UNKNOWN"])(
    "shows the forbidden screen for %s without mounting the page",
    async (role) => {
      pageMounted.mockClear();
      const i18n = await renderRoute(role);

      expect(
        await screen.findByText(i18n.t("errors.forbidden")),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Executive runtime" }),
      ).not.toBeInTheDocument();
      expect(pageMounted).not.toHaveBeenCalled();
    },
  );
});
