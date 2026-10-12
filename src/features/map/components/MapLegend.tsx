import React from "react";
import { STATUS_CONFIGS, VEHICLE_CONFIGS } from "../types";
import type { DeliveryStatus, VehicleType } from "../types";

export const MapLegend: React.FC = () => {
  const statusKeys = Object.keys(STATUS_CONFIGS) as DeliveryStatus[];
  const vehicleKeys = Object.keys(VEHICLE_CONFIGS) as VehicleType[];

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(6px)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        fontSize: 12,
        color: "#1e293b",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 240,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "#64748b" }}>
        Chú giải bản đồ
      </div>

      {/* Trạng thái đơn */}
      <div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Điểm giao hàng:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
          {statusKeys.map((st) => (
            <div key={st} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: STATUS_CONFIGS[st].hex,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11 }}>{STATUS_CONFIGS[st].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tuyến xe */}
      <div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Tuyến phương tiện:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {vehicleKeys.map((v) => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 16,
                  height: 3,
                  borderRadius: 2,
                  background: VEHICLE_CONFIGS[v].hex,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11 }}>{VEHICLE_CONFIGS[v].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thang mật độ H3 */}
      <div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>Mật độ gom đơn H3:</div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(to right, #10B981, #EAB308, #F97316, #EF4444)",
            marginBottom: 2,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "#64748b",
          }}
        >
          <span>Thấp</span>
          <span>Cao</span>
        </div>
      </div>
    </div>
  );
};
