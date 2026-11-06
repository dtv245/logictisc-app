import { describe, expect, it } from "vitest";
import type { Terminal } from "@/types/terminals/terminal.types";
import { buildTerminalAddressValues } from "./terminalAutofill";

const base = {
  id: "term-1",
  name: "Cat Lai",
  code: "VNSGN",
  countryCode: "VN",
  type: "SEA_PORT",
  createdAt: "2026-01-01T00:00:00Z",
} as Terminal;

describe("terminal autofill", () => {
  it("điền từ field phẳng của API", () => {
    expect(
      buildTerminalAddressValues(
        {
          ...base,
          addressLine1: "1 Nguyễn Văn A",
          addressLine2: "Kho B",
          addressCity: "TP.HCM",
          addressState: "HCM",
          addressZipCode: "700000",
          addressCountry: "VN",
        },
        "originAddress",
      ),
    ).toEqual({
      originAddressLine1: "1 Nguyễn Văn A",
      originAddressLine2: "Kho B",
      originAddressCity: "TP.HCM",
      originAddressState: "HCM",
      originAddressZipCode: "700000",
      originAddressCountry: "VN",
    });
  });

  it("điền từ object address lồng nhau và fallback countryCode", () => {
    expect(
      buildTerminalAddressValues(
        {
          ...base,
          address: {
            line1: "2 Lê Lợi",
            city: "Hà Nội",
            state: "HN",
            zipCode: "100000",
            country: "",
          },
        },
        "destinationAddress",
      ),
    ).toEqual({
      destinationAddressLine1: "2 Lê Lợi",
      destinationAddressCity: "Hà Nội",
      destinationAddressState: "HN",
      destinationAddressZipCode: "100000",
      destinationAddressCountry: "VN",
    });
  });

  it("bỏ qua giá trị rỗng và khoảng trắng", () => {
    expect(
      buildTerminalAddressValues({ ...base, addressLine1: "   " }, "originAddress"),
    ).toEqual({ originAddressCountry: "VN" });
  });

  it("điền toạ độ khi Terminal có toạ độ dùng được", () => {
    expect(
      buildTerminalAddressValues(
        { ...base, latitude: 10.75, longitude: 106.75 },
        "originAddress",
        "originLocation",
      ),
    ).toEqual({
      originAddressCountry: "VN",
      originLocationLatitude: 10.75,
      originLocationLongitude: 106.75,
    });
  });

  it("bỏ qua toạ độ mặc định (0,0) hoặc thiếu", () => {
    expect(
      buildTerminalAddressValues(
        { ...base, latitude: 0, longitude: 0 },
        "originAddress",
        "originLocation",
      ),
    ).toEqual({ originAddressCountry: "VN" });

    expect(
      buildTerminalAddressValues(
        { ...base, latitude: 10.75 },
        "originAddress",
        "originLocation",
      ),
    ).toEqual({ originAddressCountry: "VN" });
  });
});
