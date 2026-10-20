import type { ReactNode } from "react";

export type Tone = "neutral" | "positive" | "negative" | "warning" | "ai" | "info";

export interface StatBlockProps {
  label: string;
  value: ReactNode;
  caption?: { text: string; tone: Tone; icon?: ReactNode };
  tone?: Tone;
  state?: "ready" | "loading" | "unavailable";
  className?: string;
}

export interface KpiItemProps {
  label: string;
  value: number | null;
  delta?: { text: string; tone: Tone };
  tag?: { text: string; tone: Tone };
  context?: string;
  href?: string;
  state?: "ready" | "loading" | "error" | "unavailable";
  unit?: string;
  onRetry?: () => void;
}

export interface ProposedAction {
  id: string;
  kind: "reassign" | "reroute" | "notify";
  title: string;
  hint?: string;
  decisionIds?: string[];
}

export interface TimelineBlockModel {
  id: string;
  driverId: string;
  startAt: string;
  endAt: string;
  kind: "scheduled" | "active" | "delayed" | "ai-suggested" | "overrun";
  label: string;
  decisionId?: string;
  delayMinutes?: number;
}
