import { describe, expect, it } from "vitest";

import {
  assessSuggestionConfidence,
  assessSuggestionScore,
  summarizeSuggestionReasoning,
  SUGGESTION_SCORE_THRESHOLDS,
} from "./suggestionAssessment";

describe("suggestion assessment display", () => {
  it("uses the single provisional score thresholds and handles missing values", () => {
    expect(assessSuggestionScore(SUGGESTION_SCORE_THRESHOLDS.verySuitable)).toBe("verySuitable");
    expect(assessSuggestionScore(SUGGESTION_SCORE_THRESHOLDS.suitable)).toBe("suitable");
    expect(assessSuggestionScore(59)).toBe("consider");
    expect(assessSuggestionScore(null)).toBe("unknown");
    expect(assessSuggestionScore("n/a")).toBe("unknown");
  });

  it("maps confidence to plain-language levels and preserves unknown fallback", () => {
    expect(assessSuggestionConfidence("HIGH")).toBe("verySuitable");
    expect(assessSuggestionConfidence("medium")).toBe("suitable");
    expect(assessSuggestionConfidence("LOW")).toBe("consider");
    expect(assessSuggestionConfidence("UNVERIFIED")).toBe("unknown");
  });

  it("limits the reason summary to three sentences", () => {
    expect(summarizeSuggestionReasoning("Đúng tuyến. Xe gần. Tài xế rảnh. Có ghi chú thêm."))
      .toEqual(["Đúng tuyến.", "Xe gần.", "Tài xế rảnh."]);
  });
});
