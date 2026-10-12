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
  documentColumns,
  documentStatusMap,
  splitFileName,
} from "@features/documents/components/columns";
import type { Document } from "@/types/document.types";
import { defaultStatusStyles } from "@components/StatusTag";

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
              name: "documents",
              list: "/documents",
              show: "/documents/show/:id",
              edit: "/documents/edit/:id",
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

const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: "doc-001",
  fileName: "van_don_chuyen_hang_HN_HP.pdf",
  originalFileName: "van_don_chuyen_hang_HN_HP.pdf",
  ownerType: "load",
  type: "bill_of_lading",
  status: "active",
  contentType: "application/pdf",
  fileSizeBytes: 2048576, // 2 MB
  blobPath: "/blobs/loads/doc-001.pdf",
  blobContainer: "documents",
  uploadedById: "usr-01",
  createdAt: "2026-10-12T08:30:00Z",
  lastModifiedAt: "2026-10-12T08:30:00Z",
  ...overrides,
});

describe("documentColumns — Chuẩn hóa UI Danh sách Tài liệu", () => {
  const TableHarness = ({ data }: { data: Document[] }) => {
    const columns = useLocalizedColumns(documentColumns);
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  describe("splitFileName helper", () => {
    it("tách đúng phần tên và đuôi tệp tin", () => {
      expect(splitFileName("contract_2026.pdf")).toEqual({
        name: "contract_2026",
        ext: ".pdf",
      });
      expect(splitFileName("photo.min.png")).toEqual({
        name: "photo.min",
        ext: ".png",
      });
      expect(splitFileName("README")).toEqual({
        name: "README",
        ext: "",
      });
    });
  });

  it("cột fileName render Link tới /documents/show/:id với table-number-link, giữ phần đuôi file nhìn thấy được", () => {
    const sampleDoc = createMockDocument({
      id: "doc-101",
      fileName: "Bien_ban_giao_hang_so_101.pdf",
    });

    const { container } = renderWithProviders(<TableHarness data={[sampleDoc]} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/documents/show/doc-101");
    expect(link).toHaveClass("table-number-link");

    // Tên tệp có class ellipsis
    const namePart = container.querySelector(".table-cell-ellipsis");
    expect(namePart).toBeInTheDocument();
    expect(namePart).toHaveTextContent("Bien_ban_giao_hang_so_101");

    // Đuôi .pdf được giữ ở thẻ riêng biệt không bị co
    expect(link).toHaveTextContent(".pdf");
  });

  it("cột fileName hiển thị '—' khi giá trị rỗng/null", () => {
    const emptyDoc = createMockDocument({
      id: "doc-empty",
      fileName: "",
    });

    const { container } = renderWithProviders(<TableHarness data={[emptyDoc]} />);

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
    expect(emptySpans[0]).toHaveTextContent("—");
  });

  it("cột fileSizeBytes: align right, tabular-nums, định dạng đúng KB/MB/GB", () => {
    const docKB = createMockDocument({ id: "d-kb", fileSizeBytes: 524288 }); // 512 KB
    const docMB = createMockDocument({ id: "d-mb", fileSizeBytes: 2048576 }); // 2 MB
    const docNull = createMockDocument({ id: "d-null", fileSizeBytes: null as unknown as number });

    const { container } = renderWithProviders(<TableHarness data={[docKB, docMB, docNull]} />);

    expect(screen.getByText("512.0 KB")).toHaveClass("tabular-nums");
    expect(screen.getByText("2.0 MB")).toHaveClass("tabular-nums");

    // Cột dung lượng có numeric và align right
    const sizeCol = documentColumns.find((col) => col.dataIndex === "fileSizeBytes");
    expect(sizeCol?.align).toBe("right");
    expect(sizeCol?.numeric).toBe(true);

    // Null hiển thị '—'
    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột createdAt: align right, tabular-nums, format an toàn bằng formatDateTime", () => {
    const docWithDate = createMockDocument({
      id: "d-date",
      createdAt: "2026-10-12T08:30:00Z",
    });
    const docEmptyDate = createMockDocument({
      id: "d-empty-date",
      createdAt: "",
    });

    const { container } = renderWithProviders(<TableHarness data={[docWithDate, docEmptyDate]} />);

    const dateCol = documentColumns.find((col) => col.dataIndex === "createdAt");
    expect(dateCol?.align).toBe("right");
    expect(dateCol?.numeric).toBe(true);

    const tabularElements = container.querySelectorAll(".tabular-nums");
    expect(tabularElements.length).toBeGreaterThan(0);

    const emptySpans = container.querySelectorAll(".table-cell-empty");
    expect(emptySpans.length).toBeGreaterThanOrEqual(1);
  });

  it("cột status map chính xác: active (success), archived (neutral), deleted (error) kèm nhãn chữ", () => {
    expect(documentStatusMap.active).toBe("success");
    expect(documentStatusMap.archived).toBe("neutral");
    expect(documentStatusMap.deleted).toBe("error");

    const sampleStatuses: Document[] = [
      createMockDocument({ id: "doc-active", status: "active" }),
      createMockDocument({ id: "doc-archived", status: "archived" }),
      createMockDocument({ id: "doc-deleted", status: "deleted" }),
    ];

    const { container } = renderWithProviders(<TableHarness data={sampleStatuses} />);

    expect(screen.getByText("Hoạt động")).toBeInTheDocument();
    expect(screen.getByText("Đã lưu trữ")).toBeInTheDocument();
    expect(screen.getByText("Đã xóa")).toBeInTheDocument();

    expect(container.querySelector(".status-tag--success")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--neutral")).toBeInTheDocument();
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();

    // WCAG contrast
    expect(defaultStatusStyles.success.color).toBe("#15803d");
    expect(defaultStatusStyles.neutral.color).toBe("#475569");
    expect(defaultStatusStyles.error.color).toBe("#b91c1c");
  });

  it("cột actions cố định bên phải với chiều rộng 130px", () => {
    const actionsCol = documentColumns.find((col) => col.key === "actions");
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.fixed).toBe("right");
    expect(actionsCol?.width).toBe(130);
  });
});
