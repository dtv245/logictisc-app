import { test } from "@playwright/test";
import path from "node:path";

const targetDir = process.env.SCREENSHOT_DIR || "after";

test("Capture LoadShow screenshots", async ({ page }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

  // Set viewport desktop 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/e2e/fixtures/loads-show-fixture.html");

  // Wait specifically for our hero card
  await page.waitForSelector('[data-testid="shipment-hero-card"]', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Chụp desktop 1440px
  await page.screenshot({
    path: path.join(process.cwd(), `docs/design/${targetDir}/desktop-1440.png`),
    fullPage: true,
  });

  // Chụp tablet 1024px
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(process.cwd(), `docs/design/${targetDir}/tablet-1024.png`),
    fullPage: true,
  });

  // Chụp mobile 390px
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(process.cwd(), `docs/design/${targetDir}/mobile-390.png`),
    fullPage: true,
  });
});
