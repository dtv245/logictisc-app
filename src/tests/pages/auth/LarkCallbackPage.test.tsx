import { initializeAppI18n } from "@locales";
import { App as AntdApp } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LarkCallbackPage } from "@pages/auth/LarkCallbackPage";
import * as larkHook from "@hooks/useLarkLogin";
import type { UseLarkLoginResult } from "@hooks/useLarkLogin";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

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

describe("LarkCallbackPage", () => {
  const completeLoginMock = vi.fn();

  beforeAll(async () => {
    i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
  });

  beforeEach(() => {
    completeLoginMock.mockClear();
  });

  const renderCallback = (initialPath = "/auth/callback") =>
    render(
      <I18nextProvider i18n={i18n}>
        <AntdApp>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/auth/callback" element={<LarkCallbackPage />} />
              <Route path="/login" element={<div>LOGIN_PAGE_MOCK</div>} />
            </Routes>
          </MemoryRouter>
        </AntdApp>
      </I18nextProvider>,
    );

  it("renders loading state on initial mount and triggers completeLogin with query params", () => {
    vi.spyOn(larkHook, "useLarkLogin").mockReturnValue(
      createMockLarkLogin({
        completeLogin: completeLoginMock,
        isLoading: true,
      }),
    );

    renderCallback("/auth/callback?code=sample-code&state=sample-state");

    expect(completeLoginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "sample-code",
        state: "sample-state",
      }),
    );
    expect(screen.getByText(/xác nhận phiên đăng nhập|Verifying your sign-in session/i)).toBeInTheDocument();
  });

  it("renders cancellation warning and back to login button when user cancels on Lark", async () => {
    vi.spyOn(larkHook, "useLarkLogin").mockReturnValue(
      createMockLarkLogin({
        completeLogin: completeLoginMock,
        isLoading: false,
      }),
    );

    renderCallback("/auth/callback?error=access_denied&error_description=User+cancelled+authorization");

    expect(completeLoginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "access_denied",
        errorDescription: "User cancelled authorization",
      }),
    );

    expect(
      screen.getByText(/Sign-in was cancelled|Đã hủy đăng nhập/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("User cancelled authorization"),
    ).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /quay lại|back to sign in/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(screen.getByText("LOGIN_PAGE_MOCK")).toBeInTheDocument();
  });

  it("renders error result and back to login button when server returns 401 or 403", async () => {
    vi.spyOn(larkHook, "useLarkLogin").mockReturnValue(
      createMockLarkLogin({
        completeLogin: completeLoginMock,
        isLoading: false,
        isError: true,
        error: new Error("No active employee mapped to Lark user: unmapped@example.com"),
      }),
    );

    renderCallback("/auth/callback?code=bad-code&state=valid-state");

    expect(screen.getByText(/Không thể hoàn tất đăng nhập|Could not complete sign-in/i)).toBeInTheDocument();
    expect(screen.getByText(/No active employee mapped to Lark user/i)).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /quay lại|back to sign in/i });
    fireEvent.click(backButton);
    expect(screen.getByText("LOGIN_PAGE_MOCK")).toBeInTheDocument();
  });
});
