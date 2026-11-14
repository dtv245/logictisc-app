/**
 * Truy vấn và tính toán cho Executive Overview.
 *
 * Hợp đồng đã xác minh tại `logictics_api` commit `2328e76`
 * (`ReportController` + `dto/report/**`), xem
 * `docs/contracts/backend-frontend-unblock-handoff.md`:
 *
 *   GET /api/reports/executive-summary        from, to
 *   GET /api/reports/financials/monthly       year, month, currency?
 *   GET /api/reports/costs/by-category        from, to, currency?
 *   GET /api/reports/customers/concentration  from, to, currency?, limit
 *   GET /api/reports/receivables/aging        asOf, from?, to?, currency?
 *   GET /api/reports/fleet/health             policyId, truckIds (không gọi ở đây)
 *
 * Ngày gửi lên là ngày lịch bao gồm hai đầu (`yyyy-MM-dd`), đúng quy ước backend.
 * Bốn route tài chính/điều hành chỉ cho ADMIN/ACCOUNTANT/PAYROLL/PAYROLL_MANAGER,
 * nên hook khoá query theo `reports:EXECUTIVE_VIEW` thay vì gửi request chắc
 * chắn nhận 403.
 *
 * Quy tắc xuyên suốt: không có số nghĩa là không có số. `MetricDto.value` chỉ
 * được đọc khi `availability` là AVAILABLE hoặc PARTIAL; null/reason luôn đi ra
 * `MetricValue.status = "unavailable"`, không bao giờ thành 0. Các phép chia
 * mỗi-dặm chỉ chạy khi mẫu số dặm và tử số đều đầy đủ.
 */

import { useCan, useCustom, useDataProvider } from "@refinedev/core";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ApiError } from "@/types/api.types";
import type {
  AgingBucketPoint,
  CostCategoryPoint,
  CustomerConcentration,
  InsightModel,
  KpiCardModel,
  MetricReference,
  MetricValue,
  MonthlyFinancialPoint,
  ReceivablesAging,
  StatusLevel,
} from "@/types/executive/executive.types";
import type {
  CostBreakdownReport,
  CustomerConcentrationReport,
  ExecutiveSummaryReport,
  MetricDto,
  MonthlyFinancialSummary,
  ReceivablesAgingReport,
} from "@/types/reports/report.dto";
import {
  CONCENTRATION_LIMIT,
  DISPLAY_CURRENCY,
} from "../config/executive.constants";
import {
  EXECUTIVE_ENDPOINT_CONTRACT,
  EXECUTIVE_REPORT_RESOURCE,
  EXECUTIVE_VIEW_ACTION,
  isExecutiveEndpointQueryEnabled,
} from "../config/executive.contract";
import {
  buildMetricDefinitions,
  NORTH_STAR_METRICS,
  SECTION_REASONS,
} from "../utils/executive.metrics";
import { toFleetHealthMetrics } from "../utils/executive.fleetHealth";
import {
  buildMonthlyQueryPlan,
  emptyMonthlyFinancialPoint,
  toMonthlyFinancialPoint,
} from "../utils/executive.monthly";
import type { FleetType } from "../utils/executive.refs";
import { runRules } from "../config/executive.rules";
import { resolveStatus } from "../utils/executive.status";
import type { MetricReading } from "../components/MetricGroupSection";

/** Chỉ số thuộc nhóm Vận hành. */
const OPERATIONAL_METRIC_IDS = [
  "fleetUtilization",
  "loadedMiles",
  "onTimeDelivery",
  "difot",
] as const;

/** Chỉ số thuộc nhóm Sức khỏe đội xe. */
const FLEET_HEALTH_METRIC_IDS = [
  "unplannedDowntime",
  "pmCompliance",
  "maintenanceCostPerMile",
  "breakdownsPer100k",
] as const;

/**
 * Bản đồ khoá locale cho các hạng mục chi phí backend đã trả.
 *
 * Chỉ ánh xạ những giá trị đã thấy trong contract/test fixture. Giá trị chưa
 * biết hiển thị nguyên văn — không tự đặt tên hạng mục mới.
 */
const COST_CATEGORY_LABEL_KEYS: Readonly<Record<string, string>> = {
  FUEL: "executive.costCategories.fuel",
  MAINTENANCE: "executive.costCategories.maintenance",
  OTHER: "executive.costCategories.other",
  UNCATEGORIZED: "executive.costCategories.unclassified",
};

