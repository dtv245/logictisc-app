/**
 * Verifies stale-request cancellation and upstream signal propagation.
 */

import { describe, expect, it, vi } from "vitest";

import { createLatestRequestCoordinator } from "./latestRequest";

describe("createLatestRequestCoordinator", () => {
  it("aborts the previous request for the same key", () => {
    const coordinator = createLatestRequestCoordinator();
    const first = coordinator.begin("customers");
    const onAbort = vi.fn();
    first.signal.addEventListener("abort", onAbort);

    const second = coordinator.begin("customers");

    expect(first.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledOnce();
    expect(second.signal.aborted).toBe(false);
  });

  it("forwards an upstream TanStack Query abort", () => {
    const coordinator = createLatestRequestCoordinator();
    const upstream = new AbortController();
    const request = coordinator.begin("customers", upstream.signal);

    upstream.abort("query-cancelled");

    expect(request.signal.aborted).toBe(true);
    expect(request.signal.reason).toBe("query-cancelled");
  });
});
