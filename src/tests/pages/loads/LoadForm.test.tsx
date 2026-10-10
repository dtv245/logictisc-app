import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Form } from "antd";
import { LoadForm } from "@/features/loads/components/LoadForm";

// Mock EntityPicker
vi.mock("@/components/EntityPicker", () => ({
  EntityPicker: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="mock-entity-picker">{placeholder ?? "EntityPicker"}</div>
  ),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

const Harness = ({ isEdit = false, onCancel }: { isEdit?: boolean; onCancel?: () => void }) => {
  const [form] = Form.useForm();
  return (
    <LoadForm
      form={form}
      isEdit={isEdit}
      onCancel={onCancel}
      saveButtonProps={{ children: isEdit ? "Lưu thay đổi" : "Tạo đơn hàng" }}
    />
  );
};

describe("LoadForm — Tuân thủ bộ quy tắc giao diện", () => {
  it("hiển thị đầy đủ 6 phân nhóm nghiệp vụ (Card sections) và mục lục", () => {
    render(<Harness />);

    // Kiểm tra 6 nhóm nghiệp vụ
    expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
    expect(screen.getByText("Điểm lấy hàng (Origin)")).toBeInTheDocument();
    expect(screen.getByText("Điểm giao hàng (Destination)")).toBeInTheDocument();
    expect(screen.getByText("Hàng hóa & an toàn")).toBeInTheDocument();
    expect(screen.getByText("Cước phí & phân công")).toBeInTheDocument();
    expect(screen.getByText("Tham chiếu & tích hợp ngoài")).toBeInTheDocument();

    // Kiểm tra tiêu đề mục lục
    expect(screen.getByText("Mục lục biểu mẫu")).toBeInTheDocument();
  });

  it("chỉ hiển thị ô nhập Hazmat khi bật công tắc hàng nguy hiểm", () => {
    render(<Harness />);

    // Mặc định Hazmat class và UN number không hiện diện
    expect(screen.queryByLabelText(/Hazmat Class/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/UN Number/i)).not.toBeInTheDocument();

    // Bật công tắc hàng nguy hiểm
    const hazmatSwitch = screen.getByRole("switch");
    expect(hazmatSwitch).toBeInTheDocument();
    fireEvent.click(hazmatSwitch);

    // Khi bật thì hiển thị ô nhập class và UN number
    expect(screen.getByPlaceholderText("Ví dụ: Class 3")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ví dụ: UN1203")).toBeInTheDocument();
  });

  it("tái sử dụng AddressFields cho cả điểm lấy hàng và điểm giao hàng", () => {
    render(<Harness />);

    const addressInputs = screen.getAllByPlaceholderText("Ví dụ: 123 Main Street");
    expect(addressInputs).toHaveLength(2); // 1 cho origin, 1 cho destination

    const cityInputs = screen.getAllByPlaceholderText("Ví dụ: Dallas");
    expect(cityInputs).toHaveLength(2);
  });

  it("thanh thao tác dính đáy có 1 nút primary và nút Hủy tách biệt", () => {
    const handleCancel = vi.fn();
    render(<Harness isEdit={false} onCancel={handleCancel} />);

    const createButton = screen.getByRole("button", { name: "Tạo đơn hàng" });
    expect(createButton).toHaveClass("ant-btn-primary");

    const cancelButton = screen.getByRole("button", { name: "Hủy" });
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
