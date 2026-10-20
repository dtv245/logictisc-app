import { expect, test } from "@playwright/test";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";
import { JWT_ROLES } from "../src/types/roles.types";

const screenshotPath = (file: string) =>
  path.join(process.cwd(), "docs/design/shell-001", file);

test("renders and captures each distinct role-matrix sider variant", async ({ page }) => {
  const capturedMenus = new Set<string>();
  for (const role of JWT_ROLES) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2e/fixtures/sider-role-fixture.html?role=${role}&route=%2Foperations`);
    await expect(page.locator(".app-sider")).toBeVisible();
    await expect(page.getByLabel("Trung tâm điều hành")).toBeVisible();

    if (role === "ADMIN") {
      await expect(page.getByLabel("Đơn hàng (Loads)")).toBeVisible();
      await expect(page.getByLabel("Nhân viên")).toBeVisible();
      await expect(page.getByLabel("Hồ sơ & tài liệu")).toBeVisible();
    } else if (role === "DRIVER") {
      await expect(page.getByLabel("Bến bãi (Terminals)")).toBeVisible();
      await expect(page.getByLabel("Đơn hàng (Loads)")).toHaveCount(0);
      await expect(page.getByLabel("Nhân viên")).toHaveCount(0);
      await expect(page.getByLabel("Hồ sơ & tài liệu")).toHaveCount(0);
    }

    const expectedMenus = await page.evaluate(() => (window as Window & { __roleMenuExpectation?: Array<{ key: string; visible: boolean }> }).__roleMenuExpectation ?? []);
    for (const item of expectedMenus) {
      const selector = `[data-menu-id$="${item.key}"]`;
      if (item.visible) await expect(page.locator(selector), `${role}: ${item.key} should be visible`).toHaveCount(1);
      else await expect(page.locator(selector), `${role}: ${item.key} should be hidden`).toHaveCount(0);
    }

    await expectNoRawTranslationKeys(page);
    const menuSignature = await page.locator(".app-sider [data-menu-id]").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-menu-id")).filter(Boolean).sort().join("|"),
    );
    if (!capturedMenus.has(menuSignature)) {
      capturedMenus.add(menuSignature);
      await page.screenshot({ path: screenshotPath(`${role.toLowerCase()}-1440.png`), fullPage: true });
    }
  }
  expect(capturedMenus.size, "at least Dispatcher, Finance and restricted roles should produce distinct menu shapes").toBeGreaterThanOrEqual(3);
});

test("moves through the collapsed navigation rail with arrow keys", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=ADMIN&route=%2Foperations");
  const items = page.locator(".app-sider__navigation .ant-menu [role='menuitem']");
  expect(await items.count()).toBeGreaterThan(1);
  await items.first().focus();
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items.nth(1)).toBeFocused();
});
