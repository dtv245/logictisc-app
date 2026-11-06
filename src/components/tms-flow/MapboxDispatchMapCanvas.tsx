import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type {
  DispatchMapStopInfo,
  DispatchMapVehiclePoint,
  DispatchMapVehicleStatus,
  MapboxLngLat,
} from "@/types/tms-flow/mapbox.types";
import {
  VEHICLE_CLUSTER_THRESHOLD,
  computeDispatchMapBounds,
  formatVehicleUpdatedTimeLabel,
  getRouteMidpointLngLat,
  isValidCoordinatePair,
} from "@/utils/tms-flow/mapbox";

export interface MapboxDispatchMapCanvasProps {
  accessToken: string;
  overviewMode?: boolean;
  focusedVehicleId?: string;
  isDarkTheme?: boolean;
  primaryColor?: string;
  selectedLoadId?: string | null;
  pickup?: DispatchMapStopInfo | null;
  delivery?: DispatchMapStopInfo | null;
  routeCoordinates?: MapboxLngLat[];
  isFallbackStraightLine?: boolean;
  routeBadgeText?: string | null;
  vehicles?: DispatchMapVehiclePoint[];
  recenterLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  pickupTitle: string;
  deliveryTitle: string;
  licensePlateLabel: string;
  driverLabel: string;
  noDriverLabel: string;
  statusLabel: string;
  assignedVehicleBadgeLabel: string;
  statusTextMap: Record<DispatchMapVehicleStatus, string>;
  formatUpdatedAtText: (timeStr: string | null) => string;
  onMapUnavailable?: (reason: string) => void;
}

const ROUTE_SOURCE_ID = "dispatch-route-source";
const ROUTE_CASING_LAYER_ID = "dispatch-route-casing";
const ROUTE_LINE_LAYER_ID = "dispatch-route-line";
const ROUTE_DASHED_LAYER_ID = "dispatch-route-dashed";

const VEHICLES_CLUSTER_SOURCE_ID = "dispatch-vehicles-cluster-source";
const VEHICLES_CLUSTER_CIRCLE_LAYER_ID = "dispatch-vehicles-cluster-circle";
const VEHICLES_CLUSTER_COUNT_LAYER_ID = "dispatch-vehicles-cluster-count";
const VEHICLES_UNCLUSTERED_LAYER_ID = "dispatch-vehicles-unclustered-point";

const DEFAULT_VIETNAM_CENTER: [number, number] = [106.660172, 10.762622];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusSymbol(status: DispatchMapVehiclePoint["displayStatus"]): string {
  if (status === "signal_lost") return "▲";
  if (status === "available") return "✓";
  return "■";
}

function statusColors(status: DispatchMapVehiclePoint["displayStatus"]): {
  bg: string;
  border: string;
  text: string;
} {
  if (status === "available") {
    return { bg: "#dcfce7", border: "#15803d", text: "#14532d" };
  }
  if (status === "in_use") {
    return { bg: "#dbeafe", border: "#1d4ed8", text: "#1e3a8a" };
  }
  if (status === "signal_lost" || status === "maintenance") {
    return { bg: "#fef3c7", border: "#b45309", text: "#78350f" };
  }
  return { bg: "#f1f5f9", border: "#475569", text: "#1e293b" };
}

function buildRouteFeatureCollection(
  coordinates: MapboxLngLat[],
  isFallbackStraightLine: boolean,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          mode: isFallbackStraightLine ? "dashed" : "driving",
        },
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    ],
  };
}

function buildVehiclesFeatureCollection(
  vehicles: DispatchMapVehiclePoint[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature",
      properties: {
        id: v.id,
        licensePlate: v.licensePlate,
        driverName: v.driverName ?? "",
        displayStatus: v.displayStatus,
        updatedAt: v.updatedAt ?? "",
        isAssigned: v.isAssignedToSelectedLoad ? 1 : 0,
      },
      geometry: {
        type: "Point",
        coordinates: [v.lng, v.lat],
      },
    })),
  };
}

