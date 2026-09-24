/**
 * `BaseTable` — bảng dùng chung.
 *
 * Hợp đồng của nó khác `AsyncStateView` ở đúng hai chỗ, và hai chỗ đó là lý do nó tồn
 * tại; test này khoá cả hai:
 *
 * - **Đang tải không thay bảng.** `AsyncStateView` kiểm `isLoading` trước cả `error`,
 *   nên refetch nền (đổi trang, đổi filter) sẽ dựng lại toàn bộ và làm mất ngữ cảnh.
 *   Ở đây `loading` chỉ được chuyển tiếp cho antd.
 * - **Rỗng không thay bảng.** Tiêu đề cột là thông tin; bỏ bảng đi thì người dùng mất
 *   luôn trục để hiểu mình đang xem gì. Trạng thái rỗng nằm *trong* thân bảng.
 *
 * Chỉ **lỗi** mới thay hẳn bảng, và chỉ khi lỗi là `Error` thật — nếu không thì mô tả
 * rơi về locale thay vì hiện "[object Object]".
 *
 * Lưu ý khi viết test với bảng: mặc định `scroll={{ x: "max-content" }}` khiến antd
 * render thêm một bảng đo ẩn (`aria-hidden`) sao chép hàng tiêu đề. Dùng
 * `getByRole("columnheader", …)` — nó bỏ qua cây trợ năng ẩn — chứ đừng dùng `getByText`.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { initializeAppI18n } from "@locales";
import { BaseTable } from "@table";
import type { BaseTableProps } from "@table";
import { render, screen } from "@testing-library/react";
import type { ColumnsType } from "antd/es/table";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

/** `Record<string, unknown>` để thoả ràng buộc `BaseRecord` của Refine. */
interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

const columns: ColumnsType<Row> = [
  { dataIndex: "name", key: "name", title: "TEN-COT" },
];

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

type QueryResult = BaseTableProps<Row>["queryResult"];
type TablePropsArg = BaseTableProps<Row>["tableProps"];

const renderTable = (
  queryResult: QueryResult,
  tableProps: TablePropsArg = {},
) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <BaseTable<Row>
          columns={columns}
          queryResult={queryResult}
          tableProps={tableProps}
        />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

const header = () => screen.queryByRole("columnheader", { name: "TEN-COT" });

/** Bảng thật (không phải bảng đo ẩn của antd). */
const visibleTable = () =>
  document.querySelector("table:not([aria-hidden='true'])");

describe("BaseTable — trạng thái lỗi", () => {
  it("thay hẳn bảng bằng QueryErrorState", () => {
    renderTable({ error: new Error("boom") });

    expect(screen.getByText("Không thể tải nội dung")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(header()).not.toBeInTheDocument();
  });

  it("gọi `refetch` khi bấm thử lại", () => {
    const refetch = vi.fn();
    renderTable({ error: new Error("boom"), isFetching: false, refetch });

    screen.getByRole("button", { name: "Thử lại" }).click();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("khoá nút thử lại trong lúc đang tải, để không bắn trùng", () => {
    const refetch = vi.fn();
    renderTable({ error: new Error("boom"), isFetching: true, refetch });

    // Khớp theo regex vì antd chèn icon loading có `aria-label` vào tên trợ năng của nút.
    const retry = screen.getByRole("button", { name: /Thử lại/ });

    expect(retry).toBeDisabled();
  });

  it("không truyền `onRetry` thì không render nút thử lại", () => {
    renderTable({ error: new Error("boom") });

    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  });

  it("không hiện '[object Object]' khi lỗi không phải `Error`", () => {
    // Lỗi hình dạng lạ (mảng, chuỗi, object trần) không được đổ nguyên văn ra UI.
    renderTable({ error: { message: "boom" } });

    expect(screen.getByText("Không thể tải nội dung")).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
    expect(screen.queryByText(/object Object/)).not.toBeInTheDocument();
  });

  it("coi `error: null` là không có lỗi", () => {
    // `useTable` trả `error: null` khi thành công; null không phải một lỗi.
    renderTable({ error: null }, { dataSource: [{ id: "1", name: "A" }] });

    expect(header()).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("BaseTable — trạng thái bình thường", () => {
  it("chuyển `loading` cho antd thay vì thay bảng bằng spinner", () => {
    // Đây là điểm khác `AsyncStateView`: bảng vẫn còn nguyên khi đang tải lại.
    renderTable(
      { isFetching: true },
      { dataSource: [{ id: "1", name: "A" }], loading: true },
    );

    expect(header()).toBeInTheDocument();
    expect(visibleTable()).not.toBeNull();
    // antd phủ lớp loading lên bảng đang có, không dựng lại từ đầu.
    expect(document.querySelector(".ant-spin-spinning")).not.toBeNull();
  });

  it("giữ tiêu đề cột khi không có dòng nào, và hiện trạng thái rỗng bên trong bảng", () => {
    renderTable({}, { dataSource: [] });

    // Điểm mấu chốt: rỗng KHÔNG xoá bảng.
    expect(header()).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
    expect(visibleTable()).not.toBeNull();
  });

  it("cho phép thay nội dung rỗng qua `emptyText`", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <BaseTable<Row>
            columns={columns}
            emptyText={<span>KHONG-CO-GI</span>}
            queryResult={{}}
            tableProps={{ dataSource: [] }}
          />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    expect(screen.getByText("KHONG-CO-GI")).toBeInTheDocument();
  });

  it("mặc định `rowKey` là `id`", () => {
    // Sai rowKey làm React dùng lại DOM của dòng khác khi phân trang; đây là ràng buộc
    // toàn hệ thống nên nó phải là mặc định chứ không phải việc mỗi màn tự nhớ.
    renderTable({}, { dataSource: [{ id: "row-7", name: "A" }] });

    expect(
      document.querySelector("tr[data-row-key='row-7']"),
    ).not.toBeNull();
  });

  it("cho phép ghi đè `rowKey` khi resource không dùng `id`", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <BaseTable<Row>
            columns={columns}
            queryResult={{}}
            rowKey="name"
            tableProps={{ dataSource: [{ id: "1", name: "row-A" }] }}
          />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    expect(
      document.querySelector("tr[data-row-key='row-A']"),
    ).not.toBeNull();
  });

  it("mặc định cuộn ngang khi cột không vừa", () => {
    renderTable({}, { dataSource: [] });

    // Không có `scroll.x` thì antd bóp cột lại và nội dung dài bị cắt cụt.
    expect(document.querySelector(".ant-table-content")).not.toBeNull();
    expect(
      screen.getByRole("columnheader", { name: "TEN-COT" }),
    ).toBeInTheDocument();
  });
});
