import polyline from "@mapbox/polyline";
import type { LngLat } from "../types";

/**
 * Độ chính xác (precision) của chuỗi polyline:
 * - 5: Chuẩn Google Maps, OSRM v5 (1e-5 ~ 1.1m)
 * - 6: Chuẩn Valhalla, OSRM precision 6 (1e-6 ~ 0.11m)
 */
export type PolylinePrecision = 5 | 6;

/**
 * Giải mã chuỗi polyline thành mảng toạ độ chuẩn [longitude, latitude].
 *
 * QUAN TRỌNG:
 * Hàm `@mapbox/polyline.decode` trả về mảng toạ độ dạng [latitude, longitude].
 * Trong khi MapLibre GL, deck.gl và chuẩn GeoJSON bắt buộc dùng [longitude, latitude].
 * Do đó, hàm này thực hiện đảo ngược thứ tự: [lat, lng] -> [lng, lat].
 *
 * @param encoded Chuỗi polyline đã mã hoá
 * @param precision Độ chính xác (mặc định 5)
 * @returns Mảng toạ độ dạng [longitude, latitude][]
 */
export function decodePolyline(
  encoded: string,
  precision: PolylinePrecision = 5,
): LngLat[] {
  if (!encoded || typeof encoded !== "string") {
    return [];
  }

  try {
    // decode trả về: [lat, lng][]
    const latLngArray = polyline.decode(encoded, precision);

    // Đảo thứ tự thành [lng, lat][]
    return latLngArray.map(([lat, lng]): LngLat => [lng, lat]);
  } catch (error) {
    console.error("Lỗi khi giải mã chuỗi polyline:", error);
    return [];
  }
}

/**
 * Mã hoá mảng toạ độ [longitude, latitude][] thành chuỗi polyline.
 *
 * QUAN TRỌNG:
 * Đầu vào là chuẩn [longitude, latitude].
 * Hàm `@mapbox/polyline.encode` yêu cầu đầu vào dạng [latitude, longitude].
 * Do đó, hàm này đảo ngược thứ tự trước khi gọi encode: [lng, lat] -> [lat, lng].
 *
 * @param coordinates Mảng toạ độ dạng [longitude, latitude][]
 * @param precision Độ chính xác (mặc định 5)
 * @returns Chuỗi polyline đã mã hoá
 */
export function encodePolyline(
  coordinates: LngLat[],
  precision: PolylinePrecision = 5,
): string {
  if (!coordinates || coordinates.length === 0) {
    return "";
  }

  // Đảo từ [lng, lat] sang [lat, lng] để đưa vào hàm encode của thư viện
  const latLngArray: [number, number][] = coordinates.map(([lng, lat]) => [
    lat,
    lng,
  ]);

  return polyline.encode(latLngArray, precision);
}
