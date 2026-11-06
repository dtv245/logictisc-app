import type { Terminal } from "@/types/terminal.types";
import { isUsableCoordinate } from "@/utils/routeEstimate";

const firstNonBlank = (
  ...values: Array<string | null | undefined>
): string | undefined => {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed !== "") return trimmed;
  }
  return undefined;
};

/**
 * Chuyển địa chỉ Terminal (dạng phẳng từ API hoặc object `address` lồng nhau)
 * thành các field của form Load, ví dụ `originAddressCity`.
 *
 * Khi truyền `coordinatePrefix` và Terminal có toạ độ dùng được (không phải
 * mặc định 0,0), điền luôn vĩ độ/kinh độ.
 */
export const buildTerminalAddressValues = (
  terminal: Terminal,
  prefix: string,
  coordinatePrefix?: string,
): Record<string, string | number> => {
  const nested = terminal.address;
  const entries: Array<[string, string | number | undefined]> = [
    [`${prefix}Line1`, firstNonBlank(terminal.addressLine1, nested?.line1)],
    [`${prefix}Line2`, firstNonBlank(terminal.addressLine2, nested?.line2)],
    [`${prefix}City`, firstNonBlank(terminal.addressCity, nested?.city)],
    [`${prefix}State`, firstNonBlank(terminal.addressState, nested?.state)],
    [`${prefix}ZipCode`, firstNonBlank(terminal.addressZipCode, nested?.zipCode)],
    [
      `${prefix}Country`,
      firstNonBlank(terminal.addressCountry, nested?.country, terminal.countryCode),
    ],
  ];

  if (coordinatePrefix) {
    const coordinate = {
      latitude: terminal.latitude ?? Number.NaN,
      longitude: terminal.longitude ?? Number.NaN,
    };
    if (isUsableCoordinate(coordinate)) {
      entries.push(
        [`${coordinatePrefix}Latitude`, coordinate.latitude],
        [`${coordinatePrefix}Longitude`, coordinate.longitude],
      );
    }
  }

  return Object.fromEntries(
    entries.filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined,
    ),
  );
};
