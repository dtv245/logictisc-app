/** Composes the real loads, trucks and pending AI decisions into one workspace. */

import { useMemo } from "react";

import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import {
  approvalLoadIds,
  joinTmsApprovals,
  loadIdsForOverview,
} from "@/utils/tms-flow/approvals";
import {
  useLoadAiStatuses,
  usePendingSuggestions,
  useTmsLoads,
  useTmsTrucks,
} from "@/hooks/tms-flow/useTmsQueries";

const EMPTY_SHIPMENTS: TmsShipmentView[] = [];

export function useTmsWorkspace() {
  const loads = useTmsLoads();
  const trucks = useTmsTrucks();
  const pending = usePendingSuggestions();

  const shipments = loads.data?.shipments ?? EMPTY_SHIPMENTS;
  const overviewIds = useMemo(() => loadIdsForOverview(shipments), [shipments]);
  const statuses = useLoadAiStatuses(overviewIds);

  const approvals = useMemo(
    () =>
      joinTmsApprovals(
        pending.data ?? [],
        statuses.data ?? [],
        shipments,
        trucks.data?.items ?? [],
      ),
    [pending.data, statuses.data, shipments, trucks.data?.items],
  );

  const approvalIds = useMemo(() => approvalLoadIds(approvals), [approvals]);

  return {
    loads,
    trucks,
    pending,
    statuses,
    shipments,
    approvals,
    approvalIds,
    collection: loads.data?.collection,
    generatedAt: loads.data?.generatedAt,
    isLoading: loads.isLoading,
    // Trucks and AI decisions enrich the screen; a failure there must not hide
    // the load queue that the user can still act on.
    error: loads.error,
    approvalsError: pending.error ?? statuses.error,
    trucksError: trucks.error,
  };
}
