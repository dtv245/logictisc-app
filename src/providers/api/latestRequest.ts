/**
 * Cancels stale list/search requests without discarding Refine cancellation.
 *
 * A newer request for the same resource aborts the previous transport, while
 * the upstream TanStack Query signal can still abort the current request.
 */

export interface CoordinatedRequest {
  signal: AbortSignal;
  release: () => void;
}

export interface LatestRequestCoordinator {
  begin: (
    key: string,
    upstreamSignal?: AbortSignal,
  ) => CoordinatedRequest;
  cancel: (key: string) => void;
  cancelAll: () => void;
}

export const createLatestRequestCoordinator =
  (): LatestRequestCoordinator => {
    const controllers = new Map<string, AbortController>();

    const cancel = (key: string): void => {
      controllers.get(key)?.abort();
      controllers.delete(key);
    };

    return {
      begin(key, upstreamSignal) {
        cancel(key);

        const controller = new AbortController();
        controllers.set(key, controller);

        const forwardAbort = (): void => {
          controller.abort(upstreamSignal?.reason);
        };

        if (upstreamSignal?.aborted) {
          forwardAbort();
        } else {
          upstreamSignal?.addEventListener("abort", forwardAbort, {
            once: true,
          });
        }

        return {
          signal: controller.signal,
          release() {
            upstreamSignal?.removeEventListener("abort", forwardAbort);

            if (controllers.get(key) === controller) {
              controllers.delete(key);
            }
          },
        };
      },
      cancel,
      cancelAll() {
        for (const controller of controllers.values()) {
          controller.abort();
        }

        controllers.clear();
      },
    };
  };
