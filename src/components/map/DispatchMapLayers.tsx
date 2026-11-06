import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { DispatchMapVehicleInput, MapboxLngLat } from "@/types/tms-flow/mapbox.types";
import type { DispatchLoadStopSource } from "@/utils/tms-flow/mapbox";
import {
  extractLoadStopInfo,
  formatVietnameseRouteBadge,
  isValidCoordinatePair,
  normalizeDispatchMapVehicles,
} from "@/utils/tms-flow/mapbox";

import { useMap } from "./MapContext";
import {
  isMapStyleReady,
  safelyGetSource,
  safelyRemoveImage,
  safelyRemoveLayer,
  safelyRemoveSource,
} from "./mapStyleSafety";
import { VehicleLayer } from "./VehicleLayer";
import type { VehicleLayerItem } from "./vehicleLayer.types";

const ROUTE_SOURCE_ID = "dispatch-route";
const STOPS_SOURCE_ID = "dispatch-stops";
const ROUTE_LAYER_ID = "dispatch-route-line";
const STOPS_LAYER_ID = "dispatch-stop-pins";
const PICKUP_IMAGE_ID = "dispatch-stop-pickup";
const DELIVERY_IMAGE_ID = "dispatch-stop-delivery";

interface DispatchMapLayersProps {
  load?: DispatchLoadStopSource | null;
  vehicles: readonly DispatchMapVehicleInput[];
  routeCoordinates: readonly MapboxLngLat[];
  isRouteLoading?: boolean;
  isRouteError?: boolean;
  isFallbackStraightLine?: boolean;
  focusVehicleId?: string | null;
  focusVehicleNumber?: string | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  onVehicleSelect?: (id: string) => void;
}

interface PointCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { badge: "A" | "B" };
  }>;
}

interface LineCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "LineString"; coordinates: MapboxLngLat[] };
    properties: Record<string, never>;
  }>;
}

function createStopPin(badge: "A" | "B"): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 56;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.clearRect(0, 0, 48, 56);
  context.fillStyle = badge === "A" ? "#2563eb" : "#d97706";
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(24, 22, 18, Math.PI, 0);
  context.lineTo(24, 54);
  context.lineTo(6, 22);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "bold 19px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(badge, 24, 22);
  return context.getImageData(0, 0, 48, 56);
}

function buildStopCollection(load?: DispatchLoadStopSource | null): PointCollection {
  const stopInfo = extractLoadStopInfo(load);
  if (!stopInfo) return { type: "FeatureCollection", features: [] };
  const features: PointCollection["features"] = [];
  if (stopInfo.pickup.hasValidCoordinates && stopInfo.pickup.lng != null && stopInfo.pickup.lat != null) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [stopInfo.pickup.lng, stopInfo.pickup.lat] },
      properties: { badge: "A" },
    });
  }
  if (stopInfo.delivery.hasValidCoordinates && stopInfo.delivery.lng != null && stopInfo.delivery.lat != null) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [stopInfo.delivery.lng, stopInfo.delivery.lat] },
      properties: { badge: "B" },
    });
  }
  return { type: "FeatureCollection", features };
}

function buildRouteCollection(coordinates: readonly MapboxLngLat[]): LineCollection {
  return {
    type: "FeatureCollection",
    features: coordinates.length >= 2
      ? [{
          type: "Feature",
          geometry: { type: "LineString", coordinates: [...coordinates] },
          properties: {},
        }]
      : [],
  };
}

function addDispatchLayers(map: MapboxMap, load?: DispatchLoadStopSource | null, coordinates: readonly MapboxLngLat[] = [], isFallback = false) {
  if (!map.hasImage(PICKUP_IMAGE_ID)) map.addImage(PICKUP_IMAGE_ID, createStopPin("A"), { pixelRatio: 2 });
  if (!map.hasImage(DELIVERY_IMAGE_ID)) map.addImage(DELIVERY_IMAGE_ID, createStopPin("B"), { pixelRatio: 2 });

  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: buildRouteCollection(coordinates) as never });
  }
  if (!map.getSource(STOPS_SOURCE_ID)) {
    map.addSource(STOPS_SOURCE_ID, { type: "geojson", data: buildStopCollection(load) as never });
  }

  const standardStyle = map.getStyle().name?.toLowerCase().includes("standard") ?? false;
  const slot = standardStyle ? { slot: "top" as const } : {};
  if (!map.getLayer(ROUTE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      ...slot,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#7c3aed",
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 3, 12, 5],
        "line-opacity": 0.88,
        "line-dasharray": isFallback ? [2, 1.5] : [1, 0],
      },
    });
  }
  if (!map.getLayer(STOPS_LAYER_ID)) {
    map.addLayer({
      id: STOPS_LAYER_ID,
      type: "symbol",
      source: STOPS_SOURCE_ID,
      ...slot,
      layout: {
        "icon-image": ["match", ["get", "badge"], "A", PICKUP_IMAGE_ID, DELIVERY_IMAGE_ID],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-size": 0.72,
      },
    });
  }

  (map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource).setData(buildRouteCollection(coordinates) as never);
  (map.getSource(STOPS_SOURCE_ID) as GeoJSONSource).setData(buildStopCollection(load) as never);
}

