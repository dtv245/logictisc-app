import { CanAccess, Refine } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { ResourceAccessBoundary } from "@router/AppRouter";
import { createAccessControlProvider } from "@providers/accessControlProvider";
import { normalizeJwtRoles } from "@providers/permissions/jwtRoles";

const authorities = ["SUPERADMIN", "OWNER", "MANAGER", "DISPATCHER", "DRIVER",
  "ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER", "UNKNOWN"];
const routes = [
  ["shipment-costs", "COST_VIEW"], ["profitability", "PROFITABILITY_VIEW"],
  ["settlements", "SETTLEMENT_VIEW"], ["payroll", "PAYROLL_VIEW"],
] as const;

describe("finance route and action guards with real Refine access provider", () => {
  it.each(authorities)("gates direct route mounting and actions for %s", async (authority) => {
    const mounted = vi.fn();
    const roles = normalizeJwtRoles(undefined, [`ROLE_${authority}`]);
    const allowed = ["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"].includes(authority);
    function Screen({ resource }: { resource: string }) {
      useEffect(() => { mounted(resource); }, [resource]);
      return <div>{resource}-screen</div>;
    }
    render(
      <MemoryRouter>
        <Refine accessControlProvider={createAccessControlProvider({ getJwtRoles: async () => roles })}>
          {routes.map(([resource, action]) => (
            <ResourceAccessBoundary key={resource} resource={resource} action={action}
              fallback={<div>{resource}-forbidden</div>}>
              <Screen resource={resource} />
            </ResourceAccessBoundary>
          ))}
          <CanAccess resource="settlements" action="SETTLEMENT_LOCK" fallback={<div>lock-forbidden</div>}>
            <button>Lock settlement</button>
          </CanAccess>
          <CanAccess resource="accessorials" action="ACCESSORIAL_APPROVE" fallback={<div>approve-forbidden</div>}>
            <button>Approve accessorial</button>
          </CanAccess>
        </Refine>
      </MemoryRouter>,
    );
    for (const [resource] of routes) {
      expect(await screen.findByText(`${resource}-${allowed ? "screen" : "forbidden"}`)).toBeInTheDocument();
      if (!allowed) expect(screen.queryByText(`${resource}-screen`)).not.toBeInTheDocument();
    }
    if (allowed) expect(await screen.findByRole("button", { name: "Lock settlement" })).toBeInTheDocument();
    else expect(await screen.findByText("lock-forbidden")).toBeInTheDocument();
    if (["ADMIN", "ACCOUNTANT"].includes(authority)) {
      expect(await screen.findByRole("button", { name: "Approve accessorial" })).toBeInTheDocument();
    } else expect(await screen.findByText("approve-forbidden")).toBeInTheDocument();
    expect(mounted).toHaveBeenCalledTimes(allowed ? 4 : 0);
  });
});
