import { useQuery } from "@tanstack/react-query";
import type { LngLat, RouteData, VehicleType } from "@/features/map/types";
import { VEHICLE_CONFIGS } from "@/features/map/types";
import { decodePolyline } from "@/features/map/lib/polyline";

export interface RouteRequest {
  id: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  driverName: string;
  waypoints: LngLat[]; // [lng, lat][]
}

export interface RouteAdapter {
  calculateRoute(req: RouteRequest): Promise<RouteData>;
}

/**
 * OSRM Routing Adapter (Open Source Routing Machine).
 * Tự động gọi API OSRM và giải mã polyline sang mảng toạ độ chuẩn [lng, lat][].
 */
export class OsrmRouteAdapter implements RouteAdapter {
  private baseUrl: string;

  constructor(
    baseUrl: string = import.meta.env.VITE_ROUTING_API_URL ||
      "https://router.project-osrm.org/route/v1/driving",
  ) {
    this.baseUrl = baseUrl;
  }

  async calculateRoute(req: RouteRequest): Promise<RouteData> {
    const config = VEHICLE_CONFIGS[req.vehicleType];
    const coordsString = req.waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = `${this.baseUrl}/${coordsString}?overview=full&geometries=polyline`;

    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        throw new Error(`OSRM API error: ${res.status}`);
      }

      interface OsrmResponse {
        code: string;
        routes?: Array<{
          geometry: string; // Polyline chuỗi
          distance: number; // Mét
          duration: number; // Giây
        }>;
      }

      const json = (await res.json()) as OsrmResponse;

      if (json.code === "Ok" && json.routes && json.routes.length > 0) {
        const route = json.routes[0];
        // QUAN TRỌNG: OSRM v5 trả về polyline precision 5
        // decodePolyline sẽ đảo ngược [lat, lng] về chuẩn [lng, lat]
        const decodedCoordinates = decodePolyline(route.geometry, 5);

        return {
          id: req.id,
          vehicleType: req.vehicleType,
          vehiclePlate: req.vehiclePlate,
          driverName: req.driverName,
          coordinates: decodedCoordinates,
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMinutes: Math.round(route.duration / 60),
          encodedPolyline: route.geometry,
          color: config.color,
        };
      }
    } catch (error) {
      console.warn("Lỗi khi gọi OSRM API, sử dụng đường thẳng fallback:", error);
    }

    // Fallback nếu không kết nối được OSRM
    return {
      id: req.id,
      vehicleType: req.vehicleType,
      vehiclePlate: req.vehiclePlate,
      driverName: req.driverName,
      coordinates: req.waypoints,
      distanceKm: 5.2,
      durationMinutes: 18,
      color: config.color,
    };
  }
}

/**
 * Hook truy vấn danh sách tuyến đường dùng TanStack React Query.
 */
export function useRoutes(
  requests: RouteRequest[],
  adapter: RouteAdapter = new OsrmRouteAdapter(),
) {
  return useQuery({
    queryKey: ["map-routes", requests.map((r) => r.id).join(",")],
    queryFn: async (): Promise<RouteData[]> => {
      const results = await Promise.all(
        requests.map((req) => adapter.calculateRoute(req)),
      );
      return results;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
  });
}
