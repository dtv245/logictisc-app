import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import {
  focusFirstFormErrorWithSections,
  ResourceFormFields,
} from "@components/resources/ResourceFormFields";
import {
  findSectionKeyForField,
  resourceFormDefinitions,
} from "@components/resources/resourceForms";
import { initializeAppI18n } from "@locales";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button, Form } from "antd";
import type { FormInstance } from "antd";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

vi.mock("@refinedev/antd", () => ({
  useSelect: () => ({
    selectProps: {
      options: [
        { label: "Nguyễn Văn A (a@example.com)", value: "driver-1" },
        { label: "Trần Văn B (b@example.com)", value: "driver-2" },
      ],
    },
  }),
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const TruckFormHarness = ({
  columns = 2,
  onFormReady,
  onFinish,
}: {
  columns?: 1 | 2;
  onFormReady?: (form: FormInstance) => void;
  onFinish?: (values: Record<string, unknown>) => void;
}) => {
  const [form] = Form.useForm();
  if (onFormReady) onFormReady(form);

  return (
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <Form
          form={form}
          initialValues={{
            status: "available",
            type: "SEMI_TRUCK",
            isHazmatPlacarded: false,
            adrEquipmentIsAdrCertified: false,
          }}
          layout="vertical"
          onFinish={onFinish}
        >
          <ResourceFormFields columns={columns} definition={resourceFormDefinitions.trucks} />
          <Button htmlType="submit">Lưu</Button>
        </Form>
      </AntdLocaleProvider>
    </I18nextProvider>
  );
};

describe("ResourceFormFields — Truck Sections & Conditional Logic", () => {
  it("hiển thị 4 section rõ ràng với tiêu đề và mô tả i18n", () => {
    render(<TruckFormHarness />);

    expect(screen.getByText("Định danh phương tiện")).toBeInTheDocument();
    expect(screen.getByText("Thông số kỹ thuật & Vận hành")).toBeInTheDocument();
    expect(screen.getByText("Tài xế phụ trách")).toBeInTheDocument();
    expect(screen.getByText("Hàng nguy hiểm & Chứng chỉ ADR")).toBeInTheDocument();

    expect(screen.getByText("Mã số xe, số khung và thông tin đăng kiểm")).toBeInTheDocument();
  });

  it("chỉ hiển thị ô chi tiết ADR khi bật công tắc chứng chỉ ADR", async () => {
    render(<TruckFormHarness />);

    // Mặc định tắt ADR -> Không render ô nhập phân lớp ADR và số biển cam
    expect(screen.queryByLabelText(/Lớp ADR cho phép/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Số biển cam ADR/i)).not.toBeInTheDocument();

    // Mở section ADR nếu đang thu gọn
    const adrHeader = screen.queryByRole("button", { name: /Hàng nguy hiểm & Chứng chỉ ADR/i });
    if (adrHeader && adrHeader.getAttribute("aria-expanded") === "false") {
      fireEvent.click(adrHeader);
    }

    // Bật công tắc ADR (switch thứ 2 trong form)
    const switches = screen.getAllByRole("switch");
    const adrSwitch = switches[1]; // adrEquipmentIsAdrCertified
    fireEvent.click(adrSwitch);

    // Khi bật -> hiển thị cả 2 trường phụ thuộc
    await waitFor(() => {
      expect(screen.getByLabelText(/Lớp ADR cho phép/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Số biển cam ADR/i)).toBeInTheDocument();
    });
  });

  it("tự động reset giá trị của các trường ADR khi tắt công tắc chứng chỉ ADR", async () => {
    let formRef: FormInstance | undefined;
    const handleSubmit = vi.fn();

    render(
      <TruckFormHarness
        onFinish={handleSubmit}
        onFormReady={(form) => {
          formRef = form;
        }}
      />,
    );

    // Mở section ADR nếu đang thu gọn
    const adrHeader = screen.queryByRole("button", { name: /Hàng nguy hiểm & Chứng chỉ ADR/i });
    if (adrHeader && adrHeader.getAttribute("aria-expanded") === "false") {
      fireEvent.click(adrHeader);
    }

    // Bật ADR
    const switches = screen.getAllByRole("switch");
    const adrSwitch = switches[1];
    fireEvent.click(adrSwitch);

    await waitFor(() => {
      expect(screen.getByLabelText(/Số biển cam ADR/i)).toBeInTheDocument();
    });

    // Điền dữ liệu vào số biển cam
    formRef?.setFieldsValue({
      adrEquipmentOrangePlateNumber: "33/1203",
    });
    expect(formRef?.getFieldValue("adrEquipmentOrangePlateNumber")).toBe("33/1203");

    // Tắt ADR
    fireEvent.click(adrSwitch);

    // Trường bị ẩn và giá trị trong form store được reset về undefined
    await waitFor(() => {
      expect(screen.queryByLabelText(/Số biển cam ADR/i)).not.toBeInTheDocument();
      expect(formRef?.getFieldValue("adrEquipmentOrangePlateNumber")).toBeUndefined();
    });
  });

  it("validate không cho phép tài xế phụ trùng với tài xế chính", async () => {
    let formRef: FormInstance | undefined;

    render(
      <TruckFormHarness
        onFormReady={(form) => {
          formRef = form;
        }}
      />,
    );

    // Gán tài xế chính và tài xế phụ giống nhau
    formRef?.setFieldsValue({
      mainDriverId: "driver-1",
      secondaryDriverId: "driver-1",
    });

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(
        screen.getByText("Tài xế phụ không được trùng với tài xế chính."),
      ).toBeInTheDocument();
    });
  });

  it("helper findSectionKeyForField và focusFirstFormErrorWithSections mở đúng section", () => {
    const sectionKey = findSectionKeyForField(
      resourceFormDefinitions.trucks,
      "adrEquipmentOrangePlateNumber",
    );
    expect(sectionKey).toBe("hazmatAdr");

    const mockScrollToField = vi.fn();
    const mockOpenSection = vi.fn();

    focusFirstFormErrorWithSections(
      { scrollToField: mockScrollToField },
      resourceFormDefinitions.trucks,
      "adrEquipmentOrangePlateNumber",
      mockOpenSection,
    );

    expect(mockOpenSection).toHaveBeenCalledWith("hazmatAdr");
    expect(mockScrollToField).toHaveBeenCalledWith("adrEquipmentOrangePlateNumber", {
      block: "center",
      focus: true,
    });
  });
});
