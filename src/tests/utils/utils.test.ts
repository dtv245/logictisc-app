import { describe, expect, it } from "vitest";

import {
  type ActivePromiseRef,
  type AsyncState,
  isUuid,
  resolveAsyncState,
  runSingleFlight,
  UUID_PATTERN,
} from "@utils";

describe("src/utils barrel exports and behaviors", () => {
  describe("asyncStateModel", () => {
    it("returns loading status when isLoading is true", () => {
      const state: AsyncState<string[]> = resolveAsyncState({
        isLoading: true,
        data: ["item"],
        isEmpty: (d) => d.length === 0,
      });
      expect(state).toEqual({ status: "loading" });
    });

    it("returns error status when error is present", () => {
      const error = new Error("Failed");
      const state = resolveAsyncState({
        isLoading: false,
        error,
        isEmpty: () => false,
      });
      expect(state).toEqual({ status: "error", error });
    });

    it("returns empty status when data is undefined or matches isEmpty", () => {
      const emptyFromUndefined = resolveAsyncState<string[]>({
        isLoading: false,
        data: undefined,
        isEmpty: (d) => d.length === 0,
      });
      expect(emptyFromUndefined).toEqual({ status: "empty" });

      const emptyFromCheck = resolveAsyncState<string[]>({
        isLoading: false,
        data: [],
        isEmpty: (d) => d.length === 0,
      });
      expect(emptyFromCheck).toEqual({ status: "empty" });
    });

    it("returns populated status with data when valid data is provided", () => {
      const state = resolveAsyncState<string[]>({
        isLoading: false,
        data: ["hello"],
        isEmpty: (d) => d.length === 0,
      });
      expect(state).toEqual({ status: "populated", data: ["hello"] });
    });
  });

  describe("singleFlight", () => {
    it("deduplicates concurrent calls and executes action only once", async () => {
      const ref: ActivePromiseRef<number> = { current: null };
      let executionCount = 0;

      const runAction = () =>
        runSingleFlight(ref, async () => {
          executionCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return 42;
        });

      const [res1, res2, res3] = await Promise.all([
        runAction(),
        runAction(),
        runAction(),
      ]);

      expect(res1).toBe(42);
      expect(res2).toBe(42);
      expect(res3).toBe(42);
      expect(executionCount).toBe(1);
      expect(ref.current).toBeNull();
    });

    it("allows subsequent executions after the previous promise finishes", async () => {
      const ref: ActivePromiseRef<string> = { current: null };
      let counter = 0;

      const runAction = () =>
        runSingleFlight(ref, async () => {
          counter += 1;
          return `result-${counter}`;
        });

      const first = await runAction();
      const second = await runAction();

      expect(first).toBe("result-1");
      expect(second).toBe("result-2");
      expect(counter).toBe(2);
    });
  });

  describe("uuid", () => {
    it("validates valid UUIDs correctly", () => {
      expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isUuid("A987FBC9-4BED-4202-878E-00EBBEB304AC")).toBe(true);
    });

    it("rejects invalid UUID strings or undefined", () => {
      expect(isUuid(undefined)).toBe(false);
      expect(isUuid("")).toBe(false);
      expect(isUuid("not-a-uuid")).toBe(false);
      expect(isUuid("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // too short
    });

    it("exports UUID_PATTERN regex", () => {
      expect(UUID_PATTERN).toBeInstanceOf(RegExp);
      expect(UUID_PATTERN.test("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });
  });
});
