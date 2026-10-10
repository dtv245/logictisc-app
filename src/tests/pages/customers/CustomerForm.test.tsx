import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Form } from "antd";
import { CustomerForm } from "@/features/customers/components/CustomerForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

const CustomerHarness = ({ isModal = false, onCancel }: { isModal?: boolean; onCancel?: () => void }) => {
  const [form] = Form.useForm();
  return (
    <CustomerForm
      form={form}
      isModal={isModal}
      onCancel={onCancel}
      saveButtonProps={{ children: "Lưu khách hàng" }}
    />
  );
};

describe("CustomerForm — Tuân thủ quy tắc 1 cột, ≤6 trường", () => {
  it("hiển thị các trường cốt lõi trong khối thông tin cơ bản", () => {
    render(<CustomerHarness />);

    expect(screen.getByText("Thông tin cơ bản")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên khách hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang hoạt động/i)).toBeInTheDocument();
    expect(screen.getByText(/Ngừng hoạt động/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email liên hệ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã số thuế/i)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument(); // Miễn VAT
  });

  it("thu gọn chi tiết địa chỉ và ghi chú mở rộng", () => {
    render(<CustomerHarness />);

    expect(screen.getByText(/Chi tiết địa chỉ trụ sở/i)).toBeInTheDocument();
  });

  it("chế độ trang có thanh footer dính đáy, chế độ modal không render footer", () => {
    const { rerender } = render(<CustomerHarness isModal={false} />);
    expect(screen.getByRole("button", { name: "Lưu khách hàng" })).toBeInTheDocument();

    rerender(<CustomerHarness isModal={true} />);
    expect(screen.queryByRole("button", { name: "Lưu khách hàng" })).not.toBeInTheDocument();
  });
});
