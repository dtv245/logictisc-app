/**
 * Unit tests cho AppSider — Thanh taskbar điều hướng Icon Rail phẳng liên tục.
 */

import { AppSider } from "@components/AppSider";
import { NAV_ZONES } from "@components/appNavigation";
import { canJwtRolesAccess } from "@/providers/permissions/roleMatrix";
import { JWT_ROLES, type JwtRole } from "@/types/roles.types";
import { foundationResourcePageRoutes } from "@/pages/resourceRegistry";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/config/executive.contract";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/api/payroll.api";
import { routes } from "@/constants/routes";
import { initializeAppI18n } from "@locales";
import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockAiFeaturesState = {
  enabled: true,
  isEffectiveEnabled: true,
  isError: false,
};

vi.mock("@/hooks/ai/useAiFeatures", () => ({
  useAiFeatures: () => ({
    enabled: mockAiFeaturesState.enabled,
    isEffectiveEnabled: mockAiFeaturesState.isEffectiveEnabled,
    isLoading: false,
    isError: mockAiFeaturesState.isError,
  }),
}));

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

const mockCanFn = vi.fn(async () => ({ can: true }));
vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return {
    ...actual,
    useCanWithoutCache: () => ({
      can: mockCanFn,
    }),
  };
});

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  mockAiFeaturesState.enabled = true;
  mockAiFeaturesState.isEffectiveEnabled = true;
  mockAiFeaturesState.isError = false;
  mockCanFn.mockImplementation(async () => ({ can: true }));
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

