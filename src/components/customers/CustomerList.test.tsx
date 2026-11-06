import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomerList, type CustomerListRecord } from "@/components/customers/CustomerList";

const customerNames = [
  "An Phát Logistics",
  "Bình Minh Transport",
  "Công ty Vận tải Quốc tế Đại Tây Dương và Chuỗi Cung ứng Toàn cầu",
  "Đông Á Freight",
  "Eagle Roadways",
  "Freight One",
  "Gia Hưng Logistics",
  "Hải Đăng Cargo",
  "Interlink Express",
  "Jupiter Supply Chain",
  "Kho vận Mekong",
  "Long Thành Distribution",
];

const customers: CustomerListRecord[] = customerNames.map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name,
  status: index % 3 === 0 ? "active" : "inactive",
  isVatExempt: index % 2 === 0,
  createdAt: "2026-10-03T08:30:00Z",
  email: index === 1 ? null : `contact${index + 1}@example.test`,
  phone: index === 2 ? null : `+84 28 5550 ${String(index + 1).padStart(4, "0")}`,
  taxId: index === 4 ? null : `03123456${String(index + 1).padStart(2, "0")}`,
  addressLine1: index === 3 ? null : `${index + 1} Đường Vận Tải`,
  addressLine2: index % 4 === 0 ? `Tầng ${index + 1}` : null,
  addressCity: index === 3 ? null : "Thành phố Hồ Chí Minh",
  addressState: index % 2 === 0 ? "TP. Hồ Chí Minh" : null,
  addressZipCode: index % 3 === 0 ? "700000" : null,
  addressCountry: index === 3 ? null : "Việt Nam",
  notes: index === 5 ? "Ghi chú kiểm tra trường hợp nội dung dài trên một dòng." : null,
}));

describe("CustomerList", () => {
  it("hiển thị 12 bản ghi, dữ liệu thiếu an toàn và thông tin khách hàng", () => {
    const onView = vi.fn();
    const { container } = render(
      <CustomerList
        customers={customers}
        loading={false}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onView={onView}
        pagination={{ current: 1, pageSize: 20, total: customers.length, onChange: vi.fn() }}
      />,
    );

    expect(container.querySelectorAll(".customer-list-item")).toHaveLength(12);
    expect(screen.getByText(customerNames[2])).toBeInTheDocument();
    expect(screen.getAllByText("Miễn VAT")).toHaveLength(6);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ngày tạo: 03/10/2026")).toHaveLength(12);
    expect(screen.getByText("MST: 0312345601")).toBeInTheDocument();

    fireEvent.click(screen.getByText("An Phát Logistics"));
    expect(onView).toHaveBeenCalledWith(customers[0]);
  });

  it("hiển thị trạng thái rỗng và skeleton khi đang tải", () => {
    const props = {
      customers: [],
      onDelete: vi.fn(),
      onEdit: vi.fn(),
      onView: vi.fn(),
      pagination: { current: 1, pageSize: 20, total: 0, onChange: vi.fn() },
    };

    const empty = render(<CustomerList {...props} loading={false} />);
    expect(screen.getByText("Không có khách hàng phù hợp")).toBeInTheDocument();
    empty.unmount();

    render(<CustomerList {...props} loading />);
    expect(screen.getByRole("status", { name: "Đang tải khách hàng" })).toBeInTheDocument();
  });
});
