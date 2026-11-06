import type { Map as MapboxMap } from "mapbox-gl";

/** Mapbox can temporarily have no style while its WebGL context is being restored. */
export function isMapStyleReady(map: MapboxMap): boolean {
  try {
    return map.isStyleLoaded() && Boolean(map.getStyle());
  } catch {
    return false;
  }
}

export function safelyGetLayer(map: MapboxMap, id: string) {
  try {
    return map.getLayer(id);
  } catch {
    return undefined;
  }
}

export function safelyGetSource<T = unknown>(map: MapboxMap, id: string): T | undefined {
  try {
    return map.getSource(id) as T | undefined;
  } catch {
    return undefined;
  }
}

export function safelyHasImage(map: MapboxMap, id: string): boolean {
  try {
    return map.hasImage(id);
  } catch {
    return false;
  }
}

export function safelyRemoveLayer(map: MapboxMap, id: string): void {
  try {
    if (map.getLayer(id)) map.removeLayer(id);
  } catch {
    // Style reload/context loss already detached the layer; cleanup is best effort.
  }
}

export function safelyRemoveSource(map: MapboxMap, id: string): void {
  try {
    if (map.getSource(id)) map.removeSource(id);
  } catch {
    // Style reload/context loss already detached the source; cleanup is best effort.
  }
}

export function safelyRemoveImage(map: MapboxMap, id: string): void {
  try {
    if (map.hasImage(id)) map.removeImage(id);
  } catch {
    // Style reload/context loss already detached the image; cleanup is best effort.
  }
}
