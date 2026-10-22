/** Presentation metadata and formatters for the TMS screens (literal English copy). */

import type {
  TmsAiSuggestionMetric,
  TmsOperationalStatus,
  TmsRiskLevel,
} from "@/types/tms-flow/tmsFlow.types";

type PresentationTone = "success" | "processing" | "warning" | "error" | "neutral";

export const operationalStatusMeta: Record<
  TmsOperationalStatus,
  { label: string; tone: PresentationTone }
> = {
  open: { label: "Open", tone: "neutral" },
  assigned: { label: "Assigned", tone: "processing" },
  dispatched: { label: "Dispatched", tone: "processing" },
  in_transit: { label: "In transit", tone: "processing" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const riskMeta: Record<
  TmsRiskLevel,
  { label: string; tone: PresentationTone }
> = {
  none: { label: "On plan", tone: "neutral" },
  at_risk: { label: "At risk", tone: "warning" },
  delayed: { label: "Delayed", tone: "error" },
};

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
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
  distance == null ? "—" : `${distance.toLocaleString("en-US")} mi`;

export const formatTmsMoney = (
  amount?: number | null,
  currency?: string | null,
): string => {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currency ?? ""}`.trim();
  }
};

export const formatTmsPercent = (ratio?: number | null): string =>
  ratio == null ? "—" : `${Math.round(ratio * 100)}%`;

/** Readable message for a failed request without leaking a response body. */
export const describeTmsError = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : "The request could not be completed.";

export const describeSuggestionMetrics = (
  metrics?: TmsAiSuggestionMetric,
): string[] => {
  if (!metrics) return [];
  const rows: string[] = [];
  if (metrics.deadheadMiles != null) rows.push(`Deadhead ${formatTmsDistance(metrics.deadheadMiles)}`);
  if (metrics.totalDistanceMiles != null) {
    rows.push(`Trip ${formatTmsDistance(metrics.totalDistanceMiles)}`);
  }
  if (metrics.onTimeProbability != null) {
    rows.push(`On-time ${formatTmsPercent(metrics.onTimeProbability)}`);
  }
  if (metrics.expectedMarginRatio != null) {
    rows.push(`Margin ${formatTmsPercent(metrics.expectedMarginRatio)}`);
  }
  if (metrics.hosRemainingHours != null) {
    rows.push(`HOS ${metrics.hosRemainingHours.toFixed(1)} h`);
  }
  return rows;
};
