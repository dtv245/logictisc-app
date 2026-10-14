/**
 * Khai báo chỉ số cho Executive Overview.
 *
 * Mỗi chỉ số ở đây tự khai báo nguồn dữ liệu của nó qua `availability`. Đây là
 * điểm mấu chốt của thiết kế: giao diện KHÔNG tự quyết định chỉ số nào hiển thị
 * được — nó đọc khai báo này.
 *
 * `availability` mô tả HỢP ĐỒNG, không phải lần đọc này: nó trả lời "chỉ số này
 * có endpoint phục vụ chưa". Chuyện endpoint đó trả lời "chưa đo được" cho một
 * kỳ cụ thể là chuyện khác, và được quyết định lúc chạy bằng `MetricValue` của
 * từng response (`status: "unavailable"` + `reasonCode`). Hai tầng này độc lập:
 * khai báo `available` mà dữ liệu rỗng vẫn ra ô "chưa có số", không bao giờ ra 0.
 *
 * Vì sao còn chỉ số `unavailable` sau khi 6 endpoint đã dựng xong: backend không
 * trả `operatingMargin` và `revenueGrowth` trong bất kỳ response nào. Không suy
 * diễn chúng từ các trường khác — đó là bịa một chỉ số mà hợp đồng không có.
 */

import type { MetricDefinition, MetricValue } from "@/types/executive.types";
import { buildReferences, type FleetType } from "./executive.refs";

/**
 * Chỉ số chưa đo được, không kèm mã lý do.
 *
 * Dùng khi bản thân khu vực không có dữ liệu — lúc đó chưa có chỉ số nào để
 * nêu lý do riêng, và lý do chung đã nằm ở `reasonKey` của khu vực.
 */
export const UNAVAILABLE_METRIC: MetricValue = {
  status: "unavailable",
  reasonCode: null,
};

/** Endpoint tổng hợp cần bổ sung ở backend. */
export const REQUIRED_ENDPOINTS = {
  executiveSummary: "/api/reports/executive-summary",
  monthlyFinancials: "/api/reports/financials/monthly",
  costBreakdown: "/api/reports/costs/by-category",
  fleetHealth: "/api/reports/fleet/health",
  customerConcentration: "/api/reports/customers/concentration",
  receivablesAging: "/api/reports/receivables/aging",
} as const;

/** Lý do chưa có dữ liệu, dùng làm locale key. */
const REASONS = {
  /**
   * Endpoint tổng hợp đã có nhưng không trả về chỉ số này. Khác hẳn
   * `noAggregateEndpoint`: ở đây không còn gì để chờ ở backend nữa.
   */
  notInContract: "executive.unavailable.notInContract",
} as const;

const available = { status: "available" } as const;

/**
 * Chỉ số không nằm trong hợp đồng backend hiện tại.
 *
 * Cố tình KHÔNG kèm `requiredEndpoint`: cả sáu endpoint báo cáo đều đã hoạt
 * động, nên không còn endpoint nào để chỉ ra. Đây là khác biệt giữa "chưa làm
 * xong ở backend" và "backend đã trả lời rằng nó không trả chỉ số này" — trộn
 * hai thứ đó lại sẽ khiến người đọc chờ một việc không ai đang làm.
 */
const notInContract = (reasonKey: string): MetricDefinition["availability"] => ({
  status: "unavailable",
  reasonKey,
});

/**
 * Mã lý do backend trả về (`MetricUnavailableReason`) → locale key.
 *
 * Backend trả mã, không trả câu chữ: nó không biết ngôn ngữ của người đọc. Bảng
 * này là chỗ duy nhất dịch mã đó ra câu, và `unknown` là chỗ rơi xuống cho một
 * mã chưa có trong bảng — rơi xuống "chưa rõ lý do", tuyệt đối không rơi xuống
 * một con số.
 */
