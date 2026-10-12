import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceListToolbar } from "@components/ResourceListToolbar";
import { resolveFilterControls } from "@components/resources/resourceFilterControls";
import { initializeAppI18n } from "@locales";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/antd", () => ({
  useSelect: () => ({ selectProps: {} }),
}));

const TRUCK_CONTROLS = resolveFilterControls("trucks");

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

afterEach(() => {
  vi.useRealTimers();
});

const renderToolbar = (
  props: Partial<Parameters<typeof ResourceListToolbar>[0]> = {},
) => {
  const onFilterChange = vi.fn();
  const onFilterReset = vi.fn();
  const onRefresh = vi.fn();

  const utils = render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <ResourceListToolbar
          controls={TRUCK_CONTROLS}
          filterValues={{}}
          headerButtons={<button type="button">Tạo mới</button>}
          isFetching={false}
          onFilterChange={onFilterChange}
          onFilterReset={onFilterReset}
          onRefresh={onRefresh}
          resource="trucks"
          resourceLabel="Xe tải"
          totalCount={42}
          {...props}
        />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

  return { ...utils, onFilterChange, onFilterReset, onRefresh };
};

describe("ResourceListToolbar — Layout & Render", () => {
  it("hiển thị tiêu đề, badge số lượng, nút làm mới và nút tạo mới", () => {
    renderToolbar();

    expect(screen.getByText("Xe tải")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Làm mới" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo mới" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tìm kiếm" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Trạng thái" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Loại" })).toBeInTheDocument();
  });

  it("phản ánh trạng thái isFetching trên nút Làm mới và gọi onRefresh khi bấm", () => {
    const { onRefresh } = renderToolbar({ isFetching: true });

    const refreshBtn = screen.getByRole("button", { name: "Làm mới" });
    expect(refreshBtn).toBeInTheDocument();
    const spinIcon = refreshBtn.querySelector(".anticon-spin");
    expect(spinIcon).toBeInTheDocument();

    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("ResourceListToolbar — Ô tìm kiếm & Debounce 300ms", () => {
  it("gõ nhanh chỉ gọi onFilterChange 1 lần sau 300ms", () => {
    vi.useFakeTimers();
    const { onFilterChange } = renderToolbar();
    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });

    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.change(input, { target: { value: "29" } });
    fireEvent.change(input, { target: { value: "29C" } });

    expect(onFilterChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onFilterChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith("search", "29C");
  });

  it("xoá ô tìm kiếm thì gọi undefined", () => {
    vi.useFakeTimers();
    const { onFilterChange } = renderToolbar({ filterValues: { search: "29C" } });
    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });

    fireEvent.change(input, { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onFilterChange).toHaveBeenCalledWith("search", undefined);
  });
});

describe("ResourceListToolbar — Phím tắt /", () => {
  it("focus ô tìm kiếm khi bấm phím / ở ngoài input", () => {
    renderToolbar();
    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });
    expect(document.activeElement).not.toBe(input);

    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(input);
  });

  it("không cướp focus khi đang gõ trong một input khác", () => {
    renderToolbar();
    const otherInput = document.createElement("input");
    document.body.appendChild(otherInput);
    otherInput.focus();

    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(otherInput);

    document.body.removeChild(otherInput);
  });
});

describe("ResourceListToolbar — Active Filter Chips", () => {
  it("ẩn hoàn toàn dải chip khi không có filter nào", () => {
    renderToolbar({ filterValues: {} });
    expect(screen.queryByText("Đang lọc:")).toBeNull();
    expect(screen.queryByRole("button", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("hiển thị chip cho search và select, bấm x xoá từng chip, bấm Xoá bộ lọc reset hết", () => {
    const { onFilterChange, onFilterReset } = renderToolbar({
      filterValues: { search: "Hà Nội", status: "active", type: "flatbed" },
    });

    expect(screen.getByText("Đang lọc:")).toBeInTheDocument();
    expect(screen.getByText('"Hà Nội"')).toBeInTheDocument();
    expect(screen.getByText("Trạng thái:")).toBeInTheDocument();
    expect(screen.getByText("Loại:")).toBeInTheDocument();

    // Xoá 1 chip
    const removeIcons = screen.getAllByLabelText("Xóa");
    expect(removeIcons.length).toBeGreaterThan(0);
    fireEvent.click(removeIcons[0]);
    expect(onFilterChange).toHaveBeenCalledWith("search", undefined);

    // Xoá tất cả
    const clearAllBtn = screen.getByRole("button", { name: "Xoá bộ lọc" });
    fireEvent.click(clearAllBtn);
    expect(onFilterReset).toHaveBeenCalledTimes(1);
  });
});

describe("ResourceListToolbar — Mobile Filter Drawer", () => {
  it("mở Drawer khi bấm nút Bộ lọc, cho phép áp dụng, xóa bộ lọc và đóng Drawer", async () => {
    const { onFilterReset } = renderToolbar({
      filterValues: { status: "active" },
    });

    const filterBtn = screen.getByRole("button", { name: "Bộ lọc" });
    fireEvent.click(filterBtn);

    // Drawer hiển thị
    const drawer = document.querySelector(".resource-list-toolbar__drawer");
    expect(drawer).not.toBeNull();

    // Bấm Xóa bộ lọc trong footer Drawer
    const resetBtn = drawer!.querySelector(".resource-list-toolbar__drawer-reset-btn") as HTMLElement;
    expect(resetBtn).not.toBeNull();
    fireEvent.click(resetBtn);
    expect(onFilterReset).toHaveBeenCalledTimes(1);

    // Mở lại Drawer
    fireEvent.click(filterBtn);

    // Bấm Áp dụng trong footer Drawer
    const applyBtn = document.querySelector(
      ".resource-list-toolbar__drawer-apply-btn",
    ) as HTMLElement;
    expect(applyBtn).not.toBeNull();
    fireEvent.click(applyBtn);

    // Drawer đóng lại
    await waitFor(() => {
      expect(document.querySelector(".ant-drawer-open")).toBeNull();
    });
  });
});
