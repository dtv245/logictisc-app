/**
 * Rule engine sinh kết luận nhanh cho panel "Kết luận nhanh".
 *
 * Hai yêu cầu bắt buộc từ brief, cả hai đều được cài đặt thật ở đây chứ không
 * chỉ mô tả:
 *
 * 1. Các cảnh báo CÙNG NGUYÊN NHÂN GỐC phải được gộp thành một kết luận. Bốn
 *    chỉ số bảo trì (chi phí bảo trì tăng, downtime tăng, PM compliance giảm,
 *    số lần hỏng xe tăng) là bốn triệu chứng của một vấn đề, không phải bốn
 *    vấn đề. Việc gộp được thực hiện bằng trường `cluster`.
 *
 * 2. Xếp hạng theo TÁC ĐỘNG, không theo mức độ đỏ. Một chỉ số đỏ nhưng ảnh
 *    hưởng nhỏ phải nằm dưới một chỉ số vàng ảnh hưởng lớn. `impactScore` là
 *    tiền quy đổi, `order` chỉ đóng vai trò phá hoà.
 */

import type {
  InsightModel,
  InsightSeverity,
  MetricDefinition,
} from "@/types/executive.types";

/** Giá trị chỉ số theo id, chỉ gồm những chỉ số đã có dữ liệu thật. */
export type MetricValueMap = Readonly<Record<string, number | undefined>>;

interface RuleContext {
  values: MetricValueMap;
  /** Doanh thu kỳ hiện tại, dùng để quy đổi tác động ra tiền. */
  revenue?: number;
  /** Tổng số dặm kỳ hiện tại, dùng để quy đổi tác động ra tiền. */
  miles?: number;
  /** Tỷ trọng doanh thu của Top 3 khách hàng, nếu có. */
  top3Share?: number;
  /** Tỷ trọng doanh thu của khách hàng lớn nhất, nếu có. */
  top1Share?: number;
  definitions: readonly MetricDefinition[];
}

interface Rule {
  id: string;
  /** Nhóm nguyên nhân gốc. Các rule cùng cluster sẽ gộp thành một kết luận. */
  cluster: string;
  severity: InsightSeverity;
  /**
   * Thứ tự ưu tiên theo góc nhìn, 1 = lợi nhuận … 4 = dịch vụ.
   * Chỉ dùng để phá hoà giữa các điểm tác động xấp xỉ nhau.
   */
  order: 1 | 2 | 3 | 4;
  /** Trả về true khi rule này đang có hiệu lực. */
  when: (ctx: RuleContext) => boolean;
  /** Tác động quy đổi ra tiền mỗi năm. */
  score: (ctx: RuleContext) => number;
  /** Locale key của phần cảnh báo riêng của rule này. */
  signalKey: string;
}

