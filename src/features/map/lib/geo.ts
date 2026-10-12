import * as turf from "@turf/turf";
import type { DeliveryZone, LngLat } from "../types";

/**
 * Tính khoảng cách đường chim bay giữa hai điểm toạ độ (theo đơn vị Kilomet).
 * Sử dụng công thức Haversine thông qua turf.distance.
 *
 * @param from Điểm xuất phát [longitude, latitude]
 * @param to Điểm đích [longitude, latitude]
 * @returns Khoảng cách theo km
 */
export function distanceKm(from: LngLat, to: LngLat): number {
  const fromPoint = turf.point(from);
  const toPoint = turf.point(to);
  return turf.distance(fromPoint, toPoint, { units: "kilometers" });
}

/**
 * Kiểm tra xem một điểm toạ độ có nằm bên trong vùng đa giác (Polygon/MultiPolygon) hay không.
 *
 * @param point Toạ độ kiểm tra [longitude, latitude]
 * @param polygon Đa giác dạng GeoJSON Feature hoặc Geometry
 * @returns true nếu điểm nằm trong đa giác hoặc nằm trên cạnh biên
 */
export function isInsideZone(
  point: LngLat,
  polygon:
    | GeoJSON.Polygon
    | GeoJSON.MultiPolygon
    | GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
): boolean {
  try {
    const pt = turf.point(point);
    return turf.booleanPointInPolygon(pt, polygon);
  } catch (error) {
    console.error("Lỗi khi kiểm tra điểm trong vùng:", error);
    return false;
  }
}

/**
 * Kiểm tra xem điểm giao hàng có nằm trong bất kỳ vùng giao hàng nào hay không.
 *
 * @param point Toạ độ [longitude, latitude]
 * @param zones Danh sách các vùng giao hàng
 * @returns true nếu nằm trong ít nhất 1 vùng
 */
export function isInsideAnyZone(point: LngLat, zones: DeliveryZone[]): boolean {
  if (!zones || zones.length === 0) return false;

  return zones.some((zone) => isInsideZone(point, zone.polygon));
}

/**
 * Tìm vùng giao hàng đầu tiên chứa điểm toạ độ này.
 *
 * @param point Toạ độ [longitude, latitude]
 * @param zones Danh sách các vùng giao hàng
 * @returns DeliveryZone tìm thấy hoặc null nếu ngoài tất cả vùng
 */
export function findContainingZone(
  point: LngLat,
  zones: DeliveryZone[],
): DeliveryZone | null {
  for (const zone of zones) {
    if (isInsideZone(point, zone.polygon)) {
      return zone;
    }
  }
  return null;
}

/**
 * Tính toán Bounding Box bao quanh một tập hợp toạ độ.
 * Kết quả: [minLng, minLat, maxLng, maxLat]
 */
export function calculateBbox(
  coordinates: LngLat[],
): [number, number, number, number] {
  if (coordinates.length === 0) {
    return [0, 0, 0, 0];
  }
  const line = turf.lineString(coordinates);
  const bbox = turf.bbox(line);
  return [bbox[0], bbox[1], bbox[2], bbox[3]];
}

/**
 * Tính tâm trung bình của tập toạ độ.
 */
export function calculateCenter(coordinates: LngLat[]): LngLat {
  if (coordinates.length === 0) {
    return [106.660172, 10.762622]; // Mặc định TP.HCM
  }
  const points = turf.points(coordinates);
  const center = turf.center(points);
  const [lng, lat] = center.geometry.coordinates;
  return [lng, lat];
}
