import type {
  DriverRankingItem,
  DriverRankingReport,
  DriverRankingSortBy,
  SupportedCurrency,
} from "../types";
import { DEFAULT_RANKING_WEIGHTS } from "../config/rankingWeights";

export const MOCK_DRIVERS: DriverRankingItem[] = [
  {
    driverId: "drv-001",
    driverName: "Johnathan Vance",
    rank: 1,
    score: 98.2,
    completedLoads: 42,
    totalMiles: 14250,
    onTimePercent: 98.5,
    revenue: 48200,
    driverPay: 14460,
    revenuePerMile: 3.38,
    exceptionsCount: 0,
    isMock: true,
  },
  {
    driverId: "drv-002",
    driverName: "Marcus Nguyen",
    rank: 2,
    score: 94.6,
    completedLoads: 38,
    totalMiles: 12800,
    onTimePercent: 96.0,
    revenue: 42100,
    driverPay: 12630,
    revenuePerMile: 3.29,
    exceptionsCount: 1,
    isMock: true,
  },
  {
    driverId: "drv-003",
    driverName: "Elena Rostova",
    rank: 3,
    score: 91.8,
    completedLoads: 35,
    totalMiles: 11900,
    onTimePercent: 94.8,
    revenue: 39500,
    driverPay: 11850,
    revenuePerMile: 3.32,
    exceptionsCount: 0,
    isMock: true,
  },
  {
    driverId: "drv-004",
    driverName: "Carlos Ramirez",
    rank: 4,
    score: 88.4,
    completedLoads: 32,
    totalMiles: 10450,
    onTimePercent: 93.2,
    revenue: 34200,
    driverPay: 10260,
    revenuePerMile: 3.27,
    exceptionsCount: 1,
    isMock: true,
  },
  {
    driverId: "drv-005",
    driverName: "David Kim",
    rank: 5,
    score: 86.5,
    completedLoads: 29,
    totalMiles: 9800,
    onTimePercent: 92.5,
    revenue: 31800,
    driverPay: 9540,
    revenuePerMile: 3.24,
    exceptionsCount: 2,
    isMock: true,
  },
  {
    driverId: "drv-006",
    driverName: "Sarah Jenkins",
    rank: 6,
    score: 84.1,
    completedLoads: 27,
    totalMiles: 9200,
    onTimePercent: 91.0,
    revenue: 29600,
    driverPay: 8880,
    revenuePerMile: 3.22,
    exceptionsCount: 1,
    isMock: true,
  },
  {
    driverId: "drv-007",
    driverName: "Liam O'Connor",
    rank: 7,
    score: 82.0,
    completedLoads: 26,
    totalMiles: 8900,
    onTimePercent: 89.5,
    revenue: 28400,
    driverPay: 8520,
    revenuePerMile: 3.19,
    exceptionsCount: 2,
    isMock: true,
  },
  {
    driverId: "drv-008",
    driverName: "Brian Patel",
    rank: 8,
    score: 79.8,
    completedLoads: 24,
    totalMiles: 8100,
    onTimePercent: 88.0,
    revenue: 25800,
    driverPay: 7740,
    revenuePerMile: 3.19,
    exceptionsCount: 3,
    isMock: true,
  },
  {
    driverId: "drv-009",
    driverName: "Tyler Brooks",
    rank: 9,
    score: 77.2,
    completedLoads: 22,
    totalMiles: 7500,
    onTimePercent: 86.4,
    revenue: 23600,
    driverPay: 7080,
    revenuePerMile: 3.15,
    exceptionsCount: 2,
    isMock: true,
  },
  {
    driverId: "drv-010",
    driverName: "Anthony Martinez",
    rank: 10,
    score: 75.0,
    completedLoads: 20,
    totalMiles: 6900,
    onTimePercent: 85.0,
    revenue: 21500,
    driverPay: 6450,
    revenuePerMile: 3.12,
    exceptionsCount: 4,
    isMock: true,
  },
];

export const getMockDriverRankingReport = (
  from: string,
  to: string,
  currency: SupportedCurrency = "USD",
  sortBy: DriverRankingSortBy = "score",
): DriverRankingReport => {
  const sorted = [...MOCK_DRIVERS].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.revenue - a.revenue;
      case "totalMiles":
        return b.totalMiles - a.totalMiles;
      case "onTimePercent":
        return b.onTimePercent - a.onTimePercent;
      case "score":
      default:
        return b.score - a.score;
    }
  });

  const ranked = sorted.map((driver, index) => ({
    ...driver,
    rank: index + 1,
  }));

  return {
    period: { from, to },
    currency,
    sortBy,
    drivers: ranked,
    weights: DEFAULT_RANKING_WEIGHTS,
    isMock: true,
  };
};
