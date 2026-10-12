import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type DataProvider } from "@refinedev/core";
import { Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import { terminalColumns, formatTerminalAddress } from "@features/terminals/components/columns";
import type { Terminal } from "@/types/terminal.types";

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
    <I18nextProvider i18n={i18nInstance}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Refine
            dataProvider={mockDataProvider}
            resources={[
              {
                name: "terminals",
                list: "/terminals",
                show: "/terminals/show/:id",
                edit: "/terminals/edit/:id",
              },
            ]}
          >
            {node}
          </Refine>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );
};

describe("terminalColumns — Chuẩn hóa UI & UX", () => {
  const TableHarness = ({ data }: { data: Terminal[] }) => {
    const columns = useLocalizedColumns(terminalColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  const sampleTerminal: Terminal = {
    id: "term-1",
    code: "SGN01",
    name: "Cảng Cát Lái",
    type: "SEA_PORT",
    countryCode: "vn",
    address: {
      line1: "Đường Nguyễn Thị Định",
      line2: "Cát Lái",
      city: "Thành phố Thủ Đức",
      state: "TP. Hồ Chí Minh",
      country: "Việt Nam",
      zipCode: "700000",
    },
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("cột code: render dạng router Link, có class table-number-link và table-mono-cell", () => {
    renderWithProviders(<TableHarness data={[sampleTerminal]} />);

    const link = screen.getByRole("link", { name: "SGN01" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/terminals/show/term-1");
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveClass("table-mono-cell");
  });

  it("cột address: hiển thị đầy đủ địa chỉ có Tooltip và class table-cell-ellipsis", () => {
    renderWithProviders(<TableHarness data={[sampleTerminal]} />);

    const formatted = formatTerminalAddress(sampleTerminal);
    expect(formatted).toBe("Đường Nguyễn Thị Định, Cát Lái, Thành phố Thủ Đức, TP. Hồ Chí Minh, Việt Nam, 700000");

    const addressCell = screen.getByText(formatted);
    expect(addressCell).toBeInTheDocument();
    expect(addressCell).toHaveClass("table-cell-ellipsis");
  });

  it("cột type: hiển thị nhãn enum tiếng Việt dịch qua forms.options", () => {
    renderWithProviders(<TableHarness data={[sampleTerminal]} />);

    expect(screen.getByText("Cảng biển")).toBeInTheDocument();
  });

  it("cột countryCode: in hoa và có tabular-nums", () => {
    renderWithProviders(<TableHarness data={[sampleTerminal]} />);

    const countryCell = screen.getByText("VN");
    expect(countryCell).toBeInTheDocument();
    expect(countryCell).toHaveClass("table-mono-cell");
    expect(countryCell).toHaveClass("tabular-nums");
  });

  it("hiển thị '—' với class table-cell-empty khi dữ liệu trống", () => {
    const emptyTerminal: Terminal = {
      id: "term-2",
      code: "",
      name: "",
      type: "INLAND_DEPOT",
      countryCode: "",
      address: null as unknown as Terminal["address"],
      createdAt: "2026-01-01T00:00:00Z",
    };

    const { container } = renderWithProviders(<TableHarness data={[emptyTerminal]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(3);
    emptyPlaceholders.forEach((el) => {
      expect(el).toHaveTextContent("—");
    });
  });

  it("cột thao tác: hiển thị các nút hành động kèm aria-label định danh đối tượng", () => {
    renderWithProviders(<TableHarness data={[sampleTerminal]} />);

    const viewButton = screen.getByRole("button", { name: "Xem Cảng Cát Lái" });
    expect(viewButton).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: "Sửa Cảng Cát Lái" });
    expect(editButton).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: "Xóa Cảng Cát Lái" });
    expect(deleteButton).toBeInTheDocument();
  });
});
