import type { GeoJSONSource, MapLayerMouseEvent, Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef } from "react";

import { VEHICLE_CLUSTER_THRESHOLD } from "@/utils/tms-flow/mapbox";

import { useMap } from "./MapContext";
import {
  isMapStyleReady,
  safelyGetSource,
  safelyRemoveImage,
  safelyRemoveLayer,
  safelyRemoveSource,
} from "./mapStyleSafety";
import { DEFAULT_VEHICLE_MODEL_URI, buildVehicleFeatureCollection } from "./vehicleLayer.utils";
import type {
  VehicleFeatureCollection,
  VehicleLayerItem,
  VehicleLayerStatus,
  VehiclePosition,
} from "./vehicleLayer.types";

const VEHICLE_SOURCE_ID = "vehicles";
const CLUSTER_LAYER_ID = "vehicle-clusters";
const CLUSTER_COUNT_LAYER_ID = "vehicle-cluster-count";
const ICON_LAYER_ID = "vehicle-icons";
const MODEL_LAYER_ID = "vehicle-models";
const MOVING_ICON_ID = "vehicle-truck-moving";
const IDLE_ICON_ID = "vehicle-truck-idle";
const UNKNOWN_ICON_ID = "vehicle-truck-unknown";
const MODEL_URI = DEFAULT_VEHICLE_MODEL_URI;
const MODEL_ZOOM = 15.5;
const ANIMATION_DURATION_MS = 1200;

export interface VehicleLayerProps {
  vehicles: VehicleLayerItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}


function createTruckIcon(state: VehicleLayerStatus): ImageData {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable");
  }

  const color = state === "moving" ? "#079669" : state === "idle" ? "#64748b" : "#2563eb";
  context.clearRect(0, 0, size, size);
  context.lineWidth = 3;
  context.strokeStyle = "#ffffff";
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(22, 5);
  context.lineTo(42, 5);
  context.lineTo(48, 14);
  context.lineTo(48, 56);
  context.lineTo(16, 56);
  context.lineTo(16, 14);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#e2e8f0";
  context.fillRect(20, 10, 24, 17);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(20, 10, 24, 17);
  context.fillStyle = "#0f172a";
  context.fillRect(18, 32, 5, 9);
  context.fillRect(41, 32, 5, 9);
  context.fillRect(18, 48, 5, 7);
  context.fillRect(41, 48, 5, 7);
  return context.getImageData(0, 0, size, size);
}

function createVehicleLayer(map: MapboxMap, vehicles: VehicleLayerItem[], selectedId?: string) {
  if (!map.hasImage(MOVING_ICON_ID)) map.addImage(MOVING_ICON_ID, createTruckIcon("moving"), { pixelRatio: 2 });
  if (!map.hasImage(IDLE_ICON_ID)) map.addImage(IDLE_ICON_ID, createTruckIcon("idle"), { pixelRatio: 2 });
  if (!map.hasImage(UNKNOWN_ICON_ID)) map.addImage(UNKNOWN_ICON_ID, createTruckIcon("unknown"), { pixelRatio: 2 });

  if (!map.getSource(VEHICLE_SOURCE_ID)) {
    map.addSource(VEHICLE_SOURCE_ID, {
      type: "geojson",
      data: buildVehicleFeatureCollection(vehicles, selectedId) as never,
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 13,
      clusterMinPoints: VEHICLE_CLUSTER_THRESHOLD,
      promoteId: "id",
    });
  }

  const standardStyle = map.getStyle().name?.toLowerCase().includes("standard") ?? false;
  const standardSlot = standardStyle ? { slot: "top" as const } : {};

  if (!map.getLayer(CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_LAYER_ID,
      type: "circle",
      source: VEHICLE_SOURCE_ID,
      filter: ["has", "point_count"],
      ...standardSlot,
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#0ea5e9", 50, "#2563eb", 200, "#7c3aed"],
        "circle-radius": ["step", ["get", "point_count"], 18, 50, 23, 200, 29],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  }

  if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: VEHICLE_SOURCE_ID,
      filter: ["has", "point_count"],
      ...standardSlot,
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: { "text-color": "#ffffff" },
    });
  }

  if (!map.getLayer(ICON_LAYER_ID)) {
    map.addLayer({
      id: ICON_LAYER_ID,
      type: "symbol",
      source: VEHICLE_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      ...standardSlot,
      layout: {
        "icon-image": [
          "match",
          ["get", "vehicleState"],
          "moving",
          MOVING_ICON_ID,
          "idle",
          IDLE_ICON_ID,
          UNKNOWN_ICON_ID,
        ],
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-size": [
          "*",
          ["interpolate", ["linear"], ["zoom"], 3, 0.38, 10, 0.65, 15.5, 0.88],
          ["case", ["get", "selected"], 1.32, 1],
        ],
      },
    });
  }

  const source = map.getSource(VEHICLE_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(buildVehicleFeatureCollection(vehicles, selectedId) as never);
}

