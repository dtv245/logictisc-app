import { test } from "@playwright/test";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";

test("Capture Operations ?demo=1 baseline screenshots", async ({ page }) => {
  const targetDir = path.join(process.cwd(), "docs/ux/baseline");

  // 1. Desktop 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/e2e/fixtures/sider-fixture.html?route=" + encodeURIComponent("/operations?demo=1"));
  await page.waitForSelector(".ops-page", { timeout: 15000 });
  await page.waitForTimeout(600);
  await expectNoRawTranslationKeys(page);
  await page.screenshot({
    path: path.join(targetDir, "operations-demo-1440.png"),
    fullPage: true,
  });

  // 2. Tablet 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  await expectNoRawTranslationKeys(page);
  await page.screenshot({
    path: path.join(targetDir, "operations-demo-768.png"),
    fullPage: true,
  });

  // 3. Mobile 390px
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await expectNoRawTranslationKeys(page);
  await page.screenshot({
    path: path.join(targetDir, "operations-demo-390.png"),
    fullPage: true,
  });
});
