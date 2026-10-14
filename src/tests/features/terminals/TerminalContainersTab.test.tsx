import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refineCore from "@refinedev/core";
import { TerminalContainersTab } from "@/features/terminals/components/TerminalContainersTab";
import type { Container } from "@/types/container.types";

vi.mock("@refinedev/core", () => ({
  useCustom: vi.fn(),
}));

describe("TerminalContainersTab — Tab containers tại bến", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContainers: Container[] = [
    {
      id: "cont-1",
      number: "MSCU1234567",
      isoType: "40HC",
      status: "loaded",
      grossWeight: 28500,
      sealNumber: "SEAL-9876",
      currentTerminalId: "term-123",
      notes: "Cont hàng lạnh xuất khẩu",
      isLaden: true,
      createdAt: "2026-10-14T08:00:00Z",
    },
    {
      id: "cont-2",
      number: "TGHU7654321",
      isoType: "20GP",
      status: "empty",
      grossWeight: 2200,
      sealNumber: null,
      currentTerminalId: "term-123",
      notes: null,
      isLaden: false,
      createdAt: "2026-10-14T08:00:00Z",
    },
  ];

  it("gọi useCustom với url '/api/containers' và param currentTerminalId", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: { items: mockContainers } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<TerminalContainersTab terminalId="term-123" />);

    expect(refineCore.useCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/containers",
        method: "get",
        config: {
          query: {
            currentTerminalId: "term-123",
          },
        },
      })
    );
  });

  it("hiển thị danh sách container trong bảng khi API trả về dữ liệu dạng envelope { items: [...] }", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: { items: mockContainers } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<TerminalContainersTab terminalId="term-123" />);

    expect(screen.getByText("MSCU1234567")).toBeInTheDocument();
    expect(screen.getByText("40HC")).toBeInTheDocument();
    expect(screen.getByText("loaded")).toBeInTheDocument();
    expect(screen.getByText(/28\.500 kg|28,500 kg/)).toBeInTheDocument();
    expect(screen.getByText("SEAL-9876")).toBeInTheDocument();
    expect(screen.getByText("Cont hàng lạnh xuất khẩu")).toBeInTheDocument();

    expect(screen.getByText("TGHU7654321")).toBeInTheDocument();
    expect(screen.getByText("20GP")).toBeInTheDocument();
  });

  it("hiển thị danh sách container khi API trả về trực tiếp mảng Container[]", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: mockContainers },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<TerminalContainersTab terminalId="term-123" />);

    expect(screen.getByText("MSCU1234567")).toBeInTheDocument();
    expect(screen.getByText("TGHU7654321")).toBeInTheDocument();
  });

  it("hiển thị thông báo khi không có container nào lưu bãi", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: { items: [] } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<TerminalContainersTab terminalId="term-123" />);

    expect(
      screen.getByText("Hiện không có container nào đang lưu bãi tại bến này")
    ).toBeInTheDocument();
  });

  it("hiển thị Alert thông tin hướng dẫn khi API gặp lỗi hoặc chưa sẵn sàng", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: "Network Error 404" },
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(<TerminalContainersTab terminalId="term-123" />);

    expect(screen.getByText("Thông tin Container tại bến")).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có dữ liệu hoặc API tra cứu container theo bến bãi/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Network Error 404/)).toBeInTheDocument();
  });
});
