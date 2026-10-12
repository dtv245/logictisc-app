import { decodePolyline } from "@/features/map/lib/polyline";
import type { OptimizationCandidate } from "@/types/optimization.dto";

export type LngLat = [number, number]; // [lng, lat]

export interface CandidateRouteGeometry {
  vehicleCoordinates: LngLat;
  pickupCoordinates: LngLat;
  deliveryCoordinates: LngLat;
  deadheadCoordinates: LngLat[];
  loadedCoordinates: LngLat[];
}

export interface MissingFieldItem {
  field: string;
  description: string;
}

export interface RouteGeometryExtractionResult {
  hasData: boolean;
  geometry?: CandidateRouteGeometry;
  missingFields: MissingFieldItem[];
  reason: string;
}

/**
 * Chuẩn hoá toạ độ thành [lng, lat] chuẩn.
 * Tuyệt đối tuân thủ quy tắc: toạ độ luôn là [longitude, latitude].
 */
export function normalizeLngLat(val: unknown): LngLat | null {
  if (!val) return null;
  if (Array.isArray(val) && val.length >= 2) {
    const lng = Number(val[0]);
    const lat = Number(val[1]);
    if (!Number.isNaN(lng) && !Number.isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      return [lng, lat];
    }
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    const inner = (obj.value && typeof obj.value === "object" ? obj.value : obj) as Record<string, unknown>;
    const lng = Number(inner.lng ?? inner.longitude);
    const lat = Number(inner.lat ?? inner.latitude);
    if (!Number.isNaN(lng) && !Number.isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      return [lng, lat];
    }
  }
  return null;
}

/**
 * Trích xuất mảng toạ độ [lng, lat][] từ string polyline hoặc array toạ độ.
 */
export function parseCoordinatesArray(val: unknown): LngLat[] | null {
  if (!val) return null;
  if (typeof val === "string" && val.trim().length > 0) {
    const decoded = decodePolyline(val.trim());
    if (decoded.length > 0) {
      return decoded;
    }
  }
  if (Array.isArray(val) && val.length > 0) {
    const parsed: LngLat[] = [];
    for (const item of val) {
      const pt = normalizeLngLat(item);
      if (pt) {
        parsed.push(pt);
      }
    }
    if (parsed.length >= 2) {
      return parsed;
    }
  }
  return null;
}

/**
 * Trích xuất toạ độ và lộ trình từ DTO của candidate.
 * Chỉ vẽ nếu DTO đã có toạ độ/polyline cho candidate; nếu thiếu, liệt kê trường cần backend bổ sung
 * rồi dừng, không tự gọi geocoding đoán toạ độ.
 */
export function extractRouteGeometry(candidate: OptimizationCandidate | null): RouteGeometryExtractionResult {
  if (!candidate) {
    return {
      hasData: false,
      missingFields: [],
      reason: "Chưa chọn ứng viên để kiểm tra dữ liệu lộ trình.",
    };
  }

  const routeValue = candidate.explanation?.evidence?.route?.value;
  const routeGeo = candidate.routeGeometry || candidate.explanation?.routeGeometry;
  const locationEvidence = (candidate.explanation?.evidence as Record<string, unknown> | undefined)?.location;

  const vehicleCoords =
    normalizeLngLat(routeValue?.vehicleCoordinates) ||
    normalizeLngLat(routeGeo?.vehicleCoordinates) ||
    normalizeLngLat(locationEvidence);

  const pickupCoords =
    normalizeLngLat(routeValue?.pickupCoordinates) ||
    normalizeLngLat(routeGeo?.pickupCoordinates);

  const deliveryCoords =
    normalizeLngLat(routeValue?.deliveryCoordinates) ||
    normalizeLngLat(routeGeo?.deliveryCoordinates);

  let deadheadCoords =
    parseCoordinatesArray(routeValue?.deadheadPolyline) ||
    parseCoordinatesArray(routeGeo?.deadheadPolyline);

  let loadedCoords =
    parseCoordinatesArray(routeValue?.loadedPolyline) ||
    parseCoordinatesArray(routeGeo?.loadedPolyline);

  const missingFields: MissingFieldItem[] = [];

  if (!vehicleCoords) {
    missingFields.push({
      field: "evidence.route.value.vehicleCoordinates",
      description: "Toạ độ vị trí hiện tại của xe [lng, lat]",
    });
  }

  if (!pickupCoords) {
    missingFields.push({
      field: "evidence.route.value.pickupCoordinates",
      description: "Toạ độ điểm nhận/lấy hàng [lng, lat]",
    });
  }

  if (!deliveryCoords) {
    missingFields.push({
      field: "evidence.route.value.deliveryCoordinates",
      description: "Toạ độ điểm giao hàng [lng, lat]",
    });
  }

  if (!deadheadCoords) {
    if (vehicleCoords && pickupCoords) {
      deadheadCoords = [vehicleCoords, pickupCoords];
    } else {
      missingFields.push({
        field: "evidence.route.value.deadheadPolyline",
        description: "Polyline hoặc danh sách toạ độ đoạn chạy rỗng [lng, lat][] (nét đứt)",
      });
    }
  }

  if (!loadedCoords) {
    if (pickupCoords && deliveryCoords) {
      loadedCoords = [pickupCoords, deliveryCoords];
    } else {
      missingFields.push({
        field: "evidence.route.value.loadedPolyline",
        description: "Polyline hoặc danh sách toạ độ đoạn có tải giao hàng [lng, lat][] (nét liền)",
      });
    }
  }

  if (missingFields.length > 0) {
    return {
      hasData: false,
      missingFields,
      reason:
        "DTO chưa có toạ độ hoặc polyline cho candidate. Dừng vẽ theo quy định an toàn và liệt kê trường backend cần bổ sung; không tự gọi geocoding phỏng đoán toạ độ.",
    };
  }

  return {
    hasData: true,
    geometry: {
      vehicleCoordinates: vehicleCoords!,
      pickupCoordinates: pickupCoords!,
      deliveryCoordinates: deliveryCoords!,
      deadheadCoordinates: deadheadCoords!,
      loadedCoordinates: loadedCoords!,
    },
    missingFields: [],
    reason: "",
  };
}
