import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAiDispatchSessions } from "@/features/ai-dispatch/api/aiDispatch.api";

vi.mock("@/api/ai/ai.api", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test-session-token" }),
}));

describe("fetchAiDispatchSessions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps the backend PagedResponse items/totalItems", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        data: {
          items: [{ id: "session-1" }, { id: "session-2" }],
          totalItems: 7,
        },
      },
    } as never);

    await expect(fetchAiDispatchSessions()).resolves.toEqual({
      content: [{ id: "session-1" }, { id: "session-2" }],
      totalElements: 7,
    });
  });

  it("keeps the legacy content/totalElements shape as a fallback", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        data: {
          content: [{ id: "session-3" }],
          totalElements: 1,
        },
      },
    } as never);

    await expect(fetchAiDispatchSessions()).resolves.toEqual({
      content: [{ id: "session-3" }],
      totalElements: 1,
    });
  });
});
