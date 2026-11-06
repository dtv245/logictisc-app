import type {
  DispatchMapStopInfo,
  DispatchMapVehicleInput,
  DispatchMapVehiclePoint,
  DispatchMapVehicleStatus,
  MapboxBoundsBox,
  MapboxCoordinatePoint,
  MapboxLngLat,
} from "@/types/tms-flow/mapbox.types";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";

/**
 * Ngưỡng mặc định coi xe bị mất tín hiệu GPS (phút).
 * Lưu ý: Hằng số này đang để mặc định 15 phút (chưa chốt chính thức từ nghiệp vụ).
 */
export const VEHICLE_SIGNAL_LOSS_THRESHOLD_MINUTES = 15;

/**
 * Ngưỡng số lượng xe để chuyển sang chế độ gom cụm (clustering) trên GeoJSON source.
 */
export const VEHICLE_CLUSTER_THRESHOLD = 30;

export interface MapboxTokenValidation {
  valid: boolean;
  token: string | null;
  reason?: "missing" | "secret_token_forbidden" | "invalid_prefix";
}

/**
 * Kiểm tra token Mapbox: chỉ chấp nhận public token bắt đầu bằng `pk.`.
 * Tuyệt đối từ chối secret token `sk.` ở frontend.
 */
export function validateMapboxPublicToken(rawToken?: string | null): MapboxTokenValidation {
  const trimmed = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!trimmed) {
    return { valid: false, token: null, reason: "missing" };
  }
  if (trimmed.startsWith("sk.")) {
    return { valid: false, token: null, reason: "secret_token_forbidden" };
  }
  if (!trimmed.startsWith("pk.")) {
    return { valid: false, token: null, reason: "invalid_prefix" };
  }
  return { valid: true, token: trimmed };
}

/**
 * Xác minh cặp tọa độ (lat, lng) hợp lệ và không phải điểm (0, 0) rỗng.
 */
export function isValidCoordinatePair(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  return true;
}

/**
 * Làm tròn tọa độ (mặc định 5 chữ số thập phân ~ 1.1m) để dùng làm query key ổn định.
 */
export function roundCoordinateForCache(value: number, decimals = 5): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Tạo khóa cache ổn định theo thứ tự [originLng, originLat, destLng, destLat].
 */
export function buildMapboxRouteCacheKey(
  origin?: MapboxCoordinatePoint | null,
  destination?: MapboxCoordinatePoint | null,
  decimals = 5,
): [number, number, number, number] | null {
  if (
    !origin ||
    !destination ||
    !isValidCoordinatePair(origin.lat, origin.lng) ||
    !isValidCoordinatePair(destination.lat, destination.lng)
  ) {
    return null;
  }
  return [
    roundCoordinateForCache(origin.lng, decimals),
    roundCoordinateForCache(origin.lat, decimals),
    roundCoordinateForCache(destination.lng, decimals),
    roundCoordinateForCache(destination.lat, decimals),
  ];
}

/**
 * Định dạng khoảng cách mét sang chuỗi km tiếng Việt dễ đọc.
 */
export function formatVietnameseDistanceKm(distanceMeters?: number | null): string | null {
  if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return null;
  }
  const km = distanceMeters / 1000;
  if (km < 10) {
    const roundedOneDecimal = Math.round(km * 10) / 10;
    const text = Number.isInteger(roundedOneDecimal)
      ? String(roundedOneDecimal)
      : String(roundedOneDecimal).replace(".", ",");
    return `${text} km`;
  }
  return `${Math.round(km).toLocaleString("vi-VN")} km`;
}

/**
 * Định dạng thời gian giây sang chuỗi tiếng Việt dễ đọc (kèm "(ước tính)").
 */
export function formatVietnameseDurationEstimate(
  durationSeconds?: number | null,
  includeEstimateSuffix = true,
): string | null {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null;
  }
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let durationPart: string;
  if (hours === 0) {
    durationPart = `khoảng ${minutes} phút`;
  } else if (minutes === 0) {
    durationPart = `khoảng ${hours} giờ`;
  } else {
    durationPart = `khoảng ${hours} giờ ${minutes} phút`;
  }

  return includeEstimateSuffix ? `${durationPart} (ước tính)` : durationPart;
}

/**
 * Định dạng nhãn giữa tuyến: "128 km · khoảng 2 giờ 10 phút (ước tính)"
 */
export function formatVietnameseRouteBadge(
  distanceMeters?: number | null,
  durationSeconds?: number | null,
): string | null {
  const kmLabel = formatVietnameseDistanceKm(distanceMeters);
  const durationLabel = formatVietnameseDurationEstimate(durationSeconds, true);
  if (kmLabel && durationLabel) {
    return `${kmLabel} · ${durationLabel}`;
  }
  if (kmLabel) {
    return `${kmLabel} (ước tính)`;
  }
  return durationLabel;
}

