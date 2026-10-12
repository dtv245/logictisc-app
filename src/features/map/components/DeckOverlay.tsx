import React from "react";
import { useControl } from "react-map-gl/maplibre";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";

export type DeckOverlayProps = MapboxOverlayProps;

/**
 * DeckOverlay: Cầu nối gắn deck.gl vào MapLibre GL JS thông qua hook `useControl`.
 *
 * CÁCH HOẠT ĐỘNG:
 * - `MapboxOverlay` đóng vai trò là một custom IControl của MapLibre.
 * - Khởi tạo 1 lần duy nhất qua callback `() => new MapboxOverlay(props)`.
 * - Mỗi khi props (đặc biệt là mảng `layers`) thay đổi, gọi `overlay.setProps(props)`
 *   để cập nhật layer lên canvas của WebGL mà không cần mount lại bản đồ.
 */
export const DeckOverlay: React.FC<DeckOverlayProps> = (props) => {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
};
