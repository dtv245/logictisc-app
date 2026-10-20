import { Button } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpsCard } from "@/features/dashboard/components/primitives/Card";

describe("Button and Card state matrix", () => {
  it("covers Button default, loading, disabled and keyboard focus", () => {
    const submit = vi.fn();
    render(<>
      <Button onClick={submit}>Save</Button>
      <Button loading>Saving</Button>
      <Button disabled>Unavailable</Button>
    </>);

    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /Saving/ })).toHaveClass("ant-btn-loading");
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
    save.focus();
    expect(save).toHaveFocus();
  });

  it("renders the shared Card default surface and does not imply unsupported query states", () => {
    render(<OpsCard title="Operations"><span>Dispatch content</span></OpsCard>);
    expect(screen.getByRole("heading", { name: "Operations" })).toBeVisible();
    expect(screen.getByText("Dispatch content")).toBeVisible();
  });
});
