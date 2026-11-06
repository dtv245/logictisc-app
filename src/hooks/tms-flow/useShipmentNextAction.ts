import { useMemo } from "react";

import type { TmsApproval, TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import { formatTmsRiskReason, riskMeta } from "@/utils/tms-flow/presentation";

export type ShipmentNextAction =
  | { kind: "none" }
  | { kind: "risk"; reason: string }
  | { kind: "approve-suggestion"; approval: TmsApproval }
  | { kind: "manual-assignment-unavailable" };

export interface UseShipmentNextActionOptions {
  shipment?: TmsShipmentView;
  approvals: readonly TmsApproval[];
}

/** Derives one next step from the current load and its real pending suggestion. */
export function useShipmentNextAction({
  shipment,
  approvals,
}: UseShipmentNextActionOptions): ShipmentNextAction {
  return useMemo(() => {
    if (!shipment) return { kind: "none" };

    const reasons = shipment.riskReasons?.map(formatTmsRiskReason).filter(Boolean) ?? [];
    if (shipment.risk !== "none" || reasons.length > 0) {
      return {
        kind: "risk",
        reason: reasons[0] ?? riskMeta[shipment.risk].label,
      };
    }

    const hasTruck = Boolean(shipment.assignedTruckId || shipment.assignedTruckNumber);
    if (hasTruck) return { kind: "none" };

    const approval = approvals.find(
      (item) => item.load?.id === shipment.id && item.suggestion.status.toUpperCase() === "PENDING",
    );
    return approval
      ? { kind: "approve-suggestion", approval }
      : { kind: "manual-assignment-unavailable" };
  }, [approvals, shipment]);
}
