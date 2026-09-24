/**
 * Chứng minh tiêu đề cột dịch theo ngôn ngữ hiện hành, cập nhật khi đổi ngôn ngữ
 * lúc đang chạy, khoá locale không lọt ra DOM, và **giá trị enum trong cell cũng
 * được dịch** — trước đây bảng hiện `in_transit` trong khi form hiện "In transit".
 */

import { createCrudColumns } from "@components/crudColumns";
import { useLocalizedColumns } from "@components/useLocalizedColumns";
import { loadColumns } from "@features/loads/components/columns";
import { initializeAppI18n } from "@locales";
import type { BaseRecord } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { describe, expect, it } from "vitest";

// Bảng có dữ liệu sẽ mount cột "Thao tác" → các nút của Refine cần QueryClient.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const withProviders = (node: ReactNode, i18n: I18nInstance) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>{node}</I18nextProvider>
  </QueryClientProvider>
);

/** Bảng không dữ liệu — đủ để kiểm tra tiêu đề. */
const HeaderHarness = () => {
  const columns = useLocalizedColumns(loadColumns);

  return <Table columns={columns} dataSource={[]} pagination={false} rowKey="id" />;
};

async function renderHeadersIn(locale: "en" | "vi") {
  const i18n = await initializeAppI18n({ locale, fallbackLocale: "en" });

  return {
    i18n,
    ...render(withProviders(<HeaderHarness />, i18n)),
  };
}

describe("useLocalizedColumns — tiêu đề", () => {
  it("dịch tiêu đề cột sang tiếng Việt", async () => {
    await renderHeadersIn("vi");

    expect(screen.getByText("Số load")).toBeInTheDocument();
    expect(screen.getByText("Xe phụ trách")).toBeInTheDocument();
    expect(screen.getByText("Thao tác")).toBeInTheDocument();
  });

  it("dịch tiêu đề cột sang tiếng Anh", async () => {
    await renderHeadersIn("en");

    expect(screen.getByText("Load No.")).toBeInTheDocument();
    expect(screen.getByText("Assigned truck")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("cập nhật tiêu đề khi đổi ngôn ngữ lúc đang chạy", async () => {
    const { i18n } = await renderHeadersIn("vi");
    expect(screen.getByText("Số load")).toBeInTheDocument();

    await i18n.changeLanguage("en");

    await waitFor(() => {
      expect(screen.getByText("Load No.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Số load")).not.toBeInTheDocument();
  });

  it("không để lộ khoá locale ra DOM", async () => {
    await renderHeadersIn("vi");

    expect(screen.queryByText(/columns\.loads\./u)).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("titleKey");
  });
});

/**
 * Row tổng hợp cho nhánh enum: cố ý dùng type riêng thay vì `Load` để tham số hoá
 * được giá trị `status` (kể cả giá trị backend mới chưa có bản dịch) mà không phải
 * ép kiểu — `LoadStatus` là union đóng.
 */
interface EnumRow extends BaseRecord {
  id: string;
  status: string;
}

const enumColumns = createCrudColumns<EnumRow>("loads", [
  { dataIndex: "status", titleKey: "columns.loads.status", options: true },
]);

const EnumHarness = ({ status }: { status: string }) => {
  const columns = useLocalizedColumns(enumColumns);

  return (
    <Table
      columns={columns}
      dataSource={[{ id: "1", status }]}
      pagination={false}
      rowKey="id"
    />
  );
};

async function renderEnumIn(locale: "en" | "vi", status = "in_transit") {
  const i18n = await initializeAppI18n({ locale, fallbackLocale: "en" });

  return render(withProviders(<EnumHarness status={status} />, i18n));
}

describe("useLocalizedColumns — giá trị enum trong cell", () => {
  it("dịch enum sang tiếng Việt thay vì hiện giá trị thô", async () => {
    await renderEnumIn("vi");

    expect(screen.queryByText("in_transit")).not.toBeInTheDocument();
    expect(screen.getByText("Đang vận chuyển")).toBeInTheDocument();
  });

  it("dịch enum sang tiếng Anh thay vì hiện giá trị thô", async () => {
    await renderEnumIn("en");

    expect(screen.queryByText("in_transit")).not.toBeInTheDocument();
    expect(screen.getByText("In transit")).toBeInTheDocument();
  });

  it("giữ nguyên giá trị thô khi enum chưa có bản dịch", async () => {
    await renderEnumIn("en", "brand_new_status");

    expect(screen.getByText("brand_new_status")).toBeInTheDocument();
  });

  it("hiện placeholder thay vì 'null' khi giá trị rỗng", async () => {
    await renderEnumIn("en", "");

    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });
});

/**
 * Cột có cờ `status` phải ra `StatusTag`; cột chỉ có `options` thì không — nếu
 * không thì mọi cột enum (loại xe, loại terminal…) cũng bị tô màu trạng thái.
 */
const statusColumns = createCrudColumns<EnumRow>("loads", [
  { dataIndex: "status", titleKey: "columns.loads.status", status: true },
]);

const plainEnumColumns = createCrudColumns<EnumRow>("loads", [
  { dataIndex: "status", titleKey: "columns.loads.status", options: true },
]);

const StatusHarness = ({
  columns,
  status,
}: {
  columns: ReturnType<typeof createCrudColumns<EnumRow>>;
  status: string;
}) => {
  const localized = useLocalizedColumns(columns);

  return (
    <Table
      columns={localized}
      dataSource={[{ id: "1", status }]}
      pagination={false}
      rowKey="id"
    />
  );
};

async function renderStatusCell(
  status: string,
  columns: ReturnType<typeof createCrudColumns<EnumRow>> = statusColumns,
) {
  const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });

  return render(withProviders(<StatusHarness columns={columns} status={status} />, i18n));
}

describe("useLocalizedColumns — cột trạng thái", () => {
  it("bọc giá trị trong StatusTag đã dịch", async () => {
    await renderStatusCell("delivered");

    const tag = screen.getByRole("status");

    expect(tag).toHaveTextContent("Delivered");
    expect(screen.queryByText("delivered")).not.toBeInTheDocument();
  });

  it("cột chỉ có options thì không thành StatusTag", async () => {
    await renderStatusCell("delivered", plainEnumColumns);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("giá trị chưa có bản dịch vẫn ra Tag, hiện nguyên giá trị thô", async () => {
    await renderStatusCell("brand_new_status");

    // Không được trắng ô: trạng thái lạ vẫn phải nhìn thấy được.
    expect(screen.getByRole("status")).toHaveTextContent("brand_new_status");
  });

  it("ô trạng thái rỗng không render Tag", async () => {
    await renderStatusCell("");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
