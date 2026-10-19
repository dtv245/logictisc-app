import React from "react";
import { formatTimeOnly } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";

export interface RouteProgressBarProps {
  load: Load;
  detourLabel?: string;
}

export const RouteProgressBar: React.FC<RouteProgressBarProps> = ({
  load,
  detourLabel,
}) => {
  const originCity = load.originAddressCity || "Điểm xuất phát";
  const destCity = load.destinationAddressCity || "Điểm đến";
  const pickupTime = load.pickedUpAt || load.requestedPickupDate;
  const deliveryTime = load.deliveredAt || load.requestedDeliveryDate;

  // Determine progress percentage based on load status
  let progressPercent = 15;
  const status = (load.status || "").toLowerCase();

  if (status.includes("deliver") || status.includes("complet")) {
    progressPercent = 100;
  } else if (status.includes("transit") || status.includes("route")) {
    progressPercent = 55;
  } else if (status.includes("pick") || status.includes("dispatch")) {
    progressPercent = 30;
  }

  return (
    <div className="route-progress" data-testid="route-progress-bar">
      <div className="route-progress__track">
        {/* Filled progress bar */}
        <div
          className="route-progress__fill"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Detour arc if AI detour is active */}
        {detourLabel && (
          <div className="route-progress__detour-arc">
            <span className="route-progress__detour-badge">
              ⚡ {detourLabel}
            </span>
          </div>
        )}

        {/* Origin Stop */}
        <div className="route-progress__stop">
          <div className="route-progress__dot route-progress__dot--completed" />
          <div className="route-progress__stop-name">{originCity}</div>
          <div className="route-progress__stop-time">
            {pickupTime ? formatTimeOnly(pickupTime) : "—"}
          </div>
        </div>

        {/* Mid-route milestone (In Transit) */}
        <div className="route-progress__stop">
          <div
            className={`route-progress__dot ${
              progressPercent >= 50
                ? "route-progress__dot--current"
                : "route-progress__dot--active"
            }`}
          >
            {progressPercent >= 50 ? "🚛" : ""}
          </div>
          <div className="route-progress__stop-name">
            {progressPercent >= 50 ? "Đang di chuyển" : "Chờ xuất bến"}
          </div>
          <div className="route-progress__stop-time">
            {load.distance ? `${load.distance} km` : ""}
          </div>
        </div>

        {/* Destination Stop */}
        <div className="route-progress__stop">
          <div
            className={`route-progress__dot ${
              progressPercent >= 100 ? "route-progress__dot--completed" : ""
            }`}
          />
          <div className="route-progress__stop-name">{destCity}</div>
          <div className="route-progress__stop-time">
            {deliveryTime ? `ETA ${formatTimeOnly(deliveryTime)}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
};
