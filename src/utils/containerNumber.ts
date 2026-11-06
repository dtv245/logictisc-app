/**
 * ISO 6346 — kiểm tra số hiệu container (11 ký tự: 3 chữ chủ sở hữu,
 * 1 chữ loại thiết bị U/J/Z, 6 chữ số serial, 1 chữ số kiểm tra).
 *
 * Chuẩn không mã hoá kích thước/loại container trong số hiệu; kích thước
 * (20ft/40ft…) và ISO type là dữ liệu riêng (`containers.iso_type`), nên
 * module này chỉ xác thực, không suy ra kích thước.
 */

const LETTER_VALUES: Readonly<Record<string, number>> = (() => {
  // A = 10, B = 12 … bỏ qua các bội số của 11 (11, 22, 33).
  const values: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value += 1;
    values[letter] = value;
    value += 1;
  }
  return values;
})();

const CONTAINER_PATTERN = /^[A-Z]{4}\d{7}$/;

/** Chuẩn hoá: bỏ khoảng trắng/gạch nối, chuyển chữ hoa. */
export const normalizeContainerNumber = (value: string): string =>
  value.replace(/[\s-]/g, "").toUpperCase();

/** Chữ số kiểm tra ISO 6346 của 10 ký tự đầu; `null` nếu sai định dạng. */
export const containerCheckDigit = (value: string): number | null => {
  const normalized = normalizeContainerNumber(value);
  if (!/^[A-Z]{4}\d{6}/.test(normalized)) return null;

  let sum = 0;
  for (let index = 0; index < 10; index += 1) {
    const character = normalized[index];
    const digit = /\d/.test(character)
      ? Number(character)
      : LETTER_VALUES[character];
    if (digit === undefined) return null;
    sum += digit * 2 ** index;
  }
  const remainder = sum % 11;
  return remainder === 10 ? 0 : remainder;
};

/** `true` khi số hiệu đúng định dạng và đúng chữ số kiểm tra. */
export const isValidContainerNumber = (value: string): boolean => {
  const normalized = normalizeContainerNumber(value);
  if (!CONTAINER_PATTERN.test(normalized)) return false;
  return containerCheckDigit(normalized) === Number(normalized[10]);
};

/**
 * Thông điệp lỗi tiếng Việt cho form, hoặc `null` khi hợp lệ.
 * Ô trống được coi là hợp lệ để dùng chung cho field không bắt buộc.
 */
export const containerNumberError = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined || value.trim() === "") return null;
  const normalized = normalizeContainerNumber(value);
  if (!CONTAINER_PATTERN.test(normalized)) {
    return "Số container phải gồm 4 chữ cái và 7 chữ số (ví dụ: CSQU3054383)";
  }
  if (!isValidContainerNumber(normalized)) {
    return "Số container không đúng chữ số kiểm tra ISO 6346";
  }
  return null;
};
