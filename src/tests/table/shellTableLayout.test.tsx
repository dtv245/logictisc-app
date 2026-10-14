/** Resize thực sự thay sức chứa; cuộn và refetch không gửi trùng thay đổi pageSize. */
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { initializeAppI18n } from "@locales";
import { BaseTable } from "@table/BaseTable";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;
beforeAll(async () => { i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" }); });
afterEach(() => vi.restoreAllMocks());

const columns = [{ title: "Name", dataIndex: "name", key: "name" }];
const dataSource = [{ id: "1", name: "Row 1" }];

function mockGeometry() {
  const geometry = { height: 700, width: 800 };
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    let height = 0;
    let top = 0;
    if (this.classList.contains("ant-layout-content")) height = geometry.height;
    if (this.classList.contains("base-table-wrapper")) top = 120 - (this.closest(".ant-layout-content")?.scrollTop ?? 0);
    if (this.classList.contains("ant-table-header")) height = 60;
    if (this.classList.contains("ant-table-thead")) height = 44;
    if (this.classList.contains("ant-pagination")) height = 32;
    if (this.classList.contains("ant-table-row")) height = 44;
    return { x: 0, y: top, top, left: 0, right: geometry.width, bottom: top + height, width: geometry.width, height, toJSON: () => ({}) };
  });
  return geometry;
}

const renderFitTable = (onChange: (size: number) => void, pagination: false | { current: number; pageSize: number; total: number } = { current: 3, pageSize: 20, total: 120 }) => render(
  <I18nextProvider i18n={i18n}>
    <div className="app-shell"><div className="ant-layout-content"><main className="app-content" style={{ paddingBottom: 24 }}>
      <BaseTable fitToShell columns={columns} queryResult={{}} onAdaptivePageSizeChange={onChange} tableProps={{ dataSource, pagination }} />
    </main></div></div>
  </I18nextProvider>,
);

describe("BaseTable vừa app-shell", () => {
  it("giảm số dòng khi vùng shell thấp hơn, giữ footer và không thay số dòng vì cuộn", async () => {
    const geometry = mockGeometry();
    const onChange = vi.fn();
    const { container } = renderFitTable(onChange);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const firstSize = onChange.mock.calls[0][0] as number;
    expect(firstSize).toBeGreaterThan(1);
    expect(container.querySelector(".base-table-wrapper--fit-shell")).toHaveStyle({ height: "556px", minHeight: "0" });
    expect(container.querySelector(".ant-table-body")).not.toBeNull();
    expect(screen.getByText(/of 120/)).toBeInTheDocument();

    geometry.height = 450;
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(onChange.mock.calls[1][0]).toBeLessThan(firstSize);
    const scroller = container.querySelector(".ant-layout-content")!;
    scroller.scrollTop = 100;
    act(() => window.dispatchEvent(new Event("resize")));
    await new Promise((resolve) => setTimeout(resolve, 180));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("không tự bật phân trang cho bảng pagination=false", async () => {
    mockGeometry();
    const onChange = vi.fn();
    const { container } = renderFitTable(onChange, false);
    await waitFor(() => expect(container.querySelector(".base-table-wrapper--fit-shell")).not.toBeNull());
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector(".ant-pagination")).toBeNull();
  });
});
