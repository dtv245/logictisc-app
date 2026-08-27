/**
 * Verifies exact decimal rounding and large-value currency formatting.
 */
import { describe, expect, it } from "vitest";

import {
  formatMoney,
  toMoneyDecimal,
} from "./money";

describe("money formatter", () => {
  it("formats values beyond Number.MAX_SAFE_INTEGER without precision loss", () => {
    expect(
      formatMoney("9007199254740993.12", {
        locale: "en-US",
        currency: "USD",
      }),
    ).toBe("$9,007,199,254,740,993.12");
  });

  it("rounds with Decimal instead of binary floating-point arithmetic", () => {
    expect(
      formatMoney("1.005", {
        locale: "en-US",
        currency: "USD",
      }),
    ).toBe("$1.01");

    expect(toMoneyDecimal("0.1").plus("0.2").toString()).toBe("0.3");
  });

  it("supports locale-specific accounting presentation", () => {
    expect(
      formatMoney("-12.3", {
        locale: "en-US",
        currency: "USD",
        currencySign: "accounting",
      }),
    ).toBe("($12.30)");
  });
});
