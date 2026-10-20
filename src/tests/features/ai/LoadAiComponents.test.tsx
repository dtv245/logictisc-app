import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp, ConfigProvider } from "antd";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initializeAppI18n } from "@/locales";

import { aiQueryKeys } from "@/api/ai/ai.api";
import { LoadAiPanel } from "@/components/ai/LoadAiPanel";
import { LoadAiGapsSection } from "@/components/ai/LoadAiGapsSection";
import { LoadAiDispatchSection } from "@/components/ai/LoadAiDispatchSection";
import { LoadAiOverviewCell } from "@/components/ai/LoadAiOverviewCell";
import { AiGapChatWidget } from "@/components/ai/AiGapChatWidget";
import { TableDataContext } from "@/components/TableDataContext";
import type {
  AiDispatchCandidate,
  AiFeatures,
  AiGap,
  LoadAiDispatchResponse,
  LoadAiOverviewItem,
} from "@/api/ai/ai.types";

let currentMockTenant = "tenant-a";
vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({
    tenant: { tenantKey: currentMockTenant, name: "Test Tenant" },
  }),
}));

let currentFeatures: AiFeatures = { enabled: true, dryRun: false };
let currentGapsMap: Record<string, AiGap[]> = {};
let currentDispatchMap: Record<string, LoadAiDispatchResponse> = {};
let simulateFeasibilityFailed = false;

function getOrCreateTestGaps(loadId: string): AiGap[] {
  if (!currentGapsMap[loadId]) {
    currentGapsMap[loadId] = [
      {
        id: `gap-${loadId}-pickup`,
        loadId,
        severity: "blocking",
        status: "open",
        fieldName: "pickupAppointmentDate",
        fieldKey: "pickupAppointmentDate",
        fieldLabel: "Ngày hẹn lấy hàng",
        questionNatural: "Đơn hàng chưa có ngày hẹn lấy hàng. Dự kiến lấy hàng vào thời gian nào?",
        askCount: 1,
        maxAsks: 3,
        lastAskedAt: new Date().toISOString(),
      },
      {
        id: `gap-${loadId}-notes`,
        loadId,
        severity: "warning",
        status: "open",
        fieldName: "specialInstructions",
        fieldKey: "specialInstructions",
        fieldLabel: "Ghi chú bốc xếp",
        questionNatural: "Có yêu cầu nâng hạ hay dụng cụ bảo hộ đặc biệt tại kho giao không?",
        askCount: 1,
        maxAsks: 3,
        lastAskedAt: new Date().toISOString(),
      },
    ];
  }
  return currentGapsMap[loadId];
}

vi.mock("@/api/ai/ai.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/ai/ai.api")>();
  return {
    ...actual,
    fetchAiFeatures: vi.fn(async () => currentFeatures),
    fetchLoadAiGaps: vi.fn(async (loadId: string) => ({
      loadId,
      aiState: "idle",
      nextRunAt: null,
      capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
      gaps: currentGapsMap[loadId] ?? getOrCreateTestGaps(loadId),
    })),
    dismissAiGap: vi.fn(async (loadId: string, gapId: string, payload: { reason: string }) => {
      const gaps = currentGapsMap[loadId] ?? [];
      const target = gaps.find((g) => g.id === gapId);
      if (target) {
        target.status = "dismissed";
        target.dismissReason = payload.reason;
      }
      return target;
    }),
    fetchLoadAiDispatch: vi.fn(async (loadId: string) => {
      return (
        currentDispatchMap[loadId] ?? {
          loadId,
          dispatchState: "not_started",
          blockingGapCount: 0,
          rankingSource: "llm",
          suggestions: [],
          capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        }
      );
    }),
    approveAiDispatchSuggestion: vi.fn(async (_loadId: string, suggestionId: string) => {
      if (simulateFeasibilityFailed) {
        const err = {
          code: "FEASIBILITY_FAILED",
          message: "Feasibility check failed",
          details: { reasons: ["Tài xế vừa nhận một chuyến hàng khẩn cấp khác"] },
        };
        throw err;
      }
      return { id: suggestionId, status: "executed" };
    }),
    rejectAiDispatchSuggestion: vi.fn(async (_loadId: string, suggestionId: string, payload: { reason: string }) => {
      return { id: suggestionId, status: "rejected", rejectReason: payload.reason };
    }),
    fetchLoadsAiOverview: vi.fn(async (loadIds: string[]) => {
      const res: Record<string, LoadAiOverviewItem> = {};
      for (const id of loadIds) {
        res[id] = {
          loadId: id,
          blockingGaps: 0,
          blockingGapsCount: 0,
          warningGaps: 0,
          warningGapsCount: 0,
          dispatchState: "ready",
          dispatchStatus: "SUGGESTED",
        };
      }
      return res;
    }),
  };
});