function createVehicleItems(vehicles: readonly DispatchMapVehicleInput[]): VehicleLayerItem[] {
  return normalizeDispatchMapVehicles([...vehicles]).map((vehicle) => ({
    id: vehicle.id,
    lng: vehicle.lng,
    lat: vehicle.lat,
    bearing: vehicle.heading,
    status: vehicle.speedKmh == null ? "unknown" : vehicle.speedKmh > 0 ? "moving" : "idle",
    label: vehicle.licensePlate,
  }));
}

function useDispatchMapSources({
  load,
  routeCoordinates,
  isFallbackStraightLine,
}: Pick<DispatchMapLayersProps, "load" | "routeCoordinates" | "isFallbackStraightLine">) {
  const map = useMap();
  const latestRef = useRef({ load, routeCoordinates, isFallbackStraightLine });

  useEffect(() => {
    latestRef.current = { load, routeCoordinates, isFallbackStraightLine };
  }, [isFallbackStraightLine, load, routeCoordinates]);

  useEffect(() => {
    let disposed = false;
    const install = () => {
      if (disposed) return;
      try {
        if (!isMapStyleReady(map)) return;
        const latest = latestRef.current;
        addDispatchLayers(map, latest.load, latest.routeCoordinates, latest.isFallbackStraightLine);
      } catch {
        console.warn("[DispatchMapLayers] Load route layers could not be added to the current map style.");
      }
    };
    map.on("style.load", install);
    if (map.isStyleLoaded()) install();
    return () => {
      disposed = true;
      try {
        map.off("style.load", install);
      } catch {
        // The map may already be disposing after a WebGL context loss.
      }
      [STOPS_LAYER_ID, ROUTE_LAYER_ID].forEach((id) => safelyRemoveLayer(map, id));
      [STOPS_SOURCE_ID, ROUTE_SOURCE_ID].forEach((id) => safelyRemoveSource(map, id));
      [PICKUP_IMAGE_ID, DELIVERY_IMAGE_ID].forEach((id) => safelyRemoveImage(map, id));
    };
  }, [map]);

  useEffect(() => {
    if (!isMapStyleReady(map)) return;
    try {
      const routeSource = safelyGetSource<GeoJSONSource>(map, ROUTE_SOURCE_ID);
      const stopsSource = safelyGetSource<GeoJSONSource>(map, STOPS_SOURCE_ID);
      routeSource?.setData(buildRouteCollection(routeCoordinates) as never);
      stopsSource?.setData(buildStopCollection(load) as never);
      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.setPaintProperty(ROUTE_LAYER_ID, "line-dasharray", isFallbackStraightLine ? [2, 1.5] : [1, 0]);
      }
    } catch {
      // Updates are retried by the next style.load event after restoration.
    }
  }, [isFallbackStraightLine, load, map, routeCoordinates]);
}

