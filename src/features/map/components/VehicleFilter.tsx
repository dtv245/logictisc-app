import React from "react";
import { Layers, Eye, EyeOff } from "lucide-react";
import { useMapStore } from "../store/mapStore";
import { VEHICLE_CONFIGS, STATUS_CONFIGS } from "../types";
import type { VehicleType, DeliveryStatus } from "../types";

export const VehicleFilter: React.FC = () => {
  const selectedVehicles = useMapStore((s) => s.selectedVehicles);
  const toggleVehicle = useMapStore((s) => s.toggleVehicle);

  const selectedStatuses = useMapStore((s) => s.selectedStatuses);
  const toggleStatus = useMapStore((s) => s.toggleStatus);

  const h3Enabled = useMapStore((s) => s.h3Enabled);
  const toggleH3 = useMapStore((s) => s.toggleH3);
  const h3Resolution = useMapStore((s) => s.h3Resolution);
  const setH3Resolution = useMapStore((s) => s.setH3Resolution);

  const zonesEnabled = useMapStore((s) => s.zonesEnabled);
  const setZonesEnabled = useMapStore((s) => s.setZonesEnabled);

  const routesEnabled = useMapStore((s) => s.routesEnabled);
  const setRoutesEnabled = useMapStore((s) => s.setRoutesEnabled);

  const vehicleKeys = Object.keys(VEHICLE_CONFIGS) as VehicleType[];
  const statusKeys = Object.keys(STATUS_CONFIGS) as DeliveryStatus[];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* 1. Lọc theo phương tiện */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
            marginBottom: 8,
          }}
        >
          Loại phương tiện & Tải trọng
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {vehicleKeys.map((type) => {
            const config = VEHICLE_CONFIGS[type];
            const Icon = config.icon;
            const isSelected = selectedVehicles.includes(type);

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleVehicle(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isSelected
                    ? `1.5px solid ${config.hex}`
                    : "1.5px solid #e2e8f0",
                  background: isSelected ? `${config.hex}15` : "#f8fafc",
                  color: isSelected ? config.hex : "#64748b",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={15} />
                <span>{config.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    opacity: 0.85,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background: isSelected ? `${config.hex}30` : "#e2e8f0",
                  }}
                >
                  ≤{config.maxWeightKg}kg
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Lọc theo trạng thái giao hàng */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
            marginBottom: 8,
          }}
        >
          Trạng thái đơn hàng
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {statusKeys.map((status) => {
            const config = STATUS_CONFIGS[status];
            const isSelected = selectedStatuses.includes(status);

            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  background: isSelected ? config.hex : "#f1f5f9",
                  color: isSelected ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isSelected ? "#ffffff" : config.hex,
                  }}
                />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bật/tắt các lớp bản đồ (H3, Vùng, Tuyến đường) */}
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#64748b",
          }}
        >
          Lớp chuyên đề bản đồ
        </div>

        {/* Toggle H3 Hexagons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#1e293b" }}>
            <Layers size={15} style={{ color: "#7c3aed" }} />
            <span>Gom đơn ô lục giác (H3)</span>
          </span>
          <button
            type="button"
            onClick={toggleH3}
            style={{
              background: h3Enabled ? "#7c3aed" : "#e2e8f0",
              color: h3Enabled ? "#ffffff" : "#64748b",
              border: "none",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {h3Enabled ? "BẬT" : "TẮT"}
          </button>
        </div>

        {/* Slider điều chỉnh độ phân giải H3 */}
        {h3Enabled && (
          <div
            style={{
              background: "#f8fafc",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#64748b",
                marginBottom: 4,
              }}
            >
              <span>Độ phân giải (Resolution):</span>
              <strong style={{ color: "#7c3aed" }}>Cấp {h3Resolution}</strong>
            </div>
            <input
              type="range"
              min={6}
              max={10}
              step={1}
              value={h3Resolution}
              onChange={(e) => setH3Resolution(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7c3aed" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              <span>6 (Khu vực)</span>
              <span>8 (Phường/Xã)</span>
              <span>10 (Khu phố)</span>
            </div>
          </div>
        )}

        {/* Toggle Vùng giao hàng */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#1e293b" }}>Vùng giao hàng (Polygon)</span>
          <button
            type="button"
            onClick={() => setZonesEnabled(!zonesEnabled)}
            style={{
              background: zonesEnabled ? "#3b82f6" : "#e2e8f0",
              color: zonesEnabled ? "#ffffff" : "#64748b",
              border: "none",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {zonesEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
            {zonesEnabled ? "Hiện" : "Ẩn"}
          </button>
        </div>

        {/* Toggle Tuyến đường */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#1e293b" }}>Tuyến đường (Routes)</span>
          <button
            type="button"
            onClick={() => setRoutesEnabled(!routesEnabled)}
            style={{
              background: routesEnabled ? "#10b981" : "#e2e8f0",
              color: routesEnabled ? "#ffffff" : "#64748b",
              border: "none",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {routesEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
            {routesEnabled ? "Hiện" : "Ẩn"}
          </button>
        </div>
      </div>
    </div>
  );
};
