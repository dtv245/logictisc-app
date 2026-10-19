import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredAiSettings } from "@/features/ai-dispatch/hooks/aiConfigStorage";
import { AiDispatchPage } from "@/pages/ai-dispatch/AiDispatchPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";

import { initialMovementPlan } from "@/tests/fixtures/aiMovementPlan";

const session = vi.hoisted(() => ({ tenantKey: "tenant-finance" }));
vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({
    tenant: session.tenantKey ? { tenantKey: session.tenantKey } : null,
  }),
}));

vi.mock("@/features/ai-dispatch/api/aiDispatch.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/ai-dispatch/api/aiDispatch.api")>();
  return {
    ...actual,
    approveAiDispatchDecision: vi.fn(async (decisionId: string) => ({
      decisionId,
      rank: 1,
      truckId: "trk-1",
      driverId: "drv-1",
      score: 95,
      confidence: "HIGH",
      reasoning: "OK",
      status: "approved",
    })),
    rejectAiDispatchDecision: vi.fn(async (decisionId: string) => ({
      decisionId,
      rank: 1,
      truckId: "trk-1",
      driverId: "drv-1",
      score: 95,
      confidence: "HIGH",
      reasoning: "OK",
      status: "rejected",
    })),
    executeAiDispatchRun: vi.fn(async () => ({
      sessionId: "sess-1",
      status: "COMPLETED",
      mode: "HumanInTheLoop",
      summary: "Run complete",
      suggestions: [],
    })),
  };
});

vi.mock("@/features/ai-dispatch/hooks/useAiDispatchActions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/ai-dispatch/hooks/useAiDispatchActions")>();
  return {
    ...actual,
    useAiDispatchActions: (options?: Record<string, unknown>) =>
      actual.useAiDispatchActions({ initialPlans: [initialMovementPlan], ...options }),
  };
});

beforeEach(() => {
  session.tenantKey = "tenant-finance";
  localStorage.clear();
});

