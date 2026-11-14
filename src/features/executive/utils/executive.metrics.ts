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
 * Toàn bộ sáu route tổng hợp đã tồn tại (xem `config/executive.contract.ts`),
 * nên `availability` là `available` cho mọi chỉ số có nguồn. Chỉ
 * `operatingMargin` và `revenueGrowth` vẫn nằm ngoài hợp đồng — không được suy
 * diễn từ trường khác, vì đó là bịa một con số mà backend không trả.
 */

import type { MetricDefinition, MetricValue } from "@/types/executive/executive.types";
import { EXECUTIVE_ENDPOINT_CONTRACT } from "../config/executive.contract";
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

/**
 * Đường dẫn của sáu route báo cáo, lấy từ một nguồn duy nhất
 * (`config/executive.contract.ts`) để không có chỗ nào khai báo lại sai.
 */
export const REQUIRED_ENDPOINTS = {
  executiveSummary: EXECUTIVE_ENDPOINT_CONTRACT.executiveSummary.path,
  monthlyFinancials: EXECUTIVE_ENDPOINT_CONTRACT.monthlyFinancials.path,
  costBreakdown: EXECUTIVE_ENDPOINT_CONTRACT.costBreakdown.path,
  fleetHealth: EXECUTIVE_ENDPOINT_CONTRACT.fleetHealth.path,
  customerConcentration:
    EXECUTIVE_ENDPOINT_CONTRACT.customerConcentration.path,
  receivablesAging: EXECUTIVE_ENDPOINT_CONTRACT.receivablesAging.path,
} as const;

/** Lý do chưa có dữ liệu, dùng làm locale key. */
const REASONS = {
  /**
   * Route đã có nhưng response không mang chỉ số này. Khác hẳn
   * `noAggregateEndpoint`: ở đây không còn gì để chờ ở backend nữa.
   */
  notInContract: "executive.unavailable.notInContract",
} as const;

const available = { status: "available" } as const;

/**
 * Chỉ số không nằm trong hợp đồng backend hiện tại.
 *
 * Cố tình KHÔNG kèm `requiredEndpoint`: route đã tồn tại, nhưng response không
 * mang chỉ số này. Nêu một endpoint đang hoạt động sẽ khiến người đọc đi tìm
 * một việc đã làm xong.
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
  // Reason codes introduced by the BE-031 / BE-033 report contract.
  NO_DELIVERED_LOADS_IN_PERIOD:
    "executive.unavailable.reason.noDeliveredLoadsInPeriod",
  NO_TRUCKS_IN_FLEET: "executive.unavailable.reason.noTrucksInFleet",
  NO_COMPLETED_TRIPS_IN_PERIOD:
    "executive.unavailable.reason.noCompletedTripsInPeriod",
  NO_VALID_TRIP_MILEAGE_ROWS:
    "executive.unavailable.reason.noValidTripMileageRows",
  TRIPS_MISSING_OR_INCONSISTENT_MILEAGE:
    "executive.unavailable.reason.tripsMissingOrInconsistentMileage",
  ZERO_RECORDED_LOADED_AND_DEADHEAD_MILES:
    "executive.unavailable.reason.zeroRecordedMiles",
  NO_VEHICLE_AVAILABILITY_HISTORY:
    "executive.unavailable.reason.noVehicleAvailabilityHistory",
  DIFOT_NOT_DEFINED_IN_SYSTEM:
    "executive.unavailable.reason.difotNotDefined",
  NON_POSITIVE_ATTRIBUTED_REVENUE:
    "executive.unavailable.reason.nonPositiveAttributedRevenue",
  REVENUE_WINDOW_REQUIRED: "executive.unavailable.reason.revenueWindowRequired",
  ZERO_WINDOW_REVENUE: "executive.unavailable.reason.zeroWindowRevenue",
  ZERO_OUTSTANDING: "executive.unavailable.reason.zeroOutstanding",
  PERIOD_END_DSO_APPROXIMATION:
    "executive.unavailable.reason.periodEndDsoApproximation",
  ZERO_TOTAL_COST: "executive.unavailable.reason.zeroTotalCost",
  MAINTENANCE_CURRENCY_NOT_STORED:
    "executive.unavailable.reason.maintenanceCurrencyNotStored",
  NO_CUSTOMER_MILEAGE_ALLOCATION:
    "executive.unavailable.reason.noCustomerMileageAllocation",
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
  /** Caller không có quyền xem báo cáo tài chính/điều hành. */
  forbidden: "executive.unavailable.forbidden",
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
