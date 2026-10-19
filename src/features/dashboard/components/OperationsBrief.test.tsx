import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OperationsBrief } from "@/features/dashboard/components/OperationsBrief";

const action = { id: "test-action", kind: "reroute" as const, title: "Đổi tuyến chuyến kiểm thử", hint: "Rà soát lộ trình" };

describe("OperationsBrief", () => {
  it("keeps missing analysis empty without invented counts or recommendations", () => {
    render(<MemoryRouter><OperationsBrief /></MemoryRouter>);
    expect(screen.getByText("Chưa có bản tin điều phối.")).toBeInTheDocument();
    expect(screen.getByText("Chưa có đề xuất mới.")).toBeInTheDocument();
    expect(screen.queryByText(/92%|214|6 agents|LD-84920/)).not.toBeInTheDocument();
  });

  it("shows supplied metrics, counts and cause shares", () => {
    render(<MemoryRouter><OperationsBrief summary="Có 7 chuyến cần xem xét." confidenceScore={92} agentCount={6} updatedAtLabel="11:56" causes={[{ label: "Ùn tắc", count: 7, share: .5 }]} /></MemoryRouter>);
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Ùn tắc" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it("does not simulate approval when no backend action is provided", () => {
    render(<MemoryRouter><OperationsBrief actions={[action]} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Đổi tuyến chuyến kiểm thử/ }));
    expect(screen.getByRole("button", { name: "Phê duyệt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeDisabled();
  });

  it("keeps a failed action review open and permits retry", async () => {
    const approve = vi.fn().mockRejectedValueOnce(new Error("test-error")).mockResolvedValueOnce(undefined);
    render(<MemoryRouter><OperationsBrief actions={[action]} onApproveAction={approve} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Đổi tuyến chuyến kiểm thử/ }));
    fireEvent.click(screen.getByRole("button", { name: "Phê duyệt" }));
    await waitFor(() => expect(screen.getByText(/Không xử lý được đề xuất/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Phê duyệt" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Phê duyệt" }));
    await waitFor(() => expect(approve).toHaveBeenCalledTimes(2));
    expect(approve).toHaveBeenLastCalledWith(action);
  });
});