/**
 * Tìm điểm giữa tuyến (midpoint) theo chiều dài đoạn đường để đặt nhãn khoảng cách/thời gian.
 */
export function getRouteMidpointLngLat(coordinates: MapboxLngLat[]): MapboxLngLat | null {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null;
  }
  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const segLen = Math.hypot(dx, dy);
    segmentLengths.push(segLen);
    totalLength += segLen;
  }

  if (totalLength <= 0) {
    return coordinates[Math.floor(coordinates.length / 2)];
  }

  const halfLength = totalLength / 2;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i += 1) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= halfLength && segLen > 0) {
      const ratio = (halfLength - accumulated) / segLen;
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      return [lng1 + (lng2 - lng1) * ratio, lat1 + (lat2 - lat1) * ratio];
    }
    accumulated += segLen;
  }

  return coordinates[Math.floor(coordinates.length / 2)];
}

/**
 * Giữ nguyên trạng thái vận hành từ TruckResponse. Chỉ đánh dấu mất tín hiệu
 * khi có thời điểm cập nhật GPS riêng và timestamp đã quá ngưỡng hiển thị.
 */
export function resolveVehicleMapStatus(
  vehicle: DispatchMapVehicleInput,
  nowMs = Date.now(),
  thresholdMinutes = VEHICLE_SIGNAL_LOSS_THRESHOLD_MINUTES,
): DispatchMapVehicleStatus {
  const rawTimestamp = vehicle.locationUpdatedAt ?? null;
  if (typeof rawTimestamp === "string" && rawTimestamp.trim() !== "") {
    const parsedMs = Date.parse(rawTimestamp);
    if (Number.isFinite(parsedMs)) {
      const ageMinutes = (nowMs - parsedMs) / 60_000;
      if (ageMinutes > thresholdMinutes) {
        return "signal_lost";
      }
    }
  }

  const status = (vehicle.status ?? "").toLowerCase();
  if (
    status === "available" ||
    status === "in_use" ||
    status === "maintenance" ||
    status === "out_of_service"
  ) {
    return status;
  }
  return "unknown";
}

/**
 * Định dạng thời gian cập nhật vị trí xe thành "HH:mm". Trả về null nếu không có hoặc không hợp lệ.
 */
