import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Form } from "antd";
import { describe, expect, it, vi } from "vitest";
import { LoadForm } from "@/features/loads/components/LoadForm";

vi.mock("@/components/EntityPicker", () => ({
  EntityPicker: ({ resource }: { resource: string }) => <div data-testid={`picker-${resource}`} />,
}));

function Harness() {
  const [form] = Form.useForm();
  return <LoadForm form={form} />;
}

describe("LoadForm container", () => {
  it("giải thích tính năng chưa khả dụng và không tải resource container", () => {
    render(<Harness />);
    expect(screen.getByText(/Chức năng chọn container chưa khả dụng/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Container gắn kèm" })).toBeDisabled();
    expect(screen.queryByTestId("picker-containers")).not.toBeInTheDocument();
  });

  it("không gọi handler submit của Refine hoặc gửi form khi thiếu trường bắt buộc", async () => {
    const onFinish = vi.fn();
    const onClick = vi.fn();
    function InvalidForm() {
      const [form] = Form.useForm();
      return <LoadForm form={form} onFinish={onFinish} saveButtonProps={{ onClick, children: "Thêm mới" }} />;
    }
    render(<InvalidForm />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm mới" }));
    await waitFor(() => expect(screen.getAllByText(/Vui lòng/).length).toBeGreaterThan(0));
    expect(onClick).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
