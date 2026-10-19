/**
 * Kiểm tra shell trên mobile, tablet và desktop sau khi chuyển các tiện ích
 * vào sidebar; các thao tác tài khoản vẫn dùng lifecycle xác thực hiện có.
 */
import { AppLayout } from "@components/AppLayout";
import { initializeAppI18n } from "@locales";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  logout: vi.fn(),
  switchTenant: vi.fn(),
  can: vi.fn(async () => ({ can: true })),
}));
vi.mock("@hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { name: "Nguyen Van Admin", email: "admin@logisticsx.com" } }),
}));
vi.mock("@hooks/useSwitchTenant", () => ({
  useSwitchTenant: () => ({ switchTenant: actions.switchTenant, isLoading: false }),
}));
vi.mock("@hooks/useLogoutUser", () => ({
  useLogoutUser: () => ({ logoutUser: actions.logout, isLoading: false }),
}));
vi.mock("@features/notifications/components/NotificationHeaderIcon", () => ({
  NotificationHeaderIcon: () => <button aria-label="Thông báo" />,
}));
vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return { ...actual, useCanWithoutCache: () => ({ can: actions.can }) };
});
vi.mock("@/hooks/ai/useAiFeatures", () => ({
  useAiFeatures: () => ({ enabled: false, isLoading: false, isError: false }),
}));

let i18n: I18nInstance;
beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});
beforeEach(() => {
  actions.logout.mockClear();
  actions.switchTenant.mockClear();
});
const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  act(() => window.dispatchEvent(new Event("resize")));
};
afterEach(() => setViewport(1200));

const renderShell = () => render(
  <MemoryRouter initialEntries={["/operations"]}>
    <I18nextProvider i18n={i18n}><AppLayout /></I18nextProvider>
  </MemoryRouter>,
);

describe("Shell với sidebar chứa thông báo và tài khoản", () => {
  it.each([375, 414, 768, 1024, 1440])("giữ menu, thông báo và tài khoản ở sidebar tại %ipx", async (width) => {
    setViewport(width);
    const { container } = renderShell();
    const sider = container.querySelector(".app-sider") as HTMLElement;
    expect(container.querySelector(".app-shell")).toBeInTheDocument();
    expect(container.querySelector(".ant-layout-header")).not.toBeInTheDocument();
    expect(container.querySelector("#main-content")).toHaveAttribute("role", "main");
    expect(sider.querySelector(".app-sider__content--compact")).toBeInTheDocument();
    expect(within(sider).getByRole("navigation", { name: "Thanh điều hướng" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Thông báo" })).toHaveLength(1);
    expect(within(sider).getByRole("button", { name: "Thông báo" })).toBeInTheDocument();
    expect(await within(sider).findByLabelText("Trung tâm điều hành")).toBeInTheDocument();

    fireEvent.click(within(sider).getByRole("button", { name: "Menu tài khoản" }));
    fireEvent.click(await screen.findByText("Đổi công ty"));
    expect(actions.switchTenant).toHaveBeenCalledTimes(1);
  });

  it("thao tác đăng xuất từ menu tài khoản ở sidebar tiếp tục gọi thao tác đăng xuất hiện có", async () => {
    setViewport(375);
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Menu tài khoản" }));
    fireEvent.click(await screen.findByText("Đăng xuất"));
    expect(actions.logout).toHaveBeenCalledTimes(1);
  });
});
