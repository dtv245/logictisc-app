import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refineCore from "@refinedev/core";
import {
  CONTAINER_CONTRACT_CONFIRMED,
  TerminalContainersTab,
} from "@/features/terminals/components/TerminalContainersTab";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import type { Container } from "@/types/containers/container.types";

const access = vi.hoisted(() => ({ can: true, isLoading: false }));

vi.mock("@refinedev/core", () => ({
  useCustom: vi.fn(),
  useCan: () => ({ data: { can: access.can }, isLoading: access.isLoading }),
}));

describe("TerminalContainersTab — Tab containers tại bến", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.can = true;
    access.isLoading = false;
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

  const page = (items: Container[], totalItems = items.length) => ({
    data: {
      data: {
        items,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / DEFAULT_LIST_PAGE_SIZE)),
        currentPage: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        hasNext: totalItems > DEFAULT_LIST_PAGE_SIZE,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });

  it("enables the verified BE-032 query with server pagination params", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page(mockContainers) as unknown as ReturnType<typeof refineCore.useCustom>,
    );

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(CONTAINER_CONTRACT_CONFIRMED).toBe(true);
    expect(refineCore.useCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/containers",
        method: "get",
        config: {
          query: {
            currentTerminalId: "term-123",
            page: 1,
            pageSize: DEFAULT_LIST_PAGE_SIZE,
            orderBy: "number",
            descending: false,
          },
        },
        queryOptions: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it("reads the page from the URL and sends it to the backend", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page(mockContainers) as unknown as ReturnType<typeof refineCore.useCustom>,
    );

    render(
      <MemoryRouter
        initialEntries={[
          "/terminals/term-123?terminalContainersTerminalId=term-123&terminalContainersPage=3&terminalContainersPageSize=20",
        ]}
      >
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(refineCore.useCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          query: {
            currentTerminalId: "term-123",
            page: 3,
            pageSize: 20,
            orderBy: "number",
            descending: false,
          },
        },
      }),
    );
  });

  it("shows a loading state while the container page is being fetched", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    const { container } = render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(container.querySelector(".ant-spin-spinning")).not.toBeNull();
  });

  it("renders the PagedResponse items", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page(mockContainers) as unknown as ReturnType<typeof refineCore.useCustom>,
    );

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(screen.getByText("MSCU1234567")).toBeInTheDocument();
    expect(screen.getByText("40HC")).toBeInTheDocument();
    expect(screen.getByText("loaded")).toBeInTheDocument();
    expect(screen.getByText(/28\.500 kg|28,500 kg/)).toBeInTheDocument();
    expect(screen.getByText("SEAL-9876")).toBeInTheDocument();
    expect(screen.getByText("TGHU7654321")).toBeInTheDocument();
  });

  it("uses the server total, not the current page length, for pagination", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page(mockContainers, 40) as unknown as ReturnType<
        typeof refineCore.useCustom
      >,
    );

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    // 40 rows at the default page size yields a second page control.
    expect(screen.getByTitle("2")).toBeInTheDocument();
  });

  it("does not invent a second page when the server total fits one page", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page(mockContainers, 2) as unknown as ReturnType<
        typeof refineCore.useCustom
      >,
    );

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(screen.queryByTitle("2")).not.toBeInTheDocument();
  });

  it("hiển thị thông báo khi không có container nào lưu bãi", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue(
      page([], 0) as unknown as ReturnType<typeof refineCore.useCustom>,
    );

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Hiện không có container nào đang lưu bãi tại bến này"),
    ).toBeInTheDocument();
  });

  it("hiển thị Alert thông tin khi API gặp lỗi", () => {
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: "Network Error 500" },
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Không tải được danh sách Container tại bến"),
    ).toBeInTheDocument();
    expect(screen.getByText(/không thành công/)).toBeInTheDocument();
    expect(screen.getByText(/Network Error 500/)).toBeInTheDocument();
  });

  it("không gửi request container khi vai trò không có quyền đọc bến bãi", () => {
    access.can = false;
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustom>);

    render(
      <MemoryRouter>
        <TerminalContainersTab terminalId="term-123" />
      </MemoryRouter>,
    );

    expect(refineCore.useCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({ enabled: false }),
      }),
    );
    expect(
      screen.getByText(/không có quyền|do not have permission/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("MSCU1234567")).not.toBeInTheDocument();
  });
});
