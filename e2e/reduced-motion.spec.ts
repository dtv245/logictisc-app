import { expect, test } from "@playwright/test";

test("reduces dashboard transitions and animations when requested by the browser", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/e2e/fixtures/dashboard-panels.html");

  const durations = await page.locator(".ops-dashboard-header__search-trigger, .ops-brief-card button, .ops-timeline-block").evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return [...style.transitionDuration.split(","), ...style.animationDuration.split(",")]
      .map((duration) => Number.parseFloat(duration));
  }));

  expect(durations.length).toBeGreaterThan(0);
  expect(durations.flat().every((seconds) => seconds <= 0.0001)).toBe(true);
});

test("reduces navigation rail transitions when motion preference is reduce", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=ADMIN");

  const durations = await page.locator(".app-sider__menu .ant-menu-item, .app-sider__notification-btn").evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return [...style.transitionDuration.split(","), ...style.animationDuration.split(",")]
      .map((duration) => Number.parseFloat(duration));
  }));

  expect(durations.length).toBeGreaterThan(0);
  expect(durations.flat().every((seconds) => seconds <= 0.0001)).toBe(true);
});
