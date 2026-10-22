/**
 * Pure TMS derivations.
 *
 * The backend stores load status as free text; operational state and risk are
 * derived from timestamps so every screen agrees on the same rules.
 */

import { TMS_RISK_WINDOW_HOURS } from "@/constants/tms";
import type { LoadResponse } from "@/types/load.dto";
import type {
  TmsOperationsSummary,
  TmsQueueCounts,
  TmsQueueFilter,
  TmsRiskLevel,
  TmsShipmentView,
} from "@/types/tms-flow/tmsFlow.types";

const parseTime = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
};

const addressLine = (...parts: Array<string | null | undefined>): string =>
  parts.map((part) => part?.trim()).filter(Boolean).join(", ");

const isSameLocalDay = (value: string | undefined, now: Date): boolean => {
  const time = parseTime(value);
  if (time === undefined) return false;
  const date = new Date(time);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const isTerminalLoad = (load: LoadResponse): boolean =>
  Boolean(load.cancelledAt || load.deliveredAt);

export const deriveOperationalStatus = (
  load: LoadResponse,
): TmsShipmentView["status"] => {
  if (load.cancelledAt) return "cancelled";
  if (load.deliveredAt) return "delivered";
  if (load.pickedUpAt) return "in_transit";
  if (load.dispatchedAt) return "dispatched";
  if (load.assignedTruckId) return "assigned";
  return "open";
};

export const deriveRisk = (
  load: LoadResponse,
  now: number = Date.now(),
  riskWindowHours: number = TMS_RISK_WINDOW_HOURS,
): TmsRiskLevel => {
  if (isTerminalLoad(load)) return "none";
  const dueAt = parseTime(load.requestedDeliveryDate);
  if (dueAt === undefined) return "none";
  if (dueAt < now) return "delayed";
  if (dueAt <= now + riskWindowHours * 3_600_000) return "at_risk";
  return "none";
};

export const toTmsShipment = (
  load: LoadResponse,
  now: number = Date.now(),
  riskWindowHours: number = TMS_RISK_WINDOW_HOURS,
): TmsShipmentView => ({
  id: load.id,
  number: load.number,
  name: load.name,
  customerName: load.customerName ?? "—",
  rawStatus: load.status,
  status: deriveOperationalStatus(load),
  risk: deriveRisk(load, now, riskWindowHours),
  originCity: load.originAddressCity ?? "—",
  destinationCity: load.destinationAddressCity ?? "—",
  originAddress: addressLine(
    load.originAddressLine1,
    load.originAddressLine2,
    load.originAddressCity,
    load.originAddressState,
    load.originAddressZipCode,
  ),
  destinationAddress: addressLine(
    load.destinationAddressLine1,
    load.destinationAddressLine2,
    load.destinationAddressCity,
    load.destinationAddressState,
    load.destinationAddressZipCode,
  ),
  ...(load.requestedPickupDate ? { requestedPickupDate: load.requestedPickupDate } : {}),
  ...(load.requestedDeliveryDate ? { requestedDeliveryDate: load.requestedDeliveryDate } : {}),
  ...(load.dispatchedAt ? { dispatchedAt: load.dispatchedAt } : {}),
  ...(load.pickedUpAt ? { pickedUpAt: load.pickedUpAt } : {}),
  ...(load.deliveredAt ? { deliveredAt: load.deliveredAt } : {}),
  ...(load.cancelledAt ? { cancelledAt: load.cancelledAt } : {}),
  ...(load.assignedTruckId ? { assignedTruckId: load.assignedTruckId } : {}),
  ...(load.assignedTruckNumber ? { assignedTruckNumber: load.assignedTruckNumber } : {}),
  distance: load.distance,
  ...(load.deliveryCostAmount != null ? { deliveryCostAmount: load.deliveryCostAmount } : {}),
  ...(load.deliveryCostCurrency ? { deliveryCostCurrency: load.deliveryCostCurrency } : {}),
  isHazmat: load.isHazmat,
  ...(load.hazmatClass ? { hazmatClass: load.hazmatClass } : {}),
  ...(load.notes ? { notes: load.notes } : {}),
  ...(load.originLocationLatitude != null ? { originLatitude: load.originLocationLatitude } : {}),
  ...(load.originLocationLongitude != null ? { originLongitude: load.originLocationLongitude } : {}),
  ...(load.destinationLocationLatitude != null
    ? { destinationLatitude: load.destinationLocationLatitude }
    : {}),
  ...(load.destinationLocationLongitude != null
    ? { destinationLongitude: load.destinationLocationLongitude }
    : {}),
  raw: load,
});

const riskRank = (risk: TmsRiskLevel): number =>
  risk === "delayed" ? 0 : risk === "at_risk" ? 1 : 2;

const deliveryRank = (shipment: TmsShipmentView): number =>
  parseTime(shipment.requestedDeliveryDate) ?? Number.MAX_SAFE_INTEGER;

export const sortTmsQueue = (
  shipments: readonly TmsShipmentView[],
): TmsShipmentView[] =>
  [...shipments].sort(
    (left, right) =>
      riskRank(left.risk) - riskRank(right.risk) ||
      deliveryRank(left) - deliveryRank(right) ||
      left.number - right.number,
  );

export const matchesTmsQuery = (
  shipment: TmsShipmentView,
  query: string,
): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    String(shipment.number),
    shipment.name,
    shipment.customerName,
    shipment.originCity,
    shipment.destinationCity,
    shipment.originAddress,
    shipment.destinationAddress,
  ].some((value) => value.toLowerCase().includes(needle));
};

