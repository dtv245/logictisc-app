import { expect, test } from "@playwright/test";

test("Operations search opens by click, Enter, Space and Ctrl+K", async ({ page }) => {
  await page.goto("/e2e/fixtures/dashboard-panels.html");
  const search = page.getByRole("button", { name: "Search loads and drivers", exact: true });
  const dialog = page.getByRole("dialog", { name: "Search LogisticsX" });

  await search.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(search).toBeFocused();

  await search.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");

  await search.press("Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
});

test("Operations brief, map controls and timeline expose keyboard access", async ({ page }) => {
  await page.goto("/e2e/fixtures/dashboard-panels.html");

  const recommendation = page.getByRole("button", { name: "Reroute 5 drivers" });
  await recommendation.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Review dispatch recommendation" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(recommendation).toBeFocused();

  const routeToggle = page.getByRole("button", { name: "Show proposed routes" });
  const paths = page.locator(".leaflet-overlay-pane path");
  await expect(paths).toHaveCount(3);
  await routeToggle.press("Space");
  await expect(paths).toHaveCount(2);

  const timelineBlock = page.getByRole("img", { name: /48117/ });
  await timelineBlock.focus();
  await expect(timelineBlock).toBeFocused();
  await expect(timelineBlock).toHaveAttribute("aria-label", /08:00–09:40/);
});

test("sample/live switch is keyboard operable and static KPI cards are not tab stops", async ({ page }) => {
  await page.goto(`/e2e/fixtures/sider-fixture.html?route=${encodeURIComponent("/operations")}`);
  const modeSwitch = page.getByRole("switch", { name: "Dữ liệu mẫu Operations" });
  await expect(modeSwitch).toHaveAttribute("aria-checked", "false");
  await modeSwitch.focus();
  await modeSwitch.press("Space");
  await expect(modeSwitch).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Đang xem dữ liệu mẫu Operations")).toBeVisible();
  await modeSwitch.press("Space");
  await expect(modeSwitch).toHaveAttribute("aria-checked", "false");

  await page.goto("/e2e/fixtures/dashboard-panels.html");
  await expect(page.locator(".ops-kpi-item")).toHaveCount(6);
  await expect(page.locator(".ops-kpi-strip a, .ops-kpi-strip button")).toHaveCount(0);
});

test("dashboard focus-visible style is present for keyboard controls", async ({ page }) => {
  await page.goto("/e2e/fixtures/dashboard-panels.html");
  const search = page.getByRole("button", { name: "Search loads and drivers", exact: true });
  await page.keyboard.press("Tab");
  await expect(page.locator("button.ops-dashboard-header__pill")).toBeFocused();
  const focusRing = await page.locator(":focus-visible").evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusRing.outlineStyle).toBe("solid");
  expect(focusRing.outlineWidth).toBe("2px");

  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  const searchOutline = await search.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(searchOutline).toBe("solid");
});
