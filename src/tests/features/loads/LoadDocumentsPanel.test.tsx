/** Real Refine queries verify load-scoped document paging and fail-closed read states. */
import type { BaseRecord, DataProvider, GetListParams } from "@refinedev/core";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoadDocumentsPanel } from "@/features/loads/LoadDocumentsPanel";
import { ApiHttpError } from "@/providers/api/httpError";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { DocumentDto } from "@/types/document.dto";

const identity = vi.hoisted(() => ({ tenantKey: "tenant-documents" as string | undefined }));
vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({ tenant: identity.tenantKey ? { tenantKey: identity.tenantKey } : undefined }),
}));

const loadId = "21f7e3ce-e62c-4be2-bb5d-927a2d88498c";
const secondLoadId = "72f7e3ce-e62c-4be2-bb5d-927a2d88498c";
const record: DocumentDto = {
  id: "doc-1", ownerType: "load", fileName: "First page.pdf", originalFileName: "First page.pdf",
  contentType: "application/pdf", fileSizeBytes: 12, blobPath: null, blobContainer: null,
  type: "bill_of_lading", status: "active", description: "Signed pickup evidence",
  uploadedById: null, uploadedByName: null, loadId, truckId: null, employeeId: null,
  recipientName: null, capturedAt: "2026-10-05T09:10:00+07:00", captureLatitude: null,
  captureLongitude: null, notes: null,
};

function listProvider(
  request: (params: GetListParams) => Promise<{ data: DocumentDto[]; total: number }>,
): DataProvider["getList"] {
  // The HTTP test boundary alone adapts Refine's generic record result.
  return async <TData extends BaseRecord>(params: GetListParams) => {
    const response = await request(params);
    return { data: response.data as unknown as TData[], total: response.total };
  };
}

describe("LoadDocumentsPanel", () => {
  beforeEach(() => { identity.tenantKey = "tenant-documents"; });

  it("reads only this load, uses capture time and fetches the next server page", async () => {
    const custom = vi.fn(async () => undefined);
    const request = vi.fn(async ({ pagination }: GetListParams) => ({
      data: [{ ...record, fileName: pagination?.current === 2 ? "Second page.pdf" : record.fileName }], total: 42,
    }));
    const { client } = await renderFinance(<LoadDocumentsPanel loadId={loadId} />, custom, {
      role: "ADMIN", listRequest: listProvider(request),
    });
    expect(await screen.findByText("First page.pdf")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Captured at" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Uploaded At" })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByText("Bill of Lading")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      resource: "documents", filters: [{ field: "loadId", operator: "eq", value: loadId }],
      pagination: expect.objectContaining({ current: 1, pageSize: 20, mode: "server" }),
    }));
    fireEvent.click(screen.getByTitle("Next Page"));
    expect(await screen.findByText("Second page.pdf")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ pagination: expect.objectContaining({ current: 2, pageSize: 20 }) }));
    expect(client.getQueryCache().find(["load-documents", "tenant-documents", loadId, 2, 20])).toBeDefined();
    expect(custom).not.toHaveBeenCalled();
    expect(screen.queryByTestId("upload-document-btn")).not.toBeInTheDocument();
  });

  it("resets paging and keeps another load's cache separate when the active load changes", async () => {
    function SwitchLoad() {
      const [id, setId] = useState(loadId);
      return <><button onClick={() => setId(secondLoadId)}>Change load</button><LoadDocumentsPanel key={id} loadId={id} /></>;
    }
    const request = vi.fn(async ({ pagination, filters }: GetListParams) => ({
      data: [{ ...record, fileName: `${JSON.stringify(filters)} page ${pagination?.current}` }], total: 42,
    }));
    const { client } = await renderFinance(<SwitchLoad />, async () => undefined, { role: "ADMIN", listRequest: listProvider(request) });
    await screen.findByText(new RegExp(`${loadId}.*page 1`));
    fireEvent.click(screen.getByTitle("Next Page"));
    await screen.findByText(new RegExp(`${loadId}.*page 2`));
    fireEvent.click(screen.getByRole("button", { name: "Change load" }));
    await screen.findByText(new RegExp(`${secondLoadId}.*page 1`));
    expect(screen.queryByText(new RegExp(`${loadId}.*page 2`))).not.toBeInTheDocument();
    expect(client.getQueryCache().find(["load-documents", "tenant-documents", secondLoadId, 1, 20])).toBeDefined();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("shows an empty collection only after a successful read", async () => {
    const { client } = await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, {
      role: "ADMIN", listRequest: listProvider(async () => ({ data: [], total: 0 })),
    });
    await waitFor(() => expect(client.getQueryCache().find(["load-documents", "tenant-documents", loadId, 1, 20])?.state.status).toBe("success"));
    // Ant Design also renders a hidden measurement row for horizontally scrolling tables.
    expect((await screen.findAllByText("No data")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows loading while the server page is pending", async () => {
    const listRequest: DataProvider["getList"] = () => new Promise(() => undefined);
    await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, { role: "ADMIN", listRequest });
    await waitFor(() => expect(document.querySelector(".ant-spin")).not.toBeNull());
    expect(screen.queryByText("First page.pdf")).not.toBeInTheDocument();
  });

  it("shows a request error with retry instead of a false empty collection", async () => {
    let fails = true;
    const request = vi.fn(async () => {
      if (fails) throw new ApiHttpError({ statusCode: 500, code: "DOCUMENT_READ_FAILED", message: "Storage metadata unavailable", requestId: "docs-request" });
      return { data: [{ ...record, capturedAt: null }], total: 1 };
    });
    await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, { role: "ADMIN", listRequest: listProvider(request) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage metadata unavailable");
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
    fails = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("First page.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows forbidden on a backend ownership/authorization denial", async () => {
    await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, {
      role: "ADMIN", listRequest: listProvider(async () => { throw new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Not allowed", requestId: null }); }),
    });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("does not fetch documents without a confirmed read permission", async () => {
    const request = vi.fn(async () => ({ data: [record], total: 1 }));
    await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, { role: "UNKNOWN", listRequest: listProvider(request) });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("does not fetch without a tenant or load, or reuse another tenant's documents", async () => {
    identity.tenantKey = undefined;
    const request = vi.fn(async () => ({ data: [record], total: 1 }));
    const first = await renderFinance(<LoadDocumentsPanel loadId={loadId} />, async () => undefined, { role: "ADMIN", listRequest: listProvider(request) });
    await waitFor(() => expect(first.client.getQueryCache().getAll().some(query => query.state.status === "success")).toBe(true));
    expect(request).not.toHaveBeenCalled(); first.unmount();
    identity.tenantKey = "other-tenant";
    await renderFinance(<LoadDocumentsPanel loadId="" />, async () => undefined, { role: "ADMIN", listRequest: listProvider(request), client: first.client });
    await waitFor(() => expect(document.querySelector(".ant-spin")).not.toBeNull());
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByText("First page.pdf")).not.toBeInTheDocument();
  });
});
