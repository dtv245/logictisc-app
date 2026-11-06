/**
 * Ước tính khoảng cách/thời gian chạy giữa điểm lấy và điểm giao bằng OSRM.
 *
 * - Chỉ gọi khi cả hai toạ độ dùng được và khác nhau.
 * - Debounce toạ độ để gõ số vào ô GPS không tạo request theo từng phím.
 * - TanStack Query cache theo cặp toạ độ (`staleTime` 10 phút); mở lại form
 *   cùng tuyến không gọi lại mạng.
 * - Khi OSRM lỗi/không có tuyến, trả `estimate: null` — không bịa số.
 */

import { useQuery } from "@tanstack/react-query";

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import {
  buildOsrmRouteUrl,
  coordinatesDiffer,
  parseOsrmRouteResponse,
  type GeoCoordinate,
  type RouteEstimate,
} from "@/utils/routeEstimate";

const DEFAULT_OSRM_BASE_URL =
  "https://router.project-osrm.org/route/v1/driving";

const baseUrl = (): string =>
  import.meta.env.VITE_ROUTING_API_URL || DEFAULT_OSRM_BASE_URL;

const coordinateKey = (coordinate: GeoCoordinate | null | undefined): string =>
  coordinate ? `${coordinate.latitude},${coordinate.longitude}` : "";

const parseCoordinate = (value: string): GeoCoordinate | null => {
  if (!value) return null;
  const [latitude, longitude] = value.split(",").map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

export interface RouteEstimateState {
  estimate: RouteEstimate | null;
  isLoading: boolean;
  isError: boolean;
}

export function useRouteEstimate(
  origin: GeoCoordinate | null | undefined,
  destination: GeoCoordinate | null | undefined,
  options: { includeGeometry?: boolean } = {},
): RouteEstimateState {
  const includeGeometry = options.includeGeometry ?? false;
  const enabled = coordinatesDiffer(origin, destination);
  const rawKey = enabled ? `${coordinateKey(origin)}|${coordinateKey(destination)}` : "";
  const debouncedKey = useDebouncedSearch(rawKey, 600);

  const [originKey, destinationKey] = debouncedKey.split("|");
  const debouncedOrigin = parseCoordinate(originKey);
  const debouncedDestination = parseCoordinate(destinationKey);
  const queryEnabled = coordinatesDiffer(debouncedOrigin, debouncedDestination);
  const routeMatchesCurrentInput = enabled && rawKey === debouncedKey && queryEnabled;

  const query = useQuery<RouteEstimate | null>({
    queryKey: ["load-route-estimate", debouncedKey, includeGeometry],
    queryFn: async ({ signal }) => {
      if (!debouncedOrigin || !debouncedDestination) return null;
      const response = await fetch(
        buildOsrmRouteUrl(baseUrl(), debouncedOrigin, debouncedDestination, { includeGeometry }),
        { signal, headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        throw new Error(`OSRM_HTTP_${response.status}`);
      }
      return parseOsrmRouteResponse(await response.json());
    },
    enabled: queryEnabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    estimate: routeMatchesCurrentInput ? (query.data ?? null) : null,
    isLoading: enabled && (rawKey !== debouncedKey || (routeMatchesCurrentInput && query.isFetching)),
    isError: routeMatchesCurrentInput && query.isError,
  };
}
