import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type DataProvider } from "@refinedev/core";
import { App as AntdApp, Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import {
  accidentColumns,
  accidentSeverityMap,
  accidentStatusMap,
} from "@features/accidents/components/columns";
import type { AccidentReport } from "@/types/accident.types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

let i18nInstance: I18nInstance;

const mockDataProvider: DataProvider = {
  create: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["create"],
  deleteOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["deleteOne"],
  getApiUrl: () => "http://localhost:8080",
  getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
  getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
  getOne: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["getOne"],
  update: vi.fn(async () => ({ data: { id: "1" } })) as unknown as DataProvider["update"],
};

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderWithProviders = (node: ReactNode) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Refine
          dataProvider={mockDataProvider}
          resources={[
            {
              name: "accidents",
              list: "/accidents",
              show: "/accidents/show/:id",
              edit: "/accidents/edit/:id",
            },
          ]}
        >
          <I18nextProvider i18n={i18nInstance}>
            <AntdApp>{node}</AntdApp>
          </I18nextProvider>
        </Refine>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("accidentColumns — Chuẩn hóa UI Accidents List theo chuẩn Trucks", () => {
  const TableHarness = ({ data }: { data: AccidentReport[] }) => {
    const columns = useLocalizedColumns(accidentColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const createSampleAccident = (overrides?: Partial<AccidentReport>): AccidentReport => ({
    id: "acc-101",
    driverId: "drv-01",
    truckId: "trk-01",
    accidentDateTime: "2026-10-12T08:30:00Z",
    accidentType: "collision",
    severity: "minor",
    status: "submitted",
    location: { latitude: 21.0285, longitude: 105.8542 },
    anyInjuries: false,
    vehicleDamaged: false,
    vehicleDrivable: true,
    policeReportFiled: false,
    insuranceNotified: false,
    createdAt: "2026-10-12T08:30:00Z",
    ...overrides,
  });

  it("cột accidentDateTime render router Link tới /accidents/show/:id với class table-number-link và tabular-nums", () => {
    const sample = createSampleAccident({ id: "acc-999" });
    renderWithProviders(<TableHarness data={[sample]} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/accidents/show/acc-999");
    expect(link.querySelector(".tabular-nums")).toBeInTheDocument();
  });

  it("cột accidentDateTime hiển thị '—' khi giá trị null hoặc rỗng", () => {
    const emptyRecord = createSampleAccident({
      id: "acc-empty",
      accidentDateTime: "",
    });
    renderWithProviders(<TableHarness data={[emptyRecord]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("cột accidentType dịch chuẩn tiếng Việt qua options: true", () => {
    const records = [
      createSampleAccident({ id: "acc-1", accidentType: "collision" }),
      createSampleAccident({ id: "acc-2", accidentType: "rollover" }),
      createSampleAccident({ id: "acc-3", accidentType: "cargo_damage" }),
    ];
    renderWithProviders(<TableHarness data={records} />);

    expect(screen.getByText("Va chạm")).toBeInTheDocument();
    expect(screen.getByText("Lật xe")).toBeInTheDocument();
    expect(screen.getByText("Hư hỏng hàng hóa")).toBeInTheDocument();
  });

  it("cột severity map chính xác: minor (vàng nhạt WCAG AA), moderate (warning), severe/serious (error)", () => {
    expect(accidentSeverityMap.minor).toBeDefined();
    expect(accidentSeverityMap.moderate).toBe("warning");
    expect(accidentSeverityMap.severe).toBe("error");

    const records = [
      createSampleAccident({ id: "acc-minor", severity: "minor" }),
      createSampleAccident({ id: "acc-mod", severity: "moderate" }),
      createSampleAccident({ id: "acc-sev", severity: "serious" }),
    ];
    renderWithProviders(<TableHarness data={records} />);

    // Nhãn tiếng Việt
    const minorTag = screen.getByText("Nhẹ").closest(".status-tag");
    expect(minorTag).toBeInTheDocument();
    // minor áp dụng custom style vàng nhạt
    expect(minorTag).toHaveStyle({ color: "#854d0e" });

    const moderateTag = screen.getByText("Trung bình").closest(".status-tag");
    expect(moderateTag).toBeInTheDocument();
    expect(moderateTag).toHaveClass("status-tag--warning");

    const severeTag = screen.getByText("Nghiêm trọng").closest(".status-tag");
    expect(severeTag).toBeInTheDocument();
    expect(severeTag).toHaveClass("status-tag--error");
  });

  it("cột status map chính xác: draft (neutral), submitted (processing), under_review (warning), closed (success)", () => {
    expect(accidentStatusMap.draft).toBe("neutral");
    expect(accidentStatusMap.closed).toBe("success");

    const records = [
      createSampleAccident({ id: "s-draft", status: "draft" }),
      createSampleAccident({ id: "s-sub", status: "submitted" }),
      createSampleAccident({ id: "s-rev", status: "under_review" }),
      createSampleAccident({ id: "s-cls", status: "closed" }),
    ];
    renderWithProviders(<TableHarness data={records} />);

    const draftTag = screen.getByText("Nháp").closest(".status-tag");
    expect(draftTag).toHaveClass("status-tag--neutral");

    const submittedTag = screen.getByText("Đã gửi").closest(".status-tag");
    expect(submittedTag).toHaveClass("status-tag--processing");

    const reviewTag = screen.getByText("Đang xem xét").closest(".status-tag");
    expect(reviewTag).toHaveClass("status-tag--warning");

    const closedTag = screen.getByText("Đã đóng").closest(".status-tag");
    expect(closedTag).toHaveClass("status-tag--success");
  });

  it("cột actions cố định bên phải với width 130px", () => {
    const actionsCol = accidentColumns.find((c) => c.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
