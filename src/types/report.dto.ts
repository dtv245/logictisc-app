/**
 * Hình dạng dữ liệu của 6 endpoint tổng hợp `/api/reports/**`.
 *
 * Đây là DTO thô đúng như backend trả về — không format, không suy diễn
 * (`.agents/rules/frontend-engineering.md` §2). Lớp chuyển đổi sang mô hình
 * hiển thị nằm ở `features/executive/executive.queries.ts`.
 *
 * Điểm quan trọng nhất của tệp này: `ReportMetric` là một union rẽ nhánh theo
 * `available`, không phải `{ value: number | null }`. Mọi chỉ số backend trả về
 * đều mang hình dạng đó, kể cả khi chắc chắn có số. Nhờ vậy không có chỗ nào
 * trong mã nguồn đọc được `value` mà chưa khẳng định `available === true` —
 * trình biên dịch bắt buộc phải rẽ nhánh trước.
 *
 * Vì sao phải chặt như vậy: backend dùng `null` cho "chưa đo được", và một
 * `null` bị đọc thành `0` sẽ hiện lên màn hình điều hành như một phép đo thật.
 * Xem `MetricValue.java` phía backend và `docs/backend-gaps.md`.
 */

/** Một giá trị đo, hoặc lý do vì sao không có giá trị nào để đo. */
export type ReportMetric =
  | {
      readonly available: true;
      readonly value: number;
      /** Luôn null khi có số; giữ lại để phản ánh đúng hợp đồng. */
      readonly reasonCode: string | null;
    }
  | {
      readonly available: false;
      readonly value: null;
      /**
       * Mã lý do (`MetricUnavailableReason`). Null khi backend không nêu lý do —
       * giao diện vẫn phải hiển thị "chưa có số", không được suy ra số.
       */
      readonly reasonCode: string | null;
    };

/** Một nhóm đếm dùng cho các phân bố trong khối độ đầy đủ dữ liệu. */
export type ReportGroupCount = {
  readonly label: string;
  readonly count: number;
};

/**
 * Khối "dữ liệu đọc được những gì" mà mọi response đều mang theo.
 *
 * Tồn tại để phân biệt "chi phí bằng 0" với "chưa có dòng chi phí nào" mà không
 * phải tin vào lời service.
 */
export type ReportDataCompleteness = {
  readonly currency: string;
  readonly sourceRowCounts: Readonly<Record<string, number>>;
  readonly excludedOtherCurrencyRows: number;
  readonly currenciesPresent: readonly string[];
  readonly distributions: Readonly<
    Record<string, readonly ReportGroupCount[]>
  >;
  readonly unavailableMetrics: readonly string[];
};

/** `GET /api/reports/executive-summary`. */
export type ExecutiveSummaryDto = {
  readonly fleetSize: ReportMetric;
  readonly activeCustomers: ReportMetric;
  readonly fleetUtilizationPct: ReportMetric;
  readonly loadedMilesPct: ReportMetric;
  readonly onTimeDeliveryPct: ReportMetric;
  readonly difotPct: ReportMetric;
  readonly trucksWithLoadsPct: ReportMetric;
  readonly completeness: ReportDataCompleteness;
};

/** Một tháng trong chuỗi tài chính. */
export type MonthlyFinancialPointDto = {
  /** Khoá `yyyy-MM`. */
  readonly month: string;
  readonly label: string;
  readonly revenue: ReportMetric;
  readonly operatingCost: ReportMetric;
  readonly operatingProfit: ReportMetric;
  readonly revenuePerMile: ReportMetric;
  readonly costPerMile: ReportMetric;
  readonly contributionSpread: ReportMetric;
  readonly loadedMiles: ReportMetric;
  /** Không có nguồn: backend luôn trả unavailable cho chỉ số này. */
  readonly totalMiles: ReportMetric;
  /** Suy luận theo lịch (`periodEnd < now`), không phải kỳ kế toán đã chốt. */
  readonly closed: boolean;
  readonly invoiceCount: number;
};

