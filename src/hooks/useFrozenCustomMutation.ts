/** Preserves keyed custom command bodies across uncertain outcomes without adding automatic retries. */
import { useCustomMutation, type BaseRecord, type CustomResponse } from "@refinedev/core";
import { useRef } from "react";
import { ApiHttpError, normalizeHttpError } from "@/providers/api/httpError";
import type { CustomResponseMeta } from "@/types/apiClient.types";

interface Command {
  url: string;
  method: "post" | "put";
  values: unknown;
  meta?: CustomResponseMeta;
  errorNotification?: false;
  successNotification?: false;
}
export function useFrozenCustomMutation<TData extends BaseRecord>() {
  const mutation = useCustomMutation<TData, ApiHttpError, unknown>();
  const unresolved = useRef<{ signature: string; command: Command } | null>(null);
  const mutateAsync = async (command: Command): Promise<CustomResponse<TData>> => {
    const body = command.values;
    const keyed = typeof body === "object" && body !== null && "idempotencyKey" in body;
    const signature = JSON.stringify(command);
    if (keyed && unresolved.current && unresolved.current.signature !== signature) {
      throw new ApiHttpError({ statusCode: 409, code: "COMMAND_INTENT_FROZEN", message: "COMMAND_INTENT_FROZEN", requestId: null });
    }
    if (keyed && !unresolved.current) unresolved.current = { signature, command: JSON.parse(signature) as Command };
    try {
      const response = await mutation.mutateAsync(keyed ? unresolved.current!.command : command);
      unresolved.current = null;
      return response;
    } catch (cause) {
      const error = normalizeHttpError(cause);
      // A named input/state rejection proves this attempt did not commit. Unknown
      // transport/server outcomes and idempotency conflicts must keep their identity.
      if ([400, 403, 404, 409, 422].includes(error.statusCode) && !error.code.includes("IDEMPOTENCY") && error.code !== "COMMAND_INTENT_FROZEN") unresolved.current = null;
      throw error;
    }
  };
  return { ...mutation, mutateAsync };
}
