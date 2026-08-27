/**
 * Kiểm chứng health bootstrap không gửi Bearer và phân loại lỗi CORS/network.
 */

import { describe, expect, it, vi } from "vitest";

import { probeHealth } from "./healthProbe";

describe("probeHealth", () => {
  it("accepts the direct health shape and adds a request ID without Bearer", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "UP",
          application: "logicstic",
          profiles: "local",
          database: "enabled",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    );

    const result = await probeHealth(
      { apiBaseUrl: "https://api.example.test" },
      {
        fetcher,
        requestIdFactory: () => "request-1",
      },
    );

    expect(result).toMatchObject({
      health: {
        application: "logicstic",
        database: "enabled",
        profiles: "local",
        status: "UP",
      },
      kind: "healthy",
      requestId: "request-1",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    const requestInit = fetcher.mock.calls[0]?.[1];
    expect(new Headers(requestInit?.headers).get("Authorization")).toBeNull();
    expect(new Headers(requestInit?.headers).get("X-Request-Id")).toBe(
      "request-1",
    );
  });

  it("classifies a reachable no-cors endpoint as browser CORS", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-2",
        },
      ),
    ).resolves.toEqual({
      kind: "cors-blocked",
      requestId: "request-2",
    });
  });

  it("classifies two failed probes as unreachable", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Connection refused"));

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-3",
        },
      ),
    ).resolves.toEqual({
      kind: "unreachable",
      requestId: "request-3",
    });
  });

  it("classifies an HTTP failure as unhealthy without a reachability probe", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-4",
        },
      ),
    ).resolves.toEqual({
      httpStatus: 503,
      kind: "unhealthy",
      requestId: "request-4",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("classifies malformed JSON as unhealthy instead of CORS", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{not-json", {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      }),
    );

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-5",
        },
      ),
    ).resolves.toEqual({
      httpStatus: 200,
      kind: "unhealthy",
      requestId: "request-5",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("preserves a valid non-UP response as unhealthy diagnostics", async () => {
    const health = {
      status: "DOWN",
      application: "logicstic",
      profiles: "local",
      database: "enabled",
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(health), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      }),
    );

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-6",
        },
      ),
    ).resolves.toEqual({
      health,
      httpStatus: 200,
      kind: "unhealthy",
      requestId: "request-6",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps database-disabled health data available for the bootstrap gate", async () => {
    const health = {
      status: "UP",
      application: "logicstic",
      profiles: "nodb",
      database: "disabled",
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(health), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      }),
    );

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-7",
        },
      ),
    ).resolves.toEqual({
      health,
      kind: "healthy",
      requestId: "request-7",
    });
  });

  it("propagates an abort without starting a reachability probe", async () => {
    const controller = new AbortController();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => {
        controller.abort();
        throw new DOMException("Aborted", "AbortError");
      });

    await expect(
      probeHealth(
        { apiBaseUrl: "https://api.example.test" },
        {
          fetcher,
          requestIdFactory: () => "request-8",
          signal: controller.signal,
        },
      ),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
