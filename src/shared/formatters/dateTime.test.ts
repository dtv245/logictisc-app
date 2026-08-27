/**
 * Verifies instant preservation and explicit user-timezone formatting.
 */
import { describe, expect, it } from "vitest";

import {
  formatInstant,
  serializeInstant,
} from "./dateTime";

describe("instant formatter", () => {
  it("preserves the instant when serializing an offset datetime", () => {
    expect(serializeInstant("2026-07-27T10:00:00+07:00")).toBe(
      "2026-07-27T03:00:00.000Z",
    );
  });

  it("formats in the supplied user timezone", () => {
    expect(
      formatInstant("2026-07-27T03:00:00Z", {
        locale: "en-GB",
        timeZone: "Asia/Ho_Chi_Minh",
        format: {
          day: "2-digit",
          hour: "2-digit",
          hourCycle: "h23",
          minute: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      }),
    ).toBe("27/07/2026, 10:00");
  });

  it("rejects a datetime without an offset", () => {
    expect(() => serializeInstant("2026-07-27T10:00:00")).toThrow(RangeError);
  });
});
