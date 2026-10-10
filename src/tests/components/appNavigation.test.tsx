/**
 * Hợp đồng điều hướng cấp ứng dụng.
 *
 * `useMenu` của Refine chỉ sinh mục từ `<Refine resources>`, nên hai màn hình
 * dashboard được khai báo tay trong `APP_NAV_ITEMS`. Khai báo tay thì có một
 * cách hỏng rất khó thấy: thêm mục menu trỏ tới một path không có `<Route>` nào
 * phục vụ. Select vẫn hiện đầy đủ, người dùng chọn, và trang trắng.
 *
 * Test này chốt ba điều: mọi đích đến đều là hằng số route thật, các khoá
 * không trùng nhau, và mỗi mục có nhãn dịch được ở cả `vi` lẫn `en`.
 */

import { APP_NAV_ITEMS, visibleAppNavItems } from "@components/appNavigation";
import { routes } from "@constants/routes";
import { enMessages, viMessages } from "@locales";
import { describe, expect, it } from "vitest";
import { createAccessControlProvider } from "@providers/accessControlProvider";
import { normalizeJwtRoles } from "@providers/permissions/jwtRoles";

/** Các route cấp ứng dụng (không phải resource) mà router thật sự khai báo. */
const APP_ROUTES: readonly string[] = [
  routes.callback,
  routes.dashboard,
  routes.diagnostics,
  routes.forbidden,
  routes.login,
  routes.operations,
  routes.profile,
  routes.profitability,
  routes.payroll,
  routes.optimization,
  routes.fleetReport,
  routes.myPayslips,
  routes.selectTenant,
  routes.resources.settlements.list,
  routes.resources.settlements.policies,
];

const lookup = (messages: unknown, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      messages,
    );

describe("điều hướng cấp ứng dụng", () => {
  it("does not expose the backend-blocked Profile route in application navigation", () => {
    expect(APP_NAV_ITEMS.some((item) => item.route === routes.profile)).toBe(false);
  });
  it.each(["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER", "SUPERADMIN", "OWNER", "MANAGER", "DISPATCHER", "DRIVER", "UNKNOWN"])(
    "shows finance navigation only with backend capabilities for %s", async (authority) => {
      const provider = createAccessControlProvider({ getJwtRoles: async () => normalizeJwtRoles(null, [authority]) });
      const allowed = new Set<string>();
      for (const item of APP_NAV_ITEMS) {
        if (item.permission && (await provider.can(item.permission)).can) allowed.add(item.key);
      }
      const targets = visibleAppNavItems(allowed).map((item) => item.route);
      const finance = ["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"].includes(authority);
      expect(targets.includes(routes.resources.settlements.list)).toBe(finance);
      expect(targets.includes(routes.profitability)).toBe(finance);
      expect(targets.includes(routes.payroll)).toBe(finance);
      expect(targets.includes(routes.optimization)).toBe(["ADMIN", "DISPATCHER"].includes(authority));
      expect(targets.includes(routes.fleetReport)).toBe(finance);
      expect(targets.includes(routes.resources.settlements.policies)).toBe(finance);
      expect(targets).not.toContain(routes.dashboard);
      expect(targets).toContain(routes.operations);
      expect(targets.includes(routes.myPayslips)).toBe(authority !== "UNKNOWN");
    },
  );
  it("mọi mục menu đều trỏ tới một route có thật", () => {
    const dangling = APP_NAV_ITEMS.filter(
      (item) => !APP_ROUTES.includes(item.route),
    ).map((item) => `${item.labelKey} → ${item.route}`);

    expect(dangling).toEqual([]);
  });

  it("khoá và đích đến không trùng nhau", () => {
    const keys = APP_NAV_ITEMS.map((item) => item.key);
    const targets = APP_NAV_ITEMS.map((item) => item.route);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("keeps Operations enabled while the Executive contract is blocked", () => {
    const targets = APP_NAV_ITEMS.map((item) => item.route);

    expect(targets).not.toContain(routes.dashboard);
    expect(targets).toContain(routes.operations);
  });

  it("nhãn menu dịch được ở cả vi và en", () => {
    const missing = APP_NAV_ITEMS.flatMap((item) =>
      [viMessages, enMessages]
        .map((messages, index) =>
          typeof lookup(messages, item.labelKey) === "string"
            ? null
            : `${item.labelKey} (${index === 0 ? "vi" : "en"})`,
        )
        .filter((entry): entry is string => entry !== null),
    );

    expect(missing).toEqual([]);
  });
});
