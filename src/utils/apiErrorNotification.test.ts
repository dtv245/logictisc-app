import { describe, expect, it } from "vitest";
import { resolveNotificationError } from "@/utils/apiErrorNotification";

describe("notification lỗi không có mã", () => {
  it("không hiển thị nhãn mã rỗng", () => {
    const result = resolveNotificationError({
      kind: "compatibility", rawMessage: "Đã xảy ra lỗi (mã: )", rawDescription: "",
      message: "Đã xảy ra lỗi (mã: )", operation: "unknown",
      statusCode: undefined, resourceLabel: undefined, description: undefined,
    });
    expect(result.message).toBe("Đã xảy ra lỗi");
  });
});
