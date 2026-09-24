/**
 * Cấu trúc dữ liệu cho màn hình Executive Overview (ban điều hành).
 *
 * Chỉ chứa CẤU TRÚC — không format, không gọi API, không side effect
 * (`.agents/rules/frontend-engineering.md` §2).
 *
 * Nguyên tắc xuyên suốt: mọi ngưỡng tham chiếu đều phải mang theo nguồn gốc
 * và kỳ đo của nó. Không có nhánh nào trong kiểu dữ liệu này cho phép biểu
 * diễn một "mục tiêu nội bộ" như thể đó là benchmark ngành — muốn hiển thị
 * benchmark ngành thì phải có `industryBenchmark` thật, còn không thì chỉ có
 * `internalTarget`.
 */

/** Ba loại ngưỡng tham chiếu. Không bao giờ được trộn lẫn khi hiển thị. */
export type ReferenceKind =
  | "internalTarget"
  | "industryBenchmark"
  | "historicalBaseline";

/**
 * Một ngưỡng tham chiếu kèm nguồn gốc.
 *
 * `sourceKey` là BẮT BUỘC: không được dựng `ReferenceValue` nào mà thiếu nhãn
 * nguồn, vì như vậy là trình bày một con số không kiểm chứng được cho ban
 * điều hành.
 */
export interface ReferenceValue {
  kind: ReferenceKind;
  value: number;
  /** Locale key của tên nguồn (vd tổ chức công bố, hoặc "mục tiêu nội bộ"). */
  sourceKey: string;
  /** Locale key của kỳ đo nguồn (vd "Năm 2024"). Bỏ trống nếu không áp dụng. */
  periodKey?: string;
  /** Locale key của phạm vi áp dụng (loại hình vận tải, thị trường). */
  scopeKey?: string;
}

/**
 * Ngưỡng này có áp dụng trực tiếp cho loại đội xe đang chọn hay không.
 *
 * Khi `false`, giao diện BẮT BUỘC hiển thị "Internal Target" và không được
 * suy diễn rằng đó là benchmark ngành — đúng yêu cầu trong brief.
 */
export type ReferenceApplicability = "direct" | "notApplicable";

export interface MetricReference extends ReferenceValue {
  applicability: ReferenceApplicability;
}

/** Đơn vị hiển thị, quyết định cách format ở lớp trình bày. */
export type MetricUnit =
  | "currencyPerMile"
  | "currency"
  | "percent"
  | "count"
  | "days";

/** Mức trạng thái dùng chung cho mọi chỉ số. */
export type StatusLevel = "good" | "warning" | "critical" | "neutral";

/** Mức độ nghiêm trọng của một kết luận. */
export type InsightSeverity = "critical" | "warning" | "good";

/**
 * Nguồn dữ liệu của một chỉ số.
 *
 * `unavailable` không phải là lỗi tạm thời — nó là khai báo rằng backend chưa
 * có endpoint tổng hợp tương ứng. Giao diện giữ khung và ghi rõ endpoint còn
 * thiếu, tuyệt đối không hiển thị số ước lượng.
 */
export type MetricAvailability =
  | { status: "available" }
  | {
      status: "unavailable";
      /**
       * Endpoint cần bổ sung, vd "/api/reports/executive-summary".
       *
       * Bỏ trống khi KHÔNG endpoint nào còn thiếu — chỉ số này đơn giản là không
       * nằm trong hợp đồng backend hiện tại. Lúc đó nêu tên một endpoint đã hoạt
       * động sẽ khiến người đọc đi tìm một việc đã làm xong.
       */
      requiredEndpoint?: string;
      /** Locale key giải thích vì sao chưa có. */
      reasonKey: string;
    };

