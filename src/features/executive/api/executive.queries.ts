/**
 * Truy vấn và tính toán cho Executive Overview.
 *
 * TRẠNG THÁI HỢP ĐỒNG (đối chiếu `logictics_api` ngày 2026-11-14):
 *
 *   GET /api/reports/executive-summary        — KHÔNG tồn tại
 *   GET /api/reports/financials/monthly       — tồn tại, `year` + `month`
 *                                               (+ `currency`), trả về MỘT
 *                                               `MonthlyFinancialSummary`
 *   GET /api/reports/costs/by-category        — KHÔNG tồn tại
 *   GET /api/reports/fleet/health             — tồn tại, BẮT BUỘC `policyId`
 *                                               và `truckIds`, trả về
 *                                               `FleetHistory.Report`
 *   GET /api/reports/customers/concentration  — KHÔNG tồn tại
 *   GET /api/reports/receivables/aging        — KHÔNG tồn tại
 *
 * Vì bốn route không tồn tại và hai route còn lại không phải DTO mà màn hình
 * này cần, Executive vẫn ở trạng thái dormant (BE-031). Hook này KHÔNG gửi
 * request khi `EXECUTIVE_CONTRACT_CONFIRMED === false`, và khi được bật lại nó
 * chỉ gọi monthly bằng `year`/`month` — không còn `from`/`to`, không còn
 * `response.points[]`. Fleet health không có nguồn `policyId`/`truckIds` đã
 * xác minh trong ngữ cảnh Executive nên không được gọi ở đây; màn hình Fleet
 * Report đã là nơi triển khai hợp lệ của route đó.
 *
 * Quy tắc xuyên suốt: không có số nghĩa là không có số. Không phép chuyển đổi
 * nào biến trường thiếu thành 0, và không chỉ số nào được cộng dồn từ dữ liệu
 * CRUD rồi gọi là số liệu toàn hệ thống.
 */

import { useCan, useDataProvider, useList } from "@refinedev/core";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ApiError } from "@/types/api.types";
import type {
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
import type { MonthlyFinancialSummary } from "@/types/reports/report.dto";
import { DISPLAY_CURRENCY } from "../config/executive.constants";
import {
  EXECUTIVE_ENDPOINT_CONTRACT,
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

const UNAVAILABLE = (reasonCode: string | null): MetricValue => ({
  status: "unavailable",
  reasonCode,
});

/** Giá trị dùng cho rule engine: chỉ số chưa đo được là `undefined`, không phải 0. */
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
  const trucksAccess = useCan({ action: "list", resource: "trucks" });
  const customersAccess = useCan({ action: "list", resource: "customers" });
  const canReadTrucks = trucksAccess.data?.can === true;
  const canReadCustomers = customersAccess.data?.can === true;

  const trucks = useList<{ id: string }, ApiError>({
    resource: "trucks",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: { enabled: canReadTrucks, staleTime: 60_000 },
  });
  const customers = useList<{ id: string }, ApiError>({
    resource: "customers",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: { enabled: canReadCustomers, staleTime: 60_000 },
  });

  const monthlyPlan = useMemo(
    () => buildMonthlyQueryPlan(new Date(), rangeMonths),
    [rangeMonths],
  );

  const dataProvider = useDataProvider();
  const monthlyEndpoint = EXECUTIVE_ENDPOINT_CONTRACT.monthlyFinancials;
  const monthlyEnabled = isExecutiveEndpointQueryEnabled("monthlyFinancials");

  // Một request cho mỗi tháng: contract là year/month, và response chỉ mô tả
  // đúng một tháng. `enabled` khoá toàn bộ khi Executive chưa được xác nhận.
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

    // Hai route không tồn tại: không có dữ liệu, không có request.
    const costCategories: CostCategoryPoint[] | null = null;
    const concentration: CustomerConcentration | null = null;
    const aging: ReceivablesAging | null = null;

    // Fleet health cần policyId + truckIds do người dùng chọn; Executive không
    // có nguồn đó nên các KPI giữ "chưa có số". Ngay cả khi có report, bốn
    // chỉ số này không nằm trong FleetHistory.Report.
    const fleetHealthValues = toFleetHealthMetrics(null);

    const values: Record<string, MetricValue> = {
      fleetSize: UNAVAILABLE(null),
      activeCustomerCount: UNAVAILABLE(null),
      fleetUtilization: UNAVAILABLE(null),
      loadedMiles: UNAVAILABLE(null),
      onTimeDelivery: UNAVAILABLE(null),
      difot: UNAVAILABLE(null),
      costPerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.costPerMile)
        : UNAVAILABLE(null),
      revenuePerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.revenuePerMile)
        : UNAVAILABLE(null),
      contributionSpread: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.contributionSpread)
        : UNAVAILABLE(null),
      dso: UNAVAILABLE(null),
      unplannedDowntime: fleetHealthValues.unplannedDowntime,
      pmCompliance: fleetHealthValues.pmCompliance,
      maintenanceCostPerMile: fleetHealthValues.maintenanceCostPerMile,
      breakdownsPer100k: fleetHealthValues.breakdownsPer100k,
      operatingMargin: UNAVAILABLE(null),
      revenueGrowth: UNAVAILABLE(null),
    };

    // Hai con số đếm này đọc từ `total` của truy vấn phân trang đã lọc, không
    // phải cộng dồn bản ghi: đó là một phép đếm thật.
    if (canReadTrucks && trucks.data?.total !== undefined) {
      values.fleetSize = { status: "available", value: trucks.data.total };
    }
    if (canReadCustomers && customers.data?.total !== undefined) {
      values.activeCustomerCount = {
        status: "available",
        value: customers.data.total,
      };
    }

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

    const insights = runRules({
      values: ruleValues,
      revenue:
        monthlyPoints && monthlyPoints.length > 0
          ? ruleValue(monthlyPoints[monthlyPoints.length - 1].revenue)
          : undefined,
      miles:
        monthlyPoints && monthlyPoints.length > 0
          ? ruleValue(monthlyPoints[monthlyPoints.length - 1].loadedMiles)
          : undefined,
      top1Share: undefined,
      top3Share: undefined,
      definitions,
    });

    const isLoading =
      trucksAccess.isLoading ||
      customersAccess.isLoading ||
      monthlyQueries.some((query) => query.isLoading) ||
      (canReadTrucks && trucks.isLoading) ||
      (canReadCustomers && customers.isLoading);

    const awaitingData =
      !isLoading &&
      Object.values(values).every((value) => value.status === "unavailable");

    const dormant = !isExecutiveEndpointQueryEnabled("monthlyFinancials");
    const monthlyReasonKey = dormant
      ? SECTION_REASONS.featureDormant
      : monthlyQueries.some((query) => query.isError)
        ? SECTION_REASONS.requestFailed
        : SECTION_REASONS.noRowsInWindow;

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
      monthlyReasonKey,
      concentration,
      concentrationReasonKey: SECTION_REASONS.endpointMissing,
      aging,
      agingReasonKey: SECTION_REASONS.endpointMissing,
      insights,
      isLoading,
      awaitingData,
    };
  }, [
    fleetType,
    canReadTrucks,
    canReadCustomers,
    trucks.data,
    customers.data,
    trucks.isLoading,
    customers.isLoading,
    trucksAccess.isLoading,
    customersAccess.isLoading,
    monthlyQueries,
    monthlyPlan,
  ]);
};
