import { describe, expect, it } from "vitest";
import {
  containerCheckDigit,
  containerNumberError,
  isValidContainerNumber,
  normalizeContainerNumber,
} from "./containerNumber";

describe("ISO 6346 container number", () => {
  it("chấp nhận số hiệu hợp lệ và bỏ qua khoảng trắng/gạch nối", () => {
    expect(isValidContainerNumber("CSQU3054383")).toBe(true);
    expect(isValidContainerNumber("csqu 305438-3")).toBe(true);
    expect(normalizeContainerNumber("msku 388110-1")).toBe("MSKU3881101");
  });

  it("từ chối chữ số kiểm tra sai", () => {
    expect(isValidContainerNumber("CSQU3054384")).toBe(false);
    expect(containerNumberError("CSQU3054384")).toBe(
      "Số container không đúng chữ số kiểm tra ISO 6346",
    );
  });

  it("từ chối sai định dạng", () => {
    expect(isValidContainerNumber("CSQU305438")).toBe(false);
    expect(isValidContainerNumber("1SQU3054383")).toBe(false);
    expect(containerNumberError("CSQ3054383")).toBe(
      "Số container phải gồm 4 chữ cái và 7 chữ số (ví dụ: CSQU3054383)",
    );
  });

  it("tính đúng chữ số kiểm tra", () => {
    expect(containerCheckDigit("CSQU305438")).toBe(3);
    expect(containerCheckDigit("MSKU388110")).toBe(7);
    expect(containerCheckDigit("ABC")).toBeNull();
  });

  it("ô trống không báo lỗi", () => {
    expect(containerNumberError("")).toBeNull();
    expect(containerNumberError(null)).toBeNull();
    expect(containerNumberError(undefined)).toBeNull();
  });
});
