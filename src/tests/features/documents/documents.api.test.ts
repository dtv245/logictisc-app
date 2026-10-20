import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDocumentDownload } from "@/features/documents/api/documents.api";

vi.mock("@/api/ai/ai.api", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test-session-token" }),
}));

describe("fetchDocumentDownload", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the authorized document endpoint and returns a non-empty file blob", async () => {
    const blob = new Blob(["pdf-content"], { type: "application/pdf" });
    const request = vi.spyOn(axios, "get").mockResolvedValue({
      data: blob,
      headers: { "content-type": "application/pdf" },
    } as never);

    await expect(fetchDocumentDownload("https://api.example.test/", "doc / 1")).resolves.toBe(blob);

    expect(request).toHaveBeenCalledWith(
      "https://api.example.test/api/documents/doc%20%2F%201/download",
      expect.objectContaining({
        responseType: "blob",
        headers: { Authorization: "Bearer test-session-token" },
      }),
    );
  });

  it("rejects empty and JSON error responses instead of treating them as downloads", async () => {
    const request = vi.spyOn(axios, "get");
    request.mockResolvedValueOnce({
      data: new Blob([], { type: "application/pdf" }),
      headers: { "content-type": "application/pdf" },
    } as never);
    request.mockResolvedValueOnce({
      data: new Blob(["{\"error\":true}"], { type: "application/json" }),
      headers: { "content-type": "application/json" },
    } as never);

    await expect(fetchDocumentDownload("https://api.example.test", "doc-1"))
      .rejects.toThrow("DOCUMENT_DOWNLOAD_INVALID_RESPONSE");
    await expect(fetchDocumentDownload("https://api.example.test", "doc-1"))
      .rejects.toThrow("DOCUMENT_DOWNLOAD_INVALID_RESPONSE");
  });
});
