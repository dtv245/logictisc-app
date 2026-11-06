/** Whitelists full PUT request DTOs and keeps concurrency tied to the form's read snapshot. */
import { resourceMutationContracts } from "@/types/handoff.generated";
import { ApiHttpError } from "@/utils/httpError";
import { selectMutationFields } from "@/utils/mutationFields";

/**
 * Các field bổ sung sau khi catalog handoff đã bị đóng băng (additive, optional).
 * Catalog generated không được sửa tay; danh sách này chỉ mở rộng allowlist
 * để field mới của backend đi qua được buildResourceMutation.
 */
const MUTATION_FIELD_EXTENSIONS: Record<
  string,
  { createFields: readonly string[]; updateFields: readonly string[] }
> = {
  loads: {
    createFields: ["weightLbs", "volumeCuft"],
    updateFields: ["weightLbs", "volumeCuft"],
  },
  terminals: {
    createFields: ["latitude", "longitude", "workingHoursOpen", "workingHoursClose"],
    updateFields: ["latitude", "longitude", "workingHoursOpen", "workingHoursClose"],
  },
  customers: {
    createFields: ["paymentTermsDays", "defaultCurrency"],
    updateFields: ["paymentTermsDays", "defaultCurrency"],
  },
};

export function buildResourceMutation(
  resource: string,
  values: Record<string, unknown>,
  snapshot?: Record<string, unknown>,
): Record<string, unknown> {
  const contract = Object.entries(resourceMutationContracts).find(([name]) => name === resource)?.[1];
  if (!contract) return values;
  const input = snapshot ? { ...snapshot, ...values } : values;
  const baseFields: readonly string[] = snapshot ? contract.updateFields : contract.createFields;
  const extension = MUTATION_FIELD_EXTENSIONS[resource];
  const fields = extension
    ? [...baseFields, ...(snapshot ? extension.updateFields : extension.createFields)]
    : baseFields;
  const payload = selectMutationFields(input, fields, true);
  if (snapshot && contract.versioned) {
    if (typeof snapshot.version !== "number" || !Number.isSafeInteger(snapshot.version) || snapshot.version < 0) {
      throw new ApiHttpError({ statusCode: 409, code: "CONTRACT_VERSION_UNAVAILABLE", message: "CONTRACT_VERSION_UNAVAILABLE", requestId: null });
    }
    payload.expectedVersion = snapshot.version;
  }
  return payload;
}