export const selectTmsQueue = (
  shipments: readonly TmsShipmentView[],
  filter: TmsQueueFilter,
  query: string,
  approvalLoadIds: ReadonlySet<string>,
): TmsShipmentView[] => {
  const filtered = shipments.filter((shipment) => {
    if (shipment.status === "delivered" || shipment.status === "cancelled") return false;
    if (!matchesTmsQuery(shipment, query)) return false;
    if (filter === "at-risk") return shipment.risk !== "none";
    if (filter === "unassigned") return !shipment.assignedTruckId;
    if (filter === "approvals") return approvalLoadIds.has(shipment.id);
    return true;
  });
  return sortTmsQueue(filtered);
};

export const selectTmsCounts = (
  shipments: readonly TmsShipmentView[],
  approvalCount: number,
): TmsQueueCounts => {
  const active = shipments.filter(
    (shipment) => shipment.status !== "delivered" && shipment.status !== "cancelled",
  );
  return {
    all: active.length,
    atRisk: active.filter((shipment) => shipment.risk !== "none").length,
    unassigned: active.filter((shipment) => !shipment.assignedTruckId).length,
    approvals: approvalCount,
  };
};

export const summarizeTmsLoads = (
  shipments: readonly TmsShipmentView[],
  now: Date = new Date(),
): TmsOperationsSummary => {
  const active = shipments.filter(
    (shipment) => shipment.status !== "delivered" && shipment.status !== "cancelled",
  );
  return {
    active: active.length,
    inTransit: active.filter((shipment) => shipment.status === "in_transit").length,
    deliveredToday: shipments.filter(
      (shipment) =>
        shipment.status === "delivered" && isSameLocalDay(shipment.deliveredAt, now),
    ).length,
    delayed: active.filter((shipment) => shipment.risk === "delayed").length,
    atRisk: active.filter((shipment) => shipment.risk === "at_risk").length,
    unassigned: active.filter((shipment) => !shipment.assignedTruckId).length,
  };
};

/** Earliest due load that is delayed or inside the risk window. */
export const selectPrimaryRiskShipment = (
  shipments: readonly TmsShipmentView[],
): TmsShipmentView | undefined =>
  sortTmsQueue(
    shipments.filter(
      (shipment) =>
        shipment.risk !== "none" &&
        shipment.status !== "delivered" &&
        shipment.status !== "cancelled",
    ),
  )[0];
