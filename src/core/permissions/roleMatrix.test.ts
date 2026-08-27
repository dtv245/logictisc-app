/**
 * Kiểm thử các hàng nhạy cảm của role matrix và hành vi fail-closed.
 */

import { describe, expect, it } from "vitest";

import type { JwtRole } from "./jwtRoles";
import { canJwtRolesAccess } from "./roleMatrix";

const can = (
  role: JwtRole,
  resource: string,
  action: string,
): boolean => canJwtRolesAccess([role], resource, action);

describe("canJwtRolesAccess", () => {
  it("limits role and employee CRUD to SUPERADMIN/OWNER", () => {
    expect(can("OWNER", "roles", "create")).toBe(true);
    expect(can("MANAGER", "roles", "list")).toBe(false);
    expect(can("DRIVER", "employees", "list")).toBe(false);
  });

  it("allows MANAGER customer CRUD but denies DISPATCHER", () => {
    expect(can("MANAGER", "customers", "delete")).toBe(true);
    expect(can("DISPATCHER", "customers", "list")).toBe(false);
  });

  it("separates finance read and write roles", () => {
    expect(can("DISPATCHER", "invoices", "show")).toBe(true);
    expect(can("DISPATCHER", "payments", "create")).toBe(false);
    expect(can("MANAGER", "payments", "update")).toBe(true);
    expect(can("DRIVER", "invoices", "list")).toBe(false);
  });

  it("allows every role to read loads/trips and pickup/deliver loads", () => {
    expect(can("DRIVER", "loads", "show")).toBe(true);
    expect(can("DRIVER", "trips", "list")).toBe(true);
    expect(can("DRIVER", "loads", "pickup")).toBe(true);
    expect(can("DRIVER", "loads", "deliver")).toBe(true);
  });

  it("denies DRIVER mutations and transitions reserved for dispatch roles", () => {
    expect(can("DRIVER", "loads", "dispatch")).toBe(false);
    expect(can("DRIVER", "trips", "complete")).toBe(false);
    expect(can("DISPATCHER", "trips", "complete")).toBe(true);
    expect(can("SUPERADMIN", "loads", "complete")).toBe(false);
  });

  it("applies document, truck and driver-view boundaries", () => {
    expect(can("DRIVER", "documents", "upload")).toBe(true);
    expect(can("DRIVER", "documents", "delete")).toBe(false);
    expect(can("DISPATCHER", "trucks", "delete")).toBe(true);
    expect(can("DRIVER", "drivers", "list")).toBe(false);
  });

  it("applies the three terminal policy rows", () => {
    expect(can("DRIVER", "terminals", "show")).toBe(true);
    expect(can("DRIVER", "terminals", "edit")).toBe(false);
    expect(can("DISPATCHER", "terminals", "create")).toBe(true);
    expect(can("DISPATCHER", "terminals", "delete")).toBe(false);
    expect(can("MANAGER", "terminals", "delete")).toBe(true);
  });

  it("allows every role the contracted collaboration and inspection actions", () => {
    expect(can("DRIVER", "inspections", "create")).toBe(true);
    expect(can("DRIVER", "messages", "send")).toBe(true);
    expect(
      can("DRIVER", "notifications", "mark-all-read"),
    ).toBe(true);
  });

  it("fails closed for unknown resource/action even for SUPERADMIN", () => {
    expect(can("SUPERADMIN", "dashboard", "list")).toBe(false);
    expect(can("SUPERADMIN", "loads", "invented-action")).toBe(false);
    expect(canJwtRolesAccess([], "loads", "list")).toBe(false);
  });
});
