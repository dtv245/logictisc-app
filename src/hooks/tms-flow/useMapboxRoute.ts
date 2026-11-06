import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  classifyMapboxDirectionsFailure,
  fetchMapboxDrivingRoute,
  MapboxDirectionsRequestError,
} from "@/api/mapbox/mapbox.api";
import type {
  MapboxCoordinatePoint,
  MapboxLngLat,
  MapboxRouteState,
} from "@/types/tms-flow/mapbox.types";
import {
  buildMapboxRouteCacheKey,
  isValidCoordinatePair,
  validateMapboxPublicToken,
} from "@/utils/tms-flow/mapbox";

const MAPBOX_ROUTE_STALE_TIME_MS = 30 * 60 * 1000;
const METERS_PER_MILE = 1609.344;

export interface UseMapboxRouteInputCoordinate {
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface UseMapboxRouteOptions {
  accessToken?: string | null;
  enabled?: boolean;
}

function normalizeCoordPoint(
  input?: UseMapboxRouteInputCoordinate | null,
): MapboxCoordinatePoint | null {
  if (!input) {
    return null;
  }
  const lat = input.lat ?? input.latitude ?? null;
  const lng = input.lng ?? input.longitude ?? null;
  if (!isValidCoordinatePair(lat, lng)) {
    return null;
  }
  return { lat: lat as number, lng: lng as number };
}

/**
 * Hook lấy tuyến lái xe ước tính qua Mapbox Directions API (`mapbox/driving`) bằng TanStack Query.
 * - Query key làm tròn 5 chữ số thập phân.
 * - `staleTime` dài (30 phút), `refetchOnWindowFocus: false`, `retry: 1`.
 * - Nếu thiếu token hoặc Directions lỗi/hết hạn mức khi đã có đủ tọa độ A–B hợp lệ:
 *   trả về `isFallbackStraightLine: true` kèm đường thẳng nối A–B tham khảo, KHÔNG tính km giao hàng từ đường thẳng.
 */
export function useMapboxRoute(
  originInput?: UseMapboxRouteInputCoordinate | null,
  destinationInput?: UseMapboxRouteInputCoordinate | null,
  options?: UseMapboxRouteOptions,
): MapboxRouteState {
  const origin = useMemo(() => normalizeCoordPoint(originInput), [originInput]);
  const destination = useMemo(() => normalizeCoordPoint(destinationInput), [destinationInput]);

  const rawToken =
    options?.accessToken !== undefined
      ? options.accessToken
      : (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined);

  const tokenCheck = useMemo(() => validateMapboxPublicToken(rawToken), [rawToken]);
  const cacheKey = useMemo(
    () => buildMapboxRouteCacheKey(origin, destination, 5),
    [origin, destination],
  );

  const hasValidStops = Boolean(origin && destination && cacheKey);
  const missingCoordinateReason = !origin
    ? !destination
      ? "both"
      : "pickup"
    : !destination
      ? "delivery"
      : null;
  const isQueryEnabled = Boolean(
    hasValidStops && tokenCheck.valid && (options?.enabled ?? true),
  );
  const previousMissingCoordinateReason = useRef<string | null>(null);

  useEffect(() => {
    if (
      missingCoordinateReason &&
      (options?.enabled ?? true) &&
      previousMissingCoordinateReason.current !== missingCoordinateReason
    ) {
      const message =
        missingCoordinateReason === "both"
          ? "[useMapboxRoute] Missing pickup and delivery coordinates; check the load addresses."
          : missingCoordinateReason === "pickup"
            ? "[useMapboxRoute] Missing pickup coordinates; check the load address."
            : "[useMapboxRoute] Missing delivery coordinates; check the load address.";
      console.warn(message);
    }
    previousMissingCoordinateReason.current = missingCoordinateReason;
  }, [missingCoordinateReason, options?.enabled]);

  const query = useQuery({
    queryKey: ["mapbox-directions-route", ...(cacheKey ?? ["invalid"])] as const,
    queryFn: async ({ signal }) => {
      try {
        return await fetchMapboxDrivingRoute({
          origin: origin as MapboxCoordinatePoint,
          destination: destination as MapboxCoordinatePoint,
          accessToken: tokenCheck.token as string,
          signal,
        });
      } catch (error) {
        throw new MapboxDirectionsRequestError(classifyMapboxDirectionsFailure(error));
      }
    },
    enabled: isQueryEnabled,
    staleTime: MAPBOX_ROUTE_STALE_TIME_MS,
    cacheTime: MAPBOX_ROUTE_STALE_TIME_MS * 2,
    refetchOnWindowFocus: false,
    retry: 1,
    onError: (error) => {
      const failureKind = classifyMapboxDirectionsFailure(error);
      const message =
        failureKind === "authorization"
          ? "[useMapboxRoute] Directions rejected the token or its permissions (HTTP 401/403)."
          : failureKind === "quota"
            ? "[useMapboxRoute] Directions request exceeded the Mapbox quota or rate limit."
            : "[useMapboxRoute] Directions service failed; route calculation is unavailable.";
      console.warn(message);
    },
  });

  return useMemo<MapboxRouteState>(() => {
    if (!hasValidStops || !origin || !destination) {
      return {
        estimate: null,
        distanceMeters: null,
        durationSeconds: null,
        routeCoordinates: [],
        isLoading: false,
        isError: false,
        isFallbackStraightLine: false,
      };
    }

    if (!tokenCheck.valid) {
      return {
        estimate: null,
        distanceMeters: null,
        durationSeconds: null,
        routeCoordinates: [],
        isLoading: false,
        isError: false,
        isFallbackStraightLine: false,
      };
    }

    if (query.data) {
      const { distanceMeters, durationSeconds, coordinates } = query.data;
      return {
        estimate: {
          distanceMiles: Number((distanceMeters / METERS_PER_MILE).toFixed(1)),
          durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
          coordinates,
        },
        distanceMeters,
        durationSeconds,
        routeCoordinates: coordinates,
        isLoading: false,
        isError: false,
        isFallbackStraightLine: false,
      };
    }

    if (isQueryEnabled && query.isLoading) {
      return {
        estimate: null,
        distanceMeters: null,
        durationSeconds: null,
        routeCoordinates: [],
        isLoading: true,
        isError: false,
        isFallbackStraightLine: false,
      };
    }

    // Khi thiếu token hoặc Directions API lỗi / hết hạn mức: nối thẳng A-B tham khảo, không tính km
    const straightLineCoords: MapboxLngLat[] = [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ];

    return {
      estimate: null,
      distanceMeters: null,
      durationSeconds: null,
      routeCoordinates: straightLineCoords,
      isLoading: false,
      isError: Boolean(query.isError),
      isFallbackStraightLine: true,
    };
  }, [
    destination,
    hasValidStops,
    isQueryEnabled,
    origin,
    query.data,
    query.isError,
    query.isLoading,
    tokenCheck.valid,
  ]);
}
