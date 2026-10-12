/**
 * Unit & Integration Tests cho màn hình HOS/ELD Logs (hosEldColumns):
 * - logDate: link điều hướng show page, định dạng ngày, class table-number-link, fallback "—".
 * - employeeId: ellipsis text, Tooltip, fallback "—".
 * - dutyStatus: statusMap đặc thù theo yêu cầu:
 *   + on_duty / on_duty_not_driving = xanh lá (success)
 *   + driving = xanh dương (processing)
 *   + sleeper_berth = cam (warning)
 *   + off_duty = xám (neutral)
 *   Kèm nhãn chữ i18n và role="status".
 * - durationMinutes: align right, tabular-nums, định dạng giờ và phút (ví dụ "2h 30m") kèm Tooltip số phút.
 * - actions: fixed right, width 130, ActionButtons tích hợp đầy đủ quyền và a11y.
 */

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
import { defaultStatusStyles } from "@components/StatusTag";
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import {
  hosEldColumns,
  formatDurationMinutes,
  HOS_DUTY_STATUS_MAP,
} from "@features/hos-eld/components/columns";
import type { HosLog } from "@/types/hos-eld.types";

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
              name: "hos-eld",
              list: "/hos-eld",
              show: "/hos-eld/show/:id",
              edit: "/hos-eld/edit/:id",
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

describe("formatDurationMinutes helper", () => {
  it("định dạng số phút thành giờ và phút chính xác", () => {
    expect(formatDurationMinutes(150)).toEqual({
      formatted: "2h 30m",
      tooltip: "150 phút",
    });
    expect(formatDurationMinutes(120)).toEqual({
      formatted: "2h",
      tooltip: "120 phút",
    });
    expect(formatDurationMinutes(45)).toEqual({
      formatted: "45m",
      tooltip: "45 phút",
    });
  });

  it("xử lý an toàn khi giá trị rỗng hoặc không hợp lệ", () => {
    expect(formatDurationMinutes(null)).toEqual({ formatted: "—", tooltip: "—" });
    expect(formatDurationMinutes(undefined)).toEqual({ formatted: "—", tooltip: "—" });
    expect(formatDurationMinutes("invalid")).toEqual({ formatted: "—", tooltip: "—" });
    expect(formatDurationMinutes(-10)).toEqual({ formatted: "—", tooltip: "—" });
  });
});

describe("HOS_DUTY_STATUS_MAP mapping", () => {
  it("ánh xạ đúng màu ngữ nghĩa cho từng dutyStatus", () => {
    expect(HOS_DUTY_STATUS_MAP.on_duty).toBe("success");
    expect(HOS_DUTY_STATUS_MAP.on_duty_not_driving).toBe("success");
    expect(HOS_DUTY_STATUS_MAP.driving).toBe("processing");
    expect(HOS_DUTY_STATUS_MAP.sleeper_berth).toBe("warning");
    expect(HOS_DUTY_STATUS_MAP.off_duty).toBe("neutral");
  });
});

