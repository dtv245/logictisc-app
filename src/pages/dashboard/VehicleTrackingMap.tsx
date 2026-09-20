import { EnvironmentOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Empty, Skeleton } from "antd";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { VehicleMapPoint } from "./dashboardData";

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
  const [mapError, setMapError] = useState<string>();

  useEffect(() => {
    if (points.length === 0 || !containerRef.current) {
      return;
    }

    let disposed = false;

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

        leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
          .addTo(map);

        const bounds = leaflet.latLngBounds([]);
        points.forEach((point) => {
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
            .bindPopup(popup)
            .addTo(map);
          bounds.extend(position);
        });

        if (points.length === 1) {
          map.setView(bounds.getCenter(), 13);
        } else {
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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [errorMessage, loadErrorText, points, statusLabel]);

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
          ? <LockOutlined className="dashboard-empty-icon" />
          : <EnvironmentOutlined className="dashboard-empty-icon" />}
      />
    );
  }

  return (
    <div
      aria-label={mapLabel}
      className="vehicle-map"
      ref={containerRef}
      role="region"
    />
  );
};
