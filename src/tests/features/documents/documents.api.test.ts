/**
 * Contract guard for the documents feature.
 *
 * logictics_api DocumentController exposes only:
 *   GET  /api/documents
 *   GET  /api/documents/{id}   (metadata JSON, NOT file content)
 *   DELETE /api/documents/{id}
 *
 * There is no `/download` route and no `@PostMapping`, so the frontend must
 * not ship a request function for either. These tests fail if someone
 * reintroduces a call to a route the backend does not serve.
 */

import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as documentsApi from "@/features/documents/api/documents.api";

describe("documents API contract", () => {
  afterEach(() => vi.restoreAllMocks());

  it("declares both download and upload as unavailable", () => {
    expect(documentsApi.DOCUMENT_DOWNLOAD_CONTRACT_CONFIRMED).toBe(false);
    expect(documentsApi.DOCUMENT_UPLOAD_CONTRACT_CONFIRMED).toBe(false);
  });

  it("does not export a download request function", () => {
    expect("fetchDocumentDownload" in documentsApi).toBe(false);
  });

  it("builds upload FormData without issuing any HTTP request", () => {
    const get = vi.spyOn(axios, "get");
    const post = vi.spyOn(axios, "post");
    const file = new File(["content"], "bol.pdf", {
      type: "application/pdf",
    });

    const formData = documentsApi.buildDocumentFormData({
      file,
      type: "bill_of_lading",
      loadId: "load-1",
    });

    expect(formData.get("file")).toBe(file);
    expect(formData.get("type")).toBe("bill_of_lading");
    expect(get).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
