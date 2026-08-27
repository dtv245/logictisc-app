/**
 * Kiểm thử deep-link sanitizer dùng cho OIDC custom state.
 */

import { describe, expect, it } from "vitest";

import { normalizeLocalReturnTo } from "./oidcGateway";

describe("normalizeLocalReturnTo", () => {
  it("keeps internal paths including query and hash", () => {
    expect(
      normalizeLocalReturnTo("/loads/123?page=2#documents"),
    ).toBe("/loads/123?page=2#documents");
  });

  it("blocks absolute and protocol-relative open redirects", () => {
    expect(
      normalizeLocalReturnTo("https://attacker.example/path"),
    ).toBe("/");
    expect(normalizeLocalReturnTo("//attacker.example/path")).toBe("/");
  });

  it.each([
    "/\\attacker.example/path",
    "/%5Cattacker.example/path",
    "/%255Cattacker.example/path",
    "/%2Fattacker.example/path",
    "/%252Fattacker.example/path",
  ])("blocks router-normalized redirect payload %s", (candidate) => {
    expect(normalizeLocalReturnTo(candidate)).toBe("/");
  });
});