const num = (value: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Tỉ lệ vượt ngưỡng, đã kẹp để không nổ ra vô cực khi mẫu nhỏ. */
const overshoot = (actual: number, target: number, higherIsBetter: boolean) => {
  if (!target) return 0;
  const raw = higherIsBetter
    ? (target - actual) / target
    : (actual - target) / target;
  return Math.max(0, Math.min(1, raw));
};

export const RULES: readonly Rule[] = [
  // --- Nhóm chi phí ------------------------------------------------------
  {
    id: "cpmOverTarget",
    cluster: "cost",
    severity: "warning",
    order: 1,
    signalKey: "executive.insights.signals.cpmOverTarget",
    when: ({ values }) => {
      const cpm = num(values.costPerMile);
      const target = num(values.costPerMileTarget);
      return cpm !== undefined && target !== undefined && cpm > target;
    },
    score: ({ values, miles }) => {
      const cpm = num(values.costPerMile) ?? 0;
      const target = num(values.costPerMileTarget) ?? 0;
      return (cpm - target) * (miles ?? 0);
    },
  },
  {
    id: "spreadNarrowing",
    cluster: "margin",
    severity: "critical",
    order: 1,
    signalKey: "executive.insights.signals.spreadNarrowing",
    when: ({ values }) => {
      const spread = num(values.contributionSpread);
      const target = num(values.contributionSpreadTarget);
      return spread !== undefined && target !== undefined && spread < target;
    },
    score: ({ values, miles }) => {
      const spread = num(values.contributionSpread) ?? 0;
      const target = num(values.contributionSpreadTarget) ?? 0;
      return (target - spread) * (miles ?? 0);
    },
  },

  // --- Nhóm công suất ----------------------------------------------------
  {
    id: "utilizationLow",
    cluster: "capacity",
    severity: "warning",
    order: 2,
    signalKey: "executive.insights.signals.utilizationLow",
    when: ({ values }) => {
      const actual = num(values.fleetUtilization);
      const target = num(values.fleetUtilizationTarget);
      return actual !== undefined && target !== undefined && actual < target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.fleetUtilization) ?? 0,
        num(values.fleetUtilizationTarget) ?? 0,
        true,
      ) * (revenue ?? 0) * 0.35,
  },
  {
    id: "deadheadHigh",
    cluster: "capacity",
    severity: "warning",
    order: 2,
    signalKey: "executive.insights.signals.deadheadHigh",
    when: ({ values }) => {
      const loaded = num(values.loadedMiles);
      const target = num(values.loadedMilesTarget);
      return loaded !== undefined && target !== undefined && loaded < target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.loadedMiles) ?? 0,
        num(values.loadedMilesTarget) ?? 0,
        true,
      ) * (revenue ?? 0) * 0.4,
  },

  // --- Nhóm bảo trì: bốn triệu chứng, MỘT nguyên nhân gốc -----------------
  // Bốn rule dưới đây chia cùng `cluster: "maintenance"`. `runRules` gộp chúng
  // thành đúng một kết luận, đúng ví dụ trong brief.
  {
    id: "maintenanceCostUp",
    cluster: "maintenance",
    severity: "critical",
    order: 1,
    signalKey: "executive.insights.signals.maintenanceCostUp",
    when: ({ values }) => {
      const actual = num(values.maintenanceCostPerMile);
      const target = num(values.maintenanceCostPerMileTarget);
      return actual !== undefined && target !== undefined && actual > target;
    },
    score: ({ values, miles }) => {
      const actual = num(values.maintenanceCostPerMile) ?? 0;
      const target = num(values.maintenanceCostPerMileTarget) ?? 0;
      return (actual - target) * (miles ?? 0);
    },
  },
  {
    id: "unplannedDowntimeUp",
    cluster: "maintenance",
    severity: "critical",
    order: 1,
    signalKey: "executive.insights.signals.unplannedDowntimeUp",
    when: ({ values }) => {
      const actual = num(values.unplannedDowntime);
      const target = num(values.unplannedDowntimeTarget);
      return actual !== undefined && target !== undefined && actual > target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.unplannedDowntime) ?? 0,
        num(values.unplannedDowntimeTarget) ?? 0,
        false,
      ) * (revenue ?? 0) * 0.5,
  },
  {
    id: "pmComplianceLow",
    cluster: "maintenance",
    severity: "critical",
    order: 1,
    signalKey: "executive.insights.signals.pmComplianceLow",
    when: ({ values }) => {
      const actual = num(values.pmCompliance);
      const target = num(values.pmComplianceTarget);
      return actual !== undefined && target !== undefined && actual < target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.pmCompliance) ?? 0,
        num(values.pmComplianceTarget) ?? 0,
        true,
      ) * (revenue ?? 0) * 0.45,
  },
  {
    id: "breakdownsUp",
    cluster: "maintenance",
    severity: "warning",
    order: 1,
    signalKey: "executive.insights.signals.breakdownsUp",
    when: ({ values }) => {
      const actual = num(values.breakdownsPer100k);
      const target = num(values.breakdownsPer100kTarget);
      return actual !== undefined && target !== undefined && actual > target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.breakdownsPer100k) ?? 0,
        num(values.breakdownsPer100kTarget) ?? 0,
        false,
      ) * (revenue ?? 0) * 0.25,
  },

  // --- Nhóm dịch vụ ------------------------------------------------------
  {
    id: "onTimeLow",
    cluster: "service",
    severity: "warning",
    order: 3,
    signalKey: "executive.insights.signals.onTimeLow",
    when: ({ values }) => {
      const actual = num(values.onTimeDelivery);
      const target = num(values.onTimeDeliveryTarget);
      return actual !== undefined && target !== undefined && actual < target;
    },
    score: ({ values, revenue }) =>
      overshoot(
        num(values.onTimeDelivery) ?? 0,
        num(values.onTimeDeliveryTarget) ?? 0,
        true,
      ) * (revenue ?? 0) * 0.3,
  },
  {
    id: "dsoHigh",
    cluster: "cash",
    severity: "warning",
    order: 3,
    signalKey: "executive.insights.signals.dsoHigh",
    when: ({ values }) => {
      const actual = num(values.dso);
      const target = num(values.dsoTarget);
      return actual !== undefined && target !== undefined && actual > target;
    },
    score: ({ values, revenue }) =>
      overshoot(num(values.dso) ?? 0, num(values.dsoTarget) ?? 0, false) *
      (revenue ?? 0) *
      0.06,
  },

  // --- Nhóm khách hàng ---------------------------------------------------
  {
    id: "concentrationHigh",
    cluster: "customer",
    severity: "critical",
    order: 2,
    signalKey: "executive.insights.signals.concentrationHigh",
    when: ({ top3Share, top1Share }) =>
      (top3Share !== undefined && top3Share > 55) ||
      (top1Share !== undefined && top1Share > 30),
    score: ({ top3Share, top1Share, revenue }) => {
      const byTop3 = overshoot(top3Share ?? 0, 55, false);
      const byTop1 = overshoot(top1Share ?? 0, 30, false);
      return Math.max(byTop3, byTop1) * (revenue ?? 0) * 0.55;
    },
  },
  {
    id: "serviceStrong",
    cluster: "service",
    severity: "good",
    order: 4,
    signalKey: "executive.insights.signals.serviceStrong",
    when: ({ values }) => {
      const otd = num(values.onTimeDelivery);
      const target = num(values.onTimeDeliveryTarget);
      return otd !== undefined && target !== undefined && otd >= target;
    },
    score: () => 0,
  },
];

