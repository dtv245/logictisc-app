import React, { useMemo, useCallback } from "react";
import Map, {
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, MapPin } from "lucide-react";

import { useMapStore } from "../store/mapStore";
import { DeckOverlay } from "./DeckOverlay";
import { createDeliveryPointsLayer } from "../layers/deliveryPointsLayer";
import { createH3HexLayer } from "../layers/h3HexLayer";
import { createRouteLayer } from "../layers/routeLayer";
import { createZoneLayer } from "../layers/zoneLayer";
import { aggregatePointsByH3 } from "../lib/h3";
import type { DeliveryPoint, DeliveryZone, H3Cluster, RouteData } from "../types";
import { STATUS_CONFIGS, VEHICLE_CONFIGS } from "../types";

// URL vector map style miễn phí từ biến môi trường (fallback OpenFreeMap Liberty)
const DEFAULT_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  "https://tiles.openfreemap.org/styles/liberty";

export interface MapViewProps {
  points?: DeliveryPoint[];
  zones?: DeliveryZone[];
  routes?: RouteData[];
  style?: React.CSSProperties;
}

export const MapView: React.FC<MapViewProps> = ({
  points = [],
  zones = [],
  routes = [],
  style,
}) => {
  // Store state
  const viewport = useMapStore((s) => s.viewport);
  const setViewport = useMapStore((s) => s.setViewport);
  const flyTo = useMapStore((s) => s.flyTo);

  const selectedVehicles = useMapStore((s) => s.selectedVehicles);
  const selectedStatuses = useMapStore((s) => s.selectedStatuses);

  const pointsEnabled = useMapStore((s) => s.pointsEnabled);
  const h3Enabled = useMapStore((s) => s.h3Enabled);
  const h3Resolution = useMapStore((s) => s.h3Resolution);
  const zonesEnabled = useMapStore((s) => s.zonesEnabled);
  const routesEnabled = useMapStore((s) => s.routesEnabled);

  const selectedPoint = useMapStore((s) => s.selectedPoint);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);

  const hoveredPoint = useMapStore((s) => s.hoveredPoint);
  const setHoveredPoint = useMapStore((s) => s.setHoveredPoint);

  const searchMarker = useMapStore((s) => s.searchMarker);

  // 1. Lọc điểm giao hàng theo loại phương tiện và trạng thái
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      const matchVehicle = selectedVehicles.includes(p.vehicleType);
      const matchStatus = selectedStatuses.includes(p.status);
      return matchVehicle && matchStatus;
    });
  }, [points, selectedVehicles, selectedStatuses]);

  // 2. Lọc tuyến đường theo phương tiện
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => selectedVehicles.includes(r.vehicleType));
  }, [routes, selectedVehicles]);

  // 3. Tính toán cụm H3 theo độ phân giải được chọn
  const h3Clusters = useMemo(() => {
    if (!h3Enabled) return [];
    return aggregatePointsByH3(filteredPoints, h3Resolution);
  }, [h3Enabled, filteredPoints, h3Resolution]);

  // 4. Callback chọn điểm
  const handlePointClick = useCallback(
    (point: DeliveryPoint) => {
      setSelectedPoint(point);
      flyTo(point.coordinates, 15);
    },
    [setSelectedPoint, flyTo],
  );

  // 5. Callback hover điểm (cập nhật state cho tooltip popup)
  const handlePointHover = useCallback(
    (point: DeliveryPoint | null) => {
      setHoveredPoint(point);
    },
    [setHoveredPoint],
  );

  // 6. Nút "Vị trí của tôi" dùng HTML5 Geolocation API
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        flyTo(coords, 15);
      },
      (err) => {
        console.warn("Không lấy được vị trí người dùng:", err.message);
        alert("Không thể truy cập vị trí hiện tại.");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, [flyTo]);

  // 7. Tạo danh sách deck.gl layers và memoize tránh render lại toàn bộ canvas
  const layers = useMemo(() => {
    const list = [];

    // Vùng giao hàng (nằm dưới cùng)
    if (zonesEnabled && zones.length > 0) {
      list.push(createZoneLayer(zones));
    }

    // Lớp ô lục giác H3 gom đơn
    if (h3Enabled && h3Clusters.length > 0) {
      list.push(
        createH3HexLayer(h3Clusters, {
          onHoverHex: (cluster: H3Cluster | null) => {
            if (cluster) {
              // Có thể log hoặc hiển thị tooltip H3 nếu cần
            }
          },
        }),
      );
    }

    // Tuyến đường theo phương tiện
    if (routesEnabled && filteredRoutes.length > 0) {
      list.push(createRouteLayer(filteredRoutes));
    }

    // Điểm giao hàng (nằm trên cùng)
    if (pointsEnabled && filteredPoints.length > 0) {
      list.push(
        createDeliveryPointsLayer(filteredPoints, {
          selectedPointId: selectedPoint?.id,
          onHover: handlePointHover,
          onClick: handlePointClick,
        }),
      );
    }

    return list;
  }, [
    zonesEnabled,
    zones,
    h3Enabled,
    h3Clusters,
    routesEnabled,
    filteredRoutes,
    pointsEnabled,
    filteredPoints,
    selectedPoint?.id,
    handlePointHover,
    handlePointClick,
  ]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <Map
        longitude={viewport.longitude}
        latitude={viewport.latitude}
        zoom={viewport.zoom}
        pitch={viewport.pitch}
        bearing={viewport.bearing}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle={DEFAULT_MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={true}
      >
        {/* Lớp Deck.gl Overlay gắn qua IControl */}
        <DeckOverlay layers={layers} />

        {/* Các điều khiển chuẩn của MapLibre */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Nút Vị trí của tôi (Custom Control) */}
        <div
          style={{
            position: "absolute",
            top: 115,
            right: 10,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handleLocateMe}
            title="Đến vị trí của tôi"
            style={{
              width: 29,
              height: 29,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 4,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            <Crosshair size={17} />
          </button>
        </div>

        {/* Marker vị trí tìm kiếm địa chỉ */}
        {searchMarker && (
          <Marker
            longitude={searchMarker[0]}
            latitude={searchMarker[1]}
            anchor="bottom"
          >
            <div
              style={{
                color: "#ef4444",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                animation: "bounce 0.8s infinite alternate",
              }}
            >
              <MapPin size={32} fill="#ef4444" color="#ffffff" />
            </div>
          </Marker>
        )}

        {/* Tooltip Popup hiển thị thông tin điểm giao khi hover */}
        {hoveredPoint && (
          <Popup
            longitude={hoveredPoint.coordinates[0]}
            latitude={hoveredPoint.coordinates[1]}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={14}
          >
            <div style={{ padding: "4px 6px", fontSize: 12, minWidth: 160 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                {hoveredPoint.orderCode}
              </div>
              <div style={{ color: "#475569", marginBottom: 4 }}>
                {hoveredPoint.customerName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: STATUS_CONFIGS[hoveredPoint.status]?.hex || "#64748b",
                  }}
                />
                <span style={{ fontWeight: 500 }}>
                  {STATUS_CONFIGS[hoveredPoint.status]?.label || hoveredPoint.status}
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ color: "#64748b" }}>{hoveredPoint.weightKg} kg</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Xe: {VEHICLE_CONFIGS[hoveredPoint.vehicleType]?.label}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};
