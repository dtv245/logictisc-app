import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import * as aiApi from "@/api/ai/ai.api";

vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-test" } }),
}));

describe("useAiFeatures", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("returns enabled: false when backend returns error or 404", async () => {
    vi.spyOn(aiApi, "fetchAiFeatures").mockRejectedValueOnce(new Error("404 Not Found"));

    const { result } = renderHook(() => useAiFeatures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.dryRun).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(true);
  });

  it("returns enabled: true when backend returns active AI features", async () => {
    vi.spyOn(aiApi, "fetchAiFeatures").mockResolvedValueOnce({
      enabled: true,
      dryRun: false,
      gapDetection: true,
      dispatchOptimization: true,
    });

    const { result } = renderHook(() => useAiFeatures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.enabled).toBe(true);
    expect(result.current.dryRun).toBe(false);
    expect(result.current.data?.gapDetection).toBe(true);
  });
});
