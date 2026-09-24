/**
 * Nhánh trạng thái của `ResourceListPage`.
 *
 * Hai thay đổi được khoá ở đây:
 *
 * 1. Bảng lỗi thì **thay hẳn** bảng, không hiện một dải `Alert` phía trên một bảng
 *    rỗng — "chưa tải được" và "không có dữ liệu" là hai chuyện khác nhau.
 * 2. Modal xem chi tiết dùng chung bộ bốn trạng thái. Trước đây nhánh lỗi bị bỏ
 *    sót: fetch hỏng thì modal render form với `initialValues` undefined, trông y
 *    hệt một bản ghi rỗng.
 *
 * `useTable`/`useShow`/`useModalForm` được mock để dựng thẳng từng trạng thái —
 * đây là unit test cho nhánh render, không phải test tích hợp với Refine.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceListPage } from "@components/ResourceListPage";
import { initializeAppI18n } from "@locales";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tiêu đề cột nhận ra được, để khẳng định bảng có/không có mặt.
 *
 * Tìm bằng `getByRole("columnheader")` chứ không `getByText`: `BaseTable` đặt
 * `scroll={{ x: "max-content" }}`, và khi có `scroll.x` antd render thêm một bảng đo
 * ẩn (`aria-hidden`) sao chép y hệt hàng tiêu đề. `getByText` thấy cả hai bản nên ném
 * lỗi "multiple elements"; `getByRole` mặc định bỏ qua cây trợ năng ẩn nên chỉ thấy bản
 * thật. Đây cũng là query đúng hơn về mặt ngữ nghĩa.
 */
const TABLE_MARKER = "COT-BANG";

const tableHeader = () =>
  screen.queryByRole("columnheader", { name: TABLE_MARKER });

const state = vi.hoisted(() => ({
  refetchShow: vi.fn(),
  refetchTable: vi.fn(),
  setCurrent: vi.fn(),
  setFilters: vi.fn(),
  showId: undefined as string | undefined,
  showQueryResult: {} as Record<string, unknown>,
  tableFilters: [] as unknown[],
  tableQueryResult: {} as Record<string, unknown>,
}));

vi.mock("@refinedev/core", () => ({
  useShow: () => ({
    queryResult: state.showQueryResult,
    setShowId: vi.fn(),
    showId: state.showId,
  }),
}));

vi.mock("@refinedev/antd", () => ({
  CreateButton: () => <button type="button">create</button>,
  DeleteButton: () => null,
  EditButton: () => null,
  List: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ShowButton: () => null,
  useModalForm: () => ({
    formLoading: false,
    formProps: {},
    modalProps: { open: false },
    show: vi.fn(),
  }),
  // `ResourceFormFields` chỉ cần `useSelect`; trả về rỗng để `Select` render trơn.
  useSelect: () => ({ selectProps: {} }),
  useTable: () => ({
    filters: state.tableFilters,
    setCurrent: state.setCurrent,
    setFilters: state.setFilters,
    tableProps: { dataSource: [], loading: false, pagination: false },
    tableQueryResult: state.tableQueryResult,
  }),
}));

const columns = [
  { dataIndex: "number", key: "number", title: TABLE_MARKER },
] as unknown as Parameters<typeof ResourceListPage>[0]["columns"];

async function renderList() {
  const i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });

  return render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <ResourceListPage columns={columns} resource="loads" />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );
}

beforeEach(() => {
  state.refetchShow.mockReset();
  state.refetchTable.mockReset();
  state.setCurrent.mockReset();
  state.setFilters.mockReset();
  state.showId = undefined;
  state.tableFilters = [];
  state.tableQueryResult = {
    isFetching: false,
    refetch: state.refetchTable,
  };
  state.showQueryResult = {
    isFetching: false,
    refetch: state.refetchShow,
  };
});

