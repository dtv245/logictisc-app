import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import type {
  NetworkMapMarker,
  NetworkVehiclePoint,
} from "@/types/dashboard/network-map.types";

export interface TmsFlowMapProps {
  markers: readonly NetworkMapMarker[];
  vehicles?: readonly NetworkVehiclePoint[];
  title?: string;
  subtitle?: string;
  testId?: string;
}

/** Real points only: load pickup/delivery and truck positions. No route geometry. */
export function TmsFlowMap({
  markers,
  vehicles = [],
  title = "Network",
  subtitle,
  testId,
}: TmsFlowMapProps) {
  const hasPoints = markers.length > 0 || vehicles.length > 0;

  return (
    <FlowPanel subtitle={subtitle} testId={testId} title={title}>
      <div className="tms-map">
        <div className="tms-map__canvas">
          <NetworkRouteMap markers={markers} routes={[]} vehicles={vehicles} />
        </div>
        {hasPoints ? (
          <>
            <div className="tms-map__legend" aria-label="Map legend">
              <span><i className="tms-map__dot tms-map__dot--origin" aria-hidden="true" /> Pickup</span>
              <span><i className="tms-map__dot tms-map__dot--destination" aria-hidden="true" /> Delivery</span>
              <span><i className="tms-map__dot tms-map__dot--moving" aria-hidden="true" /> Truck</span>
            </div>
            {vehicles.length > 0 ? (
              <ul className="tms-map__vehicle-list" aria-label="Trucks on the map">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id}>
                    <strong>{vehicle.plate}</strong>
                    <span>{vehicle.loadReference ?? "No driver"}</span>
                    <span className={`tms-map__status tms-map__status--${vehicle.status}`}>
                      {vehicle.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="tms-empty">
            No truck has reported a position yet.
          </p>
        )}
      </div>
    </FlowPanel>
  );
}
