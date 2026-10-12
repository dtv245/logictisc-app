import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfigProvider } from "antd";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import {
  FleetHealthTable,
  formatSecondsToHoursMinutes,
} from "@/features/fleet/FleetHealthTable";
import type { FleetCoverage } from "@/types/fleetReport.dto";
import { viMessages } from "@/locales";

// Initialize i18n instance for testing
const testI18n = i18n.createInstance();
testI18n.init({
  lng: "vi",
  resources: { vi: { translation: viMessages } },
  interpolation: { escapeValue: false },
});

const sampleCoverage: FleetCoverage[] = [
  {
    truckId: "truck-uuid-1",
    licensePlate: "29C-12345",
    scopeSeconds: "86400",
    membershipSeconds: "86400",
    capacitySeconds: "36000",
    productiveSeconds: "28800",
    gapSeconds: "0",
    conflictSeconds: "0",
    eventCount: 5,
  },
  {
    truckId: "truck-uuid-2",
    licensePlate: "51D-67890",
    scopeSeconds: "86400",
    membershipSeconds: "86400",
    capacitySeconds: "28800",
    productiveSeconds: "14400",
    gapSeconds: "7200",
    conflictSeconds: "0",
    eventCount: 3,
  },
  {
    truckId: "truck-uuid-3",
    // No licensePlate directly on record
    scopeSeconds: "86400",
    membershipSeconds: "86400",
    capacitySeconds: "28800",
    productiveSeconds: "10800",
    gapSeconds: "0",
    conflictSeconds: "3600",
    eventCount: 4,
  },
];

function renderTable(
  coverage = sampleCoverage,
  truckMap?: Record<string, string>,
) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <ConfigProvider theme={{ token: { motion: false } }}>
        <FleetHealthTable coverage={coverage} truckMap={truckMap} />
      </ConfigProvider>
    </I18nextProvider>,
  );
}

describe("FleetHealthTable", () => {
  describe("formatSecondsToHoursMinutes helper", () => {
    it("formats seconds to 'x giờ y phút' accurately", () => {
      const t = testI18n.t.bind(testI18n);

      expect(formatSecondsToHoursMinutes("86400", t)).toEqual({
        formatted: "24 giờ 0 phút",
        rawSeconds: "86400s",
      });

      expect(formatSecondsToHoursMinutes("3660", t)).toEqual({
        formatted: "1 giờ 1 phút",
        rawSeconds: "3660s",
      });

      expect(formatSecondsToHoursMinutes("0", t)).toEqual({
        formatted: "0 giờ 0 phút",
        rawSeconds: "0s",
      });

      expect(formatSecondsToHoursMinutes(null, t)).toEqual({
        formatted: "—",
        rawSeconds: "—",
      });
    });
  });

  describe("Vehicle license plate column", () => {
    it("displays licensePlate instead of truckId when available", () => {
      renderTable();
      expect(screen.getByText("29C-12345")).toBeInTheDocument();
      expect(screen.getByText("51D-67890")).toBeInTheDocument();
    });

    it("uses truckMap lookup if record lacks licensePlate", () => {
      renderTable(sampleCoverage, { "truck-uuid-3": "43A-99999" });
      expect(screen.getByText("43A-99999")).toBeInTheDocument();
    });

    it("falls back to truckId when license plate is not provided", () => {
      renderTable();
      expect(screen.getByText("truck-uuid-3")).toBeInTheDocument();
    });
  });

  describe("Duration formatting and tabular-nums", () => {
    it("renders seconds formatted as 'x giờ y phút'", () => {
      renderTable();
      // 86400 seconds = 24 giờ 0 phút
      const cells = screen.getAllByText("24 giờ 0 phút");
      expect(cells.length).toBeGreaterThan(0);
      // Verify tabular-nums style is applied
      expect(cells[0]).toHaveStyle({ fontVariantNumeric: "tabular-nums" });
    });

    it("renders eventCount correctly", () => {
      renderTable();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });

  describe("Warning & Error tags with text labels", () => {
    it("displays warning tag 'Thiếu dữ liệu' when gapSeconds > 0", () => {
      renderTable();
      const warningTags = screen.getAllByText("Thiếu dữ liệu");
      expect(warningTags.length).toBe(1);
    });

    it("displays error tag 'Xung đột thời gian' when conflictSeconds > 0", () => {
      renderTable();
      const conflictTags = screen.getAllByText("Xung đột thời gian");
      expect(conflictTags.length).toBe(1);
    });

    it("does not display tags for vehicles without gap or conflict", () => {
      const cleanCoverage: FleetCoverage[] = [
        {
          truckId: "clean-truck",
          licensePlate: "29C-CLEAN",
          scopeSeconds: "86400",
          membershipSeconds: "86400",
          capacitySeconds: "36000",
          productiveSeconds: "28800",
          gapSeconds: "0",
          conflictSeconds: "0",
          eventCount: 2,
        },
      ];
      renderTable(cleanCoverage);
      expect(screen.queryByText("Thiếu dữ liệu")).not.toBeInTheDocument();
      expect(screen.queryByText("Xung đột thời gian")).not.toBeInTheDocument();
    });
  });

  describe("Filtering by gap/conflict", () => {
    it("filters only vehicles with gap or conflict when toggle is enabled", () => {
      renderTable();
      // Initially all 3 vehicles are shown
      expect(screen.getByText("29C-12345")).toBeInTheDocument();
      expect(screen.getByText("51D-67890")).toBeInTheDocument();
      expect(screen.getByText("truck-uuid-3")).toBeInTheDocument();

      // Click filter switch "Chỉ xe có gap/conflict"
      const toggle = screen.getByRole("switch", { name: "Chỉ xe có gap/conflict" });
      fireEvent.click(toggle);

      // 29C-12345 has gap=0 and conflict=0, so it should be filtered out
      expect(screen.queryByText("29C-12345")).not.toBeInTheDocument();
      // 51D-67890 (gap=7200) and truck-uuid-3 (conflict=3600) should remain
      expect(screen.getByText("51D-67890")).toBeInTheDocument();
      expect(screen.getByText("truck-uuid-3")).toBeInTheDocument();

      // Badge showing 2/3 xe
      expect(screen.getByText("2/3 xe")).toBeInTheDocument();

      // Toggle off to restore all vehicles
      fireEvent.click(toggle);
      expect(screen.getByText("29C-12345")).toBeInTheDocument();
    });
  });
});
