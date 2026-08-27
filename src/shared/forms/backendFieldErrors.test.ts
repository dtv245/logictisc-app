/**
 * Verifies backend field-path mapping and first-error focus behavior.
 */
import { describe, expect, it, vi } from "vitest";

import {
  applyBackendFieldErrors,
  mapBackendFieldErrors,
  parseBackendFieldPath,
  type FieldErrorFormTarget,
} from "./backendFieldErrors";

describe("backendFieldErrors", () => {
  it("parses nested collection paths for Ant Design Form", () => {
    expect(parseBackendFieldPath("stops[0].address.city")).toEqual([
      "stops",
      0,
      "address",
      "city",
    ]);
  });

  it("maps multiple messages and explicit field names", () => {
    expect(
      mapBackendFieldErrors(
        {
          requestedPickupDate: ["Required", "Invalid"],
        },
        {
          requestedPickupDate: ["schedule", "pickup"],
        },
      ),
    ).toEqual([
      {
        name: ["schedule", "pickup"],
        errors: ["Required", "Invalid"],
      },
    ]);
  });

  it("sets errors and focuses the first invalid control", () => {
    const form: FieldErrorFormTarget = {
      setFields: vi.fn(),
      scrollToField: vi.fn(),
    };

    expect(
      applyBackendFieldErrors(form, {
        email: ["Invalid"],
        firstName: ["Required"],
      }),
    ).toBe(true);
    expect(form.setFields).toHaveBeenCalledWith([
      { name: "email", errors: ["Invalid"] },
      { name: "firstName", errors: ["Required"] },
    ]);
    expect(form.scrollToField).toHaveBeenCalledWith("email", {
      block: "center",
      focus: true,
    });
  });
});