function customizeMapboxStyleLayers(map: mapboxgl.Map, primaryColor: string): void {
  const style = map.getStyle?.();
  const layers = style?.layers ?? [];

  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    if (id.includes("poi-label") || id.includes("transit-label") || id.includes("building-extrusion")) {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // Ignore non-toggleable layer
      }
      continue;
    }

    if (layer.type === "symbol" && (id.includes("label") || id.includes("place") || id.includes("road"))) {
      try {
        map.setLayoutProperty(layer.id, "text-field", [
          "coalesce",
          ["get", "name_vi"],
          ["get", "name"],
        ]);
      } catch {
        // Ignore if style expression is not supported on this symbol layer
      }
    }
  }

  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer(ROUTE_CASING_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_CASING_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "mode"], "driving"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": 9,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "mode"], "driving"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": primaryColor,
        "line-width": 5,
        "line-opacity": 0.96,
      },
    });
  }

  if (!map.getLayer(ROUTE_DASHED_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_DASHED_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      filter: ["==", ["get", "mode"], "dashed"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": primaryColor,
        "line-width": 4,
        "line-dasharray": [2, 2],
        "line-opacity": 0.88,
      },
    });
  }

  if (!map.getSource(VEHICLES_CLUSTER_SOURCE_ID)) {
    map.addSource(VEHICLES_CLUSTER_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 13,
      clusterRadius: 42,
    });
  }

  if (!map.getLayer(VEHICLES_CLUSTER_CIRCLE_LAYER_ID)) {
    map.addLayer({
      id: VEHICLES_CLUSTER_CIRCLE_LAYER_ID,
      type: "circle",
      source: VEHICLES_CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#1e40af",
        "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 26],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  if (!map.getLayer(VEHICLES_CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: VEHICLES_CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: VEHICLES_CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }

  if (!map.getLayer(VEHICLES_UNCLUSTERED_LAYER_ID)) {
    map.addLayer({
      id: VEHICLES_UNCLUSTERED_LAYER_ID,
      type: "circle",
      source: VEHICLES_CLUSTER_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "displayStatus"],
          "available",
          "#15803d",
          "in_use",
          "#1d4ed8",
          "maintenance",
          "#b45309",
          "signal_lost",
          "#b45309",
          "out_of_service",
          "#475569",
          "#475569",
        ],
        "circle-radius": 7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

export const MapboxDispatchMapCanvas: React.FC<MapboxDispatchMapCanvasProps> = ({
  accessToken,
  overviewMode = false,
  focusedVehicleId,
  isDarkTheme = false,
  primaryColor = "#1d4ed8",
  selectedLoadId,
  pickup,
  delivery,
  routeCoordinates = [],
  isFallbackStraightLine = false,
  routeBadgeText,
  vehicles = [],
  recenterLabel,
  zoomInLabel,
  zoomOutLabel,
  pickupTitle,
  deliveryTitle,
  licensePlateLabel,
  driverLabel,
  noDriverLabel,
  statusLabel,
  assignedVehicleBadgeLabel,
  statusTextMap,
  formatUpdatedAtText,
  onMapUnavailable,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const styleReadyRef = useRef<boolean>(false);
  const currentStyleUrlRef = useRef<string>("");
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const midpointMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vehicleMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const lastFittedKeyRef = useRef<string>("");
  const [mapReady, setMapReady] = useState(false);

  const styleUrl = isDarkTheme
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  const assignedVehicle = useMemo(
    () => vehicles.find((v) => v.isAssignedToSelectedLoad) ?? null,
    [vehicles],
  );

  const boundsBox = useMemo(
    () =>
      computeDispatchMapBounds({
        pickup:
          pickup && pickup.hasValidCoordinates && pickup.lat !== null && pickup.lng !== null
            ? { lat: pickup.lat, lng: pickup.lng }
            : null,
        delivery:
          delivery && delivery.hasValidCoordinates && delivery.lat !== null && delivery.lng !== null
            ? { lat: delivery.lat, lng: delivery.lng }
            : null,
        routeCoordinates,
        assignedVehicle: assignedVehicle ? { lat: assignedVehicle.lat, lng: assignedVehicle.lng } : null,
        fallbackVehicles: vehicles.map((v) => ({ lat: v.lat, lng: v.lng })),
      }),
    [assignedVehicle, delivery, pickup, routeCoordinates, vehicles],
  );

  const fitMapToCurrentBounds = useCallback(
    (force = false) => {
      const map = mapRef.current;
      if (!map || !boundsBox) {
        return;
      }
      const fitKey = `${selectedLoadId ?? "none"}:${boundsBox.west.toFixed(4)},${boundsBox.south.toFixed(4)},${boundsBox.east.toFixed(4)},${boundsBox.north.toFixed(4)}`;
      if (!force && lastFittedKeyRef.current === fitKey) {
        return;
      }
      lastFittedKeyRef.current = fitKey;

      const reduced = prefersReducedMotion();
      try {
        map.fitBounds(
          [
            [boundsBox.west, boundsBox.south],
            [boundsBox.east, boundsBox.north],
          ],
          {
            padding: { top: 72, right: 56, bottom: 88, left: 56 },
            maxZoom: 14,
            pitch: 0,
            bearing: 0,
            duration: reduced ? 0 : 450,
             animate: !reduced,
          },
        );
      } catch {
        console.warn("[MapboxDispatchMapCanvas] Could not fit the map to the selected load bounds.");
      }
    },
    [boundsBox, selectedLoadId],
  );

  // Initialize ONE Mapbox GL instance on mount, remove on unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) {
      console.warn("[MapboxDispatchMapCanvas] WebGL is unavailable; the map cannot be initialized.");
      onMapUnavailable?.("webgl_unsupported");
      return;
    }

    try {
      mapboxgl.accessToken = accessToken;
      currentStyleUrlRef.current = styleUrl;

      const map = new mapboxgl.Map({
        container,
        style: styleUrl,
        center: DEFAULT_VIETNAM_CENTER,
        zoom: 5.5,
        ...(overviewMode ? { minZoom: 4 } : {}),
        pitch: 0,
        bearing: 0,
        pitchWithRotate: false,
        dragRotate: false,
        cooperativeGestures: true,
        attributionControl: true,
      });

      mapRef.current = map;

      const handleLoad = () => {
        styleReadyRef.current = true;
        customizeMapboxStyleLayers(map, primaryColor);
        setMapReady(true);
      };

      const handleStyleLoad = () => {
        styleReadyRef.current = true;
        customizeMapboxStyleLayers(map, primaryColor);
      };

      const handleError = (event: { error?: Error }) => {
        if (!styleReadyRef.current && event?.error) {
          console.warn("[MapboxDispatchMapCanvas] Map initialization failed before the style loaded.");
          onMapUnavailable?.("map_init_error");
        }
      };

      map.on("load", handleLoad);
      map.on("style.load", handleStyleLoad);
      map.on("error", handleError);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          mapRef.current?.resize();
        });
        resizeObserver.observe(container);
      }

      const vehicleMarkers = vehicleMarkersRef.current;

      return () => {
        resizeObserver?.disconnect();
        for (const marker of stopMarkersRef.current) {
          marker.remove();
        }
        stopMarkersRef.current = [];
        midpointMarkerRef.current?.remove();
        midpointMarkerRef.current = null;
        for (const marker of vehicleMarkers.values()) {
          marker.remove();
        }
        vehicleMarkers.clear();
        styleReadyRef.current = false;
        map.remove();
        mapRef.current = null;
      };
    } catch {
      console.warn("[MapboxDispatchMapCanvas] Map initialization threw an exception.");
      onMapUnavailable?.("map_exception");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, overviewMode]);

  // Switch light-v11 / dark-v11 theme without recreating Map instance
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }
    if (currentStyleUrlRef.current !== styleUrl) {
      currentStyleUrlRef.current = styleUrl;
      try {
        map.setStyle(styleUrl);
      } catch {
        console.warn("[MapboxDispatchMapCanvas] Could not update the map style.");
      }
    }
  }, [styleUrl]);

  // Update route GeoJSON source & midpoint badge when selected load or route changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const routeSource = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (routeSource && typeof routeSource.setData === "function") {
      routeSource.setData(buildRouteFeatureCollection(routeCoordinates, isFallbackStraightLine));
    }

    // Update A / B stop markers
    for (const marker of stopMarkersRef.current) {
      marker.remove();
    }
    stopMarkersRef.current = [];

    const stops: DispatchMapStopInfo[] = [];
    if (pickup && pickup.hasValidCoordinates && isValidCoordinatePair(pickup.lat, pickup.lng)) {
      stops.push(pickup);
    }
    if (delivery && delivery.hasValidCoordinates && isValidCoordinatePair(delivery.lat, delivery.lng)) {
      stops.push(delivery);
    }

    for (const stop of stops) {
      const el = document.createElement("button");
      el.type = "button";
      const isPickup = stop.kind === "pickup";
      el.className = `tms-mapbox-stop-marker tms-mapbox-stop-marker--${stop.kind}`;
      el.setAttribute(
        "aria-label",
        `${stop.badge}: ${isPickup ? pickupTitle : deliveryTitle} - ${stop.address}`,
      );
      el.style.cssText = [
        "display:inline-flex",
        "align-items:center",
        "gap:4px",
        "padding:4px 10px",
        "border-radius:999px",
        `background:${isPickup ? "#0f766e" : "#b45309"}`,
        "color:#ffffff",
        "border:2px solid #ffffff",
        "box-shadow:0 2px 8px rgba(15,23,42,0.28)",
        "font-size:13px",
        "font-weight:700",
        "line-height:1.2",
        "cursor:pointer",
      ].join(";");

      const iconSymbol = isPickup ? "▲" : "◆";
      el.innerHTML = `<span aria-hidden="true">${iconSymbol}</span><span>${escapeHtml(stop.badge)}</span>`;

      const popupHtml = `
        <div style="font-size:13px;line-height:1.45;color:#0f172a;max-width:240px;">
          <div style="font-weight:700;margin-bottom:2px;">
            ${escapeHtml(stop.badge)} · ${escapeHtml(isPickup ? pickupTitle : deliveryTitle)}
          </div>
          <div style="font-weight:600;color:#1e293b;">${escapeHtml(stop.label)}</div>
          <div style="color:#475569;margin-top:2px;">${escapeHtml(stop.address)}</div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: true }).setHTML(popupHtml);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([stop.lng as number, stop.lat as number])
        .setPopup(popup)
        .addTo(map);

      stopMarkersRef.current.push(marker);
    }

    // Update midpoint distance/duration label
    midpointMarkerRef.current?.remove();
    midpointMarkerRef.current = null;

    if (routeBadgeText && !isFallbackStraightLine && routeCoordinates.length >= 2) {
      const midpoint = getRouteMidpointLngLat(routeCoordinates);
      if (midpoint) {
        const badgeEl = document.createElement("div");
        badgeEl.className = "tms-mapbox-route-midpoint-badge";
        badgeEl.setAttribute("data-testid", "mapbox-route-midpoint-badge");
        badgeEl.style.cssText = [
          "padding:4px 10px",
          "border-radius:999px",
          "background:rgba(15, 23, 42, 0.88)",
          "color:#ffffff",
          "border:1.5px solid #ffffff",
          "box-shadow:0 2px 8px rgba(15,23,42,0.22)",
          "font-size:12px",
          "font-weight:600",
          "white-space:nowrap",
          "pointer-events:none",
        ].join(";");
        badgeEl.textContent = routeBadgeText;

        midpointMarkerRef.current = new mapboxgl.Marker({
          element: badgeEl,
          anchor: "bottom",
          offset: [0, -8],
        })
          .setLngLat(midpoint)
          .addTo(map);
      }
    }

    fitMapToCurrentBounds(false);
  }, [
    delivery,
    deliveryTitle,
    fitMapToCurrentBounds,
    isFallbackStraightLine,
    mapReady,
    pickup,
    pickupTitle,
    routeBadgeText,
    routeCoordinates,
  ]);

  // Update vehicles (clustered GeoJSON source for large fleets + rich markers for focused/assigned vehicles)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const useClusterLayerForBackground = vehicles.length > VEHICLE_CLUSTER_THRESHOLD;
    const backgroundVehicles = useClusterLayerForBackground
      ? vehicles.filter((v) => !v.isAssignedToSelectedLoad && v.id !== focusedVehicleId)
      : [];
    const domMarkerVehicles = useClusterLayerForBackground
      ? vehicles.filter((v) => v.isAssignedToSelectedLoad || v.id === focusedVehicleId)
      : vehicles;

    const clusterSource = map.getSource(VEHICLES_CLUSTER_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (clusterSource && typeof clusterSource.setData === "function") {
      clusterSource.setData(buildVehiclesFeatureCollection(backgroundVehicles));
    }

    const activeIds = new Set(domMarkerVehicles.map((v) => v.id));
    for (const [id, marker] of vehicleMarkersRef.current.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        vehicleMarkersRef.current.delete(id);
      }
    }

    const reduced = prefersReducedMotion();

    for (const vehicle of domMarkerVehicles) {
      const colors = statusColors(vehicle.displayStatus);
      const statusText = statusTextMap[vehicle.displayStatus];
      const symbol = statusSymbol(vehicle.displayStatus);
      const timeFormatted = formatVehicleUpdatedTimeLabel(vehicle.updatedAt);
      const updatedLine = formatUpdatedAtText(timeFormatted);

      const popupHtml = `
        <div style="font-size:13px;line-height:1.5;color:#0f172a;min-width:190px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">
            ${escapeHtml(licensePlateLabel)}: ${escapeHtml(vehicle.licensePlate)}
          </div>
          ${
            vehicle.isAssignedToSelectedLoad
              ? `<div style="display:inline-block;padding:1px 8px;border-radius:999px;background:#dbeafe;color:#1e40af;font-weight:600;font-size:12px;margin-bottom:4px;">${escapeHtml(assignedVehicleBadgeLabel)}</div>`
              : ""
          }
          <div>
            <strong>${escapeHtml(driverLabel)}:</strong> ${escapeHtml(vehicle.driverName || noDriverLabel)}
          </div>
          <div>
            <strong>${escapeHtml(statusLabel)}:</strong>
            <span style="font-weight:600;color:${colors.text};">${symbol} ${escapeHtml(statusText)}</span>
          </div>
          <div style="color:#475569;margin-top:2px;font-size:12px;">
            ${escapeHtml(updatedLine)}
          </div>
        </div>
      `;

      const existingMarker = vehicleMarkersRef.current.get(vehicle.id);
      if (existingMarker) {
        existingMarker.setLngLat([vehicle.lng, vehicle.lat]);
        existingMarker.getPopup()?.setHTML(popupHtml);
        continue;
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className = vehicle.isAssignedToSelectedLoad
        ? "tms-mapbox-vehicle-marker tms-mapbox-vehicle-marker--assigned"
        : "tms-mapbox-vehicle-marker tms-mapbox-vehicle-marker--secondary";
      el.setAttribute("data-testid", `mapbox-vehicle-marker-${vehicle.id}`);
      el.setAttribute(
        "aria-label",
        `${licensePlateLabel} ${vehicle.licensePlate} - ${statusText}`,
      );
      el.title = `${vehicle.licensePlate} · ${symbol} ${statusText}`;

      const rotationTransform =
        typeof vehicle.heading === "number" ? `transform:rotate(${Math.round(vehicle.heading)}deg);` : "";

      if (vehicle.isAssignedToSelectedLoad) {
        el.style.cssText = [
          "display:inline-flex",
          "align-items:center",
          "gap:6px",
          "padding:5px 10px",
          "border-radius:999px",
          `background:${colors.bg}`,
          `color:${colors.text}`,
          `border:3px solid ${colors.border}`,
          "box-shadow:0 4px 12px rgba(15,23,42,0.30)",
          "font-size:13px",
          "font-weight:700",
          "cursor:pointer",
          "z-index:5",
          reduced ? "" : "transition:transform 0.6s linear",
        ]
          .filter(Boolean)
          .join(";");

        el.innerHTML = `
          <span aria-hidden="true" style="display:inline-block;${rotationTransform}">🚚</span>
          <span>${escapeHtml(vehicle.licensePlate)}</span>
          <span aria-hidden="true" style="font-size:11px;">${symbol}</span>
        `;
      } else {
        el.style.cssText = [
          "display:inline-flex",
          "align-items:center",
          "justify-content:center",
          "width:30px",
          "height:30px",
          "border-radius:999px",
          `background:${colors.bg}`,
          `color:${colors.text}`,
          `border:2px solid ${colors.border}`,
          "box-shadow:0 2px 6px rgba(15,23,42,0.20)",
          "font-size:13px",
          "font-weight:600",
          "cursor:pointer",
          "opacity:0.88",
          reduced ? "" : "transition:transform 0.6s linear",
        ]
          .filter(Boolean)
          .join(";");

        el.innerHTML = `<span aria-hidden="true" style="display:inline-block;${rotationTransform}">🚛</span>`;
      }

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: true }).setHTML(popupHtml);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([vehicle.lng, vehicle.lat])
        .setPopup(popup)
        .addTo(map);

      vehicleMarkersRef.current.set(vehicle.id, marker);
    }
  }, [
    assignedVehicleBadgeLabel,
    driverLabel,
    formatUpdatedAtText,
    licensePlateLabel,
    mapReady,
    noDriverLabel,
    focusedVehicleId,
    statusLabel,
    statusTextMap,
    vehicles,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleClusterClick = (event: mapboxgl.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: [VEHICLES_CLUSTER_CIRCLE_LAYER_ID],
      })[0];
      const clusterId = Number(feature?.properties?.cluster_id);
      const geometry = feature?.geometry;
      const source = map.getSource(VEHICLES_CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!source || !Number.isFinite(clusterId) || geometry?.type !== "Point") return;

      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || typeof zoom !== "number" || !Number.isFinite(zoom)) return;
        map.easeTo({
          center: geometry.coordinates as [number, number],
          zoom,
          duration: prefersReducedMotion() ? 0 : 350,
        });
      });
    };

    const handleVehiclePointClick = (event: mapboxgl.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: [VEHICLES_UNCLUSTERED_LAYER_ID],
      })[0];
      if (feature?.geometry.type !== "Point") return;
      const properties = feature.properties ?? {};
      const plate = String(properties.licensePlate ?? "");
      const driver = String(properties.driverName ?? "");
      const status = statusTextMap[String(properties.displayStatus) as DispatchMapVehicleStatus] ?? statusTextMap.unknown;
      const content = `
        <div style="font-size:13px;line-height:1.5;color:#0f172a;min-width:180px;">
          <strong>${escapeHtml(licensePlateLabel)}:</strong> ${escapeHtml(plate)}
          ${driver ? `<div><strong>${escapeHtml(driverLabel)}:</strong> ${escapeHtml(driver)}</div>` : ""}
          <div><strong>${escapeHtml(statusLabel)}:</strong> ${escapeHtml(status)}</div>
        </div>
      `;
      new mapboxgl.Popup({ closeButton: true, offset: 12 })
        .setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(content)
        .addTo(map);
    };

    const setPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const clearPointer = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, handleClusterClick);
    map.on("click", VEHICLES_UNCLUSTERED_LAYER_ID, handleVehiclePointClick);
    map.on("mouseenter", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, setPointer);
    map.on("mouseleave", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, clearPointer);
    map.on("mouseenter", VEHICLES_UNCLUSTERED_LAYER_ID, setPointer);
    map.on("mouseleave", VEHICLES_UNCLUSTERED_LAYER_ID, clearPointer);
    return () => {
      map.off("click", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, handleClusterClick);
      map.off("click", VEHICLES_UNCLUSTERED_LAYER_ID, handleVehiclePointClick);
      map.off("mouseenter", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, setPointer);
      map.off("mouseleave", VEHICLES_CLUSTER_CIRCLE_LAYER_ID, clearPointer);
      map.off("mouseenter", VEHICLES_UNCLUSTERED_LAYER_ID, setPointer);
      map.off("mouseleave", VEHICLES_UNCLUSTERED_LAYER_ID, clearPointer);
    };
  }, [driverLabel, licensePlateLabel, mapReady, statusLabel, statusTextMap]);

  useEffect(() => {
    if (!overviewMode || !focusedVehicleId || !mapReady) return;
    const map = mapRef.current;
    const vehicle = vehicles.find((item) => item.id === focusedVehicleId);
    const marker = vehicleMarkersRef.current.get(focusedVehicleId);
    if (!map || !vehicle || !marker) return;
    map.flyTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: Math.max(14, map.getZoom()),
      duration: prefersReducedMotion() ? 0 : 500,
    });
    marker.togglePopup();
  }, [focusedVehicleId, mapReady, overviewMode, vehicles]);

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomIn({ duration: prefersReducedMotion() ? 0 : 220 });
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomOut({ duration: prefersReducedMotion() ? 0 : 220 });
  };

  const handleRecenter = () => {
    fitMapToCurrentBounds(true);
  };

  return (
    <div
      className="tms-mapbox-canvas-wrapper"
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 300 }}
    >
      <div
        ref={containerRef}
        data-testid="mapbox-dispatch-canvas"
        style={{ width: "100%", height: "100%", minHeight: 300, borderRadius: 12, overflow: "hidden" }}
      />

      {/* Bộ nút điều khiển tối giản, kích thước vùng bấm >= 40x40px */}
      <div
        className="tms-mapbox-controls"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={handleRecenter}
          data-testid="mapbox-recenter-btn"
          aria-label={recenterLabel}
          style={{
            minHeight: 40,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
          }}
        >
          ⌖ {recenterLabel}
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            data-testid="mapbox-zoom-in-btn"
            aria-label={zoomInLabel}
            title={zoomInLabel}
            style={{
              minWidth: 40,
              minHeight: 40,
              border: "none",
              borderBottom: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            data-testid="mapbox-zoom-out-btn"
            aria-label={zoomOutLabel}
            title={zoomOutLabel}
            style={{
              minWidth: 40,
              minHeight: 40,
              border: "none",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapboxDispatchMapCanvas;
