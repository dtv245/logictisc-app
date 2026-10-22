import { ArrowRight, Clock, MapPin } from "lucide-react";

import { StatusTag } from "@/components/StatusTag";
import type { Shipment } from "@/types/tms-flow/tmsFlow.types";
import { formatTime, formatWindow } from "@/utils/tms-flow/format";
import { shipmentStatusMeta } from "@/utils/tms-flow/presentation";

export interface ShipmentCardProps {
  shipment: Shipment;
  driverName?: string;
  selected?: boolean;
  onSelect: () => void;
  compact?: boolean;
}

const minutesBetween = (from: string, to: string): number =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);

export function ShipmentCard({ shipment, driverName, selected = false, onSelect, compact = false }: ShipmentCardProps) {
  const status = shipmentStatusMeta[shipment.status];
  const delta = shipment.proposedEta ? minutesBetween(shipment.currentEta, shipment.proposedEta) : undefined;

  return (
    <button
      aria-pressed={selected}
      className={`tms-shipment-card${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`}
      data-testid={`shipment-card-${shipment.id}`}
      onClick={onSelect}
      type="button"
    >
      <span className="tms-shipment-card__top">
        <span className="tms-shipment-card__id">{shipment.id}</span>
        <StatusTag label={status.label} tone={status.tone} />
      </span>
      <span className="tms-shipment-card__customer">{shipment.customer}</span>
      <span className="tms-shipment-card__lane">
        <MapPin size={13} aria-hidden="true" />
        {shipment.origin} <ArrowRight size={12} aria-hidden="true" /> {shipment.destination}
      </span>
      <span className="tms-shipment-card__meta">
        <span>
          <Clock size={13} aria-hidden="true" />
          Window {formatWindow(shipment.delivery)}
        </span>
        <span className={`tms-shipment-card__eta${delta !== undefined && delta < 0 ? " is-improved" : ""}`}>
          ETA {formatTime(shipment.currentEta)}
          {delta !== undefined ? ` · ${delta > 0 ? "+" : ""}${delta} min proposed` : ""}
        </span>
      </span>
      {driverName ? <span className="tms-shipment-card__driver">Driver · {driverName}</span> : null}
    </button>
  );
}
