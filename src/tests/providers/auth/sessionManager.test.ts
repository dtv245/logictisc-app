/**
 * Kiểm thử auth bootstrap, proactive refresh và refresh single-flight.
 */

import { describe, expect, it, vi } from "vitest";

import type {
  AccessTokenVerifier,
  OidcGateway,
  OidcUserSnapshot,
} from "@/types/authSession.types";
import {
  AuthSessionExpiredError,
  AuthSessionManager,
} from "@providers/auth/sessionManager";

const createUser = (
  accessToken: string,
  subject = "user-1",
): OidcUserSnapshot => ({
  accessToken,
  profile: {
    subject,
    name: "Dispatch User",
    email: "dispatcher@example.com",
  },
});

const createGateway = (
  overrides: Partial<OidcGateway> = {},
): OidcGateway => ({
  startLogin: vi.fn().mockResolvedValue(undefined),
  completeLogin: vi.fn().mockResolvedValue({
    user: createUser("new-token"),
    returnTo: "/loads",
  }),
  getUser: vi.fn().mockResolvedValue(createUser("current-token")),
  renewUser: vi.fn().mockResolvedValue(createUser("refreshed-token")),
  removeUser: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(false),
  ...overrides,
});

const createVerifier = (): AccessTokenVerifier => ({
  verify: vi.fn(async (accessToken: string) => ({
    expiresAt: accessToken === "current-token" ? 1_030 : 2_000,
    tenantId: "tenant-1",
    subject: "user-1",
    roles: ["DISPATCHER"] as const,
  })),
});

