import { useMemo } from "react";
import type { ReactElement } from "react";
import { Navigation } from "lucide-react";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import { OpsCard } from "@/features/dashboard/components/primitives/Card";
import type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";
import "@/features/dashboard/components/NetworkMiniMap.scss";

export type { NetworkRouteLine, NetworkVehiclePoint } from "@/types/dashboard/network-map.types";

const validPosition = (longitude: number, latitude: number): boolean => Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
const EMPTY_VEHICLES: readonly NetworkVehiclePoint[] = [];
const EMPTY_ROUTES: readonly NetworkRouteLine[] = [];

export interface NetworkMiniMapProps {
  vehicles?: readonly NetworkVehiclePoint[];
  routes?: readonly NetworkRouteLine[];
  isLive?: boolean;
  onOpenFullMap?: () => void;
  className?: string;
  locale?: "vi" | "en";
  onRoadCount?: number;
}

export function NetworkMiniMap({ vehicles = EMPTY_VEHICLES, routes = EMPTY_ROUTES, isLive = false, onOpenFullMap, className = "", locale = "vi", onRoadCount }: NetworkMiniMapProps): ReactElement {
  const vehicleList = useMemo(() => vehicles.filter((vehicle) => validPosition(vehicle.longitude, vehicle.latitude)), [vehicles]);
  const routeList = useMemo(() => routes.filter((route) => route.coordinates.length >= 2 && route.coordinates.every(([longitude, latitude]) => validPosition(longitude, latitude))), [routes]);
  const hasPositions = vehicleList.length > 0 || routeList.length > 0;
  const english = locale === "en";
  const title = hasPositions ? isLive ? english ? "Live network" : "Trực tuyến" : english ? "Last known" : "Vị trí gần nhất" : english ? "No positions" : "Chưa có vị trí xe";
  const headerContent = <>
    <span className={`ops-mini-map-live-dot${isLive && hasPositions ? " is-live" : ""}`} aria-hidden="true" />
    <strong>{title}</strong>
    {hasPositions && <span>{onRoadCount != null ? `${onRoadCount} ${english ? "on road" : "xe trên đường"}` : `${vehicleList.length} ${english ? "vehicles" : "xe"}`}</span>}
  </>;

  return (
    <OpsCard className={`ops-mini-map-card ${className}`}>
      <span className="ops-mini-map-sr-only">Mạng lưới xe thời gian thực</span>
      {onOpenFullMap ? (
        <button type="button" className="ops-mini-map-header" aria-label={english ? "Open full map" : "Chi tiết bản đồ"} onClick={onOpenFullMap}>
          {headerContent}
        </button>
      ) : (
        <div className="ops-mini-map-header is-static" aria-label={english ? "Map status" : "Trạng thái bản đồ"}>
          {headerContent}
        </div>
      )}
      <div className="ops-mini-map-canvas">
        {hasPositions ? <NetworkRouteMap vehicles={vehicleList} routes={routeList} locale={locale} /> : <div className="ops-mini-map-canvas__empty" role="status"><Navigation size={24} aria-hidden="true" /><span>{english ? "No vehicle positions or routes available." : "Chưa có dữ liệu vị trí xe hoặc tuyến vận hành."}</span></div>}
      </div>
    </OpsCard>
  );
}

export default NetworkMiniMap;
