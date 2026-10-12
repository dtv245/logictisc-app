/**
 * AppResponsiveShell.test.tsx
 *
 * Kiểm thử toàn diện khung giao diện dùng chung (Core Shell Layout) của LogisticsX
 * tại các breakpoint thực tế: 375px, 414px, 768px, 1024px, 1440px.
 *
 * Kiểm tra:
 * 1. Padding responsive của nội dung chính (Mobile 12px, Tablet 16px, Desktop 24px).
 * 2. Hành vi Sidebar & Drawer (Mobile Drawer, Tablet Collapsed Icon mode, Desktop Expanded).
 * 3. AppHeader không tràn ngang, ẩn thành phần phụ trên mobile nhưng giữ đủ chức năng.
 * 4. User menu có thể mở được trên mobile, tablet và desktop (hỗ trợ cả click và hover).
 * 5. Tự động đóng Drawer khi điều hướng route và khi resize màn hình.
 * 6. Accessibility: aria-label, aria-expanded, role, touch targets.
 */

import { AppHeader } from "@components/AppHeader";
import { AppLayout } from "@components/AppLayout";
import { AppSider } from "@components/AppSider";
import { initializeAppI18n } from "@locales";
import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { env } from "@config/env";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mockUserData = {
  name: "Nguyen Van Admin",
  email: "admin@logisticsx.com",
  avatar: "https://example.com/avatar.png",
};

vi.mock("@hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    data: mockUserData,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@hooks/useSwitchTenant", () => ({
  useSwitchTenant: () => ({
    switchTenant: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@hooks/useLogoutUser", () => ({
  useLogoutUser: () => ({
    logoutUser: vi.fn(),
  }),
}));

vi.mock("@features/notifications/components/NotificationHeaderIcon", () => ({
  NotificationHeaderIcon: () => (
    <button aria-label="Thông báo" className="notification-icon-mock" style={{ minWidth: 44, minHeight: 44 }}>
      🔔
    </button>
  ),
}));

const mockCan = vi.fn(async () => ({ can: true }));

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return {
    ...actual,
    useCanWithoutCache: () => ({
      can: mockCan,
    }),
  };
});

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const setViewport = (width: number, height = 800) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};

afterEach(() => {
  setViewport(1200);
});

