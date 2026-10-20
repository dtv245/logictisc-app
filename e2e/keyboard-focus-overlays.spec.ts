import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectModalKeyboardFlow(page: Page, trigger: Locator, overlay: Locator, openKey: "Enter" | "Space" = "Enter") {
  await trigger.focus();
  await page.keyboard.press(openKey);
  await expect(overlay).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest(".ant-modal, .ant-drawer")))).toBe(true);

  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest(".ant-modal, .ant-drawer")))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest(".ant-modal, .ant-drawer")))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
}

test("Load list create modal opens by Enter, traps focus, closes by Escape and restores its trigger", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-fixture.html?route=%2Floads");
  const trigger = page.locator(".resource-list-toolbar__primary-action button");
  const modal = page.locator(".resource-form-modal:visible");
  await expect(trigger).toBeVisible();
  await expectModalKeyboardFlow(page, trigger, modal);
});

test("AI Dispatch approval modal supports keyboard focus, Escape and focus restoration", async ({ page }) => {
  await page.goto("/e2e/fixtures/keyboard-focus.html");
  const trigger = page.getByTestId("btn-approve-movement-plan");
  await expectModalKeyboardFlow(page, trigger, page.locator(".ant-modal:visible"), "Space");
});

test("Optimization confirmation modal supports keyboard focus, Escape and focus restoration", async ({ page }) => {
  await page.goto("/e2e/fixtures/keyboard-focus.html");
  const trigger = page.getByRole("button", { name: "Open optimization confirmation" });
  await expectModalKeyboardFlow(page, trigger, page.getByRole("dialog", { name: "Optimization run confirmation" }));
});

test("Optimization candidate drawer supports keyboard focus, Escape and focus restoration", async ({ page }) => {
  await page.goto("/e2e/fixtures/keyboard-focus.html");
  const trigger = page.getByRole("button", { name: "Open optimization candidate drawer" });
  await expectModalKeyboardFlow(page, trigger, page.locator(".ant-drawer-open"));
});

test("Documents detail drawer supports keyboard focus, Escape and focus restoration", async ({ page }) => {
  await page.goto("/e2e/fixtures/keyboard-focus.html");
  const trigger = page.getByRole("button", { name: "Open documents drawer" });
  await expectModalKeyboardFlow(page, trigger, page.getByRole("dialog", { name: "Chi tiết tài liệu" }));
});

test("AI Dispatch run form is keyboard reachable and Enter submits the fixture action", async ({ page }) => {
  await page.goto("/e2e/fixtures/keyboard-focus.html");
  const mode = page.getByRole("combobox", { name: "Chế độ điều phối" });
  await mode.focus();
  await expect(mode).toBeFocused();
  await page.keyboard.press("Tab");

  const loadId = page.getByRole("textbox", { name: /UUID/ });
  await expect(loadId).toBeFocused();
  await loadId.fill("7e5f3922-2200-4c3d-b442-823d6e82b456");
  const submit = page.getByRole("button", { name: "Yêu cầu AI Lập kế hoạch" });
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ai-run-result")).toBeVisible();
});

test("Notification popover opens by keyboard, Escape closes and returns focus", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=ADMIN&route=%2Foperations");
  const trigger = page.locator(".app-sider__notifications button");
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Space");

  const dialog = page.getByRole("dialog", { name: "Thông báo gần đây" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => !document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Xem tất cả thông báo" }).focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Load detail tabs remain keyboard operable; no overlay exists to trap or restore focus", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-fixture.html?route=%2Floads%2Fshow%2F101");
  const timeline = page.getByRole("tab").nth(1);
  await timeline.focus();
  await page.keyboard.press("Enter");
  await expect(timeline).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
  await expect(page.locator(".ant-modal, .ant-drawer")).toHaveCount(0);
});

test("finance rail submenu opens with Enter and Escape restores focus to its trigger", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=ACCOUNTANT&route=%2Foperations");
  const trigger = page.locator(".app-sider .ant-menu-submenu-title").first();
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const submenu = page.locator(".app-sider-popup:visible");
  await expect(submenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(submenu).toBeHidden();
  await expect(trigger).toBeFocused();
});