describe("AiDispatchPage — Màn hình AI Điều phối xe & Kế hoạch di chuyển", () => {
  it("hiển thị kế hoạch di chuyển do AI đề xuất với đầy đủ thông tin lộ trình, KPI và giải trình", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });

    // Tiêu đề trang
    expect(await screen.findByText("AI Smart Vehicle Dispatch")).toBeInTheDocument();

    // Thẻ tóm tắt Kế hoạch di chuyển
    expect(screen.getByText("AI Proposed Movement Plan")).toBeInTheDocument();
    expect(screen.getByText("Proposed")).toBeInTheDocument();

    // Các chỉ số KPI
    expect(screen.getByText("Total Distance")).toBeInTheDocument();
    expect(screen.getByText("245")).toBeInTheDocument();
    expect(screen.getByText(/Deadhead Reduction: -32%/)).toBeInTheDocument();
    expect(screen.getByText("Gross Margin")).toBeInTheDocument();
    expect(screen.getByText("770")).toBeInTheDocument();

    // Thông tin xe & tài xế
    expect(screen.getByText("Assigned Vehicle & Driver")).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Văn Hùng/)).toBeInTheDocument();

    // Lộ trình các chặng dừng
    expect(screen.getByText("Movement Plan Stops Sequence")).toBeInTheDocument();
    expect(screen.getAllByText(/Bến xe Tân Bình/)).toHaveLength(2);
    expect(screen.getByText(/Kho Tổng Sotrans Thủ Đức/)).toBeInTheDocument();
    expect(screen.getByText(/Nghỉ HOS bắt buộc/)).toBeInTheDocument();
    expect(screen.getByText(/Trung Tâm Phân Phối Mega Bình Dương/)).toBeInTheDocument();

    // Giải trình AI
    expect(screen.getByText("AI Reasoning & Analysis")).toBeInTheDocument();
    expect(screen.getByText(/giảm 32% quãng đường chạy rỗng/)).toBeInTheDocument();

    // Các nút thao tác duyệt
    expect(screen.getByRole("button", { name: /Approve Movement Plan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject Plan/i })).toBeInTheDocument();
  });

  it("cho phép người dùng phê duyệt kế hoạch di chuyển (Approve Movement Plan)", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });

    const approveBtn = await screen.findByRole("button", { name: /Approve Movement Plan/i });
    fireEvent.click(approveBtn);

    // Modal xác nhận duyệt xuất hiện
    expect(await screen.findByText("Confirm Movement Plan Approval")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to approve this movement plan/)).toBeInTheDocument();

    // Nhập ghi chú tùy chọn và nhấn duyệt
    const noteInput = screen.getByPlaceholderText(/Enter note for driver/i);
    fireEvent.change(noteInput, { target: { value: "Ưu tiên giao sớm trước 15:00" } });

    const confirmBtn = screen.getByRole("button", { name: "Approve Movement Plan" });
    fireEvent.click(confirmBtn);

    // Trạng thái chuyển thành Approved
    await waitFor(() => {
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    expect(screen.getByText("Movement plan approved successfully! Dispatch order is active.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /View Trip/i })).toBeInTheDocument();
  });

  it("cho phép người dùng từ chối kế hoạch di chuyển (Reject Plan) kèm lý do", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });

    const rejectBtn = await screen.findByRole("button", { name: /Reject Plan/i });
    fireEvent.click(rejectBtn);

    // Modal từ chối xuất hiện
    expect(await screen.findByText("Reject Movement Plan")).toBeInTheDocument();

    // Nhập lý do từ chối
    const reasonInput = screen.getByPlaceholderText(/Enter rejection reason for AI feedback/i);
    fireEvent.change(reasonInput, { target: { value: "Tài xế đang bận kiểm tra định kỳ." } });

    const confirmRejectBtn = screen.getByRole("button", { name: "Reject Plan" });
    fireEvent.click(confirmRejectBtn);

    // Trạng thái chuyển thành Rejected
    await waitFor(() => {
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Tài xế đang bận kiểm tra định kỳ.")[0]).toBeInTheDocument();
  });

  it("chuyển sang tab Lập kế hoạch mới và hiển thị form chia 2 section đúng checklist", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });

    // Đợi trang load xong
    expect(await screen.findByText("AI Smart Vehicle Dispatch")).toBeInTheDocument();

    // Click tab Tạo kế hoạch mới
    fireEvent.click(screen.getByText("Create New Plan"));

    // Section 1 (Checklist: <= 7 inputs có header)
    expect(await screen.findByText("1. Optimization Objective & AI Instructions")).toBeInTheDocument();
    expect(screen.getByLabelText("Dispatch Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Optimization Objective")).toBeInTheDocument();
    expect(screen.getByLabelText("AI Dispatch Model")).toBeInTheDocument();

    // Section 2 (Checklist: <= 7 inputs có header)
    expect(screen.getByText("2. Vehicle Scope & Cargo Assignment")).toBeInTheDocument();
    expect(screen.getByLabelText("Assigned Truck (UUID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Load to Assign (UUID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Business Time Zone")).toBeInTheDocument();

    // Nút footer
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request AI Dispatch Plan" })).toBeInTheDocument();
  });

  it("cho phép người dùng mở popup Cài đặt AI từ PageHeader và lưu cấu hình API Key", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });

    // Nút Cài đặt AI trên PageHeader
    const configBtn = await screen.findByTestId("btn-open-ai-config");
    expect(configBtn).toBeInTheDocument();
    fireEvent.click(configBtn);

    // Modal Cài đặt AI xuất hiện
    expect(await screen.findByText(/AI Model & API Key Configuration/i)).toBeInTheDocument();

    // Điền API Key
    const apiKeyInput = screen.getByTestId("input-api-key-openai");
    fireEvent.change(apiKeyInput, { target: { value: "sk-openai-key-from-header" } });

    // Bấm lưu
    const saveBtn = screen.getByTestId("btn-save-ai-config");
    fireEvent.click(saveBtn);

    // Cấu hình được lưu vào localStorage
    expect(getStoredAiSettings().providers.openai.apiKey).toBe("sk-openai-key-from-header");

    // Modal đóng lại
    await waitFor(() => {
      expect(screen.queryByTestId("btn-save-ai-config")).not.toBeInTheDocument();
    });
  });

  it("chặn truy cập khi vai trò không có quyền hoặc chưa xác định tenant", async () => {
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DRIVER" });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();

    session.tenantKey = "";
    await renderFinance(<AiDispatchPage />, vi.fn(), { role: "DISPATCHER" });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
  });
});
