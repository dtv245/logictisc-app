import { ScatterplotLayer, type PickingInfo } from "deck.gl";
import type { DeliveryPoint } from "../types";
import { STATUS_CONFIGS } from "../types";

export interface DeliveryPointsLayerOptions {
  selectedPointId?: string | null;
  onHover?: (point: DeliveryPoint | null, coords?: { x: number; y: number } | null) => void;
  onClick?: (point: DeliveryPoint) => void;
}

/**
 * Tạo ScatterplotLayer của deck.gl để hiển thị hàng nghìn điểm giao hàng với hiệu năng cao.
 *
 * TỐI ƯU HIỆU NĂNG:
 * 1. Sử dụng updateTriggers để deck.gl chỉ tính toán lại thuộc tính màu/bán kính khi cần thiết.
 * 2. Không tạo lại hàm accessor bên trong render loop.
 * 3. Hỗ trợ GPU picking mượt mà cho tooltip và tương tác click.
 */
export function createDeliveryPointsLayer(
  points: DeliveryPoint[],
  options: DeliveryPointsLayerOptions = {},
) {
  const { selectedPointId, onHover, onClick } = options;

  return new ScatterplotLayer<DeliveryPoint>({
    id: "delivery-points-layer",
    data: points,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 5,
    radiusMaxPixels: 20,
    lineWidthMinPixels: 1.5,
    // [lng, lat]
    getPosition: (d: DeliveryPoint) => d.coordinates,
    // Màu theo trạng thái đơn
    getFillColor: (d: DeliveryPoint) => {
      const config = STATUS_CONFIGS[d.status];
      return config ? config.color : [156, 163, 175];
    },
    // Viền trắng hoặc viền nổi bật nếu được chọn
    getLineColor: (d: DeliveryPoint) =>
      d.id === selectedPointId ? [255, 255, 255, 255] : [255, 255, 255, 180],
    // Bán kính lớn hơn nếu điểm đang được chọn
    getRadius: (d: DeliveryPoint) => (d.id === selectedPointId ? 14 : 7),
    getLineWidth: (d: DeliveryPoint) => (d.id === selectedPointId ? 3 : 1.5),
    // Update triggers giúp GPU cache lại thuộc tính và chỉ update khi dependencies thay đổi
    updateTriggers: {
      getRadius: [selectedPointId],
      getLineColor: [selectedPointId],
      getLineWidth: [selectedPointId],
    },
    onHover: (info: PickingInfo<DeliveryPoint>) => {
      if (onHover) {
        if (info.object) {
          onHover(info.object, { x: info.x, y: info.y });
        } else {
          onHover(null, null);
        }
      }
    },
    onClick: (info: PickingInfo<DeliveryPoint>) => {
      if (onClick && info.object) {
        onClick(info.object);
      }
    },
  });
}
