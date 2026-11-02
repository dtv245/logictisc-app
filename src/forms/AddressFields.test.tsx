import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button, Form } from "antd";
import { describe, expect, it, vi } from "vitest";
import { AddressFields } from "@/forms/AddressFields";

vi.mock("@/features/terminals/components/TerminalSelect", () => ({ TerminalSelect: () => null }));

describe("địa chỉ bắt buộc", () => {
  it("từ chối chuỗi chỉ có khoảng trắng ở cả điểm lấy và giao", async () => {
    const onFinish = vi.fn();
    render(<Form onFinish={onFinish} validateTrigger="onBlur">
      <AddressFields prefix="originAddress" includeCoordinates={false} />
      <AddressFields prefix="destinationAddress" includeCoordinates={false} />
      <Button htmlType="submit">Lưu</Button>
    </Form>);
    const addresses = screen.getAllByPlaceholderText("Ví dụ: 123 Main Street");
    addresses.forEach((input) => { fireEvent.change(input, { target: { value: "     " } }); fireEvent.blur(input); });
    await waitFor(() => expect(screen.getAllByText("Vui lòng nhập địa chỉ")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(onFinish).not.toHaveBeenCalled());
  });
});