/** Khai báo tĩnh của một chỉ số: nhãn, đơn vị, ngưỡng, nguồn. */
export interface MetricDefinition {
  id: string;
  labelKey: string;
  unit: MetricUnit;
  /** true khi giá trị cao hơn là tốt hơn (RPM, OTD…), false với CPM, DSO… */
  higherIsBetter: boolean;
  availability: MetricAvailability;
  references: MetricReference[];
  /**
   * Tỉ lệ lệch so với mục tiêu để chuyển từ "good" sang "warning".
   * Bỏ trống thì chỉ dùng đúng/không đúng mục tiêu.
   */
  warnBandRatio?: number;
}

/**
 * Giá trị đã tính của một chỉ số trong một kỳ.
 *
 * Hai nhánh LOẠI TRỪ NHAU, và đó là toàn bộ mục đích của kiểu này: không có
 * nhánh nào vừa "có số" vừa "chưa đo được". Trình biên dịch bắt buộc phải rẽ
 * nhánh theo `status` trước khi đọc `value`, nên không còn chỗ nào viết được
 * `current ?? 0` — phép biến "chưa có dữ liệu" thành số 0 trên màn hình điều
 * hành, đúng loại lỗi mà `docs/backend-gaps.md` tồn tại để ngăn.
 */
export type MetricValue =
  | {
      status: "available";
      value: number;
      /** Giá trị kỳ trước, để so sánh. */
      previousValue?: number;
      /** Giá trị cùng kỳ năm trước. */
      yearAgoValue?: number;
    }
  | {
      status: "unavailable";
      /**
       * Mã lý do backend nêu (`MetricUnavailableReason`), hoặc null khi không
       * có — kể cả khi request thất bại. Null vẫn là "chưa có số".
       */
      reasonCode: string | null;
    };

/** Một dòng số liệu đã sẵn sàng để render thành thẻ KPI. */
export interface KpiCardModel {
  definition: MetricDefinition;
  current: MetricValue;
  status: StatusLevel;
  /** Mục tiêu nội bộ đang áp dụng, nếu có. */
  target?: MetricReference;
  /** Benchmark ngành, CHỈ tồn tại khi thật sự có nguồn ngành áp dụng được. */
  industry?: MetricReference;
  /** Đường cơ sở lịch sử. */
  historical?: MetricReference;
}

/** Một kết luận do rule engine sinh ra. */
export interface InsightModel {
  id: string;
  severity: InsightSeverity;
  /** Nhóm nguyên nhân gốc — nhiều cảnh báo cùng nhóm sẽ được gộp thành một. */
  cluster: string;
  titleKey: string;
  causeKey: string;
  impactKey: string;
  /** Điểm tác động đã quy đổi, dùng để xếp hạng theo tác động thay vì theo độ đỏ. */
  impactScore: number;
  /** Locale key của các cảnh báo đã được gộp vào kết luận này. */
  mergedFromKeys: string[];
}

/** Chế độ so sánh của bộ lọc thời gian. */
export type ComparisonMode = "previousPeriod" | "previousYear";

/** Bộ lọc toàn cục phía trên dashboard. */
export interface ExecutiveFilters {
  /** Số tháng gần nhất đang xem. */
  rangeMonths: number;
  region: string;
  businessUnit: string;
  fleetType: string;
  customerSegment: string;
  comparison: ComparisonMode;
}

/** Phạm vi ngày đã quy đổi từ bộ lọc. */
export interface DateWindow {
  currentFrom: Date;
  currentTo: Date;
  previousFrom: Date;
  previousTo: Date;
  yearAgoFrom: Date;
  yearAgoTo: Date;
}

