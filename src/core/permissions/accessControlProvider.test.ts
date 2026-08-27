/**
 * Kiểm thử Refine AccessControlProvider lấy role từ auth session source.
 */

import { describe, expect, it, vi } from "vitest";

import { createAccessControlProvider } from "./accessControlProvider";

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
    expect(getJwtRoles).toHaveBeenCalledTimes(2);
  });
});