/** Sáu nhóm tuổi nợ cố định của backend; thứ tự do backend quyết định. */
const AGING_LABEL_KEYS: Readonly<Record<string, string>> = {
  current: "executive.aging.current",
  days1To30: "executive.aging.days1To30",
  days31To60: "executive.aging.days31To60",
  days61To90: "executive.aging.days61To90",
  over90: "executive.aging.over90",
  noDueDate: "executive.aging.noDueDate",
};

const UNAVAILABLE = (reasonCode: string | null): MetricValue => ({
  status: "unavailable",
  reasonCode,
});

const pad2 = (value: number): string => String(value).padStart(2, "0");

const formatUtcDate = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )}`;

export interface ReportWindow {
  /** Inclusive `yyyy-MM-dd`. */
  readonly from: string;
  /** Inclusive `yyyy-MM-dd`. */
  readonly to: string;
}

/**
 * Inclusive calendar window covering the same months as the monthly chart:
 * the first day of the month `rangeMonths - 1` months ago through today, UTC.
 * `rangeMonths` is clamped to the same 24-month ceiling as the request plan.
 */
export const buildReportWindow = (
  now: Date,
  rangeMonths: number,
): ReportWindow => {
  const months = Number.isFinite(rangeMonths)
    ? Math.min(24, Math.max(1, Math.trunc(rangeMonths)))
    : 1;
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const from = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - (months - 1), 1),
  );
  return { from: formatUtcDate(from), to: formatUtcDate(to) };
};

/** Today as an inclusive calendar date, used as the aging `asOf`. */
export const utcToday = (now: Date): string =>
  formatUtcDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );

/**
 * `MetricDto` → `MetricValue`.
 *
 * AVAILABLE and PARTIAL both carry a real value; `UNAVAILABLE`,
 * `NOT_APPLICABLE`, a null value or a non-finite number carry none. The backend
 * reason is preserved so the UI can name the limitation.
 */
export const toMetricValue = (
  metric: MetricDto | null | undefined,
): MetricValue => {
  if (!metric) return UNAVAILABLE("NO_SOURCE_ROWS");

  const numeric =
    typeof metric.value === "number" && Number.isFinite(metric.value)
      ? metric.value
      : null;

  if (
    (metric.availability === "AVAILABLE" ||
      metric.availability === "PARTIAL") &&
    numeric !== null
  ) {
    return { status: "available", value: numeric };
  }

  return UNAVAILABLE(metric.reason ?? null);
};

const ruleValue = (value: MetricValue): number | undefined =>
  value.status === "available" ? value.value : undefined;

const latestAvailable = (
  points: readonly MonthlyFinancialPoint[],
  pick: (point: MonthlyFinancialPoint) => MetricValue,
): MetricValue => {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = pick(points[index]);
    if (value.status === "available") return value;
  }

  const latest = points.at(-1);
  if (!latest) return UNAVAILABLE(null);

  const value = pick(latest);
  return value.status === "unavailable"
    ? UNAVAILABLE(value.reasonCode)
    : UNAVAILABLE(null);
};

export interface ExecutiveData {
  definitions: ReturnType<typeof buildMetricDefinitions>;
  northStar: KpiCardModel[];
  kpis: KpiCardModel[];
  operationalDefinitions: ReturnType<typeof buildMetricDefinitions>;
  operationalReadings: Record<string, MetricReading | undefined>;
  fleetHealthDefinitions: ReturnType<typeof buildMetricDefinitions>;
  fleetHealthReadings: Record<string, MetricReading | undefined>;
  /** Chuỗi tháng tài chính; null khi không tháng nào trả về dữ liệu. */
  monthlyPoints: MonthlyFinancialPoint[] | null;
  costCategories: CostCategoryPoint[] | null;
  totalMiles: MetricValue;
  monthlyReasonKey: string;
  costReasonKey: string;
  concentration: CustomerConcentration | null;
  concentrationReasonKey: string;
  aging: ReceivablesAging | null;
  agingReasonKey: string;
  insights: InsightModel[];
  isLoading: boolean;
  awaitingData: boolean;
}

const pickReference = (
  references: readonly MetricReference[],
  kind: MetricReference["kind"],
): MetricReference | undefined =>
  references.find((reference) => reference.kind === kind);

export const useExecutiveData = (
  fleetType: FleetType | null,
  rangeMonths: number,
): ExecutiveData => {
  const reportAccess = useCan({
    resource: EXECUTIVE_REPORT_RESOURCE,
    action: EXECUTIVE_VIEW_ACTION,
  });
  const canViewReports = reportAccess.data?.can === true;
  // One clock reading per mount keeps the aggregate window, the aging `asOf`
  // and the monthly plan describing the same period.
  const now = useMemo(() => new Date(), []);
  const window = useMemo(
    () => buildReportWindow(now, rangeMonths),
    [now, rangeMonths],
  );
  const asOf = useMemo(() => utcToday(now), [now]);
  const monthlyPlan = useMemo(
    () => buildMonthlyQueryPlan(now, rangeMonths),
    [now, rangeMonths],
  );

  const dataProvider = useDataProvider();
  const queryOptions = { staleTime: 60_000 } as const;

  const summary = useCustom<
    ExecutiveSummaryReport,
    ApiError,
    { from: string; to: string }
  >({
    url: EXECUTIVE_ENDPOINT_CONTRACT.executiveSummary.path,
    method: "get",
    config: { query: { from: window.from, to: window.to } },
    queryOptions: {
      ...queryOptions,
      enabled:
        canViewReports && isExecutiveEndpointQueryEnabled("executiveSummary"),
    },
  });

  const costs = useCustom<
    CostBreakdownReport,
    ApiError,
    { from: string; to: string; currency: string }
  >({
    url: EXECUTIVE_ENDPOINT_CONTRACT.costBreakdown.path,
    method: "get",
    config: {
      query: {
        from: window.from,
        to: window.to,
        currency: DISPLAY_CURRENCY,
      },
    },
    queryOptions: {
      ...queryOptions,
      enabled: canViewReports && isExecutiveEndpointQueryEnabled("costBreakdown"),
    },
  });

  const concentrationQuery = useCustom<
    CustomerConcentrationReport,
    ApiError,
    { from: string; to: string; currency: string; limit: number }
  >({
    url: EXECUTIVE_ENDPOINT_CONTRACT.customerConcentration.path,
    method: "get",
    config: {
      query: {
        from: window.from,
        to: window.to,
        currency: DISPLAY_CURRENCY,
        limit: CONCENTRATION_LIMIT,
      },
    },
    queryOptions: {
      ...queryOptions,
      enabled:
        canViewReports &&
        isExecutiveEndpointQueryEnabled("customerConcentration"),
    },
  });

  const aging = useCustom<
    ReceivablesAgingReport,
    ApiError,
    { asOf: string; from: string; to: string; currency: string }
  >({
    url: EXECUTIVE_ENDPOINT_CONTRACT.receivablesAging.path,
    method: "get",
    config: {
      query: {
        asOf,
        from: window.from,
        to: window.to,
        currency: DISPLAY_CURRENCY,
      },
    },
    queryOptions: {
      ...queryOptions,
      enabled: canViewReports && isExecutiveEndpointQueryEnabled("receivablesAging"),
    },
  });

  const monthlyEnabled =
    canViewReports && isExecutiveEndpointQueryEnabled("monthlyFinancials");
  const monthlyEndpoint = EXECUTIVE_ENDPOINT_CONTRACT.monthlyFinancials;

  // Một request cho mỗi tháng: contract là year/month, và response chỉ mô tả
  // đúng một tháng. Cache key gồm tenant-independent year/month/currency.
  const monthlyQueries = useQueries({
    queries: monthlyPlan.map((item) => ({
      queryKey: [
        "executive",
        "financials",
        "monthly",
        item.year,
        item.month,
        DISPLAY_CURRENCY,
      ],
      queryFn: async (): Promise<MonthlyFinancialSummary | null> => {
        const provider = dataProvider();
        if (!provider?.custom) return null;
        const response = await provider.custom<MonthlyFinancialSummary>({
          url: monthlyEndpoint.path,
          method: "get",
          query: {
            year: item.year,
            month: item.month,
            currency: DISPLAY_CURRENCY,
          },
        });
        return response.data;
      },
      enabled: monthlyEnabled,
      staleTime: 5 * 60_000,
      refetchInterval: false as const,
      retry: false,
    })),
  });

  return useMemo<ExecutiveData>(() => {
    const definitions = buildMetricDefinitions(fleetType);

    const monthlyHasData = monthlyQueries.some((query) => Boolean(query.data));
    const monthlyPoints: MonthlyFinancialPoint[] | null = monthlyHasData
      ? monthlyPlan.map((item, index) => {
          const query = monthlyQueries[index];
          return query?.data
            ? toMonthlyFinancialPoint(query.data, item)
            : emptyMonthlyFinancialPoint(item, query?.isError ? null : "NO_SOURCE_ROWS");
        })
      : null;

    const summaryData = summary.data?.data;
    const costsData = costs.data?.data;
    const concentrationData = concentrationQuery.data?.data;
    const agingData = aging.data?.data;

    const costCategories: CostCategoryPoint[] | null = costsData
      ? costsData.categories.map((category) => ({
          id: category.category,
          category: category.category,
          labelKey:
            COST_CATEGORY_LABEL_KEYS[category.category.toUpperCase()] ?? null,
          currentTotal: toMetricValue(category.currentTotal),
          previousTotal: toMetricValue(category.previousTotal),
          shareOfTotal: toMetricValue(category.shareOfTotal),
          currentRowCount: category.currentRowCount,
          previousRowCount: category.previousRowCount,
        }))
      : null;

    const concentration: CustomerConcentration | null = concentrationData
      ? {
          rows: concentrationData.rows.map((row) => ({
            customerId: row.customerId,
            customerName: row.customerName,
            revenue: toMetricValue(row.revenue),
            shareOfRevenue: toMetricValue(row.shareOfRevenue),
            // Backend reports no cost or mileage allocation to customers.
            revenuePerMile: UNAVAILABLE("NO_CUSTOMER_MILEAGE_ALLOCATION"),
            grossMarginPercent: UNAVAILABLE("NO_COST_ALLOCATION"),
            onTimeDeliveryPercent: UNAVAILABLE("NOT_IMPLEMENTED"),
            dsoDays: UNAVAILABLE("NOT_IMPLEMENTED"),
          })),
          top1Share: toMetricValue(concentrationData.top1Share),
          top3Share: toMetricValue(concentrationData.top3Share),
          top5Share: toMetricValue(concentrationData.top5Share),
          hhi: toMetricValue(concentrationData.hhi),
          customersConsidered: concentrationData.customersConsidered,
          customersReturned: concentrationData.customersReturned,
          invoicesWithoutCustomer: concentrationData.invoicesWithoutCustomer,
        }
      : null;

    const agingModel: ReceivablesAging | null = agingData
      ? {
          asOf: agingData.asOf,
          outstandingTotal: toMetricValue(agingData.outstandingTotal),
          overdueTotal: toMetricValue(agingData.overdueTotal),
          invoicesWithStatusPaymentMismatch:
            agingData.invoicesWithStatusPaymentMismatch,
          // Six fixed buckets, used exactly as returned: no merging, no
          // recomputation of shares from `amount`.
          buckets: agingData.buckets.map(
            (bucket): AgingBucketPoint => ({
              id: bucket.id,
              labelKey: AGING_LABEL_KEYS[bucket.id] ?? bucket.id,
              amount: toMetricValue(bucket.amount),
              shareOfOutstanding: toMetricValue(bucket.shareOfOutstanding),
              invoiceCount: bucket.invoiceCount,
            }),
          ),
        }
      : null;

    // Fleet health requires policyId + truckIds chosen by the user. Executive
    // has no verified source for those, so no request is made and the KPIs are
    // unavailable (NOT because they are zero).
    const fleetHealthValues = toFleetHealthMetrics(null);

    const values: Record<string, MetricValue> = {
      fleetSize: toMetricValue(summaryData?.fleetSize),
      activeCustomerCount: toMetricValue(summaryData?.activeCustomers),
      fleetUtilization: toMetricValue(summaryData?.fleetUtilizationPct),
      loadedMiles: toMetricValue(summaryData?.loadedMilesPct),
      onTimeDelivery: toMetricValue(summaryData?.onTimeDeliveryPct),
      difot: toMetricValue(summaryData?.difotPct),
      costPerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.costPerMile)
        : UNAVAILABLE(null),
      revenuePerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.revenuePerMile)
        : UNAVAILABLE(null),
      contributionSpread: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.contributionSpread)
        : UNAVAILABLE(null),
      dso: toMetricValue(agingData?.dsoDays),
      unplannedDowntime: fleetHealthValues.unplannedDowntime,
      pmCompliance: fleetHealthValues.pmCompliance,
      maintenanceCostPerMile: fleetHealthValues.maintenanceCostPerMile,
      breakdownsPer100k: fleetHealthValues.breakdownsPer100k,
      // Not returned by any backend report.
      operatingMargin: UNAVAILABLE(null),
      revenueGrowth: UNAVAILABLE(null),
    };

    const buildModel = (
      definition: (typeof definitions)[number],
    ): KpiCardModel => {
      const current = values[definition.id] ?? UNAVAILABLE(null);
      const target = pickReference(definition.references, "internalTarget");
      return {
        definition,
        current,
        status: resolveStatus(
          ruleValue(current),
          target?.value,
          definition.higherIsBetter,
          definition.warnBandRatio,
        ),
        target,
        industry: pickReference(definition.references, "industryBenchmark"),
        historical: pickReference(definition.references, "historicalBaseline"),
      };
    };

    const kpis = definitions.map(buildModel);

    const buildReadings = (
      ids: readonly string[],
    ): Record<string, MetricReading | undefined> => {
      const result: Record<string, MetricReading | undefined> = {};
      ids.forEach((id) => {
        const definition = definitions.find((item) => item.id === id);
        if (!definition || definition.availability.status === "unavailable") {
          return;
        }
        const target = pickReference(definition.references, "internalTarget");
        if (!target) return;

        const current = values[id] ?? UNAVAILABLE(null);
        if (current.status === "unavailable") {
          result[id] = {
            status: "unavailable",
            reasonCode: current.reasonCode,
          };
          return;
        }

        const actual = current.value;
        const status: StatusLevel = resolveStatus(
          actual,
          target.value,
          definition.higherIsBetter,
          definition.warnBandRatio,
        );
        const historical = pickReference(
          definition.references,
          "historicalBaseline",
        );

        const low = Math.min(actual, target.value);
        const high = Math.max(actual, target.value);
        const padding = (high - low) * 0.25 || Math.abs(high) * 0.1 || 1;

        result[id] = {
          status: "available",
          actual,
          level: status,
          target,
          historical,
          min: Math.max(0, low - padding),
          max: high + padding,
        };
      });
      return result;
    };

    const ruleValues: Record<string, number | undefined> = {};
    definitions.forEach((definition) => {
      ruleValues[definition.id] = ruleValue(
        values[definition.id] ?? UNAVAILABLE(null),
      );
      const target = pickReference(definition.references, "internalTarget");
      ruleValues[`${definition.id}Target`] = target?.value;
    });

    const latestPoint = monthlyPoints?.at(-1);
    const insights = runRules({
      values: ruleValues,
      revenue: latestPoint ? ruleValue(latestPoint.revenue) : undefined,
      miles: latestPoint ? ruleValue(latestPoint.loadedMiles) : undefined,
      top1Share: concentration ? ruleValue(concentration.top1Share) : undefined,
      top3Share: concentration ? ruleValue(concentration.top3Share) : undefined,
      definitions,
    });

    const isLoading =
      reportAccess.isLoading ||
      summary.isLoading ||
      costs.isLoading ||
      concentrationQuery.isLoading ||
      aging.isLoading ||
      monthlyQueries.some((query) => query.isLoading);

    const awaitingData =
      !isLoading &&
      Object.values(values).every((value) => value.status === "unavailable");

    const sectionReasonKey = (hasError: boolean): string => {
      if (!canViewReports) return SECTION_REASONS.forbidden;
      if (hasError) return SECTION_REASONS.requestFailed;
      return SECTION_REASONS.noRowsInWindow;
    };

    return {
      definitions,
      northStar: kpis.filter((kpi) =>
        (NORTH_STAR_METRICS as readonly string[]).includes(kpi.definition.id),
      ),
      kpis,
      operationalDefinitions: definitions.filter((definition) =>
        (OPERATIONAL_METRIC_IDS as readonly string[]).includes(definition.id),
      ),
      operationalReadings: buildReadings(OPERATIONAL_METRIC_IDS),
      fleetHealthDefinitions: definitions.filter((definition) =>
        (FLEET_HEALTH_METRIC_IDS as readonly string[]).includes(definition.id),
      ),
      fleetHealthReadings: buildReadings(FLEET_HEALTH_METRIC_IDS),
      monthlyPoints,
      costCategories,
      totalMiles: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.totalMiles)
        : UNAVAILABLE(null),
      monthlyReasonKey: sectionReasonKey(
        monthlyQueries.some((query) => query.isError),
      ),
      costReasonKey: sectionReasonKey(costs.isError),
      concentration,
      concentrationReasonKey: sectionReasonKey(concentrationQuery.isError),
      aging: agingModel,
      agingReasonKey: sectionReasonKey(aging.isError),
      insights,
      isLoading,
      awaitingData,
    };
  }, [
    fleetType,
    canViewReports,
    reportAccess.isLoading,
    summary.data,
    summary.isLoading,
    costs.data,
    costs.isLoading,
    costs.isError,
    concentrationQuery.data,
    concentrationQuery.isLoading,
    concentrationQuery.isError,
    aging.data,
    aging.isLoading,
    aging.isError,
    monthlyQueries,
    monthlyPlan,
  ]);
};
