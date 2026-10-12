import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine, type DataProvider } from "@refinedev/core";
import { App as AntdApp, Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import {
  useProductColumns,
  productColumns,
} from "@features/products/components/columns";
import type { Product } from "@/types/product.types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

let i18nInstance: I18nInstance;

const mockDataProvider: DataProvider = {
  create: vi.fn(async () => ({ data: { id: 1 } })) as unknown as DataProvider["create"],
  deleteOne: vi.fn(async () => ({ data: { id: 1 } })) as unknown as DataProvider["deleteOne"],
  getApiUrl: () => "http://localhost:8080",
  getList: vi.fn(async () => ({ data: [], total: 0 })) as unknown as DataProvider["getList"],
  getMany: vi.fn(async () => ({ data: [] })) as unknown as DataProvider["getMany"],
  getOne: vi.fn(async () => ({ data: { id: 1 } })) as unknown as DataProvider["getOne"],
  update: vi.fn(async () => ({ data: { id: 1 } })) as unknown as DataProvider["update"],
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
              name: "products",
              list: "/products",
              show: "/products/show/:id",
              edit: "/products/edit/:id",
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

describe("productColumns — Chuẩn hóa UI Products List theo Trucks", () => {
  const TableHarness = ({
    data,
    onShow,
    onEdit,
  }: {
    data: Product[];
    onShow?: (id: number | string) => void;
    onEdit?: (id: number | string) => void;
  }) => {
    const columns = useProductColumns({ onShow, onEdit });
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột sku render font monospace, tabular-nums và router Link tới /products/show/:id", () => {
    const sampleProduct: Product = {
      id: 101,
      name: "Dầu nhờn động cơ Castrol CRB",
      sku: "CAS-CRB-15W40",
      price: 1850000,
      stockQuantity: 45,
      active: true,
    };

    renderWithProviders(<TableHarness data={[sampleProduct]} />);

    const link = screen.getByRole("link", { name: "CAS-CRB-15W40" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveClass("table-mono-cell");
    expect(link).toHaveClass("tabular-nums");
    expect(link).toHaveAttribute("href", "/products/show/101");
  });

  it("cột sku hiển thị '—' khi null hoặc rỗng", () => {
    const sampleProductNoSku: Product = {
      id: 102,
      name: "Sản phẩm thử nghiệm",
      sku: "",
      price: 0,
      stockQuantity: 0,
      active: false,
    };

    const { container } = renderWithProviders(<TableHarness data={[sampleProductNoSku]} />);
    const emptySpan = container.querySelector(".table-cell-empty");
    expect(emptySpan).toBeInTheDocument();
    expect(emptySpan).toHaveTextContent("—");
  });

  it("cột name hiển thị ellipsis và Tooltip cho text dài, hiển thị '—' khi rỗng", () => {
    const sampleLongName: Product = {
      id: 103,
      name: "Lốp xe tải Bridgestone R150 11R22.5 bố thép chuyên dụng đường trường",
      sku: "BS-R150-11R225",
      price: 8500000,
      stockQuantity: 12,
      active: true,
    };

    const sampleEmptyName: Product = {
      id: 104,
      name: "",
      sku: "SKU-EMPTY-NAME",
      price: 10000,
      stockQuantity: 5,
      active: true,
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleLongName, sampleEmptyName]} />,
    );

    // Text dài có class table-cell-ellipsis
    expect(container.querySelector(".table-cell-ellipsis")).toBeInTheDocument();

    // Tên rỗng hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột price: align right, tabular-nums, định dạng tiền tệ VND với ₫ và hiển thị '—' khi null", () => {
    const sampleProductPrice: Product = {
      id: 105,
      name: "Lọc gió động cơ Cummins",
      sku: "FIL-AF25270",
      price: 650000,
      stockQuantity: 20,
      active: true,
    };

    const sampleProductNullPrice: Product = {
      id: 106,
      name: "Hàng tặng kèm",
      sku: "GIFT-01",
      price: null as unknown as number,
      stockQuantity: 100,
      active: true,
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleProductPrice, sampleProductNullPrice]} />,
    );

    // Định dạng tiền tệ VND với ₫
    expect(screen.getByText(/650\.000\s*₫/)).toBeInTheDocument();

    // Cột price có align right
    const priceCol = productColumns.find((col) => col.dataIndex === "price");
    expect(priceCol?.align).toBe("right");
    expect(priceCol?.numeric).toBe(true);

    // Price null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột stockQuantity: align right, tabular-nums, phân cách hàng nghìn và hiển thị '—' khi null", () => {
    const sampleStock: Product = {
      id: 107,
      name: "Đai ốc siết bánh xe",
      sku: "NUT-M22",
      price: 25000,
      stockQuantity: 15400,
      active: true,
    };

    const sampleNullStock: Product = {
      id: 108,
      name: "Chưa kiểm kê",
      sku: "INV-PENDING",
      price: 50000,
      stockQuantity: null as unknown as number,
      active: false,
    };

    const { container } = renderWithProviders(
      <TableHarness data={[sampleStock, sampleNullStock]} />,
    );

    // Phân cách hàng nghìn 15.400
    expect(screen.getByText("15.400")).toBeInTheDocument();

    // Cột stockQuantity có align right
    const stockCol = productColumns.find((col) => col.dataIndex === "stockQuantity");
    expect(stockCol?.align).toBe("right");
    expect(stockCol?.numeric).toBe(true);

    // Stock null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột active hiển thị StatusTag chuẩn ngữ nghĩa: active (success) và inactive (neutral) kèm nhãn tiếng Việt", () => {
    const sampleProducts: Product[] = [
      { id: 109, name: "P1", sku: "S1", price: 10, stockQuantity: 1, active: true },
      { id: 110, name: "P2", sku: "S2", price: 20, stockQuantity: 2, active: false },
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleProducts} />);

    // Tones
    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();

    // Nhãn tiếng Việt
    expect(screen.getByText("Hoạt động")).toBeInTheDocument();
    expect(screen.getByText("Ngừng hoạt động")).toBeInTheDocument();
  });

  it("cột actions cố định bên phải với chiều rộng 130px và gọi callbacks khi click", () => {
    const onShowMock = vi.fn();
    const onEditMock = vi.fn();

    const sampleProduct: Product = {
      id: 111,
      name: "Bình ắc quy GS 12V-100Ah",
      sku: "GS-N100",
      price: 2400000,
      stockQuantity: 8,
      active: true,
    };

    renderWithProviders(
      <TableHarness data={[sampleProduct]} onShow={onShowMock} onEdit={onEditMock} />,
    );

    // Kiểm tra cấu hình fixed right và width
    const actionsCol = productColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);

    // Nút xem có aria-label chứa tên sản phẩm
    const showBtn = screen.getByRole("button", { name: /Xem Bình ắc quy GS 12V-100Ah/ });
    expect(showBtn).toBeInTheDocument();
    fireEvent.click(showBtn);
    expect(onShowMock).toHaveBeenCalledWith(111);

    // Nút sửa có aria-label chứa tên sản phẩm
    const editBtn = screen.getByRole("button", { name: /Sửa Bình ắc quy GS 12V-100Ah/ });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(onEditMock).toHaveBeenCalledWith(111);
  });
});
