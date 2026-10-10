import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TripMileageSummary } from "@/features/trips/TripMileageSummary";

describe("TripMileageSummary", () => {
  it("renders 4 separate mileage metrics with formatted values when provided", () => {
    render(
      <TripMileageSummary
        plannedDistanceMiles={500.5}
        actualDistanceMiles={520.25}
        loadedMiles={480}
        emptyMiles={40.25}
      />,
    );

    expect(screen.getByTestId("mileage-planned")).toHaveTextContent("500.5 mi");
    expect(screen.getByTestId("mileage-actual")).toHaveTextContent("520.25 mi");
    expect(screen.getByTestId("mileage-loaded")).toHaveTextContent("480 mi");
    expect(screen.getByTestId("mileage-empty")).toHaveTextContent("40.25 mi");
  });

  it("displays N/A and does NOT convert null or undefined mileage to 0", () => {
    render(
      <TripMileageSummary
        plannedDistanceMiles={null}
        actualDistanceMiles={undefined}
        loadedMiles={null}
        emptyMiles={undefined}
      />,
    );

    const planned = screen.getByTestId("mileage-planned");
    const actual = screen.getByTestId("mileage-actual");
    const loaded = screen.getByTestId("mileage-loaded");
    const empty = screen.getByTestId("mileage-empty");

    expect(planned).toHaveTextContent("N/A");
    expect(planned).not.toHaveTextContent("0 mi");

    expect(actual).toHaveTextContent("N/A");
    expect(actual).not.toHaveTextContent("0 mi");

    expect(loaded).toHaveTextContent("N/A");
    expect(loaded).not.toHaveTextContent("0 mi");

    expect(empty).toHaveTextContent("N/A");
    expect(empty).not.toHaveTextContent("0 mi");
  });

  it("renders legacy route distance separately without relabeling it as actual distance", () => {
    render(
      <TripMileageSummary
        actualDistanceMiles={null}
        legacyTotalDistance={450}
      />,
    );

    // Actual distance is unavailable
    expect(screen.getByTestId("mileage-actual")).toHaveTextContent("N/A");

    // Legacy distance is rendered separately
    expect(screen.getByText(/450 mi/)).toBeInTheDocument();
  });
});
