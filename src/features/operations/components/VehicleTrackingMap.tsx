import { CompassOutlined, EnvironmentOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Radio, Skeleton } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBounds, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { VehicleMapPoint } from "../operations.data";
import "../operations.scss";

interface VehicleTrackingMapProps {
  errorMessage?: string;
  inaccessibleText: string;
  isLoading: boolean;
  loadErrorText: string;
  mapLabel: string;
  noLocationText: string;
  points: readonly VehicleMapPoint[];
  statusLabel: (status: string) => string;
}

export const VehicleTrackingMap = ({
  errorMessage,
  inaccessibleText,
  isLoading,
  loadErrorText,
  mapLabel,
  noLocationText,
  points,
  statusLabel,
}: VehicleTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const boundsRef = useRef<LatLngBounds | null>(null);
  const [mapError, setMapError] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const statusOptions = useMemo(() => {
    const counts = new Map<string, number>();
    points.forEach((p) => {
      if (p.status) {
        counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (selectedStatus === "ALL") return points;
    return points.filter((p) => p.status === selectedStatus);
  }, [points, selectedStatus]);

  const handleFitAll = useCallback(() => {
    if (mapRef.current && boundsRef.current && boundsRef.current.isValid()) {
      mapRef.current.fitBounds(boundsRef.current, { maxZoom: 13, padding: [32, 32] });
    }
  }, []);

  // Effect hợp lệ theo rule 6.1: điều khiển SDK bên thứ ba (Leaflet) trên một DOM node.
  useEffect(() => {
    if (filteredPoints.length === 0 || !containerRef.current) {
      return;
    }

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !containerRef.current) {
          return;
        }

        setMapError(undefined);
        const map = leaflet.map(containerRef.current, {
          scrollWheelZoom: false,
        });
        mapRef.current = map;

        // Tự động đo lại kích thước khi viewport hoặc container thay đổi
        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
          });
          resizeObserver.observe(containerRef.current);
        }

        leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
          .addTo(map);

        const bounds = leaflet.latLngBounds([]);
        filteredPoints.forEach((point) => {
          const position = leaflet.latLng(point.latitude, point.longitude);
          const popup = document.createElement("div");
          const title = document.createElement("strong");
          const status = document.createElement("div");

          title.textContent = point.label;
          status.textContent = statusLabel(point.status);
          popup.append(title, status);

          leaflet
            .circleMarker(position, {
              color: "#ffffff",
              fillColor: "#2563eb",
              fillOpacity: 1,
              radius: 8,
              weight: 3,
            })
            .bindPopup(popup, {
              autoPan: true,
              autoPanPadding: leaflet.point(20, 20),
              closeButton: true,
              keepInView: true,
              maxWidth: Math.min(280, typeof window !== "undefined" ? window.innerWidth - 48 : 280),
              className: "vehicle-map__popup",
            })
            .addTo(map);
          bounds.extend(position);
        });

        boundsRef.current = bounds;

        if (filteredPoints.length === 1) {
          map.setView(bounds.getCenter(), 13);
        } else if (bounds.isValid()) {
          map.fitBounds(bounds, { maxZoom: 13, padding: [32, 32] });
        }
      })
      .catch(() => {
        if (!disposed) {
          setMapError(loadErrorText);
        }
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      boundsRef.current = null;
    };
  }, [errorMessage, filteredPoints, loadErrorText, statusLabel]);

  if (isLoading) {
    return <Skeleton.Node active className="vehicle-map__skeleton" />;
  }

  if (errorMessage || mapError) {
    return <Alert message={mapError ?? errorMessage} showIcon type="error" />;
  }

  if (points.length === 0) {
    return (
      <Empty
        description={inaccessibleText || noLocationText}
        image={inaccessibleText
          ? <LockOutlined className="operations-empty-icon" />
          : <EnvironmentOutlined className="operations-empty-icon" />}
      />
    );
  }

  return (
    <div className="vehicle-map-container">
      <div className="vehicle-map__toolbar">
        {statusOptions.length > 1 ? (
          <div className="vehicle-map__filter-pills" role="region" aria-label="Bộ lọc trạng thái xe">
            <Radio.Group
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="ALL">
                Tất cả ({points.length})
              </Radio.Button>
              {statusOptions.map((st) => (
                <Radio.Button key={st.status} value={st.status}>
                  {statusLabel(st.status)} ({st.count})
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        ) : (
          <div />
        )}

        <Button
          size="small"
          icon={<CompassOutlined />}
          onClick={handleFitAll}
        >
          Định vị xe
        </Button>
      </div>

      <div
        aria-label={mapLabel}
        className="vehicle-map"
        ref={containerRef}
        role="region"
      />
    </div>
  );
};
