import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatTimeOnly, formatDateOnly } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useLoadAiDispatch } from "@/hooks/ai/useLoadAiDispatch";
import { TruckSvg } from "./TruckSvg";
import { RouteProgressBar } from "./RouteProgressBar";
import { useTranslation } from "react-i18next";

export interface ShipmentHeroCardProps {
  load: Load;
}

export const ShipmentHeroCard: React.FC<ShipmentHeroCardProps> = ({ load }) => {
  const { t } = useTranslation();
  const loadId = load?.id ? String(load.id) : "";
  const { enabled: isAiEnabled } = useAiFeatures();
  const { suggestions } = useLoadAiDispatch({
    loadId,
    enabled: isAiEnabled,
  });

  const activeSuggestion = suggestions[0];
  const originCity = load.originAddressCity || load.originAddressLine1 || t("loads.redesign.originUnavailable");
  const destCity = load.destinationAddressCity || load.destinationAddressLine1 || t("loads.redesign.destinationUnavailable");

  // This is the requested delivery appointment, not a live ETA.
  const deliveryDate = load.requestedDeliveryDate;
  const deliveryTimeFormatted = deliveryDate ? formatTimeOnly(deliveryDate) : "—";

  // Real AI dispatch suggestion utilities
  const onTimeScore = activeSuggestion?.utilities?.onTime?.score;
  const hasAiOptimization = Boolean(onTimeScore && onTimeScore > 0);

  return (
    <div className="shipment-card" data-testid="shipment-hero-card">
      {/* Top Section */}
      <div className="shipment-hero__top">
        <div>
          {isAiEnabled && activeSuggestion && (
            <div className="shipment-hero__event-chip">
              ⚡ {activeSuggestion.status === "executed"
                ? t("loads.redesign.aiRouteApproved")
                : t("loads.redesign.aiDispatchSuggested")}
            </div>
          )}

          <div className="shipment-hero__route-title">
            <span>
              {originCity} → {destCity}
            </span>
            <StatusTag label={load.status} tone={statusTone(load.status)} />
          </div>

          <div className="shipment-hero__subtitle">
            #{load.number} · {load.customerName || load.customerId || t("loads.redesign.customerUnavailable")}
            {load.distance ? ` · ${load.distance} mi` : ""}
          </div>
        </div>

        {/* 3 Stats Blocks */}
        <div className="shipment-hero__stats-group">
          {/* WINDOW */}
          <div className="shipment-hero__stat-box">
            <div className="shipment-hero__stat-label">{t("loads.redesign.deliveryAppointment")}</div>
            <div className="shipment-hero__stat-value">{deliveryTimeFormatted}</div>
            <div className="shipment-hero__stat-sub" style={{ color: "var(--color-text-tertiary)" }}>
              {deliveryDate ? formatDateOnly(deliveryDate) : t("loads.redesign.notScheduled")}
            </div>
          </div>

          {/* ETA NOW */}
          <div className="shipment-hero__stat-box">
            <div className="shipment-hero__stat-label">{t("loads.redesign.loadStatus")}</div>
            <div className="shipment-hero__stat-value" style={{ fontSize: "var(--font-size-md)" }}>
              {load.status || t("loads.redesign.statusUnavailable")}
            </div>
          </div>

          {/* ON-TIME / SAVED */}
          {hasAiOptimization ? (
            <div className="shipment-hero__stat-box">
              <div className="shipment-hero__stat-label">{t("loads.redesign.onTimeScore")}</div>
              <div className="shipment-hero__stat-value" style={{ color: "#7C3AED" }}>
                {Math.round(onTimeScore || 0)}%
              </div>
              <div className="shipment-hero__stat-sub shipment-hero__stat-sub--purple">
                {t("loads.redesign.aiForecast")}
              </div>
            </div>
          ) : (
            <div className="shipment-hero__stat-box">
              <div className="shipment-hero__stat-label">{t("loads.redesign.loadType")}</div>
              <div className="shipment-hero__stat-value" style={{ fontSize: "var(--font-size-lg)" }}>
                {load.type || t("loads.redesign.loadTypeUnavailable")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Truck Graphic Area */}
      <div className="truck-showcase">
        <div className="truck-showcase__svg-wrapper">
          <TruckSvg />
        </div>

        {/* Floating Callouts connected to real load attributes */}
        <div className="truck-showcase__callouts">
          {/* Driver / Assigned Truck Callout */}
          <div className="truck-showcase__callout truck-showcase__callout--driver">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--color-text)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "var(--font-size-base)",
              }}
            >
              <UserOutlined />
            </div>
            <div>
              <div className="truck-showcase__callout-value">
                {load.assignedDispatcherName || t("loads.redesign.dispatcherUnavailable")}
              </div>
              <div className="truck-showcase__callout-label">
                {load.assignedTruckNumber ? `🚛 ${load.assignedTruckNumber}` : t("loads.redesign.truckUnavailable")}
              </div>
            </div>
          </div>

          {/* Load / Cargo Callout */}
          <div className="truck-showcase__callout truck-showcase__callout--load">
            <div className="truck-showcase__callout-label">{t("loads.redesign.cargoAndRate")}</div>
            <div className="truck-showcase__callout-value">
              {load.deliveryCostAmount != null && load.deliveryCostCurrency
                ? `${Number(load.deliveryCostAmount).toLocaleString()} ${load.deliveryCostCurrency}`
                : load.type || t("loads.redesign.standardType")}
            </div>
          </div>
        </div>
      </div>

      {/* Route Progress Bar */}
      <RouteProgressBar load={load} />
    </div>
  );
};
