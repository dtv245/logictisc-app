import React, { useState } from "react";
import truckReference from "@/assets/dashboard/priority-truck.png";
import { Button, Space } from "antd";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Navigation,
  Sparkles,
  Thermometer,
  User,
  Zap,
} from "lucide-react";
import {
  OpsCard,
} from "./primitives";
import "./PriorityShipmentCard.scss";
import type { PriorityShipmentViewModel } from "@/types/dashboard/priority-shipment.types";

export interface PriorityShipmentCardProps {
  shipments?: readonly PriorityShipmentViewModel[];
  onSelectShipment?: (shipmentId: string) => void;
  className?: string;
}

export const PriorityShipmentCard: React.FC<PriorityShipmentCardProps> = ({
  shipments = [],
  onSelectShipment,
  className = "",
}) => {
  const list = shipments;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentShipment = list[currentIndex] || list[0];

  if (!currentShipment) {
    return (
      <OpsCard className={`ops-priority-shipment-card ${className}`}>
        <div className="ops-priority-empty-state" role="status">
          <strong>Chuyến vận chuyển ưu tiên</strong>
          <span>Chưa có dữ liệu chuyến ưu tiên từ nguồn được xác nhận.</span>
        </div>
      </OpsCard>
    );
  }

  const handlePrev = () => {
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : list.length - 1;
    setCurrentIndex(nextIdx);
    onSelectShipment?.(list[nextIdx]?.id || "");
  };

  const handleNext = () => {
    const nextIdx = currentIndex < list.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    onSelectShipment?.(list[nextIdx]?.id || "");
  };

  return (
    <OpsCard className={`ops-priority-shipment-card ${className}`}>
      {/* 1. Priority Header */}
      <div className="ops-priority-header">
        <div className="ops-priority-header__left">
          <div className="ops-priority-section-row">
            <span className="ops-priority-section-label">Chuyến vận chuyển ưu tiên</span>
            {currentShipment.agent?.label && (
              <div className="ops-priority-agent-banner">
                <Sparkles size={13} /> {currentShipment.agent.label}
              </div>
            )}
          </div>
          <div className="ops-priority-header__title-row">
            <h2 className="ops-priority-header__title">
              {currentShipment.origin} → {currentShipment.destination}
            </h2>
            {currentShipment.status && <span className="ops-priority-risk"><AlertTriangle size={12} /> {currentShipment.status.label}</span>}
            
          </div>
          <div className="ops-priority-header__meta">
            <span>{currentShipment.reference}</span>
            {currentShipment.driver?.name && <span> · Tài xế: {currentShipment.driver.name}</span>}
            {currentShipment.vehicleLabel && <span> · Xe: {currentShipment.vehicleLabel}</span>}
          </div>
        </div>

        {/* Shipment Switcher */}
        {list.length > 1 && (
          <div className="ops-priority-header__switcher">
            <span className="ops-priority-header__switcher-text">
              {currentIndex + 1} / {list.length} chuyến rủi ro
            </span>
            <Space size={4}>
              <Button
                aria-label="Chuyến trước"
                icon={<ChevronLeft size={16} />}
                onClick={handlePrev}
                size="small"
              />
              <Button
                aria-label="Chuyến tiếp theo"
                icon={<ChevronRight size={16} />}
                onClick={handleNext}
                size="small"
              />
            </Space>
          </div>
        )}
      </div>

      <div className="ops-priority-time-stats">
        <div><span>Khung giờ giao</span><strong>{currentShipment.deliveryWindow || currentShipment.scheduledDelivery || "—"}</strong></div>
        <div><span>Dự kiến hiện tại (ETA)</span><strong className={currentShipment.delayMinutes && currentShipment.delayMinutes > 0 ? "is-late" : ""}>{currentShipment.eta || "—"}</strong>{currentShipment.delayMinutes !== undefined && <small>{currentShipment.delayMinutes > 0 ? "+" : ""}{currentShipment.delayMinutes} phút so với kế hoạch</small>}</div>
        <div><span>ETA tuyến thay thế</span><strong className="is-ai">{currentShipment.detour?.eta || "—"}</strong><small>{currentShipment.detour?.label || "Chưa có đề xuất tuyến"}</small></div>
      </div>

      {/* 3. Truck Stage (Telemetry Callouts Grid) */}
      <div className="ops-priority-truck-stage">
        <div className="ops-priority-truck-stage__visual">
          <img className="ops-priority-truck-image" src={truckReference} alt="Xe tải vận chuyển" />
          
        </div>

        <div className="ops-priority-truck-stage__telemetry">
          {/* Driver */}
          {currentShipment.driver?.name && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <User size={13} /> Tài xế
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.driver.name}
              </span>
            </div>
          )}

          {/* Speed */}
          {currentShipment.speed !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Gauge size={13} /> Vận tốc
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.speed.value} {currentShipment.speed.unit}
              </span>
            </div>
          )}

          {/* Reefer temp */}
          {currentShipment.reefer !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Thermometer size={13} /> Nhiệt độ lạnh
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.reefer.temperature}°{currentShipment.reefer.unit}
              </span>
            </div>
          )}

          {/* Fuel */}
          {currentShipment.fuel?.percent !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Zap size={13} /> Nhiên liệu
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.fuel.percent}%
              </span>
            </div>
          )}

          {/* Cargo Weight */}
          {currentShipment.cargo?.weight !== undefined && currentShipment.cargo.weightUnit && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Navigation size={13} /> Tải trọng
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.cargo.weight} {currentShipment.cargo.weightUnit}
              </span>
            </div>
          )}
        </div>

        {/* Telemetry freshness */}
      </div>

      {/* 4. Route Progress (Visual Stepper) */}
      <div className="ops-priority-route-progress">
        <div className="ops-route-label">Tiến độ hành trình</div>
        <div className="ops-route-timeline">
          {(currentShipment.stops || []).map((stop, idx) => (
            <div
              key={stop.id}
              className={`ops-route-timeline__stop ${stop.completed ? "ops-route-timeline__stop--passed" : ""}`}
            >
              <div className="ops-route-timeline__marker">
                <span className="ops-route-timeline__dot" />
                {idx < (currentShipment.stops?.length || 0) - 1 && (
                  <span className="ops-route-timeline__line" />
                )}
              </div>
              <div className="ops-route-timeline__content">
                <div className="ops-route-timeline__name">{stop.name}</div>
                <div className="ops-route-timeline__time">{stop.time || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OpsCard>
  );
};