const UNAVAILABLE_REASON_KEYS: Readonly<Record<string, string>> = {
  NO_SOURCE_ROWS: "executive.unavailable.reason.noSourceRows",
  NO_ROWS_IN_CURRENCY: "executive.unavailable.reason.noRowsInCurrency",
  ZERO_DENOMINATOR: "executive.unavailable.reason.zeroDenominator",
  NO_TOTAL_MILES_SOURCE: "executive.unavailable.reason.noTotalMilesSource",
  NO_ODOMETER_SOURCE: "executive.unavailable.reason.noOdometerSource",
  NO_AVAILABILITY_HISTORY: "executive.unavailable.reason.noAvailabilityHistory",
  NO_DOWNTIME_INTERVALS: "executive.unavailable.reason.noDowntimeIntervals",
  NO_DOWNTIME_CLASSIFICATION:
    "executive.unavailable.reason.noDowntimeClassification",
  NO_COST_ALLOCATION: "executive.unavailable.reason.noCostAllocation",
  NO_PM_SCHEDULE: "executive.unavailable.reason.noPmSchedule",
  AMBIGUOUS_TRUCK_LINK: "executive.unavailable.reason.ambiguousTruckLink",
  NOT_IMPLEMENTED: "executive.unavailable.reason.notImplemented",
};

const UNKNOWN_REASON_KEY = "executive.unavailable.reason.unknown";

/** Locale key diễn giải mã lý do backend trả về cho một chỉ số không có số. */
export const unavailableReasonKey = (reasonCode: string | null): string =>
  reasonCode === null
    ? UNKNOWN_REASON_KEY
    : (UNAVAILABLE_REASON_KEYS[reasonCode] ?? UNKNOWN_REASON_KEY);

/** Lý do ở mức cả khu vực, khi bản thân endpoint không trả về dữ liệu nào. */
export const SECTION_REASONS = {
  requestFailed: "executive.unavailable.requestFailed",
  noRowsInWindow: "executive.unavailable.noRowsInWindow",
} as const;

/**
 * Bốn chỉ số North Star hiển thị trên cùng.
 *
 * Cả bốn đều cần tổng hợp theo kỳ nên chưa dựng được trên backend hiện tại.
 */
export const NORTH_STAR_METRICS = [
  "costPerMile",
  "revenuePerMile",
  "fleetUtilization",
  "onTimeDelivery",
] as const;

interface MetricSeed {
  id: string;
  labelKey: string;
  unit: MetricDefinition["unit"];
  higherIsBetter: boolean;
  refKey: string;
  availability: MetricDefinition["availability"];
  warnBandRatio?: number;
}

