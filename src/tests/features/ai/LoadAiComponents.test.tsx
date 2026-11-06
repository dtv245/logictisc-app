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
import { LoadAiDispatchSection } from "@/components/ai/LoadAiDispatchSection";
import { LoadAiOverviewCell } from "@/components/ai/LoadAiOverviewCell";
import { TableDataContext } from "@/components/TableDataContext";
import type {
  AiDispatchCandidate,
  AiFeatures,
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
let currentDispatchMap: Record<string, LoadAiDispatchResponse> = {};
let simulateFeasibilityFailed = false;

vi.mock("@/api/ai/ai.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/ai/ai.api")>();
  return {
    ...actual,
    fetchAiFeatures: vi.fn(async () => currentFeatures),
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
    startAiDispatchRun: vi.fn(async (loadId: string) => {
      const summary = "Lượt chạy đã kết thúc nhưng chưa đủ dữ liệu đã xác thực.";
      currentDispatchMap[loadId] = {
        loadId,
        dispatchState: "evidence_unavailable",
        blockingGapCount: 0,
        latestRunStatus: "FALLBACK",
        latestRunResultCode: "EVIDENCE_UNAVAILABLE",
        latestRunSummary: summary,
        capabilities: { canRerun: true, canApprove: false, canReject: false, canViewRuns: true },
        suggestions: [],
      };
      return {
        sessionId: "session-evidence-unavailable",
        status: "COMPLETED",
        runStatus: "FALLBACK",
        resultCode: "EVIDENCE_UNAVAILABLE",
        rankingSource: "evidence_unavailable",
        summary,
        suggestions: [],
      };
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
  currentDispatchMap = {};
  simulateFeasibilityFailed = false;
  currentMockTenant = "tenant-a";
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

  describe("2. Khu AI điều phối (LoadAiDispatchSection)", () => {
    it("khi dispatchState = blocked_by_gap: hiển thị cảnh báo trung tính", async () => {
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

      expect(await screen.findByText("Load thiếu dữ liệu bắt buộc")).toBeInTheDocument();
      expect(screen.queryByTestId("link-to-gaps-btn")).not.toBeInTheDocument();
    });

    it("shows the durable evidence-unavailable summary after loading status", async () => {
      const loadId = "load-evidence-unavailable";
      currentDispatchMap[loadId] = {
        loadId,
        dispatchState: "evidence_unavailable",
        blockingGapCount: 0,
        latestRunStatus: "FALLBACK",
        latestRunResultCode: "EVIDENCE_UNAVAILABLE",
        latestRunSummary: "Lượt chạy đã kết thúc nhưng chưa đủ dữ liệu đã xác thực.",
        capabilities: { canRerun: true, canApprove: false, canReject: false, canViewRuns: true },
        suggestions: [],
      };

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      expect(await screen.findByTestId("ai-evidence-unavailable-alert")).toBeInTheDocument();
      expect(screen.getByText("Lượt chạy đã kết thúc nhưng chưa đủ dữ liệu đã xác thực.")).toBeInTheDocument();
      expect(screen.queryByText(/Chưa khởi chạy gợi ý điều phối/i)).not.toBeInTheDocument();
    });

    it("keeps the evidence-unavailable summary visible after a completed run mutation", async () => {
      const loadId = "load-run-completed-without-evidence";
      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      fireEvent.click(await screen.findByTestId("ai-run-dispatch-btn"));

      const alert = await screen.findByTestId("ai-evidence-unavailable-alert");
      expect(alert).toBeInTheDocument();
      expect(within(alert).getByText("Lượt chạy đã kết thúc nhưng chưa đủ dữ liệu đã xác thực.")).toBeInTheDocument();
      expect(screen.queryByText(/Chưa khởi chạy gợi ý điều phối/i)).not.toBeInTheDocument();
    });

    it("uses neutral copy while dispatch is pending and shows missing evaluation fields", async () => {
      const pendingLoadId = "load-pending-neutral";
      currentDispatchMap[pendingLoadId] = {
        loadId: pendingLoadId,
        dispatchState: "pending",
        blockingGapCount: 0,
        capabilities: { canRerun: true, canApprove: false, canReject: false, canViewRuns: true },
        suggestions: [],
      };

      renderWithProviders(<LoadAiDispatchSection loadId={pendingLoadId} />);
      expect(await screen.findByText("Đang gửi yêu cầu điều phối…")).toBeInTheDocument();
      expect(screen.getByText("Đang kiểm tra dữ liệu khả dụng…")).toBeInTheDocument();
      expect(screen.queryByText(/đối soát thời gian lái xe HOS/i)).not.toBeInTheDocument();
    });

    it("shows missing score and rank as unverified rather than inventing values", async () => {
      const loadId = "load-missing-decision-evaluation";
      currentDispatchMap[loadId] = {
        loadId,
        dispatchState: "ready",
        blockingGapCount: 0,
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        suggestions: [{
          id: "decision-missing-evaluation",
          rank: null,
          truckId: "truck-1",
          truckNumber: "29C-11111",
          driverId: "driver-1",
          driverName: "Nguyễn Văn A",
          score: null,
          confidence: undefined,
          reasoning: "Chưa có đủ dữ liệu đánh giá.",
          status: "Suggested",
        }],
      };

      renderWithProviders(<LoadAiDispatchSection loadId={loadId} />);

      expect(await screen.findByText("Chưa đủ dữ liệu đánh giá")).toBeInTheDocument();
      expect(screen.getByText(/Tin cậy: Cần xác minh/)).toBeInTheDocument();
      expect(screen.getByText("Chưa xếp hạng")).toBeInTheDocument();
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

  describe("3. Độc lập cache giữa hai tenant", () => {
    it("sinh queryKey khác nhau khi tenant thay đổi, tránh rò rỉ cache", () => {
      const keyTenantA = aiQueryKeys.overview("tenant-alpha", ["1", "2"]);
      const keyTenantB = aiQueryKeys.overview("tenant-beta", ["1", "2"]);

      expect(keyTenantA).not.toEqual(keyTenantB);
      expect(keyTenantA).toContain("tenant-alpha");
      expect(keyTenantB).toContain("tenant-beta");

      const dispatchKeyA = aiQueryKeys.loadDispatch("tenant-alpha", "load-100");
      const dispatchKeyB = aiQueryKeys.loadDispatch("tenant-beta", "load-100");
      expect(dispatchKeyA).not.toEqual(dispatchKeyB);
    });
  });

  describe("4. Load List AI Overview Batching", () => {
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

});
