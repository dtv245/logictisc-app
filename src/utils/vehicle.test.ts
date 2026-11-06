import { describe, expect, it } from "vitest";

import {
  DEFAULT_VEHICLE_IMAGE,
  VEHICLE_IMAGES,
} from "@/constants/vehicle";
import {
  formatCapacity,
  formatCapacityAlt,
  formatDriver,
  formatLocation,
  getVehicleImage,
  getVehicleStatusMeta,
  normalizeVi,
} from "@/utils/vehicle";

describe("vehicle display helpers", () => {
  it("keeps SEMI mapped to the tractor head image and falls back for unknown types", () => {
    expect(getVehicleImage("SEMI")).toBe(VEHICLE_IMAGES.SEMI);
    expect(getVehicleImage("NEW_TYPE")).toBe(DEFAULT_VEHICLE_IMAGE);
  });

  it("shows an unknown status unchanged with a neutral tag", () => {
    expect(getVehicleStatusMeta("PENDING")).toEqual({
      label: "PENDING",
      tagColor: "default",
      dotColor: "#98A2B3",
    });
  });

  it("formats capacity, drivers, and missing locations without null output", () => {
    expect(formatCapacity(46_000)).toBe("46.000 lbs");
    expect(formatCapacityAlt(46_000)).toBe("≈ 20.865 kg");
    expect(formatDriver(null, null)).toBe("Chưa gán");
    expect(formatLocation(null, null)).toBe("Chưa cập nhật vị trí");
  });

  it("normalizes Vietnamese accents for local page search", () => {
    expect(normalizeVi("Nguyễn Văn An")).toBe("nguyen van an");
  });
});
