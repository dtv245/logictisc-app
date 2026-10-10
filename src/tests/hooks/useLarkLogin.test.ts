import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useLarkLogin } from "@/hooks/useLarkLogin";

const mockMutate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
  }),
}));

describe("useLarkLogin", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockMutate.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("calls login.mutate with redirect mode and optional returnTo", () => {
    const { result } = renderHook(() => useLarkLogin());

    act(() => {
      result.current.startLogin();
    });
    expect(mockMutate).toHaveBeenCalledWith({
      provider: "lark",
      mode: "redirect",
    });

    act(() => {
      result.current.startLogin("/operations");
    });
    expect(mockMutate).toHaveBeenCalledWith({
      provider: "lark",
      mode: "redirect",
      returnTo: "/operations",
    });
  });

  it("calls login.mutate with explicit callback parameters", () => {
    const { result } = renderHook(() => useLarkLogin());

    act(() => {
      result.current.completeLogin({
        code: "test-code",
        state: "test-state",
        returnTo: "/invoices",
      });
    });

    expect(mockMutate).toHaveBeenCalledWith({
      provider: "lark",
      mode: "callback",
      code: "test-code",
      state: "test-state",
      returnTo: "/invoices",
      error: undefined,
      errorDescription: undefined,
    });
  });

  it("extracts callback parameters from window.location.search when none are passed", () => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        search: "?code=auth-code-789&state=auth-state-456&returnTo=%2Floads",
      },
      writable: true,
    });

    const { result } = renderHook(() => useLarkLogin());

    act(() => {
      result.current.completeLogin();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      provider: "lark",
      mode: "callback",
      code: "auth-code-789",
      state: "auth-state-456",
      returnTo: "/loads",
      error: undefined,
      errorDescription: undefined,
    });
  });

  it("extracts error parameters from window.location.search on user cancellation", () => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        search: "?error=access_denied&error_description=User+cancelled",
      },
      writable: true,
    });

    const { result } = renderHook(() => useLarkLogin());

    act(() => {
      result.current.completeLogin();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      provider: "lark",
      mode: "callback",
      code: undefined,
      state: undefined,
      returnTo: undefined,
      error: "access_denied",
      errorDescription: "User cancelled",
    });
  });
});