/** Một tháng số liệu tài chính, dùng cho các biểu đồ chuỗi thời gian. */
export interface MonthlyFinancialPoint {
  /** Khoá tháng dạng "2026-08". */
  month: string;
  /** Nhãn hiển thị, đã bản địa hoá. */
  label: string;
  revenue: MetricValue;
  operatingCost: MetricValue;
  operatingProfit: MetricValue;
  revenuePerMile: MetricValue;
  costPerMile: MetricValue;
  /** Biên đóng góp trên mỗi dặm = RPM − CPM. */
  contributionSpread: MetricValue;
  loadedMiles: MetricValue;
  /**
   * Tổng số dặm của tháng.
   *
   * Có mặt trong hợp đồng nhưng backend luôn trả về "chưa đo được"
   * (`NO_TOTAL_MILES_SOURCE`): không nơi nào ghi dặm rỗng, nên không có mẫu số.
   * Giữ lại trường này thay vì bỏ đi để "chưa có nguồn" hiện ra thành một ô có
   * lý do, chứ không biến mất khỏi giao diện như thể chỉ số không tồn tại. TUYỆT
   * ĐỐI không suy ra nó từ `loadedMiles` hay từ `SUM(Load.distance)`.
   */
  totalMiles: MetricValue;
  /**
   * Suy luận theo lịch, KHÔNG phải kỳ kế toán đã chốt — không có bảng
   * `accounting_periods` ở backend.
   */
  closed: boolean;
  invoiceCount: number;
}

/** Một hạng mục chi phí trong cơ cấu chi phí. */
export interface CostCategoryPoint {
  id: string;
  /** Khoá locale do backend chọn (`executive.costCategories.*`). */
  labelKey: string;
  currentPerMile: MetricValue;
  previousPerMile: MetricValue;
  /** Tỉ trọng trên tổng chi phí, đơn vị %. */
  shareOfTotal: MetricValue;
  rowCount: number;
}

/** Một khách hàng trong bảng tập trung khách hàng. */
export interface CustomerConcentrationRow {
  customerId: string;
  customerName: string;
  revenue: MetricValue;
  shareOfRevenue: MetricValue;
  revenuePerMile: MetricValue;
  /**
   * Luôn ở trạng thái chưa có số: không có cơ sở nào phân bổ chi phí về một
   * khách hàng (Expense gắn với xe, không gắn với chuyến). Đây là giới hạn cấu
   * trúc vĩnh viễn, không phải nguồn dữ liệu còn thiếu.
   */
  grossMarginPercent: MetricValue;
  onTimeDeliveryPercent: MetricValue;
  dsoDays: MetricValue;
}

/** Kết quả khu vực Tập trung khách hàng. */
export interface CustomerConcentration {
  rows: CustomerConcentrationRow[];
  top1Share: MetricValue;
  top3Share: MetricValue;
  top5Share: MetricValue;
  /** Tính trên toàn bộ khách hàng, không phải trên `rows` đã cắt. */
  hhi: MetricValue;
  customersConsidered: number;
  customersReturned: number;
  /** Doanh thu không quy được về khách nào — phần không bao giờ xuất hiện trong `rows`. */
  invoicesWithoutCustomer: number;
}

/** Một nhóm tuổi nợ phải thu. */
export interface AgingBucketPoint {
  /** Mã nhóm do backend chọn: `current`, `days1To30`, … `noDueDate`. */
  id: string;
  /** Khoá locale do backend chọn (`executive.aging.*`). */
  labelKey: string;
  /** Số tiền còn phải thu của nhóm này. */
  amount: MetricValue;
  /** Tỉ trọng trên tổng còn phải thu, đơn vị %. */
  shareOfOutstanding: MetricValue;
  /**
   * Số hoá đơn trong nhóm. Đây là phép đếm, không phải số tiền, nên luôn là số
   * thật kể cả khi `amount` chưa đo được vì khác loại tiền.
   */
  invoiceCount: number;
}

/** Kết quả khu vực Tuổi nợ phải thu. */
export interface ReceivablesAging {
  /** Mốc chốt số liệu, dạng ISO. */
  asOf: string;
  outstandingTotal: MetricValue;
  overdueTotal: MetricValue;
  /**
   * Số hoá đơn mà cách suy số dư theo chuỗi trạng thái và theo các khoản đã trả
   * cho ra hai kết quả khác nhau. Là chỉ báo chất lượng dữ liệu, không phải tiền.
   */
  invoicesWithStatusPaymentMismatch: number;
  /** Sáu nhóm tuổi nợ, theo đúng thứ tự backend trả về. */
  buckets: AgingBucketPoint[];
}
