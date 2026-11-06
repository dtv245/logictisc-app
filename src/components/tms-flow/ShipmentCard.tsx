import { Tooltip } from "antd";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusTag } from "@/components/StatusTag";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import { formatTmsOverdueDuration, getTmsOverdue } from "@/utils/tms-flow/overdue";
import {
  formatTmsDateTime,
  formatTmsRiskReason,
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
  const { t } = useTranslation();
  const status = operationalStatusMeta[shipment.status];
  const risk = riskMeta[shipment.risk];
  const customerLabel = `${shipment.name} · ${shipment.customerName}`;
  const laneLabel = `${shipment.originCity} → ${shipment.destinationCity}`;
  const truckLabel = truckNumber ?? shipment.assignedTruckNumber ?? t("tmsDispatch.queue.noTruck");
  const overdue = getTmsOverdue(shipment.raw);
  const overdueReasonLabels = overdue.reasons.map((reason) => {
    const duration = formatTmsOverdueDuration(reason.overdueMilliseconds);
    return t("tmsDashboard.overdueReason", {
      phase: t(reason.kind === "pickup" ? "tmsDashboard.pickupPhase" : "tmsDashboard.deliveryPhase"),
      amount: duration.amount,
      unit: t(duration.unit === "days" ? "tmsDashboard.dayUnit" : "tmsDashboard.hourUnit"),
    });
  });
  const terminal = shipment.status === "delivered" || shipment.status === "cancelled";
  const serverRiskReasons = shipment.riskReasons ?? [];
  const riskReasonLabels = [
    ...overdueReasonLabels,
    ...serverRiskReasons
      .filter((reason) =>
        !terminal &&
        !((reason.code === "PICKUP_OVERDUE" && overdue.reasons.some((item) => item.kind === "pickup")) ||
          (reason.code === "DELIVERY_OVERDUE" && overdue.reasons.some((item) => item.kind === "delivery"))) &&
        !(terminal && (reason.code === "PICKUP_OVERDUE" || reason.code === "DELIVERY_OVERDUE")),
      )
      .map(formatTmsRiskReason),
  ];
  const riskSummary = riskReasonLabels.join(" · ");

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
            riskSummary ? (
              <Tooltip title={riskSummary}>
                <span>
                  <StatusTag label={risk.label} tone={risk.tone} />
                </span>
              </Tooltip>
            ) : (
              <StatusTag label={risk.label} tone={risk.tone} />
            )
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
          {t("tmsDispatch.queue.deliveryPrefix")} {formatTmsDateTime(shipment.requestedDeliveryDate)}
        </span>
        <Tooltip title={truckLabel}>
          <span className="tms-shipment-card__eta table-cell-ellipsis">
            {truckLabel}
          </span>
        </Tooltip>
        {riskSummary ? (
          <Tooltip title={riskSummary}>
            <span
              className="tms-shipment-card__eta table-cell-ellipsis"
              data-testid={`shipment-card-risk-reason-${shipment.id}`}
            >
              {riskSummary}
            </span>
          </Tooltip>
        ) : null}
      </span>
      {!compact && shipment.assignedTruckNumber ? (
        <Tooltip title={`${t("tmsDispatch.queue.truckPrefix")} ${shipment.assignedTruckNumber}`}>
          <span className="tms-shipment-card__driver table-cell-ellipsis">
            <Truck size={13} aria-hidden="true" /> {t("tmsDispatch.queue.truckPrefix")} {shipment.assignedTruckNumber}
          </span>
        </Tooltip>
      ) : null}
    </button>
  );
}