const METRIC_SEEDS: readonly MetricSeed[] = [
  // --- Tài chính -------------------------------------------------------
  {
    id: "costPerMile",
    labelKey: "executive.metrics.costPerMile",
    unit: "currencyPerMile",
    higherIsBetter: false,
    refKey: "cpm",
    availability: available,
    warnBandRatio: 0.03,
  },
  {
    id: "revenuePerMile",
    labelKey: "executive.metrics.revenuePerMile",
    unit: "currencyPerMile",
    higherIsBetter: true,
    refKey: "rpm",
    availability: available,
    warnBandRatio: 0.03,
  },
  {
    id: "contributionSpread",
    labelKey: "executive.metrics.contributionSpread",
    unit: "currencyPerMile",
    higherIsBetter: true,
    refKey: "spread",
    availability: available,
    warnBandRatio: 0.05,
  },
  {
    id: "operatingMargin",
    labelKey: "executive.metrics.operatingMargin",
    unit: "percent",
    higherIsBetter: true,
    refKey: "operatingMargin",
    availability: notInContract(REASONS.notInContract),
    warnBandRatio: 0.15,
  },
  {
    id: "dso",
    labelKey: "executive.metrics.dso",
    unit: "days",
    higherIsBetter: false,
    refKey: "dso",
    availability: available,
    warnBandRatio: 0.1,
  },
  {
    id: "revenueGrowth",
    labelKey: "executive.metrics.revenueGrowth",
    unit: "percent",
    higherIsBetter: true,
    refKey: "revenueGrowth",
    availability: notInContract(REASONS.notInContract),
  },

  // --- Vận hành --------------------------------------------------------
  {
    id: "fleetUtilization",
    labelKey: "executive.metrics.fleetUtilization",
    unit: "percent",
    higherIsBetter: true,
    refKey: "utilization",
    availability: available,
    warnBandRatio: 0.05,
  },
  {
    id: "loadedMiles",
    labelKey: "executive.metrics.loadedMiles",
    unit: "percent",
    higherIsBetter: true,
    refKey: "loadedMiles",
    availability: available,
    warnBandRatio: 0.04,
  },
  {
    id: "onTimeDelivery",
    labelKey: "executive.metrics.onTimeDelivery",
    unit: "percent",
    higherIsBetter: true,
    refKey: "onTimeDelivery",
    availability: available,
    warnBandRatio: 0.02,
  },
  {
    id: "difot",
    labelKey: "executive.metrics.difot",
    unit: "percent",
    higherIsBetter: true,
    refKey: "difot",
    availability: available,
    warnBandRatio: 0.02,
  },

  // --- Sức khỏe đội xe --------------------------------------------------
  {
    id: "unplannedDowntime",
    labelKey: "executive.metrics.unplannedDowntime",
    unit: "percent",
    higherIsBetter: false,
    refKey: "unplannedDowntime",
    availability: available,
    warnBandRatio: 0.1,
  },
  {
    id: "pmCompliance",
    labelKey: "executive.metrics.pmCompliance",
    unit: "percent",
    higherIsBetter: true,
    refKey: "pmCompliance",
    availability: available,
    warnBandRatio: 0.03,
  },
  {
    id: "maintenanceCostPerMile",
    labelKey: "executive.metrics.maintenanceCostPerMile",
    unit: "currencyPerMile",
    higherIsBetter: false,
    refKey: "maintenanceCostPerMile",
    availability: available,
    warnBandRatio: 0.08,
  },
  {
    id: "breakdownsPer100k",
    labelKey: "executive.metrics.breakdownsPer100k",
    unit: "count",
    higherIsBetter: false,
    refKey: "breakdownsPer100k",
    availability: available,
    warnBandRatio: 0.1,
  },

  // --- Chỉ số đếm được từ CRUD hiện có ---------------------------------
  // Đây là những chỉ số duy nhất tính được thật ngay bây giờ: chúng chỉ cần
  // `total` của một truy vấn đã lọc, không cần cộng dồn bản ghi.
  {
    id: "fleetSize",
    labelKey: "executive.metrics.fleetSize",
    unit: "count",
    higherIsBetter: true,
    refKey: "utilization",
    availability: available,
  },
  {
    id: "activeCustomerCount",
    labelKey: "executive.metrics.activeCustomerCount",
    unit: "count",
    higherIsBetter: true,
    refKey: "utilization",
    availability: available,
  },
];

/** Dựng `MetricDefinition` đầy đủ ngưỡng cho một loại đội xe. */
export const buildMetricDefinitions = (
  fleetType: FleetType | null,
): MetricDefinition[] =>
  METRIC_SEEDS.map((seed) => ({
    id: seed.id,
    labelKey: seed.labelKey,
    unit: seed.unit,
    higherIsBetter: seed.higherIsBetter,
    availability: seed.availability,
    warnBandRatio: seed.warnBandRatio,
    references: buildReferences(seed.refKey, fleetType),
  }));

/** Tra một định nghĩa chỉ số theo id. */
export const findMetric = (
  definitions: readonly MetricDefinition[],
  id: string,
): MetricDefinition | undefined =>
  definitions.find((definition) => definition.id === id);
