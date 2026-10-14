import React, { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "antd";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { viMessages } from "@/locales/vi";
import { enMessages } from "@/locales/en";
import type { OptimizationCandidate } from "@/types/optimization.dto";
import { extractRouteGeometry, normalizeLngLat, parseCoordinatesArray } from "@/features/optimization/visualizations/routeGeometry";
import CandidateRouteMap from "@/features/optimization/visualizations/CandidateRouteMap";
import CandidateHosTimeline from "@/features/optimization/visualizations/CandidateHosTimeline";
import CandidateVisualizations from "@/features/optimization/visualizations/CandidateVisualizations";
import type { default as Map, Layer, Marker, Source } from "react-map-gl/maplibre";

// Mock MapLibre / react-map-gl
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, mapStyle, initialViewState }: React.ComponentProps<typeof Map>) => (
    <div
      data-testid="maplibre-map"
      data-map-style={typeof mapStyle === "string" ? mapStyle : JSON.stringify(mapStyle)}
      data-initial-view={JSON.stringify(initialViewState)}
    >
      {children}
    </div>
  ),
  NavigationControl: () => <div data-testid="navigation-control" />,
  ScaleControl: () => <div data-testid="scale-control" />,
  Marker: ({ children, longitude, latitude, anchor }: React.ComponentProps<typeof Marker>) => (
    <div
      data-testid="map-marker"
      data-lng={longitude}
      data-lat={latitude}
      data-anchor={anchor}
    >
      {children}
    </div>
  ),
  Source: ({ children, id, type, ...props }: React.ComponentProps<typeof Source>) => (
    <div
      data-testid={`map-source-${id}`}
      data-source-type={type}
      data-source-data={JSON.stringify("data" in props ? props.data : undefined)}
    >
      {children}
    </div>
  ),
  Layer: ({ id, type, ...props }: React.ComponentProps<typeof Layer>) => (
    <div
      data-testid={`map-layer-${id}`}
      data-layer-type={type}
      data-layer-paint={JSON.stringify("paint" in props ? props.paint : undefined)}
    />
  ),
}));

async function renderWithI18n(ui: React.ReactElement, lang = "vi") {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    lng: lang,
    resources: {
      vi: { translation: viMessages },
      en: { translation: enMessages },
    },
    interpolation: { escapeValue: false },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <App>{children}</App>
      </I18nextProvider>
    ),
  });
}

const baseCandidate: OptimizationCandidate = {
  id: "cand-1111",
  runId: "run-0001",
  loadId: "load-0001",
  tripId: "trip-0001",
  driverId: "driver-0001",
  truckId: "truck-0001",
  ratingSnapshotId: "rating-0001",
  feasible: true,
  rejectionCodes: [],
  finalScore: "95.5",
  rank: 1,
  inputFingerprint: "fingerprint-1",
  explanation: {
    context: {
      loadId: "load-0001",
      tripId: "trip-0001",
      driverId: "driver-0001",
      truckId: "truck-0001",
      planningStart: "2026-10-12T00:00:00Z",
      planningEnd: "2026-10-14T00:00:00Z",
    },
    evidence: {
      route: {
        value: {
          deadhead: { normalizedMiles: 15.2, originalValue: 15.2, originalUnit: "MILE" },
          loadAttributedLoadedMiles: { normalizedMiles: 120.5, originalValue: 120.5, originalUnit: "MILE" },
          appointmentStart: "2026-10-12T08:00:00Z",
          predictedArrivalAtPickup: "2026-10-12T07:45:00Z",
          pickupReachable: true,
          simulatedRoutePlanReference: "sim-route-1",
          simulatedRoutePlanVersion: "1",
        },
        provenance: {
          source: { type: "ROUTER", reference: "OSRM", version: "v1", classification: "AUTHORITATIVE_DB" },
          context: {
            loadId: "load-0001",
            tripId: "trip-0001",
            driverId: "driver-0001",
            truckId: "truck-0001",
            planningStart: "2026-10-12T00:00:00Z",
            planningEnd: "2026-10-14T00:00:00Z",
          },
          evidenceReference: "ev-1",
          evidenceVersion: "1",
          unit: "MILE",
          observedAt: "2026-10-12T00:00:00Z",
          expiresAt: "2026-10-14T00:00:00Z",
          maxAgeSeconds: 86400,
        },
      },
    },
    hos: {
      value: {
        ruleSetCode: "USA_PROPERTY_60_7",
        ruleSetVersion: "1",
        simulatedRoutePlanReference: "sim-hos-1",
        simulatedRoutePlanVersion: "1",
        driveFeasible: true,
        dutyFeasible: true,
        breakFeasible: true,
        cycleFeasible: true,
        serviceFeasible: true,
        nextAvailableFeasible: true,
        minimumHosHeadroomRatio: 0.35, // 35% headroom remaining
      },
      provenance: {
        source: { type: "HOS_ENGINE", reference: "ELD", version: "v1", classification: "AUTHORITATIVE_DB" },
        context: {
          loadId: "load-0001",
          tripId: "trip-0001",
          driverId: "driver-0001",
          truckId: "truck-0001",
          planningStart: "2026-10-12T00:00:00Z",
          planningEnd: "2026-10-14T00:00:00Z",
        },
        evidenceReference: "ev-hos-1",
        evidenceVersion: "1",
        unit: "RATIO",
        observedAt: "2026-10-12T00:00:00Z",
        expiresAt: "2026-10-14T00:00:00Z",
        maxAgeSeconds: 86400,
      },
    },
    forecast: null,
    feasible: true,
    rejectionCodes: [],
    score: null,
    databaseStateFingerprint: "fp-1",
  },
};

