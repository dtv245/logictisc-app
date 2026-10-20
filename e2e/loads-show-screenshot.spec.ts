import { expect, test } from "@playwright/test";
import path from "node:path";

const targetDir = process.env.SCREENSHOT_DIR || "after";

test("captures the Load detail fixture without horizontal overflow at release viewports", async ({ page }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

  await page.goto("/e2e/fixtures/loads-show-fixture.html");

  // Wait specifically for our hero card
  await page.waitForSelector('[data-testid="shipment-hero-card"]', { timeout: 15000 });
  await page.waitForTimeout(800);

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({
      path: path.join(process.cwd(), `docs/design/${targetDir}/load-detail-${width}.png`),
      fullPage: true,
    });
  }
});
