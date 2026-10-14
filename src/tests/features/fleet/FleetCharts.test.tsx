import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigProvider } from "antd";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import type { ReactNode } from "react";
import { FleetCharts } from "@/features/fleet/components/FleetCharts";
import { fleetReport } from "@/tests/fixtures/fleet";
import { viMessages } from "@/locales";
import type { FleetReport } from "@/types/fleetReport.dto";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  const React = await import("react");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div className="recharts-responsive-container-mock" style={{ width: 500, height: 300 }}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, {
              width: 500,
              height: 300,
            })
          : children}
      </div>
    ),
  };
});

const testI18n = i18n.createInstance();
testI18n.init({
  lng: "vi",
  resources: { vi: { translation: viMessages } },
  interpolation: { escapeValue: false },
});

function renderCharts(report: FleetReport = fleetReport, truckMap?: Record<string, string>) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <ConfigProvider theme={{ token: { motion: false } }}>
        <FleetCharts report={report} truckMap={truckMap} />
      </ConfigProvider>
    </I18nextProvider>,
  );
}

describe("FleetCharts", () => {
  it("renders horizontal bar chart for vehicle % utilization", () => {
    renderCharts(fleetReport, { [fleetReport.coverage[0]!.truckId]: "29C-88888" });
    expect(screen.getByText("Biểu đồ trực quan")).toBeInTheDocument();
    expect(screen.getByText("% Mức sử dụng theo xe")).toBeInTheDocument();
    expect(screen.getAllByText("29C-88888").length).toBeGreaterThan(0);
  });

  it("renders loaded vs empty miles donut chart when real mileage data exists", () => {
    // fleetReport fixture has loadedMilesPercent = 70.00 (AVAILABLE)
    renderCharts(fleetReport);
    expect(screen.getByText("Dặm có hàng vs dặm rỗng")).toBeInTheDocument();
    expect(screen.getByText("70.00%")).toBeInTheDocument();
  });

  it("does not render donut chart when mileage data is unavailable", () => {
    const reportWithoutMileage: FleetReport = {
      ...fleetReport,
      loadedMilesPercent: {
        code: "LOADED_MILES_PERCENT",
        value: null,
        unit: "PERCENT",
        numerator: null,
        denominator: null,
        availability: "UNAVAILABLE",
        basis: null,
        reason: "ACTUAL_MILEAGE_HISTORY_UNAVAILABLE",
      },
    };
    renderCharts(reportWithoutMileage);
    expect(screen.queryByText("Dặm có hàng vs dặm rỗng")).not.toBeInTheDocument();
  });

  it("renders Gantt notice listing missing API fields and displays status legend", () => {
    renderCharts(fleetReport);
    expect(screen.getByText("Tiến độ hoạt động theo xe (Gantt)")).toBeInTheDocument();
    expect(
      screen.getByText(/API GET \/api\/reports\/fleet\/utilization-history chưa trả về danh sách các khoảng thời gian sự kiện chi tiết/),
    ).toBeInTheDocument();
    expect(screen.getByText("Các trường còn thiếu từ API:")).toBeInTheDocument();

    // Check legend items with text labels
    expect(screen.getByText("Chú thích trạng thái:")).toBeInTheDocument();
    expect(screen.getByText("Hoạt động (Productive)")).toBeInTheDocument();
    expect(screen.getByText("Không hoạt động (Non-productive)")).toBeInTheDocument();
    expect(screen.getByText("Loại trừ (Excluded)")).toBeInTheDocument();
    expect(screen.getByText("Thiếu dữ liệu (Gap)")).toBeInTheDocument();
    expect(screen.getByText("Xung đột (Conflict)")).toBeInTheDocument();
  });
});
