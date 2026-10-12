import * as h3 from "h3-js";
import type { H3Cluster, LngLat } from "../types";

/**
 * Chuyển đổi toạ độ [lng, lat] thành mã ô lục giác H3 theo độ phân giải (resolution 0-15).
 *
 * LƯU Ý: Thư viện `h3.latLngToCell` nhận tham số thứ tự là (latitude, longitude, resolution)!
 */
export function pointToH3Cell(
  lng: number,
  lat: number,
  resolution: number = 8,
): string {
  return h3.latLngToCell(lat, lng, resolution);
}

/**
 * Lấy toạ độ ranh giới đa giác của một ô H3.
 *
 * LƯU Ý QUAN TRỌNG:
 * `h3.cellToBoundary(cell)` trả về danh sách toạ độ [lat, lng].
 * Để vẽ trên MapLibre / GeoJSON / deck.gl, ta phải chuyển sang [lng, lat]!
 */
export function h3CellToBoundaryLngLat(cell: string): LngLat[] {
  try {
    const latLngBoundary = h3.cellToBoundary(cell);
    return latLngBoundary.map(([lat, lng]): LngLat => [lng, lat]);
  } catch (error) {
    console.error("Lỗi khi chuyển đổi ranh giới ô H3:", error);
    return [];
  }
}

/**
 * Tạo màu RGBA theo mật độ số lượng đơn hàng trong ô H3:
 * - Ít đơn (1-3): Xanh dương nhạt
 * - Trung bình (4-10): Vàng / Cam
 * - Nhiều đơn (11+): Đỏ / Đỏ thẫm
 */
export function getH3DensityColor(
  count: number,
  maxCount: number,
): [number, number, number, number] {
  if (maxCount <= 0) {
    return [59, 130, 246, 120];
  }

  const ratio = Math.min(1, count / maxCount);

  if (ratio < 0.25) {
    // Xanh lục / Xanh ngọc nhạt
    return [16, 185, 129, 130];
  } else if (ratio < 0.5) {
    // Vàng chanh
    return [234, 179, 8, 150];
  } else if (ratio < 0.75) {
    // Cam
    return [249, 115, 22, 170];
  } else {
    // Đỏ đậm cảnh báo mật độ cao
    return [239, 68, 68, 190];
  }
}

/**
 * Gom cụm các điểm giao hàng thành các ô H3 và tính toán ranh giới cũng như màu sắc.
 *
 * @param points Danh sách các điểm có toạ độ [lng, lat]
 * @param resolution Độ phân giải H3 (khuyên dùng từ 6 đến 9 cho mức đô thị)
 * @returns Mảng các H3Cluster đã gom nhóm
 */
export function aggregatePointsByH3(
  points: { coordinates: LngLat }[],
  resolution: number = 8,
): H3Cluster[] {
  if (!points || points.length === 0) {
    return [];
  }

  // 1. Đếm số lượng điểm theo từng ô H3
  const countMap = new Map<string, number>();

  for (const pt of points) {
    const [lng, lat] = pt.coordinates;
    const cell = pointToH3Cell(lng, lat, resolution);
    countMap.set(cell, (countMap.get(cell) || 0) + 1);
  }

  // 2. Tìm giá trị maxCount để chia thang màu
  let maxCount = 1;
  for (const count of countMap.values()) {
    if (count > maxCount) maxCount = count;
  }

  // 3. Xây dựng ranh giới đa giác và màu sắc cho mỗi ô H3
  const clusters: H3Cluster[] = [];

  for (const [cell, count] of countMap.entries()) {
    const boundary = h3CellToBoundaryLngLat(cell);
    if (boundary.length > 0) {
      clusters.push({
        hex: cell,
        count,
        boundary,
        color: getH3DensityColor(count, maxCount),
      });
    }
  }

  return clusters;
}
