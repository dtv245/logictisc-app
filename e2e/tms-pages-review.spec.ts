import { expect, test, type Page, type Route } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const fixtureHtml = path.join(process.cwd(), "e2e/fixtures/tms-pages-fixture.html");
const screenshotDirectory = path.join(process.cwd(), process.env.SCREENSHOT_DIR || "docs/design/tms-pages-review");

const now = Date.now();
const loadId = "55a0f59a-274f-48ef-862c-5f53d1ff9eaf";
const truckId = "f075b876-274f-48ef-862c-5f53d1ff9eaf";
const decisionId = "d2588d0d-ff3c-4547-bfbb-35309cc916fa";

const loads = [
  {
    id: loadId,
    number: 48291,
    name: "Oakland → Sacramento Express",
    type: "REEFER",
    status: "in_transit",
    distance: 88,
    isInProximity: true,
    customerId: "customer-fixture-1",
    customerName: "Acme Retail",
    assignedTruckId: truckId,
    assignedTruckNumber: "TR-5531",
    assignedDispatcherName: "Nhân viên điều phối",
    source: "manual",
    isHazmat: false,
    deliveryCostAmount: 1842,
    deliveryCostCurrency: "USD",
    version: 2,
    requestedPickupDate: new Date(now - 3_600_000).toISOString(),
    requestedDeliveryDate: new Date(now + 3_600_000).toISOString(),
    dispatchedAt: new Date(now - 2_700_000).toISOString(),
    pickedUpAt: new Date(now - 1_800_000).toISOString(),
    originAddressLine1: "Oakland DC Dock 4",
    originAddressCity: "Oakland",
    originAddressState: "CA",
    originAddressZipCode: "94601",
    originAddressCountry: "USA",
    originLocationLatitude: 37.8044,
    originLocationLongitude: -122.2712,
    destinationAddressLine1: "Sacramento Terminal",
    destinationAddressCity: "Sacramento",
    destinationAddressState: "CA",
    destinationAddressZipCode: "95814",
    destinationAddressCountry: "USA",
    destinationLocationLatitude: 38.5816,
    destinationLocationLongitude: -121.4944,
    notes: "Dữ liệu fixture E2E theo schema LoadResponse.",
  },
  {
    id: "73a1c92e-160c-4b95-a97d-4cc04bc7bd1a",
    number: 48292,
    name: "Los Angeles → Phoenix Reefer",
    type: "REEFER",
    status: "dispatched",
    distance: 372,
    isInProximity: false,
    customerId: "customer-fixture-2",
    customerName: "Global Foods",
    assignedTruckId: null,
    assignedTruckNumber: null,
    source: "manual",
    isHazmat: true,
    hazmatClass: "3",
    deliveryCostAmount: 2920,
    deliveryCostCurrency: "USD",
    version: 1,
    requestedPickupDate: new Date(now + 3_600_000).toISOString(),
    requestedDeliveryDate: new Date(now + 86_400_000).toISOString(),
    dispatchedAt: new Date(now - 900_000).toISOString(),
    originAddressCity: "Los Angeles",
    destinationAddressCity: "Phoenix",
  },
  {
    id: "1a7a30eb-7c05-4d2b-8b7b-58ac011bc247",
    number: 48293,
    name: "Seattle → Portland Dry Van",
    type: "DRY_VAN",
    status: "delivered",
    distance: 174,
    isInProximity: false,
    customerId: "customer-fixture-3",
    customerName: "Pacific Logistics",
    assignedTruckId: truckId,
    assignedTruckNumber: "TR-5531",
    source: "manual",
    isHazmat: false,
    version: 1,
    requestedPickupDate: new Date(now - 86_400_000).toISOString(),
    requestedDeliveryDate: new Date(now - 82_800_000).toISOString(),
    deliveredAt: new Date(now - 300_000).toISOString(),
    originAddressCity: "Seattle",
    destinationAddressCity: "Portland",
  },
];

const trucks = [
  {
    id: truckId,
    number: "TR-5531",
    type: "REEFER",
    vehicleCapacity: 46000,
    status: "in_use",
    make: "Freightliner",
    model: "Cascadia Evolution",
    year: 2024,
    vin: "1FUJGLDR8KLKM1234",
    licensePlate: "8ABC123",
    licensePlateState: "CA",
    isHazmatPlacarded: false,
    mainDriverId: "driver-fixture-1",
    mainDriverName: "Nguyễn Văn An",
    secondaryDriverId: null,
    secondaryDriverName: null,
    adrEquipmentIsAdrCertified: false,
    adrEquipmentAllowedClasses: "",
    currentLocationLatitude: 37.8044,
    currentLocationLongitude: -122.2712,
  },
  {
    id: "b4d3f3e2-8b53-4be8-8f97-29cf9b21e20c",
    number: "TR-4412",
    type: "BOX_TRUCK",
    vehicleCapacity: 26000,
    status: "available",
    make: "International",
    model: "MV",
    year: 2023,
    vin: null,
    licensePlate: "7XYZ456",
    licensePlateState: "CA",
    isHazmatPlacarded: false,
    mainDriverId: null,
    mainDriverName: null,
    secondaryDriverId: null,
    secondaryDriverName: null,
    adrEquipmentIsAdrCertified: false,
    adrEquipmentAllowedClasses: "",
    currentLocationLatitude: 34.0522,
    currentLocationLongitude: -118.2437,
  },
];

