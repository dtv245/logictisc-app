/**
 * `FilterBar`.
 *
 * Phần đáng test nhất là ô tìm kiếm, vì nó là control duy nhất có state riêng:
 *
 * - Gọi `onChange` theo từng phím gõ là mỗi ký tự một request, và request của tiền tố
 *   có thể về **sau** request của chuỗi đầy đủ — bảng hiện dữ liệu cũ.
 * - Ô nhập phải theo giá trị khi cha đổi từ bên ngoài (bấm "Xoá bộ lọc", hoặc
 *   back/forward vì `useTable` đồng bộ filter lên URL). Nếu không, ô giữ chữ cũ trong
 *   khi bảng đã bỏ lọc — hai thứ hiển thị hai sự thật khác nhau.
 *
 * `useSelect` được mock: `EntityPicker` chỉ cần nó trả về props rỗng để render một
 * `Select` trơn, không cần cả Refine runtime trong unit test này.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { FilterBar } from "@components/FilterBar";
import { resolveFilterControls } from "@components/resources/resourceFilterControls";
import { initializeAppI18n } from "@locales";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/antd", () => ({
  useSelect: () => ({ selectProps: {} }),
}));

const CONTROLS = resolveFilterControls("loads");

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

afterEach(() => {
  vi.useRealTimers();
});

const renderBar = (value: Record<string, string | undefined> = {}) => {
  const onChange = vi.fn();
  const onReset = vi.fn();

  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <FilterBar
          controls={CONTROLS}
          onChange={onChange}
          onReset={onReset}
          value={value}
        />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

  return { onChange, onReset };
};

/** Cho phép đổi `value` từ bên ngoài, mô phỏng xoá bộ lọc hoặc điều hướng URL. */
const Harness = () => {
  const [value, setValue] = useState<Record<string, string | undefined>>({
    search: "HN",
  });

  return (
    <>
      <button onClick={() => setValue({})} type="button">
        ep-xoa
      </button>
      <FilterBar
        controls={CONTROLS}
        onChange={(field, next) => setValue({ [field]: next })}
        onReset={() => setValue({})}
        value={value}
      />
    </>
  );
};

describe("FilterBar — render", () => {
  it("render đủ control của resource", () => {
    renderBar();

    expect(screen.getByRole("textbox", { name: "Tìm kiếm" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Trạng thái" }),
    ).toBeInTheDocument();
  });

  it("ẩn nút xoá khi chưa lọc gì, hiện khi có filter", () => {
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <FilterBar
            controls={CONTROLS}
            onChange={vi.fn()}
            onReset={vi.fn()}
            value={{}}
          />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );
    expect(screen.queryByRole("button", { name: "Xoá bộ lọc" })).toBeNull();
    unmount();

    const { onReset } = renderBar({ status: "dispatched" });
    screen.getByRole("button", { name: "Xoá bộ lọc" }).click();

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("không render gì khi resource không có control nào", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <FilterBar
            controls={[]}
            onChange={vi.fn()}
            onReset={vi.fn()}
            value={{}}
          />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("FilterBar — ô tìm kiếm", () => {
  it("gõ liên tục chỉ đẩy một lần, sau khi ngừng gõ", () => {
    vi.useFakeTimers();
    const { onChange } = renderBar();
    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });

    fireEvent.change(input, { target: { value: "H" } });
    fireEvent.change(input, { target: { value: "HN" } });
    fireEvent.change(input, { target: { value: "HNO" } });

    // Chưa hết hạn debounce: chưa được gọi lần nào.
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("search", "HNO");
  });

  it("xoá hết chữ thì bỏ filter chứ không gửi chuỗi rỗng", () => {
    vi.useFakeTimers();
    const { onChange } = renderBar({ search: "HN" });
    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });

    fireEvent.change(input, { target: { value: "" } });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onChange).toHaveBeenCalledWith("search", undefined);
  });

  it("theo giá trị khi cha xoá filter từ bên ngoài", () => {
    vi.useFakeTimers();
    render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <Harness />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    const input = screen.getByRole("textbox", { name: "Tìm kiếm" });
    expect(input).toHaveValue("HN");

    act(() => {
      screen.getByRole("button", { name: "ep-xoa" }).click();
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Nếu ô nhập so với prop `value` thay vì giá trị đã đẩy, chuỗi "HN" cũ sẽ được
    // đẩy ngược lên cha ngay sau khi vừa xoá.
    expect(input).toHaveValue("");
  });
});
