/** Pure selectors shared by the TMS flow screens. */

import type {
  DispatchFilter,
  Driver,
  MapRoute,
  MapVehicle,
  RouteApproval,
  RoutePlan,
  Shipment,
  TmsFlowSnapshot,
  Vehicle,
} from "@/types/tms-flow/tmsFlow.types";
import type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";

export interface ShipmentDetail {
  shipment: Shipment;
  driver?: Driver;
  vehicle?: Vehicle;
  route?: RoutePlan;
  approval?: RouteApproval;
  audits: TmsFlowSnapshot["audits"];
}

export interface DispatchFilterCounts {
  all: number;
  atRisk: number;
  priority: number;
  approvals: number;
}

export const matchesShipmentQuery = (shipment: Shipment, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [shipment.id, shipment.customer, shipment.origin, shipment.destination, shipment.po]
    .some((value) => value.toLowerCase().includes(needle));
};

export const selectDispatchQueue = (
  snapshot: TmsFlowSnapshot,
  filter: DispatchFilter,
  query = "",
): Shipment[] => {
  const approvalIds = new Set(
    snapshot.approvals
      .filter((approval) => approval.state === "pending_approval" || approval.state === "under_review")
      .map((approval) => approval.shipmentId),
  );

  return snapshot.shipments
    .filter((shipment) => {
      if (!matchesShipmentQuery(shipment, query)) return false;
      if (filter === "at-risk") return shipment.status === "at_risk" || shipment.status === "delayed";
      if (filter === "priority") return shipment.priority !== "standard";
      if (filter === "approvals") return approvalIds.has(shipment.id);
      return true;
    })
    .sort((left, right) => {
      const rank = (shipment: Shipment): number =>
        shipment.status === "at_risk" ? 0 : shipment.status === "delayed" ? 1 : shipment.status === "in_transit" ? 2 : 3;
      return rank(left) - rank(right) || new Date(left.currentEta).getTime() - new Date(right.currentEta).getTime();
    });
};

export const selectDispatchFilterCounts = (snapshot: TmsFlowSnapshot): DispatchFilterCounts => ({
  all: snapshot.shipments.length,
  atRisk: snapshot.shipments.filter((shipment) => shipment.status === "at_risk" || shipment.status === "delayed").length,
  priority: snapshot.shipments.filter((shipment) => shipment.priority !== "standard").length,
  approvals: snapshot.approvals.filter((approval) => approval.state === "pending_approval" || approval.state === "under_review").length,
});

export const selectShipmentDetail = (
  snapshot: TmsFlowSnapshot,
  shipmentId: string | undefined,
): ShipmentDetail | undefined => {
  if (!shipmentId) return undefined;
  const shipment = snapshot.shipments.find((item) => item.id === shipmentId);
  if (!shipment) return undefined;
  return {
    shipment,
    ...(shipment.driverId ? { driver: snapshot.drivers.find((item) => item.id === shipment.driverId) } : {}),
    ...(shipment.vehicleId ? { vehicle: snapshot.vehicles.find((item) => item.id === shipment.vehicleId) } : {}),
    ...(shipment.routeId ? { route: snapshot.routes.find((item) => item.id === shipment.routeId) } : {}),
    approval: snapshot.approvals.find((item) => item.shipmentId === shipmentId),
    audits: snapshot.audits.filter((audit) => audit.detail.includes(shipmentId)),
  };
};

export const selectApproval = (
  snapshot: TmsFlowSnapshot,
  approvalId: string | undefined,
): RouteApproval | undefined =>
  approvalId ? snapshot.approvals.find((approval) => approval.id === approvalId) : undefined;

export const selectPrimaryAtRiskShipment = (snapshot: TmsFlowSnapshot): Shipment | undefined =>
  snapshot.shipments.find((shipment) => shipment.id === "SF-48291") ??
  snapshot.shipments.find((shipment) => shipment.status === "at_risk");

export const selectDashboard = (snapshot: TmsFlowSnapshot) => ({
  kpis: snapshot.kpis,
  approvals: snapshot.approvals.filter((approval) => approval.state === "pending_approval" || approval.state === "under_review"),
  atRisk: selectPrimaryAtRiskShipment(snapshot),
  onRoad: snapshot.mapVehicles.length,
  audits: snapshot.audits,
});

export const toNetworkVehicles = (vehicles: MapVehicle[]): NetworkVehiclePoint[] =>
  vehicles.map((vehicle) => ({
    id: vehicle.id,
    plate: vehicle.id,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    status: vehicle.status,
    loadReference: vehicle.label,
  }));

export const toNetworkRoutes = (routes: MapRoute[]): NetworkRouteLine[] =>
  routes.map((route) => ({
    id: route.id,
    coordinates: route.coordinates,
    ...(route.proposed ? { isProposed: true } : {}),
    ...(route.status ? { status: route.status } : {}),
  }));
