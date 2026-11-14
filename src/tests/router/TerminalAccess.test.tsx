/**
 * FE-01: `/api/terminals/**` is granted to exactly ADMIN, ACCOUNTANT and
 * DISPATCHER by `SecurityConfig`, with no per-method split. This test drives the
 * real Refine access-control provider through the same `ResourceAccessBoundary`
 * the router uses, so both direct-route mounting and action buttons are covered.
 */

import { CanAccess, Refine } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import { ResourceAccessBoundary } from "@router/AppRouter";
import { createAccessControlProvider } from "@providers/accessControlProvider";
import { normalizeJwtRoles } from "@providers/permissions/jwtRoles";

const authorities = [
  "SUPERADMIN",
  "OWNER",
  "MANAGER",
  "DISPATCHER",
  "DRIVER",
  "ADMIN",
  "ACCOUNTANT",
  "PAYROLL",
  "PAYROLL_MANAGER",
  "UNKNOWN",
] as const;

const TERMINAL_ROLES = ["ADMIN", "ACCOUNTANT", "DISPATCHER"];
const actions = ["create", "edit", "delete"] as const;

describe("terminal route and action guards with the real access provider", () => {
  it.each(authorities)("gates mounting and CRUD actions for %s", async (authority) => {
    const mounted = vi.fn();
    const roles = normalizeJwtRoles(undefined, [`ROLE_${authority}`]);
    const allowed = TERMINAL_ROLES.includes(authority);

    function TerminalScreen() {
      useEffect(() => {
        mounted();
      }, []);
      return <div>terminals-screen</div>;
    }

    render(
      <MemoryRouter>
        <Refine
          accessControlProvider={createAccessControlProvider({
            getJwtRoles: async () => roles,
          })}
        >
          <ResourceAccessBoundary
            action="list"
            fallback={<div>terminals-forbidden</div>}
            resource="terminals"
          >
            <TerminalScreen />
          </ResourceAccessBoundary>

          {actions.map((action) => (
            <CanAccess
              action={action}
              fallback={<div>{action}-forbidden</div>}
              key={action}
              resource="terminals"
            >
              <button type="button">{action}-button</button>
            </CanAccess>
          ))}
        </Refine>
      </MemoryRouter>,
    );

    const expected = allowed ? "terminals-screen" : "terminals-forbidden";
    expect(await screen.findByText(expected)).toBeInTheDocument();
    if (!allowed) {
      expect(screen.queryByText("terminals-screen")).not.toBeInTheDocument();
      expect(mounted).not.toHaveBeenCalled();
    }

    for (const action of actions) {
      if (allowed) {
        expect(
          await screen.findByRole("button", { name: `${action}-button` }),
        ).toBeInTheDocument();
      } else {
        expect(await screen.findByText(`${action}-forbidden`)).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: `${action}-button` }),
        ).not.toBeInTheDocument();
      }
    }
  });

  it("keeps ACCOUNTANT and DISPATCHER writes visible while legacy MANAGER stays denied", async () => {
    const renderDelete = (authority: string) => {
      const roles = normalizeJwtRoles(undefined, [`ROLE_${authority}`]);
      return render(
        <MemoryRouter>
          <Refine
            accessControlProvider={createAccessControlProvider({
              getJwtRoles: async () => roles,
            })}
          >
            <CanAccess
              action="delete"
              fallback={<div>delete-forbidden</div>}
              resource="terminals"
            >
              <button type="button">delete-button</button>
            </CanAccess>
          </Refine>
        </MemoryRouter>,
      );
    };

    for (const authority of ["ACCOUNTANT", "DISPATCHER"] as const) {
      const { unmount } = renderDelete(authority);
      expect(
        await screen.findByRole("button", { name: "delete-button" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("delete-forbidden")).not.toBeInTheDocument();
      unmount();
    }

    const { unmount } = renderDelete("MANAGER");
    expect(await screen.findByText("delete-forbidden")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "delete-button" }),
    ).not.toBeInTheDocument();
    unmount();
  });
});