/** `GET /api/reports/financials/monthly`. */
export type MonthlyFinancialsDto = {
  readonly currency: string;
  readonly from: string;
  readonly to: string;
  readonly points: readonly MonthlyFinancialPointDto[];
  readonly completeness: ReportDataCompleteness;
};

/** Một hạng mục chi phí. */
export type CostCategoryDto = {
  readonly id: string;
  /** Khoá locale do backend chọn — trùng `executive.costCategories.*`. */
  readonly labelKey: string;
  readonly currentTotal: ReportMetric;
  readonly previousTotal: ReportMetric;
  readonly currentPerMile: ReportMetric;
  readonly previousPerMile: ReportMetric;
  readonly shareOfTotal: ReportMetric;
  readonly rowCount: number;
};

/** `GET /api/reports/costs/by-category`. */
export type CostBreakdownDto = {
  readonly currency: string;
  readonly from: string;
  readonly to: string;
  readonly totalCost: ReportMetric;
  /** Số dòng Expense gắn hai FK xe khác nhau — không quy được về một xe. */
  readonly ambiguousTruckLinkCount: number;
  readonly categories: readonly CostCategoryDto[];
  readonly completeness: ReportDataCompleteness;
};

/** `GET /api/reports/fleet/health`. */
export type FleetHealthDto = {
  readonly currency: string;
  readonly from: string;
  readonly to: string;
  readonly unplannedDowntimePct: ReportMetric;
  readonly pmCompliancePct: ReportMetric;
  readonly maintenanceCostPerMile: ReportMetric;
  readonly breakdownsPer100kMiles: ReportMetric;
  /** Số lịch bảo dưỡng không đánh giá được vì thiếu odometer. */
  readonly schedulesRequiringOdometerCount: number;
  readonly completeness: ReportDataCompleteness;
};

/** Một khách hàng trong bảng tập trung. */
export type CustomerConcentrationRowDto = {
  readonly customerId: string;
  readonly customerName: string;
  readonly revenue: ReportMetric;
  readonly shareOfRevenue: ReportMetric;
  readonly revenuePerMile: ReportMetric;
  /** Luôn unavailable: không có cơ sở phân bổ chi phí về khách hàng. */
  readonly grossMarginPercent: ReportMetric;
  readonly onTimeDeliveryPercent: ReportMetric;
  readonly dsoDays: ReportMetric;
};

/** `GET /api/reports/customers/concentration`. */
export type CustomerConcentrationDto = {
  readonly currency: string;
  readonly from: string;
  readonly to: string;
  readonly top1Share: ReportMetric;
  readonly top3Share: ReportMetric;
  readonly top5Share: ReportMetric;
  /** Tính trên TOÀN BỘ khách hàng, không phải trên `rows` đã cắt. */
  readonly hhi: ReportMetric;
  readonly customersConsidered: number;
  readonly customersReturned: number;
  /** Phần doanh thu không quy được về khách nào. */
  readonly invoicesWithoutCustomer: number;
  readonly rows: readonly CustomerConcentrationRowDto[];
  readonly completeness: ReportDataCompleteness;
};

/** Một khoảng tuổi nợ. */
export type AgingBucketDto = {
  readonly id: string;
  /** Khoá locale do backend chọn — trùng `executive.aging.*`. */
  readonly labelKey: string;
  readonly amount: ReportMetric;
  readonly shareOfOutstanding: ReportMetric;
  readonly invoiceCount: number;
};

/** `GET /api/reports/receivables/aging`. */
export type ReceivablesAgingDto = {
  readonly currency: string;
  readonly asOf: string;
  readonly revenueWindowFrom: string;
  readonly revenueWindowTo: string;
  readonly outstandingTotal: ReportMetric;
  readonly dsoDays: ReportMetric;
  readonly overdueTotal: ReportMetric;
  readonly buckets: readonly AgingBucketDto[];
  /** Số hóa đơn mà cách suy theo status và theo payment cho kết quả lệch nhau. */
  readonly invoicesWithStatusPaymentMismatch: number;
  readonly completeness: ReportDataCompleteness;
};
