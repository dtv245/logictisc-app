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
      <span className="tms-shipment-card__customer">
        {shipment.name} · {shipment.customerName}
      </span>
      <span className="tms-shipment-card__lane">
        <MapPin size={13} aria-hidden="true" />
        {shipment.originCity} <ArrowRight size={12} aria-hidden="true" /> {shipment.destinationCity}
      </span>
      <span className="tms-shipment-card__meta">
        <span>
          <Clock size={13} aria-hidden="true" />
          Due {formatTmsDateTime(shipment.requestedDeliveryDate)}
        </span>
        <span className="tms-shipment-card__eta">
          {truckNumber ?? shipment.assignedTruckNumber ?? "No truck"}
        </span>
      </span>
      {!compact && shipment.assignedTruckNumber ? (
        <span className="tms-shipment-card__driver">
          <Truck size={13} aria-hidden="true" /> Truck {shipment.assignedTruckNumber}
        </span>
      ) : null}
    </button>
  );
}
