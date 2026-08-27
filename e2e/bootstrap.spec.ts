import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const appUrl = "http://127.0.0.1:4173";

const runtimeConfig = {
  apiBaseUrl: appUrl,
  appName: "Logistics TMS",
  defaultLocale: "en",
  environment: "e2e",
  featureFlags: {},
  identityBaseUrl: "https://identity.example.test",
  oauth: {
    audience: "logisticsx.api",
    clientId: "e2e-spa",
    clockSkewSeconds: 60,
    issuer: "https://identity.example.test",
    jwksUri: "https://identity.example.test/jwks",
    postLogoutRedirectUri: `${appUrl}/login`,
    redirectUri: `${appUrl}/auth/callback`,
    scopes: ["openid"],
  },
  requestTimeoutMs: 5_000,
};

const enabledHealth = {
  application: "logicstic",
  database: "enabled",
  profiles: "e2e",
  status: "UP",
};

async function mockRuntimeConfig(page: Page): Promise<void> {
  await page.route("**/runtime-config.json", async (route) => {
    await route.fulfill({
      body: JSON.stringify(runtimeConfig),
      contentType: "application/json",
      status: 200,
    });
  });
}

test("healthy API continues to public diagnostics", async ({
  page,
}) => {
  const observedHeaders: Array<Record<string, string>> = [];
  await mockRuntimeConfig(page);
  await page.route("**/api/health", async (route) => {
    observedHeaders.push(await route.request().allHeaders());
    await route.fulfill({
      body: JSON.stringify(enabledHealth),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page).toHaveURL(`${appUrl}/diagnostics`);
  await expect(
    page.getByRole("heading", {
      name: "System diagnostics",
    }),
  ).toBeVisible();
  await expect(page.getByText("logicstic")).toBeVisible();
  await expect(page.getByText("enabled")).toBeVisible();
  await expect(
    page.getByText(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    ),
  ).toBeVisible();

  expect(observedHeaders.length).toBeGreaterThan(0);
  for (const headers of observedHeaders) {
    expect(headers.authorization).toBeUndefined();
    expect(headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    );
  }
});

test("connection refusal remains recoverable without mounting routes", async ({
  page,
}) => {
  let healthRequestCount = 0;
  await mockRuntimeConfig(page);
  await page.route("**/api/health", async (route) => {
    healthRequestCount += 1;
    await route.abort("connectionrefused");
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "API is unreachable",
    }),
  ).toBeVisible();
  const retry = page.getByRole("button", {
    name: "Try again",
  });
  await expect(retry).toBeEnabled();
  await expect(page).toHaveURL(`${appUrl}/`);

  const requestsBeforeRetry = healthRequestCount;
  await retry.click();
  await expect
    .poll(() => healthRequestCount)
    .toBeGreaterThan(requestsBeforeRetry);
  await expect(
    page.getByRole("heading", {
      name: "API is unreachable",
    }),
  ).toBeVisible();
});

test("database-disabled response keeps business navigation locked", async ({
  page,
}) => {
  await mockRuntimeConfig(page);
  await page.route("**/api/health", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        ...enabledHealth,
        database: "disabled",
        profiles: "nodb",
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Business features are unavailable",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${appUrl}/`);
  await expect(
    page.getByRole("heading", {
      name: "System diagnostics",
    }),
  ).not.toBeVisible();
});
