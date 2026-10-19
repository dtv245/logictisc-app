import { expect, test } from "@playwright/test";

test("matches the reference card layout at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 752, height: 500 });
  await page.goto("/e2e/fixtures/priority-shipment-card.html");
  const card = page.getByRole("region", { name: /Oakland.*Sacramento/ });
  await expect(card).toBeVisible();
  await expect(page.getByText("+47 min vs plan")).toBeVisible();
  await expect.poll(() => page.locator(".priority-shipment__truck").evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  const header = await page.locator(".priority-shipment__header").boundingBox();
  const metrics = await page.locator(".priority-shipment__metrics").boundingBox();
  expect(header).not.toBeNull();
  expect(metrics!.y).toBeLessThan(header!.y + 10);
  await card.screenshot({ path: "docs/design/priority-shipment-card/desktop.png" });
});

test("fits narrow screens and keeps telemetry cards apart", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/e2e/fixtures/priority-shipment-card.html?locale=vi");
    await expect(page.getByText("38 mph · ↓24% trên I-80")).toBeVisible();
    await expect.poll(() => page.locator(".priority-shipment__truck").evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
    const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(viewportFits).toBe(true);
    const boxes = await page.locator(".priority-shipment__callout").evaluateAll((elements) => elements.map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }));
    for (let first = 0; first < boxes.length; first++) {
      for (let second = first + 1; second < boxes.length; second++) {
        const a = boxes[first], b = boxes[second];
        expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
      }
    }
    await page.screenshot({ path: `docs/design/priority-shipment-card/mobile-${width}.png`, fullPage: true });
  }
});
