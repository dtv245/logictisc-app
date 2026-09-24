/**
 * Truy vấn và tính toán cho Executive Overview.
 *
 * Sáu endpoint tổng hợp dưới `/api/reports/**` là nguồn số duy nhất của màn
 * hình này. Không có chỗ nào cộng dồn bản ghi CRUD để tự ra số tổng: `MAX_PAGE_SIZE`
 * là 100 và `InvoiceController.search` không lọc theo ngày, nên cộng dồn rồi gọi
 * đó là doanh thu toàn công ty là trình bày sai số liệu cho ban điều hành.
 *
 * Quy tắc xuyên suốt, và là lý do tệp này tồn tại: **không có số nghĩa là không
 * có số**. Mọi phép chuyển đổi từ DTO sang mô hình hiển thị đi qua `toMetric`,
 * và `toMetric` chỉ trả về nhánh `available` khi backend thực sự nói
 * `available === true` kèm một số hữu hạn. Mọi trường hợp còn lại — thiếu
 * trường, request lỗi, `available: false`, giá trị không phải số — đều rơi vào
 * nhánh "chưa có số" kèm mã lý do. Không có nhánh nào biến chúng thành 0.
 */

import { useCan, useCustom, useList } from "@refinedev/core";
import { useMemo } from "react";

import type { ApiError } from "@/types/api.types";
import type {
  AgingBucketPoint,
  CostCategoryPoint,
  CustomerConcentration,
  CustomerConcentrationRow,
  InsightModel,
  KpiCardModel,
  MetricReference,
  MetricValue,
  MonthlyFinancialPoint,
  ReceivablesAging,
  StatusLevel,
} from "@/types/executive.types";
import type {
  CostBreakdownDto,
  CustomerConcentrationDto,
  ExecutiveSummaryDto,
  FleetHealthDto,
  MonthlyFinancialsDto,
  ReceivablesAgingDto,
  ReportMetric,
} from "@/types/report.dto";
import { CONCENTRATION_LIMIT, DISPLAY_CURRENCY } from "./executive.constants";
import {
  buildMetricDefinitions,
  NORTH_STAR_METRICS,
  REQUIRED_ENDPOINTS,
  SECTION_REASONS,
} from "./executive.metrics";
import type { FleetType } from "./executive.refs";
import { runRules } from "./executive.rules";
import { resolveStatus } from "./executive.status";
import type { MetricReading } from "./components/MetricGroupSection";

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

/** Tham số truy vấn chung: khoảng thời gian ISO-8601 dạng UTC. */
interface ReportQuery {
  currency: string;
  from: string;
  to: string;
}

const UNAVAILABLE = (reasonCode: string | null): MetricValue => ({
  status: "unavailable",
  reasonCode,
});

/**
 * DTO thô → mô hình hiển thị.
 *
 * Ba điều kiện phải cùng đúng mới được coi là có số. Điều kiện thứ ba
 * (`Number.isFinite`) không thừa: `available: true` kèm `value: null` là hợp
 * đồng bị vi phạm, và nó sẽ đi thẳng ra màn hình dưới dạng `0` nếu tin vào cờ
 * `available` mà không kiểm giá trị.
 */
const toMetric = (wire: ReportMetric | null | undefined): MetricValue => {
  if (
    wire?.available !== true ||
    typeof wire.value !== "number" ||
    !Number.isFinite(wire.value)
  ) {
    return UNAVAILABLE(wire?.reasonCode ?? null);
  }

  return { status: "available", value: wire.value };
};

/** Giá trị dùng cho rule engine: chỉ số chưa đo được là `undefined`, không phải 0. */
const ruleValue = (value: MetricValue): number | undefined =>
  value.status === "available" ? value.value : undefined;

/** Cửa sổ thời gian gửi lên backend, biên theo ngày UTC để khoá truy vấn ổn định. */
const startOfUtcDay = (moment: Date): Date =>
  new Date(
    Date.UTC(
      moment.getUTCFullYear(),
      moment.getUTCMonth(),
      moment.getUTCDate(),
    ),
  );

const reportWindow = (
  rangeMonths: number,
  now: Date,
): { from: string; to: string } => {
  const from = startOfUtcDay(now);
  from.setUTCMonth(from.getUTCMonth() - rangeMonths);

  // `to` là mốc LOẠI TRỪ, nên lấy đầu ngày mai để trọn ngày hôm nay.
  const to = startOfUtcDay(now);
  to.setUTCDate(to.getUTCDate() + 1);

  return { from: from.toISOString(), to: to.toISOString() };
};

