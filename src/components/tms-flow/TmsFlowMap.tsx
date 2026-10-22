import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";

export interface TmsFlowMapProps {
  vehicles: NetworkVehiclePoint[];
  routes: NetworkRouteLine[];
  title?: string;
  subtitle?: string;
  testId?: string;
}

export function TmsFlowMap({ vehicles, routes, title = "Live map", subtitle, testId }: TmsFlowMapProps) {
  return (
    <FlowPanel subtitle={subtitle} testId={testId} title={title}>
      <div className="tms-map">
        <div className="tms-map__canvas">
          <NetworkRouteMap routes={routes} vehicles={vehicles} />
        </div>
        <div className="tms-map__legend" aria-label="Map legend">
          <span><i className="tms-map__dot tms-map__dot--moving" aria-hidden="true" /> Moving</span>
          <span><i className="tms-map__dot tms-map__dot--delayed" aria-hidden="true" /> Delayed</span>
          <span><i className="tms-map__line" aria-hidden="true" /> Current route</span>
          <span><i className="tms-map__line tms-map__line--proposed" aria-hidden="true" /> Proposed route</span>
        </div>
        <ul className="tms-map__vehicle-list" aria-label="Vehicles on the map">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <strong>{vehicle.plate}</strong>
              <span>{vehicle.loadReference ?? "Unassigned"}</span>
              <span className={`tms-map__status tms-map__status--${vehicle.status}`}>{vehicle.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </FlowPanel>
  );
}
