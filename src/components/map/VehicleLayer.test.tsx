import type { Map as MapboxMap } from "mapbox-gl";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapContext } from "./MapContext";
import { VehicleLayer } from "./VehicleLayer";
import { buildVehicleFeatureCollection } from "./vehicleLayer.utils";
import type { VehicleLayerItem } from "./vehicleLayer.types";

function createVehicle(id: string, lng: number, lat: number): VehicleLayerItem {
  return { id, lng, lat, bearing: 90, status: "unknown", label: id };
}

function createMockMap() {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn>; getClusterExpansionZoom: ReturnType<typeof vi.fn> }>();
  const layers = new Map<string, Record<string, unknown>>();
  const images = new Set<string>();
  const handlers = new Map<string, (...args: never[]) => void>();
  let styleUnavailable = false;
  const sourceSetData = vi.fn();
  const zoomToCluster = vi.fn((_id: number, callback: (error: null, zoom: number) => void) => callback(null, 7));

  const map = {
    isStyleLoaded: () => true,
    getStyle: () => ({ name: "Mapbox Standard" }),
    hasImage: (id: string) => images.has(id),
    addImage: (id: string) => images.add(id),
    removeImage: (id: string) => images.delete(id),
    addSource: (id: string) => sources.set(id, { setData: sourceSetData, getClusterExpansionZoom: zoomToCluster }),
    getSource: (id: string) => sources.get(id),
    removeSource: (id: string) => sources.delete(id),
    addLayer: (layer: Record<string, unknown>) => layers.set(String(layer.id), layer),
    getLayer: (id: string) => {
      if (styleUnavailable) throw new Error("Map style is unavailable");
      return layers.get(id);
    },
    removeLayer: (id: string) => layers.delete(id),
    setLayerZoomRange: vi.fn(),
    on: (event: string, layer: string | ((...args: never[]) => void), callback?: (...args: never[]) => void) => {
      const key = typeof layer === "string" ? `${event}:${layer}` : event;
      handlers.set(key, callback ?? layer as (...args: never[]) => void);
    },
    off: (event: string, layerOrHandler: string | ((...args: never[]) => void), callback?: (...args: never[]) => void) => {
      const key = typeof layerOrHandler === "string" ? `${event}:${layerOrHandler}` : event;
      const handler = callback ?? layerOrHandler;
      if (handlers.get(key) === handler) handlers.delete(key);
    },
    getCanvas: () => ({ style: { cursor: "" } }),
    easeTo: vi.fn(),
    setStyleUnavailable: (value: boolean) => { styleUnavailable = value; },
  };
  return { map, sources, layers, images, handlers, sourceSetData, zoomToCluster, setStyleUnavailable: map.setStyleUnavailable };
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4), width: 64, height: 64 }),
  }) as unknown as CanvasRenderingContext2D);
});

describe("VehicleLayer", () => {
  it("builds only valid point features and preserves true heading/status values", () => {
    const collection = buildVehicleFeatureCollection([
      { ...createVehicle("truck-1", 106.7, 10.8), status: "moving", bearing: 425 },
      createVehicle("no-coordinate", 0, 0),
    ], "truck-1");

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]).toMatchObject({
      id: "truck-1",
      geometry: { coordinates: [106.7, 10.8] },
      properties: { vehicleState: "moving", bearing: 65, selected: true },
    });
  });

  it("uses one clustered GeoJSON source and truck symbol layers for 500 vehicles", () => {
    const mock = createMockMap();
    const vehicles = Array.from({ length: 500 }, (_, index) =>
      createVehicle(`truck-${index}`, 106.5 + index / 100_000, 10.7 + index / 100_000),
    );

    render(
      <MapContext.Provider value={mock.map as unknown as MapboxMap}>
        <VehicleLayer vehicles={vehicles} selectedId="truck-0" />
      </MapContext.Provider>,
    );

    const source = mock.sources.get("vehicles");
    expect(source).toBeDefined();
    expect(mock.layers.has("vehicle-clusters")).toBe(true);
    expect(mock.layers.has("vehicle-cluster-count")).toBe(true);
    expect(mock.layers.has("vehicle-icons")).toBe(true);
    expect(mock.layers.get("vehicle-icons")).toMatchObject({ slot: "top" });
    expect(mock.sourceSetData).toHaveBeenCalled();
    const latestCollection = mock.sourceSetData.mock.calls.at(-1)?.[0];
    expect(latestCollection.features).toHaveLength(500);
    expect(latestCollection.features[0].properties.selected).toBe(true);
  });

  it("zooms into clusters and synchronizes vehicle clicks", () => {
    const mock = createMockMap();
    const onSelect = vi.fn();
    render(
      <MapContext.Provider value={mock.map as unknown as MapboxMap}>
        <VehicleLayer vehicles={[createVehicle("truck-7", 106.7, 10.8)]} onSelect={onSelect} />
      </MapContext.Provider>,
    );

    act(() => {
      mock.handlers.get("click:vehicle-clusters")?.({
        features: [{ properties: { cluster_id: 4 }, geometry: { type: "Point", coordinates: [106.7, 10.8] } }],
      } as never);
    });
    expect(mock.zoomToCluster).toHaveBeenCalledWith(4, expect.any(Function));
    expect(mock.map.easeTo).toHaveBeenCalledWith({ center: [106.7, 10.8], zoom: 7.25, duration: 450 });

    act(() => {
      mock.handlers.get("click:vehicle-icons")?.({ features: [{ properties: { id: "truck-7" } }] } as never);
    });
    expect(onSelect).toHaveBeenCalledWith("truck-7");
  });

  it("removes source, layers, images, and listeners when unmounted", () => {
    const mock = createMockMap();
    const view = render(
      <MapContext.Provider value={mock.map as unknown as MapboxMap}>
        <VehicleLayer vehicles={[createVehicle("truck-7", 106.7, 10.8)]} />
      </MapContext.Provider>,
    );

    view.unmount();

    expect(mock.sources.has("vehicles")).toBe(false);
    expect(mock.layers.size).toBe(0);
    expect(mock.images.size).toBe(0);
    expect(mock.handlers.size).toBe(0);
  });

  it("does not throw during cleanup when the WebGL context removed the style", () => {
    const mock = createMockMap();
    const view = render(
      <MapContext.Provider value={mock.map as unknown as MapboxMap}>
        <VehicleLayer vehicles={[createVehicle("truck-7", 106.7, 10.8)]} />
      </MapContext.Provider>,
    );

    mock.setStyleUnavailable(true);
    expect(() => view.unmount()).not.toThrow();
  });
});