describe("ResourceListPage — lỗi tải bảng", () => {
  it("thay bảng bằng trạng thái lỗi dùng chung", async () => {
    // `Error` thật, không phải object có `.message`: `BaseTable` chỉ đọc message khi
    // chắc chắn đó là `Error`, để lỗi lạ không hiện ra thành "[object Object]".
    state.tableQueryResult = {
      error: new Error("boom"),
      isFetching: false,
      refetch: state.refetchTable,
    };

    await renderList();

    expect(screen.getByText("Không thể tải nội dung")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    // Điểm mấu chốt: bảng rỗng KHÔNG được render cùng lúc với lỗi.
    expect(tableHeader()).not.toBeInTheDocument();
  });

  it("gọi refetch của bảng khi bấm thử lại", async () => {
    state.tableQueryResult = {
      error: new Error("boom"),
      isFetching: false,
      refetch: state.refetchTable,
    };

    await renderList();
    screen.getByRole("button", { name: "Thử lại" }).click();

    expect(state.refetchTable).toHaveBeenCalledTimes(1);
  });

  it("hiện bảng khi không có lỗi", async () => {
    await renderList();

    expect(tableHeader()).toBeInTheDocument();
    expect(screen.queryByText("Không thể tải nội dung")).not.toBeInTheDocument();
  });
});

describe("ResourceListPage — FilterBar", () => {
  it("render bộ lọc của resource và ẩn nút xoá khi chưa lọc gì", async () => {
    await renderList();

    expect(
      screen.getByRole("group", { name: "Bộ lọc danh sách" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("hiện nút xoá khi có filter đang áp dụng, và xoá thì đưa về trang 1", async () => {
    state.tableFilters = [
      { field: "status", operator: "eq", value: "dispatched" },
    ];

    await renderList();
    screen.getByRole("button", { name: "Xoá bộ lọc" }).click();

    expect(state.setFilters).toHaveBeenCalledWith([], "replace");
    // Giữ nguyên trang 5 rồi bỏ lọc sẽ ra bảng rỗng, và người dùng đọc kết quả đó là
    // "không có dữ liệu" — nên đổi filter luôn phải kéo về trang đầu.
    expect(state.setCurrent).toHaveBeenCalledWith(1);
  });
});

describe("ResourceListPage — modal xem chi tiết", () => {
  it("hiện form khi tải được bản ghi", async () => {
    state.showId = "1";
    state.showQueryResult = {
      data: { data: { id: "1", name: "Load 1" } },
      isFetching: false,
      refetch: state.refetchShow,
    };

    await renderList();

    // Tiêu đề lấy nhãn resource từ locale, không phải tên resource thô.
    expect(screen.getByText("Xem Chuyến hàng")).toBeInTheDocument();
  });

  it("hiện trạng thái đang tải thay vì form rỗng", async () => {
    state.showId = "1";
    state.showQueryResult = {
      isFetching: true,
      refetch: state.refetchShow,
    };

    await renderList();

    // `AsyncStateView` phát cùng một thông điệp qua cả text lẫn vùng aria-live.
    expect(
      screen.getAllByText("Đang tải nội dung").length,
    ).toBeGreaterThan(0);
  });

  it("hiện lỗi thay vì form rỗng khi fetch bản ghi hỏng", async () => {
    state.showId = "1";
    state.showQueryResult = {
      // `Error` thật, vì `AsyncStateView` chỉ lấy message khi chắc chắn là `Error`.
      error: new Error("show-boom"),
      isFetching: false,
      refetch: state.refetchShow,
    };

    await renderList();

    // Trước đây nhánh này render form với `initialValues` undefined — nhìn như bản
    // ghi rỗng, không có cách nào biết là đã hỏng.
    expect(screen.getByText("show-boom")).toBeInTheDocument();
    expect(screen.getByText("Không thể tải nội dung")).toBeInTheDocument();
  });

  it("không hiện '[object Object]' khi lỗi không phải Error", async () => {
    state.showId = "1";
    state.showQueryResult = {
      error: { message: "show-boom" },
      isFetching: false,
      refetch: state.refetchShow,
    };

    await renderList();

    expect(screen.getByText("Không thể tải nội dung")).toBeInTheDocument();
    expect(
      screen.queryByText(/\[object Object\]/u),
    ).not.toBeInTheDocument();
  });
});