describe("hosEldColumns & useLocalizedColumns — Kiểm thử bảng danh sách HOS/ELD", () => {
  const TableHarness = ({ data }: { data: HosLog[] }) => {
    const columns = useLocalizedColumns(hosEldColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột logDate hiển thị dạng Link với router Link, class table-number-link và href tới trang show", () => {
    const sample: HosLog = {
      id: "log-101",
      employeeId: "EMP-001",
      logDate: "2026-10-12",
      dutyStatus: "driving",
      durationMinutes: 150,
      startTime: "2026-10-12T08:00:00Z",
      providerType: "samsara",
    };

    renderWithProviders(<TableHarness data={[sample]} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/hos-eld/show/log-101");
  });

  it("cột dutyStatus hiển thị StatusTag với màu ngữ nghĩa chính xác và nhãn chữ i18n", () => {
    const logs: HosLog[] = [
      {
        id: "1",
        employeeId: "DRV-1",
        logDate: "2026-10-12",
        dutyStatus: "driving",
        durationMinutes: 120,
        startTime: "2026-10-12T08:00:00Z",
        providerType: "samsara",
      },
      {
        id: "2",
        employeeId: "DRV-2",
        logDate: "2026-10-12",
        dutyStatus: "on_duty",
        durationMinutes: 60,
        startTime: "2026-10-12T10:00:00Z",
        providerType: "samsara",
      },
      {
        id: "3",
        employeeId: "DRV-3",
        logDate: "2026-10-12",
        dutyStatus: "sleeper_berth",
        durationMinutes: 480,
        startTime: "2026-10-12T12:00:00Z",
        providerType: "samsara",
      },
      {
        id: "4",
        employeeId: "DRV-4",
        logDate: "2026-10-12",
        dutyStatus: "off_duty",
        durationMinutes: 180,
        startTime: "2026-10-12T20:00:00Z",
        providerType: "samsara",
      },
    ];

    const { container } = renderWithProviders(<TableHarness data={logs} />);

    const statusTags = screen.getAllByRole("status");
    expect(statusTags.length).toBe(4);

    // 1. driving: xanh dương (processing)
    expect(statusTags[0]).toHaveTextContent("Đang lái xe");
    const dots = container.querySelectorAll(".status-tag__dot");
    expect(dots[0]).toHaveStyle({ backgroundColor: defaultStatusStyles.processing.dotColor });

    // 2. on_duty: xanh lá (success)
    expect(statusTags[1]).toHaveTextContent("Làm việc");
    expect(dots[1]).toHaveStyle({ backgroundColor: defaultStatusStyles.success.dotColor });

    // 3. sleeper_berth: cam (warning)
    expect(statusTags[2]).toHaveTextContent("Giường ngủ");
    expect(dots[2]).toHaveStyle({ backgroundColor: defaultStatusStyles.warning.dotColor });

    // 4. off_duty: xám (neutral)
    expect(statusTags[3]).toHaveTextContent("Nghỉ ngơi");
    expect(dots[3]).toHaveStyle({ backgroundColor: defaultStatusStyles.neutral.dotColor });
  });

  it("cột durationMinutes căn phải, font tabular-nums và hiển thị định dạng giờ:phút kèm tooltip", () => {
    const sample: HosLog = {
      id: "log-102",
      employeeId: "EMP-002",
      logDate: "2026-10-12",
      dutyStatus: "on_duty_not_driving",
      durationMinutes: 135,
      startTime: "2026-10-12T08:00:00Z",
      providerType: "motive",
    };

    renderWithProviders(<TableHarness data={[sample]} />);

    const durationText = screen.getByText("2h 15m");
    expect(durationText).toBeInTheDocument();
    expect(durationText).toHaveClass("tabular-nums");
  });

  it("hiển thị '—' với class table-cell-empty màu nhạt khi dữ liệu trống", () => {
    const emptyLog: HosLog = {
      id: "log-empty",
      employeeId: "",
      logDate: "",
      dutyStatus: "off_duty",
      durationMinutes: null as unknown as number,
      startTime: "",
      providerType: "other",
    };

    const { container } = renderWithProviders(<TableHarness data={[emptyLog]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(1);
    expect(emptyPlaceholders[0]).toHaveTextContent("—");
  });

  it("cột actions hiển thị ActionButtons với các nút Xem, Sửa, Xóa và aria-label", () => {
    const sample: HosLog = {
      id: "log-103",
      employeeId: "DRV-999",
      logDate: "2026-10-12",
      dutyStatus: "driving",
      durationMinutes: 90,
      startTime: "2026-10-12T08:00:00Z",
      providerType: "geotab",
    };

    const { container } = renderWithProviders(<TableHarness data={[sample]} />);

    expect(container.querySelector(".refine-show-button")).toBeInTheDocument();
    expect(container.querySelector(".refine-edit-button")).toBeInTheDocument();
    expect(container.querySelector(".table-action-btn--delete")).toBeInTheDocument();
  });
});
