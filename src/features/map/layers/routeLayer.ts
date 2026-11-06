import { PathLayer, type PickingInfo } from "deck.gl";
import type { LngLat, RouteData } from "../types";

export function createHighlightedRouteLayer(coordinates: LngLat[]) {
  return new PathLayer<{ coordinates: LngLat[] }>({
    id: "selected-load-route-layer",
    data: [{ coordinates }],
    pickable: false,
    widthScale: 1,
    widthMinPixels: 5,
    widthMaxPixels: 8,
    capRounded: true,
    jointRounded: true,
    opacity: 0.95,
    getPath: (route) => route.coordinates,
    getColor: [124, 58, 237],
    getWidth: 5,
  });
}

export interface RouteLayerOptions {
  onHoverRoute?: (route: RouteData | null, coords?: { x: number; y: number } | null) => void;
  onClickRoute?: (route: RouteData) => void;
}

/**
 * Tạo PathLayer của deck.gl hiển thị các tuyến đường giao hàng theo từng loại phương tiện.
 */
export function createRouteLayer(
  routes: RouteData[],
  options: RouteLayerOptions = {},
) {
  const { onHoverRoute, onClickRoute } = options;

  return new PathLayer<RouteData>({
    id: "delivery-routes-layer",
    data: routes,
    pickable: true,
    widthScale: 1,
    widthMinPixels: 3.5,
    widthMaxPixels: 10,
    capRounded: true,
    jointRounded: true,
    opacity: 0.85,
    getPath: (d: RouteData) => d.coordinates,
    getColor: (d: RouteData) => d.color,
    getWidth: 4,
    onHover: (info: PickingInfo<RouteData>) => {
      if (onHoverRoute) {
        if (info.object) {
          onHoverRoute(info.object, { x: info.x, y: info.y });
        } else {
          onHoverRoute(null, null);
        }
      }
    },
    onClick: (info: PickingInfo<RouteData>) => {
      if (onClickRoute && info.object) {
        onClickRoute(info.object);
      }
    },
  });
}
