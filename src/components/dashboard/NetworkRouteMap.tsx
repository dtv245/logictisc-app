import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { LatLngBounds, LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { Layers2, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { NetworkRouteMapProps } from "@/types/dashboard/network-map.types";
import "@/components/dashboard/NetworkRouteMap.scss";

interface MapEngine {
  leaflet: typeof import("leaflet");
  map: LeafletMap;
  overlays: LayerGroup;
  tiles: TileLayer;
}

/** Small SVG/raster map: no WebGL context, including on browsers without GPU support. */
export function NetworkRouteMap({ vehicles, routes, locale = "vi" }: NetworkRouteMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<MapEngine>();
  const [error, setError] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showProposed, setShowProposed] = useState(true);
  const boundsRef = useRef<LatLngBounds>();
  const english = locale === "en";

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;

    void import("leaflet").then((leaflet) => {
      if (disposed || !containerRef.current) return;
      setError(false);
      setTileError(false);
      map = leaflet.map(containerRef.current, {
        preferCanvas: false,
        scrollWheelZoom: false,
        zoomControl: true,
        zoomAnimation: false,
        fadeAnimation: false,
      });
      map.zoomControl.setPosition("topright");
      const tiles = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: "dashboard-network-map__tile",
      });
      tiles.on("tileerror", () => { if (!disposed) setTileError(true); });
      tiles.on("tileload", () => { if (!disposed) setTileError(false); });
      tiles.addTo(map);
      const overlays = leaflet.layerGroup().addTo(map);
      const activeMap = map;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => activeMap.invalidateSize({ pan: false }));
        observer.observe(containerRef.current);
      }
      setEngine({ leaflet, map, overlays, tiles });
    }).catch(() => {
      if (!disposed) {
        observer?.disconnect();
        map?.remove();
        map = undefined;
        setError(true);
      }
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
    };
  }, [attempt]);

  useEffect(() => {
    if (!engine || error) return;
    const { leaflet, map, overlays } = engine;
    overlays.clearLayers();
    const bounds = leaflet.latLngBounds([]);
    routes.forEach((route) => {
      const positions: [number, number][] = route.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
      if (!route.isProposed || showProposed) leaflet.polyline(positions, {
        color: route.isProposed ? "#8150ff" : route.status === "delayed" ? "#ff5466" : "#343630",
        weight: 3,
        opacity: .85,
        ...(route.isProposed ? { dashArray: "6 6" } : {}),
      }).addTo(overlays);
      positions.forEach((position) => bounds.extend(position));
    });
    vehicles.forEach((vehicle) => {
      const position: [number, number] = [vehicle.latitude, vehicle.longitude];
      const icon = document.createElement("span");
      icon.className = `dashboard-network-map__vehicle dashboard-network-map__vehicle--${vehicle.status}`;
      if (vehicle.avatarUrl) {
        const avatar = document.createElement("img");
        avatar.src = vehicle.avatarUrl;
        avatar.alt = "";
        icon.append(avatar);
      } else icon.textContent = vehicle.status === "delayed" ? "!" : "▰";
      const marker = leaflet.marker(position, { icon: leaflet.divIcon({ html: icon, className: "dashboard-network-map__marker", iconSize: [20, 20], iconAnchor: [10, 10] }), title: vehicle.plate }).addTo(overlays);
      const label = document.createElement("span");
      label.className = "dashboard-network-map__vehicle-label";
      const title = document.createElement("strong");
      title.textContent = vehicle.loadReference || vehicle.plate;
      label.append(title);
      if (vehicle.delayMinutes != null) {
        const delay = document.createElement("small");
        delay.textContent = `${vehicle.delayMinutes > 0 ? "+" : ""}${vehicle.delayMinutes} min${vehicle.roadLabel ? ` · ${vehicle.roadLabel}` : ""}`;
        label.append(delay);
      }
      marker.bindTooltip(label, { permanent: vehicle.delayMinutes != null, direction: "right", offset: [10, 0], className: "dashboard-network-map__tooltip" });
      bounds.extend(position);
    });
    boundsRef.current = bounds;
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: false });
  }, [engine, error, vehicles, routes, showProposed]);

  const retry = (): void => {
    setEngine(undefined);
    setAttempt((value) => value + 1);
  };

  return (
    <div className="dashboard-network-map" data-map-engine="leaflet-svg">
      <div className="dashboard-network-map__canvas" ref={containerRef} role="region" aria-label="Bản đồ vị trí xe và tuyến vận hành" />
      {!engine && !error && <div className="dashboard-network-map__message" role="status">{english ? "Loading map…" : "Đang tải bản đồ…"}</div>}
      {error && <div className="dashboard-network-map__message" role="alert">
        <span>Không khởi tạo được bản đồ.</span><button type="button" onClick={retry}>Thử lại</button>
      </div>}
      {!error && tileError && <div className="dashboard-network-map__tile-error" role="status">
        <span>Không tải được nền bản đồ. Vị trí và tuyến vẫn được hiển thị.</span>
        <button type="button" onClick={() => engine?.tiles.redraw()}>Tải lại nền</button>
      </div>}
      {engine && !error && <div className="dashboard-network-map__controls">
        <button type="button" aria-label={english ? "Fit vehicles and routes" : "Định vị xe và tuyến"} onClick={() => { if (boundsRef.current?.isValid()) engine.map.fitBounds(boundsRef.current, { padding: [28, 28], maxZoom: 13, animate: false }); }}><LocateFixed size={14} /></button>
        {routes.some((route) => route.isProposed) && <button type="button" aria-label={english ? "Show proposed routes" : "Hiển thị tuyến đề xuất"} aria-pressed={showProposed} onClick={() => setShowProposed((value) => !value)}><Layers2 size={14} /></button>}
      </div>}
    </div>
  );
}
