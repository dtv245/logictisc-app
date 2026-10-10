import { useCallback, useRef } from "react";
import { useCustomMutation, useInvalidate } from "@refinedev/core";
import { buildDocumentFormData, type DocumentUploadPayload } from "./documents.api";
import type { Document } from "@/types/document.types";
import type { ApiError } from "@/types/api.types";

export interface UseDocumentUploadOptions {
  onSuccess?: (document: Document) => void;
  onError?: (error: ApiError) => void;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const invalidate = useInvalidate();
  const isSubmittingRef = useRef(false);

  const {
    mutateAsync,
    isLoading,
    error,
    isSuccess,
    reset,
  } = useCustomMutation<Document, ApiError, FormData>();

  const upload = useCallback(
    async (payload: DocumentUploadPayload): Promise<Document | undefined> => {
      // Guard against double-click while request is in-flight
      if (isSubmittingRef.current || isLoading) {
        return undefined;
      }

      isSubmittingRef.current = true;
      try {
        const formData = buildDocumentFormData(payload);
        const result = await mutateAsync({
          url: "/api/documents",
          method: "post",
          values: formData,
        });

        // Invalidate documents list query on successful upload
        invalidate({
          resource: "documents",
          invalidates: ["list"],
        });

        options.onSuccess?.(result.data);
        return result.data;
      } catch (err) {
        const apiError = err as ApiError;
        options.onError?.(apiError);
        throw err;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [isLoading, mutateAsync, invalidate, options],
  );

  return {
    upload,
    isLoading,
    error,
    isSuccess,
    reset,
  };
};
