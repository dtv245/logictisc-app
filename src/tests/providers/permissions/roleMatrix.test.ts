/**
 * Kiểm thử các hàng nhạy cảm của role matrix và hành vi fail-closed.
 */

import { describe, expect, it } from "vitest";

import type { JwtRole } from "@providers/permissions/jwtRoles";
import { canJwtRolesAccess } from "@providers/permissions/roleMatrix";

const can = (
  role: JwtRole,
  resource: string,
  action: string,
): boolean => canJwtRolesAccess([role], resource, action);

describe("canJwtRolesAccess", () => {
  it("limits roles to ADMIN and employee CRUD to ADMIN/DISPATCHER", () => {
    expect(can("OWNER", "roles", "create")).toBe(false);
    expect(can("ADMIN", "roles", "create")).toBe(true);
    expect(can("DISPATCHER", "employees", "create")).toBe(true);
    expect(can("MANAGER", "roles", "list")).toBe(false);
    expect(can("DRIVER", "employees", "list")).toBe(false);
  });

  it("allows backend CORE roles and denies legacy finance aliases", () => {
    expect(can("MANAGER", "customers", "delete")).toBe(false);
    expect(can("DISPATCHER", "customers", "list")).toBe(true);
  });

  it("separates finance read and write roles", () => {
    expect(can("DISPATCHER", "invoices", "show")).toBe(false);
    expect(can("ACCOUNTANT", "invoices", "show")).toBe(true);
    expect(can("DISPATCHER", "payments", "create")).toBe(false);
    expect(can("MANAGER", "payments", "update")).toBe(false);
    expect(can("ACCOUNTANT", "payments", "update")).toBe(true);
    expect(can("ADMIN", "payments", "delete")).toBe(false);
    expect(can("DRIVER", "invoices", "list")).toBe(false);
  });

  it("restricts CORE and execution grants to their exact backend roles", () => {
    expect(can("DRIVER", "loads", "show")).toBe(false);
    expect(can("ACCOUNTANT", "loads", "show")).toBe(true);
    expect(can("ACCOUNTANT", "trips", "list")).toBe(false);
    expect(can("DRIVER", "trips", "list")).toBe(false);
    expect(can("DRIVER", "loads", "pickup")).toBe(false);
    expect(can("DRIVER", "loads", "deliver")).toBe(false);
  });

  it("denies DRIVER mutations and transitions reserved for dispatch roles", () => {
    expect(can("DRIVER", "loads", "dispatch")).toBe(false);
    expect(can("DRIVER", "trips", "complete")).toBe(false);
    expect(can("DISPATCHER", "trips", "complete")).toBe(true);
    expect(can("SUPERADMIN", "loads", "complete")).toBe(false);
  });

  it("applies document, truck and driver-view boundaries", () => {
    expect(can("DRIVER", "documents", "upload")).toBe(false);
    expect(can("DISPATCHER", "documents", "read")).toBe(true);
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
    expect(can("DRIVER", "inspections", "create")).toBe(false);
    expect(can("ADMIN", "inspections", "create")).toBe(true);
    expect(can("DRIVER", "messages", "send")).toBe(true);
    expect(
      can("DRIVER", "notifications", "mark-all-read"),
    ).toBe(true);
  });

  it("denies legacy authorities finance access without a backend grant", () => {
    expect(can("SUPERADMIN", "settlements", "list")).toBe(false);
    expect(can("OWNER", "settlements", "SETTLEMENT_CALCULATE")).toBe(false);
    expect(can("MANAGER", "payroll", "PAYROLL_VIEW")).toBe(false);
    expect(can("DISPATCHER", "settlements", "list")).toBe(false);
    expect(can("DRIVER", "settlements", "list")).toBe(false);
  });

  it("fails closed for unknown resource/action even for SUPERADMIN", () => {
    expect(can("SUPERADMIN", "dashboard", "list")).toBe(false);
    expect(can("SUPERADMIN", "loads", "invented-action")).toBe(false);
    expect(canJwtRolesAccess([], "loads", "list")).toBe(false);
  });
});
