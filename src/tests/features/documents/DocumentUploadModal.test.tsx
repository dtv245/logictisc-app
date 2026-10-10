import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConfigProvider, App as AntdApp } from "antd";
import { DocumentUploadModal } from "@/features/documents/DocumentUploadModal";
import * as useDocumentUploadModule from "@/features/documents/useDocumentUpload";

const uploadContract = vi.hoisted(() => ({ confirmed: true }));
vi.mock("@/features/documents/documents.api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/documents/documents.api")>(),
  get DOCUMENT_UPLOAD_CONTRACT_CONFIRMED() { return uploadContract.confirmed; },
}));

vi.mock("@/features/documents/useDocumentUpload");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "documents.upload.title": "Upload Document",
        "documents.upload.button": "Upload Document",
        "documents.upload.submit": "Upload",
        "documents.upload.draggerText": "Click or drag file to this area to upload",
        "documents.upload.draggerHint": "Support for single file upload",
        "documents.upload.fileRequired": "Please select a file to upload",
        "documents.upload.typeRequired": "Please select a document type",
        "documents.upload.file": "File",
        "documents.upload.type": "Document Type",
        "documents.upload.typePlaceholder": "Select document type",
        "documents.upload.description": "Description",
        "documents.upload.descriptionPlaceholder": "Optional document notes",
        "documents.upload.loadId": "Associated Load (optional)",
        "documents.upload.truckId": "Associated Truck (optional)",
        "documents.upload.employeeId": "Associated Employee (optional)",
        "documents.upload.uploadSuccess": "Document uploaded successfully",
        "documents.upload.uploadFailed": "Failed to upload document",
        "documents.upload.types.bill_of_lading": "Bill of Lading",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("DocumentUploadModal", () => {
  const mockUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    uploadContract.confirmed = true;
    vi.mocked(useDocumentUploadModule.useDocumentUpload).mockReturnValue({
      upload: mockUpload,
      isLoading: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    });
  });

  const renderModal = (props = {}) =>
    render(
      <ConfigProvider>
        <AntdApp>
          <DocumentUploadModal {...props} />
        </AntdApp>
      </ConfigProvider>,
    );

  it("does not mount upload hooks or expose a trigger without a confirmed multipart contract", () => {
    uploadContract.confirmed = false;
    renderModal({ trigger: () => <button>Custom upload</button> });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(useDocumentUploadModule.useDocumentUpload).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("renders trigger button and opens modal when clicked", async () => {
    renderModal();

    const triggerButton = screen.getByRole("button", { name: /upload document/i });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(await screen.findByText("Upload Document", { selector: ".ant-modal-title" })).toBeInTheDocument();
    expect(screen.getByText("Click or drag file to this area to upload")).toBeInTheDocument();
  });

  it("validates that a document type is selected before submission", async () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /upload document/i }));
    await screen.findByText("Upload Document", { selector: ".ant-modal-title" });

    // Click submit without filling form
    const submitButton = screen.getByRole("button", { name: "Upload" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please select a document type")).toBeInTheDocument();
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("submits the file and fields to upload function", async () => {
    mockUpload.mockResolvedValue({ id: "doc-1", fileName: "test.pdf" });
    const onSuccess = vi.fn();

    renderModal({ onSuccess, defaultValues: { type: "bill_of_lading" } });

    fireEvent.click(screen.getByRole("button", { name: /upload document/i }));
    await screen.findByText("Upload Document", { selector: ".ant-modal-title" });

    // Upload a file
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });
    fireEvent.change(fileInput);

    // Fill in load ID
    const loadInput = screen.getByPlaceholderText("load-id");
    fireEvent.change(loadInput, { target: { value: "load-999" } });

    // Submit form
    const submitButton = document.querySelector(".ant-modal-footer .ant-btn-primary") as HTMLElement;
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          type: "bill_of_lading",
          loadId: "load-999",
        }),
      );
    });
  });

  it("disables submit button and shows loading state during upload", async () => {
    vi.mocked(useDocumentUploadModule.useDocumentUpload).mockReturnValue({
      upload: mockUpload,
      isLoading: true,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    });

    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /upload document/i }));
    await screen.findByText("Upload Document", { selector: ".ant-modal-title" });

    const submitButton = document.querySelector(".ant-modal-footer .ant-btn-primary");
    expect(submitButton).toHaveClass("ant-btn-loading");
    expect(submitButton).toBeDisabled();
  });
});
