/**
 * Read hooks for the TMS operations flow. Every number shown on screen comes
 * from these queries (loads, trucks, timeline, pending AI decisions).
 */

import { useQuery } from "@tanstack/react-query";

import {
  fetchAllLoads,
  fetchAllTrucks,
  fetchLoad,
  fetchLoadAiStatuses,
  fetchLoadTimeline,
  fetchPendingSuggestions,
  tmsKeys,
} from "@/api/tms-flow/tmsFlow.api";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type {
  TmsLoadCollection,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";
import { toTmsShipment } from "@/utils/tms-flow/status";

const REFRESH_MS = 30_000;

export interface TmsLoadsSnapshot {
  collection: TmsLoadCollection;
  shipments: TmsShipmentView[];
  /** Single clock reading so every risk badge in one render uses the same `now`. */
  generatedAt: number;
}

export function useTmsLoads() {
  const { tenant } = useCurrentTenant();
  return useQuery<TmsLoadsSnapshot>({
    queryKey: tmsKeys.loads(tenant?.tenantKey),
    queryFn: async () => {
      const collection = await fetchAllLoads();
      const generatedAt = Date.now();
      return {
        collection,
        generatedAt,
        shipments: collection.items.map((load) => toTmsShipment(load, generatedAt)),
      };
    },
    staleTime: REFRESH_MS,
    // Loads are the source of truth for the dispatch queue. Always refresh when
    // the screen mounts and keep an open queue current, including after a
    // previous dev-server mock response was cached by React Query.
    refetchOnMount: "always",
    refetchInterval: REFRESH_MS,
    retry: false,
  });
}

export function useTmsTrucks() {
  const { tenant } = useCurrentTenant();
  return useQuery({
    queryKey: tmsKeys.trucks(tenant?.tenantKey),
    queryFn: fetchAllTrucks,
    staleTime: REFRESH_MS,
    retry: false,
  });
}

export function usePendingSuggestions() {
  const { tenant } = useCurrentTenant();
  return useQuery({
    queryKey: tmsKeys.pending(tenant?.tenantKey),
    queryFn: fetchPendingSuggestions,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    retry: false,
  });
}

export function useLoadAiStatuses(loadIds: readonly string[]) {
  const { tenant } = useCurrentTenant();
  return useQuery({
    queryKey: tmsKeys.aiStatuses(tenant?.tenantKey, loadIds),
    queryFn: () => fetchLoadAiStatuses(loadIds),
    enabled: loadIds.length > 0,
    staleTime: REFRESH_MS,
    retry: false,
  });
}

export function useTmsLoad(loadId: string | undefined) {
  const { tenant } = useCurrentTenant();
  return useQuery<TmsShipmentView>({
    queryKey: tmsKeys.load(tenant?.tenantKey, loadId ?? ""),
    queryFn: async () => {
      const load = await fetchLoad(loadId as string);
      return toTmsShipment(load, Date.now());
    },
    enabled: Boolean(loadId),
    staleTime: REFRESH_MS,
    retry: false,
  });
}

export function useTmsTimeline(loadId: string | undefined) {
  const { tenant } = useCurrentTenant();
  return useQuery({
    queryKey: tmsKeys.timeline(tenant?.tenantKey, loadId ?? ""),
    queryFn: () => fetchLoadTimeline(loadId as string),
    enabled: Boolean(loadId),
    staleTime: REFRESH_MS,
    retry: false,
  });
}
