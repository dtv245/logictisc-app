import React, { useState } from "react";
import {
  Plus,
  AlertTriangle,
  X,
  CheckCircle,
  Truck,
} from "lucide-react";
import { MapView } from "@/features/map/components/MapView";
import { AddressSearch } from "@/features/map/components/AddressSearch";
import { VehicleFilter } from "@/features/map/components/VehicleFilter";
import { MapLegend } from "@/features/map/components/MapLegend";
import { useDeliveryPoints } from "@/features/map/hooks/useDeliveryPoints";
import { useRoutes } from "@/features/map/hooks/useRoutes";
import { useMapStore } from "@/features/map/store/mapStore";
import { isInsideAnyZone, distanceKm } from "@/features/map/lib/geo";
import type { LngLat, RouteRequest } from "@/features/map/types";
import { STATUS_CONFIGS, VEHICLE_CONFIGS } from "@/features/map/types";

export const MapPage: React.FC = () => {
  // Dữ liệu ~2,000 điểm và 1 vùng giao hàng trung tâm TP.HCM
  const { points, zones, totalCount } = useDeliveryPoints(2000);

  // 2 tuyến đường mẫu (1 xe máy, 1 xe van)
  const sampleRouteRequests: RouteRequest[] = [
    {
      id: "route-motorbike-01",
      vehicleType: "motorbike",
      vehiclePlate: "59-A1 999.88",
      driverName: "Nguyễn Văn Tuấn",
      waypoints: [
        [106.660172, 10.762622], // Bắt đầu: Quận 10
        [106.685000, 10.770000], // Điểm 1: Quận 3
        [106.700000, 10.775000], // Điểm 2: Bến Thành, Q.1
        [106.705000, 10.795000], // Kết thúc: Thị Nghè, Bình Thạnh
      ],
    },
    {
      id: "route-van-02",
      vehicleType: "van",
      vehiclePlate: "51D-456.78",
      driverName: "Trần Minh Hoàng",
      waypoints: [
        [106.645000, 10.790000], // Bắt đầu: Tân Bình
        [106.670000, 10.785000], // Điểm 1: Phú Nhuận
        [106.715000, 10.805000], // Kết thúc: Hàng Xanh, Bình Thạnh
      ],
    },
  ];

  const { data: routes = [] } = useRoutes(sampleRouteRequests);

  // Store selections
  const selectedPoint = useMapStore((s) => s.selectedPoint);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);

  // State thêm điểm giao mới với kiểm tra vùng (Zone validation)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLng, setNewLng] = useState("106.78"); // Toạ độ ví dụ ngoài vùng trung tâm
  const [newLat, setNewLat] = useState("10.85");  // TP. Thủ Đức (ngoài vùng)
  const [newCustomer, setNewCustomer] = useState("Cửa hàng Điện tử Thủ Đức");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Xử lý kiểm tra vùng bằng hàm turf isInsideAnyZone
  const handleValidateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const lng = parseFloat(newLng);
    const lat = parseFloat(newLat);

    if (isNaN(lng) || isNaN(lat)) {
      alert("Toạ độ không hợp lệ.");
      return;
    }

    const coords: LngLat = [lng, lat];
    const isInside = isInsideAnyZone(coords, zones);

    if (!isInside) {
      // Cảnh báo khi điểm nằm ngoài mọi vùng giao hàng
      setWarningMessage(
        `⚠️ CẢNH BÁO: Toạ độ [${lng}, ${lat}] nằm ngoài toàn bộ vùng giao hàng đã thiết lập! Vui lòng kiểm tra lại cước phí ngoại thành hoặc bổ sung vùng mới.`,
      );
    } else {
      setWarningMessage(null);
    }

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setShowAddModal(false);
    }, 2500);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 64px)",
        minHeight: 650,
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Truck size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Bản đồ Điều phối & Gom đơn Logistics
            </h1>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              MapLibre GL + deck.gl • {totalCount.toLocaleString()} đơn hàng • 1 Vùng nội thành • {routes.length} Tuyến đường
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm địa chỉ */}
        <AddressSearch />

        {/* Nút thêm đơn & kiểm tra vùng */}
        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setWarningMessage(null);
            setAddedSuccess(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
          }}
        >
          <Plus size={16} />
          <span>Thêm điểm giao hàng</span>
        </button>
      </div>

      {/* 2. Bản đồ toàn màn hình */}
      <div style={{ position: "relative", flex: 1, width: "100%" }}>
        <MapView points={points} zones={zones} routes={routes} />

        {/* Bảng điều khiển góc trái trên (Bộ lọc xe & Lớp bản đồ) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
            maxWidth: 320,
            width: "100%",
          }}
        >
          <VehicleFilter />
        </div>

        {/* Chú giải góc phải dưới */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 16,
            zIndex: 10,
          }}
        >
          <MapLegend />
        </div>
      </div>

      {/* 3. Panel xem chi tiết điểm giao hàng được click */}
      {selectedPoint && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 16,
            zIndex: 20,
            background: "#ffffff",
            borderRadius: 12,
            padding: "16px 18px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
            maxWidth: 360,
            width: "calc(100% - 32px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: STATUS_CONFIGS[selectedPoint.status]?.hex,
                  background: `${STATUS_CONFIGS[selectedPoint.status]?.hex}15`,
                  padding: "2px 8px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                }}
              >
                {STATUS_CONFIGS[selectedPoint.status]?.label}
              </span>
              <h3 style={{ margin: "6px 0 2px", fontSize: 15, fontWeight: 700 }}>
                {selectedPoint.orderCode}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
            <strong>Khách hàng:</strong> {selectedPoint.customerName}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            <strong>Địa chỉ:</strong> {selectedPoint.address}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              background: "#f8fafc",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            <div>
              <span style={{ color: "#64748b" }}>Tải trọng:</span>{" "}
              <strong>{selectedPoint.weightKg} kg</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Phương tiện:</span>{" "}
              <strong>{VEHICLE_CONFIGS[selectedPoint.vehicleType]?.label}</strong>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <span style={{ color: "#64748b" }}>Khoảng cách tới TT:</span>{" "}
              <strong>
                {distanceKm(selectedPoint.coordinates, [106.660172, 10.762622]).toFixed(1)} km
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => alert(`Điều phối đơn hàng ${selectedPoint.orderCode}`)}
              style={{
                flex: 1,
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Điều phối chuyến
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal Thêm đơn hàng mới & Kiểm tra Vùng giao hàng */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              padding: 24,
              maxWidth: 440,
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Thêm điểm giao hàng & Kiểm tra vùng
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleValidateAndAdd}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Tên người nhận / Cửa hàng
                </label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Kinh độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                    }}
                    required
                  />
                </div>
              </div>

              {/* Thông báo cảnh báo Turf booleanPointInPolygon */}
              {warningMessage && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    color: "#991b1b",
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>{warningMessage}</div>
                </div>
              )}

              {addedSuccess && !warningMessage && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "#166534",
                  }}
                >
                  <CheckCircle size={16} />
                  <span>Điểm giao hàng hợp lệ và nằm trong Vùng giao hàng nội thành!</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Kiểm tra & Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
