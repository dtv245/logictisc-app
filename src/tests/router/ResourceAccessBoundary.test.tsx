/** Verifies direct resource URLs are gated by Refine access control. */

import { Refine } from "@refinedev/core";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ResourceAccessBoundary } from "@router/AppRouter";

describe("ResourceAccessBoundary", () => {
  it("renders the forbidden fallback when direct route access is denied", async () => {
    const can = vi.fn(async () => ({ can: false, reason: "forbidden" }));
    render(
      <MemoryRouter>
        <Refine accessControlProvider={{ can }}>
          <ResourceAccessBoundary
            action="edit"
            fallback={<div>forbidden-test-state</div>}
            resource="customers"
          >
            <div>protected-customer-form</div>
          </ResourceAccessBoundary>
        </Refine>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("forbidden-test-state")).toBeInTheDocument();
    });
    expect(screen.queryByText("protected-customer-form")).not.toBeInTheDocument();
    expect(can).toHaveBeenCalledWith(
      expect.objectContaining({ action: "edit", resource: "customers" }),
    );
  });
});
