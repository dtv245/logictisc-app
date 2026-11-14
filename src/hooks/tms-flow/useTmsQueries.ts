// @refresh reset
/**
 * Read hooks for the TMS operations flow. Every number shown on screen comes
 * from these queries (loads, trucks, timeline, pending AI decisions).
 */

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAllLoads,
  fetchAllTrucks,
  fetchDispatchRiskLoadsPage,
  fetchDispatchUnassignedLoadsPage,
  fetchLoad,
  fetchLoadAiStatuses,
  fetchLoadsPage,
  fetchLoadTimeline,
  fetchPendingSuggestions,
  isEndpointNotFoundError,
  tmsKeys,
} from "@/api/tms-flow/tmsFlow.api";
import { TMS_LOAD_PAGE_SIZE } from "@/constants/tms";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { PagedResponse } from "@/types/api.types";
import type { LoadResponse } from "@/types/loads/load.dto";
import type {
  TmsLoadCollection,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";
import { getTmsOverdue } from "@/utils/tms-flow/overdue";
import { sortTmsQueue, toTmsRiskShipment, toTmsShipment } from "@/utils/tms-flow/status";

const REFRESH_MS = 30_000;
const DISPATCH_BOARD_PAGE_SIZE = 20;
type DispatchBoardEndpoint = "risk" | "unassigned";

const unavailableDispatchEndpointKey = (
  tenantKey: string | undefined,
  endpoint: DispatchBoardEndpoint,
) => ["tms", tenantKey ?? "anonymous", "dispatch-board-endpoint-unavailable", endpoint] as const;

const rememberUnavailableDispatchEndpoint = (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: ReturnType<typeof unavailableDispatchEndpointKey>,
) => {
  queryClient.setQueryDefaults(queryKey, { cacheTime: Infinity, staleTime: Infinity });
  queryClient.setQueryData(queryKey, true);
};

const deriveClientFallbackRiskReasons = (
  load: LoadResponse,
  now: number,
): ReturnType<typeof deriveClientFallbackRiskReasonsFromOverdue> =>
  deriveClientFallbackRiskReasonsFromOverdue(load, now);

function deriveClientFallbackRiskReasonsFromOverdue(load: LoadResponse, now: number) {
  return getTmsOverdue(load, now).reasons.map((reason) => ({
    code: reason.kind === "pickup" ? "PICKUP_OVERDUE" : "DELIVERY_OVERDUE",
    message: reason.kind === "pickup"
      ? "Pickup deadline has passed without pickup recorded."
      : "Requested delivery deadline has passed without delivery recorded.",
    dueAt: reason.dueAt,
  }));
}

export interface TmsLoadsSnapshot {
  collection: TmsLoadCollection;
  shipments: TmsShipmentView[];
  /** Single clock reading so every risk badge in one render uses the same `now`. */
  generatedAt: number;
}

export interface TmsLoadsPageSnapshot {
  page: PagedResponse<LoadResponse>;
  shipments: TmsShipmentView[];
  generatedAt: number;
  /** True only when a fallback count is derived from a capped collection. */
  countIsLowerBound?: boolean;
  countSource?: "server" | "client-fallback";
}

export interface TmsQueryOptions {
  /** Lets a caller skip the request until it knows the user may read the resource. */
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export interface TmsInfiniteQueryOptions extends TmsQueryOptions {
  pageSize?: number;
}

export function useInfiniteTmsLoads(options: TmsInfiniteQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const pageSize = Math.max(1, Math.trunc(options.pageSize ?? TMS_LOAD_PAGE_SIZE));
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useInfiniteQuery<TmsLoadsPageSnapshot>({
    queryKey: tmsKeys.infiniteLoads(tenant?.tenantKey, pageSize),
    queryFn: async ({ pageParam }) => {
      const pageNumber = Number(pageParam ?? 1);
      const page = await fetchLoadsPage(pageNumber, pageSize);
      const generatedAt = Date.now();
      return {
        page,
        generatedAt,
        shipments: page.items.map((load) => toTmsShipment(load, generatedAt)),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const current = lastPage.page.currentPage || allPages.length;
      if (lastPage.page.items.length < pageSize) return undefined;
      if (lastPage.page.totalPages > 0) {
        return current < lastPage.page.totalPages ? current + 1 : undefined;
      }
      if (lastPage.page.totalItems > current * pageSize) {
        return current + 1;
      }
      return undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: refreshIntervalMs,
    refetchOnMount: "always",
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}

export function useInfiniteTmsRiskLoads(options: TmsInfiniteQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const pageSize = Math.max(
    1,
    Math.min(50, Math.trunc(options.pageSize ?? DISPATCH_BOARD_PAGE_SIZE)),
  );
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useInfiniteQuery<TmsLoadsPageSnapshot>({
    queryKey: tmsKeys.infiniteRiskLoads(tenant?.tenantKey, pageSize),
    queryFn: async ({ pageParam }) => {
      const pageNumber = Number(pageParam ?? 1);
      const unavailableKey = unavailableDispatchEndpointKey(tenant?.tenantKey, "risk");
      let riskPage: Awaited<ReturnType<typeof fetchDispatchRiskLoadsPage>> | undefined;
      if (queryClient.getQueryData<boolean>(unavailableKey) !== true) {
        try {
          riskPage = await fetchDispatchRiskLoadsPage(pageNumber, pageSize);
        } catch (error) {
          if (!isEndpointNotFoundError(error)) {
            throw error;
          }
          // The running backend may not yet include this optional read endpoint.
          // Cache that fact per tenant so the 30-second refresh uses the existing
          // loads endpoint instead of repeatedly issuing a request that returns 404.
          rememberUnavailableDispatchEndpoint(queryClient, unavailableKey);
        }
      }
      if (riskPage) {
        const generatedAt = Date.now();
        return {
          page: {
            ...riskPage,
            items: riskPage.items.map((item) => item.load),
          },
          generatedAt,
          shipments: riskPage.items.map((item) =>
            toTmsRiskShipment(item, generatedAt),
          ),
          countSource: "server",
        };
      }
      const collection = await queryClient.fetchQuery({
        queryKey: ["tms", tenant?.tenantKey ?? "anonymous", "loads", "fallback-all"],
        queryFn: fetchAllLoads,
        staleTime: refreshIntervalMs,
      });
      const generatedAt = Date.now();
      const allRiskShipments = sortTmsQueue(
        collection.items
          .map((load) => {
            const reasons = deriveClientFallbackRiskReasons(load, generatedAt);
            return toTmsShipment(load, generatedAt, undefined, reasons);
          })
          .filter(
            (shipment) =>
              shipment.status !== "cancelled" &&
              shipment.status !== "delivered" &&
              (shipment.risk !== "none" ||
                (shipment.riskReasons?.length ?? 0) > 0),
          ),
      );
      const start = (pageNumber - 1) * pageSize;
      const slice = allRiskShipments.slice(start, start + pageSize);
      const totalItems = allRiskShipments.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      return {
        page: {
          items: slice.map((item) => item.raw),
          totalItems,
          totalPages,
          currentPage: pageNumber,
          pageSize,
        },
        generatedAt,
        shipments: slice,
        countIsLowerBound: collection.truncated,
        countSource: "client-fallback",
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const current = lastPage.page.currentPage || allPages.length;
      if (lastPage.page.items.length < pageSize) return undefined;
      if (lastPage.page.totalPages > 0) {
        return current < lastPage.page.totalPages ? current + 1 : undefined;
      }
      if (lastPage.page.totalItems > current * pageSize) {
        return current + 1;
      }
      return undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: refreshIntervalMs,
    refetchOnMount: "always",
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}

export function useInfiniteTmsUnassignedLoads(
  options: TmsInfiniteQueryOptions = {},
) {
  const { tenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const pageSize = Math.max(
    1,
    Math.min(50, Math.trunc(options.pageSize ?? DISPATCH_BOARD_PAGE_SIZE)),
  );
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useInfiniteQuery<TmsLoadsPageSnapshot>({
    queryKey: tmsKeys.infiniteUnassignedLoads(tenant?.tenantKey, pageSize),
    queryFn: async ({ pageParam }) => {
      const pageNumber = Number(pageParam ?? 1);
      const unavailableKey = unavailableDispatchEndpointKey(tenant?.tenantKey, "unassigned");
      let page: Awaited<ReturnType<typeof fetchDispatchUnassignedLoadsPage>> | undefined;
      if (queryClient.getQueryData<boolean>(unavailableKey) !== true) {
        try {
          page = await fetchDispatchUnassignedLoadsPage(pageNumber, pageSize);
        } catch (error) {
          if (!isEndpointNotFoundError(error)) {
            throw error;
          }
          // Keep polling on the supported loads resource after the first 404.
          rememberUnavailableDispatchEndpoint(queryClient, unavailableKey);
        }
      }
      if (page) {
        const generatedAt = Date.now();
        return {
          page,
          generatedAt,
          shipments: page.items.map((load) => toTmsShipment(load, generatedAt)),
          countSource: "server",
        };
      }
      const collection = await queryClient.fetchQuery({
        queryKey: ["tms", tenant?.tenantKey ?? "anonymous", "loads", "fallback-all"],
        queryFn: fetchAllLoads,
        staleTime: refreshIntervalMs,
      });
      const generatedAt = Date.now();
      const allUnassignedShipments = sortTmsQueue(
        collection.items
          .filter((load) => !load.assignedTruckId && !load.cancelledAt && load.status !== "CANCELLED")
          .map((load) => toTmsShipment(load, generatedAt))
          .filter(
            (shipment) =>
              shipment.status !== "cancelled" &&
              shipment.status !== "delivered",
          ),
      );
      const start = (pageNumber - 1) * pageSize;
      const slice = allUnassignedShipments.slice(start, start + pageSize);
      const totalItems = allUnassignedShipments.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      return {
        page: {
          items: slice.map((item) => item.raw),
          totalItems,
          totalPages,
          currentPage: pageNumber,
          pageSize,
        },
        generatedAt,
        shipments: slice,
        countIsLowerBound: collection.truncated,
        countSource: "client-fallback",
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const current = lastPage.page.currentPage || allPages.length;
      if (lastPage.page.items.length < pageSize) return undefined;
      if (lastPage.page.totalPages > 0) {
        return current < lastPage.page.totalPages ? current + 1 : undefined;
      }
      if (lastPage.page.totalItems > current * pageSize) {
        return current + 1;
      }
      return undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: refreshIntervalMs,
    refetchOnMount: "always",
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}

export function useTmsLoads(options: TmsQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
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
    enabled: options.enabled ?? true,
    staleTime: refreshIntervalMs,
    // Loads are the source of truth for the dispatch queue. Always refresh when
    // the screen mounts and keep an open queue current, including after a
    // previous dev-server mock response was cached by React Query.
    refetchOnMount: "always",
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}

export function useTmsTrucks(options: TmsQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useQuery({
    queryKey: tmsKeys.trucks(tenant?.tenantKey),
    queryFn: fetchAllTrucks,
    enabled: options.enabled ?? true,
    staleTime: refreshIntervalMs,
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: false,
  });
}

export function usePendingSuggestions(options: TmsQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useQuery({
    queryKey: tmsKeys.pending(tenant?.tenantKey),
    queryFn: fetchPendingSuggestions,
    staleTime: refreshIntervalMs,
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: false,
  });
}

export function useLoadAiStatuses(loadIds: readonly string[], options: TmsQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useQuery({
    queryKey: tmsKeys.aiStatuses(tenant?.tenantKey, loadIds),
    queryFn: () => fetchLoadAiStatuses(loadIds),
    enabled: loadIds.length > 0,
    staleTime: refreshIntervalMs,
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
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
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: false,
  });
}

export function useTmsTimeline(loadId: string | undefined, options: TmsQueryOptions = {}) {
  const { tenant } = useCurrentTenant();
  const refreshIntervalMs = options.refreshIntervalMs ?? REFRESH_MS;
  return useQuery({
    queryKey: tmsKeys.timeline(tenant?.tenantKey, loadId ?? ""),
    queryFn: () => fetchLoadTimeline(loadId as string),
    enabled: Boolean(loadId),
    staleTime: refreshIntervalMs,
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: false,
  });
}
