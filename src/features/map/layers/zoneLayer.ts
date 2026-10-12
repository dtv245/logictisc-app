import { GeoJsonLayer, type PickingInfo } from "deck.gl";
import type { DeliveryZone } from "../types";

export interface ZoneLayerOptions {
  onHoverZone?: (zone: DeliveryZone | null, coords?: { x: number; y: number } | null) => void;
}

/**
 * Tạo GeoJsonLayer của deck.gl hiển thị các vùng phân phối / giao hàng (Delivery Zones).
 */
export function createZoneLayer(
  zones: DeliveryZone[],
  options: ZoneLayerOptions = {},
) {
  const { onHoverZone } = options;

  // Chuyển danh sách DeliveryZone thành mảng GeoJSON Feature hợp lệ
  const features = zones.map((z) => ({
    ...z.polygon,
    properties: {
      ...z.polygon.properties,
      zoneId: z.id,
      zoneName: z.name,
      zoneCode: z.code,
      zoneColor: z.color || [59, 130, 246],
      rawZone: z,
    },
  }));

  interface ZoneFeature {
    properties?: {
      zoneColor?: [number, number, number];
      rawZone?: DeliveryZone;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  return new GeoJsonLayer<ZoneFeature>({
    id: "delivery-zones-layer",
    data: features,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    lineWidthMinPixels: 2,
    getFillColor: (f: ZoneFeature) => {
      const color = f.properties?.zoneColor || [59, 130, 246];
      // Độ trong suốt 45/255 để nhìn rõ đường phố bên dưới
      return [color[0], color[1], color[2], 45];
    },
    getLineColor: (f: ZoneFeature) => {
      const color = f.properties?.zoneColor || [59, 130, 246];
      return [color[0], color[1], color[2], 220];
    },
    getLineWidth: 2,
    onHover: (info: PickingInfo<ZoneFeature>) => {
      if (onHoverZone) {
        if (info.object) {
          const zone = info.object.properties?.rawZone;
          if (zone) {
            onHoverZone(zone, { x: info.x, y: info.y });
          }
        } else {
          onHoverZone(null, null);
        }
      }
    },
  });
}
