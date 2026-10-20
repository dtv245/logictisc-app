import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentDropboxDrawer } from "@/features/documents/components/DocumentDropboxDrawer";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { Document } from "@/types/document.types";

const document: Document = {
  id: "document-1",
  ownerType: "load",
  fileName: "bill-of-lading.pdf",
  originalFileName: "bill-of-lading.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 128,
  blobPath: "storage/bill-of-lading.pdf",
  blobContainer: "documents",
  type: "bill_of_lading",
  status: "active",
  uploadedById: "user-1",
  createdAt: "2026-10-19T10:00:00Z",
};

describe("DocumentDropboxDrawer delete confirmation", () => {
  it("keeps the inspector open when the delete request fails", async () => {
    const onClose = vi.fn();
    const onDelete = vi.fn(async () => false);
    await renderFinance(
      <DocumentDropboxDrawer
        open
        document={document}
        onClose={onClose}
        onDownload={vi.fn()}
        onDelete={onDelete}
      />,
      vi.fn(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Document" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(document));
    expect(screen.getByText("Document Details")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes the inspector only after deletion succeeds", async () => {
    const onClose = vi.fn();
    const onDelete = vi.fn(async () => true);
    await renderFinance(
      <DocumentDropboxDrawer
        open
        document={document}
        onClose={onClose}
        onDownload={vi.fn()}
        onDelete={onDelete}
      />,
      vi.fn(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Document" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
