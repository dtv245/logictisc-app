import { describe, expect, it } from "vitest";
import {
  dayjs,
  exclusiveToInclusiveLastDate,
  formatPeriodConfirmation,
  getAllSupportedTimeZones,
  getFleetPeriodPresets,
  getTimeZoneDisplayName,
  inclusiveToExclusiveLastDate,
  isDateDisabledAfterToday,
  COMMON_TIMEZONES,
} from "@/features/fleet/fleetDateRange";

describe("fleetDateRange", () => {
  describe("inclusiveToExclusiveLastDate", () => {
    it("converts regular day to next day in Asia/Ho_Chi_Minh", () => {
      const res = inclusiveToExclusiveLastDate("2026-10-15", "Asia/Ho_Chi_Minh");
      expect(res).toBe("2026-10-16");
    });

    it("converts end of month to first of next month", () => {
      const res = inclusiveToExclusiveLastDate("2026-10-31", "Asia/Ho_Chi_Minh");
      expect(res).toBe("2026-11-01");
    });

    it("converts end of year to first of next year", () => {
      const res = inclusiveToExclusiveLastDate("2026-12-31", "Asia/Ho_Chi_Minh");
      expect(res).toBe("2027-01-01");
    });

    it("handles leap year February properly", () => {
      expect(inclusiveToExclusiveLastDate("2024-02-28", "Asia/Ho_Chi_Minh")).toBe("2024-02-29");
      expect(inclusiveToExclusiveLastDate("2024-02-29", "Asia/Ho_Chi_Minh")).toBe("2024-03-01");
    });

    it("handles non-leap year February properly", () => {
      expect(inclusiveToExclusiveLastDate("2025-02-28", "Asia/Ho_Chi_Minh")).toBe("2025-03-01");
    });

    it("accepts Dayjs objects as input", () => {
      const d = dayjs.tz("2026-05-20", "Asia/Ho_Chi_Minh");
      expect(inclusiveToExclusiveLastDate(d, "Asia/Ho_Chi_Minh")).toBe("2026-05-21");
    });

    it("calculates correctly across different timezones without browser interference", () => {
      expect(inclusiveToExclusiveLastDate("2026-11-01", "America/New_York")).toBe("2026-11-02");
      expect(inclusiveToExclusiveLastDate("2026-06-30", "Europe/London")).toBe("2026-07-01");
      expect(inclusiveToExclusiveLastDate("2026-09-30", "UTC")).toBe("2026-10-01");
    });
  });

  describe("exclusiveToInclusiveLastDate", () => {
    it("converts next day back to inclusive day", () => {
      expect(exclusiveToInclusiveLastDate("2026-11-01", "Asia/Ho_Chi_Minh")).toBe("2026-10-31");
      expect(exclusiveToInclusiveLastDate("2027-01-01", "Asia/Ho_Chi_Minh")).toBe("2026-12-31");
      expect(exclusiveToInclusiveLastDate("2024-03-01", "Asia/Ho_Chi_Minh")).toBe("2024-02-29");
    });

    it("maintains roundtrip identity: exclusiveToInclusive(inclusiveToExclusive(x)) === x", () => {
      const dates = ["2026-01-01", "2026-02-28", "2026-07-15", "2026-10-31", "2026-12-31"];
      for (const d of dates) {
        const exclusive = inclusiveToExclusiveLastDate(d, "Asia/Ho_Chi_Minh");
        const back = exclusiveToInclusiveLastDate(exclusive, "Asia/Ho_Chi_Minh");
        expect(back).toBe(d);
      }
    });
  });

  describe("formatPeriodConfirmation", () => {
    it("renders exact Vietnamese format: Từ 00:00 01/10 đến hết 31/10 (giờ Việt Nam)", () => {
      const res = formatPeriodConfirmation("2026-10-01", "2026-10-31", "Asia/Ho_Chi_Minh", "vi");
      expect(res).toBe("Từ 00:00 01/10 đến hết 31/10 (giờ Việt Nam)");
    });

    it("renders English format when locale is en", () => {
      const res = formatPeriodConfirmation("2026-10-01", "2026-10-31", "Asia/Ho_Chi_Minh", "en");
      expect(res).toBe("From 00:00 01/10 to end of 31/10 (Vietnam time)");
    });

    it("handles Dayjs inputs and other timezones", () => {
      const start = dayjs.tz("2026-05-01", "America/New_York");
      const end = dayjs.tz("2026-05-15", "America/New_York");
      const res = formatPeriodConfirmation(start, end, "America/New_York", "vi");
      expect(res).toBe("Từ 00:00 01/05 đến hết 15/05 (giờ New York)");
    });
  });

  describe("getTimeZoneDisplayName", () => {
    it("returns correct friendly names for popular zones", () => {
      expect(getTimeZoneDisplayName("Asia/Ho_Chi_Minh", "vi")).toBe("giờ Việt Nam");
      expect(getTimeZoneDisplayName("Asia/Ho_Chi_Minh", "en")).toBe("Vietnam time");
      expect(getTimeZoneDisplayName("UTC", "vi")).toBe("giờ UTC");
      expect(getTimeZoneDisplayName("America/New_York", "vi")).toBe("giờ New York");
      expect(getTimeZoneDisplayName("America/Los_Angeles", "vi")).toBe("giờ Los Angeles");
    });
  });

  describe("isDateDisabledAfterToday", () => {
    const fixedNow = dayjs.tz("2026-10-12 14:30:00", "Asia/Ho_Chi_Minh");

    it("allows past dates and today", () => {
      const past = dayjs.tz("2026-10-10", "Asia/Ho_Chi_Minh");
      const today = dayjs.tz("2026-10-12", "Asia/Ho_Chi_Minh");
      expect(isDateDisabledAfterToday(past, "Asia/Ho_Chi_Minh", fixedNow)).toBe(false);
      expect(isDateDisabledAfterToday(today, "Asia/Ho_Chi_Minh", fixedNow)).toBe(false);
    });

    it("disables future dates", () => {
      const tomorrow = dayjs.tz("2026-10-13", "Asia/Ho_Chi_Minh");
      const nextMonth = dayjs.tz("2026-11-01", "Asia/Ho_Chi_Minh");
      expect(isDateDisabledAfterToday(tomorrow, "Asia/Ho_Chi_Minh", fixedNow)).toBe(true);
      expect(isDateDisabledAfterToday(nextMonth, "Asia/Ho_Chi_Minh", fixedNow)).toBe(true);
    });
  });

  describe("getFleetPeriodPresets", () => {
    const fixedNow = dayjs.tz("2026-10-12 10:00:00", "Asia/Ho_Chi_Minh"); // Monday, Oct 12, 2026
    const presets = getFleetPeriodPresets("Asia/Ho_Chi_Minh", undefined, fixedNow);

    it("generates all 8 required presets", () => {
      const labels = presets.map((p) => p.label);
      expect(labels).toEqual([
        "Hôm nay",
        "7 ngày qua",
        "Tuần này",
        "Tuần trước",
        "Tháng này",
        "Tháng trước",
        "Quý này",
        "Quý trước",
      ]);
    });

    it("calculates 'Hôm nay' as [today, today]", () => {
      const todayPreset = presets.find((p) => p.label === "Hôm nay");
      expect(todayPreset).toBeDefined();
      expect(todayPreset!.value[0].format("YYYY-MM-DD")).toBe("2026-10-12");
      expect(todayPreset!.value[1].format("YYYY-MM-DD")).toBe("2026-10-12");
    });

    it("calculates '7 ngày qua' ending today with 7 days coverage", () => {
      const p = presets.find((p) => p.label === "7 ngày qua");
      expect(p).toBeDefined();
      expect(p!.value[0].format("YYYY-MM-DD")).toBe("2026-10-06");
      expect(p!.value[1].format("YYYY-MM-DD")).toBe("2026-10-12");
    });

    it("calculates 'Tháng này' starting at 1st of month and ending today", () => {
      const p = presets.find((p) => p.label === "Tháng này");
      expect(p).toBeDefined();
      expect(p!.value[0].format("YYYY-MM-DD")).toBe("2026-10-01");
      expect(p!.value[1].format("YYYY-MM-DD")).toBe("2026-10-12");
    });

    it("calculates 'Tháng trước' as full preceding month", () => {
      const p = presets.find((p) => p.label === "Tháng trước");
      expect(p).toBeDefined();
      expect(p!.value[0].format("YYYY-MM-DD")).toBe("2026-09-01");
      expect(p!.value[1].format("YYYY-MM-DD")).toBe("2026-09-30");
    });
  });

  describe("timezones listing", () => {
    it("contains Asia/Ho_Chi_Minh in COMMON_TIMEZONES", () => {
      expect(COMMON_TIMEZONES.some((tz) => tz.value === "Asia/Ho_Chi_Minh")).toBe(true);
    });

    it("getAllSupportedTimeZones includes common timezones first and many others", () => {
      const all = getAllSupportedTimeZones();
      expect(all.length).toBeGreaterThan(12);
      expect(all[0].value).toBe("Asia/Ho_Chi_Minh");
    });
  });
});
