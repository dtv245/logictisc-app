import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AsyncStateView } from "@/components/AsyncState";

describe("AsyncStateView state matrix", () => {
  it("renders loading without populated content", () => {
    render(<AsyncStateView state={{ status: "loading" }}>{() => <p>Loaded data</p>}</AsyncStateView>);
    expect(screen.getByRole("region")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Loaded data")).not.toBeInTheDocument();
  });

  it("shows an API error and a working retry recovery action", () => {
    const retry = vi.fn();
    render(<AsyncStateView state={{ status: "error", error: new Error("API unavailable") }} onRetry={retry}>{() => null}</AsyncStateView>);
    expect(screen.getByRole("alert")).toHaveTextContent("API unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders empty state separately from error and populated state", () => {
    render(<AsyncStateView state={{ status: "empty" }} emptyTitle="No loads">{() => null}</AsyncStateView>);
    expect(screen.getByText("No loads")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders data only for the populated state", () => {
    render(<AsyncStateView state={{ status: "populated", data: "Load 42" }}>{(data) => <p>{data}</p>}</AsyncStateView>);
    expect(screen.getByText("Load 42")).toBeVisible();
  });
});
