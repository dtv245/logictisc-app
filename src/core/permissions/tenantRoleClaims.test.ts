/**
 * Kiểm thử ranh giới giữa TenantRole claim và JWT route role.
 */

import { describe, expect, it } from "vitest";

import { hasDriverEmployeePermission } from "./tenantRoleClaims";

describe("hasDriverEmployeePermission", () => {
  it("recognizes only the exact business permission used by /api/drivers", () => {
    expect(
      hasDriverEmployeePermission([
        {
          claimType: "permission",
          claimValue: "update_trip_status",
        },
      ]),
    ).toBe(true);

    expect(
      hasDriverEmployeePermission([
        {
          claimType: "role",
          claimValue: "DRIVER",
        },
        {
          claimType: "permission",
          claimValue: "UPDATE_TRIP_STATUS",
        },
      ]),
    ).toBe(false);
  });
});
