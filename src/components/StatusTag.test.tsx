import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusTag } from "@/components/StatusTag";

describe("StatusTag passive status matrix", () => {
  it("renders the default neutral tone as a status announcement", () => {
    render(<StatusTag label="Draft" />);
    expect(screen.getByRole("status", { name: "Draft" })).toHaveClass("status-tag--neutral");
  });

  it("renders an error semantic tone without becoming an interactive control", () => {
    render(<StatusTag label="Failed" tone="error" />);
    expect(screen.getByRole("status", { name: "Failed" })).toHaveClass("status-tag--error");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
