import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentDropboxDropzone } from "@/features/documents/components/DocumentDropboxDropzone";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";

describe("DocumentDropboxDropzone", () => {
  it("does not present a working picker while upload contract is unavailable", async () => {
    const onFileSelect = vi.fn();
    const onOpenUploadModal = vi.fn();
    const rendered = await renderFinance(
      <DocumentDropboxDropzone
        onFileSelect={onFileSelect}
        onOpenUploadModal={onOpenUploadModal}
      />,
      vi.fn(),
    );

    expect(screen.getByText("Document upload is unavailable")).toBeInTheDocument();
    expect(screen.getByText(/upload API integration is pending backend confirmation/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(rendered.container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
    expect(onOpenUploadModal).not.toHaveBeenCalled();
  });
});
