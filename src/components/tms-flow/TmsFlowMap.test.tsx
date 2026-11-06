import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TmsFlowMap } from "./TmsFlowMap";

const mockMapInstances: Array<{
  setStyle: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  zoomIn: ReturnType<typeof vi.fn>;
  zoomOut: ReturnType<typeof vi.fn>;
  easeTo: ReturnType<typeof vi.fn>;
  fireLayerClick: (layerId: string) => void;
}> = [];

const mockRouteSetData = vi.fn();
const mockClusterSetData = vi.fn();
const mockSupported = vi.fn(() => true);
const mockMapOptions: Array<{ minZoom?: number; center?: [number, number] }> = [];

vi.mock("mapbox-gl", () => {
  class MockPopup {
    setHTML = vi.fn().mockReturnThis();
  }

  class MockMarker {
    private popup: MockPopup | null = null;
    setLngLat = vi.fn().mockReturnThis();
    setPopup = vi.fn((p: MockPopup) => {
      this.popup = p;
      return this;
    });
    getPopup = vi.fn(() => this.popup);
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class MockMap {
    private sources = new Map<string, { setData: ReturnType<typeof vi.fn>; getClusterExpansionZoom?: (id: number, cb: (error: Error | null, zoom: number) => void) => void }>();
    private layers = new Set<string>();
    private handlers = new Map<string, (...args: unknown[]) => void>();
    setStyle = vi.fn();
    fitBounds = vi.fn();
    easeTo = vi.fn();
    remove = vi.fn();
    resize = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();

    constructor(options?: { minZoom?: number; center?: [number, number] }) {
      mockMapOptions.push(options ?? {});
      mockMapInstances.push(this);
    }

    on(event: string, layerOrCallback: string | ((...args: unknown[]) => void), callback?: (...args: unknown[]) => void) {
      if (event === "load" && typeof layerOrCallback === "function") {
        layerOrCallback();
      } else if (typeof layerOrCallback === "string" && callback) {
        this.handlers.set(`${event}:${layerOrCallback}`, callback);
      }
      return this;
    }

    off() { return this; }

    fireLayerClick(layerId: string) {
      this.handlers.get(`click:${layerId}`)?.({ point: { x: 1, y: 1 } });
    }

    queryRenderedFeatures = vi.fn(() => [{
      properties: { cluster_id: 17, licensePlate: "51A-00017", displayStatus: "available" },
      geometry: { type: "Point", coordinates: [106.8, 10.8] },
    }]);
    getCanvas() { return { style: {} }; }

    getStyle() {
      return {
        layers: [
          { id: "poi-label", type: "symbol" },
          { id: "road-label", type: "symbol" },
        ],
      };
    }

    setLayoutProperty = vi.fn();

    getSource(id: string) {
      return this.sources.get(id);
    }

    addSource(id: string) {
      const setDataFn = id.includes("route") ? mockRouteSetData : mockClusterSetData;
      this.sources.set(id, {
        setData: setDataFn,
        ...(id.includes("cluster")
          ? { getClusterExpansionZoom: (_clusterId, callback) => callback(null, 8) }
          : {}),
      });
    }

    getLayer(id: string) {
      return this.layers.has(id) ? { id } : undefined;
    }

    addLayer(layer: { id: string }) {
      this.layers.add(layer.id);
    }
  }

  return {
    default: {
      accessToken: "",
      supported: () => mockSupported(),
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
    },
  };
});

vi.mock("@/components/dashboard/NetworkRouteMap", () => ({
  NetworkRouteMap: () => <div data-testid="network-route-map" />,
}));

describe("TmsFlowMap route states", () => {
  beforeEach(() => {
    mockMapInstances.length = 0;
    mockMapOptions.length = 0;
    mockRouteSetData.mockClear();
    mockClusterSetData.mockClear();
    mockSupported.mockReturnValue(true);
  });

  it("shows a textual lane and missing-coordinate explanation when no route can be drawn", () => {
    render(
      <TmsFlowMap
        markers={[]}
        routeFallback={{
          origin: "Los Angeles",
          destination: "San Francisco",
          coordinatesAvailable: false,
        }}
      />,
    );

    expect(screen.getByTestId("tms-map-text-route")).toHaveTextContent(
      "Los Angeles → San Francisco",
    );
    expect(
      screen.getByText("Chưa có tọa độ nên chưa vẽ được đường đi"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đường đi tham khảo, không phải đường xe đã chạy"),
    ).toBeInTheDocument();
  });

  it("keeps the reference-route disclaimer and explains routing-service errors", () => {
    render(
      <TmsFlowMap
        isRouteError
        markers={[]}
        routeFallback={{
          origin: "Los Angeles",
          destination: "San Francisco",
          coordinatesAvailable: true,
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Chưa vẽ được đường đi lúc này. Thông tin lô vẫn đúng.",
    );
    expect(
      screen.getByText("Đường đi tham khảo, không phải đường xe đã chạy"),
    ).toBeInTheDocument();
  });

  describe("Mapbox GL JS dispatchMode (MAP-001..006)", () => {
    const sampleLoad1 = {
      id: "load-1",
      number: 1001,
      name: "Lô hàng Điện tử",
      originCity: "TP. Hồ Chí Minh",
      destinationCity: "Biên Hòa",
      originAddress: "KCN Tân Bình, TP.HCM",
      destinationAddress: "KCN Amata, Đồng Nai",
      originLatitude: 10.801,
      originLongitude: 106.625,
      destinationLatitude: 10.95,
      destinationLongitude: 106.85,
      assignedTruckId: "truck-1",
      assignedTruckNumber: "51C-123.45",
    };

    const sampleLoad2 = {
      ...sampleLoad1,
      id: "load-2",
      number: 1002,
      originCity: "Đà Nẵng",
      destinationCity: "Huế",
      originLatitude: 16.0544,
      originLongitude: 108.2022,
      destinationLatitude: 16.4637,
      destinationLongitude: 107.5909,
    };

    it("renders clean fallback text route and notice when Mapbox token is missing or secret (sk.)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <TmsFlowMap
          dispatchMode
          mapboxToken=""
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      expect(screen.getByTestId("mapbox-fallback-notice")).toHaveTextContent(
        "Chưa hiển thị được bản đồ. Thông tin lô vẫn đúng.",
      );
      expect(screen.getByTestId("tms-map-text-route")).toHaveTextContent(
        "▲ TP. Hồ Chí Minh → ◆ Biên Hòa",
      );
      expect(warnSpy).toHaveBeenCalledWith("[TmsFlowMap] Mapbox public token is missing.");
      expect(screen.getByTestId("dispatch-map-fallback-status-banner")).toHaveTextContent(
        "Chưa hiển thị được bản đồ. Thông tin lô vẫn đúng.",
      );
      expect(screen.getByTestId("dispatch-map-fallback-status-banner")).toHaveTextContent(
        "Chưa tính được đường đi lúc này, thử lại sau.",
      );
      expect(screen.getByTestId("tms-map-text-route")).toHaveTextContent(
        "KCN Tân Bình, TP.HCM",
      );
      expect(screen.getByTestId("tms-map-text-route")).toHaveTextContent(
        "KCN Amata, Đồng Nai",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "Quãng đường & thời gian ước tính: —",
      );
      expect(screen.queryByText(/đường thẳng tham khảo/i)).not.toBeInTheDocument();
      expect(screen.getByTestId("mapbox-fallback-notice")).toHaveStyle({ height: "100%" });
      expect(screen.getByTestId("dispatch-map-fallback-status-banner")).toHaveStyle({
        fontSize: "16px",
        textAlign: "center",
      });
      expect(screen.getByTestId("tms-map-text-route")).toHaveStyle({
        fontSize: "16px",
        textAlign: "center",
      });
      warnSpy.mockRestore();
    });

    it("logs an invalid token prefix separately without echoing the token", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const invalidToken = "tk.never-log-this";

      render(
        <TmsFlowMap dispatchMode mapboxToken={invalidToken} markers={[]} selectedLoad={sampleLoad1} />,
      );

      expect(warnSpy).toHaveBeenCalledWith(
        "[TmsFlowMap] Mapbox token has an invalid prefix; a public pk. token is required.",
      );
      expect(warnSpy.mock.calls.flat().join(" ")).not.toContain(invalidToken);
      warnSpy.mockRestore();
    });

    it("renders clean fallback when WebGL is unsupported", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockSupported.mockReturnValue(false);

      render(
        <TmsFlowMap
          dispatchMode
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("mapbox-fallback-notice")).toHaveTextContent(
          "Chưa hiển thị được bản đồ. Thông tin lô vẫn đúng.",
        );
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "[MapboxDispatchMapCanvas] WebGL is unavailable; the map cannot be initialized.",
      );
      expect(screen.queryByText(/đường thẳng tham khảo/i)).not.toBeInTheDocument();
      warnSpy.mockRestore();
    });

    it("prompts user to select a load on the left when no load is selected", () => {
      render(
        <TmsFlowMap
          dispatchMode
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={null}
        />,
      );

      expect(screen.getByTestId("dispatch-map-no-load")).toHaveTextContent(
        "Chọn một lô ở bên trái để xem đường đi.",
      );
    });

    it("explains missing A/B coordinates and partial coordinates clearly", () => {
      const { rerender } = render(
        <TmsFlowMap
          dispatchMode
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={{
            ...sampleLoad1,
            originLatitude: undefined,
            originLongitude: undefined,
            destinationLatitude: undefined,
            destinationLongitude: undefined,
          }}
        />,
      );

      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Chưa có tọa độ điểm lấy/giao cho lô này",
      );
      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Kiểm tra địa chỉ lấy/giao hàng của lô",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "Quãng đường & thời gian ước tính: —",
      );

      rerender(
        <TmsFlowMap
          dispatchMode
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={{
            ...sampleLoad1,
            destinationLatitude: undefined,
            destinationLongitude: undefined,
          }}
        />,
      );

      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Thiếu tọa độ điểm giao hàng (B)",
      );
      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Kiểm tra địa chỉ lấy/giao hàng của lô",
      );
    });

    it("displays straight-line reference notice on Directions error and does not fake driving distance", () => {
      render(
        <TmsFlowMap
          dispatchMode
          isFallbackStraightLine
          isRouteError
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Chưa tính được đường đi lúc này, thử lại sau.",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "Quãng đường & thời gian ước tính: —",
      );
      expect(screen.queryByText(/đường thẳng tham khảo/i)).not.toBeInTheDocument();
    });

    it("reports missing vehicle location or signal-lost vehicle status accurately", () => {
      const { rerender } = render(
        <TmsFlowMap
          dispatchMode
          dispatchVehicles={[]}
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Chưa có vị trí xe cho lô này.",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "Xe phụ trách: 51C-123.45",
      );
      expect(screen.queryByText("Lô này chưa có xe.")).not.toBeInTheDocument();

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60_000).toISOString();
      rerender(
        <TmsFlowMap
          dispatchMode
          dispatchVehicles={[
            {
              id: "truck-1",
              number: "51C-123.45",
              licensePlate: "51C-123.45",
              mainDriverName: "Trần Văn Tài",
              status: "in_use",
              currentLocationLatitude: 10.85,
              currentLocationLongitude: 106.72,
              locationUpdatedAt: thirtyMinsAgo,
            },
          ]}
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "51C-123.45 (Trần Văn Tài)",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent("Mất tín hiệu");
      expect(screen.queryByText("Đang chạy")).not.toBeInTheDocument();
      expect(screen.queryByText("Đang đứng")).not.toBeInTheDocument();
    });

    it("distinguishes no assigned truck, assigned truck without GPS, and an assigned truck with GPS", async () => {
      const unassignedLoad = {
        ...sampleLoad1,
        assignedTruckId: undefined,
        assignedTruckNumber: undefined,
      };
      const { rerender } = render(
        <TmsFlowMap dispatchMode mapboxToken="pk.valid_public_token" markers={[]} selectedLoad={unassignedLoad} />,
      );

      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent("Lô này chưa có xe.");
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent("Xe phụ trách: Chưa có xe");
      expect(screen.queryByText("Chưa có vị trí xe cho lô này.")).not.toBeInTheDocument();

      rerender(
        <TmsFlowMap dispatchMode mapboxToken="pk.valid_public_token" markers={[]} selectedLoad={sampleLoad1} />,
      );
      expect(screen.getByTestId("dispatch-map-status-banner")).toHaveTextContent(
        "Chưa có vị trí xe cho lô này.",
      );
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent(
        "Xe phụ trách: 51C-123.45",
      );

      rerender(
        <TmsFlowMap
          dispatchMode
          dispatchVehicles={[
            {
              id: "truck-1",
              number: "51C-123.45",
              status: "in_use",
              currentLocationLatitude: 10.85,
              currentLocationLongitude: 106.72,
            },
          ]}
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );
      await waitFor(() => expect(screen.queryByTestId("dispatch-map-status-banner")).not.toBeInTheDocument());
      expect(screen.getByTestId("dispatch-map-text-summary")).toHaveTextContent("Đang được sử dụng");
      expect(screen.queryByText("Đang chạy")).not.toBeInTheDocument();
    });

    it("keeps one legend line and a separate route disclaimer", () => {
      render(
        <TmsFlowMap
          dispatchMode
          mapboxToken="pk.valid_public_token"
          markers={[]}
          selectedLoad={sampleLoad1}
        />,
      );

      const legend = screen.getByTestId("dispatch-map-legend");
      expect(legend).toHaveTextContent(
        "▲ A: Điểm lấy hàng · ◆ B: Điểm giao hàng · Xe: vị trí xe hệ thống ghi nhận",
      );
      expect(legend.querySelectorAll(":scope > div")).toHaveLength(1);
      expect(legend).toHaveTextContent("Đường đi tham khảo, không phải đường xe đã chạy");
    });

    it("initializes only ONE Map instance when switching loads, updates via setData/fitBounds, and calls map.remove() on unmount", async () => {
      const { rerender, unmount } = render(
        <TmsFlowMap
          dispatchMode
          distanceMeters={128000}
          durationSeconds={7800}
          mapboxToken="pk.valid_public_token"
          markers={[]}
          routeCoordinates={[
            [106.625, 10.801],
            [106.85, 10.95],
          ]}
          selectedLoad={sampleLoad1}
        />,
      );

      await waitFor(() => {
        expect(mockMapInstances).toHaveLength(1);
      });

      const mapInstance = mockMapInstances[0];
      expect(mockRouteSetData).toHaveBeenCalledTimes(1);
      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);

      // Switch to load 2 — must NOT recreate mapboxgl.Map
      rerender(
        <TmsFlowMap
          dispatchMode
          distanceMeters={98000}
          durationSeconds={5400}
          mapboxToken="pk.valid_public_token"
          markers={[]}
          routeCoordinates={[
            [108.2022, 16.0544],
            [107.5909, 16.4637],
          ]}
          selectedLoad={sampleLoad2}
        />,
      );

      await waitFor(() => {
        expect(mockRouteSetData).toHaveBeenCalledTimes(2);
      });
      expect(mockMapInstances).toHaveLength(1);
      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(2);

      unmount();
      expect(mapInstance.remove).toHaveBeenCalledTimes(1);
    });

    it("clusters a 120-vehicle overview and prevents a world-scale zoom", async () => {
      const vehicles = Array.from({ length: 120 }, (_, index) => ({
        id: `truck-${index}`,
        number: `TRK-${index}`,
        licensePlate: `51A-${index}`,
        status: "available",
        currentLocationLatitude: 10.7 + index * 0.001,
        currentLocationLongitude: 106.5 + index * 0.001,
      }));

      render(
        <TmsFlowMap
          dispatchMode
          overviewMode
          dispatchVehicles={vehicles}
          mapboxToken="pk.valid_public_token"
          markers={[]}
        />,
      );

      await waitFor(() => {
        const latestData = mockClusterSetData.mock.calls.at(-1)?.[0] as GeoJSON.FeatureCollection<GeoJSON.Point> | undefined;
        expect(latestData?.features).toHaveLength(120);
      });
      const mapInstance = mockMapInstances[0];
      mapInstance.fireLayerClick("dispatch-vehicles-cluster-circle");
      expect(mapInstance.easeTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [106.8, 10.8],
        zoom: 8,
      }));
      expect(mockMapOptions[0]?.minZoom).toBe(4);
      expect(mockMapOptions[0]?.center).toEqual([106.660172, 10.762622]);
    });
  });
});
