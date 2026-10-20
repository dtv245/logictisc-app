import { expect, test } from "@playwright/test";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";

const screenshotDir = process.env.SCREENSHOT_DIR || "dashboard-panels";
const screenshotPath = (file: string) =>
  path.join(process.cwd(), "docs/design", screenshotDir, file);

type ProbeWindow = Window & { dashboardWebGLCalls?: number };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as ProbeWindow;
    probe.dashboardWebGLCalls = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (/webgl/i.test(kind)) {
        probe.dashboardWebGLCalls = (probe.dashboardWebGLCalls ?? 0) + 1;
        throw new Error("WebGL is deliberately unavailable in this test");
      }
      return Reflect.apply(getContext, this, [kind, ...args]);
    } as typeof getContext;
  });
});

test("renders brief, map and timeline at their reference sizes without WebGL", async ({ page }) => {
  for (const view of ["brief", "map", "timeline"]) {
    await page.setViewportSize({ width: view === "brief" ? 357 : view === "map" ? 359 : 664, height: 500 });
    await page.goto(`/e2e/fixtures/dashboard-panels.html?view=${view}`);
    if (view === "brief") {
      await expect(page.getByText("18 shipments may miss their delivery windows.", { exact: false })).toBeVisible();
      await expect(page.getByRole("button", { name: "Review recommendations" })).toBeVisible();
    } else if (view === "map") {
      await expect(page.locator(".leaflet-marker-icon")).toHaveCount(4);
      await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(3);
      await expect(page.getByRole("button", { name: "Fit vehicles and routes" })).toBeVisible();
      await page.getByRole("button", { name: "Show proposed routes" }).click();
      await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(2);
      await page.getByRole("button", { name: "Show proposed routes" }).click();
      await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(3);
    } else {
      await expect(page.getByText("Marcus Johnson")).toBeVisible();
      await expect(page.getByText("11:58")).toBeVisible();
    }
    expect(await page.evaluate(() => (window as ProbeWindow).dashboardWebGLCalls)).toBe(0);
    await expectNoRawTranslationKeys(page);
    await page.screenshot({ path: screenshotPath(`${view}.png`), fullPage: true });
  }
});

test("fits the dashboard panels at desktop, tablet and narrow mobile widths", async ({ page }) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/e2e/fixtures/dashboard-panels.html");
    await expect(page.getByRole("heading", { name: "Operations brief" })).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const boxes = await page.locator(".ops-grid-area-priority, .ops-grid-area-brief, .ops-grid-area-map, .ops-grid-area-timeline").evaluateAll((nodes) => nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }));
    for (let first = 0; first < boxes.length; first++) for (let second = first + 1; second < boxes.length; second++) {
      const a = boxes[first], b = boxes[second];
      expect(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1).toBe(true);
    }
    expect(await page.evaluate(() => (window as ProbeWindow).dashboardWebGLCalls)).toBe(0);
    await expectNoRawTranslationKeys(page);
    await page.screenshot({ path: screenshotPath(`dashboard-${width}.png`), fullPage: true });
  }
});

test("keeps missing panel data empty", async ({ page }) => {
  await page.goto("/e2e/fixtures/dashboard-panels.html?state=empty");
  await expect(page.getByText("No operations brief available.")).toBeVisible();
  await expect(page.getByText("No driver schedules available.")).toBeVisible();
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  expect(await page.evaluate(() => (window as ProbeWindow).dashboardWebGLCalls)).toBe(0);
});
