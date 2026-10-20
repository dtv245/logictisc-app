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

test("reduced motion still opens and closes Ant Design overlays promptly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/e2e/fixtures/reduced-motion-overlays.html");
  const openAndClose = async (triggerName: string, overlayName: string, closeBy: "escape" | "trigger" | "close-button", role: "dialog" | "menu" | "popover" = "dialog") => {
    const trigger = page.getByRole("button", { name: triggerName });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const overlay = role === "popover"
      ? page.locator(".ant-popover").filter({ hasText: overlayName })
      : role === "menu"
        ? page.getByRole("menu")
        : page.getByRole("dialog", { name: overlayName });
    await expect(overlay).toBeVisible({ timeout: 1000 });
    if (closeBy === "escape") await page.keyboard.press("Escape");
    if (closeBy === "trigger") await trigger.click();
    if (closeBy === "close-button") await page.getByRole("button", { name: "Close" }).last().click();
    await expect(overlay).toBeHidden({ timeout: 1000 });
  };

  await openAndClose("Open modal", "Modal fixture", "close-button");
  await openAndClose("Open drawer", "Drawer fixture", "close-button");
  await openAndClose("Open popover", "Popover fixture", "trigger", "popover");
  await openAndClose("Open dropdown", "Dropdown item", "escape", "menu");

  const select = page.getByRole("combobox", { name: "Select fixture" });
  await select.click();
  const selectOptions = page.locator(".ant-select-dropdown:visible");
  await expect(selectOptions).toHaveCount(1, { timeout: 1000 });
  await page.keyboard.press("Escape");
  await expect(selectOptions).toHaveCount(0, { timeout: 1000 });

  const tooltipTrigger = page.getByRole("button", { name: "Focus tooltip" });
  await tooltipTrigger.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Tooltip fixture", { timeout: 1000 });
  await page.getByRole("textbox", { name: "Move focus away from tooltip" }).focus();
  await expect(page.getByRole("tooltip")).toBeHidden({ timeout: 1000 });

  await expect(page.locator(".ant-spin-spinning")).toBeVisible();
  await expect(page.locator(".ant-skeleton")).toBeVisible();
});
