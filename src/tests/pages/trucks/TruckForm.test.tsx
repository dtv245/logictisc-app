import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Form } from "antd";
import { TruckForm } from "@/features/trucks/components/TruckForm";

vi.mock("@/components/EntityPicker", () => ({
  EntityPicker: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="mock-entity-picker">{placeholder ?? "EntityPicker"}</div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

const TruckHarness = ({ isEdit = false, onCancel }: { isEdit?: boolean; onCancel?: () => void }) => {
  const [form] = Form.useForm();
  return (
    <TruckForm
      form={form}
      isEdit={isEdit}
      onCancel={onCancel}
      saveButtonProps={{ children: isEdit ? "Lưu thay đổi" : "Tạo xe" }}
    />
  );
};

describe("TruckForm — Tuân thủ quy tắc trang riêng, 2 cột", () => {
  it("hiển thị 3 Card sections cho thông số, tài xế và an toàn", () => {
    render(<TruckHarness />);

    expect(screen.getByText("Thông số & Định danh phương tiện")).toBeInTheDocument();
    expect(screen.getByText("Phân công tài xế phụ trách")).toBeInTheDocument();
    expect(screen.getByText("Tiêu chuẩn an toàn & Chứng chỉ ADR")).toBeInTheDocument();

    expect(screen.getByLabelText(/Số hiệu xe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tải trọng xe/i)).toBeInTheDocument();
  });

  it("chỉ hiển thị ô nhập chi tiết ADR khi bật công tắc chứng chỉ ADR", () => {
    render(<TruckHarness />);

    // Mặc định không hiện phân lớp ADR
    expect(screen.queryByLabelText(/Phân lớp ADR/i)).not.toBeInTheDocument();

    // Bật công tắc chứng chỉ ADR (switch thứ 2 trong form)
    const switches = screen.getAllByRole("switch");
    const adrSwitch = switches[1]; // adrEquipmentIsAdrCertified
    fireEvent.click(adrSwitch);

    // Khi bật thì hiện ô nhập phân lớp ADR và số biển cam
    expect(screen.getByPlaceholderText(/Class 3, 4.1, 8/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/33\/1203/i)).toBeInTheDocument();
  });

  it("thanh thao tác dính đáy có 1 nút primary và nút Hủy tách biệt", () => {
    const handleCancel = vi.fn();
    render(<TruckHarness onCancel={handleCancel} />);

    const saveButton = screen.getByRole("button", { name: "Tạo xe" });
    expect(saveButton).toHaveClass("ant-btn-primary");

    const cancelButton = screen.getByRole("button", { name: "Hủy" });
    fireEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
