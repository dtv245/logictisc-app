import axios from "axios";
import type {
  MapboxCoordinatePoint,
  MapboxDirectionsResult,
  MapboxLngLat,
} from "@/types/tms-flow/mapbox.types";
import {
  isValidCoordinatePair,
  roundCoordinateForCache,
  validateMapboxPublicToken,
} from "@/utils/tms-flow/mapbox";

const MAPBOX_DIRECTIONS_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/driving";

interface MapboxDirectionsApiResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      type?: string;
      coordinates?: unknown[];
    };
  }>;
  message?: string;
}

export type MapboxDirectionsFailureKind = "authorization" | "quota" | "service";

export class MapboxDirectionsRequestError extends Error {
  readonly failureKind: MapboxDirectionsFailureKind;

  constructor(failureKind: MapboxDirectionsFailureKind) {
    const message =
      failureKind === "authorization"
        ? "Mapbox Directions authorization failed."
        : failureKind === "quota"
          ? "Mapbox Directions quota or rate limit was reached."
          : "Mapbox Directions service failed.";
    super(message);
    this.name = "MapboxDirectionsRequestError";
    this.failureKind = failureKind;
  }
}

/** Classify an error without exposing Axios config, request URLs, or access tokens. */
export function classifyMapboxDirectionsFailure(error: unknown): MapboxDirectionsFailureKind {
  if (
    typeof error === "object" &&
    error !== null &&
    "failureKind" in error &&
    ((error as { failureKind?: unknown }).failureKind === "authorization" ||
      (error as { failureKind?: unknown }).failureKind === "quota" ||
      (error as { failureKind?: unknown }).failureKind === "service")
  ) {
    return (error as { failureKind: MapboxDirectionsFailureKind }).failureKind;
  }

  const response =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: unknown; data?: unknown } }).response
      : undefined;
  const status = typeof response?.status === "number" ? response.status : null;
  if (status === 401 || status === 403) {
    return "authorization";
  }
  if (status === 429) {
    return "quota";
  }

  const payload = response?.data;
  const payloadText =
    typeof payload === "string"
      ? payload
      : typeof payload === "object" && payload !== null
        ? JSON.stringify(payload)
        : "";
  if (/quota|rate.?limit|too many requests|dailylimit/i.test(payloadText)) {
    return "quota";
  }
  return "service";
}

export interface FetchMapboxDrivingRouteParams {
  origin: MapboxCoordinatePoint;
  destination: MapboxCoordinatePoint;
  accessToken: string;
  signal?: AbortSignal;
}

/**
 * Gọi Mapbox Directions API (profile `mapbox/driving`) với thứ tự tọa độ `lng,lat`,
 * `geometries=geojson`, `overview=full`.
 * Trả về `distanceMeters`, `durationSeconds`, và danh sách tọa độ `[lng, lat][]`.
 */
export async function fetchMapboxDrivingRoute({
  origin,
  destination,
  accessToken,
  signal,
}: FetchMapboxDrivingRouteParams): Promise<MapboxDirectionsResult> {
  const tokenCheck = validateMapboxPublicToken(accessToken);
  if (!tokenCheck.valid || !tokenCheck.token) {
    throw new Error("Invalid or missing Mapbox public token.");
  }

  if (
    !isValidCoordinatePair(origin.lat, origin.lng) ||
    !isValidCoordinatePair(destination.lat, destination.lng)
  ) {
    throw new Error("Invalid origin or destination coordinates for Mapbox Directions.");
  }

  const originLng = roundCoordinateForCache(origin.lng, 5);
  const originLat = roundCoordinateForCache(origin.lat, 5);
  const destLng = roundCoordinateForCache(destination.lng, 5);
  const destLat = roundCoordinateForCache(destination.lat, 5);

  const coordinatesPath = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `${MAPBOX_DIRECTIONS_BASE_URL}/${coordinatesPath}`;

  const response = await axios.get<MapboxDirectionsApiResponse>(url, {
    params: {
      geometries: "geojson",
      overview: "full",
      access_token: tokenCheck.token,
    },
    signal,
    timeout: 8000,
  });

  const payload = response.data;
  const firstRoute = payload?.routes?.[0];
  if (
    !firstRoute ||
    typeof firstRoute.distance !== "number" ||
    !Number.isFinite(firstRoute.distance) ||
    typeof firstRoute.duration !== "number" ||
    !Number.isFinite(firstRoute.duration)
  ) {
    throw new Error(payload?.message || "Mapbox Directions returned no valid driving route.");
  }

  const rawCoords = firstRoute.geometry?.coordinates ?? [];
  const coordinates: MapboxLngLat[] = [];

  for (const point of rawCoords) {
    if (
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number" &&
      isValidCoordinatePair(point[1], point[0])
    ) {
      coordinates.push([point[0], point[1]]);
    }
  }

  if (coordinates.length < 2) {
    throw new Error("Mapbox Directions route geometry has fewer than 2 valid coordinates.");
  }

  return {
    distanceMeters: firstRoute.distance,
    durationSeconds: firstRoute.duration,
    coordinates,
  };
}
