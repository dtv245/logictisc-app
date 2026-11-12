import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Form } from "antd";
import { describe, expect, it, vi } from "vitest";
import { LoadForm } from "@/features/loads/components/LoadForm";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithQuery = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

vi.mock("@/components/EntityPicker", () => ({
  EntityPicker: ({ resource }: { resource: string }) => <div data-testid={`picker-${resource}`} />,
}));

function Harness() {
  const [form] = Form.useForm();
  return <LoadForm form={form} />;
}

describe("LoadForm container", () => {
  it("giải thích tính năng chưa khả dụng và không gọi resource container", () => {
    renderWithQuery(<Harness />);
    expect(screen.getByText(/Backend chưa cung cấp API danh sách container/)).toBeInTheDocument();
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
    renderWithQuery(<InvalidForm />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm mới" }));
    await waitFor(() => expect(screen.getAllByText(/Vui lòng/).length).toBeGreaterThan(0));
    expect(onClick).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("không tự điền sẵn cự ly hoặc toạ độ bằng 0 khi tạo đơn", () => {
    renderWithQuery(<Harness />);

    expect(screen.getByPlaceholderText("0.0")).toHaveValue("");
    for (const input of screen.getAllByPlaceholderText("0.000000")) {
      expect(input).toHaveValue("");
    }
  });
});
