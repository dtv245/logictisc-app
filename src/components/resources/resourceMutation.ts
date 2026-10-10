/** Whitelists full PUT request DTOs and keeps concurrency tied to the form's read snapshot. */
import { resourceMutationContracts } from "@/types/handoff.generated";
import { ApiHttpError } from "@/providers/api/httpError";

export function buildResourceMutation(
  resource: string,
  values: Record<string, unknown>,
  snapshot?: Record<string, unknown>,
): Record<string, unknown> {
  const contract = Object.entries(resourceMutationContracts).find(([name]) => name === resource)?.[1];
  if (!contract) return values;
  const input = snapshot ? { ...snapshot, ...values } : values;
  const fields: readonly string[] = snapshot ? contract.updateFields : contract.createFields;
  const payload = Object.fromEntries(fields.filter((field) => Object.hasOwn(input, field) && input[field] !== undefined).map((field) => [field, input[field]]));
  if (snapshot && contract.versioned) {
    if (typeof snapshot.version !== "number" || !Number.isSafeInteger(snapshot.version) || snapshot.version < 0) {
      throw new ApiHttpError({ statusCode: 409, code: "CONTRACT_VERSION_UNAVAILABLE", message: "CONTRACT_VERSION_UNAVAILABLE", requestId: null });
    }
    payload.expectedVersion = snapshot.version;
  }
  return payload;
}
