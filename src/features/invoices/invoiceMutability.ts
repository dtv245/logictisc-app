/** Rated and issued financial history can only change through explicit billing commands. */
export function isLegacyDraftInvoice(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const fields = Object.fromEntries(Object.entries(value));
  return typeof fields.status === "string" && fields.status.toUpperCase() === "DRAFT" &&
    !fields.ratingSnapshotId && !fields.invoicePurpose && !fields.billingChainId;
}
