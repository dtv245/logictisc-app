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

export interface ShipmentHeroCardProps {
  load: Load;
}

export const ShipmentHeroCard: React.FC<ShipmentHeroCardProps> = ({ load }) => {
  const loadId = load?.id ? String(load.id) : "";
  const { enabled: isAiEnabled } = useAiFeatures();
  const { suggestions } = useLoadAiDispatch({
    loadId,
    enabled: isAiEnabled,
  });

  const activeSuggestion = suggestions[0];
  const originCity = load.originAddressCity || load.originAddressLine1 || "Điểm đi";
  const destCity = load.destinationAddressCity || load.destinationAddressLine1 || "Điểm đến";

  // Calculate ETA & Delivery Window from real DTO fields
  const deliveryDate = load.requestedDeliveryDate;
  const etaFormatted = deliveryDate ? formatTimeOnly(deliveryDate) : "—";

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
                ? "LỘ TRÌNH ĐÃ DUYỆT"
                : "AI ĐỀ XUẤT ĐIỀU PHỐI"}
            </div>
          )}

          <div className="shipment-hero__route-title">
            <span>
              {originCity} → {destCity}
            </span>
            <StatusTag label={load.status} tone={statusTone(load.status)} />
          </div>

          <div className="shipment-hero__subtitle">
            #{load.number} · {load.customerName || load.customerId || "Khách hàng"}
            {load.distance ? ` · ${load.distance} km` : ""}
          </div>
        </div>

        {/* 3 Stats Blocks */}
        <div className="shipment-hero__stats-group">
          {/* WINDOW */}
          <div className="shipment-hero__stat-box">
            <div className="shipment-hero__stat-label">KHUNG GIỜ GIAO</div>
            <div className="shipment-hero__stat-value">{etaFormatted}</div>
            <div className="shipment-hero__stat-sub" style={{ color: "#64748B" }}>
              {deliveryDate ? formatDateOnly(deliveryDate) : "Chưa có"}
            </div>
          </div>

          {/* ETA NOW */}
          <div className="shipment-hero__stat-box">
            <div className="shipment-hero__stat-label">DỰ KIẾN ĐẾN (ETA)</div>
            <div className="shipment-hero__stat-value">{etaFormatted}</div>
            {deliveryDate && (
              <div className="shipment-hero__stat-sub shipment-hero__stat-sub--green">
                ● Trong khung giờ
              </div>
            )}
          </div>

          {/* ON-TIME / SAVED */}
          {hasAiOptimization ? (
            <div className="shipment-hero__stat-box">
              <div className="shipment-hero__stat-label">ĐỘ ĐÚNG GIỜ</div>
              <div className="shipment-hero__stat-value" style={{ color: "#7C3AED" }}>
                {Math.round(onTimeScore || 0)}%
              </div>
              <div className="shipment-hero__stat-sub shipment-hero__stat-sub--purple">
                dự báo điều phối AI
              </div>
            </div>
          ) : (
            <div className="shipment-hero__stat-box">
              <div className="shipment-hero__stat-label">LOẠI XE</div>
              <div className="shipment-hero__stat-value" style={{ fontSize: 18 }}>
                {load.type || "Dry Van"}
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
                background: "#0F172A",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <UserOutlined />
            </div>
            <div>
              <div className="truck-showcase__callout-value">
                {load.assignedDispatcherName || "Tài xế nhận chuyến"}
              </div>
              <div className="truck-showcase__callout-label">
                {load.assignedTruckNumber ? `🚛 ${load.assignedTruckNumber}` : "Chưa gán xe"}
              </div>
            </div>
          </div>

          {/* Load / Cargo Callout */}
          <div className="truck-showcase__callout truck-showcase__callout--load">
            <div className="truck-showcase__callout-label">HÀNG HOÁ & CƯỚC</div>
            <div className="truck-showcase__callout-value">
              {load.deliveryCostAmount != null && load.deliveryCostCurrency
                ? `${Number(load.deliveryCostAmount).toLocaleString()} ${load.deliveryCostCurrency}`
                : load.type || "Tiêu chuẩn"}
            </div>
          </div>
        </div>
      </div>

      {/* Route Progress Bar */}
      <RouteProgressBar
        load={load}
        detourLabel={hasAiOptimization ? "Hành trình tối ưu AI" : undefined}
      />
    </div>
  );
};
