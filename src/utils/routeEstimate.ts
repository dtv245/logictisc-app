/**
 * Ước tính tuyến đường bằng OSRM — dịch vụ routing đã cấu hình sẵn cho dự án
 * qua `VITE_ROUTING_API_URL` (xem `.env.example`). Chỉ gồm hàm thuần để test;
 * phần gọi mạng nằm ở `useRouteEstimate`.
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteEstimate {
  distanceMiles: number;
  durationMinutes: number;
  /** OSRM road geometry in [longitude, latitude] order when requested. */
  coordinates?: [number, number][];
}

const METERS_PER_MILE = 1609.344;

/** Toạ độ dùng được: trong miền hợp lệ và không phải mặc định (0, 0). */
export const isUsableCoordinate = (
  coordinate: GeoCoordinate | null | undefined,
): coordinate is GeoCoordinate => {
  if (!coordinate) return false;
  const { latitude, longitude } = coordinate;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  return !(latitude === 0 && longitude === 0);
};

/** Hai toạ độ khác nhau đủ để gọi routing (tránh request 0 dặm). */
export const coordinatesDiffer = (
  origin: GeoCoordinate | null | undefined,
  destination: GeoCoordinate | null | undefined,
): boolean => {
  if (!isUsableCoordinate(origin) || !isUsableCoordinate(destination)) return false;
  return (
    Math.abs(origin.latitude - destination.latitude) > 1e-6 ||
    Math.abs(origin.longitude - destination.longitude) > 1e-6
  );
};

/** URL OSRM route/v1 cho đúng 2 điểm, trả về JSON gọn (không polyline). */
export const buildOsrmRouteUrl = (
  baseUrl: string,
  origin: GeoCoordinate,
  destination: GeoCoordinate,
  options: { includeGeometry?: boolean } = {},
): string => {
  const normalized = baseUrl.replace(/\/+$/, "");
  const path = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(`${normalized}/${path}`);
  url.searchParams.set("overview", options.includeGeometry ? "full" : "false");
  if (options.includeGeometry) url.searchParams.set("geometries", "geojson");
  return url.toString();
};

/** Đọc phản hồi OSRM; trả `null` thay vì bịa số khi phản hồi sai/không có tuyến. */
export const parseOsrmRouteResponse = (payload: unknown): RouteEstimate | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const response = payload as {
    code?: unknown;
    routes?: Array<{
      distance?: unknown;
      duration?: unknown;
      geometry?: { coordinates?: unknown };
    }>;
  };
  if (response.code !== "Ok" || !Array.isArray(response.routes) || response.routes.length === 0) {
    return null;
  }

  const route = response.routes[0];
  const distanceMeters = Number(route.distance);
  const durationSeconds = Number(route.duration);
  if (
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(durationSeconds) ||
    distanceMeters < 0 ||
    durationSeconds < 0
  ) {
    return null;
  }

  const result: RouteEstimate = {
    distanceMiles: Math.round((distanceMeters / METERS_PER_MILE) * 10) / 10,
    durationMinutes: Math.round(durationSeconds / 60),
  };
  const geometryCoordinates = route.geometry?.coordinates;
  if (Array.isArray(geometryCoordinates)) {
    const coordinates = geometryCoordinates.flatMap((coordinate): [number, number][] => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) return [];
      const [longitude, latitude] = coordinate.map(Number);
      const point = { latitude, longitude };
      return isUsableCoordinate(point) ? [[longitude, latitude]] : [];
    });
    if (coordinates.length >= 2) result.coordinates = coordinates;
  }
  return result;
};
