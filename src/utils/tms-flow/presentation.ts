/** Metadata and formatters for Vietnamese TMS screens. */

import type {
  TmsAiSuggestionMetric,
  TmsLoadRiskReason,
  TmsOperationalStatus,
  TmsRiskLevel,
} from "@/types/tms-flow/tmsFlow.types";
import { formatDistance } from "@/utils/distance";

type PresentationTone = "success" | "processing" | "warning" | "error" | "neutral";

export const operationalStatusMeta: Record<
  TmsOperationalStatus,
  { label: string; tone: PresentationTone }
> = {
  open: { label: "Mới", tone: "neutral" },
  assigned: { label: "Đã phân công", tone: "processing" },
  dispatched: { label: "Đã điều phối", tone: "processing" },
  in_transit: { label: "Đang vận chuyển", tone: "processing" },
  delivered: { label: "Đã giao", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
};

export const riskMeta: Record<
  TmsRiskLevel,
  { label: string; tone: PresentationTone }
> = {
  none: { label: "Đúng kế hoạch", tone: "neutral" },
  at_risk: { label: "Có rủi ro", tone: "warning" },
  delayed: { label: "Quá hạn", tone: "error" },
};

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const safeDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const formatTmsDateTime = (value?: string | null, fallback = "—"): string => {
  const date = safeDate(value);
  return date ? dateTimeFormat.format(date) : fallback;
};

export const formatTmsDate = (value?: string | null, fallback = "—"): string => {
  const date = safeDate(value);
  return date ? dateFormat.format(date) : fallback;
};

export const formatTmsDistance = (distance?: number | null): string =>
  formatDistance(distance, "mi", { locale: "vi-VN" });

export const formatTmsMoney = (
  amount?: number | null,
  currency?: string | null,
): string => {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency ?? ""}`.trim();
  }
};

export const formatTmsPercent = (ratio?: number | null): string =>
  ratio == null ? "—" : `${Math.round(ratio * 100)}%`;

/** Readable message for a failed request without leaking a response body. */
export const describeTmsError = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : "Không thể hoàn tất yêu cầu.";

export const describeSuggestionMetrics = (
  metrics?: TmsAiSuggestionMetric,
): string[] => {
  if (!metrics) return [];
  const rows: string[] = [];
  if (metrics.deadheadMiles != null) rows.push(`Quãng đường rỗng ${formatTmsDistance(metrics.deadheadMiles)}`);
  if (metrics.totalDistanceMiles != null) {
    rows.push(`Tổng quãng đường ${formatTmsDistance(metrics.totalDistanceMiles)}`);
  }
  if (metrics.onTimeProbability != null) {
    rows.push(`Đúng khung giờ ${formatTmsPercent(metrics.onTimeProbability)}`);
  }
  if (metrics.expectedMarginRatio != null) {
    rows.push(`Biên lợi nhuận ${formatTmsPercent(metrics.expectedMarginRatio)}`);
  }
  if (metrics.hosRemainingHours != null) {
    rows.push(`Giờ lái còn lại ${metrics.hosRemainingHours.toFixed(1)} giờ`);
  }
  return rows;
};

export const formatTmsRiskReason = (reason: TmsLoadRiskReason): string => {
  switch (reason.code) {
    case "OPEN_EXCEPTION": {
      const detail = [reason.exceptionType, reason.exceptionReason]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(": ");
      return detail ? `Sự cố chưa xử lý (${detail})` : "Sự cố chưa xử lý";
    }
    case "PICKUP_OVERDUE":
      return reason.dueAt
        ? `Quá hạn lấy hàng (${formatTmsDateTime(reason.dueAt)})`
        : "Quá hạn lấy hàng chưa ghi nhận";
    case "DELIVERY_OVERDUE":
      return reason.dueAt
        ? `Quá hạn giao hàng (${formatTmsDateTime(reason.dueAt)})`
        : "Quá hạn giao hàng chưa hoàn tất";
    default:
      return reason.message;
  }
};
