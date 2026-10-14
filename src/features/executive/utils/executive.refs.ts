/**
 * Bảng ngưỡng tham chiếu cho Executive Overview.
 *
 * ĐÂY LÀ NƠI DUY NHẤT trong frontend được phép khai báo ngưỡng benchmark.
 * Mọi ngưỡng ở đây đều kèm nguồn, kỳ đo và phạm vi áp dụng; giao diện không
 * được dựng ngưỡng nào khác ngoài bảng này.
 *
 * Quy tắc bất di bất dịch: `industry: null` nghĩa là KHÔNG có benchmark ngành
 * áp dụng được cho chỉ số / loại đội xe đó. Trường hợp này giao diện chỉ được
 * hiển thị "Internal Target". Không được lấy benchmark của loại đội xe khác
 * rồi gán cho loại đang chọn.
 */

import type {
  MetricReference,
  ReferenceKind,
  StatusLevel,
} from "@/types/executive.types";

/** Loại đội xe. Khớp với khoá trong bảng ngưỡng bên dưới. */
export const FLEET_TYPES = [
  "longHaul",
  "regional",
  "privateFleet",
] as const;
export type FleetType = (typeof FLEET_TYPES)[number];

/** Nguồn của từng ngưỡng, dùng làm locale key. */
export const REFERENCE_SOURCES = {
  internal: "executive.sources.internal",
  atri: "executive.sources.atri",
  historical: "executive.sources.historical",
} as const;

/** Kỳ đo của nguồn. */
export const REFERENCE_PERIODS = {
  atri2025: "executive.periods.atri2025",
  internalFy: "executive.periods.internalFy",
  trailing12: "executive.periods.trailing12",
} as const;

/** Phạm vi áp dụng của nguồn. */
export const REFERENCE_SCOPES = {
  usLongHaulTruckload: "executive.scopes.usLongHaulTruckload",
  ownFleet: "executive.scopes.ownFleet",
} as const;

/** Ngưỡng thô của một chỉ số trong một loại đội xe. */
interface RawReference {
  /** Mục tiêu nội bộ. Luôn có. */
  target: number;
  /** Benchmark ngành. `null` = không có nguồn ngành áp dụng được. */
  industry: number | null;
  /** Đường cơ sở lịch sử của chính công ty. */
  historical?: number;
}

type RawReferenceTable = Record<FleetType, Record<string, RawReference>>;

/**
 * Ngưỡng theo loại đội xe.
 *
 * `industry` chỉ được điền khi có nguồn thật áp dụng trực tiếp cho loại đội xe
 * đó. Với "privateFleet" (đội xe tự vận hành, không bán cước ra ngoài), hầu hết
 * chỉ số vận hành không so được với dữ liệu ngành vốn đo đội xe cho thuê cước —
 * nên để `null` và giao diện sẽ hiển thị "Internal Target".
 */
export const REFERENCE_TABLE: RawReferenceTable = {
  longHaul: {
    cpm: { target: 1.68, industry: 2.3, historical: 1.61 },
    rpm: { target: 2.58, industry: null, historical: 2.44 },
    spread: { target: 0.9, industry: null, historical: 0.83 },
    utilization: { target: 84, industry: null, historical: 81 },
    loadedMiles: { target: 87, industry: 82, historical: 85 },
    onTimeDelivery: { target: 95, industry: 94, historical: 93 },
    difot: { target: 94, industry: 92, historical: 92 },
    unplannedDowntime: { target: 4, industry: null, historical: 3.4 },
    pmCompliance: { target: 95, industry: null, historical: 91 },
    maintenanceCostPerMile: { target: 0.165, industry: null, historical: 0.151 },
    breakdownsPer100k: { target: 1.8, industry: null, historical: 1.6 },
    operatingMargin: { target: 8, industry: null, historical: 6.4 },
    dso: { target: 45, industry: null, historical: 41 },
    revenueGrowth: { target: 6, industry: null, historical: 3.1 },
  },
  regional: {
    cpm: { target: 1.82, industry: 2.3, historical: 1.74 },
    rpm: { target: 2.5, industry: null, historical: 2.4 },
    spread: { target: 0.78, industry: null, historical: 0.72 },
    utilization: { target: 80, industry: null, historical: 78 },
    loadedMiles: { target: 84, industry: 82, historical: 83 },
    onTimeDelivery: { target: 96, industry: 94, historical: 95 },
    difot: { target: 95, industry: 92, historical: 94 },
    unplannedDowntime: { target: 3.5, industry: null, historical: 3.2 },
    pmCompliance: { target: 95, industry: null, historical: 93 },
    maintenanceCostPerMile: { target: 0.15, industry: null, historical: 0.144 },
    breakdownsPer100k: { target: 1.5, industry: null, historical: 1.4 },
    operatingMargin: { target: 8, industry: null, historical: 6.8 },
    dso: { target: 45, industry: null, historical: 42 },
    revenueGrowth: { target: 6, industry: null, historical: 3.4 },
  },
  privateFleet: {
    cpm: { target: 2.05, industry: null, historical: 1.98 },
    rpm: { target: 2.3, industry: null, historical: 2.26 },
    spread: { target: 0.52, industry: null, historical: 0.5 },
    utilization: { target: 72, industry: null, historical: 70 },
    loadedMiles: { target: 76, industry: null, historical: 75 },
    onTimeDelivery: { target: 97, industry: null, historical: 96 },
    difot: { target: 96, industry: null, historical: 95 },
    unplannedDowntime: { target: 3, industry: null, historical: 2.8 },
    pmCompliance: { target: 96, industry: null, historical: 94 },
    maintenanceCostPerMile: { target: 0.175, industry: null, historical: 0.169 },
    breakdownsPer100k: { target: 1.2, industry: null, historical: 1.1 },
    operatingMargin: { target: 7, industry: null, historical: 5.9 },
    dso: { target: 40, industry: null, historical: 37 },
    revenueGrowth: { target: 5, industry: null, historical: 2.6 },
  },
};

