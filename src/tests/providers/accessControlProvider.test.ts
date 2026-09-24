/**
 * Kiểm thử Refine AccessControlProvider lấy role từ auth session source.
 */

import { describe, expect, it, vi } from "vitest";

import { createAccessControlProvider } from "@providers/accessControlProvider";

describe("createAccessControlProvider", () => {
  it("delegates permission checks to the role matrix", async () => {
    const getJwtRoles = vi.fn().mockResolvedValue(["DRIVER"] as const);
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
});
