/**
 * Supplies stable UUID table row keys and rejects index-based fallbacks.
 */
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function assertUuidRowKey(value: string): string {
  if (!isUuid(value)) {
    throw new TypeError("A stable UUID is required for a table row key.");
  }
  return value;
}

export function uuidRowKey<TEntity extends { id: string }>(
  entity: TEntity,
): string {
  return assertUuidRowKey(entity.id);
}

export function createUuidRowKey<TEntity>(
  selectId: (entity: TEntity) => string,
): (entity: TEntity) => string {
  return (entity) => assertUuidRowKey(selectId(entity));
}
