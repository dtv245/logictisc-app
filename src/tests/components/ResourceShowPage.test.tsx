/**
 * Chứng minh show page xử lý đủ trạng thái.
 *
 * Trước đây component chỉ truyền `isLoading` cho `<Show>`: query lỗi thì trang hiện
 * khung rỗng vĩnh viễn, không thông báo và không có cách thử lại.
 *
 * `useShow` được mock để dựng thẳng từng trạng thái — đây là unit test cho nhánh
 * render của component, không phải test tích hợp với Refine.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceShowPage } from "@components/ResourceShowPage";
import { initializeAppI18n } from "@locales";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();

const queryResult: {
  data?: { data: Record<string, unknown> };
  error?: { message: string };
  isError: boolean;
  isLoading: boolean;
  refetch: typeof refetch;
} = {
  isError: false,
  isLoading: false,
  refetch,
};

vi.mock("@refinedev/core", () => ({
  useShow: () => ({ queryResult }),
}));

vi.mock("@refinedev/antd", () => ({
  Show: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TextField: ({ value }: { value: unknown }) => <span>{String(value)}</span>,
}));

async function renderPage() {
  const i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });

  return render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <ResourceShowPage resource="loads" />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );
}

describe("ResourceShowPage", () => {
  beforeEach(() => {
    refetch.mockReset();
    queryResult.isError = false;
    queryResult.isLoading = false;
    delete queryResult.error;
    delete queryResult.data;
  });

  it("hiện bản ghi khi tải thành công", async () => {
    queryResult.data = { data: { number: 101, status: "in_transit" } };

    await renderPage();

    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("in_transit")).toBeInTheDocument();
  });

  it("hiện thông báo lỗi kèm nút thử lại khi query lỗi", async () => {
    queryResult.isError = true;
    queryResult.error = { message: "boom" };

    await renderPage();

    expect(screen.getByText("Không thể tải dữ liệu.")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("gọi refetch khi bấm nút thử lại", async () => {
    queryResult.isError = true;
    queryResult.error = { message: "boom" };

    await renderPage();
    screen.getByRole("button", { name: "Thử lại" }).click();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("hiện trạng thái rỗng khi bản ghi không có field nào", async () => {
    queryResult.data = { data: {} };

    await renderPage();

    // `Empty` của antd lấy chữ mô tả từ locale antd, không phải từ i18next.
    expect(screen.getAllByText("Trống").length).toBeGreaterThan(0);
  });
});
