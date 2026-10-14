import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TerminalSelect } from "@/features/terminals/components/TerminalSelect";

vi.mock("@/components/EntityPicker", () => ({
  EntityPicker: vi.fn((props: {
    resource: string;
    pageSize?: number;
    placeholder?: string;
    labelFormat?: (record: Record<string, unknown>) => string;
    excludeValues?: readonly string[];
  }) => (
    <div data-testid="mock-entity-picker">
      <span>Resource: {props.resource}</span>
      <span>PageSize: {props.pageSize}</span>
      <span>Placeholder: {props.placeholder}</span>
      {props.labelFormat && (
        <>
          <span data-testid="formatted-label">
            {props.labelFormat({ id: "term-1", name: "Cat Lai Port", code: "VNSGN" })}
          </span>
          <span data-testid="formatted-fallback">
            {props.labelFormat({ id: "term-2" })}
          </span>
        </>
      )}
    </div>
  )),
}));

describe("TerminalSelect — Component chọn bến bãi / cảng", () => {
  it("cấu hình EntityPicker với resource='terminals', pageSize=100 và định dạng nhãn '${name} (${code})'", () => {
    const onChange = vi.fn();
    render(
      <TerminalSelect
        value="term-1"
        onChange={onChange}
        placeholder="Chọn bến bãi..."
        excludeIds={["term-99"]}
      />
    );

    expect(screen.getByTestId("mock-entity-picker")).toBeInTheDocument();
    expect(screen.getByText("Resource: terminals")).toBeInTheDocument();
    expect(screen.getByText("PageSize: 100")).toBeInTheDocument();
    expect(screen.getByText("Placeholder: Chọn bến bãi...")).toBeInTheDocument();
    expect(screen.getByTestId("formatted-label")).toHaveTextContent("Cat Lai Port (VNSGN)");
    expect(screen.getByTestId("formatted-fallback")).toHaveTextContent("term-2");
  });
});
