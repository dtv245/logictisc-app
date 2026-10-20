import { expect, test } from "@playwright/test";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";

const screenshotPath = (file: string) =>
  path.join(process.cwd(), "docs/design/shell-001", file);

test("renders role-matrix sider variants and captures labeled fixture screenshots", async ({ page }) => {
  for (const role of ["ADMIN", "DRIVER"] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2e/fixtures/sider-role-fixture.html?role=${role}&route=%2Foperations`);
    await expect(page.locator(".app-sider")).toBeVisible();
    await expect(page.getByLabel("Trung tâm điều hành")).toBeVisible();

    if (role === "ADMIN") {
      await expect(page.getByLabel("Đơn hàng (Loads)")).toBeVisible();
      await expect(page.getByLabel("Nhân viên")).toBeVisible();
      await expect(page.getByLabel("Hồ sơ & tài liệu")).toBeVisible();
    } else {
      await expect(page.getByLabel("Bến bãi (Terminals)")).toBeVisible();
      await expect(page.getByLabel("Đơn hàng (Loads)")).toHaveCount(0);
      await expect(page.getByLabel("Nhân viên")).toHaveCount(0);
      await expect(page.getByLabel("Hồ sơ & tài liệu")).toHaveCount(0);
    }

    await expectNoRawTranslationKeys(page);
    await page.screenshot({ path: screenshotPath(`${role.toLowerCase()}-1440.png`), fullPage: true });
  }
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
