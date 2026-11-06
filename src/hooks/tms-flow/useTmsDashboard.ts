import { useMemo } from "react";

import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import { useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { selectMostUrgentDispatchShipment } from "@/hooks/tms-flow/useDispatchSelection";
import { useShipmentNextAction } from "@/hooks/tms-flow/useShipmentNextAction";

export type TmsDashboardCount =
  | { state: "loading" }
  | { state: "ready"; value: number }
  | { state: "error" }
  | {
      state: "unavailable";
      reason:
        | "attention-filter-unavailable"
        | "unassigned-filter-unavailable"
        | "server-filter-unavailable"
        | "lifecycle-filter-unavailable"
        | "server-total-unavailable";
    };

export const dashboardCountFromServer = (input: {
  isLoading?: boolean;
  isError?: boolean;
  total?: number | null;
}): TmsDashboardCount => {
  if (input.isLoading) return { state: "loading" };
  if (input.isError) return { state: "error" };
  if (typeof input.total === "number" && Number.isFinite(input.total) && input.total >= 0) {
    return { state: "ready", value: input.total };
  }
  return { state: "unavailable", reason: "server-total-unavailable" };
};

export const getRefineServerTotal = (data?: { data?: readonly unknown[]; total?: number | null } | null): number | undefined =>
  typeof data?.total === "number" && Number.isFinite(data.total) && data.total >= 0
    ? data.total
    : undefined;

export const dashboardCountValue = (count: TmsDashboardCount): string | undefined =>
  count.state === "ready" ? count.value.toLocaleString("vi-VN") : undefined;

export const dashboardCountUnavailable = (
  reason: Extract<TmsDashboardCount, { state: "unavailable" }>["reason"],
): TmsDashboardCount => ({ state: "unavailable", reason });

const actionable = (shipment: TmsShipmentView): boolean => {
  if (shipment.risk !== "none") return true;
  if (shipment.status === "delivered" || shipment.status === "cancelled") return false;
  return !shipment.assignedTruckId && !shipment.assignedTruckNumber;
};

export function useTmsDashboard() {
  const workspace = useTmsWorkspace({ refreshIntervalMs: 60_000 });

  const candidates = useMemo(
    () => (workspace.allKnownShipments ?? workspace.shipments).filter(actionable),
    [workspace.allKnownShipments, workspace.shipments],
  );
  const primary = selectMostUrgentDispatchShipment(candidates);
  const nextAction = useShipmentNextAction({ shipment: primary, approvals: workspace.approvals });
  const timeline = useTmsTimeline(primary?.id, { refreshIntervalMs: 60_000 });

  // The Refine loads allowlist has no exception/risk field. Its existing queue
  // endpoint pages the queue but is not a Refine useList filter total, so do not
  // present that page's total as the requested useList KPI.
  const riskCount = dashboardCountUnavailable("attention-filter-unavailable");
  // `truckId` is allowlisted, but the list serializer omits null/empty filter
  // values and supports no `isNull` operator. A safe unassigned useList filter
  // therefore cannot be expressed without changing the existing contract.
  const unassignedCount = dashboardCountUnavailable("unassigned-filter-unavailable");
  const pendingCount = dashboardCountFromServer({
    isLoading: workspace.pending.isLoading,
    isError: Boolean(workspace.pending.error && workspace.pending.data === undefined),
    // /api/ai/dispatch/pending returns one unpaginated array.
    total: workspace.pending.data?.length,
  });
  // Operational transit is derived from pickup/delivery/cancel timestamps.
  // The transport status is an open string, so status=IN_TRANSIT could count
  // stale or noncanonical values as active transit.
  const inTransitCount = dashboardCountUnavailable("lifecycle-filter-unavailable");
  const overdueCount = dashboardCountUnavailable("server-filter-unavailable");

  const updatedAt = workspace.updatedAt ?? 0;
  const refreshFailed = workspace.refreshFailed;

  return {
    workspace,
    primary,
    nextAction,
    timeline,
    counts: {
      attention: riskCount,
      unassigned: unassignedCount,
      overdue: overdueCount,
      pending: pendingCount,
      inTransit: inTransitCount,
    },
    isPriorityLoading: workspace.isLoading || workspace.riskLoads.isLoading || workspace.unassignedLoads.isLoading,
    updatedAt: updatedAt > 0 ? updatedAt : undefined,
    refreshFailed,
  };
}

export type TmsDashboardModel = ReturnType<typeof useTmsDashboard>;
