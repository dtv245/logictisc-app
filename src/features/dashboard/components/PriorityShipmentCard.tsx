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
  RelativeTime,
  UnitValue,
} from "./primitives";
import "./PriorityShipmentCard.scss";

export interface ShipmentStop {
  name: string;
  time: string;
  passed?: boolean;
}

export interface PriorityShipmentData {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: string;
  driverName?: string;
  vehiclePlate?: string;
  windowStart: string;
  windowEnd: string;
  eta: string;
  etaDelayMinutes?: number;
  detourEta?: string;
  detourDelayMinutes?: number;
  speed?: number;
  fuelPercent?: number;
  reeferTemp?: number;
  cargoWeight?: number;
  telemetryUpdatedAt?: string;
  agentFlag?: string;
  stops?: ShipmentStop[];
  hasDetourOption?: boolean;
}

export interface PriorityShipmentCardProps {
  shipments?: PriorityShipmentData[];
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
            {currentShipment.agentFlag && (
              <div className="ops-priority-agent-banner">
                <Sparkles size={13} /> {currentShipment.agentFlag}
              </div>
            )}
          </div>
          <div className="ops-priority-header__title-row">
            <h2 className="ops-priority-header__title">
              {currentShipment.origin} → {currentShipment.destination}
            </h2>
            <span className="ops-priority-risk"><AlertTriangle size={12} /> {currentShipment.status}</span>
            
          </div>
          <div className="ops-priority-header__meta">
            <span>{currentShipment.trackingNumber}</span>
            {currentShipment.driverName && <span> · Tài xế: {currentShipment.driverName}</span>}
            {currentShipment.vehiclePlate && <span> · Xe: {currentShipment.vehiclePlate}</span>}
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
        <div><span>Khung giờ giao</span><strong>{currentShipment.windowStart}–{currentShipment.windowEnd}</strong></div>
        <div><span>Dự kiến hiện tại (ETA)</span><strong className="is-late">{currentShipment.eta}</strong><small>+{currentShipment.etaDelayMinutes ?? 0} phút so với kế hoạch</small></div>
        <div><span>ETA tuyến thay thế</span><strong className="is-ai">{currentShipment.detourEta || "—"}</strong><small>{currentShipment.agentFlag ? "Đề xuất từ AI" : "Chưa có đề xuất tuyến"}</small></div>
      </div>

      {/* 3. Truck Stage (Telemetry Callouts Grid) */}
      <div className="ops-priority-truck-stage">
        <div className="ops-priority-truck-stage__visual">
          <img className="ops-priority-truck-image" src={truckReference} alt="Xe tải vận chuyển" />
          
        </div>

        <div className="ops-priority-truck-stage__telemetry">
          {/* Driver */}
          {currentShipment.driverName && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <User size={13} /> Tài xế
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.driverName}
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
                <UnitValue kind="speed" value={currentShipment.speed} />
              </span>
            </div>
          )}

          {/* Reefer temp */}
          {currentShipment.reeferTemp !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Thermometer size={13} /> Nhiệt độ lạnh
              </span>
              <span className="ops-telemetry-callout__value">
                <UnitValue kind="temp" value={currentShipment.reeferTemp} />
              </span>
            </div>
          )}

          {/* Fuel */}
          {currentShipment.fuelPercent !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Zap size={13} /> Nhiên liệu
              </span>
              <span className="ops-telemetry-callout__value">
                {currentShipment.fuelPercent}%
              </span>
            </div>
          )}

          {/* Cargo Weight */}
          {currentShipment.cargoWeight !== undefined && (
            <div className="ops-telemetry-callout">
              <span className="ops-telemetry-callout__label">
                <Navigation size={13} /> Tải trọng
              </span>
              <span className="ops-telemetry-callout__value">
                <UnitValue kind="weight" value={currentShipment.cargoWeight} />
              </span>
            </div>
          )}
        </div>

        {/* Telemetry freshness */}
        {currentShipment.telemetryUpdatedAt && (
          <div className="ops-priority-truck-stage__freshness">
            Cập nhật <RelativeTime at={currentShipment.telemetryUpdatedAt} staleAfterMs={300_000} />
          </div>
        )}
      </div>

      {/* 4. Route Progress (Visual Stepper) */}
      <div className="ops-priority-route-progress">
        <div className="ops-route-label">Tiến độ hành trình</div>
        <div className="ops-route-timeline">
          {(currentShipment.stops || []).map((stop, idx) => (
            <div
              key={stop.name}
              className={`ops-route-timeline__stop ${stop.passed ? "ops-route-timeline__stop--passed" : ""}`}
            >
              <div className="ops-route-timeline__marker">
                <span className="ops-route-timeline__dot" />
                {idx < (currentShipment.stops?.length || 0) - 1 && (
                  <span className="ops-route-timeline__line" />
                )}
              </div>
              <div className="ops-route-timeline__content">
                <div className="ops-route-timeline__name">{stop.name}</div>
                <div className="ops-route-timeline__time">{stop.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OpsCard>
  );
};