/** Tiêu đề của một kết luận, theo nhóm nguyên nhân gốc. */
const CLUSTER_TITLE_KEYS: Record<string, string> = {
  cost: "executive.insights.titles.cost",
  margin: "executive.insights.titles.margin",
  capacity: "executive.insights.titles.capacity",
  maintenance: "executive.insights.titles.maintenance",
  service: "executive.insights.titles.service",
  cash: "executive.insights.titles.cash",
  customer: "executive.insights.titles.customer",
};

const CLUSTER_CAUSE_KEYS: Record<string, string> = {
  cost: "executive.insights.causes.cost",
  margin: "executive.insights.causes.margin",
  capacity: "executive.insights.causes.capacity",
  maintenance: "executive.insights.causes.maintenance",
  service: "executive.insights.causes.service",
  cash: "executive.insights.causes.cash",
  customer: "executive.insights.causes.customer",
};

const CLUSTER_IMPACT_KEYS: Record<string, string> = {
  cost: "executive.insights.impacts.cost",
  margin: "executive.insights.impacts.margin",
  capacity: "executive.insights.impacts.capacity",
  maintenance: "executive.insights.impacts.maintenance",
  service: "executive.insights.impacts.service",
  cash: "executive.insights.impacts.cash",
  customer: "executive.insights.impacts.customer",
};

const severityRank: Record<InsightSeverity, number> = {
  critical: 3,
  warning: 2,
  good: 1,
};

/** Số kết luận tối đa hiển thị — brief giới hạn 5 dòng. */
export const MAX_INSIGHTS = 5;

/**
 * Chạy toàn bộ rule, gộp theo nhóm nguyên nhân gốc, rồi xếp theo tác động.
 *
 * Mỗi rule được bọc riêng: một rule lỗi không được phép làm sập cả panel. Đây
 * là bài học từ lỗi đã gặp ở bản dựng thử — một tham chiếu sai trong hàm tính
 * tác động đã làm trắng toàn bộ tầng KPI.
 */
export const runRules = (ctx: RuleContext): InsightModel[] => {
  const fired: {
    rule: Rule;
    score: number;
    order: Rule["order"];
  }[] = [];

  RULES.forEach((rule) => {
    try {
      if (!rule.when(ctx)) return;
      const score = rule.score(ctx);
      fired.push({
        rule,
        score: Number.isFinite(score) ? score : 0,
        order: rule.order,
      });
    } catch (error) {
      // Một rule hỏng không được kéo sập panel kết luận.
      console.warn(`[executive] rule "${rule.id}" failed`, error);
    }
  });

  // Gộp theo nhóm nguyên nhân gốc TRƯỚC khi xếp hạng.
  const byCluster = new Map<string, typeof fired>();
  fired.forEach((item) => {
    const bucket = byCluster.get(item.rule.cluster);
    if (bucket) bucket.push(item);
    else byCluster.set(item.rule.cluster, [item]);
  });

  const merged: InsightModel[] = [];
  byCluster.forEach((items, cluster) => {
    const impactScore = items.reduce((sum, item) => sum + item.score, 0);
    const severity = items.reduce<InsightSeverity>(
      (worst, item) =>
        severityRank[item.rule.severity] > severityRank[worst]
          ? item.rule.severity
          : worst,
      "good",
    );
    const order = items.reduce<number>(
      (best, item) => Math.min(best, item.order),
      4,
    );
    const signals = items.map((item) => item.rule.signalKey);

    merged.push({
      id: cluster,
      cluster,
      severity,
      titleKey: CLUSTER_TITLE_KEYS[cluster] ?? cluster,
      causeKey: CLUSTER_CAUSE_KEYS[cluster] ?? cluster,
      impactKey: CLUSTER_IMPACT_KEYS[cluster] ?? cluster,
      impactScore,
      mergedFromKeys: signals,
      // `order` chỉ phá hoà; trọng số nhỏ để không lấn át tác động thật.
      ...{ _order: order },
    } as InsightModel);
  });

  const withOrder = merged as (InsightModel & { _order: number })[];

  // Xếp theo TÁC ĐỘNG. Kết luận tích cực (điểm 0) luôn xuống cuối.
  withOrder.sort((a, b) => {
    const scoreA = a.impactScore * (1 + (4 - a._order) * 0.06);
    const scoreB = b.impactScore * (1 + (4 - b._order) * 0.06);
    return scoreB - scoreA;
  });

  return withOrder.slice(0, MAX_INSIGHTS);
};
