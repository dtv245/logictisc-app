import { test } from "@playwright/test";
import path from "node:path";

const targetDir = process.env.SCREENSHOT_DIR || "sider-before-2";

const pagesToTest = [
  { name: "dashboard", route: "/operations" },
  { name: "loads-list", route: "/loads" },
  { name: "load-show", route: "/loads/show/101" },
  { name: "trips-list", route: "/trips" },
];

test("Capture Sider screenshots across 4 pages, viewports and states", async ({ page }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

  for (const p of pagesToTest) {
    // 1. Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2e/fixtures/sider-fixture.html?route=${encodeURIComponent(p.route)}`);
    await page.waitForSelector(".app-sider", { timeout: 15000 });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(process.cwd(), `docs/design/${targetDir}/${p.name}-desktop-1440.png`),
      fullPage: true,
    });

    // 2. Tablet 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(process.cwd(), `docs/design/${targetDir}/${p.name}-tablet-1024.png`),
      fullPage: true,
    });

    // 3. Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(process.cwd(), `docs/design/${targetDir}/${p.name}-mobile-390.png`),
      fullPage: true,
    });
  }

  // 4. Desktop Flyout Open state
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/e2e/fixtures/sider-fixture.html?route=/loads");
  await page.waitForSelector(".app-sider", { timeout: 15000 });
  await page.waitForTimeout(500);

  // Click on transport zone icon to open flyout menu
  const transportIcon = page.locator(".ant-menu-submenu-title").nth(1);
  if (await transportIcon.isVisible()) {
    await transportIcon.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(process.cwd(), `docs/design/${targetDir}/flyout-open-1440.png`),
      fullPage: false,
    });
  }

  // 5. Short Viewport state (550px height) to verify independent scrolling while footer is pinned
  await page.setViewportSize({ width: 1440, height: 550 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(process.cwd(), `docs/design/${targetDir}/scroll-short-viewport-1440.png`),
    fullPage: false,
  });
});
