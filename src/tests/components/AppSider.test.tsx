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

const renderSider = (initialRoute = "/operations") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nextProvider i18n={i18n}>
        <ThemedLayoutContextProvider initialSiderCollapsed={false}>
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

    // Các khu vực (Zones) hiển thị theo nhãn bản dịch tiếng Việt
    await waitFor(() => {
      expect(screen.getByText("Điều hành & Giám sát")).toBeInTheDocument();
      expect(screen.getByText("Vận tải & Hàng hóa")).toBeInTheDocument();
      expect(screen.getByText("Đội xe & Tài xế")).toBeInTheDocument();
      expect(screen.getByText("Tài chính & Quyết toán")).toBeInTheDocument();
      expect(screen.getByText("Khách hàng & Đối tác")).toBeInTheDocument();
      expect(screen.getByText("Quản trị & Hệ thống")).toBeInTheDocument();
    });
  });

  it("chứa đầy đủ các danh mục khu vực được khai báo trong NAV_ZONES", () => {
    expect(NAV_ZONES.length).toBe(6);
    const zoneKeys = NAV_ZONES.map((z) => z.key);
    expect(zoneKeys).toEqual([
      "zone:operations",
      "zone:transport",
      "zone:fleet",
      "zone:finance",
      "zone:partners",
      "zone:admin",
    ]);
  });

  it("tự động mở phân khu và highlight chức năng tương ứng với route hiện tại", async () => {
    renderSider("/operations");

    await waitFor(() => {
      // Zone Điều hành & Giám sát được mở và hiển thị Điều phối vận hành
      expect(screen.getByText("Điều phối vận hành")).toBeInTheDocument();
    });
  });

  it("hỗ trợ thu gọn (collapse) và mở rộng (expand) thanh Taskbar", async () => {
    renderSider();

    const toggleBtn = screen.getByRole("button", {
      name: "Thu gọn thanh điều hướng",
    });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Mở rộng thanh điều hướng",
        }),
      ).toBeInTheDocument();
    });
  });
});
