import React from "react";
import { Tag, Progress } from "antd";
import type { Load } from "@/types/load.types";

export interface ShipmentLoadPlanCardProps {
  load: Load;
}

export const ShipmentLoadPlanCard: React.FC<ShipmentLoadPlanCardProps> = ({ load }) => {
  return (
    <div className="shipment-card" data-testid="shipment-load-plan-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
            Phương tiện & Kế hoạch xếp hàng
          </div>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            {load.assignedTruckNumber ? `Xe phân công: ${load.assignedTruckNumber}` : "Chưa phân bổ phương tiện cụ thể"}
            {load.distance ? ` · Cự ly ${load.distance} km` : ""}
          </div>
        </div>
        <Tag color={load.type?.toLowerCase().includes("reefer") ? "blue" : "default"}>
          {load.type || "Tiêu chuẩn"}
        </Tag>
      </div>

      {/* Cargo overview & specs */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
              Phân loại hàng
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
              {load.isHazmat ? (
                <span style={{ color: "#DC2626" }}>⚠️ Hàng nguy hiểm (HAZMAT)</span>
              ) : (
                "Hàng bách hóa thông thường"
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
              Nguồn tạo chuyến
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
              {load.source || "Thủ công (Manual)"}
            </div>
          </div>
        </div>

        {load.notes && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #E2E8F0", fontSize: 12, color: "#475569" }}>
            <span style={{ fontWeight: 600 }}>Ghi chú vận chuyển: </span>
            {load.notes}
          </div>
        )}
      </div>

      {/* Weight & Load Capacity Indicator */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
          <span>TẢI TRỌNG QUY ƯỚC</span>
          <span style={{ color: "#0F172A" }}>
            {load.deliveryCostAmount != null
              ? `Cước: ${Number(load.deliveryCostAmount).toLocaleString()} ${load.deliveryCostCurrency || ""}`
              : "Tiêu chuẩn"}
          </span>
        </div>
        <Progress
          percent={load.isInProximity ? 85 : 50}
          strokeColor={{ "0%": "#0F172A", "100%": "#7C3AED" }}
          showInfo={false}
          size={["100%", 8]}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
          <span>Điểm lấy hàng</span>
          <span>Đang vận chuyển</span>
          <span>Giao thành công</span>
        </div>
      </div>
    </div>
  );
};
