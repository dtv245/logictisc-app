import React from "react";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import { formatTimeOnly } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";

export interface RouteProgressBarProps {
  load: Load;
}

export const RouteProgressBar: React.FC<RouteProgressBarProps> = ({ load }) => {
  const { t } = useTranslation();
  const originCity = load.originAddressCity || t("loads.redesign.originUnavailable");
  const destCity = load.destinationAddressCity || t("loads.redesign.destinationUnavailable");
  const pickupTime = load.pickedUpAt || load.requestedPickupDate;
  const deliveryTime = load.deliveredAt || load.requestedDeliveryDate;

  // Determine progress percentage based on load status
  const status = (load.status || "").toLowerCase();
  let progressStage = 0;

  if (status.includes("deliver") || status.includes("complet")) {
    progressStage = 2;
  } else if (status.includes("transit") || status.includes("route")) {
    progressStage = 1;
  } else if (status.includes("pick") || status.includes("dispatch")) {
    progressStage = 1;
  }
  const progressPercent = progressStage * 50;

  return (
    <div className="route-progress" data-testid="route-progress-bar">
      <div className="route-progress__track">
        {/* Stage is derived from the Load status; it is not a live vehicle position. */}
        <div
          className="route-progress__fill"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Origin Stop */}
        <div className="route-progress__stop">
          <div className={`route-progress__dot ${progressStage >= 1 ? "route-progress__dot--completed" : "route-progress__dot--active"}`} />
          <div className="route-progress__stop-name">{originCity}</div>
          <div className="route-progress__stop-time">
            {pickupTime ? formatTimeOnly(pickupTime) : "—"}
          </div>
        </div>

        {/* Mid-route milestone (In Transit) */}
        <div className="route-progress__stop">
          <div
            className={`route-progress__dot ${
              progressStage >= 2
                ? "route-progress__dot--completed"
                : progressStage === 1
                  ? "route-progress__dot--current"
                  : "route-progress__dot--active"
            }`}
          >
            {progressStage === 1 ? "🚛" : ""}
          </div>
          <div className="route-progress__stop-name">
            {progressStage >= 1 ? t("loads.redesign.inTransit") : t("loads.redesign.awaitingDeparture")}
          </div>
          <div className="route-progress__stop-time">
            {load.distance ? `${load.distance} mi` : ""}
          </div>
        </div>

        {/* Destination Stop */}
        <div className="route-progress__stop">
          <div
            className={`route-progress__dot ${progressStage >= 2 ? "route-progress__dot--completed" : "route-progress__dot--active"}`}
          />
          <div className="route-progress__stop-name">{destCity}</div>
          <div className="route-progress__stop-time">
            {deliveryTime ? `${t("loads.redesign.scheduled")}: ${formatTimeOnly(deliveryTime)}` : "—"}
          </div>
        </div>
      </div>
      <Typography.Text type="secondary" style={{ display: "block", marginTop: "var(--spacing-sm)", fontSize: 11 }}>
        {t("loads.redesign.statusBasedProgress")}
      </Typography.Text>
    </div>
  );
};
