/**
 * Defines and derives the four-state async content model independently from its
 * React presentation.
 */
export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "empty" }
  | { status: "populated"; data: T };

export interface ResolveAsyncStateOptions<T> {
  isLoading: boolean;
  error?: unknown;
  data?: T;
  isEmpty: (data: T) => boolean;
}

export function resolveAsyncState<T>({
  isLoading,
  error,
  data,
  isEmpty,
}: ResolveAsyncStateOptions<T>): AsyncState<T> {
  if (isLoading) {
    return { status: "loading" };
  }

  if (error !== undefined && error !== null) {
    return { status: "error", error };
  }

  if (data === undefined || isEmpty(data)) {
    return { status: "empty" };
  }

  return { status: "populated", data };
}
