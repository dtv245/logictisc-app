import { Tooltip } from "antd";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";

import { StatusTag } from "@/components/StatusTag";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import {
  formatTmsDateTime,
  operationalStatusMeta,
  riskMeta,
} from "@/utils/tms-flow/presentation";

export interface ShipmentCardProps {
  shipment: TmsShipmentView;
  truckNumber?: string;
  selected?: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export function ShipmentCard({
  shipment,
  truckNumber,
  selected = false,
  onSelect,
  compact = false,
}: ShipmentCardProps) {
  const status = operationalStatusMeta[shipment.status];
  const risk = riskMeta[shipment.risk];
  const customerLabel = `${shipment.name} · ${shipment.customerName}`;
  const laneLabel = `${shipment.originCity} → ${shipment.destinationCity}`;
  const truckLabel = truckNumber ?? shipment.assignedTruckNumber ?? "Chưa phân công";

  return (
    <button
      aria-pressed={selected}
      className={`tms-shipment-card${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`}
      data-testid={`shipment-card-${shipment.id}`}
      onClick={onSelect}
      type="button"
    >
      <span className="tms-shipment-card__top">
        <span className="tms-shipment-card__id">#{shipment.number}</span>
        <span className="tms-shipment-card__tags">
          <StatusTag label={status.label} tone={status.tone} />
          {shipment.risk !== "none" ? (
            <StatusTag label={risk.label} tone={risk.tone} />
          ) : null}
        </span>
      </span>
      <Tooltip title={customerLabel}>
        <span className="tms-shipment-card__customer table-cell-ellipsis">
          {customerLabel}
        </span>
      </Tooltip>
      <Tooltip title={laneLabel}>
        <span className="tms-shipment-card__lane">
          <MapPin size={13} aria-hidden="true" />
          <span className="table-cell-ellipsis">
            {shipment.originCity} <ArrowRight size={12} aria-hidden="true" /> {shipment.destinationCity}
          </span>
        </span>
      </Tooltip>
      <span className="tms-shipment-card__meta">
        <span>
          <Clock size={13} aria-hidden="true" />
          Giao {formatTmsDateTime(shipment.requestedDeliveryDate)}
        </span>
        <Tooltip title={truckLabel}>
          <span className="tms-shipment-card__eta table-cell-ellipsis">
            {truckLabel}
          </span>
        </Tooltip>
      </span>
      {!compact && shipment.assignedTruckNumber ? (
        <Tooltip title={`Xe ${shipment.assignedTruckNumber}`}>
          <span className="tms-shipment-card__driver table-cell-ellipsis">
            <Truck size={13} aria-hidden="true" /> Xe {shipment.assignedTruckNumber}
          </span>
        </Tooltip>
      ) : null}
    </button>
  );
}
