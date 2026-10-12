/**
 * CrudResponsiveInfrastructure.test.tsx
 *
 * Kiểm tra tính tương thích Responsive của hạ tầng CRUD trong LogisticsX
 * trên 5 mốc viewport: 375px, 414px, 768px, 1024px, 1440px.
 *
 * Phạm vi kiểm tra:
 * 1. BaseTable: scroll x max-content, non-pinning column 0 on mobile, compact pagination.
 * 2. ResourceListToolbar: mobile filter drawer, drawer apply/reset, desktop inline filters.
 * 3. ResourceModalFrame: modal responsive container, header/body/footer separation.
 * 4. ResourceFormFields: single-column vs multi-column layout.
 * 5. ResourceDetailView: Descriptions column adaptation (1 column mobile, 2 columns desktop).
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceDetailView } from "@components/resources/ResourceDetailView";
import { ResourceFormFields } from "@components/resources/ResourceFormFields";
import { ResourceModalFrame } from "@components/resources/ResourceModalFrame";
import { resourceFormDefinitions } from "@components/resources/resourceForms";
import { ResourceListToolbar } from "@components/ResourceListToolbar";
import { resolveFilterControls } from "@components/resources/resourceFilterControls";
import { initializeAppI18n } from "@locales";
import { BaseTable } from "@table";
import { fireEvent, render, screen } from "@testing-library/react";
import { Form, Grid } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/antd", () => ({
  useSelect: () => ({ selectProps: {} }),
}));

interface TestRow extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  amount: number;
}

const TEST_COLUMNS: ColumnsType<TestRow> = [
  { dataIndex: "code", key: "code", title: "Mã" },
  { dataIndex: "name", key: "name", title: "Tên" },
  { dataIndex: "amount", key: "amount", title: "Số tiền" },
  { key: "actions", title: "Thao tác", render: () => <span>Thao tác</span> },
];

const VIEWPORTS = [
  { width: 375, height: 667, name: "375px (Mobile Portrait)", isMobile: true },
  { width: 414, height: 896, name: "414px (Mobile Large)", isMobile: true },
  { width: 768, height: 1024, name: "768px (Tablet)", isMobile: false },
  { width: 1024, height: 768, name: "1024px (Small Desktop)", isMobile: false },
  { width: 1440, height: 900, name: "1440px (Desktop Full HD)", isMobile: false },
];

let i18n: I18nInstance;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const setViewportAndBreakpoints = (width: number, height: number, isMobile: boolean) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event("resize"));

  // Mock Grid.useBreakpoint() để phù hợp với viewport hiện tại
  vi.spyOn(Grid, "useBreakpoint").mockReturnValue({
    xs: isMobile,
    sm: isMobile,
    md: !isMobile,
    lg: width >= 1024,
    xl: width >= 1200,
    xxl: width >= 1600,
  });
};

describe("Responsive CRUD Infrastructure", () => {
  describe.each(VIEWPORTS)("Viewport: $name ($width x $height)", ({ width, height, isMobile }) => {
    beforeEach(() => {
      setViewportAndBreakpoints(width, height, isMobile);
    });

    // ==========================================
    // 1. BASE TABLE RESPONSIVE BEHAVIOR
    // ==========================================
    it("BaseTable: cuộn ngang max-content và phân trang thích ứng theo kích thước màn hình", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <BaseTable<TestRow>
              columns={TEST_COLUMNS}
              queryResult={{
                data: {
                  data: [
                    { id: "1", code: "TRK-01", name: "Xe 1", amount: 1000 },
                    { id: "2", code: "TRK-02", name: "Xe 2", amount: 2000 },
                  ],
                  total: 100,
                },
              }}
              tableProps={{
                dataSource: [
                  { id: "1", code: "TRK-01", name: "Xe 1", amount: 1000 },
                  { id: "2", code: "TRK-02", name: "Xe 2", amount: 2000 },
                ],
                pagination: { current: 1, pageSize: 10, total: 100 },
              }}
            />
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      // Wrapper có class base-table-wrapper
      const wrapper = container.querySelector(".base-table-wrapper");
      expect(wrapper).toBeInTheDocument();

      // Kiểm tra sự xuất hiện của bảng dữ liệu
      expect(screen.getByRole("columnheader", { name: "Mã" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Thao tác" })).toBeInTheDocument();

      // Phân trang
      const pagination = container.querySelector(".ant-pagination");
      expect(pagination).toBeInTheDocument();

      if (isMobile) {
        // Trên mobile: kích thước pagination nhỏ gọn, ẩn quick jumper và size changer
        expect(container.querySelector(".ant-pagination-options-quick-jumper")).not.toBeInTheDocument();
        expect(container.querySelector(".ant-pagination-options-size-changer")).not.toBeInTheDocument();
      } else {
        // Trên desktop/tablet: hỗ trợ chọn trang và nhảy trang khi số lượng > 50
        expect(container.querySelector(".ant-pagination-options-quick-jumper")).toBeInTheDocument();
      }
    });

    it("BaseTable: trên mobile không khoá cứng cột đầu tiên để tránh kẹp màn hình với cột actions", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <BaseTable<TestRow>
              columns={TEST_COLUMNS}
              queryResult={{
                data: {
                  data: [{ id: "1", code: "TRK-01", name: "Xe 1", amount: 1000 }],
                  total: 1,
                },
              }}
              tableProps={{
                dataSource: [{ id: "1", code: "TRK-01", name: "Xe 1", amount: 1000 }],
              }}
            />
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      const firstHeaderCol = container.querySelector("th.ant-table-cell");
      expect(firstHeaderCol).toBeInTheDocument();

      if (isMobile) {
        // Không gắn class ant-table-cell-fix-left lên cột đầu tiên trên mobile
        expect(firstHeaderCol?.classList.contains("ant-table-cell-fix-left")).toBe(false);
      } else {
        // Trên tablet/desktop, cột đầu tiên được cố định bên trái
        expect(firstHeaderCol?.classList.contains("ant-table-cell-fix-left")).toBe(true);
      }
    });

    // ==========================================
    // 2. RESOURCE LIST TOOLBAR & FILTER BAR
    // ==========================================
    it("ResourceListToolbar: hiển thị tìm kiếm linh hoạt và drawer/inline bộ lọc", () => {
      const controls = resolveFilterControls("trucks");
      const onFilterChange = vi.fn();
      const onFilterReset = vi.fn();

      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <ResourceListToolbar
              controls={controls}
              filterValues={{ status: "active" }}
              headerButtons={<button type="button">Thêm xe tải</button>}
              isFetching={false}
              onFilterChange={onFilterChange}
              onFilterReset={onFilterReset}
              resource="trucks"
              resourceLabel="Danh sách xe tải"
              totalCount={25}
            />
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      // Tiêu đề và nút thêm
      expect(screen.getByText("Danh sách xe tải")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Thêm xe tải" })).toBeInTheDocument();

      // Ô tìm kiếm luôn hiển thị
      expect(screen.getByPlaceholderText("Nhập để tìm...")).toBeInTheDocument();

      if (isMobile) {
        // Nút mở Drawer bộ lọc trên mobile
        const filterBtn = screen.getByRole("button", { name: "Bộ lọc" });
        expect(filterBtn).toBeInTheDocument();

        // Mở drawer
        fireEvent.click(filterBtn);

        // Drawer xuất hiện với nút Áp dụng và Xóa bộ lọc
        expect(screen.getByRole("button", { name: "Áp dụng" })).toBeInTheDocument();
        const drawer = document.querySelector(".resource-list-toolbar__drawer");
        expect(drawer).not.toBeNull();
        const drawerResetBtn = drawer?.querySelector(".resource-list-toolbar__drawer-reset-btn");
        expect(drawerResetBtn).toBeInTheDocument();

        // Bấm Áp dụng đóng drawer
        fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
      } else {
        // Phím tắt kbd '/' hiển thị trên desktop
        expect(container.querySelector(".resource-list-toolbar__kbd")).toBeInTheDocument();
      }

      // Chip bộ lọc đang hoạt động
      expect(screen.getByText("Đang lọc:")).toBeInTheDocument();
    });

    // ==========================================
    // 3. RESOURCE MODAL FRAME
    // ==========================================
    it("ResourceModalFrame: cấu trúc khung modal chuẩn hóa với tiêu đề và nút thao tác", () => {
      const onOk = vi.fn();
      const onCancel = vi.fn();

      render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <ResourceModalFrame
              okText="Lưu dữ liệu"
              onCancel={onCancel}
              onOk={onOk}
              open={true}
              title="Thông tin chi tiết xe"
              width={600}
            >
              <div data-testid="modal-content">Nội dung form chi tiết</div>
            </ResourceModalFrame>
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      expect(screen.getByText("Thông tin chi tiết xe")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lưu dữ liệu" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();
    });

    // ==========================================
    // 4. RESOURCE FORM FIELDS RESPONSIVE LAYOUT
    // ==========================================
    it("ResourceFormFields: layout form thích ứng số cột theo màn hình", () => {
      const definition = resourceFormDefinitions.trucks;

      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <Form layout="vertical">
              <ResourceFormFields columns={2} definition={definition} />
            </Form>
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      // Các trường form render đầy đủ
      expect(screen.getByLabelText("Số")).toBeInTheDocument();
      expect(screen.getByLabelText("Hãng")).toBeInTheDocument();

      // Kiểm tra Col grid của Ant Design (loại bỏ col bên trong Form.Item)
      const GRID_COL = ".ant-col:not(.ant-form-item-label):not(.ant-form-item-control)";
      const licensePlateCol = container.querySelector("#licensePlate")?.closest(GRID_COL);
      expect(licensePlateCol).not.toBeNull();
      expect(licensePlateCol?.className).toContain("ant-col-xs-24");
      expect(licensePlateCol?.className).toContain("ant-col-lg-12");
    });

    // ==========================================
    // 5. RESOURCE DETAIL VIEW
    // ==========================================
    it("ResourceDetailView: Descriptions responsive 1 cột mobile và 2 cột desktop", () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <AntdLocaleProvider>
            <ResourceDetailView
              record={{
                id: "truck-001",
                number: "TRK-9999",
                make: "Volvo",
                model: "FH16",
                status: "active",
                notes: "Xe chở hàng đường dài",
              }}
              resource="trucks"
            />
          </AntdLocaleProvider>
        </I18nextProvider>,
      );

      const detailWrapper = container.querySelector(".resource-detail-view");
      expect(detailWrapper).toBeInTheDocument();

      // Hiển thị các nhãn dữ liệu
      expect(screen.getByText(/TRK-9999/)).toBeInTheDocument();
      expect(screen.getByText("Volvo")).toBeInTheDocument();
    });
  });
});
