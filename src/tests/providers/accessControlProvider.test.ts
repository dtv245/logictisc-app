/**
 * Kiểm thử Refine AccessControlProvider lấy role từ auth session source.
 */

import { describe, expect, it, vi } from "vitest";

import { createAccessControlProvider } from "@providers/accessControlProvider";

describe("createAccessControlProvider", () => {
  it("delegates permission checks to the role matrix", async () => {
    const getJwtRoles = vi.fn().mockResolvedValue(["DISPATCHER"] as const);
    const provider = createAccessControlProvider({ getJwtRoles });

    await expect(
      provider.can({ resource: "loads", action: "list" }),
    ).resolves.toEqual({ can: true });
    await expect(
      provider.can({ resource: "roles", action: "list" }),
    ).resolves.toEqual({
      can: false,
      reason: "authorization.forbidden",
    });
    await expect(
      provider.can({ resource: "dashboard", action: "list" }),
    ).resolves.toEqual({ can: true });
    expect(getJwtRoles).toHaveBeenCalledTimes(3);
  });

  it("denies all resource access when the user has no roles (unauthenticated)", async () => {
    const getJwtRoles = vi.fn().mockResolvedValue([]);
    const provider = createAccessControlProvider({ getJwtRoles });

    // Dashboard requires at least one role (authenticated check).
    await expect(
      provider.can({ resource: "dashboard", action: "list" }),
    ).resolves.toEqual({
      can: false,
      reason: "authorization.forbidden",
    });

    // Business resources also denied.
    await expect(
      provider.can({ resource: "loads", action: "list" }),
    ).resolves.toEqual({
      can: false,
      reason: "authorization.forbidden",
    });
  });

  it("denies access to unknown resources even for privileged roles", async () => {
    const getJwtRoles = vi
      .fn()
      .mockResolvedValue(["SUPERADMIN"] as const);
    const provider = createAccessControlProvider({ getJwtRoles });

    await expect(
      provider.can({ resource: "unknown-module", action: "list" }),
    ).resolves.toEqual({
      can: false,
      reason: "authorization.forbidden",
    });
  });

  it("queries roles exactly once per can() call", async () => {
    const getJwtRoles = vi
      .fn()
      .mockResolvedValue(["MANAGER"] as const);
    const provider = createAccessControlProvider({ getJwtRoles });

    await provider.can({ resource: "customers", action: "create" });
    await provider.can({ resource: "invoices", action: "list" });

    expect(getJwtRoles).toHaveBeenCalledTimes(2);
  });
});
