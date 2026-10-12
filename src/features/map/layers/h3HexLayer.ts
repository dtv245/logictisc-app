import { PolygonLayer, type PickingInfo } from "deck.gl";
import type { H3Cluster } from "../types";

export interface H3HexLayerOptions {
  onHoverHex?: (cluster: H3Cluster | null, coords?: { x: number; y: number } | null) => void;
}

/**
 * Tạo PolygonLayer của deck.gl để vẽ các ô lưới lục giác H3 gom đơn.
 * Mỗi ô được tô màu dựa trên mật độ số lượng đơn hàng nằm trong ô đó.
 */
export function createH3HexLayer(
  clusters: H3Cluster[],
  options: H3HexLayerOptions = {},
) {
  const { onHoverHex } = options;

  return new PolygonLayer<H3Cluster>({
    id: "h3-hex-layer",
    data: clusters,
    pickable: true,
    stroked: true,
    filled: true,
    wireframe: false,
    lineWidthMinPixels: 1,
    getPolygon: (d: H3Cluster) => d.boundary,
    getFillColor: (d: H3Cluster) => d.color,
    getLineColor: [255, 255, 255, 160],
    getLineWidth: 1.5,
    opacity: 0.75,
    onHover: (info: PickingInfo<H3Cluster>) => {
      if (onHoverHex) {
        if (info.object) {
          onHoverHex(info.object, { x: info.x, y: info.y });
        } else {
          onHoverHex(null, null);
        }
      }
    },
  });
}
