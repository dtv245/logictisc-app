import { describe, expect, it } from "vitest";

import { convertDistance, formatDistance } from "@/utils/distance";

describe("distance", () => {
  it("keeps the source unit when no display unit is requested", () => {
    expect(formatDistance(450, "mi", { locale: "en-US" })).toBe("450 mi");
    expect(formatDistance(450, "km", { locale: "en-US" })).toBe("450 km");
  });

  it("converts miles to kilometres with the 1.609344 factor", () => {
    expect(convertDistance(1, "mi", "km")).toBeCloseTo(1.609344, 6);
    expect(formatDistance(450, "mi", { displayUnit: "km", locale: "en-US" })).toBe(
      "724.2 km",
    );
  });

  it("never turns missing data into zero", () => {
    expect(formatDistance(null, "mi")).toBe("—");
    expect(formatDistance(undefined, "mi")).toBe("—");
    expect(formatDistance(Number.NaN, "mi")).toBe("—");
  });

  it("respects the requested number of fraction digits", () => {
    expect(
      formatDistance(520.256, "mi", {
        locale: "en-US",
        maximumFractionDigits: 2,
      }),
    ).toBe("520.26 mi");
  });
});
