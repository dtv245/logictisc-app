/**
 * Verifies UUID row keys and the action permission/state seam.
 */
import { describe, expect, it } from "vitest";

import { resolveActionAvailability } from "./actionAvailability";
import {
  assertUuidRowKey,
  createUuidRowKey,
} from "./rowKeys";

const stableId = "0198-ffff";
const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("UUID row keys", () => {
  it("returns a valid UUID selected from an entity", () => {
    const rowKey = createUuidRowKey<{ loadId: string }>(
      ({ loadId }) => loadId,
    );

    expect(rowKey({ loadId: uuid })).toBe(uuid);
  });

  it("rejects unstable non-UUID keys", () => {
    expect(() => assertUuidRowKey(stableId)).toThrow(TypeError);
  });
});

describe("resolveActionAvailability", () => {
  it("requires both permission and valid entity state", () => {
    expect(
      resolveActionAvailability({
        entity: { state: "draft" },
        permissionGranted: true,
        isStateAllowed: ({ state }) => state === "draft",
      }),
    ).toEqual({ visible: true, enabled: true });

    expect(
      resolveActionAvailability({
        entity: { state: "draft" },
        permissionGranted: false,
        isStateAllowed: () => true,
      }),
    ).toEqual({ visible: false, enabled: false });
  });

  it("keeps a pending action visible but disabled", () => {
    expect(
      resolveActionAvailability({
        entity: {},
        permissionGranted: true,
        isStateAllowed: () => true,
        pending: true,
      }),
    ).toEqual({ visible: true, enabled: false });
  });
});
