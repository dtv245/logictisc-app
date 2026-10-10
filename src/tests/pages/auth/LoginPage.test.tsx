import { initializeAppI18n } from "@locales";
import { App as AntdApp } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LoginPage } from "@pages/auth/LoginPage";
import * as larkHook from "@hooks/useLarkLogin";
import type { UseLarkLoginResult } from "@hooks/useLarkLogin";

const mockStartLogin = vi.fn();

const createMockLarkLogin = (
  overrides: Partial<UseLarkLoginResult> = {},
): UseLarkLoginResult =>
  ({
    completeLogin: vi.fn(),
    startLogin: vi.fn(),
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: overrides.isError ? "error" : overrides.isLoading ? "loading" : overrides.isSuccess ? "success" : "idle",
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
    isPaused: false,
    data: undefined,
    error: null,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    ...overrides,
  } as unknown as UseLarkLoginResult);

vi.mock("@refinedev/core", () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
  }),
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

describe("LoginPage", () => {
  beforeAll(async () => {
    i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
  });

  it("renders Sign in with Lark button and initiates Lark login on click", () => {
    vi.spyOn(larkHook, "useLarkLogin").mockReturnValue(
      createMockLarkLogin({
        startLogin: mockStartLogin,
      }),
    );

    render(
      <I18nextProvider i18n={i18n}>
        <AntdApp>
          <MemoryRouter initialEntries={["/login?returnTo=%2Floads"]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AntdApp>
      </I18nextProvider>,
    );

    const larkBtn = screen.getByRole("button", { name: /sign in with lark|đăng nhập bằng lark/i });
    expect(larkBtn).toBeInTheDocument();

    const oidcBtn = screen.getByRole("button", { name: /sign in with identity server|đăng nhập với identity server/i });
    expect(oidcBtn).toBeInTheDocument();

    fireEvent.click(larkBtn);
    expect(mockStartLogin).toHaveBeenCalledWith("/loads");
  });
});
