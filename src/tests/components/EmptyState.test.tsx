/**
 * `EmptyState` và nhánh `empty` của `AsyncStateView`.
 *
 * `AsyncStateView` không có consumer nào trong `src/`, nên trước file này phần
 * "empty" của nó hoàn toàn không được test. Việc tách `EmptyState` ra khỏi nó là
 * refactor không đổi hành vi — mà refactor không đổi hành vi trên code không có
 * test thì không có gì bảo đảm. Hai test cuối khoá đúng phép uỷ quyền đó.
 *
 * Hai cái bẫy của antd `Empty` mà file này phải né:
 *
 * 1. Phần mô tả được render **hai lần** (ô placeholder và khối cuộn), nên phải
 *    dùng `getAllByText` chứ không phải `getByText` — xem `AntdLocaleProvider.test.tsx`.
 * 2. Ảnh minh hoạ mặc định có sẵn `<svg><title>No data</title></svg>` **nhúng cứng
 *    trong asset của antd**, không đi qua `ConfigProvider` locale và không đổi theo
 *    prop `description`. Nghĩa là chuỗi "No data" luôn có trong DOM kể cả khi ta
 *    truyền mô tả riêng. Vì vậy các khẳng định dưới đây bám vào
 *    `asyncState.emptyDescription` — chuỗi của chính repo — chứ không bám vào "No data".
 */

import { AsyncStateView } from "@components/AsyncState";
import { EmptyState } from "@components/EmptyState";
import { initializeAppI18n } from "@locales";
import type { AsyncState } from "@utils/asyncStateModel";
import { render, screen } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it } from "vitest";

/** Chuỗi chỉ đến từ `asyncState.emptyDescription` của repo — mốc đáng tin. */
const DEFAULT_DESCRIPTION = "There is nothing to display yet.";

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
});

const renderWithI18n = (ui: React.ReactNode) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe("EmptyState", () => {
  it("dùng text mặc định từ locale khi không truyền gì", () => {
    renderWithI18n(<EmptyState />);

    expect(screen.getAllByText(DEFAULT_DESCRIPTION).length).toBeGreaterThan(0);
  });

  it("text truyền vào thay thế text mặc định", () => {
    renderWithI18n(
      <EmptyState description="Hãy tạo chuyến đầu tiên." title="Chưa có chuyến" />,
    );

    expect(screen.getAllByText("Chưa có chuyến").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Hãy tạo chuyến đầu tiên.").length,
    ).toBeGreaterThan(0);
    // Mô tả mặc định của locale phải biến mất; nếu không thì prop đang bị bỏ qua
    // và cả hai chuỗi cùng hiện.
    expect(screen.queryAllByText(DEFAULT_DESCRIPTION)).toHaveLength(0);
  });

  it("render nút hành động", () => {
    renderWithI18n(<EmptyState action={<button type="button">Tạo mới</button>} />);

    expect(screen.getByRole("button", { name: "Tạo mới" })).toBeInTheDocument();
  });
});

describe("AsyncStateView — nhánh empty uỷ quyền cho EmptyState", () => {
  const emptyState: AsyncState<string[]> = { status: "empty" };

  it("render nội dung rỗng chứ không phải spinner", () => {
    renderWithI18n(
      <AsyncStateView state={emptyState}>
        {() => <p>không được render</p>}
      </AsyncStateView>,
    );

    expect(screen.getAllByText(DEFAULT_DESCRIPTION).length).toBeGreaterThan(0);
    // Khẳng định phủ định mới là thứ bắt được lỗi: nếu `case "empty"` bị đổi thành
    // render cả nhánh loading, hoặc rơi nhầm nhánh, thì đây là chỗ duy nhất phát hiện.
    expect(screen.queryAllByText("Loading content")).toHaveLength(0);
    expect(screen.queryAllByText("không được render")).toHaveLength(0);
  });

  it("chuyển tiếp emptyTitle/emptyDescription xuống EmptyState", () => {
    renderWithI18n(
      <AsyncStateView
        emptyDescription="Thử bỏ bớt bộ lọc."
        emptyTitle="Không khớp bộ lọc"
        state={emptyState}
      >
        {() => null}
      </AsyncStateView>,
    );

    expect(screen.getAllByText("Không khớp bộ lọc").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thử bỏ bớt bộ lọc.").length).toBeGreaterThan(0);
    expect(screen.queryAllByText(DEFAULT_DESCRIPTION)).toHaveLength(0);
  });

  it("nhánh populated vẫn render children", () => {
    renderWithI18n(
      <AsyncStateView state={{ status: "populated", data: ["L-1"] }}>
        {(data) => <p>{data.join(",")}</p>}
      </AsyncStateView>,
    );

    expect(screen.getByText("L-1")).toBeInTheDocument();
    expect(screen.queryAllByText(DEFAULT_DESCRIPTION)).toHaveLength(0);
  });
});

/** Chuỗi này chỉ đến từ `queryError.description` của repo. */
const DEFAULT_ERROR_DESCRIPTION =
  "Something went wrong while loading this content.";

describe("AsyncStateView — nhánh error lấy message từ chính lỗi", () => {
  it("hiện message của lỗi mà không cần consumer truyền gì", () => {
    renderWithI18n(
      <AsyncStateView state={{ error: new Error("boom"), status: "error" }}>
        {() => null}
      </AsyncStateView>,
    );

    // Trước đây nhánh này bỏ qua `state.error` hoàn toàn: consumer nào quên
    // `errorDescription` thì message biến mất, chỉ còn câu chung chung.
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("errorDescription ghi đè message của lỗi", () => {
    renderWithI18n(
      <AsyncStateView
        errorDescription="Thử lại sau."
        state={{ error: new Error("boom"), status: "error" }}
      >
        {() => null}
      </AsyncStateView>,
    );

    expect(screen.getByText("Thử lại sau.")).toBeInTheDocument();
    expect(screen.queryAllByText("boom")).toHaveLength(0);
  });

  it("lỗi không phải Error thì rơi về mô tả chung, không hiện [object Object]", () => {
    renderWithI18n(
      <AsyncStateView state={{ error: { message: "boom" }, status: "error" }}>
        {() => null}
      </AsyncStateView>,
    );

    expect(
      screen.getAllByText(DEFAULT_ERROR_DESCRIPTION).length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByText(/\[object Object\]/u)).toHaveLength(0);
  });
});