const candidateWithCoordinates: OptimizationCandidate = {
  ...baseCandidate,
  explanation: {
    ...baseCandidate.explanation,
    evidence: {
      ...baseCandidate.explanation.evidence,
      route: {
        ...baseCandidate.explanation.evidence.route!,
        value: {
          ...baseCandidate.explanation.evidence.route!.value,
          // [lng, lat]
          vehicleCoordinates: [106.660172, 10.762622],
          pickupCoordinates: [106.700000, 10.775000],
          deliveryCoordinates: [106.750000, 10.820000],
          deadheadPolyline: [[106.660172, 10.762622], [106.68, 10.77], [106.700000, 10.775000]],
          loadedPolyline: [[106.700000, 10.775000], [106.73, 10.80], [106.750000, 10.820000]],
        },
      },
    },
  },
};

describe("Visualizations Unit Tests", () => {
  describe("routeGeometry helpers", () => {
    it("normalizeLngLat chuẩn hoá mảng và đối tượng thành [lng, lat]", () => {
      expect(normalizeLngLat([106.66, 10.76])).toEqual([106.66, 10.76]);
      expect(normalizeLngLat({ lng: 106.66, lat: 10.76 })).toEqual([106.66, 10.76]);
      expect(normalizeLngLat({ longitude: 106.66, latitude: 10.76 })).toEqual([106.66, 10.76]);
      expect(normalizeLngLat({ value: { longitude: 106.66, latitude: 10.76 } })).toEqual([106.66, 10.76]);

      // Toạ độ không hợp lệ
      expect(normalizeLngLat([200, 10.76])).toBeNull(); // lng ngoài [-180, 180]
      expect(normalizeLngLat([106.66, 100])).toBeNull(); // lat ngoài [-90, 90]
      expect(normalizeLngLat(null)).toBeNull();
      expect(normalizeLngLat("invalid")).toBeNull();
    });

    it("parseCoordinatesArray trích xuất danh sách toạ độ [lng, lat][]", () => {
      const arrayCoords: [number, number][] = [[106.66, 10.76], [106.70, 10.78]];
      expect(parseCoordinatesArray(arrayCoords)).toEqual(arrayCoords);

      // Polyline đã mã hoá
      const encoded = "_ibE_seK_seK_seK";
      const parsed = parseCoordinatesArray(encoded);
      expect(parsed).not.toBeNull();
      expect(parsed?.length).toBeGreaterThan(0);
      expect(parsed?.[0][0]).toBeGreaterThan(0);
    });

    it("extractRouteGeometry phát hiện thiếu trường và liệt kê chi tiết trường backend cần bổ sung", () => {
      const result = extractRouteGeometry(baseCandidate);
      expect(result.hasData).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields.map((f) => f.field)).toContain("evidence.route.value.vehicleCoordinates");
      expect(result.missingFields.map((f) => f.field)).toContain("evidence.route.value.pickupCoordinates");
      expect(result.missingFields.map((f) => f.field)).toContain("evidence.route.value.deliveryCoordinates");
      expect(result.reason).toContain("không tự gọi geocoding");
    });

    it("extractRouteGeometry trích xuất đầy đủ toạ độ khi DTO có dữ liệu", () => {
      const result = extractRouteGeometry(candidateWithCoordinates);
      expect(result.hasData).toBe(true);
      expect(result.geometry?.vehicleCoordinates).toEqual([106.660172, 10.762622]);
      expect(result.geometry?.pickupCoordinates).toEqual([106.700000, 10.775000]);
      expect(result.geometry?.deliveryCoordinates).toEqual([106.750000, 10.820000]);
      expect(result.geometry?.deadheadCoordinates.length).toBe(3);
      expect(result.geometry?.loadedCoordinates.length).toBe(3);
    });
  });

  describe("CandidateRouteMap", () => {
    it("supports coordinates becoming available and missing again on the same mount", async () => {
      const { rerender } = await renderWithI18n(<CandidateRouteMap candidate={null} />);
      expect(screen.getByTestId("candidate-route-map-empty")).toBeInTheDocument();

      rerender(<CandidateRouteMap candidate={candidateWithCoordinates} />);
      expect(screen.getByTestId("maplibre-map")).toBeInTheDocument();

      rerender(<CandidateRouteMap candidate={null} />);
      expect(screen.getByTestId("candidate-route-map-empty")).toBeInTheDocument();
      expect(screen.queryByTestId("maplibre-map")).not.toBeInTheDocument();
    });

    it("khi DTO thiếu toạ độ: hiển thị Empty kèm lý do cụ thể và danh sách trường backend cần bổ sung, không vẽ canvas bản đồ rỗng", async () => {
      await renderWithI18n(<CandidateRouteMap candidate={baseCandidate} />);

      // Kiểm tra không vẽ maplibre
      expect(screen.queryByTestId("maplibre-map")).not.toBeInTheDocument();

      // Kiểm tra có card Empty
      expect(screen.getByTestId("candidate-route-map-empty")).toBeInTheDocument();
      expect(screen.getByText(/Chưa thể hiển thị bản đồ/i)).toBeInTheDocument();
      expect(screen.getByText(/không tự động gọi geocoding/i)).toBeInTheDocument();

      // Liệt kê các trường backend cần bổ sung
      expect(screen.getByText(/vehicleCoordinates/)).toBeInTheDocument();
      expect(screen.getByText(/pickupCoordinates/)).toBeInTheDocument();
      expect(screen.getByText(/deliveryCoordinates/)).toBeInTheDocument();
    });

    it("khi DTO có toạ độ: vẽ bản đồ với nét đứt cho đoạn chạy rỗng và nét liền cho đoạn giao hàng", async () => {
      await renderWithI18n(<CandidateRouteMap candidate={candidateWithCoordinates} />);

      const map = screen.getByTestId("maplibre-map");
      expect(map).toBeInTheDocument();

      // Kiểm tra style URL không hard-code token
      const expectedStyle = import.meta.env.VITE_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";
      expect(map.getAttribute("data-map-style")).toBe(expectedStyle);

      // Kiểm tra lớp đường chạy rỗng (deadhead): phải có nét đứt line-dasharray: [2, 2]
      const deadheadLayer = screen.getByTestId("map-layer-candidate-deadhead-layer");
      expect(deadheadLayer).toBeInTheDocument();
      const deadheadPaint = JSON.parse(deadheadLayer.getAttribute("data-layer-paint") || "{}");
      expect(deadheadPaint["line-dasharray"]).toEqual([2, 2]);

      // Kiểm tra lớp đường có tải (loaded): nét liền (không có line-dasharray)
      const loadedLayer = screen.getByTestId("map-layer-candidate-loaded-layer");
      expect(loadedLayer).toBeInTheDocument();
      const loadedPaint = JSON.parse(loadedLayer.getAttribute("data-layer-paint") || "{}");
      expect(loadedPaint["line-dasharray"]).toBeUndefined();

      // Kiểm tra markers: có 3 marker (xe, lấy hàng, giao hàng)
      const markers = screen.getAllByTestId("map-marker");
      expect(markers).toHaveLength(3);

      // Marker xe có toạ độ chuẩn [lng, lat]
      expect(markers[0].getAttribute("data-lng")).toBe("106.660172");
      expect(markers[0].getAttribute("data-lat")).toBe("10.762622");

      // Marker lấy hàng
      expect(markers[1].getAttribute("data-lng")).toBe("106.7");
      expect(markers[1].getAttribute("data-lat")).toBe("10.775");

      // Marker giao hàng
      expect(markers[2].getAttribute("data-lng")).toBe("106.75");
      expect(markers[2].getAttribute("data-lat")).toBe("10.82");
    });
  });

  describe("CandidateHosTimeline", () => {
    it("khi DTO không có dữ liệu HOS: hiển thị Empty với lý do cụ thể, không vẽ biểu đồ rỗng", async () => {
      const candidateWithoutHos: OptimizationCandidate = {
        ...baseCandidate,
        explanation: {
          ...baseCandidate.explanation,
          hos: null,
        },
      };

      await renderWithI18n(<CandidateHosTimeline candidate={candidateWithoutHos} />);

      expect(screen.getByTestId("candidate-hos-timeline-empty")).toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.getByText(/Chưa có dữ liệu HOS/i)).toBeInTheDocument();
    });

    it("khi DTO có dữ liệu HOS khả thi: hiển thị thanh ngang, mốc cảnh báo 80% và thông tin a11y đầy đủ", async () => {
      await renderWithI18n(<CandidateHosTimeline candidate={baseCandidate} />);

      const timeline = screen.getByTestId("candidate-hos-timeline");
      expect(timeline).toBeInTheDocument();

      // Thanh progressbar có đầy đủ thuộc tính ARIA a11y
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "11");
      expect(progressBar.getAttribute("aria-valuenow")).toBeTruthy();
      expect(progressBar.getAttribute("aria-valuetext")).toContain("USA_PROPERTY_60_7");

      // Mốc cảnh báo 80%
      expect(screen.getByText(/Mốc cảnh báo/i)).toBeInTheDocument();
      expect(screen.getByText(/8\.8h/)).toBeInTheDocument(); // 11h * 0.8 = 8.8h

      // Thông báo trạng thái An toàn
      expect(screen.getByTestId("hos-alert-safe")).toBeInTheDocument();
      expect(screen.getByText(/HOS an toàn/i)).toBeInTheDocument();

      // Có nhãn giờ đã dùng và giờ còn lại
      expect(screen.getAllByText(/Giờ lái đã dùng/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Giờ lái còn lại/i).length).toBeGreaterThan(0);
    });

    it("khi headroom thấp (< 20%): hiển thị cảnh báo (warning)", async () => {
      const warningCandidate: OptimizationCandidate = {
        ...baseCandidate,
        explanation: {
          ...baseCandidate.explanation,
          hos: {
            ...baseCandidate.explanation.hos!,
            value: {
              ...baseCandidate.explanation.hos!.value,
              minimumHosHeadroomRatio: 0.12, // 12% headroom -> cảnh báo
            },
          },
        },
      };

      await renderWithI18n(<CandidateHosTimeline candidate={warningCandidate} />);

      expect(screen.getByTestId("hos-alert-warning")).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo HOS: Sắp hết thời gian lái xe/i)).toBeInTheDocument();
    });

    it("khi vi phạm (infeasible): hiển thị cảnh báo vi phạm (violation)", async () => {
      const violationCandidate: OptimizationCandidate = {
        ...baseCandidate,
        explanation: {
          ...baseCandidate.explanation,
          hos: {
            ...baseCandidate.explanation.hos!,
            value: {
              ...baseCandidate.explanation.hos!.value,
              driveFeasible: false,
              minimumHosHeadroomRatio: 0,
            },
          },
        },
      };

      await renderWithI18n(<CandidateHosTimeline candidate={violationCandidate} />);

      expect(screen.getByTestId("hos-alert-violation")).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo vi phạm HOS/i)).toBeInTheDocument();
    });
  });

  describe("CandidateVisualizations (Lazy Loading)", () => {
    it("tải động (lazy load) cả Timeline HOS và Bản đồ lộ trình", async () => {
      await renderWithI18n(
        <Suspense fallback={<div>Đang tải...</div>}>
          <CandidateVisualizations candidate={candidateWithCoordinates} />
        </Suspense>
      );

      // Chờ cả 2 component lazy load xong
      await waitFor(() => {
        expect(screen.getByTestId("candidate-hos-timeline")).toBeInTheDocument();
        expect(screen.getByTestId("candidate-route-map")).toBeInTheDocument();
      });
    });
  });
});
