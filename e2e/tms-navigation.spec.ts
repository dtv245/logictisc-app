import { expect, test } from "@playwright/test";
import path from "node:path";

import { canJwtRolesAccess } from "../src/providers/permissions/roleMatrix";
import { JWT_ROLES } from "../src/types/roles.types";

const screenshotPath = (file: string) =>
  path.join(process.cwd(), "docs/design/tms-sider-review", file);

test("shows the five TMS destinations only when the role has the required permissions", async ({ page }) => {
  const capturedMenus = new Set<string>();

  for (const role of JWT_ROLES) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2e/fixtures/sider-role-fixture.html?role=${role}&route=%2Foperations`);
    await expect(page.locator(".app-sider")).toBeVisible();

    const canListLoads = canJwtRolesAccess([role], "loads", "list");
    const tmsItems = [
      ["Tổng quan", canListLoads],
      ["Điều phối", canListLoads],
      ["Duyệt AI", canListLoads && canJwtRolesAccess([role], "ai-dispatch", "AI_DISPATCH_VIEW")],
      ["Theo dõi xe", canListLoads],
      ["Tối ưu tuyến", canJwtRolesAccess([role], "optimization", "OPTIMIZATION_VIEW")],
    ] as const;

    for (const [label, isAllowed] of tmsItems) {
      const item = page.getByLabel(label, { exact: true });
      if (isAllowed) await expect(item, `${role}: ${label} should be visible`).toBeVisible();
      else await expect(item, `${role}: ${label} should be hidden`).toHaveCount(0);
    }

    const signature = await page.locator(".app-sider__menu [role='menuitem']").evaluateAll((items) =>
      items.map((item) => (item as HTMLElement).innerText.trim()).filter(Boolean).sort().join("|"),
    );
    if (!capturedMenus.has(signature)) {
      capturedMenus.add(signature);
      await page.screenshot({ path: screenshotPath(`${role.toLowerCase()}-1440.png`), fullPage: true });
    }
  }

  expect(capturedMenus.size).toBeGreaterThanOrEqual(3);
});

test("closes the mobile drawer after selecting the TMS overview destination", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=ADMIN&route=%2Foperations");

  const trigger = page.getByRole("button", { name: "Thanh điều hướng" });
  const drawer = page.locator(".app-sider-mobile-drawer");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole("menuitem", { name: "Tổng quan" }).click();
  await expect(page.getByTestId("tms-route-placeholder")).toBeVisible();
  await expect(drawer).toBeHidden();
});
