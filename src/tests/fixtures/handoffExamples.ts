/** Immutable schema-only handoff examples. Never import these into production commands. */
import { readFileSync } from "node:fs";
export interface HandoffExample { name: string; method: string; path: string; body?: Record<string, unknown>; query?: Record<string, unknown>; note?: string }
const catalog: { scope: string; examples: HandoffExample[] } = JSON.parse(readFileSync("docs/frontend-backend-handoff/docs/frontend/request-examples.json", "utf8"));
export const handoffExamples = catalog.examples;
export const handoffExampleProvenance = {
  scope: catalog.scope,
  source: "docs/frontend-backend-handoff/docs/frontend/request-examples.json",
  sha256: "cf0d5e53fa688fcb3c59a1978acf836783a49d30d93d8c0798d1cf0f1ed1ea9e",
} as const;
