import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDocumentUpload } from "@/features/documents/useDocumentUpload";
import { buildDocumentFormData } from "@/features/documents/documents.api";
import * as refineCore from "@refinedev/core";

vi.mock("@refinedev/core", () => ({
  useCustomMutation: vi.fn(),
  useInvalidate: vi.fn(),
}));

describe("useDocumentUpload", () => {
  const mockMutateAsync = vi.fn();
  const mockInvalidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refineCore.useInvalidate).mockReturnValue(mockInvalidate);
    vi.mocked(refineCore.useCustomMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: vi.fn(),
      isLoading: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustomMutation>);
  });

  it("builds FormData correctly with all payload fields", () => {
    const file = new File(["test-content"], "bol.pdf", { type: "application/pdf" });
    const formData = buildDocumentFormData({
      file,
      type: "bill_of_lading",
      description: "BOL for Load 101",
      notes: "Delivered in good condition",
      loadId: "load-101",
      truckId: "trk-202",
      employeeId: "emp-303",
    });

    expect(formData.get("file")).toBe(file);
    expect(formData.get("type")).toBe("bill_of_lading");
    expect(formData.get("description")).toBe("BOL for Load 101");
    expect(formData.get("notes")).toBe("Delivered in good condition");
    expect(formData.get("loadId")).toBe("load-101");
    expect(formData.get("truckId")).toBe("trk-202");
    expect(formData.get("employeeId")).toBe("emp-303");
  });

  it("calls mutateAsync once and invalidates documents list on success", async () => {
    const file = new File(["test-content"], "bol.pdf", { type: "application/pdf" });
    const mockResponse = {
      data: {
        id: "doc-1",
        fileName: "bol.pdf",
        type: "bill_of_lading",
      },
    };
    mockMutateAsync.mockResolvedValue(mockResponse);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDocumentUpload({ onSuccess }));

    await act(async () => {
      const res = await result.current.upload({
        file,
        type: "bill_of_lading",
        loadId: "load-101",
      });
      expect(res).toEqual(mockResponse.data);
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/documents",
      method: "post",
      values: expect.any(FormData),
    });

    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "documents",
      invalidates: ["list"],
    });
    expect(onSuccess).toHaveBeenCalledWith(mockResponse.data);
  });

  it("guards against double-click/double-submit while upload is in progress", async () => {
    const file = new File(["test-content"], "bol.pdf", { type: "application/pdf" });
    let resolveFirst: (val: unknown) => void = () => {};
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    mockMutateAsync.mockImplementationOnce(() => firstPromise);

    const { result } = renderHook(() => useDocumentUpload());

    let promise1: Promise<unknown>;
    let promise2: Promise<unknown>;

    await act(async () => {
      promise1 = result.current.upload({ file, type: "bill_of_lading" });
      // Immediate second call should be ignored by the double-submit guard
      promise2 = result.current.upload({ file, type: "bill_of_lading" });
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(await promise2!).toBeUndefined();

    // Resolve first request
    await act(async () => {
      resolveFirst({ data: { id: "doc-1" } });
      await promise1;
    });
  });

  it("invokes onError callback when upload fails", async () => {
    const file = new File(["test-content"], "bol.pdf", { type: "application/pdf" });
    const mockError = {
      message: "Upload failed: file too large",
      errors: { file: "File exceeds 25MB" },
    };
    mockMutateAsync.mockRejectedValue(mockError);

    const onError = vi.fn();
    const { result } = renderHook(() => useDocumentUpload({ onError }));

    await act(async () => {
      try {
        await result.current.upload({ file, type: "bill_of_lading" });
      } catch {
        // Expected
      }
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });
});
