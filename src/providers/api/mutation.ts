/** Validates injected generic CRUD contracts without importing business features. */
import { ApiHttpError } from "./httpError";

export interface ResourceMutationContract {
  createFields: readonly string[];
  updateFields: readonly string[];
  requiredCreate: readonly string[];
  requiredUpdate: readonly string[];
  versioned: boolean;
}

export function guardResourceMutation(contract: ResourceMutationContract, values: unknown, update: boolean): Record<string, unknown> {
  if (typeof values !== "object" || values === null || Array.isArray(values)) throw new Error("INVALID_MUTATION_BODY");
  const input = Object.fromEntries(Object.entries(values));
  const fields = update ? contract.updateFields : contract.createFields;
  const required = update ? contract.requiredUpdate : contract.requiredCreate;
  const missing = required.filter((name) => input[name] === null || input[name] === undefined);
  if (missing.length || (update && contract.versioned && (typeof input.expectedVersion !== "number" || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0))) {
    throw new ApiHttpError({ statusCode: 400, code: "VALIDATION_FAILED", message: "VALIDATION_FAILED", requestId: null,
      fieldErrors: Object.fromEntries(missing.map((name) => [name, ["Required"]])) });
  }
  return Object.fromEntries(fields.filter((name) => input[name] !== undefined).map((name) => [name, input[name]]));
}
