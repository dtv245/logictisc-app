/**
 * Executive Overview page.
 *
 * Mounts the existing Executive data layer (`useExecutiveData`) and the existing
 * section components. It deliberately defines no new API client, DTO or metric
 * threshold: every value comes from the five verified aggregate routes, and a
 * missing value is rendered with its backend reason instead of a zero.
 *
 * Fleet health stays unavailable: `/api/reports/fleet/health` requires a
 * `policyId` and `truckIds`, and this screen has no verified source for either.
 * The hook therefore never calls it; the definitions render as "no value" with
 * the reason the backend contract states.
 */
import { Alert, Flex, Spin } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/PageHeader";
import { AgingSection } from "@/features/executive/components/AgingSection";
import { CustomerSection } from "@/features/executive/components/CustomerSection";
import { ExecutiveFilterBar } from "@/features/executive/components/ExecutiveFilterBar";
import { FinancialSection } from "@/features/executive/components/FinancialSection";
import { InsightPanel } from "@/features/executive/components/InsightPanel";
import { MetricCard } from "@/features/executive/components/MetricCard";
import { MetricGroupSection } from "@/features/executive/components/MetricGroupSection";
import { SectionCard } from "@/features/executive/components/SectionCard";
import { useExecutiveData } from "@/features/executive/api/executive.queries";
import {
  DEFAULT_RANGE_MONTHS,
  DISPLAY_CURRENCY,
} from "@/features/executive/config/executive.constants";
import {
  SECTION_REASONS,
  UNAVAILABLE_METRIC,
} from "@/features/executive/utils/executive.metrics";
import {
  CUSTOMER_CONCENTRATION_THRESHOLD,
  FLEET_TYPES,
  TOP1_CONCENTRATION_THRESHOLD,
  type FleetType,
} from "@/features/executive/utils/executive.refs";
import type { ExecutiveFilters } from "@/types/executive/executive.types";

import "@/pages/dashboard/DashboardPage.scss";

const DEFAULT_FILTERS: ExecutiveFilters = {
  rangeMonths: DEFAULT_RANGE_MONTHS,
  region: "",
  businessUnit: "",
  fleetType: "",
  customerSegment: "",
  comparison: "previousPeriod",
};

const asFleetType = (value: string): FleetType | null =>
  (FLEET_TYPES as readonly string[]).includes(value)
    ? (value as FleetType)
    : null;

export const ExecutiveOverviewPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ExecutiveFilters>(DEFAULT_FILTERS);
  const data = useExecutiveData(
    asFleetType(filters.fleetType),
    filters.rangeMonths,
  );

  // A failed request is not "no rows": surface it once at page level while the
  // per-section notices keep naming which block could not be loaded.
  const hasRequestFailure =
    [
      data.monthlyReasonKey,
      data.costReasonKey,
      data.concentrationReasonKey,
      data.agingReasonKey,
    ].includes(SECTION_REASONS.requestFailed);

  const costPerMileTarget =
    data.kpis.find((kpi) => kpi.definition.id === "costPerMile")?.target ?? null;

  return (
    <div className="exec-page">
      <PageHeader
        description={t("executive.description")}
        title={t("executive.title")}
      />
      <Flex gap="large" vertical>
        <ExecutiveFilterBar
          businessUnitOptions={[]}
          customerSegmentOptions={[]}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          regionOptions={[]}
        />

        {hasRequestFailure ? (
          <Alert
            showIcon
            message={t(SECTION_REASONS.requestFailed)}
            role="alert"
            type="error"
          />
        ) : null}

        {data.isLoading ? (
          <Flex align="center" justify="center">
            <Spin aria-label={t("common.loading")} />
          </Flex>
        ) : (
          <>
            <SectionCard
              question={t("executive.sections.northStar.question")}
              title={t("executive.sections.northStar.title")}
            >
              <div className="exec-metrics">
                {data.northStar.map((model) => (
                  <MetricCard
                    currency={DISPLAY_CURRENCY}
                    emphasis
                    key={model.definition.id}
                    model={model}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              question={t("executive.sections.insights.question")}
              sourceNote={t("executive.sections.insights.orderingNote")}
              title={t("executive.sections.insights.title")}
            >
              <InsightPanel
                awaitingData={data.awaitingData}
                insights={data.insights}
                isLoading={data.isLoading}
              />
            </SectionCard>

            <FinancialSection
              costCategories={data.costCategories}
              costPerMileTarget={costPerMileTarget}
              costReasonKey={data.costReasonKey}
              currency={DISPLAY_CURRENCY}
              points={data.monthlyPoints}
              reasonKey={data.monthlyReasonKey}
              totalMiles={data.totalMiles}
            />

            <MetricGroupSection
              currency={DISPLAY_CURRENCY}
              definitions={data.operationalDefinitions}
              question={t("executive.sections.operational.question")}
              readings={data.operationalReadings}
              title={t("executive.sections.operational.title")}
            />

            <MetricGroupSection
              currency={DISPLAY_CURRENCY}
              definitions={data.fleetHealthDefinitions}
              question={t("executive.sections.fleetHealth.question")}
              readings={data.fleetHealthReadings}
              title={t("executive.sections.fleetHealth.title")}
            />

            <CustomerSection
              concentrationThreshold={CUSTOMER_CONCENTRATION_THRESHOLD}
              currency={DISPLAY_CURRENCY}
              hhi={data.concentration?.hhi ?? UNAVAILABLE_METRIC}
              reasonKey={data.concentrationReasonKey}
              rows={data.concentration?.rows ?? null}
              top1Share={data.concentration?.top1Share ?? UNAVAILABLE_METRIC}
              top1Threshold={TOP1_CONCENTRATION_THRESHOLD}
              top3Share={data.concentration?.top3Share ?? UNAVAILABLE_METRIC}
              top5Share={data.concentration?.top5Share ?? UNAVAILABLE_METRIC}
            />

            <AgingSection
              aging={data.aging}
              currency={DISPLAY_CURRENCY}
              reasonKey={data.agingReasonKey}
            />
          </>
        )}
      </Flex>
    </div>
  );
};

export default ExecutiveOverviewPage;
