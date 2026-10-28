import type { Terminal } from "@/types/terminal.types";

/** Format a terminal address from its nested or legacy flat API representation. */
export const formatTerminalAddress = (record: Terminal): string => {
  if (record.address && typeof record.address === "object") {
    const parts = [
      record.address.line1,
      record.address.line2,
      record.address.city,
      record.address.state,
      record.address.country,
      record.address.zipCode,
    ].filter((part): part is string => Boolean(part && String(part).trim() !== ""));

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  const flat = record as unknown as Record<string, unknown>;
  const flatParts = [
    flat.addressLine1,
    flat.addressLine2,
    flat.addressCity,
    flat.addressState,
    flat.addressCountry,
    flat.addressZipCode,
  ].filter((part): part is string => Boolean(part && String(part).trim() !== ""));

  return flatParts.length > 0 ? flatParts.join(", ") : "";
};