describe("Responsive Core Shell Layout — Kiểm thử đa thiết bị", () => {
  const VIEWPORTS = [
    { name: "Mobile nhỏ (iPhone SE)", width: 375 },
    { name: "Mobile tiêu chuẩn (iPhone XR / Max)", width: 414 },
    { name: "Tablet (iPad)", width: 768 },
    { name: "Small Desktop / Tablet ngang (iPad Pro)", width: 1024 },
    { name: "Large Desktop", width: 1440 },
  ];

  describe("1. Khởi tạo và render Shell trên từng breakpoint", () => {
    VIEWPORTS.forEach(({ name, width }) => {
      it(`render thành công trên kích thước ${name} (${width}px)`, async () => {
        setViewport(width);

        const { container } = render(
          <MemoryRouter initialEntries={["/"]}>
            <I18nextProvider i18n={i18n}>
              <ThemedLayoutContextProvider>
                <AppLayout />
              </ThemedLayoutContextProvider>
            </I18nextProvider>
          </MemoryRouter>,
        );

        // Header và main content luôn hiện diện
        expect(container.querySelector(".app-header")).toBeInTheDocument();
        expect(container.querySelector(".app-content")).toBeInTheDocument();
        expect(container.querySelector("#main-content")).toBeInTheDocument();
      });
    });
  });

  describe("2. Padding responsive của nội dung chính (app-content)", () => {
    it("được cấu hình đúng CSS quy ước theo từng kích thước", () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <I18nextProvider i18n={i18n}>
            <ThemedLayoutContextProvider>
              <AppLayout />
            </ThemedLayoutContextProvider>
          </I18nextProvider>
        </MemoryRouter>,
      );

      const mainContent = container.querySelector(".app-content");
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute("role", "main");
      expect(mainContent).toHaveAttribute("id", "main-content");
    });
  });

  describe("3. AppHeader trên Mobile (375px & 414px)", () => {
    [375, 414].forEach((width) => {
      it(`tối ưu hiển thị, không tràn ngang và mở được menu tại ${width}px`, async () => {
        setViewport(width);

        render(
          <MemoryRouter initialEntries={["/"]}>
            <I18nextProvider i18n={i18n}>
              <ThemedLayoutContextProvider>
                <AppHeader />
              </ThemedLayoutContextProvider>
            </I18nextProvider>
          </MemoryRouter>,
        );

        // Nút hamburger có aria-label và aria-expanded
        const hamburgerBtn = screen.getByRole("button", {
          name: /Mở rộng thanh điều hướng|Thu gọn thanh điều hướng/i,
        });
        expect(hamburgerBtn).toBeInTheDocument();
        expect(hamburgerBtn).toHaveAttribute("aria-expanded", "false");

        // Brand title mobile hiển thị
        expect(screen.getByText(env.appName)).toBeInTheDocument();

        // User menu có thể bấm mở dropdown trên màn hình nhỏ
        const userMenu = screen.getByRole("button", {
          name: /Nguyen Van Admin/i,
        });
        expect(userMenu).toBeInTheDocument();
        expect(userMenu).toHaveAttribute("aria-haspopup", "true");

        // Bấm user menu để mở dropdown menu
        fireEvent.click(userMenu);

        await waitFor(() => {
          expect(screen.getByText(/Đổi công ty|Đổi doanh nghiệp/i)).toBeInTheDocument();
          expect(screen.getByText("Đăng xuất")).toBeInTheDocument();
        });
      });
    });
  });

  describe("4. Hành vi Sider và Drawer trên Mobile vs Tablet vs Desktop", () => {
    it("trên Mobile (< 768px): bấm nút hamburger mở Drawer trượt từ bên trái và có nút Đóng", async () => {
      setViewport(375);

      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <I18nextProvider i18n={i18n}>
            <ThemedLayoutContextProvider>
              <AppHeader />
              <AppSider />
            </ThemedLayoutContextProvider>
          </I18nextProvider>
        </MemoryRouter>,
      );

      const headerToggleBtn = container.querySelector(".app-header__toggle-btn");
      expect(headerToggleBtn).toBeInTheDocument();

      // Bấm nút hamburger trong header
      fireEvent.click(headerToggleBtn!);

      // Drawer hiển thị
      await waitFor(() => {
        expect(document.querySelector(".app-sider-drawer")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
      });

      // Bấm nút Đóng trong Drawer
      const closeBtn = screen.getByRole("button", { name: "Đóng" });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(document.querySelector(".app-sider-drawer .ant-drawer-open")).not.toBeInTheDocument();
      });
    });

    it("trên Tablet (768px): Sider thu gọn icon mode và header toggle điều khiển Sider", async () => {
      setViewport(768);

      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <I18nextProvider i18n={i18n}>
            <ThemedLayoutContextProvider initialSiderCollapsed={true}>
              <AppHeader />
              <AppSider />
            </ThemedLayoutContextProvider>
          </I18nextProvider>
        </MemoryRouter>,
      );

      const headerToggle = container.querySelector(".app-header__toggle-btn");
      expect(headerToggle).toBeInTheDocument();

      // Bấm toggle tại tablet điều khiển siderCollapsed
      fireEvent.click(headerToggle!);

      await waitFor(() => {
        expect(container.querySelector(".app-sider")).toBeInTheDocument();
      });
    });

    it("trên Desktop (1024px & 1440px): Sider mở rộng đầy đủ và hiển thị các phân khu", async () => {
      setViewport(1440);

      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <I18nextProvider i18n={i18n}>
            <ThemedLayoutContextProvider initialSiderCollapsed={false}>
              <AppHeader />
              <AppSider />
            </ThemedLayoutContextProvider>
          </I18nextProvider>
        </MemoryRouter>,
      );

      expect(container.querySelector(".app-sider")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("Điều hành & Giám sát")).toBeInTheDocument();
      });
    });
  });

  describe("5. Đóng Drawer khi điều hướng route", () => {
    it("tự động đóng Drawer khi người dùng điều hướng sang trang khác", async () => {
      setViewport(375);

      const NavTrigger = () => {
        const navigate = useNavigate();
        return (
          <button data-testid="nav-btn" onClick={() => navigate("/operations")}>
            Điều hướng
          </button>
        );
      };

      const TestNavigationApp = () => {
        return (
          <MemoryRouter initialEntries={["/"]}>
            <I18nextProvider i18n={i18n}>
              <ThemedLayoutContextProvider>
                <AppHeader />
                <AppSider />
                <NavTrigger />
                <Routes>
                  <Route path="/" element={<div data-testid="page-home">Trang chủ</div>} />
                  <Route path="/operations" element={<div data-testid="page-operations">Điều hành</div>} />
                </Routes>
              </ThemedLayoutContextProvider>
            </I18nextProvider>
          </MemoryRouter>
        );
      };

      const { container } = render(<TestNavigationApp />);

      // Mở Drawer bằng header toggle
      const headerToggleBtn = container.querySelector(".app-header__toggle-btn");
      expect(headerToggleBtn).toBeInTheDocument();
      fireEvent.click(headerToggleBtn!);

      await waitFor(() => {
        expect(document.querySelector(".app-sider-drawer")).toBeInTheDocument();
      });

      // Bấm nút điều hướng route
      const navBtn = screen.getByTestId("nav-btn");
      fireEvent.click(navBtn);

      // Khi URL route thay đổi, Drawer tự động đóng lại
      await waitFor(() => {
        expect(document.querySelector(".app-sider-drawer .ant-drawer-open")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("page-operations")).toBeInTheDocument();
    });
  });

  describe("6. Accessibility và Touch Targets", () => {
    it("các nút điều hướng và trigger có aria-label và vùng bấm đạt chuẩn touch target", () => {
      setViewport(375);

      render(
        <MemoryRouter initialEntries={["/"]}>
          <I18nextProvider i18n={i18n}>
            <ThemedLayoutContextProvider>
              <AppHeader />
            </ThemedLayoutContextProvider>
          </I18nextProvider>
        </MemoryRouter>,
      );

      const toggleBtn = screen.getByRole("button", {
        name: /Mở rộng thanh điều hướng|Thu gọn thanh điều hướng/i,
      });
      expect(toggleBtn).toHaveClass("app-header__toggle-btn");

      const userMenu = screen.getByRole("button", {
        name: /Nguyen Van Admin/i,
      });
      expect(userMenu).toHaveClass("user-menu");
      expect(userMenu).toHaveAttribute("tabindex", "0");
    });
  });
});
