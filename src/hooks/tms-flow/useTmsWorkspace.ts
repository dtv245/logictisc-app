// @refresh reset
/** Composes the real loads, trucks and pending AI decisions into one workspace. */

import { useMemo } from "react";

import type { LoadResponse } from "@/types/load.dto";
import type {
  TmsLoadCollection,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";
import type { TmsQueryOptions } from "@/hooks/tms-flow/useTmsQueries";
import {
  approvalLoadIds,
  joinTmsApprovals,
  loadIdsForOverview,
} from "@/utils/tms-flow/approvals";
import {
  useInfiniteTmsLoads,
  useInfiniteTmsRiskLoads,
  useInfiniteTmsUnassignedLoads,
  useLoadAiStatuses,
  usePendingSuggestions,
  useTmsTrucks,
  type TmsLoadsPageSnapshot,
} from "@/hooks/tms-flow/useTmsQueries";

const EMPTY_SHIPMENTS: TmsShipmentView[] = [];

const flattenPageSnapshots = (
  pages: readonly TmsLoadsPageSnapshot[] | undefined,
): {
  collection?: TmsLoadCollection;
  shipments?: TmsShipmentView[];
  generatedAt?: number;
  countSource?: "server" | "client-fallback";
} => {
  if (!pages || pages.length === 0) {
    return {
      collection: undefined,
      shipments: undefined,
      generatedAt: undefined,
    };
  }
  const items: LoadResponse[] = [];
  const shipmentList: TmsShipmentView[] = [];
  const seenIds = new Set<string>();
  for (const pageSnapshot of pages) {
    for (let i = 0; i < pageSnapshot.page.items.length; i += 1) {
      const rawLoad = pageSnapshot.page.items[i];
      const shipment = pageSnapshot.shipments[i];
      if (!rawLoad || !shipment || seenIds.has(rawLoad.id)) continue;
      seenIds.add(rawLoad.id);
      items.push(rawLoad);
      shipmentList.push(shipment);
    }
  }
  const lastPage = pages[pages.length - 1]!;
  return {
    collection: {
      items,
      totalItems: lastPage.page.totalItems,
      truncated: pages.some((page) => page.countIsLowerBound === true),
      countSource: lastPage.countSource ?? "server",
    } satisfies TmsLoadCollection,
    shipments: shipmentList,
    generatedAt: lastPage.generatedAt,
  };
};

export function useTmsWorkspace(options: TmsQueryOptions = {}) {
  const loads = useInfiniteTmsLoads(options);
  const trucks = useTmsTrucks(options);
  const pending = usePendingSuggestions(options);
  const riskLoads = useInfiniteTmsRiskLoads(options);
  const unassignedLoads = useInfiniteTmsUnassignedLoads(options);

  const {
    collection: riskCollection,
    shipments: riskShipments,
  } = useMemo(
    () => flattenPageSnapshots(riskLoads.data?.pages),
    [riskLoads.data?.pages],
  );

  const {
    collection: unassignedCollection,
    shipments: unassignedShipments,
  } = useMemo(
    () => flattenPageSnapshots(unassignedLoads.data?.pages),
    [unassignedLoads.data?.pages],
  );

  const { collection, shipments: rawShipments = EMPTY_SHIPMENTS, generatedAt } = useMemo(
    () => flattenPageSnapshots(loads.data?.pages),
    [loads.data?.pages],
  );

  // Enrich main load list with server-verified risk reasons when a load is in the risk list
  const shipments = useMemo(() => {
    if (!riskShipments || riskShipments.length === 0 || rawShipments.length === 0) {
      return rawShipments;
    }
    const riskById = new Map(
      riskShipments.map((shipment) => [shipment.id, shipment] as const),
    );
    return rawShipments.map((shipment) => {
      const riskMatch = riskById.get(shipment.id);
      if (!riskMatch) return shipment;
      return {
        ...shipment,
        risk: riskMatch.risk,
        ...(riskMatch.riskReasons ? { riskReasons: riskMatch.riskReasons } : {}),
      };
    });
  }, [rawShipments, riskShipments]);

  const allKnownShipments = useMemo(() => {
    const merged = new Map<string, TmsShipmentView>();
    for (const shipment of shipments) merged.set(shipment.id, shipment);
    for (const shipment of riskShipments ?? EMPTY_SHIPMENTS) {
      merged.set(shipment.id, shipment);
    }
    for (const shipment of unassignedShipments ?? EMPTY_SHIPMENTS) {
      if (!merged.has(shipment.id)) merged.set(shipment.id, shipment);
    }
    return [...merged.values()];
  }, [shipments, riskShipments, unassignedShipments]);

  const overviewIds = useMemo(
    () => loadIdsForOverview(allKnownShipments),
    [allKnownShipments],
  );
  const statuses = useLoadAiStatuses(overviewIds, options);

  const approvals = useMemo(
    () =>
      joinTmsApprovals(
        pending.data ?? [],
        statuses.data ?? [],
        allKnownShipments,
        trucks.data?.items ?? [],
      ),
    [pending.data, statuses.data, allKnownShipments, trucks.data?.items],
  );

  const approvalIds = useMemo(() => approvalLoadIds(approvals), [approvals]);
  const refreshQueries = [loads, riskLoads, unassignedLoads, trucks, pending, statuses];
  const updatedAt = Math.max(0, ...refreshQueries.map((query) => query.dataUpdatedAt ?? 0));
  const isRefreshing = refreshQueries.some(
    (query) => query.isFetching === true && query.isLoading !== true,
  );
  const refreshFailed = refreshQueries.some((query) => query.isRefetchError === true);

  return {
    loads,
    riskLoads,
    unassignedLoads,
    trucks,
    pending,
    statuses,
    shipments,
    allKnownShipments,
    riskShipments,
    unassignedShipments,
    approvals,
    approvalIds,
    collection,
    riskCollection,
    unassignedCollection,
    generatedAt,
    updatedAt: updatedAt > 0 ? updatedAt : undefined,
    isRefreshing,
    refreshFailed,
    isLoading: loads.isLoading,
    // Trucks and AI decisions enrich the screen; a failure there must not hide
    // the load queue that the user can still act on.
    error: shipments.length > 0 ? null : loads.error,
    riskError: riskLoads.error,
    unassignedError: unassignedLoads.error,
    approvalsError: pending.error ?? statuses.error,
    trucksError: trucks.error,
  };
}
