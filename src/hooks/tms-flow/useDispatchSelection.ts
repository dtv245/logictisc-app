import { useOne } from "@refinedev/core";
import { useMemo } from "react";

import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { ApiError } from "@/types/api.types";
import type { LoadResponse } from "@/types/loads/load.dto";
import type {
  TmsQueueFilter,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";
import { selectTmsQueue, toTmsShipment } from "@/utils/tms-flow/status";

const urgencyRank = (shipment: TmsShipmentView): number => {
  if (shipment.risk !== "none" || (shipment.riskReasons?.length ?? 0) > 0) return 0;
  if (!shipment.assignedTruckId && !shipment.assignedTruckNumber) return 1;
  return 2;
};

const deliveryTime = (shipment: TmsShipmentView): number => {
  const timestamp = shipment.requestedDeliveryDate
    ? Date.parse(shipment.requestedDeliveryDate)
    : Number.POSITIVE_INFINITY;
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

/** Sorts only the records already available to the dispatch screen. */
export function selectMostUrgentDispatchShipment(
  shipments: readonly TmsShipmentView[],
): TmsShipmentView | undefined {
  return [...shipments].sort(
    (left, right) =>
      urgencyRank(left) - urgencyRank(right) ||
      deliveryTime(left) - deliveryTime(right) ||
      left.number - right.number,
  )[0];
}

export interface UseDispatchSelectionOptions {
  requestedId?: string | null;
  visibleShipments: readonly TmsShipmentView[];
  knownShipments: readonly TmsShipmentView[];
  defaultShipment?: TmsShipmentView;
  filter: TmsQueueFilter;
  query: string;
  approvalLoadIds: ReadonlySet<string>;
}

export type DispatchSelectionState =
  | { status: "idle"; shipment?: TmsShipmentView; outsideQueue: false }
  | { status: "loading"; outsideQueue: false }
  | { status: "not-found"; outsideQueue: false }
  | { status: "hidden"; outsideQueue: false }
  | { status: "error"; error: unknown; retry: () => void; outsideQueue: false }
  | { status: "selected"; shipment: TmsShipmentView; outsideQueue: boolean };

const isNotFoundOrForbidden = (statusCode: number | undefined): boolean =>
  statusCode === 403 || statusCode === 404;

/** Resolves a deep-linked load without silently substituting another load. */
export function useDispatchSelection({
  requestedId,
  visibleShipments,
  knownShipments,
  defaultShipment,
  filter,
  query,
  approvalLoadIds,
}: UseDispatchSelectionOptions): DispatchSelectionState {
  const { tenant } = useCurrentTenant();
  const knownShipment = requestedId
    ? knownShipments.find((shipment) => shipment.id === requestedId)
    : undefined;
  const visibleShipment = requestedId
    ? visibleShipments.find((shipment) => shipment.id === requestedId)
    : undefined;
  const shouldFetch = Boolean(requestedId && !knownShipment);

  const result = useOne<LoadResponse, ApiError>({
    resource: "loads",
    id: shouldFetch ? requestedId ?? undefined : undefined,
    queryOptions: {
      enabled: shouldFetch,
      queryKey: [
        "tms",
        tenant?.tenantKey ?? "tenant",
        "loads",
        "dispatch-selection",
        requestedId ?? "none",
      ],
      retry: false,
      refetchOnWindowFocus: false,
    },
    successNotification: false,
    errorNotification: false,
  });

  const fetchedShipment = useMemo(() => {
    const load = result.data?.data;
    return load ? toTmsShipment(load) : undefined;
  }, [result.data?.data]);

  if (!requestedId) {
    if (defaultShipment) {
      return { status: "selected", shipment: defaultShipment, outsideQueue: false };
    }
    return { status: "idle", outsideQueue: false };
  }

  if (visibleShipment) {
    return { status: "selected", shipment: visibleShipment, outsideQueue: false };
  }

  if (knownShipment) {
    return { status: "hidden", outsideQueue: false };
  }

  if (result.isLoading || result.isFetching) {
    return { status: "loading", outsideQueue: false };
  }

  if (result.error) {
    if (isNotFoundOrForbidden(result.error.statusCode)) {
      return { status: "not-found", outsideQueue: false };
    }
    return {
      status: "error",
      error: result.error,
      retry: () => { void result.refetch(); },
      outsideQueue: false,
    };
  }

  if (!fetchedShipment) {
    return { status: "not-found", outsideQueue: false };
  }

  const isVisibleForCurrentFilters = selectTmsQueue(
    [fetchedShipment],
    filter,
    query,
    approvalLoadIds,
  ).length > 0;

  return isVisibleForCurrentFilters
    ? { status: "selected", shipment: fetchedShipment, outsideQueue: true }
    : { status: "hidden", outsideQueue: false };
}
