/**
 * Deduplicates an asynchronous action while its current promise is pending.
 */
export interface ActivePromiseRef<T> {
  current: Promise<T> | null;
}

export function runSingleFlight<T>(
  activePromise: ActivePromiseRef<T>,
  action: () => Promise<T>,
): Promise<T> {
  if (activePromise.current) {
    return activePromise.current;
  }

  // Scheduling the action in a microtask installs the active promise before
  // user code can re-enter the runner synchronously.
  const pendingAction = Promise.resolve()
    .then(action)
    .finally(() => {
      activePromise.current = null;
    });
  activePromise.current = pendingAction;
  return pendingAction;
}
