import { useMemo } from "react";
import type { ReactElement } from "react";
import { Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import { OpsCard } from "@/features/dashboard/components/primitives/Card";
import { createLocaleLabels, resolveSupportedLocale } from "@/locales";
import type { ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";
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
  locale?: ShipmentCardLocale;
  onRoadCount?: number;
}

const mapLabelKeys = ["srLabel", "live", "lastKnown", "noPositions", "onRoad", "vehicles", "openFullMap", "mapStatus", "empty"] as const;

export function NetworkMiniMap({ vehicles = EMPTY_VEHICLES, routes = EMPTY_ROUTES, isLive = false, onOpenFullMap, className = "", locale, onRoadCount }: NetworkMiniMapProps): ReactElement {
  const { i18n } = useTranslation();
  const activeLocale = resolveSupportedLocale(locale ?? i18n.resolvedLanguage);
  const text = createLocaleLabels(i18n.getFixedT(activeLocale), "dashboard.opsView.panels.map", mapLabelKeys);
  const vehicleList = useMemo(() => vehicles.filter((vehicle) => validPosition(vehicle.longitude, vehicle.latitude)), [vehicles]);
  const routeList = useMemo(() => routes.filter((route) => route.coordinates.length >= 2 && route.coordinates.every(([longitude, latitude]) => validPosition(longitude, latitude))), [routes]);
  const hasPositions = vehicleList.length > 0 || routeList.length > 0;
  const title = hasPositions ? isLive ? text.live : text.lastKnown : text.noPositions;
  const headerContent = <>
    <span className={`ops-mini-map-live-dot${isLive && hasPositions ? " is-live" : ""}`} aria-hidden="true" />
    <strong>{title}</strong>
    {hasPositions && <span>{onRoadCount != null ? `${onRoadCount} ${text.onRoad}` : `${vehicleList.length} ${text.vehicles}`}</span>}
  </>;

  return (
    <OpsCard className={`ops-mini-map-card ${className}`}>
      <span className="ops-mini-map-sr-only">{text.srLabel}</span>
      {onOpenFullMap ? (
        <button type="button" className="ops-mini-map-header" aria-label={text.openFullMap} onClick={onOpenFullMap}>
          {headerContent}
        </button>
      ) : (
        <div className="ops-mini-map-header is-static" aria-label={text.mapStatus}>
          {headerContent}
        </div>
      )}
      <div className="ops-mini-map-canvas">
        {hasPositions ? <NetworkRouteMap vehicles={vehicleList} routes={routeList} locale={activeLocale} /> : <div className="ops-mini-map-canvas__empty" role="status"><Navigation size={24} aria-hidden="true" /><span>{text.empty}</span></div>}
      </div>
    </OpsCard>
  );
}

export default NetworkMiniMap;