/** Ngưỡng cảnh báo tập trung khách hàng: % doanh thu đến từ Top 3 khách. */
export const CUSTOMER_CONCENTRATION_THRESHOLD = 55;

/** Ngưỡng cảnh báo tập trung Top 1 khách hàng. */
export const TOP1_CONCENTRATION_THRESHOLD = 30;

/**
 * Mức "cần theo dõi" của rủi ro tập trung: tỉ trọng Top 3 đã đi được bao xa về
 * phía ngưỡng cảnh báo. Đặt ở đây chứ không nằm trong component để ngưỡng của
 * màn hình điều hành nằm cùng một chỗ, không rải rác trong JSX.
 */
export const CONCENTRATION_WATCH_RATIO = 0.8;

/** Cặp ngưỡng cảnh báo tập trung, truyền vào bộ suy ra mức rủi ro. */
export interface ConcentrationThresholds {
  /** Ngưỡng cho khách hàng lớn nhất, đơn vị %. */
  top1: number;
  /** Ngưỡng cho Top 3 khách hàng, đơn vị %. */
  top3: number;
}

/**
 * Rủi ro tập trung, suy ra từ chính các tỉ trọng đang hiển thị.
 *
 * Cố tình KHÔNG tính HHI ở đây: HHI cần tỉ trọng của TOÀN BỘ khách hàng, mà
 * `rows` chỉ là top N do endpoint trả về. Tính HHI trên một tập đã cắt ngọn sẽ
 * luôn nhỏ hơn thực tế — tức là báo động thấp hơn mức nguy hiểm thật. Vì vậy
 * HHI chỉ được hiển thị khi backend trả về, không bao giờ được suy diễn.
 */
export const resolveConcentrationRisk = (
  top1Share: number | null,
  top3Share: number | null,
  thresholds: ConcentrationThresholds,
): StatusLevel => {
  if (top1Share === null && top3Share === null) return "neutral";

  const breaches =
    (top1Share !== null && top1Share > thresholds.top1) ||
    (top3Share !== null && top3Share > thresholds.top3);
  if (breaches) return "critical";

  const approaching =
    top3Share !== null &&
    top3Share > thresholds.top3 * CONCENTRATION_WATCH_RATIO;
  return approaching ? "warning" : "good";
};

const referenceKindMeta: Record<
  ReferenceKind,
  { sourceKey: string; periodKey?: string; scopeKey?: string }
> = {
  internalTarget: {
    sourceKey: REFERENCE_SOURCES.internal,
    periodKey: REFERENCE_PERIODS.internalFy,
    scopeKey: REFERENCE_SCOPES.ownFleet,
  },
  industryBenchmark: {
    sourceKey: REFERENCE_SOURCES.atri,
    periodKey: REFERENCE_PERIODS.atri2025,
    scopeKey: REFERENCE_SCOPES.usLongHaulTruckload,
  },
  historicalBaseline: {
    sourceKey: REFERENCE_SOURCES.historical,
    periodKey: REFERENCE_PERIODS.trailing12,
    scopeKey: REFERENCE_SCOPES.ownFleet,
  },
};

const build = (
  kind: ReferenceKind,
  value: number,
  applicability: MetricReference["applicability"] = "direct",
): MetricReference => ({
  kind,
  value,
  applicability,
  ...referenceKindMeta[kind],
});

/**
 * Dựng danh sách ngưỡng cho một chỉ số thuộc một loại đội xe.
 *
 * `fleetType` là `null` khi bộ lọc đang ở chế độ "tất cả loại đội xe". Trường
 * hợp đó ngưỡng nội bộ lấy theo đội xe đường dài (phần lớn đội xe), nhưng mọi
 * benchmark ngành bị đánh dấu `notApplicable` vì không có ngành nào áp dụng
 * chung cho cả ba loại hình.
 */
export const buildReferences = (
  metricId: string,
  fleetType: FleetType | null,
): MetricReference[] => {
  const effectiveFleet: FleetType = fleetType ?? "longHaul";
  const raw = REFERENCE_TABLE[effectiveFleet][metricId];
  if (!raw) return [];

  const isMixed = fleetType === null;
  const references: MetricReference[] = [
    build("internalTarget", raw.target),
  ];

  // Chỉ thêm benchmark ngành khi THẬT SỰ có nguồn ngành cho chỉ số này. Nếu
  // `industry` là null, giao diện buộc phải hiển thị "Internal Target".
  if (raw.industry !== null) {
    references.push(
      build(
        "industryBenchmark",
        raw.industry,
        isMixed ? "notApplicable" : "direct",
      ),
    );
  }

  if (raw.historical !== undefined) {
    references.push(build("historicalBaseline", raw.historical));
  }

  return references;
};
