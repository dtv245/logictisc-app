/**
 * Kiểm chứng redirect không nhận URL ngoài hoặc backslash dễ gây open redirect.
 */

import { describe, expect, it } from "vitest";

import { routes, safeInternalPath } from "./routes";

describe("safeInternalPath", () => {
  it("keeps an internal deep link", () => {
    expect(safeInternalPath("/loads/123?tab=documents")).toBe(
      "/loads/123?tab=documents",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "/%5Cevil.example",
  ])("rejects unsafe redirect %s", (candidate) => {
    expect(safeInternalPath(candidate)).toBe(routes.diagnostics);
  });
});
