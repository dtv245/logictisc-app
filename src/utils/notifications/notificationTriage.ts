/**
 * Phân tích mức độ quan trọng (severity) của thông báo và xác định màn hình +
 * lô hàng / đối tượng nghiệp vụ đang gặp vấn đề cần giải quyết khi người dùng ấn vào.
 */

import type { StatusTone } from "@/components/StatusTag";
import { routes } from "@/constants/routes";
import type { Notification } from "@/features/notifications/types";
import type {
  TmsApproval,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";

export type NotificationSeverity = "critical" | "high" | "medium" | "info";

export type NotificationFilterMode =
  | "all"
  | "unread"
  | "critical"
  | "high"
  | "medium"
  | "info";

export type NotificationCategory =
  | "load_risk"
  | "load_unassigned"
  | "ai_dispatch"
  | "fleet_tracking"
  | "billing"
  | "settlement"
  | "document"
  | "operations";

export type NotificationRecord = Notification & {
  severity?: string | null;
  priority?: string | null;
  type?: string | null;
  loadId?: string | null;
  shipmentId?: string | null;
  loadNumber?: number | string | null;
  decisionId?: string | null;
  sessionId?: string | null;
  tripId?: string | null;
  truckId?: string | null;
  driverId?: string | null;
  invoiceId?: string | null;
  settlementId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
};

export interface TriagedNotification {
  notification: NotificationRecord;
  severity: NotificationSeverity;
  severityRank: number;
  severityLabel: string;
  severityTone: StatusTone;
  category: NotificationCategory;
  categoryLabel: string;
  targetHref: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  screenLabel: string;
  actionLabel: string;
  issueSummary: string;
  linkedShipment?: TmsShipmentView;
  linkedApproval?: TmsApproval;
}

export interface NotificationTriageContext {
  shipments: readonly TmsShipmentView[];
  approvals: readonly TmsApproval[];
}

export interface NotificationSeverityCounts {
  all: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  info: number;
}

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const LOAD_NUMBER_PATTERNS = [
  /(?:load|lô\s*hàng|lô|đơn\s*hàng|đơn|shipment|ld)[-\s#:]*(\d{2,10})/i,
  /#(\d{2,10})\b/i,
];

const CRITICAL_KEYWORDS = [
  "khẩn cấp",
  "nghiêm trọng",
  "quá hạn",
  "trễ hạn",
  "chậm trễ",
  "tai nạn",
  "sự cố",
  "hỏng xe",
  "vi phạm",
  "bị chặn",
  "thất bại",
  "lỗi",
  "critical",
  "urgent",
  "emergency",
  "overdue",
  "delayed",
  "delay",
  "late",
  "accident",
  "incident",
  "breakdown",
  "violation",
  "hos_violation",
  "defect",
  "blocking",
  "failed",
  "error",
  "exception",
  "rejected",
];

const HIGH_KEYWORDS = [
  "cảnh báo",
  "rủi ro",
  "sắp đến hạn",
  "chưa phân công",
  "chưa gán",
  "thiếu xe",
  "thiếu tài xế",
  "chờ duyệt",
  "cần duyệt",
  "bảo trì",
  "đối soát",
  "chênh lệch",
  "thiếu chứng từ",
  "vấn đề",
  "warning",
  "at risk",
  "at-risk",
  "due soon",
  "unassigned",
  "pending approval",
  "needs attention",
  "action required",
  "maintenance",
  "reconciliation",
  "discrepancy",
  "missing",
  "issue",
  "problem",
];

const MEDIUM_KEYWORDS = [
  "đề xuất",
  "điều phối",
  "phân công",
  "cập nhật",
  "hóa đơn",
  "thanh toán",
  "quyết toán",
  "bảng lương",
  "chứng từ",
  "tài liệu",
  "chuyến đi",
  "yêu cầu",
  "suggestion",
  "dispatch",
  "assigned",
  "invoice",
  "payment",
  "settlement",
  "payroll",
  "document",
  "pod",
  "trip",
  "schedule",
  "request",
];

const includesAny = (haystack: string, needles: readonly string[]): boolean =>
  needles.some((needle) => haystack.includes(needle));

const extractUuid = (text: string): string | undefined =>
  text.match(UUID_REGEX)?.[0];

const extractLoadNumber = (text: string): number | undefined => {
  for (const pattern of LOAD_NUMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

export const severityMeta: Record<
  NotificationSeverity,
  { label: string; tone: StatusTone; rank: number }
> = {
  critical: { label: "Khẩn cấp", tone: "error", rank: 0 },
  high: { label: "Quan trọng", tone: "warning", rank: 1 },
  medium: { label: "Cần xử lý", tone: "processing", rank: 2 },
  info: { label: "Thông tin", tone: "neutral", rank: 3 },
};

export const categoryMeta: Record<NotificationCategory, string> = {
  load_risk: "Rủi ro lô hàng",
  load_unassigned: "Chưa phân công xe",
  ai_dispatch: "Đề xuất AI",
  fleet_tracking: "Đội xe & Vị trí",
  billing: "Hóa đơn & Thanh toán",
  settlement: "Quyết toán & Lương",
  document: "Chứng từ vận hành",
  operations: "Điều phối vận hành",
};

const detectCategory = (
  record: NotificationRecord,
  combinedText: string,
): NotificationCategory => {
  const entityType = (record.entityType ?? record.type ?? "").toLowerCase();
  if (
    record.decisionId ||
    record.sessionId ||
    entityType.includes("ai") ||
    entityType.includes("decision") ||
    includesAny(combinedText, [
      "đề xuất ai",
      "duyệt ai",
      "ai dispatch",
      "decision",
      "suggestion",
      "movement plan",
      "chờ duyệt",
    ])
  ) {
    return "ai_dispatch";
  }

  if (
    record.invoiceId ||
    entityType.includes("invoice") ||
    entityType.includes("payment") ||
    includesAny(combinedText, [
      "hóa đơn",
      "thanh toán",
      "công nợ",
      "invoice",
      "payment",
      "billing",
    ])
  ) {
    return "billing";
  }

  if (
    record.settlementId ||
    entityType.includes("settlement") ||
    entityType.includes("payroll") ||
    includesAny(combinedText, [
      "quyết toán",
      "bảng lương",
      "phiếu lương",
      "đối soát",
      "settlement",
      "payroll",
      "payslip",
      "reconciliation",
    ])
  ) {
    return "settlement";
  }

  if (
    entityType.includes("document") ||
    includesAny(combinedText, [
      "chứng từ",
      "tài liệu",
      " vận đơn ",
      "pod",
      "bol",
      "document",
    ])
  ) {
    return "document";
  }

  if (
    record.truckId ||
    entityType.includes("truck") ||
    entityType.includes("vehicle") ||
    includesAny(combinedText, [
      "vị trí xe",
      "theo dõi xe",
      "gps",
      "bảo trì",
      "phương tiện",
      "hos",
      "dvir",
      "tracking",
      "maintenance",
      "vehicle",
    ])
  ) {
    return "fleet_tracking";
  }

  if (
    includesAny(combinedText, [
      "chưa phân công",
      "chưa gán",
      "thiếu xe",
      "thiếu tài xế",
      "unassigned",
    ])
  ) {
    return "load_unassigned";
  }

  if (
    includesAny(combinedText, [
      "quá hạn",
      "trễ",
      "chậm",
      "rủi ro",
      "sự cố",
      "khẩn",
      "delayed",
      "delay",
      "overdue",
      "late",
      "at risk",
      "at-risk",
      "exception",
      "urgent",
    ])
  ) {
    return "load_risk";
  }

  return "operations";
};

const matchShipmentForNotification = (
  record: NotificationRecord,
  combinedText: string,
  category: NotificationCategory,
  index: number,
  shipments: readonly TmsShipmentView[],
): { shipment?: TmsShipmentView; explicitLoadId?: string; explicitLoadNumber?: number } => {
  const explicitLoadId =
    record.loadId?.trim() ||
    record.shipmentId?.trim() ||
    (record.entityType?.toLowerCase() === "load" ? record.entityId?.trim() : undefined);

  if (explicitLoadId) {
    const byId = shipments.find((item) => item.id === explicitLoadId);
    return { shipment: byId, explicitLoadId };
  }

  const explicitLoadNumber =
    record.loadNumber != null && !Number.isNaN(Number(record.loadNumber))
      ? Number(record.loadNumber)
      : extractLoadNumber(`${record.title} ${record.message}`);

  if (explicitLoadNumber !== undefined) {
    const byNum = shipments.find((item) => item.number === explicitLoadNumber);
    if (byNum) return { shipment: byNum, explicitLoadNumber };
    return { explicitLoadNumber };
  }

  const textUuid = extractUuid(`${record.title} ${record.message}`);
  if (textUuid) {
    const byUuid = shipments.find((item) => item.id.toLowerCase() === textUuid.toLowerCase());
    if (byUuid) return { shipment: byUuid, explicitLoadId: byUuid.id };
  }

  for (const shipment of shipments) {
    const loadName = shipment.name.trim().toLowerCase();
    const customer = shipment.customerName.trim().toLowerCase();
    if (
      (loadName.length >= 4 && combinedText.includes(loadName)) ||
      (customer.length >= 4 && customer !== "—" && combinedText.includes(customer))
    ) {
      return { shipment };
    }
  }

  if (
    category === "billing" ||
    category === "settlement" ||
    shipments.length === 0
  ) {
    return {};
  }

  const active = shipments.filter(
    (item) => item.status !== "delivered" && item.status !== "cancelled",
  );
  const pool = active.length > 0 ? active : shipments;
  const delayed = pool.filter((item) => item.risk === "delayed");
  const atRisk = pool.filter((item) => item.risk === "at_risk");
  const unassigned = pool.filter((item) => !item.assignedTruckId);
  const problematic = [
    ...delayed,
    ...atRisk,
    ...unassigned.filter((item) => item.risk === "none"),
  ];

  if (category === "load_risk") {
    const riskPool = [...delayed, ...atRisk];
    if (riskPool.length > 0) {
      return { shipment: riskPool[index % riskPool.length] };
    }
  }

  if (category === "load_unassigned" && unassigned.length > 0) {
    return { shipment: unassigned[index % unassigned.length] };
  }

  if (problematic.length > 0) {
    return { shipment: problematic[index % problematic.length] };
  }

  return { shipment: pool[index % pool.length] };
};

const deriveSeverity = (
  record: NotificationRecord,
  combinedText: string,
  category: NotificationCategory,
  linkedShipment: TmsShipmentView | undefined,
): NotificationSeverity => {
  const rawSeverity = (record.severity ?? record.priority ?? "")
    .toString()
    .trim()
    .toLowerCase();

  if (
    ["critical", "urgent", "emergency", "p0", "p1", "error", "danger"].includes(
      rawSeverity,
    )
  ) {
    return "critical";
  }
  if (["high", "warning", "warn", "p2", "at_risk"].includes(rawSeverity)) {
    return "high";
  }
  if (["medium", "normal", "action", "p3"].includes(rawSeverity)) {
    return "medium";
  }
  if (["low", "info", "informational", "p4"].includes(rawSeverity)) {
    return "info";
  }

  if (
    includesAny(combinedText, CRITICAL_KEYWORDS) ||
    category === "load_risk" ||
    linkedShipment?.risk === "delayed"
  ) {
    return "critical";
  }

  if (
    includesAny(combinedText, HIGH_KEYWORDS) ||
    category === "load_unassigned" ||
    category === "ai_dispatch" ||
    linkedShipment?.risk === "at_risk"
  ) {
    return "high";
  }

  if (
    includesAny(combinedText, MEDIUM_KEYWORDS) ||
    !record.isRead ||
    (linkedShipment && !linkedShipment.assignedTruckId)
  ) {
    return "medium";
  }

  return "info";
};

const describeLoadIssue = (shipment: TmsShipmentView): string => {
  const lane = `${shipment.originCity} → ${shipment.destinationCity}`;
  if (shipment.risk === "delayed") {
    return `Lô #${shipment.number} (${lane}) đang quá hạn giao hàng — cần xử lý điều phối ngay`;
  }
  if (shipment.risk === "at_risk") {
    return `Lô #${shipment.number} (${lane}) có rủi ro trễ hạn trong khung cảnh báo`;
  }
  if (!shipment.assignedTruckId) {
    return `Lô #${shipment.number} (${lane}) chưa được phân công xe và tài xế`;
  }
  return `Lô #${shipment.number} · ${shipment.customerName} (${lane})`;
};

export function triageNotification(
  notification: NotificationRecord,
  index: number,
  context: NotificationTriageContext,
): TriagedNotification {
  const combinedText = `${notification.title ?? ""} ${notification.message ?? ""}`
    .trim()
    .toLowerCase();
  const category = detectCategory(notification, combinedText);
  const { shipment: linkedShipment, explicitLoadId, explicitLoadNumber } =
    matchShipmentForNotification(
      notification,
      combinedText,
      category,
      index,
      context.shipments,
    );

  const linkedApproval =
    category === "ai_dispatch"
      ? (linkedShipment
          ? context.approvals.find((a) => a.load?.id === linkedShipment.id)
          : undefined) ??
        (context.approvals.length > 0
          ? context.approvals[index % context.approvals.length]
          : undefined)
      : linkedShipment
        ? context.approvals.find((a) => a.load?.id === linkedShipment.id)
        : undefined;

  const effectiveShipment = linkedApproval?.load ?? linkedShipment;
  const severity = deriveSeverity(
    notification,
    combinedText,
    category,
    effectiveShipment,
  );
  const meta = severityMeta[severity];

  if (notification.actionUrl?.trim()) {
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: notification.actionUrl.trim(),
      screenLabel: "Màn hình xử lý sự cố",
      actionLabel: "Đi tới xử lý ngay",
      issueSummary: effectiveShipment
        ? describeLoadIssue(effectiveShipment)
        : notification.message,
      ...(effectiveShipment ? { linkedShipment: effectiveShipment } : {}),
      ...(linkedApproval ? { linkedApproval } : {}),
    };
  }

  if (category === "ai_dispatch") {
    const decisionId =
      notification.decisionId?.trim() || linkedApproval?.suggestion.decisionId;
    const targetHref = decisionId
      ? `${routes.tmsFlow.approvals}?decision=${encodeURIComponent(decisionId)}`
      : effectiveShipment
        ? `${routes.tmsFlow.approvals}?load=${encodeURIComponent(effectiveShipment.id)}`
        : routes.tmsFlow.approvals;
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref,
      ...(effectiveShipment
        ? {
            secondaryHref: `/tms/shipments/${encodeURIComponent(effectiveShipment.id)}`,
            secondaryLabel: `Chi tiết lô #${effectiveShipment.number}`,
          }
        : {}),
      screenLabel: effectiveShipment
        ? `Duyệt điều phối AI · Lô #${effectiveShipment.number}`
        : "Màn Duyệt điều phối AI",
      actionLabel: effectiveShipment
        ? `Duyệt đề xuất lô #${effectiveShipment.number}`
        : "Mở duyệt điều phối AI",
      issueSummary: effectiveShipment
        ? describeLoadIssue(effectiveShipment)
        : "Có đề xuất phân công xe từ AI đang chờ xem xét và phê duyệt",
      ...(effectiveShipment ? { linkedShipment: effectiveShipment } : {}),
      ...(linkedApproval ? { linkedApproval } : {}),
    };
  }

  if (category === "billing") {
    const invoiceUuid =
      notification.invoiceId?.trim() || extractUuid(`${notification.title} ${notification.message}`);
    const targetHref = invoiceUuid
      ? `/invoices/show/${encodeURIComponent(invoiceUuid)}`
      : routes.resources.invoices.list;
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref,
      screenLabel: "Màn Hóa đơn & Thanh toán",
      actionLabel: "Kiểm tra hóa đơn",
      issueSummary: "Kiểm tra trạng thái hóa đơn, công nợ và lịch sử thanh toán",
    };
  }

  if (category === "settlement") {
    const isReconciliation = includesAny(combinedText, [
      "đối soát",
      "chênh lệch",
      "reconciliation",
    ]);
    const isPayroll = includesAny(combinedText, ["bảng lương", "payroll"]);
    const settlementUuid =
      notification.settlementId?.trim() ||
      extractUuid(`${notification.title} ${notification.message}`);
    const targetHref = isReconciliation
      ? routes.payrollReconciliation
      : isPayroll
        ? routes.payroll
        : settlementUuid
          ? `/settlements/${encodeURIComponent(settlementUuid)}`
          : routes.resources.settlements.list;
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref,
      screenLabel: isReconciliation
        ? "Màn Đối soát bảng lương"
        : isPayroll
          ? "Màn Bảng lương"
          : "Màn Quyết toán tài xế",
      actionLabel: "Mở màn quyết toán",
      issueSummary: "Kiểm tra và xử lý quyết toán / đối soát chi phí vận hành",
    };
  }

  if (category === "fleet_tracking") {
    if (effectiveShipment) {
      return {
        notification,
        severity,
        severityRank: meta.rank,
        severityLabel: meta.label,
        severityTone: meta.tone,
        category,
        categoryLabel: categoryMeta[category],
        targetHref: `${routes.tmsFlow.dispatch}?shipment=${encodeURIComponent(effectiveShipment.id)}`,
        secondaryHref: routes.tmsFlow.liveTracking,
        secondaryLabel: "Theo dõi xe trực tiếp",
        screenLabel: `Điều phối & Theo dõi xe · Lô #${effectiveShipment.number}`,
        actionLabel: `Xử lý lô #${effectiveShipment.number}`,
        issueSummary: describeLoadIssue(effectiveShipment),
        linkedShipment: effectiveShipment,
      };
    }
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: routes.tmsFlow.liveTracking,
      screenLabel: "Màn Theo dõi xe trực tiếp",
      actionLabel: "Kiểm tra đội xe",
      issueSummary: "Kiểm tra vị trí phương tiện và trạng thái vận hành trên bản đồ",
    };
  }

  if (category === "document") {
    if (effectiveShipment) {
      return {
        notification,
        severity,
        severityRank: meta.rank,
        severityLabel: meta.label,
        severityTone: meta.tone,
        category,
        categoryLabel: categoryMeta[category],
        targetHref: `/tms/shipments/${encodeURIComponent(effectiveShipment.id)}`,
        secondaryHref: `${routes.tmsFlow.dispatch}?shipment=${encodeURIComponent(effectiveShipment.id)}`,
        secondaryLabel: "Mở trong Điều phối",
        screenLabel: `Chi tiết lô hàng #${effectiveShipment.number}`,
        actionLabel: `Xem lô #${effectiveShipment.number}`,
        issueSummary: describeLoadIssue(effectiveShipment),
        linkedShipment: effectiveShipment,
      };
    }
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: routes.resources.documents.list,
      screenLabel: "Màn Chứng từ vận hành",
      actionLabel: "Kiểm tra chứng từ",
      issueSummary: "Kiểm tra hồ sơ, chứng từ giao nhận (POD/BOL) cần bổ sung",
    };
  }

  if (effectiveShipment) {
    const filterParam =
      effectiveShipment.risk !== "none" || category === "load_risk"
        ? "filter=at-risk&"
        : !effectiveShipment.assignedTruckId || category === "load_unassigned"
          ? "filter=unassigned&"
          : "";
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: `${routes.tmsFlow.dispatch}?${filterParam}shipment=${encodeURIComponent(effectiveShipment.id)}`,
      secondaryHref: `/tms/shipments/${encodeURIComponent(effectiveShipment.id)}`,
      secondaryLabel: `Chi tiết lô #${effectiveShipment.number}`,
      screenLabel: `Màn Điều phối · Lô #${effectiveShipment.number} (${effectiveShipment.originCity} → ${effectiveShipment.destinationCity})`,
      actionLabel: `Giải quyết lô #${effectiveShipment.number}`,
      issueSummary: describeLoadIssue(effectiveShipment),
      linkedShipment: effectiveShipment,
      ...(linkedApproval ? { linkedApproval } : {}),
    };
  }

  if (explicitLoadId) {
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: `${routes.tmsFlow.dispatch}?shipment=${encodeURIComponent(explicitLoadId)}`,
      secondaryHref: `/tms/shipments/${encodeURIComponent(explicitLoadId)}`,
      secondaryLabel: "Chi tiết lô hàng",
      screenLabel: "Màn Điều phối · Lô hàng cần xử lý",
      actionLabel: "Mở lô hàng đang gặp vấn đề",
      issueSummary: `Lô hàng (${explicitLoadId.slice(0, 8)}…) cần kiểm tra điều phối`,
    };
  }

  if (explicitLoadNumber !== undefined) {
    return {
      notification,
      severity,
      severityRank: meta.rank,
      severityLabel: meta.label,
      severityTone: meta.tone,
      category,
      categoryLabel: categoryMeta[category],
      targetHref: `${routes.tmsFlow.dispatch}?q=${encodeURIComponent(String(explicitLoadNumber))}`,
      screenLabel: `Màn Điều phối · Lô #${explicitLoadNumber}`,
      actionLabel: `Giải quyết lô #${explicitLoadNumber}`,
      issueSummary: `Lô hàng #${explicitLoadNumber} đang cần kiểm tra và điều phối`,
    };
  }

  const defaultFilter =
    category === "load_risk" || severity === "critical"
      ? "?filter=at-risk"
      : category === "load_unassigned"
        ? "?filter=unassigned"
        : "";

  return {
    notification,
    severity,
    severityRank: meta.rank,
    severityLabel: meta.label,
    severityTone: meta.tone,
    category,
    categoryLabel: categoryMeta[category],
    targetHref: `${routes.tmsFlow.dispatch}${defaultFilter}`,
    screenLabel:
      defaultFilter === "?filter=at-risk"
        ? "Màn Điều phối · Hàng đợi rủi ro"
        : defaultFilter === "?filter=unassigned"
          ? "Màn Điều phối · Chưa phân công"
          : "Màn Điều phối vận hành",
    actionLabel: "Mở điều phối giải quyết",
    issueSummary:
      defaultFilter === "?filter=at-risk"
        ? "Kiểm tra các lô hàng đang quá hạn hoặc có rủi ro trễ giờ giao"
        : defaultFilter === "?filter=unassigned"
          ? "Phân công xe và tài xế cho các lô hàng đang chờ"
          : "Mở bảng điều phối để kiểm tra và xử lý lô hàng",
  };
}

export function summarizeTriagedNotifications(
  items: readonly TriagedNotification[],
): NotificationSeverityCounts {
  return {
    all: items.length,
    unread: items.filter((item) => !item.notification.isRead).length,
    critical: items.filter((item) => item.severity === "critical").length,
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    info: items.filter((item) => item.severity === "info").length,
  };
}
