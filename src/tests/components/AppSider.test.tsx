/**
 * Unit tests cho AppSider — Thanh taskbar điều hướng bên trái theo tầng và phân khu.
 */

import { AppSider } from "@components/AppSider";
import { NAV_ZONES } from "@components/appNavigation";
import { initializeAppI18n } from "@locales";
import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    data: { name: "Admin User", email: "admin@logisticsx.com" },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@hooks/useLogoutUser", () => ({
  useLogoutUser: () => ({ logoutUser: vi.fn(), isLoading: false }),
}));

vi.mock("@hooks/useSwitchTenant", () => ({
  useSwitchTenant: () => ({ switchTenant: vi.fn(), isLoading: false }),
}));

vi.mock("@features/notifications/components/NotificationHeaderIcon", () => ({
  NotificationHeaderIcon: () => <button aria-label="Thông báo" />,
}));

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return {
    ...actual,
    useCanWithoutCache: () => ({
      can: vi.fn(async () => ({ can: true })),
    }),
  };
});

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderSider = (initialRoute = "/operations", collapsed = false) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nextProvider i18n={i18n}>
        <ThemedLayoutContextProvider initialSiderCollapsed={collapsed}>
          <AppSider />
        </ThemedLayoutContextProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
};

describe("AppSider — Thanh Taskbar bên trái phân tầng và phân khu", () => {
  it("render thanh sidebar Sider với các phân khu chức năng (Zones)", async () => {
    const { container } = renderSider();

    // Sider tồn tại và có class app-sider
    const sider = container.querySelector(".app-sider");
    expect(sider).toBeInTheDocument();
    // Context khởi tạo mở rộng vẫn không thay đổi rail cố định.
    expect(sider).toHaveClass("ant-layout-sider-collapsed");
    expect(sider).toHaveStyle({ width: "88px" });
    expect(sider?.querySelector(".app-sider__content--compact")).toBeInTheDocument();

    // Các khu vực (Zones) hiển thị theo nhãn bản dịch tiếng Việt mới
    await waitFor(() => {
      expect(screen.getByText("Điều hành")).toBeInTheDocument();
      expect(screen.getByText("Vận tải")).toBeInTheDocument();
      expect(screen.getByText("Đội xe & An toàn")).toBeInTheDocument();
      expect(screen.getByText("Khách hàng & Hàng hóa")).toBeInTheDocument();
      expect(screen.getByText("Hóa đơn & Thu chi")).toBeInTheDocument();
      expect(screen.getByText("Lương & Quyết toán")).toBeInTheDocument();
      expect(screen.getByText("Quản trị")).toBeInTheDocument();
    });
  });

  it("chứa đầy đủ các danh mục khu vực được khai báo trong NAV_ZONES", () => {
    expect(NAV_ZONES.length).toBe(7);
    const zoneKeys = NAV_ZONES.map((z) => z.key);
    expect(zoneKeys).toEqual([
      "zone:operations",
      "zone:transport",
      "zone:fleet",
      "zone:partners",
      "zone:finance",
      "zone:payroll",
      "zone:admin",
    ]);
  });

  it("highlight phân khu hiện tại và mở menu con mà sidebar vẫn thu gọn", async () => {
    const { container } = renderSider("/operations");

    const zone = await screen.findByText("Điều hành");
    expect(zone.closest(".ant-menu-submenu")).toHaveClass("app-sider__zone--active");
    fireEvent.click(zone);

    await waitFor(() => {
      expect(screen.getByText("Trung tâm điều hành")).toBeInTheDocument();
    });
    expect(container.querySelector(".app-sider")).toHaveClass("ant-layout-sider-collapsed");
    expect(container.querySelector(".app-sider")).toHaveStyle({ width: "88px" });
  });

  it("thông báo và tài khoản chỉ xuất hiện trong sidebar, header không còn menu button", async () => {
    const { container } = renderSider("/operations", true);
    expect(container.querySelector(".app-sider .app-sider__content--compact")).toBeInTheDocument();
    expect(container.querySelector(".anticon-menu-unfold")).not.toBeInTheDocument();
    expect(container.querySelector(".app-header button")).not.toBeInTheDocument();
    expect(container.querySelector(".app-header .ant-avatar")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Thông báo" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Thông báo" }).closest(".app-sider__group--utilities")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Menu tài khoản" }));
    expect(await screen.findByText("Đổi công ty")).toBeInTheDocument();
  });

  it("hiển thị mục 'Bến bãi' (Terminal) trong phân khu Vận tải", async () => {
    renderSider("/terminals");

    const transportZone = await screen.findByText("Vận tải");
    expect(transportZone).toBeInTheDocument();
    fireEvent.click(transportZone);

    await waitFor(() => {
      expect(screen.getByText("Bến bãi (Terminals)")).toBeInTheDocument();
    });
  });

  it("chia các phân khu thành các nhóm app-sider__group độc lập", async () => {
    const { container } = renderSider("/terminals");
    await waitFor(() => {
      const groups = container.querySelectorAll(".app-sider__group");
      // Có 3 nhóm việc chính và 1 khối tiện ích
      expect(groups.length).toBe(4);
    });
  });
});
