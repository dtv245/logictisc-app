import type { TmsAiSuggestion } from "@/types/tms-flow/tmsFlow.types";

export type SuggestionAssessmentLevel = "verySuitable" | "suitable" | "consider" | "unknown";

/**
 * Provisional display bands only. They have not been calibrated against
 * production dispatch outcomes and should be revisited with operational data.
 */
export const SUGGESTION_SCORE_THRESHOLDS = {
  verySuitable: 80,
  suitable: 60,
} as const;

export function assessSuggestionScore(
  score: TmsAiSuggestion["score"],
): SuggestionAssessmentLevel {
  if (score == null || score === "") return "unknown";
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "unknown";
  if (numericScore >= SUGGESTION_SCORE_THRESHOLDS.verySuitable) return "verySuitable";
  if (numericScore >= SUGGESTION_SCORE_THRESHOLDS.suitable) return "suitable";
  return "consider";
}

export function assessSuggestionConfidence(
  confidence?: string | null,
): SuggestionAssessmentLevel {
  switch (confidence?.trim().toUpperCase()) {
    case "HIGH":
      return "verySuitable";
    case "MEDIUM":
      return "suitable";
    case "LOW":
      return "consider";
    default:
      return "unknown";
  }
}

export function summarizeSuggestionReasoning(reasoning: string): string[] {
  return reasoning
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
}
