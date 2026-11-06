import { describe, expect, it } from "vitest";
import {
  buildOsrmRouteUrl,
  coordinatesDiffer,
  isUsableCoordinate,
  parseOsrmRouteResponse,
} from "./routeEstimate";

describe("route estimate", () => {
  it("nhận toạ độ hợp lệ và loại mặc định 0,0", () => {
    expect(isUsableCoordinate({ latitude: 32.7767, longitude: -96.797 })).toBe(true);
    expect(isUsableCoordinate({ latitude: 0, longitude: 0 })).toBe(false);
    expect(isUsableCoordinate({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isUsableCoordinate(null)).toBe(false);
  });

  it("chỉ gọi routing khi hai điểm khác nhau", () => {
    const point = { latitude: 32.7767, longitude: -96.797 };
    expect(coordinatesDiffer(point, { latitude: 30.2672, longitude: -97.7431 })).toBe(true);
    expect(coordinatesDiffer(point, { ...point })).toBe(false);
  });

  it("dựng URL OSRM đúng thứ tự longitude,latitude", () => {
    const url = buildOsrmRouteUrl(
      "https://router.example.org/route/v1/driving/",
      { latitude: 32.7767, longitude: -96.797 },
      { latitude: 30.2672, longitude: -97.7431 },
    );
    expect(url).toBe(
      "https://router.example.org/route/v1/driving/-96.797,32.7767;-97.7431,30.2672?overview=false",
    );
  });

  it("đọc khoảng cách dặm và thời gian phút từ OSRM", () => {
    expect(
      parseOsrmRouteResponse({
        code: "Ok",
        routes: [{ distance: 321868.8, duration: 11220 }],
      }),
    ).toEqual({ distanceMiles: 200, durationMinutes: 187 });
  });

  it("trả null cho phản hồi lỗi thay vì bịa số", () => {
    expect(parseOsrmRouteResponse({ code: "NoRoute", routes: [] })).toBeNull();
    expect(parseOsrmRouteResponse({ code: "Ok", routes: [] })).toBeNull();
    expect(parseOsrmRouteResponse({ code: "Ok", routes: [{ distance: "x" }] })).toBeNull();
    expect(parseOsrmRouteResponse(null)).toBeNull();
  });
});