export interface ExecutiveData {
  definitions: ReturnType<typeof buildMetricDefinitions>;
  northStar: KpiCardModel[];
  kpis: KpiCardModel[];
  operationalDefinitions: ReturnType<typeof buildMetricDefinitions>;
  operationalReadings: Record<string, MetricReading | undefined>;
  fleetHealthDefinitions: ReturnType<typeof buildMetricDefinitions>;
  fleetHealthReadings: Record<string, MetricReading | undefined>;
  /** Chuỗi tháng tài chính; null khi endpoint không trả về được gì. */
  monthlyPoints: MonthlyFinancialPoint[] | null;
  costCategories: CostCategoryPoint[] | null;
  /**
   * Tổng số dặm của tháng gần nhất.
   *
   * Nằm trong hợp đồng nhưng backend luôn trả "chưa đo được". Hiển thị nó kèm
   * lý do thay vì bỏ im lặng: người đọc cần phân biệt được "chưa có nguồn dặm"
   * với "dặm bằng không", vì mọi chỉ số mỗi-dặm trên màn hình đều phụ thuộc vào
   * mẫu số này.
   */
  totalMiles: MetricValue;
  /** Lý do khu vực Tài chính trống, dùng khi `monthlyPoints` null. */
  monthlyReasonKey: string;
  concentration: CustomerConcentration | null;
  /** Lý do khu vực Tập trung khách hàng trống. */
  concentrationReasonKey: string;
  /** Phân bố tuổi nợ phải thu; null khi endpoint không trả về được gì. */
  aging: ReceivablesAging | null;
  /** Lý do khu vực Tuổi nợ phải thu trống. */
  agingReasonKey: string;
  insights: InsightModel[];
  isLoading: boolean;
  /** true khi chưa chỉ số nào có dữ liệu nên chưa thể kết luận. */
  awaitingData: boolean;
}

const pickReference = (
  references: readonly MetricReference[],
  kind: MetricReference["kind"],
): MetricReference | undefined =>
  references.find((reference) => reference.kind === kind);

/**
 * Tháng mới nhất có số để làm giá trị kỳ hiện tại cho các chỉ số đơn vị "mỗi
 * dặm".
 *
 * Lấy tháng cuối cùng của chuỗi trả về, và nếu tháng đó chưa đo được thì lùi về
 * tháng gần nhất đo được — thà hiển thị một tháng cũ đã đo còn hơn hiển thị 0
 * cho tháng hiện tại.
 */
