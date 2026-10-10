/**
 * Kiểm thử contract chuẩn hóa JWT role từ Identity Server.
 */

import { describe, expect, it } from "vitest";

import { normalizeJwtRoles } from "@providers/permissions/jwtRoles";

describe("normalizeJwtRoles", () => {
  it("reads role and roles as scalar or list", () => {
    expect(
      normalizeJwtRoles("owner", ["dispatcher", "DRIVER"]),
    ).toEqual(["OWNER", "DISPATCHER", "DRIVER"]);
  });

  it("normalizes Spring prefixes but rejects semantic SUPER_ADMIN aliases", () => {
    expect(
      normalizeJwtRoles("ROLE_SUPER_ADMIN", [
        "ROLE_MANAGER",
        "ROLE_DRIVER",
      ]),
    ).toEqual(["MANAGER", "DRIVER"]);
  });

  it("deduplicates roles and drops blank, non-string or unknown claims", () => {
    expect(
      normalizeJwtRoles(["owner", "OWNER", "", 123], [
        "tenant_admin",
        null,
      ]),
    ).toEqual(["OWNER"]);
  });

  it("keeps exact backend finance authorities alongside legacy authorities", () => {
    expect(normalizeJwtRoles("OWNER", [
      "ROLE_ADMIN", "ACCOUNTANT", "ROLE_PAYROLL", "ROLE_PAYROLL_MANAGER",
    ])).toEqual(["OWNER", "ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"]);
  });

  it("does not grant a semantic legacy alias or a fallback role", () => {
    expect(normalizeJwtRoles(null, ["ROLE_ACCOUNTANT"])).toEqual(["ACCOUNTANT"]);
    expect(normalizeJwtRoles(null, ["ROLE_ADMIN"])).toEqual(["ADMIN"]);
    expect(normalizeJwtRoles(null, ["ROLE_UNKNOWN", "EMPLOYEE", "TENANT_ADMIN"])).toEqual([]);
  });
});
