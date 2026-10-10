import type { CustomParams } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OptimizationRunShow } from "@/pages/optimization/OptimizationRunShow";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { candidate, candidateId, optimization, optimizationAccepted, optimizationRunId, rejectedCandidate } from "@/tests/fixtures/optimization";
import { loadId, tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
import { optimizationKeys } from "@/features/optimization/optimization.api";
const session = vi.hoisted(() => ({ tenantKey: "tenant-finance" as string | undefined }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: session.tenantKey } }) }));
const page = <Routes><Route path="/optimization/runs/:id" element={<OptimizationRunShow />} /></Routes>;
const options = { initialEntries: [`/optimization/runs/${optimizationRunId}`] };
describe("OptimizationRunShow", () => {
  beforeEach(() => { session.tenantKey = tenantKey; });
  it("renders immutable rank/score/forecast values, keeps infeasible reasons and never offers their acceptance", async () => {
    const request = vi.fn(async () => optimization); const { client } = await renderFinance(page, request, { ...options, role: "DISPATCHER" });
    await screen.findByRole("heading", { name: "Run ID" });
    expect(await screen.findByRole("button", { name: `Accept candidate ${candidateId}` })).toBeInTheDocument(); expect(screen.queryByRole("button", { name: `Accept candidate ${rejectedCandidate.id}` })).not.toBeInTheDocument();
    expect(screen.getByText(/HOS cycle limit exceeded/)).toBeInTheDocument(); expect(screen.getByText("91.23456789")).toBeInTheDocument(); expect(screen.getByText(/EUR\s999\.99/)).toBeInTheDocument(); expect(screen.queryByText(/(?:EUR\s*-111\.11|-EUR\s*111\.11)/)).not.toBeInTheDocument();
    expect(client.getQueryCache().find(optimizationKeys.run(tenantKey, optimizationRunId))).toBeDefined(); expect(request).toHaveBeenCalledTimes(1);
  });
  it("confirms acceptance, single-flights double clicks, preserves immutable audit and scopes invalidation", async () => {
    let finish: (value: unknown) => void = () => undefined; const posts: CustomParams[] = [];
    const request = vi.fn(async (x: CustomParams) => { if (x.method === "get") return optimization; posts.push(x); return new Promise((resolve) => { finish = resolve; }); });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const unrelated = [["dashboard"], optimizationKeys.run("other-tenant", optimizationRunId), optimizationKeys.run(tenantKey, "other-run"), ["payroll", tenantKey, "run", loadId]];
    for (const key of unrelated) client.setQueryData(key, {});
    await renderFinance(page, request, { ...options, client }); fireEvent.click(await screen.findByRole("button", { name: `Accept candidate ${candidateId}` }));
    const dialog = await screen.findByRole("dialog"); expect(posts).toHaveLength(0); expect(within(dialog).getByText(/existing Trip/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Confirm" }); fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(posts).toHaveLength(1)); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(posts[0]).toMatchObject({ url: `/api/optimization/runs/${optimizationRunId}/assignments/${candidateId}/accept`, method: "post", payload: { idempotencyKey: expect.any(String), expectedInputFingerprint: candidate.inputFingerprint } });
    finish(optimizationAccepted); await screen.findByText("Candidate accepted."); await waitFor(() => expect(screen.queryByRole("button", { name: `Accept candidate ${candidateId}` })).not.toBeInTheDocument());
    expect(client.getQueryData(optimizationKeys.accepted(tenantKey, optimizationRunId))).toEqual(optimizationAccepted);
    expect(client.getQueryData(optimizationKeys.run(tenantKey, optimizationRunId))).toMatchObject({ data: optimization });
    for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(request.mock.calls.filter(([x]) => x.method === "get")).toHaveLength(2);
  });
  it("preserves acceptance replay key after recoverable domain conflict", async () => {
    const posts: CustomParams[] = []; const request = vi.fn(async (x: CustomParams) => {
      if (x.method === "get") return optimization; posts.push(x);
      if (posts.length === 1) throw new ApiHttpError({ statusCode: 409, code: "OPTIMIZATION_INPUT_EVIDENCE_REQUIRED", message: "Evidence missing", requestId: "accept-request" }); return optimizationAccepted;
    });
    await renderFinance(page, request, options); fireEvent.click(await screen.findByRole("button", { name: `Accept candidate ${candidateId}` })); const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await screen.findByText("Qualified candidate evidence is missing.")).toBeInTheDocument(); expect(screen.getByText(/accept-request/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: `Accept candidate ${candidateId}` })); const retry = await screen.findByRole("dialog");
    fireEvent.click(within(retry).getByRole("button", { name: "Confirm" })); await screen.findByText("Candidate accepted."); expect(posts[0]?.payload).toEqual(posts[1]?.payload);
  });
  it.each(["OPTIMIZATION_ALREADY_ACCEPTED", "OPTIMIZATION_CANDIDATE_STALE"])("blocks further acceptance after %s and presents a new-run action", async (code) => {
    const request = vi.fn(async (x: CustomParams) => { if (x.method === "get") return optimization; throw new ApiHttpError({ statusCode: 409, code, message: code, requestId: "stale-run" }); });
    await renderFinance(page, request, options); fireEvent.click(await screen.findByRole("button", { name: `Accept candidate ${candidateId}` })); const dialog = await screen.findByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText(/stale-run/)).toBeInTheDocument(); expect(screen.queryByRole("button", { name: `Accept candidate ${candidateId}` })).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: "New Run" })).toHaveAttribute("href", "/optimization");
  });
  it("renders loading, empty and request error/retry distinctly", async () => {
    const loading = await renderFinance(page, () => new Promise(() => undefined), options); expect(await screen.findByLabelText("Loading content")).toBeInTheDocument(); expect(screen.queryByText("No data", { selector: "strong" })).not.toBeInTheDocument(); loading.unmount();
    const empty = await renderFinance(page, async () => ({ ...optimization, candidates: [] }), options); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); empty.unmount();
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Run unavailable", requestId: "read-run" })).mockResolvedValueOnce(optimization);
    await renderFinance(page, request, options); expect(await screen.findByText(/Run unavailable.*read-run/)).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Try again" })); await screen.findByRole("button", { name: `Accept candidate ${candidateId}` });
  });
  it("does not refetch a nonexistent acceptance endpoint when cached real acceptance is available", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); client.setQueryData(optimizationKeys.accepted(tenantKey, optimizationRunId), optimizationAccepted);
    const request = vi.fn(async () => optimization); await renderFinance(page, request, { ...options, client }); await screen.findByText("Candidate accepted."); expect(screen.queryByRole("button", { name: `Accept candidate ${candidateId}` })).not.toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
  });
  it("denies missing tenant, unauthorized role and invalid run UUID before any request", async () => {
    const request = vi.fn(async () => optimization); session.tenantKey = undefined;
    const noTenant = await renderFinance(page, request, options); await screen.findByText("Access denied"); expect(request).not.toHaveBeenCalled(); noTenant.unmount(); session.tenantKey = tenantKey;
    const forbidden = await renderFinance(page, request, { ...options, role: "ACCOUNTANT" }); await screen.findByText("Access denied"); expect(request).not.toHaveBeenCalled(); forbidden.unmount();
    await renderFinance(page, request, { initialEntries: ["/optimization/runs/invalid"] }); await screen.findByText("Enter a valid UUID."); expect(request).not.toHaveBeenCalled();
  });
});
