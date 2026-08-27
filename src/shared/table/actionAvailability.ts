/**
 * Provides the action-level UI seam where resolved permission and entity-state
 * rules meet.
 *
 * This controls presentation only; the backend remains the authorization
 * authority for every mutation.
 */
export interface ActionAvailabilityInput<TEntity> {
  entity: TEntity;
  permissionGranted: boolean | undefined;
  isStateAllowed: (entity: TEntity) => boolean;
  pending?: boolean;
}

export interface ActionAvailability {
  visible: boolean;
  enabled: boolean;
}

export function resolveActionAvailability<TEntity>({
  entity,
  permissionGranted,
  isStateAllowed,
  pending = false,
}: ActionAvailabilityInput<TEntity>): ActionAvailability {
  const visible =
    permissionGranted === true && isStateAllowed(entity);

  return {
    visible,
    enabled: visible && !pending,
  };
}