function DispatchMapState({
  load,
  vehicles,
  routeCoordinates,
  isRouteLoading,
  isRouteError,
  isFallbackStraightLine,
  distanceMeters,
  durationSeconds,
  focusVehicleId,
  focusVehicleNumber,
}: DispatchMapLayersProps) {
  const { t } = useTranslation();
  const stopInfo = useMemo(() => extractLoadStopInfo(load), [load]);
  const hasCoordinates = Boolean(stopInfo?.pickup.hasValidCoordinates && stopInfo.delivery.hasValidCoordinates);
  const hasAssignedTruck = Boolean(
    load?.assignedTruckId?.trim() || load?.assignedTruckNumber?.trim() || focusVehicleId || focusVehicleNumber,
  );
  const assignedLocation = vehicles.some((vehicle) => {
    const numbersToMatch = [load?.assignedTruckNumber, focusVehicleNumber]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    const matches = (load?.assignedTruckId && vehicle.id === load.assignedTruckId) ||
      (focusVehicleId && vehicle.id === focusVehicleId) ||
      numbersToMatch.includes(vehicle.number?.toLowerCase() ?? "") ||
      numbersToMatch.includes(vehicle.licensePlate?.toLowerCase() ?? "");
    return Boolean(matches && isValidCoordinatePair(vehicle.currentLocationLatitude, vehicle.currentLocationLongitude));
  });
  const routeFailed = hasCoordinates && !isRouteLoading && (isRouteError || isFallbackStraightLine);
  const coordinateMessage = !hasCoordinates
    ? !stopInfo?.pickup.hasValidCoordinates && !stopInfo?.delivery.hasValidCoordinates
      ? t("tmsDispatch.map.missingBothCoordinatesTitle")
      : !stopInfo?.pickup.hasValidCoordinates
        ? t("tmsDispatch.map.missingPickupCoordinates")
        : t("tmsDispatch.map.missingDeliveryCoordinates")
    : null;
  const messages = [
    load && coordinateMessage
      ? `${coordinateMessage}. ${t("tmsDispatch.map.checkLoadAddressHint")}.`
      : null,
    routeFailed ? t("tmsDispatch.map.routeCalculationFailed") : null,
    load && !hasAssignedTruck ? t("tmsDispatch.map.noTruckAssigned") : null,
    load && hasAssignedTruck && !assignedLocation ? t("tmsDispatch.map.noAssignedVehicleLocation") : null,
    load && hasCoordinates && isRouteLoading ? t("tmsDispatch.map.routeLoading") : null,
  ].filter((message): message is string => Boolean(message));
  const routeBadge = !routeFailed && !isRouteLoading
    ? formatVietnameseRouteBadge(distanceMeters, durationSeconds)
    : null;

  return (
    <>
      {messages.length > 0 ? (
        <div className="map-shell__dispatch-status" data-testid="dispatch-map-status-banner" role="status">
          <strong><span aria-hidden="true">ⓘ</span> {messages[0]}</strong>
          {messages.slice(1).map((message) => <span key={message}>{message}</span>)}
        </div>
      ) : null}
      {load ? (
        <span data-testid="dispatch-map-text-summary">
          <strong>{t("tmsDispatch.map.distanceDurationLabel")}:</strong> {routeBadge ?? "—"}
        </span>
      ) : null}
      <div className="map-shell__legend" aria-label={t("tmsDispatch.map.legend")}>
        <span><b>▲ A:</b> {t("tmsDispatch.map.origin")}</span>
        <span><b>◆ B:</b> {t("tmsDispatch.map.destination")}</span>
        <span><b>▰</b> {t("tmsDispatch.map.legendVehicleLocation")}</span>
        {routeCoordinates.length >= 2 ? (
          <span className="map-shell__legend-route">{t("tmsDispatch.map.disclaimer")}</span>
        ) : null}
      </div>
    </>
  );
}

export function DispatchMapLayers(props: DispatchMapLayersProps) {
  const { load, vehicles, routeCoordinates, focusVehicleId, focusVehicleNumber } = props;
  const map = useMap();
  const stopInfo = useMemo(() => extractLoadStopInfo(load), [load]);
  const vehicleItems = useMemo(() => createVehicleItems(vehicles), [vehicles]);
  const assignedVehicle = vehicleItems.find((vehicle) =>
    (focusVehicleId && vehicle.id === focusVehicleId) ||
    (focusVehicleNumber && vehicle.label?.toLowerCase() === focusVehicleNumber.toLowerCase()) ||
    (load?.assignedTruckId && vehicle.id === load.assignedTruckId) ||
    (load?.assignedTruckNumber && vehicle.label?.toLowerCase() === load.assignedTruckNumber.toLowerCase()),
  );
  const selectedVehicleId = assignedVehicle?.id;

  useDispatchMapSources(props);

  useEffect(() => {
    if (!load) return undefined;
    const points: MapboxLngLat[] = [];
    if (stopInfo?.pickup.hasValidCoordinates && stopInfo.pickup.lng != null && stopInfo.pickup.lat != null) {
      points.push([stopInfo.pickup.lng, stopInfo.pickup.lat]);
    }
    if (stopInfo?.delivery.hasValidCoordinates && stopInfo.delivery.lng != null && stopInfo.delivery.lat != null) {
      points.push([stopInfo.delivery.lng, stopInfo.delivery.lat]);
    }
    if (assignedVehicle) points.push([assignedVehicle.lng, assignedVehicle.lat]);
    if (points.length === 0) return undefined;

    const frame = window.requestAnimationFrame(() => {
      try {
        if (!isMapStyleReady(map)) return;
        if (points.length === 1) {
          map.flyTo({ center: points[0], zoom: 11, duration: 600, padding: map.getPadding() });
          return;
        }
        const lngs = points.map(([lng]) => lng);
        const lats = points.map(([, lat]) => lat);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: map.getPadding(), maxZoom: 11, duration: 650 },
        );
      } catch {
        // A selection update may race with WebGL context loss.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    assignedVehicle?.id,
    assignedVehicle,
    assignedVehicle?.lat,
    assignedVehicle?.lng,
    load,
    load?.id,
    load?.assignedTruckId,
    load?.assignedTruckNumber,
    map,
    routeCoordinates,
    stopInfo?.pickup.lat,
    stopInfo?.pickup.lng,
    stopInfo?.pickup.hasValidCoordinates,
    stopInfo?.delivery.lat,
    stopInfo?.delivery.lng,
    stopInfo?.delivery.hasValidCoordinates,
  ]);

  return (
    <>
      <VehicleLayer
        onSelect={props.onVehicleSelect}
        vehicles={vehicleItems}
        selectedId={selectedVehicleId}
      />
      <DispatchMapState {...props} />
    </>
  );
}
