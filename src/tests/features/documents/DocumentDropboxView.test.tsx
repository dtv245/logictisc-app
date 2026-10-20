import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BaseRecord, DataProvider } from "@refinedev/core";
import { DocumentDropboxView } from "@/features/documents/components/DocumentDropboxView";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { Document } from "@/types/document.types";

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    ownerType: "load",
    fileName: "Bill_of_Lading_1001.pdf",
    originalFileName: "BOL_1001.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 2048576, // 2 MB
    blobPath: "/blobs/loads/bol-1001.pdf",
    blobContainer: "documents",
    type: "bill_of_lading",
    status: "active",
    description: "Signed BOL for pickup",
    uploadedById: "usr-1",
    uploadedByName: "Dispatcher John",
    loadId: "load-uuid-1",
    truckId: "truck-uuid-1",
    employeeId: null,
    capturedAt: "2026-10-05T09:10:00Z",
    createdAt: "2026-10-05T09:10:00Z",
  },
  {
    id: "doc-2",
    ownerType: "employee",
    fileName: "Driver_License_Sarah.png",
    originalFileName: "sarah_license.png",
    contentType: "image/png",
    fileSizeBytes: 524288, // 512 KB
    blobPath: "/blobs/drivers/sarah-license.png",
    blobContainer: "documents",
    type: "driver_license",
    status: "active",
    description: "Class A Commercial License",
    uploadedById: "usr-2",
    uploadedByName: "Sarah Driver",
    loadId: null,
    truckId: null,
    employeeId: "emp-uuid-2",
    capturedAt: "2026-10-06T14:30:00Z",
    createdAt: "2026-10-06T14:30:00Z",
  },
];

function createListProvider(
  docs: Document[] = mockDocuments,
): DataProvider["getList"] {
  return async <TData extends BaseRecord>() => {
    return {
      data: docs as unknown as TData[],
      total: docs.length,
    };
  };
}

describe("DocumentDropboxView", () => {
  it("renders Dropbox cloud header, metrics stats, and dropzone", async () => {
    const listRequest = createListProvider();
    const custom = vi.fn(async () => undefined);

    await renderFinance(<DocumentDropboxView />, custom, {
      role: "ADMIN",
      listRequest,
      initialEntries: ["/documents?pageSize=10&current=1"],
    });

    // Check title and brand
    expect(await screen.findByRole("heading", { name: "Document & Voucher Cloud Storage" })).toBeInTheDocument();
    expect(screen.getByText("Logistics Dropbox")).toBeInTheDocument();

    // Upload stays unavailable until the backend contract is confirmed.
    expect(screen.getByText("Document upload is unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload document/i })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();

    // Check Document cards in Grid view
    expect(await screen.findByText("Bill_of_Lading_1001.pdf")).toBeInTheDocument();
    expect(screen.getByText("Driver_License_Sarah.png")).toBeInTheDocument();

    // Check formatted file sizes
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
    expect(screen.getByText("512.0 KB")).toBeInTheDocument();
  });

  it("switches between Grid View and List View", async () => {
    const listRequest = createListProvider();
    const custom = vi.fn(async () => undefined);

    await renderFinance(<DocumentDropboxView />, custom, {
      role: "ADMIN",
      listRequest,
      initialEntries: ["/documents?pageSize=10&current=1"],
    });

    expect(await screen.findByText("Bill_of_Lading_1001.pdf")).toBeInTheDocument();

    // Switch to List View
    const listViewOption =
      screen.getByText("List View").closest("label") ?? screen.getByText("List View");
    fireEvent.click(listViewOption);

    // Verify table headers appear
    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: /file name/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /size/i })).toBeInTheDocument();
    });
  });

  it("filters documents when selecting a category pill", async () => {
    const listRequest = createListProvider();
    const custom = vi.fn(async () => undefined);

    await renderFinance(<DocumentDropboxView />, custom, {
      role: "ADMIN",
      listRequest,
      initialEntries: ["/documents?pageSize=10&current=1"],
    });

    expect(await screen.findByText("Bill_of_Lading_1001.pdf")).toBeInTheDocument();
    expect(screen.getByText("Driver_License_Sarah.png")).toBeInTheDocument();

    // Click "Driver License" category filter
    const driverLicensePill = screen.getByRole("button", { name: /driver license/i });
    fireEvent.click(driverLicensePill);

    // Bill of lading should now be filtered out
    await waitFor(() => {
      expect(screen.queryByText("Bill_of_Lading_1001.pdf")).not.toBeInTheDocument();
      expect(screen.getByText("Driver_License_Sarah.png")).toBeInTheDocument();
    });
  });

  it("opens file inspector drawer when a document card is clicked", async () => {
    const listRequest = createListProvider();
    const custom = vi.fn(async () => undefined);

    await renderFinance(<DocumentDropboxView />, custom, {
      role: "ADMIN",
      listRequest,
      initialEntries: ["/documents?pageSize=10&current=1"],
    });

    const docCard = await screen.findByText("Bill_of_Lading_1001.pdf");
    fireEvent.click(docCard);

    // Verify Drawer title and full metadata
    expect(await screen.findByText("Document Details")).toBeInTheDocument();
    expect(screen.getByText("File Information")).toBeInTheDocument();
    expect(screen.getByText("Business Links")).toBeInTheDocument();
    expect(screen.getByText("Dispatcher John")).toBeInTheDocument();
    expect(screen.getByText("Signed BOL for pickup")).toBeInTheDocument();
  });
});