function resetTestStore() {
  currentFeatures = { enabled: true, dryRun: false };
  currentGapsMap = {};
  currentDispatchMap = {};
  simulateFeasibilityFailed = false;
  currentMockTenant = "tenant-a";
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("logistics_force_ai_gap");
  }
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: ReactNode, client = createTestQueryClient()) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <ConfigProvider theme={{ token: { motion: false } }}>
            <AntdApp>{ui}</AntdApp>
          </ConfigProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("AI Components Integration & Unit Tests", () => {
  beforeAll(async () => {
    await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
  });

  beforeEach(() => {
    resetTestStore();
  });

  describe("1. Feature Flag & dryRun", () => {
    it("khi cờ tính năng tắt: toàn bộ UI AI không render", async () => {
      currentFeatures = { enabled: false, dryRun: false };

      const { container } = renderWithProviders(<LoadAiPanel loadId="load-test-disabled" />);

      await waitFor(() => {
        expect(container.querySelector("[data-testid='load-ai-panel']")).toBeNull();
      });
      expect(screen.queryByText(/Trợ lý AI LogisticsX/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/AI hỏi/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/AI điều phối/i)).not.toBeInTheDocument();
    });

    it("khi cờ bật với dryRun=true: hiển thị banner chế độ thử", async () => {
      currentFeatures = { enabled: true, dryRun: true };

      renderWithProviders(<LoadAiPanel loadId="load-test-dryrun" />);

      expect(
        await screen.findByText(/Chế độ thử: AI chỉ tính toán, chưa gửi tin ra ngoài/i),
      ).toBeInTheDocument();
    });
  });

  describe("2. Khu AI hỏi (LoadAiGapsSection)", () => {
    it("hiển thị đúng 2 nhóm gap chặn và cảnh báo, đủ nhãn và câu hỏi", async () => {
      const loadId = "load-gaps-test";
      getOrCreateTestGaps(loadId);

      renderWithProviders(<LoadAiPanel loadId={loadId} />);

      expect(await screen.findByText(/AI Hỏi & Kiểm Tra Thông Tin/i)).toBeInTheDocument();

      // Kiểm tra 2 nhóm
      expect(screen.getByText(/Thông tin chặn điều phối/i)).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo & Khuyến nghị/i)).toBeInTheDocument();

      // Gap chặn: Ngày hẹn lấy hàng
      expect(screen.getByText("Ngày hẹn lấy hàng")).toBeInTheDocument();
      expect(
        screen.getByText(/Đơn hàng chưa có ngày hẹn lấy hàng/i),
      ).toBeInTheDocument();

      // Gap chặn không có nút Bỏ qua
      const blockingCard = screen.getByText("Ngày hẹn lấy hàng").closest(".ant-card");
      expect(blockingCard).toBeInTheDocument();
      expect(within(blockingCard as HTMLElement).queryByText("Bỏ qua")).not.toBeInTheDocument();
    });

    it("disables Fill while the runtime Load editor contract is unavailable", async () => {
      const loadId = "load-edit-gated";
      const gaps = getOrCreateTestGaps(loadId);
      gaps[0] = { ...gaps[0]!, fieldName: "requestedPickupDate", fieldKey: "requestedPickupDate" };

      renderWithProviders(<LoadAiGapsSection loadId={loadId} />);

      expect(await screen.findByTestId(`fill-gap-btn-gap-${loadId}-pickup`)).toBeDisabled();
      expect(screen.getByText("Màn chỉnh sửa Load chưa khả dụng trong runtime hiện tại.")).toBeInTheDocument();
    });

    it("gap warning có nút Bỏ qua; bắt buộc lý do; bỏ qua thành công", async () => {
      const loadId = "load-warning-dismiss";
      getOrCreateTestGaps(loadId);

      renderWithProviders(<LoadAiPanel loadId={loadId} />);

      const dismissButtons = await screen.findAllByRole("button", { name: /Bỏ qua/i });
      expect(dismissButtons.length).toBeGreaterThan(0);

      // Mở dialog bỏ qua
      fireEvent.click(dismissButtons[0]);

      expect(
        await screen.findByText(/Bỏ qua cảnh báo thông tin/i),
      ).toBeInTheDocument();

      // Nút xác nhận mặc định bị disabled khi lý do rỗng
      const confirmButton = screen.getByRole("button", { name: /Xác nhận bỏ qua/i });
      expect(confirmButton).toBeDisabled();

      // Nhập khoảng trắng vẫn disabled
      const input = screen.getByPlaceholderText(/Ví dụ: Đã thỏa thuận riêng với khách hàng/i);
      fireEvent.change(input, { target: { value: "   " } });
      expect(confirmButton).toBeDisabled();

      // Nhập lý do hợp lệ
      fireEvent.change(input, {
        target: { value: "Khách đã gửi hóa đơn bổ sung qua Zalo" },
      });
      expect(confirmButton).not.toBeDisabled();

      // Xác nhận bỏ qua
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(/Bỏ qua cảnh báo thông tin/i)).not.toBeInTheDocument();
      });
    });

    it("gap needs_human hiển thị nhãn trạng thái riêng", async () => {
      const loadId = "load-h-1";
      const mockGaps: AiGap[] = [
        {
          id: "gap-human-1",
          loadId,
          severity: "blocking",
          status: "needs_human",
          fieldKey: "rate",
          fieldLabel: "Cước vận chuyển",
          question: "Đơn giá chưa khớp với hợp đồng khung?",
          askCount: 3,
          maxAsks: 3,
          lastAskedAt: new Date().toISOString(),
          assignedTo: "dispatcher_1",
        },
      ];

      currentGapsMap[loadId] = mockGaps;

      renderWithProviders(<LoadAiGapsSection loadId={loadId} />);

      expect(await screen.findByText("Cần người xử lý")).toBeInTheDocument();
      expect(screen.getByText("Cước vận chuyển")).toBeInTheDocument();
    });
  });

  describe("3. Khu AI điều phối (LoadAiDispatchSection)", () => {
    it("khi dispatchState = blocked_by_gap: hiển thị cảnh báo chặn kèm link/chú thích", async () => {
      const loadId = "load-blocked";
      const blockedDispatch: LoadAiDispatchResponse = {
        loadId,
        dispatchState: "blocked_by_gap",
        blockingGapCount: 2,
        rankingSource: "llm",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: [],
      };

      currentDispatchMap[loadId] = blockedDispatch;

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      expect(
        await screen.findByText(/Còn 2 thông tin chặn/i),
      ).toBeInTheDocument();
      expect(screen.getByTestId("link-to-gaps-btn")).toBeInTheDocument();
    });

    it("khi dispatchState = ready: hiển thị ứng viên với đủ 4 tiện ích có số + chữ và nhãn HITL", async () => {
      const loadId = "load-ready";
      const sampleCandidates: AiDispatchCandidate[] = [
        {
          id: "cand-1",
          rank: 1,
          truckId: "truck-29C",
          truckNumber: "29C-88888",
          driverId: "driver-nguyen",
          driverName: "Nguyễn Văn Tuấn",
          score: 95.5,
          utilities: {
            margin: { score: 92, displayValue: "92/100" },
            onTime: { score: 98, displayValue: "98/100" },
            deadhead: { score: 90, displayValue: "90/100" },
            hos: { score: 100, displayValue: "100/100" },
          },
          confidenceScore: 94,
          reasoning: "Tối ưu lộ trình và tài xế còn nhiều giờ HOS hợp lệ",
          status: "pending",
        },
      ];

      const readyDispatch: LoadAiDispatchResponse = {
        loadId,
        dispatchState: "ready",
        blockingGapCount: 0,
        rankingSource: "llm",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: sampleCandidates,
        activeSuggestionId: "cand-1",
      };

      currentDispatchMap[loadId] = readyDispatch;

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      expect(await screen.findByText("29C-88888")).toBeInTheDocument();
      expect(screen.getByText(/Nguyễn Văn Tuấn/i)).toBeInTheDocument();
      expect(screen.getByText(/Điểm: 95.5\/100/i)).toBeInTheDocument();

      // 4 tiện ích có cả số + chữ
      expect(screen.getByText(/Margin/i)).toBeInTheDocument();
      expect(screen.getByText(/On-time/i)).toBeInTheDocument();
      expect(screen.getByText(/Deadhead/i)).toBeInTheDocument();
      expect(screen.getAllByText(/HOS/i).length).toBeGreaterThan(0);

      // Nhãn HITL
      expect(
        screen.getByText(/Human-in-the-Loop/i),
      ).toBeInTheDocument();

      // Tuyệt đối không có UI autonomous
      expect(screen.queryByText(/Autonomous/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tự động gán/i)).not.toBeInTheDocument();
    });

    it("Approve: mở dialog xác nhận gán chuyến thật; xử lý lỗi 409 FEASIBILITY_FAILED", async () => {
      const loadId = "load-feasibility-error";
      simulateFeasibilityFailed = true;

      const readyDispatch: LoadAiDispatchResponse = {
        loadId,
        dispatchState: "ready",
        blockingGapCount: 0,
        rankingSource: "llm",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: [
          {
            id: "cand-err",
            rank: 1,
            truckId: "truck-29C",
            truckNumber: "29C-88888",
            driverId: "driver-1",
            driverName: "Nguyễn Văn Tuấn",
            score: 95,
            utilities: {
              margin: { score: 90, displayValue: "90/100" },
              onTime: { score: 95, displayValue: "95/100" },
              deadhead: { score: 90, displayValue: "90/100" },
              hos: { score: 95, displayValue: "95/100" },
            },
            confidenceScore: 90,
            reasoning: "Tối ưu",
            status: "pending",
          },
        ],
      };
      currentDispatchMap[loadId] = readyDispatch;

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      // Tìm nút Phê duyệt
      const approveBtn = await screen.findByRole("button", { name: /Phê duyệt/i });
      fireEvent.click(approveBtn);

      // Kiểm tra dialog xác nhận nêu rõ xe + tài xế và cảnh báo gán chuyến thật
      expect(
        await screen.findByText(/Xác nhận phê duyệt điều phối/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/tạo chuyến vận tải/i),
      ).toBeInTheDocument();

      // Bấm xác nhận trong dialog
      const confirmApproveBtn = screen.getByRole("button", { name: /Xác nhận gán chuyến thật/i });
      fireEvent.click(confirmApproveBtn);

      // Xử lý 409 FEASIBILITY_FAILED: hiển thị lý do tiếng Việt rõ ràng
      expect(
        await screen.findByText(/Không thể phê duyệt do vi phạm điều kiện khả thi/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Tài xế vừa nhận một chuyến hàng khẩn cấp khác/i),
      ).toBeInTheDocument();
    });

    it("Reject: dialog kiểm tra độ dài 3-500 ký tự ở client trước khi gọi API", async () => {
      const loadId = "load-reject-test";

      const readyDispatch: LoadAiDispatchResponse = {
        loadId,
        dispatchState: "ready",
        blockingGapCount: 0,
        rankingSource: "llm",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: [
          {
            id: "cand-rej",
            rank: 1,
            truckId: "truck-29C",
            truckNumber: "29C-88888",
            driverId: "driver-1",
            driverName: "Nguyễn Văn Tuấn",
            score: 90,
            utilities: {
              margin: { score: 90, displayValue: "90/100" },
              onTime: { score: 90, displayValue: "90/100" },
              deadhead: { score: 90, displayValue: "90/100" },
              hos: { score: 90, displayValue: "90/100" },
            },
            confidenceScore: 90,
            reasoning: "Tối ưu",
            status: "pending",
          },
        ],
      };
      currentDispatchMap[loadId] = readyDispatch;

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      const rejectBtn = await screen.findByRole("button", { name: /Từ chối/i });
      fireEvent.click(rejectBtn);

      expect(
        await screen.findByText(/Từ chối phương án điều phối/i),
      ).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Ví dụ: Xe này đang cần ưu tiên/i);
      const submitRejectBtn = screen.getByRole("button", { name: /Gửi từ chối/i });

      // Nhập 2 ký tự (< 3)
      fireEvent.change(textarea, { target: { value: "ab" } });
      fireEvent.click(submitRejectBtn);

      // Hiện cảnh báo validation phía client
      expect(
        await screen.findByText(/Lý do phải có ít nhất 3 ký tự/i),
      ).toBeInTheDocument();

      // Nhập lý do hợp lệ >= 3 ký tự
      fireEvent.change(textarea, {
        target: { value: "Tài xế xin nghỉ phép đột xuất do việc gia đình" },
      });
      fireEvent.click(submitRejectBtn);

      // Modal đóng lại
      await waitFor(() => {
        expect(screen.queryByText(/Từ chối phương án điều phối/i)).not.toBeInTheDocument();
      });
    });

    it("gợi ý hết hạn: nút Approve bị vô hiệu hoá", async () => {
      const loadId = "load-expired";
      const expiredCandidates: AiDispatchCandidate[] = [
        {
          id: "cand-expired",
          rank: 1,
          truckId: "truck-01",
          truckNumber: "29C-00001",
          driverId: "driver-01",
          driverName: "Trần Văn C",
          score: 80,
          utilities: {
            margin: { score: 80, displayValue: "80/100" },
            onTime: { score: 80, displayValue: "80/100" },
            deadhead: { score: 80, displayValue: "80/100" },
            hos: { score: 80, displayValue: "80/100" },
          },
          confidenceScore: 80,
          reasoning: "Gợi ý đã hết hạn do tài xế thay đổi ca trực",
          status: "pending",
        },
      ];

      const readyDispatchWithExpired: LoadAiDispatchResponse = {
        loadId,
        dispatchState: "ready",
        blockingGapCount: 0,
        rankingSource: "optimization_fallback",
        expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: expiredCandidates,
        activeSuggestionId: "cand-expired",
      };

      currentDispatchMap[loadId] = readyDispatchWithExpired;

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      const approveBtn = await screen.findByRole("button", { name: /Phê duyệt/i });
      expect(approveBtn).toBeDisabled();
      expect(screen.getByText("Gợi ý đã hết hạn")).toBeInTheDocument();
    });
  });

  describe("4. An toàn nội dung (XSS Prevention)", () => {
    it("mô phỏng chuỗi độc hại trong câu hỏi và lý do, xác nhận render dạng text thuần", async () => {
      const maliciousScript = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
      const loadId = "load-malicious";

      const maliciousGaps: AiGap[] = [
        {
          id: "gap-xss",
          loadId,
          severity: "blocking",
          status: "open",
          fieldKey: "specialInstructions",
          fieldLabel: "Ghi chú đặc biệt",
          question: `Câu hỏi nguy hiểm: ${maliciousScript}`,
          askCount: 1,
          maxAsks: 3,
          lastAskedAt: new Date().toISOString(),
          assignedTo: "dispatcher_1",
        },
      ];

      currentGapsMap[loadId] = maliciousGaps;

      const { container } = renderWithProviders(<LoadAiGapsSection loadId={loadId} />);

      expect(
        await screen.findByText(/Câu hỏi nguy hiểm/i),
      ).toBeInTheDocument();

      // Chuỗi thẻ script và img không được tạo thành DOM elements thật sự
      expect(container.querySelector("script")).toBeNull();
      expect(container.querySelector("img[src='x']")).toBeNull();
    });
  });

  describe("5. Độc lập cache giữa hai tenant", () => {
    it("sinh queryKey khác nhau khi tenant thay đổi, tránh rò rỉ cache", () => {
      const keyTenantA = aiQueryKeys.overview("tenant-alpha", ["1", "2"]);
      const keyTenantB = aiQueryKeys.overview("tenant-beta", ["1", "2"]);

      expect(keyTenantA).not.toEqual(keyTenantB);
      expect(keyTenantA).toContain("tenant-alpha");
      expect(keyTenantB).toContain("tenant-beta");

      const gapsKeyA = aiQueryKeys.loadGaps("tenant-alpha", "load-100");
      const gapsKeyB = aiQueryKeys.loadGaps("tenant-beta", "load-100");
      expect(gapsKeyA).not.toEqual(gapsKeyB);
    });
  });

  describe("6. Load List AI Overview Batching", () => {
    it("nhiều cell trên một trang chỉ dùng chung 1 mảng ID từ TableDataContext", async () => {
      const mockTableData = [
        { id: "101", number: "L-101" },
        { id: "102", number: "L-102" },
        { id: "103", number: "L-103" },
      ];

      renderWithProviders(
        <TableDataContext.Provider value={mockTableData}>
          <table>
            <tbody>
              <tr>
                <td>
                  <LoadAiOverviewCell loadId="101" />
                </td>
                <td>
                  <LoadAiOverviewCell loadId="102" />
                </td>
                <td>
                  <LoadAiOverviewCell loadId="103" />
                </td>
              </tr>
            </tbody>
          </table>
        </TableDataContext.Provider>,
      );

      // Cả 3 cell cùng nhận dữ liệu từ batch call và render badge
      expect(await screen.findByTestId("load-ai-badge-101")).toBeInTheDocument();
      expect(await screen.findByTestId("load-ai-badge-102")).toBeInTheDocument();
      expect(await screen.findByTestId("load-ai-badge-103")).toBeInTheDocument();
    });
  });

  describe("7. Khung chat AI GAP bật bằng button ở góc tay phải", () => {
    it("hiển thị floating button AI GAP và mở/đóng khung chat khi click", async () => {
      renderWithProviders(<AiGapChatWidget />);

      // Nút bật ở góc tay phải xuất hiện và chuyển sang trạng thái enabled
      await waitFor(() => {
        const btn = screen.getByTestId("ai-gap-chat-button");
        expect(btn).not.toBeDisabled();
      });

      const chatButton = screen.getByTestId("ai-gap-chat-button");
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveTextContent(/AI GAP/i);

      // Ban đầu khung chat đóng
      expect(screen.queryByTestId("ai-gap-chat-window")).not.toBeInTheDocument();

      // Click nút -> Mở khung chat
      fireEvent.click(chatButton);

      expect(await screen.findByTestId("ai-gap-chat-window")).toBeInTheDocument();
      expect(screen.getAllByText(/Trợ lý AI GAP/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Đây là hội thoại mẫu/i)).toBeInTheDocument();
      expect(screen.getByText(/không được gửi tới nhà cung cấp AI/i)).toBeInTheDocument();

      // Click nút đóng -> Khung chat đóng lại
      const closeButton = screen.getByTestId("ai-gap-chat-close-button");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("ai-gap-chat-window")).not.toBeInTheDocument();
      });
    });

    it("khi AI tắt: ở môi trường dev hiển thị nút xám kèm lý do minh bạch", async () => {
      currentFeatures = { enabled: false, dryRun: false };

      renderWithProviders(<AiGapChatWidget />);

      // Ở môi trường dev vẫn hiển thị nút để không phải đoán nguyên nhân
      const chatButton = await screen.findByTestId("ai-gap-chat-button");
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toBeDisabled();
      expect(chatButton).toHaveTextContent(/AI GAP \(Tắt\)/i);
      expect(chatButton).toHaveAttribute(
        "data-disabled-reason",
        expect.stringMatching(/app.ai.gap-enabled|chưa được kích hoạt/i),
      );
      expect(screen.getByText(/Bật test AI/i)).toBeInTheDocument();
    });

    it("gắn nhãn rõ phản hồi chat mẫu và không giả nhận đã phân tích dữ liệu thật", async () => {
      renderWithProviders(<AiGapChatWidget />);

      await waitFor(() => {
        const btn = screen.getByTestId("ai-gap-chat-button");
        expect(btn).not.toBeDisabled();
      });

      const chatButton = screen.getByTestId("ai-gap-chat-button");
      fireEvent.click(chatButton);

      expect(await screen.findByTestId("ai-gap-chat-window")).toBeInTheDocument();

      // Nhập câu hỏi vào ô chat
      const input = screen.getByPlaceholderText(/Hỏi về Load, dữ liệu còn thiếu hoặc lộ trình/i);
      fireEvent.change(input, {
        target: { value: "Kiểm tra các thông tin thiếu trên đơn hàng" },
      });

      // Nhấn nút gửi
      const sendButton = screen.getByTestId("ai-gap-chat-send-button");
      fireEvent.click(sendButton);

      // Tin nhắn người dùng xuất hiện
      expect(
        await screen.findByText("Kiểm tra các thông tin thiếu trên đơn hàng"),
      ).toBeInTheDocument();

      expect(await screen.findByText(/Đây là câu trả lời mẫu/i)).toBeInTheDocument();
      expect(screen.getAllByText(/DEMO/i).length).toBeGreaterThan(0);
      expect(screen.queryByText("Kết quả Rà soát Thông tin Chuyến hàng")).not.toBeInTheDocument();
    });

    it("không hiển thị affordance chat chưa có handler hoặc báo thành công giả", async () => {
      renderWithProviders(<AiGapChatWidget />);
      await waitFor(() => expect(screen.getByTestId("ai-gap-chat-button")).not.toBeDisabled());
      fireEvent.click(screen.getByTestId("ai-gap-chat-button"));
      expect(await screen.findByTestId("ai-gap-chat-window")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /share|voice input|web search/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/copied.*share|đã sao chép.*chia sẻ/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Xóa ngữ cảnh chat" })).toBeInTheDocument();
    });

    it("cho phép người dùng bấm Bật test AI khi tính năng tắt để trải nghiệm trực tiếp", async () => {
      currentFeatures = { enabled: false, dryRun: false };

      renderWithProviders(<AiGapChatWidget />);

      const testBtn = await screen.findByText(/Bật test AI/i);
      fireEvent.click(testBtn);

      // Nút AI GAP chuyển sang trạng thái kích hoạt
      await waitFor(() => {
        const chatButton = screen.getByTestId("ai-gap-chat-button");
        expect(chatButton).not.toBeDisabled();
      });
    });

    it("cho phép mở khung chat thông qua sự kiện toggle-ai-gap-chat từ app-sider__logo", async () => {
      renderWithProviders(<AiGapChatWidget />);

      expect(screen.queryByTestId("ai-gap-chat-window")).not.toBeInTheDocument();

      // Mô phỏng click vào app-sider__logo phát sự kiện toggle-ai-gap-chat
      window.dispatchEvent(new CustomEvent("toggle-ai-gap-chat"));

      expect(await screen.findByTestId("ai-gap-chat-window")).toBeInTheDocument();
      expect(screen.getAllByText(/Trợ lý AI GAP/i).length).toBeGreaterThan(0);
    });
  });
});
