import { initializeAppI18n } from "@locales";
import { App as AntdApp } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenPage } from "@pages/errors/ForbiddenPage";
import { NotFoundPage } from "@pages/errors/NotFoundPage";
import { routes } from "@constants/routes";

const mockGo = vi.fn();

vi.mock("@refinedev/core", () => ({
  useGo: () => mockGo,
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

describe("System Error Pages (403 and 404)", () => {
  beforeAll(async () => {
    i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
  });

  beforeEach(() => {
    mockGo.mockClear();
  });

  describe("ForbiddenPage (403)", () => {
    it("renders 403 status, localized description and navigates to dashboard", () => {
      render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <ForbiddenPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      expect(screen.getByText("403")).toBeInTheDocument();
      expect(screen.getByText(i18n.t("errors.forbidden"))).toBeInTheDocument();

      const dashboardBtn = screen.getByRole("button", {
        name: new RegExp(i18n.t("common.goDashboard"), "i"),
      });
      expect(dashboardBtn).toBeInTheDocument();

      fireEvent.click(dashboardBtn);
      expect(mockGo).toHaveBeenCalledWith({
        to: routes.dashboard,
        type: "replace",
      });
    });
  });

  describe("NotFoundPage (404)", () => {
    it("renders 404 status, localized description and navigates to dashboard", () => {
      render(
        <I18nextProvider i18n={i18n}>
          <AntdApp>
            <MemoryRouter>
              <NotFoundPage />
            </MemoryRouter>
          </AntdApp>
        </I18nextProvider>,
      );

      expect(screen.getByText("404")).toBeInTheDocument();
      expect(screen.getByText(i18n.t("errors.notFound"))).toBeInTheDocument();

      const dashboardBtn = screen.getByRole("button", {
        name: new RegExp(i18n.t("common.goDashboard"), "i"),
      });
      expect(dashboardBtn).toBeInTheDocument();

      fireEvent.click(dashboardBtn);
      expect(mockGo).toHaveBeenCalledWith({
        to: routes.dashboard,
        type: "replace",
      });
    });
  });
});
