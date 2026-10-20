import { expect, test } from "@playwright/test";

const route = (state: string) => `/e2e/fixtures/sider-fixture.html?route=%2Floads&state=${state}`;

test("Loads list browser fixture separates pending from empty", async ({ page }) => {
  await page.goto(route("loading"));
  await expect(page.locator(".base-table-wrapper--loading")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Chưa có dữ liệu")).toHaveCount(0);

  await page.goto(route("empty"));
  await expect(page.getByText("Chưa có dữ liệu")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Loads list browser fixture shows API failure with retry, never as empty", async ({ page }) => {
  await page.goto(route("error"));
  await expect(page.getByRole("alert")).toContainText("Load list request failed");
  const retry = page.getByRole("button", { name: "Thử lại" });
  await expect(retry).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu")).toHaveCount(0);
  await retry.click();
  await expect(page.getByRole("alert")).toContainText("Load list request failed");
});

test("Loads list browser fixture shows 403 as permission error and recovers after retry", async ({ page }) => {
  await page.goto(route("forbidden"));
  await expect(page.getByRole("alert")).toContainText("không có quyền");
  await expect(page.getByText("Chưa có dữ liệu")).toHaveCount(0);

  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByRole("alert")).toContainText("không có quyền");
});

test("Loads list browser role hides the create action when the role matrix denies it", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-role-fixture.html?role=DRIVER&route=%2Floads");
  await expect(page.locator(".app-content")).toBeVisible();
  await expect(page.locator(".resource-list-toolbar__primary-action button")).toHaveCount(0);
  await expect(page.getByText("Chưa có dữ liệu")).toHaveCount(0);
});

test("Load detail browser fixture shows pending and direct 404 with recovery", async ({ page }) => {
  await page.goto("/e2e/fixtures/sider-fixture.html?route=%2Floads%2Fshow%2F101&state=loading");
  await expect(page.locator(".ant-skeleton, .ant-spin-spinning").first()).toBeVisible({ timeout: 5000 });

  await page.goto("/e2e/fixtures/sider-fixture.html?route=%2Floads%2Fshow%2Fmissing");
  await expect(page.getByRole("alert")).toContainText("Load not found");
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu")).toHaveCount(0);
});
