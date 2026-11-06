import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";
import { JWT_ROLES } from "../src/types/roles.types";
import { canJwtRolesAccess } from "../src/providers/permissions/roleMatrix";

const screenshotPath = (file: string) =>
  path.join(process.cwd(), "docs/design/shell-001-followup", file);

test("renders and captures each distinct role-matrix sider variant", async ({ page }) => {
  fs.mkdirSync(path.dirname(screenshotPath("placeholder.png")), { recursive: true });
  const capturedMenus = new Set<string>();
  for (const role of JWT_ROLES) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2e/fixtures/sider-role-fixture.html?role=${role}&route=%2Foperations`);
    await expect(page.locator(".app-sider")).toBeVisible();
    await expect(page.getByLabel("Trung tâm điều hành")).toHaveCount(0);

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

    await expect(page.getByTestId("sider-fixture-content")).toBeVisible();

    await expectNoRawTranslationKeys(page);
    const accessibleMenuSignature = await page.locator(".app-sider__menu [role='menuitem']").evaluateAll((elements) =>
      elements.map((element) => {
        const labelledChild = element.querySelector<HTMLElement>("[aria-label]")?.getAttribute("aria-label");
        return element.getAttribute("aria-label") ?? element.getAttribute("title") ?? labelledChild ?? element.textContent?.trim() ?? "";
      }).filter(Boolean).sort().join("|"),
    );
    const signature = accessibleMenuSignature;
    if (!capturedMenus.has(signature)) {
      capturedMenus.add(signature);
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
