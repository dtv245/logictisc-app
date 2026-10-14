/** Shares allowlist selection while retaining each caller's property ownership policy. */
export function selectMutationFields(
  input: Record<string, unknown>,
  fields: readonly string[],
  ownOnly = false,
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((name) => (!ownOnly || Object.hasOwn(input, name)) && input[name] !== undefined)
      .map((name) => [name, input[name]]),
  );
}
