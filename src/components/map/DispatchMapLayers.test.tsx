import type { Map as MapboxMap } from "mapbox-gl";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapContext } from "./MapContext";
import { DispatchMapLayers } from "./DispatchMapLayers";

function createMockMap() {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
  const layers = new Map<string, Record<string, unknown>>();
  const images = new Set<string>();
  let styleUnavailable = false;

  const map = {
    isStyleLoaded: () => !styleUnavailable,
    getStyle: () => ({ name: "Mapbox Standard" }),
    hasImage: (id: string) => images.has(id),
    addImage: (id: string) => images.add(id),
    removeImage: (id: string) => images.delete(id),
    addSource: (id: string) => sources.set(id, { setData: vi.fn() }),
    getSource: (id: string) => {
      if (styleUnavailable) throw new Error("Map style is unavailable");
      return sources.get(id);
    },
    removeSource: (id: string) => sources.delete(id),
    addLayer: (layer: Record<string, unknown>) => layers.set(String(layer.id), layer),
    getLayer: (id: string) => {
      if (styleUnavailable) throw new Error("Map style is unavailable");
      return layers.get(id);
    },
    removeLayer: (id: string) => layers.delete(id),
    setPaintProperty: vi.fn(),
    setLayerZoomRange: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getCanvas: () => ({ style: { cursor: "" } }),
    easeTo: vi.fn(),
  };

  return { map, setStyleUnavailable: (value: boolean) => { styleUnavailable = value; } };
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4), width: 64, height: 64 }),
  }) as unknown as CanvasRenderingContext2D);
});

describe("DispatchMapLayers", () => {
  it("cleans up route, stop, and vehicle layers without throwing after style loss", () => {
    const mock = createMockMap();
    const view = render(
      <MapContext.Provider value={mock.map as unknown as MapboxMap}>
        <DispatchMapLayers vehicles={[]} routeCoordinates={[]} />
      </MapContext.Provider>,
    );

    mock.setStyleUnavailable(true);
    expect(() => view.unmount()).not.toThrow();
  });
});
