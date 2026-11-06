import { describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  classifyMapboxDirectionsFailure,
  fetchMapboxDrivingRoute,
} from "@/api/mapbox/mapbox.api";
import {
  VEHICLE_SIGNAL_LOSS_THRESHOLD_MINUTES,
  buildMapboxRouteCacheKey,
  computeDispatchMapBounds,
  extractLoadStopInfo,
  formatVehicleUpdatedTimeLabel,
  formatVietnameseDistanceKm,
  formatVietnameseDurationEstimate,
  formatVietnameseRouteBadge,
  getRouteMidpointLngLat,
  isValidCoordinatePair,
  normalizeDispatchMapVehicles,
  resolveVehicleMapStatus,
  roundCoordinateForCache,
  validateMapboxPublicToken,
} from "@/utils/tms-flow/mapbox";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("mapbox pure utilities (MAP-001..006)", () => {
  describe("validateMapboxPublicToken", () => {
    it("accepts valid pk. public token and rejects missing or sk. secret tokens", () => {
      expect(validateMapboxPublicToken("pk.eyJ1IjoidGVzdCJ9.abc")).toEqual({
        valid: true,
        token: "pk.eyJ1IjoidGVzdCJ9.abc",
      });
      expect(validateMapboxPublicToken("")).toEqual({
        valid: false,
        token: null,
        reason: "missing",
      });
      expect(validateMapboxPublicToken("sk.secret_token_never_in_fe")).toEqual({
        valid: false,
        token: null,
        reason: "secret_token_forbidden",
      });
      expect(validateMapboxPublicToken("tk.invalid")).toEqual({
        valid: false,
        token: null,
        reason: "invalid_prefix",
      });
    });
  });

  describe("coordinates & cache key", () => {
    it("validates coordinate ranges and rejects null-island (0,0)", () => {
      expect(isValidCoordinatePair(10.7769, 106.7009)).toBe(true);
      expect(isValidCoordinatePair(0, 0)).toBe(false);
      expect(isValidCoordinatePair(95, 106)).toBe(false);
      expect(isValidCoordinatePair(10, 190)).toBe(false);
      expect(isValidCoordinatePair(null, 106)).toBe(false);
    });

    it("rounds coordinates to 5 decimals and builds [originLng, originLat, destLng, destLat] cache key", () => {
      expect(roundCoordinateForCache(106.7009184, 5)).toBe(106.70092);
      const key = buildMapboxRouteCacheKey(
        { lat: 10.776889, lng: 106.700918 },
        { lat: 21.028511, lng: 105.804817 },
      );
      expect(key).toEqual([106.70092, 10.77689, 105.80482, 21.02851]);
    });
  });

  describe("Vietnamese distance and duration formatting", () => {
    it("formats distance and duration into natural Vietnamese estimate badge", () => {
      expect(formatVietnameseDistanceKm(128_200)).toBe("128 km");
      expect(formatVietnameseDistanceKm(4_500)).toBe("4,5 km");
      expect(formatVietnameseDurationEstimate(7_800)).toBe(
        "khoảng 2 giờ 10 phút (ước tính)",
      );
      expect(formatVietnameseDurationEstimate(2_700)).toBe(
        "khoảng 45 phút (ước tính)",
      );
      expect(formatVietnameseRouteBadge(128_000, 7_800)).toBe(
        "128 km · khoảng 2 giờ 10 phút (ước tính)",
      );
    });
  });

  describe("getRouteMidpointLngLat", () => {
    it("computes the geometric midpoint along a route polyline", () => {
      const mid = getRouteMidpointLngLat([
        [106.0, 10.0],
        [106.0, 11.0],
        [106.0, 12.0],
      ]);
      expect(mid).toEqual([106.0, 11.0]);
    });
  });

  describe("resolveVehicleMapStatus & normalizeDispatchMapVehicles", () => {
    const nowMs = Date.parse("2026-11-06T10:30:00.000Z");

    it("detects signal_lost when timestamp exceeds VEHICLE_SIGNAL_LOSS_THRESHOLD_MINUTES (15m)", () => {
      expect(VEHICLE_SIGNAL_LOSS_THRESHOLD_MINUTES).toBe(15);

      const staleVehicle = {
        id: "truck-1",
        number: "TRK-01",
        status: "in_use",
        currentLocationLatitude: 10.8,
        currentLocationLongitude: 106.7,
        locationUpdatedAt: "2026-11-06T10:10:00.000Z", // 20 mins ago
      };
      expect(resolveVehicleMapStatus(staleVehicle, nowMs)).toBe("signal_lost");

      const freshMovingVehicle = {
        ...staleVehicle,
        locationUpdatedAt: "2026-11-06T10:25:00.000Z", // 5 mins ago
      };
      expect(resolveVehicleMapStatus(freshMovingVehicle, nowMs)).toBe("in_use");

      const stoppedVehicle = {
        ...freshMovingVehicle,
        status: "available",
      };
      expect(resolveVehicleMapStatus(stoppedVehicle, nowMs)).toBe("available");
    });

    it("uses the truck's operational status and never infers motion from status or generic updatedAt", () => {
      expect(resolveVehicleMapStatus({ id: "t1", number: "T1", status: "in_use" }, nowMs)).toBe("in_use");
      expect(
        resolveVehicleMapStatus({ id: "t1", number: "T1", status: "available", speedKmh: 50 }, nowMs),
      ).toBe("available");
      expect(resolveVehicleMapStatus({ id: "t1", number: "T1", status: "maintenance" }, nowMs)).toBe("maintenance");
      expect(resolveVehicleMapStatus({ id: "t1", number: "T1", status: "out_of_service" }, nowMs)).toBe("out_of_service");
      expect(
        resolveVehicleMapStatus({
          id: "t1",
          number: "T1",
          status: "in_use",
          updatedAt: "2026-11-06T10:00:00.000Z",
        }, nowMs),
      ).toBe("in_use");
      expect(resolveVehicleMapStatus({ id: "t1", number: "T1", status: "unexpected" }, nowMs)).toBe("unknown");
    });

    it("filters out vehicles without valid coordinates and never fabricates positions", () => {
      const normalized = normalizeDispatchMapVehicles(
        [
          {
            id: "t-valid",
            number: "51C-123.45",
            licensePlate: "51C-123.45",
            mainDriverName: "Nguyễn Văn A",
            status: "in_use",
            currentLocationLatitude: 10.77,
            currentLocationLongitude: 106.69,
            heading: 135,
          },
          {
            id: "t-missing",
            number: "51C-999.99",
            status: "in_use",
            currentLocationLatitude: null,
            currentLocationLongitude: null,
          },
        ],
        "t-valid",
        null,
        nowMs,
      );

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toMatchObject({
        id: "t-valid",
        licensePlate: "51C-123.45",
        driverName: "Nguyễn Văn A",
        displayStatus: "in_use",
        heading: 135,
        isAssignedToSelectedLoad: true,
      });
    });

    it("formats vehicle update time as HH:mm or null when absent", () => {
      const iso = new Date(2026, 10, 6, 14, 5, 0).toISOString();
      expect(formatVehicleUpdatedTimeLabel(iso)).toBe("14:05");
      expect(formatVehicleUpdatedTimeLabel(null)).toBeNull();
    });
  });

  describe("extractLoadStopInfo & computeDispatchMapBounds", () => {
    it("extracts A and B stop info and includes assigned vehicle in fitBounds", () => {
      const stops = extractLoadStopInfo({
        id: "load-1",
        originCity: "TP. Hồ Chí Minh",
        originAddress: "KCN Tân Bình, TP.HCM",
        originLatitude: 10.801,
        originLongitude: 106.625,
        destinationCity: "Biên Hòa",
        destinationAddress: "KCN Amata, Đồng Nai",
        destinationLatitude: 10.95,
        destinationLongitude: 106.85,
      });

      expect(stops?.pickup.hasValidCoordinates).toBe(true);
      expect(stops?.delivery.hasValidCoordinates).toBe(true);

      const bounds = computeDispatchMapBounds({
        pickup: { lat: 10.801, lng: 106.625 },
        delivery: { lat: 10.95, lng: 106.85 },
        assignedVehicle: { lat: 10.65, lng: 106.5 }, // Outside A-B box
      });

      expect(bounds).toEqual({
        west: 106.5,
        south: 10.65,
        east: 106.85,
        north: 10.95,
      });
    });
  });

  describe("fetchMapboxDrivingRoute (MAP-002)", () => {
    it("classifies authorization and quota failures without exposing response data", () => {
      expect(classifyMapboxDirectionsFailure({ response: { status: 401 } })).toBe("authorization");
      expect(classifyMapboxDirectionsFailure({ response: { status: 403 } })).toBe("authorization");
      expect(classifyMapboxDirectionsFailure({ response: { status: 429 } })).toBe("quota");
      expect(
        classifyMapboxDirectionsFailure({
          response: { status: 400, data: { message: "Monthly quota exceeded" } },
        }),
      ).toBe("quota");
      expect(classifyMapboxDirectionsFailure(new Error("network failure"))).toBe("service");
    });

    it("calls Mapbox Directions API with lng,lat order, geometries=geojson, overview=full", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          code: "Ok",
          routes: [
            {
              distance: 128000,
              duration: 7800,
              geometry: {
                type: "LineString",
                coordinates: [
                  [106.625, 10.801],
                  [106.75, 10.88],
                  [106.85, 10.95],
                ],
              },
            },
          ],
        },
      });

      const result = await fetchMapboxDrivingRoute({
        origin: { lat: 10.801, lng: 106.625 },
        destination: { lat: 10.95, lng: 106.85 },
        accessToken: "pk.test_public_token",
      });

      expect(axios.get).toHaveBeenCalledWith(
        "https://api.mapbox.com/directions/v5/mapbox/driving/106.625,10.801;106.85,10.95",
        expect.objectContaining({
          params: {
            geometries: "geojson",
            overview: "full",
            access_token: "pk.test_public_token",
          },
        }),
      );
      expect(result).toEqual({
        distanceMeters: 128000,
        durationSeconds: 7800,
        coordinates: [
          [106.625, 10.801],
          [106.75, 10.88],
          [106.85, 10.95],
        ],
      });
    });
  });
});
