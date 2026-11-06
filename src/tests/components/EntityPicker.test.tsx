/**
 * `EntityPicker` ở chế độ `infiniteScroll`.
 *
 * Khoá ba hành vi của dropdown tải dần:
 *
 * 1. Trang đầu vẫn do `getList` của dataProvider cung cấp — không tự ghép URL.
 * 2. Cuộn tới đáy danh sách thì nạp trang kế tiếp và nối option, thay vì dừng ở 50 dòng.
 * 3. Giá trị đang chọn nằm ngoài trang đầu vẫn hiện nhãn (qua `useOne`), không phải id thô.
 * 4. Resource rỗng thì không gọi `getList` — data provider ném `RESOURCE_NOT_CONFIGURED`
 *    thay vì trả danh sách rỗng, và toolbar từng dựng picker cho cả filter văn bản.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { EntityPicker } from "@/components/EntityPicker";
import { initializeAppI18n } from "@locales";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  selected: undefined as { data: unknown } | undefined,
}));

vi.mock("@refinedev/core", () => ({
  queryKeys: (resource: string) => ({ all: ["data", "default", resource] }),
  useDataProvider: () => () => ({ getList: mocks.getList }),
  useOne: () => ({ data: mocks.selected }),
}));

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  mocks.getList.mockReset();
  mocks.selected = undefined;
});

const renderPicker = (props: Partial<Parameters<typeof EntityPicker>[0]> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
  return render(
    <EntityPicker
      infiniteScroll
      labelFormat={(record) => `Load ${String(record.number)}`}
      placeholder="Chọn vận đơn"
      resource="loads"
      {...props}
    />,
    { wrapper },
  );
};

const openDropdown = () => fireEvent.mouseDown(screen.getByRole("combobox"));

describe("EntityPicker — chọn bản ghi có cuộn vô hạn", () => {
  it("nạp trang đầu và nối trang kế tiếp khi cuộn tới đáy dropdown", async () => {
    mocks.getList.mockImplementation(async ({ pagination }: { pagination: { current: number } }) =>
      pagination.current === 1
        ? { data: [{ id: "load-1", number: 1 }], total: 80 }
        : { data: [{ id: "load-2", number: 2 }], total: 80 },
    );

    const { container } = renderPicker();
    openDropdown();

    expect(await screen.findByText("Load 1", { selector: ".ant-select-item-option-content" })).toBeInTheDocument();
    expect(mocks.getList).toHaveBeenCalledWith(
      expect.objectContaining({ pagination: { current: 1, pageSize: 50 }, resource: "loads" }),
    );

    const holder = container.ownerDocument.querySelector<HTMLElement>(".ant-select-dropdown .rc-virtual-list-holder")
      ?? container.ownerDocument.querySelector<HTMLElement>(".ant-select-dropdown");
    if (!holder) throw new Error("Expected the select dropdown list");
    fireEvent.scroll(holder);

    expect(await screen.findByText("Load 2", { selector: ".ant-select-item-option-content" })).toBeInTheDocument();
    expect(screen.getByText("Load 1", { selector: ".ant-select-item-option-content" })).toBeInTheDocument();
    expect(mocks.getList).toHaveBeenCalledWith(
      expect.objectContaining({ pagination: { current: 2, pageSize: 50 } }),
    );
  });

  it("gửi tìm kiếm lên server sau khi người dùng gõ", async () => {
    mocks.getList.mockResolvedValue({ data: [{ id: "load-9", number: 9 }], total: 1 });

    renderPicker();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "HN" } });

    await waitFor(() =>
      expect(mocks.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{ field: "search", operator: "contains", value: "HN" }],
        }),
      ),
    );
  });

  it("không gọi getList khi resource rỗng", async () => {
    renderPicker({ resource: "" });
    openDropdown();

    // `getList("")` sẽ đâm vào `RESOURCE_NOT_CONFIGURED` của data provider.
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("dựng nhãn cho giá trị đang chọn nằm ngoài trang đã tải", async () => {
    mocks.getList.mockResolvedValue({ data: [], total: 0 });
    mocks.selected = { data: { id: "load-77", number: 77 } };

    renderPicker({ value: "load-77" });

    expect(await screen.findByText("Load 77")).toBeInTheDocument();
  });
});
