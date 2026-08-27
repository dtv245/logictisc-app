/**
 * Kiểm thử contract chuẩn hóa JWT role từ Identity Server.
 */

import { describe, expect, it } from "vitest";

import { normalizeJwtRoles } from "./jwtRoles";

describe("normalizeJwtRoles", () => {
  it("reads role and roles as scalar or list", () => {
    expect(
      normalizeJwtRoles("owner", ["dispatcher", "DRIVER"]),
    ).toEqual(["OWNER", "DISPATCHER", "DRIVER"]);
  });

  it("normalizes Spring prefixes and SUPER_ADMIN alias", () => {
    expect(
      normalizeJwtRoles("ROLE_SUPER_ADMIN", [
        "ROLE_MANAGER",
        "ROLE_DRIVER",
      ]),
    ).toEqual(["SUPERADMIN", "MANAGER", "DRIVER"]);
  });

  it("deduplicates roles and drops blank, non-string or unknown claims", () => {
    expect(
      normalizeJwtRoles(["owner", "OWNER", "", 123], [
        "tenant_admin",
        null,
      ]),
    ).toEqual(["OWNER"]);
  });
});