describe("AuthSessionManager", () => {
  it("bootstraps a validated identity from the in-memory OIDC user", async () => {
    const manager = new AuthSessionManager({
      oidc: createGateway(),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
      refreshSkewSeconds: 10,
    });

    await expect(manager.getIdentity()).resolves.toEqual({
      id: "user-1",
      name: "Dispatch User",
      email: "dispatcher@example.com",
      tenantId: "tenant-1",
      roles: ["DISPATCHER"],
    });
  });

  it("uses one refresh request for concurrent callers", async () => {
    let resolveRenew:
      | ((user: OidcUserSnapshot) => void)
      | undefined;
    const renewUser = vi.fn<OidcGateway["renewUser"]>(
      () =>
        new Promise((resolve) => {
          resolveRenew = resolve;
        }),
    );
    const oidc = createGateway({ renewUser });
    const manager = new AuthSessionManager({
      oidc,
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
      refreshSkewSeconds: 60,
    });

    const concurrentTokens = Promise.all([
      manager.getAccessToken(),
      manager.getAccessToken(),
      manager.refreshAccessToken(),
    ]);

    await vi.waitFor(() => {
      expect(renewUser).toHaveBeenCalledTimes(1);
    });
    if (!resolveRenew) {
      throw new Error("TEST_RENEW_RESOLVER_NOT_READY");
    }
    resolveRenew(createUser("refreshed-token"));

    await expect(
      concurrentTokens,
    ).resolves.toEqual([
      "refreshed-token",
      "refreshed-token",
      "refreshed-token",
    ]);
    expect(renewUser).toHaveBeenCalledTimes(1);
  });

  it("clears the session when refresh fails", async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined);
    const oidc = createGateway({
      renewUser: vi.fn().mockRejectedValue(new Error("refresh rejected")),
      removeUser,
    });
    const manager = new AuthSessionManager({
      oidc,
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
    });

    await expect(manager.getAccessToken()).rejects.toBeInstanceOf(
      AuthSessionExpiredError,
    );
    expect(removeUser).toHaveBeenCalledOnce();
    await expect(manager.getIdentity()).resolves.toBeNull();
  });

  it("blocks bootstrap and removes a user with invalid token claims", async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined);
    const oidc = createGateway({ removeUser });
    const tokenVerifier: AccessTokenVerifier = {
      verify: vi.fn().mockRejectedValue(new Error("missing tenant")),
    };
    const manager = new AuthSessionManager({
      oidc,
      tokenVerifier,
      nowEpochSeconds: () => 1_000,
    });

    await expect(manager.bootstrap()).resolves.toBeNull();
    expect(removeUser).toHaveBeenCalledOnce();
  });

  it("rejects an access token subject bound to a different OIDC user", async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined);
    const oidc = createGateway({ removeUser });
    const tokenVerifier: AccessTokenVerifier = {
      verify: vi.fn().mockResolvedValue({
        expiresAt: 2_000,
        tenantId: "tenant-1",
        subject: "different-user",
        roles: ["DISPATCHER"],
      }),
    };
    const manager = new AuthSessionManager({
      oidc,
      tokenVerifier,
      nowEpochSeconds: () => 1_000,
    });

    await expect(manager.bootstrap()).resolves.toBeNull();
    expect(removeUser).toHaveBeenCalledOnce();
  });

  it("notifies subscribers only when principal boundary changes or clears", async () => {
    const manager = new AuthSessionManager({
      oidc: createGateway(),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
      refreshSkewSeconds: 10,
    });
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    await manager.bootstrap();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        identity: expect.objectContaining({ id: "user-1" }),
      }),
    );

    // Token rotation của cùng principal không được xóa query cache.
    await manager.refreshAccessToken();
    expect(listener).toHaveBeenCalledTimes(1);

    await manager.clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    await manager.completeLogin();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("establishes and persists a Lark session with tenant roles and identity", async () => {
    const memoryStore: Record<string, string> = {};
    const storage: Storage = {
      getItem: vi.fn((key: string) => memoryStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        memoryStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete memoryStore[key];
      }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    const manager = new AuthSessionManager({
      oidc: createGateway({ getUser: vi.fn().mockResolvedValue(null) }),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
      storage,
    });

    const session = await manager.establishLarkSession({
      accessToken: "lark-jwt-token-123",
      tokenType: "Bearer",
      expiresIn: 3600,
      subject: "emp-uuid-1",
      email: "lark.user@example.com",
      tenantId: "tenant-99",
      roles: ["DISPATCHER"],
    });

    expect(session.accessToken).toBe("lark-jwt-token-123");
    expect(session.tenantId).toBe("tenant-99");
    expect(session.roles).toEqual(["DISPATCHER"]);
    expect(session.identity).toEqual({
      id: "emp-uuid-1",
      name: "lark.user@example.com",
      email: "lark.user@example.com",
      tenantId: "tenant-99",
      roles: ["DISPATCHER"],
    });

    await expect(manager.getAccessToken()).resolves.toBe("lark-jwt-token-123");
    await expect(manager.getIdentity()).resolves.toMatchObject({
      id: "emp-uuid-1",
      email: "lark.user@example.com",
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      "logistics_lark_session",
      expect.stringContaining("lark-jwt-token-123"),
    );

    // Bootstrap a second manager using the same storage to test session rehydration
    const rehydratedManager = new AuthSessionManager({
      oidc: createGateway({ getUser: vi.fn().mockResolvedValue(null) }),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_500, // 500s later, token still valid (expires at 1000 + 3600 = 4600)
      storage,
    });

    const rehydratedSession = await rehydratedManager.bootstrap();
    expect(rehydratedSession?.accessToken).toBe("lark-jwt-token-123");
    expect(rehydratedSession?.tenantId).toBe("tenant-99");
  });

  it("expires Lark session and clears storage when token is expired", async () => {
    const memoryStore: Record<string, string> = {};
    const storage: Storage = {
      getItem: vi.fn((key: string) => memoryStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        memoryStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete memoryStore[key];
      }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    let currentTime = 1_000;
    const manager = new AuthSessionManager({
      oidc: createGateway({ getUser: vi.fn().mockResolvedValue(null) }),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => currentTime,
      refreshSkewSeconds: 10,
      storage,
    });

    await manager.establishLarkSession({
      accessToken: "lark-jwt-token-exp",
      tokenType: "Bearer",
      expiresIn: 100, // expires at 1100
      subject: "emp-exp",
      email: "exp@example.com",
      tenantId: "tenant-1",
      roles: ["DISPATCHER"],
    });

    // Advance time past expiry
    currentTime = 1_200;

    await expect(manager.refreshAccessToken()).rejects.toThrow(
      AuthSessionExpiredError,
    );
    await expect(manager.getAccessToken()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("logistics_lark_session");
  });

  it("clears storage and session on logout", async () => {
    const memoryStore: Record<string, string> = {};
    const storage: Storage = {
      getItem: vi.fn((key: string) => memoryStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        memoryStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete memoryStore[key];
      }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    const manager = new AuthSessionManager({
      oidc: createGateway({ logout: vi.fn().mockResolvedValue(false) }),
      tokenVerifier: createVerifier(),
      nowEpochSeconds: () => 1_000,
      storage,
    });

    await manager.establishLarkSession({
      accessToken: "lark-jwt-token-logout",
      tokenType: "Bearer",
      expiresIn: 3600,
      subject: "emp-logout",
      email: "logout@example.com",
      tenantId: "tenant-1",
      roles: ["DISPATCHER"],
    });

    await manager.logout();
    await expect(manager.getAccessToken()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("logistics_lark_session");
  });
});