export function formatVehicleUpdatedTimeLabel(updatedAt?: string | null): string | null {
  if (typeof updatedAt !== "string" || !updatedAt.trim()) {
    return null;
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Lọc và chuẩn hóa danh sách xe chỉ giữ những xe có tọa độ thật hợp lệ.
 * Tuyệt đối không tự sinh hay suy đoán tọa độ cho xe thiếu dữ liệu.
 */
export function normalizeDispatchMapVehicles(
  vehicles: DispatchMapVehicleInput[],
  assignedTruckId?: string | null,
  assignedTruckNumber?: string | null,
  nowMs = Date.now(),
): DispatchMapVehiclePoint[] {
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return [];
  }

  const normalizedAssignedNumber = assignedTruckNumber?.trim().toLowerCase() ?? null;
  const result: DispatchMapVehiclePoint[] = [];

  for (const vehicle of vehicles) {
    const lat = vehicle.currentLocationLatitude;
    const lng = vehicle.currentLocationLongitude;
    if (!isValidCoordinatePair(lat, lng)) {
      continue;
    }

    const rawHeading = vehicle.heading ?? vehicle.bearing ?? null;
    const heading =
      typeof rawHeading === "number" && Number.isFinite(rawHeading) && rawHeading >= 0 && rawHeading <= 360
        ? rawHeading
        : null;

    const speedKmh =
      typeof vehicle.speedKmh === "number" && Number.isFinite(vehicle.speedKmh) && vehicle.speedKmh >= 0
        ? vehicle.speedKmh
        : null;

    const isAssignedById = Boolean(assignedTruckId && vehicle.id === assignedTruckId);
    const isAssignedByNumber = Boolean(
      normalizedAssignedNumber &&
        (vehicle.number?.trim().toLowerCase() === normalizedAssignedNumber ||
          vehicle.licensePlate?.trim().toLowerCase() === normalizedAssignedNumber),
    );

    const licensePlate = (vehicle.licensePlate?.trim() || vehicle.number?.trim() || vehicle.id).trim();

    result.push({
      id: vehicle.id,
      truckNumber: vehicle.number,
      licensePlate,
      driverName: vehicle.mainDriverName?.trim() || null,
      lat: lat as number,
      lng: lng as number,
      rawStatus: vehicle.status ?? null,
      displayStatus: resolveVehicleMapStatus(vehicle, nowMs),
      heading,
      speedKmh,
      updatedAt: vehicle.locationUpdatedAt ?? null,
      isAssignedToSelectedLoad: isAssignedById || isAssignedByNumber,
    });
  }

  return result;
}

/**
 * Trích xuất thông tin điểm lấy hàng (A) và điểm giao hàng (B) từ lô được chọn.
 */
export type DispatchLoadStopSource = Partial<
  Pick<
    TmsShipmentView,
    | "id"
    | "number"
    | "name"
    | "originCity"
    | "destinationCity"
    | "originAddress"
    | "destinationAddress"
    | "originLatitude"
    | "originLongitude"
    | "destinationLatitude"
    | "destinationLongitude"
    | "assignedTruckId"
    | "assignedTruckNumber"
  >
> & {
  origin?: string;
  destination?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
};

/**
 * Trích xuất thông tin điểm lấy hàng (A) và điểm giao hàng (B) từ lô được chọn.
 */
export function extractLoadStopInfo(load?: DispatchLoadStopSource | null): {
  pickup: DispatchMapStopInfo;
  delivery: DispatchMapStopInfo;
} | null {
  if (!load) {
    return null;
  }

  const rawPickupLat = load.originLatitude ?? load.pickupLat ?? null;
  const rawPickupLng = load.originLongitude ?? load.pickupLng ?? null;
  const rawDeliveryLat = load.destinationLatitude ?? load.deliveryLat ?? null;
  const rawDeliveryLng = load.destinationLongitude ?? load.deliveryLng ?? null;

  const pickupHasCoords = isValidCoordinatePair(rawPickupLat, rawPickupLng);
  const deliveryHasCoords = isValidCoordinatePair(rawDeliveryLat, rawDeliveryLng);

  const originLabel = load.originCity || load.origin || "Điểm lấy hàng";
  const destinationLabel = load.destinationCity || load.destination || "Điểm giao hàng";

  return {
    pickup: {
      kind: "pickup",
      badge: "A",
      label: originLabel,
      address: load.originAddress || load.pickupAddress || originLabel,
      lat: pickupHasCoords ? (rawPickupLat as number) : null,
      lng: pickupHasCoords ? (rawPickupLng as number) : null,
      hasValidCoordinates: pickupHasCoords,
    },
    delivery: {
      kind: "delivery",
      badge: "B",
      label: destinationLabel,
      address: load.destinationAddress || load.deliveryAddress || destinationLabel,
      lat: deliveryHasCoords ? (rawDeliveryLat as number) : null,
      lng: deliveryHasCoords ? (rawDeliveryLng as number) : null,
      hasValidCoordinates: deliveryHasCoords,
    },
  };
}

/**
 * Tính khung nhìn (bounding box) bao gồm điểm A, điểm B, tuyến đường và xe được gán cho lô (nếu có).
 */
export function computeDispatchMapBounds(params: {
  pickup?: MapboxCoordinatePoint | null;
  delivery?: MapboxCoordinatePoint | null;
  routeCoordinates?: MapboxLngLat[];
  assignedVehicle?: MapboxCoordinatePoint | null;
  fallbackVehicles?: MapboxCoordinatePoint[];
}): MapboxBoundsBox | null {
  const points: MapboxLngLat[] = [];

  if (params.pickup && isValidCoordinatePair(params.pickup.lat, params.pickup.lng)) {
    points.push([params.pickup.lng, params.pickup.lat]);
  }
  if (params.delivery && isValidCoordinatePair(params.delivery.lat, params.delivery.lng)) {
    points.push([params.delivery.lng, params.delivery.lat]);
  }
  if (Array.isArray(params.routeCoordinates)) {
    for (const [lng, lat] of params.routeCoordinates) {
      if (isValidCoordinatePair(lat, lng)) {
        points.push([lng, lat]);
      }
    }
  }
  if (params.assignedVehicle && isValidCoordinatePair(params.assignedVehicle.lat, params.assignedVehicle.lng)) {
    points.push([params.assignedVehicle.lng, params.assignedVehicle.lat]);
  }

  if (points.length === 0 && Array.isArray(params.fallbackVehicles)) {
    for (const v of params.fallbackVehicles) {
      if (isValidCoordinatePair(v.lat, v.lng)) {
        points.push([v.lng, v.lat]);
      }
    }
  }

  if (points.length === 0) {
    return null;
  }

  let west = points[0][0];
  let east = points[0][0];
  let south = points[0][1];
  let north = points[0][1];

  for (const [lng, lat] of points) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }

  const minSpan = 0.008;
  if (Math.abs(east - west) < minSpan) {
    west -= minSpan / 2;
    east += minSpan / 2;
  }
  if (Math.abs(north - south) < minSpan) {
    south -= minSpan / 2;
    north += minSpan / 2;
  }

  return { west, south, east, north };
}
