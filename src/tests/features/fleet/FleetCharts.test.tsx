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

  it("shows both independent backend mileage ratios when both are available", () => {
    // These ratios have separate denominators and must not be presented as donut slices.
    renderCharts(fleetReport);
    expect(screen.getByText("Tỷ lệ dặm có hàng và dặm rỗng")).toBeInTheDocument();
    expect(screen.getByTestId("fleet-loaded-miles-ratio")).toHaveTextContent(/70[,.]00%/);
    expect(screen.getByTestId("fleet-empty-miles-ratio")).toHaveTextContent(/25[,.]00%/);
  });

  it("does not render mileage ratios when loaded-mile data is unavailable", () => {
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
    expect(screen.queryByText("Tỷ lệ dặm có hàng và dặm rỗng")).not.toBeInTheDocument();
  });

  it("does not derive empty mileage from loaded mileage when its backend ratio is unavailable", () => {
    const reportWithoutDeadhead: FleetReport = {
      ...fleetReport,
      deadheadPercent: {
        code: "DEADHEAD_PERCENT",
        value: null,
        unit: "PERCENT",
        numerator: null,
        denominator: null,
        availability: "UNAVAILABLE",
        basis: null,
        reason: "ACTUAL_MILEAGE_HISTORY_UNAVAILABLE",
      },
    };

    renderCharts(reportWithoutDeadhead);
    expect(screen.queryByText("Tỷ lệ dặm có hàng và dặm rỗng")).not.toBeInTheDocument();
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