function resolveVehicleId(event: MapLayerMouseEvent): string | null {
  const feature = event.features?.[0];
  const id = feature?.properties?.id ?? feature?.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

function isMapboxStandard(map: MapboxMap): boolean {
  return map.getStyle().name?.toLowerCase().includes("standard") ?? false;
}

async function enable3dLayer(map: MapboxMap, signal: AbortSignal) {
  if (import.meta.env.VITE_VEHICLE_3D !== "true") return;

  try {
    if (signal.aborted || !isMapStyleReady(map) || !map.getSource(VEHICLE_SOURCE_ID)) return;
    const response = await fetch(MODEL_URI, { method: "HEAD", signal });
    if (!response.ok || signal.aborted || !isMapStyleReady(map) || !map.getSource(VEHICLE_SOURCE_ID)) return;
    if (!map.getLayer(MODEL_LAYER_ID)) {
      map.addLayer({
        id: MODEL_LAYER_ID,
        type: "model",
        source: VEHICLE_SOURCE_ID,
        minzoom: MODEL_ZOOM,
        filter: ["!", ["has", "point_count"]],
        ...(isMapboxStandard(map) ? { slot: "top" } : {}),
        layout: { "model-id": ["get", "modelUri"] },
        paint: {
          "model-rotation": ["get", "modelRotation"],
        "model-scale": [1, 1, 1],
          "model-type": "location-indicator",
        },
      });
      map.setLayerZoomRange(ICON_LAYER_ID, 0, MODEL_ZOOM);
    }
  } catch {
    // GLB is optional: Mapbox keeps rendering the 2D GeoJSON symbols.
  }
}

function getFeatureCollectionPositions(collection: VehicleFeatureCollection) {
  return new Map(
    collection.features.map((feature) => [feature.id, {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }]),
  );
}

export function VehicleLayer({ vehicles, selectedId, onSelect }: VehicleLayerProps) {
  const map = useMap();
  const vehiclesRef = useRef(vehicles);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const positionsRef = useRef(new Map<string, VehiclePosition>());
  const frameRef = useRef<number | null>(null);
  const clickHandlersRef = useRef<{
    cluster: (event: MapLayerMouseEvent) => void;
    vehicle: (event: MapLayerMouseEvent) => void;
    clusterEnter: () => void;
    clusterLeave: () => void;
    vehicleEnter: () => void;
    vehicleLeave: () => void;
  } | null>(null);

  useEffect(() => {
    vehiclesRef.current = vehicles;
    selectedIdRef.current = selectedId;
    onSelectRef.current = onSelect;
  }, [onSelect, selectedId, vehicles]);

  useEffect(() => {
    let disposed = false;
    let install3dController: AbortController | null = null;
    let interactionsBound = false;

    const cancelAnimation = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const install = () => {
      if (disposed || !isMapStyleReady(map)) return;
      cancelAnimation();
      try {
        createVehicleLayer(map, vehiclesRef.current, selectedIdRef.current);
        positionsRef.current = getFeatureCollectionPositions(
          buildVehicleFeatureCollection(vehiclesRef.current, selectedIdRef.current),
        );

        if (!interactionsBound) {
          const handleClusterClick = (event: MapLayerMouseEvent) => {
            const cluster = event.features?.[0];
            const clusterId = cluster?.properties?.cluster_id;
            const coordinates = cluster?.geometry?.type === "Point" ? cluster.geometry.coordinates : null;
            let source: GeoJSONSource | undefined;
            try {
              source = safelyGetSource<GeoJSONSource>(map, VEHICLE_SOURCE_ID);
            } catch {
              return;
            }
            if (typeof clusterId !== "number" || !coordinates || !source?.getClusterExpansionZoom) return;
            try {
              source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                if (error || disposed || typeof zoom !== "number" || !isMapStyleReady(map)) return;
                try {
                  map.easeTo({ center: coordinates as [number, number], zoom: zoom + 0.25, duration: 450 });
                } catch {
                  // The selection can race with a lost WebGL context.
                }
              });
            } catch {
              // A context loss can detach the GeoJSON worker during cluster expansion.
            }
          };
          const handleVehicleClick = (event: MapLayerMouseEvent) => {
            const id = resolveVehicleId(event);
            if (id) onSelectRef.current?.(id);
          };
          const setCursor = (cursor: string) => {
            try {
              map.getCanvas().style.cursor = cursor;
            } catch {
              // Ignore pointer events while the map canvas is restoring.
            }
          };
          const clusterEnter = () => setCursor("pointer");
          const clusterLeave = () => setCursor("");
          const vehicleEnter = () => setCursor("pointer");
          const vehicleLeave = () => setCursor("");
          clickHandlersRef.current = {
            cluster: handleClusterClick,
            vehicle: handleVehicleClick,
            clusterEnter,
            clusterLeave,
            vehicleEnter,
            vehicleLeave,
          };
          map.on("click", CLUSTER_LAYER_ID, handleClusterClick);
          map.on("click", ICON_LAYER_ID, handleVehicleClick);
          map.on("mouseenter", CLUSTER_LAYER_ID, clusterEnter);
          map.on("mouseleave", CLUSTER_LAYER_ID, clusterLeave);
          map.on("mouseenter", ICON_LAYER_ID, vehicleEnter);
          map.on("mouseleave", ICON_LAYER_ID, vehicleLeave);
          interactionsBound = true;
        }

        install3dController?.abort();
        install3dController = new AbortController();
        void enable3dLayer(map, install3dController.signal);
      } catch {
        console.warn("[VehicleLayer] Vehicle symbols could not be added to the current map style.");
      }
    };

    map.on("style.load", install);
    if (map.isStyleLoaded()) install();

    return () => {
      disposed = true;
      install3dController?.abort();
      cancelAnimation();
      try {
        map.off("style.load", install);
      } catch {
        // The map may already be disposing after a WebGL context loss.
      }
      const handlers = clickHandlersRef.current;
      if (handlers) {
        try {
          map.off("click", CLUSTER_LAYER_ID, handlers.cluster);
          map.off("click", ICON_LAYER_ID, handlers.vehicle);
          map.off("mouseenter", CLUSTER_LAYER_ID, handlers.clusterEnter);
          map.off("mouseleave", CLUSTER_LAYER_ID, handlers.clusterLeave);
          map.off("mouseenter", ICON_LAYER_ID, handlers.vehicleEnter);
          map.off("mouseleave", ICON_LAYER_ID, handlers.vehicleLeave);
        } catch {
          // Ignore listener removal failures during map teardown.
        }
      }
      [MODEL_LAYER_ID, ICON_LAYER_ID, CLUSTER_COUNT_LAYER_ID, CLUSTER_LAYER_ID]
        .forEach((id) => safelyRemoveLayer(map, id));
      safelyRemoveSource(map, VEHICLE_SOURCE_ID);
      [MOVING_ICON_ID, IDLE_ICON_ID, UNKNOWN_ICON_ID].forEach((id) => safelyRemoveImage(map, id));
      positionsRef.current.clear();
      clickHandlersRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!isMapStyleReady(map)) return;
    let source: GeoJSONSource | undefined;
    try {
      source = safelyGetSource<GeoJSONSource>(map, VEHICLE_SOURCE_ID);
    } catch {
      return;
    }
    if (!source) return;

    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    const targetCollection = buildVehicleFeatureCollection(vehicles, selectedId);
    const targetPositions = getFeatureCollectionPositions(targetCollection);
    const startPositions = new Map(positionsRef.current);
    const hasMovement = [...targetPositions].some(([id, target]) => {
      const start = startPositions.get(id);
      return start && (start.lng !== target.lng || start.lat !== target.lat);
    });

    if (!hasMovement) {
      try {
        source.setData(targetCollection as never);
        positionsRef.current = targetPositions;
      } catch {
        // The next style.load installs the latest feature collection.
      }
      return;
    }

    const startAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startAt) / ANIMATION_DURATION_MS);
      const easedProgress = 1 - (1 - progress) ** 3;
      const interpolated = new Map<string, VehiclePosition>();
      targetPositions.forEach((target, id) => {
        const start = startPositions.get(id) ?? target;
        interpolated.set(id, {
          lng: start.lng + (target.lng - start.lng) * easedProgress,
          lat: start.lat + (target.lat - start.lat) * easedProgress,
        });
      });
      try {
        if (!isMapStyleReady(map)) {
          frameRef.current = null;
          return;
        }
        source.setData(buildVehicleFeatureCollection(vehicles, selectedId, interpolated) as never);
        positionsRef.current = interpolated;
      } catch {
        frameRef.current = null;
        return;
      }
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        positionsRef.current = targetPositions;
      }
    };
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [map, selectedId, vehicles]);

  return null;
}