const latestAvailable = (
  points: readonly MonthlyFinancialPoint[],
  pick: (point: MonthlyFinancialPoint) => MetricValue,
): MetricValue => {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = pick(points[index]);
    if (value.status === "available") return value;
  }

  // Không tháng nào có số. Giữ lại mã lý do của tháng mới nhất thay vì trả về
  // một lý do chung chung — "chưa có dòng nào trong loại tiền này" khác hẳn
  // "chưa có dữ liệu", và người đọc cần phân biệt được hai tình huống đó.
  const latest = points.at(-1);
  if (!latest) return UNAVAILABLE(null);

  const value = pick(latest);
  return value.status === "unavailable"
    ? UNAVAILABLE(value.reasonCode)
    : UNAVAILABLE(null);
};

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

  // Cùng một cửa sổ cho cả sáu endpoint: chỉ số trên màn hình phải nói về cùng
  // một kỳ, nếu không thì "doanh thu mỗi dặm" và "chi phí mỗi dặm" so hai kỳ
  // khác nhau mà không có gì trên giao diện nói ra điều đó.
  const reportQuery = useMemo<ReportQuery>(
    () => ({
      currency: DISPLAY_CURRENCY,
      ...reportWindow(rangeMonths, new Date()),
    }),
    [rangeMonths],
  );

  const queryOptions = { staleTime: 60_000 } as const;

  const summary = useCustom<ExecutiveSummaryDto, ApiError, ReportQuery>({
    url: REQUIRED_ENDPOINTS.executiveSummary,
    method: "get",
    config: { query: reportQuery },
    queryOptions,
  });
  const monthly = useCustom<MonthlyFinancialsDto, ApiError, ReportQuery>({
    url: REQUIRED_ENDPOINTS.monthlyFinancials,
    method: "get",
    config: { query: reportQuery },
    queryOptions,
  });
  const costs = useCustom<CostBreakdownDto, ApiError, ReportQuery>({
    url: REQUIRED_ENDPOINTS.costBreakdown,
    method: "get",
    config: { query: reportQuery },
    queryOptions,
  });
  const fleetHealth = useCustom<FleetHealthDto, ApiError, ReportQuery>({
    url: REQUIRED_ENDPOINTS.fleetHealth,
    method: "get",
    config: { query: reportQuery },
    queryOptions,
  });
  const concentrationQuery = useCustom<
    CustomerConcentrationDto,
    ApiError,
    ReportQuery & { limit: number }
  >({
    url: REQUIRED_ENDPOINTS.customerConcentration,
    method: "get",
    config: { query: { ...reportQuery, limit: CONCENTRATION_LIMIT } },
    queryOptions,
  });
  const aging = useCustom<ReceivablesAgingDto, ApiError, ReportQuery>({
    url: REQUIRED_ENDPOINTS.receivablesAging,
    method: "get",
    config: { query: reportQuery },
    queryOptions,
  });

  const summaryData = summary.data?.data;
  const monthlyData = monthly.data?.data;
  const costsData = costs.data?.data;
  const fleetHealthData = fleetHealth.data?.data;
  const concentrationData = concentrationQuery.data?.data;
  const agingData = aging.data?.data;

  return useMemo<ExecutiveData>(() => {
    const definitions = buildMetricDefinitions(fleetType);

    const monthlyPoints: MonthlyFinancialPoint[] | null = monthlyData
      ? monthlyData.points.map((point) => ({
          month: point.month,
          label: point.label,
          revenue: toMetric(point.revenue),
          operatingCost: toMetric(point.operatingCost),
          operatingProfit: toMetric(point.operatingProfit),
          revenuePerMile: toMetric(point.revenuePerMile),
          costPerMile: toMetric(point.costPerMile),
          contributionSpread: toMetric(point.contributionSpread),
          loadedMiles: toMetric(point.loadedMiles),
          totalMiles: toMetric(point.totalMiles),
          closed: point.closed,
          invoiceCount: point.invoiceCount,
        }))
      : null;

    const costCategories: CostCategoryPoint[] | null = costsData
      ? costsData.categories.map((category) => ({
          id: category.id,
          labelKey: category.labelKey,
          currentPerMile: toMetric(category.currentPerMile),
          previousPerMile: toMetric(category.previousPerMile),
          shareOfTotal: toMetric(category.shareOfTotal),
          rowCount: category.rowCount,
        }))
      : null;

    const concentration: CustomerConcentration | null = concentrationData
      ? {
          rows: concentrationData.rows.map((row): CustomerConcentrationRow => ({
            customerId: row.customerId,
            customerName: row.customerName,
            revenue: toMetric(row.revenue),
            shareOfRevenue: toMetric(row.shareOfRevenue),
            revenuePerMile: toMetric(row.revenuePerMile),
            grossMarginPercent: toMetric(row.grossMarginPercent),
            onTimeDeliveryPercent: toMetric(row.onTimeDeliveryPercent),
            dsoDays: toMetric(row.dsoDays),
          })),
          top1Share: toMetric(concentrationData.top1Share),
          top3Share: toMetric(concentrationData.top3Share),
          top5Share: toMetric(concentrationData.top5Share),
          hhi: toMetric(concentrationData.hhi),
          customersConsidered: concentrationData.customersConsidered,
          customersReturned: concentrationData.customersReturned,
          invoicesWithoutCustomer: concentrationData.invoicesWithoutCustomer,
        }
      : null;

    // Sáu nhóm tuổi nợ backend đã trả về được dùng nguyên trạng: không gộp nhóm,
    // không tính lại tỉ trọng từ `amount`, và không suy thêm nhóm nào. Tỉ trọng
    // lấy từ `shareOfOutstanding` của chính backend vì mẫu số của nó là tổng còn
    // phải thu trên TOÀN BỘ hoá đơn, không phải tổng của sáu nhóm này.
    const agingModel: ReceivablesAging | null = agingData
      ? {
          asOf: agingData.asOf,
          outstandingTotal: toMetric(agingData.outstandingTotal),
          overdueTotal: toMetric(agingData.overdueTotal),
          invoicesWithStatusPaymentMismatch:
            agingData.invoicesWithStatusPaymentMismatch,
          buckets: agingData.buckets.map((bucket): AgingBucketPoint => ({
            id: bucket.id,
            labelKey: bucket.labelKey,
            amount: toMetric(bucket.amount),
            shareOfOutstanding: toMetric(bucket.shareOfOutstanding),
            invoiceCount: bucket.invoiceCount,
          })),
        }
      : null;

    // Nguồn số cho từng chỉ số. Chỉ số không có mặt ở đây — hoặc có mặt nhưng
    // đang ở nhánh "chưa có số" — sẽ hiện khung trống kèm lý do, không hiện 0.
    const values: Record<string, MetricValue> = {
      // Hai con số đếm này đọc từ `total` của truy vấn phân trang đã lọc, không
      // phải cộng dồn bản ghi: đó là một phép đếm thật, không phải ước lượng.
      fleetSize: UNAVAILABLE(null),
      activeCustomerCount: UNAVAILABLE(null),
      fleetUtilization: toMetric(summaryData?.fleetUtilizationPct),
      loadedMiles: toMetric(summaryData?.loadedMilesPct),
      onTimeDelivery: toMetric(summaryData?.onTimeDeliveryPct),
      difot: toMetric(summaryData?.difotPct),
      costPerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.costPerMile)
        : UNAVAILABLE(null),
      revenuePerMile: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.revenuePerMile)
        : UNAVAILABLE(null),
      contributionSpread: monthlyPoints
        ? latestAvailable(monthlyPoints, (point) => point.contributionSpread)
        : UNAVAILABLE(null),
      dso: toMetric(agingData?.dsoDays),
      unplannedDowntime: toMetric(fleetHealthData?.unplannedDowntimePct),
      pmCompliance: toMetric(fleetHealthData?.pmCompliancePct),
      maintenanceCostPerMile: toMetric(fleetHealthData?.maintenanceCostPerMile),
      breakdownsPer100k: toMetric(fleetHealthData?.breakdownsPer100kMiles),
      // `operatingMargin` và `revenueGrowth` không nằm trong bất kỳ response
      // nào; khai báo tĩnh của chúng đã ghi rõ điều đó.
      operatingMargin: UNAVAILABLE(null),
      revenueGrowth: UNAVAILABLE(null),
    };

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
        // Không có ngưỡng nội bộ thì không có gì để so — nhưng đó là chuyện của
        // bảng ngưỡng, không phải của dữ liệu, nên trả về undefined để khu vực
        // giữ nguyên khung thay vì gán cho nó một lý do về dữ liệu.
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

        // Thang đo của thanh: rộng hơn khoảng [mục tiêu, thực tế] một chút để
        // vạch mục tiêu không bao giờ dính sát mép.
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

    // Rule engine nhận `undefined` cho chỉ số chưa đo được, nên một chỉ số
    // thiếu dữ liệu không thể sinh ra kết luận. Ngưỡng nội bộ được đưa vào cùng
    // một bản đồ dưới khoá `<id>Target` — không có nó thì mọi rule so với ngưỡng
    // đều không bao giờ chạy.
    const ruleValues: Record<string, number | undefined> = {};
    definitions.forEach((definition) => {
      ruleValues[definition.id] = ruleValue(
        values[definition.id] ?? UNAVAILABLE(null),
      );
      const target = pickReference(definition.references, "internalTarget");
      ruleValues[`${definition.id}Target`] = target?.value;
    });

    const concentrationRow = concentration;
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
      top1Share: concentrationRow
        ? ruleValue(concentrationRow.top1Share)
        : undefined,
      top3Share: concentrationRow
        ? ruleValue(concentrationRow.top3Share)
        : undefined,
      definitions,
    });

    const isLoading =
      trucksAccess.isLoading ||
      customersAccess.isLoading ||
      summary.isLoading ||
      monthly.isLoading ||
      costs.isLoading ||
      fleetHealth.isLoading ||
      concentrationQuery.isLoading ||
      aging.isLoading ||
      (canReadTrucks && trucks.isLoading) ||
      (canReadCustomers && customers.isLoading);

    const awaitingData =
      !isLoading &&
      Object.values(values).every((value) => value.status === "unavailable");

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
      monthlyReasonKey: monthly.isError
        ? SECTION_REASONS.requestFailed
        : SECTION_REASONS.noRowsInWindow,
      concentration,
      concentrationReasonKey: concentrationQuery.isError
        ? SECTION_REASONS.requestFailed
        : SECTION_REASONS.noRowsInWindow,
      aging: agingModel,
      agingReasonKey: aging.isError
        ? SECTION_REASONS.requestFailed
        : SECTION_REASONS.noRowsInWindow,
      insights,
      isLoading,
      awaitingData,
    };
    // Phụ thuộc vào cả object dữ liệu của react-query, không phải từng trường
    // bên trong: React Compiler suy ra `trucks.data` từ `trucks.data?.total` và
    // báo lệch, còn thân memo chỉ đọc `total` nên phụ thuộc rộng hơn một chút
    // cũng không tính lại sai. Các object này ổn định giữa hai lần render khi dữ
    // liệu chưa đổi.
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
    summaryData,
    monthlyData,
    costsData,
    fleetHealthData,
    concentrationData,
    agingData,
    aging.isError,
    summary.isLoading,
    monthly.isLoading,
    costs.isLoading,
    fleetHealth.isLoading,
    concentrationQuery.isLoading,
    aging.isLoading,
    monthly.isError,
    concentrationQuery.isError,
  ]);
};
