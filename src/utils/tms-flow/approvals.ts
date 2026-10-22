/** Joins pending AI decisions to the load they belong to. */

import type { TruckResponse } from "@/types/truck.dto";
import type {
  TmsAiLoadStatus,
  TmsAiSuggestion,
  TmsApproval,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";

export function joinTmsApprovals(
  suggestions: readonly TmsAiSuggestion[],
  statuses: readonly TmsAiLoadStatus[],
  loads: readonly TmsShipmentView[],
  trucks: readonly TruckResponse[],
): TmsApproval[] {
  const loadById = new Map(loads.map((load) => [load.id, load]));
  const loadByDecision = new Map<string, TmsShipmentView>();
  for (const status of statuses) {
    if (!status.latestDecisionId) continue;
    const load = loadById.get(status.loadId);
    if (load) loadByDecision.set(status.latestDecisionId, load);
  }
  const truckById = new Map(trucks.map((truck) => [truck.id, truck]));

  return suggestions.map((suggestion) => {
    const load = loadByDecision.get(suggestion.decisionId);
    const truck = truckById.get(suggestion.truckId);
    return {
      suggestion,
      ...(load ? { load } : {}),
      ...(truck ? { truck } : {}),
    };
  });
}

/** Used when the approval is opened from a load detail page. */
export const findApprovalForLoad = (
  approvals: readonly TmsApproval[],
  loadId: string | undefined,
): TmsApproval | undefined =>
  loadId ? approvals.find((approval) => approval.load?.id === loadId) : undefined;

export const approvalLoadIds = (
  approvals: readonly TmsApproval[],
): Set<string> =>
  new Set(
    approvals
      .map((approval) => approval.load?.id)
      .filter((id): id is string => Boolean(id)),
  );

/** Load ids whose AI overview is worth asking for (one lookup for all pending). */
export const loadIdsForOverview = (
  loads: readonly TmsShipmentView[],
): string[] =>
  loads
    .filter(
      (load) => load.status !== "delivered" && load.status !== "cancelled",
    )
    .slice(0, 100)
    .map((load) => load.id);
