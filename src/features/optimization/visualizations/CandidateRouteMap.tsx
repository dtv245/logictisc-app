import React, { useMemo } from "react";
import Map, {
  NavigationControl,
  ScaleControl,
  Marker,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Alert, Card, Empty, List, Space, Tag, Typography } from "antd";
import { MapPin, Package, Truck, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OptimizationCandidate } from "@/types/optimization.dto";
import { extractRouteGeometry } from "./routeGeometry";

const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ||
  "https://tiles.openfreemap.org/styles/liberty";

export interface CandidateRouteMapProps {
  candidate: OptimizationCandidate | null;
  height?: number | string;
}

export const CandidateRouteMap: React.FC<CandidateRouteMapProps> = ({
  candidate,
  height = 420,
}) => {
  const { t } = useTranslation();

  const extraction = useMemo(
    () => extractRouteGeometry(candidate),
    [candidate],
  );

  // Nếu thiếu dữ liệu toạ độ/polyline: Hiển thị Empty với lý do cụ thể và danh sách trường backend cần bổ sung.
  // Tuyệt đối không tự gọi geocoding đoán toạ độ và KHÔNG vẽ bản đồ rỗng.
  if (!extraction.hasData || !extraction.geometry) {
    return (
      <Card
        data-testid="candidate-route-map-empty"
        bordered
        style={{ width: "100%", background: "#f8fafc" }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small" style={{ width: "100%", textAlign: "left" }}>
              <Typography.Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                {t("optimization.mapMissingTitle")}
              </Typography.Title>
              <Alert
                type="warning"
                showIcon
                icon={<AlertTriangle size={18} />}
                message={t("optimization.mapMissingDesc")}
                description={extraction.reason}
                style={{ marginTop: 8 }}
              />
              {extraction.missingFields.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                    {t("optimization.missingBackendFields")}
                  </Typography.Text>
                  <List
                    size="small"
                    bordered
                    dataSource={extraction.missingFields}
                    renderItem={(item) => (
                      <List.Item>
                        <Typography.Text code copyable>
                          {item.field}
                        </Typography.Text>
                        <span style={{ marginLeft: 8, color: "#475569", fontSize: 13 }}>
                          — {item.description}
                        </span>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          }
        />
      </Card>
    );
  }

  const {
    vehicleCoordinates,
    pickupCoordinates,
    deliveryCoordinates,
    deadheadCoordinates,
    loadedCoordinates,
  } = extraction.geometry;

  // Tính trung điểm và toạ độ hiển thị mặc định
  const initialViewState = useMemo(() => {
    const allLngs = [vehicleCoordinates[0], pickupCoordinates[0], deliveryCoordinates[0]];
    const allLats = [vehicleCoordinates[1], pickupCoordinates[1], deliveryCoordinates[1]];
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);

    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 11,
      pitch: 0,
      bearing: 0,
    };
  }, [vehicleCoordinates, pickupCoordinates, deliveryCoordinates]);

  // GeoJSON cho đoạn chạy rỗng (Xe -> Điểm lấy hàng, nét đứt)
  const deadheadGeoJson = useMemo(
    () => ({
      type: "Feature" as const,
      properties: { name: "deadhead" },
      geometry: {
        type: "LineString" as const,
        coordinates: deadheadCoordinates, // Luôn là [lng, lat][]
      },
    }),
    [deadheadCoordinates],
  );

  // GeoJSON cho đoạn giao hàng (Điểm lấy hàng -> Điểm giao, nét liền)
  const loadedGeoJson = useMemo(
    () => ({
      type: "Feature" as const,
      properties: { name: "loaded" },
      geometry: {
        type: "LineString" as const,
        coordinates: loadedCoordinates, // Luôn là [lng, lat][]
      },
    }),
    [loadedCoordinates],
  );

  return (
    <div
      data-testid="candidate-route-map"
      role="region"
      aria-label={t("optimization.routeMap")}
      className="optimization-map-container"
      style={{
        height,
      }}
    >
      <Map
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
        attributionControl={true}
      >
        {/* Lớp tuyến đường chạy rỗng (nét đứt) */}
        <Source id="candidate-deadhead-source" type="geojson" data={deadheadGeoJson}>
          <Layer
            id="candidate-deadhead-layer"
            type="line"
            paint={{
              "line-color": "#f59e0b", // Màu hổ phách (amber)
              "line-width": 4,
              "line-dasharray": [2, 2], // Nét đứt (đoạn chạy rỗng)
            }}
          />
        </Source>

        {/* Lớp tuyến đường giao hàng có tải (nét liền) */}
        <Source id="candidate-loaded-source" type="geojson" data={loadedGeoJson}>
          <Layer
            id="candidate-loaded-layer"
            type="line"
            paint={{
              "line-color": "#2563eb", // Màu xanh dương (blue)
              "line-width": 5, // Nét liền (đoạn giao hàng)
            }}
          />
        </Source>

        {/* Marker vị trí hiện tại của xe */}
        <Marker
          longitude={vehicleCoordinates[0]}
          latitude={vehicleCoordinates[1]}
          anchor="center"
        >
          <div
            title={`${t("optimization.vehicleLocation")}: [${vehicleCoordinates[0]}, ${vehicleCoordinates[1]}]`}
            aria-label={t("optimization.vehicleLocation")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#3b82f6",
              border: "2px solid #ffffff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
          >
            <Truck size={17} color="#ffffff" />
          </div>
        </Marker>

        {/* Marker điểm lấy hàng */}
        <Marker
          longitude={pickupCoordinates[0]}
          latitude={pickupCoordinates[1]}
          anchor="bottom"
        >
          <div
            title={`${t("optimization.pickupLocation")}: [${pickupCoordinates[0]}, ${pickupCoordinates[1]}]`}
            aria-label={t("optimization.pickupLocation")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#10b981",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              <Package size={16} color="#ffffff" />
            </div>
            <div
              style={{
                width: 2,
                height: 6,
                background: "#10b981",
              }}
            />
          </div>
        </Marker>

        {/* Marker điểm giao hàng */}
        <Marker
          longitude={deliveryCoordinates[0]}
          latitude={deliveryCoordinates[1]}
          anchor="bottom"
        >
          <div
            title={`${t("optimization.deliveryLocation")}: [${deliveryCoordinates[0]}, ${deliveryCoordinates[1]}]`}
            aria-label={t("optimization.deliveryLocation")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              <MapPin size={16} color="#ffffff" />
            </div>
            <div
              style={{
                width: 2,
                height: 6,
                background: "#ef4444",
              }}
            />
          </div>
        </Marker>

        {/* Điều khiển MapLibre */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" unit="metric" />
      </Map>

      {/* Chú giải bản đồ (Map Legend) */}
      <div className="optimization-map-legend">
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#0f172a" }}>
          {t("optimization.routeMap")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 0,
              borderTop: "3px dashed #f59e0b",
            }}
          />
          <span>{t("optimization.deadheadSegment")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 3,
              background: "#2563eb",
            }}
          />
          <span>{t("optimization.loadedSegment")}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderTop: "1px solid #e2e8f0", paddingTop: 4 }}>
          <Tag color="blue" icon={<Truck size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />}>
            {t("optimization.vehicleLocation")}
          </Tag>
          <Tag color="green" icon={<Package size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />}>
            {t("optimization.pickupLocation")}
          </Tag>
          <Tag color="red" icon={<MapPin size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />}>
            {t("optimization.deliveryLocation")}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default CandidateRouteMap;
