import type { TmsOperationalStatus } from "@/types/tms-flow/tmsFlow.types";

const knownStatuses: readonly TmsOperationalStatus[] = [
  "open", "assigned", "dispatched", "in_transit", "delivered", "cancelled",
];

export const getDashboardStatusLabel = (
  status: string,
  translate: (key: string) => string,
): string => {
  if (knownStatuses.includes(status as TmsOperationalStatus)) {
    return translate(`tmsDashboard.statuses.${status}`);
  }
  console.warn(`[TmsDashboard] Unknown operational load status: ${status}`);
  return translate("tmsDashboard.unknownStatus");
};
