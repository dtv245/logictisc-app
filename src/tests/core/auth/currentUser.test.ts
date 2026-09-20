/** Verifies `/api/me` mapping and principal/tenant boundary enforcement. */

import type { LogisticsApiClient } from "@/types/apiClient.types";
import { AuthSessionExpiredError } from "@core/auth/sessionManager";
import { describe, expect, it, vi } from "vitest";

import { createCurrentUserLoader } from "@core/auth/currentUser";

const identity = {
  id: "user-1",
  name: "User One",
  email: "oidc@example.test",
  tenantId: "tenant-1",
  roles: ["MANAGER"] as const,
};

const createClient = (data: unknown): LogisticsApiClient =>
  ({
    instance: {
      get: vi.fn().mockResolvedValue({ data }),
    },
  }) as unknown as LogisticsApiClient;

describe("createCurrentUserLoader", () => {
  it("loads `/api/me` and maps the validated tenant identity", async () => {
    const apiClient = createClient({
      subject: "user-1",
      email: "api@example.test",
      tenantId: "tenant-1",
      roles: ["ROLE_MANAGER"],
      employeeId: "employee-1",
    });
    const clearSession = vi.fn().mockResolvedValue(undefined);
    const load = createCurrentUserLoader({ apiClient, clearSession });

    await expect(load(identity)).resolves.toMatchObject({
      id: "user-1",
      openId: "user-1",
      email: "api@example.test",
      employeeId: "employee-1",
      tenantId: "tenant-1",
      tenantKey: "tenant-1",
      roles: ["MANAGER"],
    });
    expect(apiClient.instance.get).toHaveBeenCalledWith("/api/me");
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("clears the session when `/api/me` crosses the token tenant", async () => {
    const clearSession = vi.fn().mockResolvedValue(undefined);
    const load = createCurrentUserLoader({
      apiClient: createClient({
        subject: "user-1",
        email: null,
        tenantId: "tenant-2",
        roles: ["MANAGER"],
        employeeId: null,
      }),
      clearSession,
    });

    await expect(load(identity)).rejects.toBeInstanceOf(
      AuthSessionExpiredError,
    );
    expect(clearSession).toHaveBeenCalledOnce();
  });
});
