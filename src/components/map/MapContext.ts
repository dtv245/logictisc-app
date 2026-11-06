import type { Map as MapboxMap } from "mapbox-gl";
import { createContext, useContext } from "react";

export const MapContext = createContext<MapboxMap | null>(null);

export function useMap(): MapboxMap {
  const map = useContext(MapContext);
  if (!map) {
    throw new Error("useMap must be used inside a loaded MapShell.");
  }
  return map;
}
