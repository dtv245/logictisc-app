/**
 * Executive Overview page states.
 *
 * The page is a thin composition layer: it owns the filter state and the loading
 * switch, and delegates every value to the already-verified data layer. These
 * tests therefore mock only `useExecutiveData` and assert what the page does
 * with each state — loading, empty (no source rows), failed request and a real
 * KPI value. Route registration and the permission guard are covered in
 * `tests/router/ExecutiveRoute.test.tsx`.
 */

import type { i18n as I18nInstance } from "i18next";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ExecutiveOverviewPage } from "@/pages/executive/ExecutiveOverviewPage";
import { initializeAppI18n } from "@locales";
import type { ExecutiveData } from "@/features/executive/api/executive.queries";
import {
  buildMetricDefinitions,
  SECTION_REASONS,
  UNAVAILABLE_METRIC,
} from "@/features/executive/utils/executive.metrics";
import type { KpiCardModel } from "@/types/executive/executive.types";

const hook = vi.hoisted(() => ({ useExecutiveData: vi.fn() }));

vi.mock("@/features/executive/api/executive.queries", () => ({
  useExecutiveData: hook.useExecutiveData,
}));

const definitions = buildMetricDefinitions(null);

const emptyData = (overrides: Partial<ExecutiveData> = {}): ExecutiveData => ({
  definitions,
  northStar: [],
  kpis: [],
  operationalDefinitions: [],
  operationalReadings: {},
  fleetHealthDefinitions: [],
  fleetHealthReadings: {},
  monthlyPoints: null,
  costCategories: null,
  totalMiles: UNAVAILABLE_METRIC,
  monthlyReasonKey: SECTION_REASONS.noRowsInWindow,
  costReasonKey: SECTION_REASONS.noRowsInWindow,
  concentration: null,
  concentrationReasonKey: SECTION_REASONS.noRowsInWindow,
  aging: null,
  agingReasonKey: SECTION_REASONS.noRowsInWindow,
  insights: [],
  isLoading: false,
  awaitingData: true,
  ...overrides,
});

const fleetSizeDefinition = definitions.find(
  (definition) => definition.id === "fleetSize",
)!;

const fleetSizeCard: KpiCardModel = {
  definition: fleetSizeDefinition,
  current: { status: "available", value: 12 },
  status: "neutral",
  target: undefined,
  industry: undefined,
  historical: undefined,
};

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
});

beforeEach(() => {
  hook.useExecutiveData.mockReset();
});

const renderPage = (data: ExecutiveData) => {
  hook.useExecutiveData.mockReturnValue(data);
  return render(
    <I18nextProvider i18n={i18n}>
      <ExecutiveOverviewPage />
    </I18nextProvider>,
  );
};

describe("ExecutiveOverviewPage", () => {
  it("requests the default window and keeps fleet health out of the query arguments", () => {
    renderPage(emptyData());

    expect(hook.useExecutiveData).toHaveBeenCalledWith(null, 12);
  });

  it("shows only a spinner while the reports are loading", () => {
    renderPage(emptyData({ isLoading: true }));

    expect(screen.getByLabelText(i18n.t("common.loading"))).toBeInTheDocument();
    expect(
      screen.queryByText(i18n.t("executive.unavailable.title")),
    ).not.toBeInTheDocument();
  });

  it("renders every section and explains that no metric has a source yet", () => {
    renderPage(emptyData());

    expect(
      screen.getByRole("heading", { name: i18n.t("executive.title") }),
    ).toBeInTheDocument();
    for (const section of [
      "northStar",
      "financial",
      "operational",
      "fleetHealth",
      "customer",
      "aging",
    ] as const) {
      expect(
        screen.getByText(i18n.t(`executive.sections.${section}.title`)),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(i18n.t("executive.insights.awaitingData")),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(i18n.t("executive.unavailable.title")).length,
    ).toBeGreaterThan(0);
  });

  it("surfaces a failed report request at page level instead of calling it an empty period", () => {
    renderPage(
      emptyData({ monthlyReasonKey: SECTION_REASONS.requestFailed }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      i18n.t(SECTION_REASONS.requestFailed),
    );
  });

  it("renders a real KPI value when the report returned one", () => {
    renderPage(emptyData({ northStar: [fleetSizeCard], awaitingData: false }));

    expect(screen.getByText(i18n.t("executive.metrics.fleetSize"))).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.queryByText(i18n.t(SECTION_REASONS.requestFailed)),
    ).not.toBeInTheDocument();
  });
});
