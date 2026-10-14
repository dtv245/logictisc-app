import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerminalShow } from "@/pages/terminals/show";
import type { Terminal } from "@/types/terminal.types";

const mockRefetch = vi.fn();
const permissions = vi.hoisted(() => ({ canEdit: true, canDelete: true }));

const sampleTerminal: Terminal = {
  id: "term-123",
  name: "Port of New York and New Jersey",
  code: "USNYC",
  countryCode: "US",
  type: "SEA_PORT",
  notes: "Main container terminal gate 3",
  addressLine1: "1 Terminal Way",
  addressLine2: "Berth 22",
  addressCity: "Newark",
  addressState: "NJ",
  addressZipCode: "07114",
  addressCountry: "US",
  createdAt: "2026-10-14T08:00:00Z",
  lastModifiedAt: "2026-10-14T08:30:00Z",
};

const mockQueryResult: {
  data?: { data: Terminal };
  error?: { message: string };
  isError: boolean;
  isLoading: boolean;
  refetch: typeof mockRefetch;
} = {
  data: { data: sampleTerminal },
  isError: false,
  isLoading: false,
  refetch: mockRefetch,
};

vi.mock("@refinedev/core", () => ({
  useCan: ({ action }: { action: string }) => ({
    data: {
      can: action === "edit" ? permissions.canEdit : permissions.canDelete,
    },
  }),
  useShow: () => ({ queryResult: mockQueryResult }),
  useCustom: () => ({
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@refinedev/antd", () => ({
  Show: ({
    children,
    title,
    headerButtons,
  }: {
    children: ReactNode;
    title?: ReactNode;
    headerButtons?: ReactNode;
  }) => (
    <div data-testid="show-container">
      <div data-testid="show-header">{title}</div>
      <div data-testid="show-buttons">{headerButtons}</div>
      <div data-testid="show-content">{children}</div>
    </div>
  ),
  ListButton: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  EditButton: ({ children }: { children: ReactNode }) => (
    <button data-testid="edit-btn">{children}</button>
  ),
  DeleteButton: () => <button data-testid="delete-btn">Xóa</button>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/features/terminals/components/TerminalContainersTab", () => ({
  TerminalContainersTab: ({ terminalId }: { terminalId: string }) => (
    <div data-testid="mock-terminal-containers-tab">Containers at {terminalId}</div>
  ),
}));

describe("TerminalShow — Màn hình chi tiết Terminal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.isError = false;
    mockQueryResult.isLoading = false;
    mockQueryResult.data = { data: sampleTerminal };
    permissions.canEdit = true;
    permissions.canDelete = true;
  });

  it("hiển thị đầy đủ thông tin chi tiết bến bãi, địa chỉ, mã UN/LOCODE", () => {
    render(<TerminalShow />);

    expect(
      screen.getAllByText("Port of New York and New Jersey").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("USNYC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1 Terminal Way")).toBeInTheDocument();
    expect(screen.getByText("Berth 22")).toBeInTheDocument();
    expect(screen.getByText("Newark")).toBeInTheDocument();
    expect(screen.getByText("NJ")).toBeInTheDocument();
    expect(screen.getByText("07114")).toBeInTheDocument();
    expect(screen.getByText("Main container terminal gate 3")).toBeInTheDocument();
  });

  it("hiển thị các tab 'Thông tin chi tiết' và 'Containers tại bến'", () => {
    render(<TerminalShow />);

    expect(screen.getByText("Thông tin chi tiết")).toBeInTheDocument();
    expect(
      screen.getByText("Containers tại bến (Containers at Terminal)")
    ).toBeInTheDocument();
  });

  it("hiển thị nút Sửa và Xóa khi có quyền", () => {
    permissions.canEdit = true;
    permissions.canDelete = true;
    render(<TerminalShow />);

    expect(screen.getByTestId("edit-btn")).toBeInTheDocument();
    expect(screen.getByTestId("delete-btn")).toBeInTheDocument();
  });

  it("ẩn nút Sửa hoặc Xóa khi người dùng không có quyền (ví dụ vai trò DRIVER)", () => {
    permissions.canEdit = false;
    permissions.canDelete = false;
    render(<TerminalShow />);

    expect(screen.queryByTestId("edit-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-btn")).not.toBeInTheDocument();
  });

  it("hiển thị thông báo lỗi khi không thể tải dữ liệu", () => {
    mockQueryResult.isError = true;
    mockQueryResult.error = { message: "Terminal 404 Not Found" };
    render(<TerminalShow />);

    expect(
      screen.getByText("Không thể tải thông tin bến bãi (Terminal)")
    ).toBeInTheDocument();
    expect(screen.getByText("Terminal 404 Not Found")).toBeInTheDocument();
  });
});