const suggestion = {
  decisionId,
  rank: 1,
  truckId,
  tripId: null,
  truckNumber: "TR-5531",
  driverId: "driver-fixture-1",
  driverName: "Nguyễn Văn An",
  score: 0.92,
  confidence: "high",
  reasoning: "Đề xuất fixture để kiểm tra bố cục màn duyệt AI.",
  metrics: {
    deadheadMiles: 8,
    expectedMarginRatio: 0.18,
    hosRemainingHours: 7.5,
    onTimeProbability: 0.94,
    totalDistanceMiles: 88,
  },
  status: "PENDING",
};

const routes = [
  { path: "/tms", title: "Tổng quan", marker: "tms-dashboard", slug: "overview" },
  { path: "/tms/dispatch", title: "Điều phối", marker: "dispatch-queue", slug: "dispatch" },
  { path: "/tms/approvals", title: "Duyệt điều phối AI", marker: "approvals-list", slug: "approvals" },
  { path: "/tms/live-tracking", title: "Theo dõi xe", marker: "live-tracking-list", slug: "live-tracking" },
  { path: "/optimization", title: "Tối ưu tuyến", marker: "optimization-run-card", slug: "optimization" },
] as const;

const testViewports = [320, 375, 768, 1024, 1440, 1920] as const;

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installTmsFixture(page: Page): Promise<string[]> {
  const unexpectedApiRequests: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.resourceType() === "document" && (
      url.pathname === "/tms"
      || url.pathname.startsWith("/tms/")
      || url.pathname === "/optimization"
    )) {
      await route.fulfill({ path: fixtureHtml, contentType: "text/html" });
      return;
    }

    if (url.hostname === "tile.openstreetmap.org") {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jLZ8AAAAASUVORK5CYII=", "base64"),
      });
      return;
    }

    if (url.hostname === "router.project-osrm.org") {
      await fulfillJson(route, {
        code: "Ok",
        routes: [{
          distance: 141622,
          duration: 7890,
          geometry: { type: "LineString", coordinates: [[-122.2712, 37.8044], [-121.8, 38.1], [-121.4944, 38.5816]] },
        }],
      });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const apiKey = `${request.method()} ${url.pathname}`;
      const allowedApi = new Set([
        "GET /api/loads",
        "GET /api/loads/dispatch-board/risk",
        "GET /api/loads/dispatch-board/unassigned",
        "GET /api/trucks",
        "GET /api/ai/dispatch/pending",
        "POST /api/ai/loads/overview",
        "GET /api/ai/features",
      ]);
      if (!allowedApi.has(apiKey) && !/^GET \/api\/loads\/[^/]+\/timeline$/.test(apiKey)) {
        unexpectedApiRequests.push(apiKey);
      }

      if (url.pathname === "/api/loads" && request.method() === "GET") {
        await fulfillJson(route, { data: { items: loads, totalItems: loads.length, totalPages: 1, currentPage: 1, pageSize: 100 } });
        return;
      }
      if (url.pathname === "/api/loads/dispatch-board/risk" && request.method() === "GET") {
        await fulfillJson(route, {
          data: {
            items: [{
              load: loads[0],
              unassignedTruck: false,
              riskReasons: [{ code: "PICKUP_OVERDUE", message: "Lô hàng fixture cần chú ý." }],
            }],
            totalItems: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 20,
          },
        });
        return;
      }
      if (url.pathname === "/api/loads/dispatch-board/unassigned" && request.method() === "GET") {
        const unassignedLoads = loads.filter((load) => !load.assignedTruckId);
        await fulfillJson(route, {
          data: {
            items: unassignedLoads,
            totalItems: unassignedLoads.length,
            totalPages: 1,
            currentPage: 1,
            pageSize: 20,
          },
        });
        return;
      }
      if (url.pathname === "/api/trucks" && request.method() === "GET") {
        await fulfillJson(route, { data: { items: trucks, totalItems: trucks.length, totalPages: 1, currentPage: 1, pageSize: 100 } });
        return;
      }
      if (url.pathname === "/api/ai/dispatch/pending" && request.method() === "GET") {
        await fulfillJson(route, [suggestion]);
        return;
      }
      if (url.pathname === "/api/ai/loads/overview" && request.method() === "POST") {
        await fulfillJson(route, [{
          loadId,
          gapStatus: "clear",
          blockingGapsCount: 0,
          warningGapsCount: 0,
          dispatchStatus: "pending",
          latestDecisionId: decisionId,
          suggestedTruckId: truckId,
          suggestedTruckNumber: "TR-5531",
          capabilities: { canApprove: true, canReject: true, canRerun: false, canViewRuns: true },
        }]);
        return;
      }
      if (url.pathname === "/api/ai/features" && request.method() === "GET") {
        await fulfillJson(route, { data: { enabled: false, dryRun: false } });
        return;
      }
      if (url.pathname.endsWith("/timeline") && request.method() === "GET") {
        await fulfillJson(route, {
          loadId,
          loadNumber: "48291",
          currentStatus: "in_transit",
          events: [],
        });
        return;
      }

      await fulfillJson(route, { data: [] });
      return;
    }

    await route.continue();
  });
  return unexpectedApiRequests;
}

