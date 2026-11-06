import { Alert, Input, Skeleton, Tag } from "antd";
import { AlertTriangle, MapPin, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import type { TmsTruckCollection, TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import type { TruckResponse } from "@/types/truck.dto";
import { selectDashboardAttentionTrucks } from "@/utils/tms-flow/fleet";
import { isValidCoordinatePair } from "@/utils/tms-flow/mapbox";

const normalizeStatus = (status: string): "available" | "inUse" | "maintenance" | "outOfService" | "unknown" => {
  switch (status.trim().toLowerCase()) {
    case "available": return "available";
    case "in_use": return "inUse";
    case "maintenance": return "maintenance";
    case "out_of_service": return "outOfService";
    default: return "unknown";
  }
};

const truckPlate = (truck: TruckResponse): string => truck.licensePlate?.trim() || truck.number;

export interface TmsFleetMapProps {
  collection?: TmsTruckCollection;
  isLoading: boolean;
  error?: unknown;
  riskLoads: readonly TmsShipmentView[];
}

export function TmsFleetMap({ collection, isLoading, error, riskLoads }: TmsFleetMapProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [focusedVehicleId, setFocusedVehicleId] = useState<string>();
  const trucks = useMemo(() => collection?.items ?? [], [collection?.items]);
  const attentionTrucks = useMemo(
    () => selectDashboardAttentionTrucks(trucks, riskLoads),
    [riskLoads, trucks],
  );
  const visibleAttentionTrucks = attentionTrucks.filter((truck) =>
    truckPlate(truck).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const statusCounts = trucks.reduce<Record<ReturnType<typeof normalizeStatus>, number>>(
    (counts, truck) => {
      counts[normalizeStatus(truck.status)] += 1;
      return counts;
    },
    { available: 0, inUse: 0, maintenance: 0, outOfService: 0, unknown: 0 },
  );
  const locatedTrucks = trucks.filter((truck) =>
    isValidCoordinatePair(truck.currentLocationLatitude, truck.currentLocationLongitude),
  );
  const hasMapPoints = locatedTrucks.length > 0;
  const countScope = collection?.truncated
    ? t("tmsDashboard.fleetCountScope", { loaded: trucks.length, total: collection.totalItems })
    : "";
  const statusSummary = t("tmsDashboard.fleetCount", {
    total: trucks.length,
    available: statusCounts.available,
    inUse: statusCounts.inUse,
    maintenance: statusCounts.maintenance,
    outOfService: statusCounts.outOfService,
    unknown: statusCounts.unknown,
  });

  return (
    <div className="tms-dashboard-fleet" data-testid="dashboard-fleet">
      {isLoading ? (
        <div className="tms-dashboard-map-loading" aria-busy="true" data-testid="dashboard-map-loading">
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ) : null}
      {!hasMapPoints && !isLoading && !error ? (
        <p className="tms-dashboard-map-state" role="status">
          <MapPin size={18} aria-hidden="true" /> {t("tmsDashboard.mapNoLocations")}
        </p>
      ) : null}
      {error && trucks.length === 0 ? (
        <Alert
          className="tms-dashboard-fleet__error"
          message={t("tmsDashboard.fleetError")}
          showIcon
          type="warning"
        />
      ) : null}
      <TmsFlowMap
        dispatchMode
        overviewMode
        dispatchVehicles={locatedTrucks}
        highlightedVehicleId={focusedVehicleId}
        markers={[]}
        subtitle={statusSummary + (countScope ? ` · ${countScope}` : "")}
        testId="dashboard-map"
        title={t("tmsDashboard.mapTitle")}
      />

      <FlowPanel
        subtitle={statusSummary + (countScope ? ` · ${countScope}` : "")}
        testId="dashboard-fleet-panel"
        title={t("tmsDashboard.fleet")}
      >
        {error && trucks.length > 0 ? (
          <Alert
            className="tms-dashboard-fleet__error"
            message={t("tmsDashboard.refreshFailed")}
            showIcon
            type="warning"
          />
        ) : null}
        <Input
          allowClear
          aria-label={t("tmsDashboard.fleetSearch")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("tmsDashboard.fleetSearch")}
          prefix={<Search size={14} aria-hidden="true" />}
          value={search}
        />
        {isLoading && trucks.length === 0 ? (
          <div aria-busy="true" className="tms-dashboard-fleet__loading">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : error && trucks.length === 0 ? null : visibleAttentionTrucks.length === 0 ? (
          <p className="tms-empty" data-testid="dashboard-fleet-empty">
            {search ? t("tmsDashboard.fleetSearchEmpty") : t("tmsDashboard.fleetEmpty")}
          </p>
        ) : (
          <ul className="tms-dashboard-fleet__list">
            {visibleAttentionTrucks.map((truck) => {
              const hasLocation = isValidCoordinatePair(
                truck.currentLocationLatitude,
                truck.currentLocationLongitude,
              );
              const statusKey = normalizeStatus(truck.status);
              const riskAssigned = riskLoads.some((load) =>
                load.assignedTruckId === truck.id ||
                load.assignedTruckNumber?.trim().toLowerCase() === truck.number.trim().toLowerCase() ||
                load.assignedTruckNumber?.trim().toLowerCase() === truck.licensePlate?.trim().toLowerCase(),
              );
              return (
                <li key={truck.id}>
                  <button
                    className="tms-dashboard-fleet__row"
                    data-testid={`dashboard-fleet-truck-${truck.id}`}
                    disabled={!hasLocation}
                    onClick={() => setFocusedVehicleId(truck.id)}
                    type="button"
                  >
                    <span className="tms-dashboard-fleet__plate">
                      <Truck size={16} aria-hidden="true" />
                      <strong>{truckPlate(truck)}</strong>
                    </span>
                    <span className="tms-dashboard-fleet__labels">
                      <Tag>{t(`tmsDashboard.fleetStatus.${statusKey}`)}</Tag>
                      {!hasLocation ? (
                        <Tag icon={<MapPin size={12} aria-hidden="true" />}>
                          {t("tmsDashboard.fleetMissingLocation")}
                        </Tag>
                      ) : null}
                      {riskAssigned ? (
                        <Tag color="warning" icon={<AlertTriangle size={12} aria-hidden="true" />}>
                          {t("tmsDashboard.fleetRisk")}
                        </Tag>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </FlowPanel>
    </div>
  );
}
