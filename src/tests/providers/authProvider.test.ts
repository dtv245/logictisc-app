/**
 * Kiểm thử contract Refine AuthProvider cho deep link, 401 và 403.
 */

import { describe, expect, it, vi } from "vitest";

import { createAuthProvider } from "@providers/authProvider";
import { AuthSessionManager } from "@core/auth/sessionManager";
import type {
  AccessTokenVerifier,
  OidcGateway,
} from "@/types/authSession.types";

const createManager = (
  overrides: Partial<OidcGateway> = {},
): {
  readonly manager: AuthSessionManager;
  readonly oidc: OidcGateway;
} => {
  const oidc: OidcGateway = {
    startLogin: vi.fn().mockResolvedValue(undefined),
    completeLogin: vi.fn().mockRejectedValue(new Error("not used")),
    getUser: vi.fn().mockResolvedValue(null),
    renewUser: vi.fn().mockRejectedValue(new Error("not used")),
    removeUser: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
  const tokenVerifier: AccessTokenVerifier = {
    verify: vi.fn().mockRejectedValue(new Error("not used")),
  };

  return {
    oidc,
    manager: new AuthSessionManager({ oidc, tokenVerifier }),
  };
};

describe("createAuthProvider", () => {
  it("preserves the protected deep link through login state", async () => {
    const { manager, oidc } = createManager();
    const provider = createAuthProvider({
      sessions: manager,
      location: {
        getCurrentPath: () => "/trips/42?tab=stops",
      },
    });

    await expect(provider.login({})).resolves.toEqual({
      success: true,
    });
    expect(oidc.startLogin).toHaveBeenCalledWith(
      "/trips/42?tab=stops",
    );
  });

  it("completes the OIDC callback and restores the validated return path", async () => {
    const completeLogin = vi.fn().mockResolvedValue({
      user: {
        accessToken: "token",
        profile: { subject: "user-1", name: "User One" },
      },
      returnTo: "/loads?status=draft",
    });
    const oidc: OidcGateway = {
      startLogin: vi.fn().mockResolvedValue(undefined),
      completeLogin,
      getUser: vi.fn().mockResolvedValue(null),
      renewUser: vi.fn().mockRejectedValue(new Error("not used")),
      removeUser: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(false),
    };
    const manager = new AuthSessionManager({
      oidc,
      tokenVerifier: {
        verify: vi.fn().mockResolvedValue({
          expiresAt: 4_102_444_800,
          subject: "user-1",
          tenantId: "tenant-1",
          roles: ["MANAGER"],
        }),
      },
    });
    const provider = createAuthProvider({
      sessions: manager,
      location: { getCurrentPath: () => "/auth/callback" },
    });

    await expect(provider.login({ mode: "callback" })).resolves.toEqual({
      success: true,
      redirectTo: "/loads?status=draft",
    });
    expect(completeLogin).toHaveBeenCalledOnce();
  });

  it("redirects unauthenticated checks back to the exact deep link", async () => {
    const { manager } = createManager();
    const provider = createAuthProvider({
      sessions: manager,
      location: {
        getCurrentPath: () => "/loads?page=3&status=draft",
      },
    });

    await expect(provider.check()).resolves.toEqual({
      authenticated: false,
      logout: true,
      redirectTo:
        "/login?returnTo=%2Floads%3Fpage%3D3%26status%3Ddraft",
    });
  });

  it("clears and redirects on 401", async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined);
    const { manager } = createManager({ removeUser });
    const provider = createAuthProvider({
      sessions: manager,
      location: {
        getCurrentPath: () => "/invoices/1",
      },
    });

    await expect(
      provider.onError({
        statusCode: 401,
        message: "Unauthorized",
      }),
    ).resolves.toMatchObject({
      logout: true,
      redirectTo: "/login?returnTo=%2Finvoices%2F1",
    });
    expect(removeUser).toHaveBeenCalledOnce();
  });

  it("does not clear, refresh or redirect on 403", async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined);
    const renewUser = vi.fn().mockRejectedValue(new Error("not used"));
    const { manager } = createManager({ removeUser, renewUser });
    const provider = createAuthProvider({
      sessions: manager,
      location: {
        getCurrentPath: () => "/roles",
      },
    });

    const result = await provider.onError({
      response: { status: 403 },
      message: "Forbidden",
    });

    expect(result).toEqual({
      error: expect.any(Error),
    });
    expect(removeUser).not.toHaveBeenCalled();
    expect(renewUser).not.toHaveBeenCalled();
  });

  it("never calls a Spring logout endpoint", async () => {
    const logout = vi.fn().mockResolvedValue(false);
    const { manager } = createManager({ logout });
    const provider = createAuthProvider({
      sessions: manager,
      location: {
        getCurrentPath: () => "/",
      },
    });

    await expect(provider.logout({})).resolves.toEqual({
      success: true,
      redirectTo: "/login",
    });
    expect(logout).toHaveBeenCalledOnce();
  });
});
