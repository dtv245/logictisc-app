import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VehicleTrackingMap } from "@features/operations/components/VehicleTrackingMap";

describe("VehicleTrackingMap", () => {
  it("initializes Leaflet for a valid last-known vehicle position", async () => {
    const { container, unmount } = render(
      <VehicleTrackingMap
        inaccessibleText=""
        isLoading={false}
        loadErrorText="map-error"
        mapLabel="vehicle-map"
        noLocationText="no-location"
        points={[
          {
            id: "truck-1",
            label: "51C-123.45",
            latitude: 10.7769,
            longitude: 106.7009,
            status: "available",
          },
        ]}
        statusLabel={(status) => status}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector(".leaflet-pane")).toBeInTheDocument();
    });
    expect(screen.getByRole("region", { name: "vehicle-map" })).toBeInTheDocument();

    unmount();
  });

  it("shows the permission state without initializing a fake map", () => {
    const { container } = render(
      <VehicleTrackingMap
        inaccessibleText="permission-required"
        isLoading={false}
        loadErrorText="map-error"
        mapLabel="vehicle-map"
        noLocationText="no-location"
        points={[]}
        statusLabel={(status) => status}
      />,
    );

    expect(screen.getByText("permission-required")).toBeInTheDocument();
    expect(container.querySelector(".leaflet-container")).not.toBeInTheDocument();
  });
});