describe("AppSider — Thanh Icon Rail điều hướng liên tục", () => {
  it("render thanh sidebar 64px với các route runtime đã hỗ trợ", async () => {
    const { container } = renderSider();

    const sider = container.querySelector(".app-sider");
    expect(sider).toBeInTheDocument();
    expect(sider).toHaveClass("ant-layout-sider-collapsed");
    expect(sider).toHaveStyle({ width: "64px" });
    expect(sider?.querySelector(".app-sider__content--compact")).toBeInTheDocument();

    // Các mục runtime có thể nhận biết bằng tên truy cập của Menu.
    await waitFor(() => {
      expect(screen.getByLabelText("Trung tâm điều hành")).toBeInTheDocument();
      expect(screen.getByLabelText("Đơn hàng (Loads)")).toBeInTheDocument();
      expect(screen.getByLabelText("Bến bãi (Terminals)")).toBeInTheDocument();
      expect(screen.getByLabelText("Khách hàng")).toBeInTheDocument();
      expect(screen.getByLabelText("Hóa đơn & Thu chi")).toBeInTheDocument();
      expect(screen.getByLabelText("Lương & Quyết toán")).toBeInTheDocument();
      expect(screen.getByLabelText("Tài xế")).toBeInTheDocument();
      expect(screen.getByLabelText("Hồ sơ & tài liệu")).toBeInTheDocument();
    });
  });

  it("không đưa các route chưa đăng ký vào navigation", () => {
    const routesInNavigation = NAV_ZONES.flatMap((entry) =>
      "items" in entry ? entry.items.map((item) => item.route) : [entry.route],
    );

    expect(routesInNavigation).toContain(routes.tmsFlow.dispatch);
    expect(routesInNavigation).not.toContain(routes.resources.loads.list);
    expect(routesInNavigation).toContain(routes.resources.trips.list);
    expect(routesInNavigation).not.toContain(routes.resources.loadBoard.list);
    expect(routesInNavigation).not.toContain(routes.resources.accidents.list);
    expect(routesInNavigation).not.toContain(routes.resources.containers.list);
    expect(routesInNavigation).not.toContain(routes.resources.maintenance.list);
    expect(routesInNavigation).not.toContain(routes.resources.hosEld.list);
    expect(routesInNavigation).not.toContain(routes.resources.dvir.list);
    expect(routesInNavigation).not.toContain(routes.resources.products.list);
    expect(routesInNavigation).not.toContain(routes.resources.expenses.list);
  });

  it("mọi mục điều hướng hiện tại đều có route được AppRouter mount", () => {
    const mountedRoutes = new Set([
      ...foundationResourcePageRoutes.map(({ path }) => path),
      routes.operations,
      routes.tmsFlow.root,
      routes.tmsFlow.dispatch,
      routes.tmsFlow.approvals,
      ...(EXECUTIVE_CONTRACT_CONFIRMED ? [routes.dashboard] : []),
      routes.aiDispatch,
      routes.optimization,
      routes.fleetReport,
      routes.profitability,
      routes.resources.settlements.list,
      routes.resources.settlements.policies,
      routes.payroll,
      routes.myPayslips,
      ...(PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED ? [routes.payrollReconciliation] : []),
    ]);
    const navRoutes = NAV_ZONES.flatMap((entry) =>
      "items" in entry ? entry.items.map((item) => item.route) : [entry.route],
    );

    expect(navRoutes.filter((route) => !mountedRoutes.has(route)).sort()).toEqual([]);
  });

  it("highlight route hiện tại mà sidebar vẫn thu gọn", async () => {
    const { container } = renderSider("/operations");

    await screen.findByLabelText("Trung tâm điều hành");
    expect(container.querySelector('[data-menu-id$="app:operations"]')).toHaveClass("app-sider__zone--active");
    expect(container.querySelector(".app-sider")).toHaveClass("ant-layout-sider-collapsed");
    expect(container.querySelector(".app-sider")).toHaveStyle({ width: "64px" });
  });

  it("thông báo nằm trong app-sider__notifications, avatar mở menu tài khoản và không còn nút đăng xuất riêng ngoài rail", async () => {
    const { container } = renderSider("/operations", true);
    expect(container.querySelector(".app-sider .app-sider__content--compact")).toBeInTheDocument();
    expect(container.querySelector(".anticon-menu-unfold")).not.toBeInTheDocument();
    expect(container.querySelector(".app-header button")).not.toBeInTheDocument();
    expect(container.querySelector(".app-header .ant-avatar")).not.toBeInTheDocument();

    // Nút Thông báo nằm trong .app-sider__notifications
    const notifBtn = screen.getByRole("button", { name: "Thông báo" });
    expect(notifBtn).toBeInTheDocument();
    expect(notifBtn.closest(".app-sider__notifications")).not.toBeNull();

    // Không còn nút đăng xuất riêng ở ngoài rail (chỉ có trong dropdown avatar)
    expect(screen.queryByRole("button", { name: "Đăng xuất" })).toBeNull();

    // Avatar nhấp mở dropdown Đổi công ty và Đăng xuất
    fireEvent.click(screen.getByRole("button", { name: "Menu tài khoản" }));
    expect(await screen.findByText("Đổi công ty")).toBeInTheDocument();
    expect(await screen.findByText("Đăng xuất")).toBeInTheDocument();
  });

  it("hiển thị mục Bến bãi khi route đã được đăng ký", async () => {
    renderSider("/terminals");
    expect(await screen.findByLabelText("Bến bãi (Terminals)")).toBeInTheDocument();
  });

  it("không còn bất kỳ phần tử app-sider__group nào và chỉ có 1 Menu cho các khu vực chính", async () => {
    const { container } = renderSider("/operations");
    await waitFor(() => {
      expect(screen.getByLabelText("Trung tâm điều hành")).toBeInTheDocument();
    });

    // Hoàn toàn không còn class thẻ nhóm .app-sider__group
    const groups = container.querySelectorAll(".app-sider__group");
    expect(groups.length).toBe(0);

    // Cột navigation chứa đúng 1 phần tử Menu Ant Design cho các khu vực chính
    const navMenus = container.querySelectorAll(".app-sider__navigation .ant-menu");
    expect(navMenus.length).toBe(1);
  });

  it("đánh dấu khu vực chứa route hiện tại kể cả route con như /loads/edit/:id", async () => {
    renderSider("/loads/edit/48291");
    await screen.findByLabelText("Đơn hàng (Loads)");
    expect(document.querySelector('[data-menu-id$="res:loads"]')).toHaveClass("app-sider__zone--active");
  });

  it("mỗi icon khu vực có tên truy cập (aria-label) cho trợ năng", async () => {
    const { container } = renderSider("/operations");
    await waitFor(() => {
      expect(screen.getByLabelText("Trung tâm điều hành")).toBeInTheDocument();
    });

    const iconWrappers = container.querySelectorAll(".app-sider__icon-wrapper");
    expect(iconWrappers.length).toBeGreaterThan(0);
    iconWrappers.forEach((el) => {
      expect(el).toHaveAttribute("aria-label");
      expect(el.getAttribute("aria-label")).not.toBe("");
    });
  });

  it("nút agent AI chỉ render khi tính năng khả dụng và khi nhấp dispatch CustomEvent 'toggle-ai-gap-chat'", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { container, rerender } = renderSider("/operations");

    await waitFor(() => {
      const aiBtn = container.querySelector('[data-testid="app-sider-ai-agent-button"]');
      expect(aiBtn).toBeInTheDocument();
    });

    const aiButton = screen.getByTestId("app-sider-ai-agent-button");
    fireEvent.click(aiButton);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "toggle-ai-gap-chat" }));

    // Khi tính năng AI tắt và không ở dev: nút không được render
    mockAiFeaturesState.enabled = false;
    mockAiFeaturesState.isEffectiveEnabled = false;
    mockAiFeaturesState.isError = true;

    rerender(
      <MemoryRouter initialEntries={["/operations"]}>
        <I18nextProvider i18n={i18n}>
          <ThemedLayoutContextProvider initialSiderCollapsed={false}>
            <AppSider />
          </ThemedLayoutContextProvider>
        </I18nextProvider>
      </MemoryRouter>,
    );

    // Nút không hiển thị khi tính năng bị vô hiệu hoá
    expect(screen.queryByTestId("app-sider-ai-agent-button")).toBeNull();
    dispatchSpy.mockRestore();
  });

  it("khu vực bị từ chối quyền truy cập sẽ tự động ẩn khỏi thanh điều hướng", async () => {
    mockCanFn.mockImplementation(async (perm?: { resource?: string }) => {
      // Chặn toàn bộ quyền truy cập vào khu vực admin (drivers, documents)
      if (perm?.resource === "drivers" || perm?.resource === "documents") {
        return { can: false };
      }
      return { can: true };
    });

    renderSider("/operations");
    await waitFor(() => {
      expect(screen.getByLabelText("Trung tâm điều hành")).toBeInTheDocument();
    });

    expect(screen.queryByText("Quản trị")).toBeNull();
    expect(screen.queryByLabelText("Tài xế")).toBeNull();
    expect(screen.queryByLabelText("Hồ sơ & tài liệu")).toBeNull();
  });

  it.each(JWT_ROLES)("applies role-matrix visibility to every rail zone for %s", async (role: JwtRole) => {
    mockCanFn.mockImplementation(async (permission?: { resource?: string; action?: string }) => ({ can: canJwtRolesAccess([role], permission?.resource, permission?.action || "list") }));
    const { container } = renderSider();
    await screen.findByLabelText("Trung tâm điều hành");
    await waitFor(() => {
      for (const zone of NAV_ZONES) {
        const items = "items" in zone ? zone.items : [zone];
        const expectedVisible = items.some((item) => {
          if (item.permission) {
            return canJwtRolesAccess([role], item.permission.resource, item.permission.action);
          }
          return item.resource
            ? canJwtRolesAccess([role], item.resource, "list")
            : true;
        });
        const node = container.querySelector(`[data-menu-id$="${zone.key}"]`);
        expect(Boolean(node), `${role}: ${zone.key}`).toBe(expectedVisible);
      }
    });
  });

  it("keeps other permitted entries when one permission lookup rejects", async () => {
    mockCanFn.mockImplementation(async (permission?: { resource?: string }) => {
      if (permission?.resource === "documents") throw new Error("permission lookup unavailable");
      return { can: true };
    });
    renderSider();
    expect(await screen.findByLabelText("Khách hàng")).toBeInTheDocument();
    expect(screen.getByLabelText("Tài xế")).toBeInTheDocument();
    expect(screen.queryByLabelText("Hồ sơ & tài liệu")).not.toBeInTheDocument();
  });
});