async function expectPageMarker(page: Page, marker: string): Promise<void> {
  if (marker === "optimization-run-card") {
    const element = page.locator(`.${marker}`);
    await expect(element).toBeVisible();
    return;
  }
  if (["tms-dashboard", "dispatch-queue", "approvals-list", "live-tracking-list"].includes(marker)) {
    const element = page.locator(`[data-testid="${marker}"]`);
    await expect(element).toBeVisible();
    return;
  }
  await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
}

async function expectMapWorkspaceFilled(page: Page): Promise<void> {
  const viewportHeight = page.viewportSize()?.height ?? 0;
  const mapBounds = await page.locator(".map-shell").boundingBox();
  expect(mapBounds?.height ?? 0, "map should fill the available route height").toBeGreaterThan(viewportHeight * 0.75);
}

async function expectResponsiveRouteMarker(
  page: Page,
  route: (typeof routes)[number],
  width: number,
): Promise<void> {
  const isMapRoute = route.path === "/tms/dispatch"
    || route.path === "/tms/approvals"
    || route.path === "/tms/live-tracking";
  if (isMapRoute && width < 1200) {
    await expect(page.locator(".map-shell__mobile-controls")).toBeVisible();
    return;
  }
  await expectPageMarker(page, route.marker);
}

test("TMS deep links render after refresh and have no unauthenticated API failures", async ({ page }) => {
  const unexpectedApiRequests = await installTmsFixture(page);
  const authenticationMessages: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Authentication is required")) authenticationMessages.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route.path);
    await expectPageMarker(page, route.marker);
    if (["/tms/dispatch", "/tms/approvals", "/tms/live-tracking"].includes(route.path)) {
      await expectMapWorkspaceFilled(page);
    }
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll("/", "\\/")}(?:\\?.*)?$`));
    await page.reload();
    await expectPageMarker(page, route.marker);
    if (["/tms/dispatch", "/tms/approvals", "/tms/live-tracking"].includes(route.path)) {
      await expectMapWorkspaceFilled(page);
    }
  }

  expect(unexpectedApiRequests).toEqual([]);
  expect(authenticationMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("sidebar navigation preserves browser history and query-only updates do not remount the page shell", async ({ page }) => {
  await installTmsFixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tms");
  await expectPageMarker(page, "tms-dashboard");

  await page.getByLabel("Điều phối", { exact: true }).click();
  await expect(page).toHaveURL(/\/tms\/dispatch(?:\?.*)?$/);
  await expectPageMarker(page, "dispatch-queue");
  await page.evaluate(() => {
    (window as Window & { __tmsTransitionNode?: Element | null }).__tmsTransitionNode = document.querySelector(".app-route-transition");
  });
  await page.getByTestId("dispatch-filter-at-risk").click();
  await expect(page).toHaveURL(/filter=at-risk/);
  await expect.poll(() => page.evaluate(() => {
    const w = window as Window & { __tmsTransitionNode?: Element | null };
    return w.__tmsTransitionNode === document.querySelector(".app-route-transition");
  })).toBe(true);

  await page.getByLabel("Duyệt AI", { exact: true }).click();
  await expect(page).toHaveURL(/\/tms\/approvals$/);
  await page.getByLabel("Theo dõi xe", { exact: true }).click();
  await expect(page).toHaveURL(/\/tms\/live-tracking$/);
  await page.getByLabel("Tối ưu tuyến", { exact: true }).click();
  await expect(page).toHaveURL(/\/optimization$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/tms\/live-tracking$/);
  await expectPageMarker(page, "live-tracking-list");
  await page.goForward();
  await expect(page).toHaveURL(/\/optimization$/);
  await expect(page.locator(".optimization-run-card")).toBeVisible();
});

test("captures each mounted TMS page at responsive target widths", async ({ page }) => {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  const unexpectedApiRequests = await installTmsFixture(page);

  for (const route of routes) {
    await page.goto(route.path);
    await expectPageMarker(page, route.marker);

    for (const width of testViewports) {
      await page.setViewportSize({ width, height: 900 });
      await expectResponsiveRouteMarker(page, route, width);
      if (route.path !== "/tms" && route.path !== "/optimization") {
        await expectMapWorkspaceFilled(page);
      }
      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(overflow.page, `${route.path} overflows at ${width}px`).toBeLessThanOrEqual(overflow.viewport);
      await page.screenshot({
        path: path.join(screenshotDirectory, `${route.slug}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
  }

  expect(unexpectedApiRequests).toEqual([]);
});

test("captures the redesigned dashboard at 1440px and 1920px", async ({ page }) => {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  await installTmsFixture(page);

  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/tms");
    await expectPageMarker(page, "tms-dashboard");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: path.join(screenshotDirectory, `overview-${width}.png`),
      fullPage: true,
    });
  }
});
