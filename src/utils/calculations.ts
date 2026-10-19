import type { DriverRankingWeights } from "../types";

export interface DeltaResult {
  delta: number;
  percent: number | null;
}

/**
 * Calculate absolute delta and percentage change compared to previous period.
 */
export const calculateDelta = (
  current: number | null | undefined,
  previous: number | null | undefined,
): DeltaResult => {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    isNaN(current) ||
    isNaN(previous)
  ) {
    return { delta: 0, percent: null };
  }

  const delta = current - previous;
  if (previous === 0) {
    return { delta, percent: null };
  }

  const percent = Number(((delta / Math.abs(previous)) * 100).toFixed(1));
  return { delta, percent };
};

/**
 * Calculate net profit and gross margin percentage.
 */
export const calculateProfit = (
  revenue: number | null | undefined,
  cost: number | null | undefined,
): { profit: number; marginPercent: number | null } => {
  const rev = typeof revenue === "number" && !isNaN(revenue) ? revenue : 0;
  const cst = typeof cost === "number" && !isNaN(cost) ? cost : 0;

  const profit = rev - cst;
  const marginPercent =
    rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : null;

  return { profit, marginPercent };
};

/**
 * Calculate driver composite score based on configured weights.
 * Formula:
 * score = (OTD % * onTimeWeight)
 *       + (Miles / maxMiles * productivityWeight * 100)
 *       + (Revenue / maxRevenue * revenueWeight * 100)
 *       - (Exceptions * 2 penalty)
 */
export const calculateDriverScore = (
  metrics: {
    onTimePercent: number;
    miles: number;
    revenue: number;
    exceptionsCount: number;
  },
  weights: DriverRankingWeights,
  maxValues: {
    maxMiles: number;
    maxRevenue: number;
  } = { maxMiles: 15_000, maxRevenue: 50_000 },
): number => {
  const otdScore = Math.max(0, Math.min(100, metrics.onTimePercent || 0)) * weights.onTimeWeight;
  const milesRatio = maxValues.maxMiles > 0 ? Math.min(1, Math.max(0, metrics.miles / maxValues.maxMiles)) : 0;
  const prodScore = milesRatio * weights.productivityWeight * 100;

  const revRatio = maxValues.maxRevenue > 0 ? Math.min(1, Math.max(0, metrics.revenue / maxValues.maxRevenue)) : 0;
  const revScore = revRatio * weights.revenueWeight * 100;

  const penalty = (metrics.exceptionsCount || 0) * 2;
  const rawScore = otdScore + prodScore + revScore - penalty;

  return Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));
};
