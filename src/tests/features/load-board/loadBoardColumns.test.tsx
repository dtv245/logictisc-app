/**
 * Unit & Integration Tests cho loadBoardColumns sau khi chuẩn hóa UI:
 * - externalListingId dạng Link tới /load-board/show/:id
 * - originAddress & destinationAddress: ellipsis + Tooltip, hiển thị "—" khi null
 * - totalRate & ratePerMile: format tiền tệ, align right, tabular-nums
 * - status: bọc trong StatusTag với statusMap tương ứng
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
import { useLocalizedColumns } from "@hooks/useLocalizedColumns";
import { loadBoardColumns } from "@features/load-board/components/columns";
import type { LoadBoardListing } from "@/types/load-board.types";

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
              name: "load-board",
              list: "/load-board",
              show: "/load-board/show/:id",
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

const LoadBoardTableHarness = ({ data }: { data: LoadBoardListing[] }) => {
  const columns = useLocalizedColumns(loadBoardColumns);
  return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
};

describe("loadBoardColumns — Chuẩn hóa UI bảng Sàn tải hàng (Load Board)", () => {
  const sampleListing: LoadBoardListing = {
    id: "lb-001",
    externalListingId: "DAT-9988",
    providerType: "dat",
    originAddress: {
      line1: "100 Lê Lợi",
      city: "Hà Nội",
      state: "HN",
      country: "VN",
      zipCode: "100000",
    },
    originLocation: { latitude: 21.0285, longitude: 105.8542 },
    destinationAddress: {
      line1: "200 Nguyễn Huệ",
      city: "TP Hồ Chí Minh",
      state: "HCM",
      country: "VN",
      zipCode: "700000",
    },
    destinationLocation: { latitude: 10.7769, longitude: 106.7009 },
    totalRate: { amount: 15000000, currency: "VND" },
    ratePerMile: 25000,
    equipmentType: "dry_van",
    status: "available",
    expiresAt: "2026-10-20T12:00:00Z",
    createdAt: "2026-10-10T00:00:00Z",
    lastModifiedAt: "2026-10-10T00:00:00Z",
  };

  it("cột externalListingId render Link tới trang chi tiết với class table-number-link", () => {
    renderWithProviders(<LoadBoardTableHarness data={[sampleListing]} />);

    const link = screen.getByRole("link", { name: "DAT-9988" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/load-board/show/lb-001");
  });

  it("cột nguồn và đích hiển thị đầy đủ địa chỉ với class table-cell-ellipsis", () => {
    const { container } = renderWithProviders(<LoadBoardTableHarness data={[sampleListing]} />);

    expect(screen.getByText(/100 Lê Lợi, Hà Nội, HN, VN/)).toBeInTheDocument();
    expect(screen.getByText(/200 Nguyễn Huệ, TP Hồ Chí Minh, HCM, VN/)).toBeInTheDocument();

    const ellipses = container.querySelectorAll(".table-cell-ellipsis");
    expect(ellipses.length).toBeGreaterThanOrEqual(2);
  });

  it("cột giá cước và cước đề xuất được format tiền tệ và dùng tabular-nums", () => {
    const { container } = renderWithProviders(<LoadBoardTableHarness data={[sampleListing]} />);

    // totalRate 15.000.000 VND
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument();
    // ratePerMile 25.000 VND
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();

    const tabularElements = container.querySelectorAll(".tabular-nums");
    expect(tabularElements.length).toBeGreaterThanOrEqual(2);
  });

  it("cột status bọc trong StatusTag với màu ngữ nghĩa chính xác theo statusMap", () => {
    const bookedListing: LoadBoardListing = {
      ...sampleListing,
      id: "lb-002",
      status: "booked",
    };
    const expiredListing: LoadBoardListing = {
      ...sampleListing,
      id: "lb-003",
      status: "expired",
    };

    const { rerender } = renderWithProviders(<LoadBoardTableHarness data={[sampleListing]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sẵn sàng");

    rerender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Refine dataProvider={mockDataProvider}>
            <I18nextProvider i18n={i18nInstance}>
              <AntdApp>
                <LoadBoardTableHarness data={[bookedListing]} />
              </AntdApp>
            </I18nextProvider>
          </Refine>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Đã đặt");

    rerender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Refine dataProvider={mockDataProvider}>
            <I18nextProvider i18n={i18nInstance}>
              <AntdApp>
                <LoadBoardTableHarness data={[expiredListing]} />
              </AntdApp>
            </I18nextProvider>
          </Refine>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Đã hết hạn");
  });

  it("dữ liệu rỗng / null hiển thị '—' với class table-cell-empty", () => {
    const emptyListing: LoadBoardListing = {
      id: "lb-null",
      externalListingId: "DAT-EMPTY",
      providerType: "dat",
      originAddress: null as unknown as LoadBoardListing["originAddress"],
      destinationAddress: null as unknown as LoadBoardListing["destinationAddress"],
      originLocation: { latitude: 0, longitude: 0 },
      destinationLocation: { latitude: 0, longitude: 0 },
      totalRate: null,
      ratePerMile: null,
      equipmentType: null,
      status: "available",
      expiresAt: "",
      createdAt: "",
      lastModifiedAt: "",
    };

    const { container } = renderWithProviders(<LoadBoardTableHarness data={[emptyListing]} />);

    const emptyElements = container.querySelectorAll(".table-cell-empty");
    expect(emptyElements.length).toBeGreaterThanOrEqual(4);
  });
});
