/** Freezes one consequential command across double submission, token replay and unknown outcomes. */
import { ApiHttpError } from "./httpError";

export function createCommandIntent<TPayload, TResult>(send: (payload: TPayload) => Promise<TResult>) {
  let frozen: TPayload | undefined;
  let serialized: string | undefined;
  let inFlight: Promise<TResult> | undefined;
  let outcome: TResult | undefined;
  let resolved = false;
  let rejected = false;
  const execute = (payload: TPayload): Promise<TResult> => {
    const input = JSON.stringify(payload);
    if (serialized !== undefined && input !== serialized) {
      return Promise.reject(new ApiHttpError({ statusCode: 409, code: "COMMAND_INTENT_FROZEN", message: "COMMAND_INTENT_FROZEN", requestId: null }));
    }
    if (inFlight) return inFlight;
    if (resolved) return Promise.resolve(outcome as TResult);
    if (serialized === undefined) {
      // JSON commands contain only transport primitives. Clone before I/O so later
      // form edits cannot change a timeout/401 replay's body or nested evidence.
      serialized = input;
      frozen = JSON.parse(input) as TPayload;
    }
    rejected = false;
    inFlight = Promise.resolve().then(() => send(JSON.parse(serialized!) as TPayload)).then((result) => {
      resolved = true; outcome = result; return result;
    }).catch((error: unknown) => {
      rejected = error instanceof ApiHttpError && [400, 422].includes(error.statusCode);
      throw error;
    }).finally(() => { inFlight = undefined; });
    return inFlight;
  };
  return {
    execute,
    retry: (): Promise<TResult> => frozen === undefined ? Promise.reject(new Error("NO_COMMAND_INTENT")) : execute(frozen),
    hasIntent: () => serialized !== undefined,
    isResolved: () => resolved,
    canRevise: () => rejected && !inFlight,
    reviseRejected: () => {
      if (!rejected || inFlight) throw new Error("COMMAND_OUTCOME_UNRESOLVED");
      frozen = undefined; serialized = undefined; rejected = false;
    },
    // A new intent is only permitted after a known successful result. Domain
    // errors retain identity too; explicit UI correction uses a separate workflow.
    reset: () => { if (!resolved || inFlight) throw new Error("COMMAND_OUTCOME_UNRESOLVED"); frozen = undefined; serialized = undefined; outcome = undefined; resolved = false; },
  };
}
