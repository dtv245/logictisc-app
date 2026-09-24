/**
 * Hiển thị giá trị dạng text an toàn cho table column và field chi tiết.
 *
 * Quy tắc chung: giá trị rỗng/null/undefined hiển thị dấu "—" thay vì ô trống,
 * giúp người dùng phân biệt "không có dữ liệu" với "chuỗi rống".
 */

export const EMPTY_VALUE_PLACEHOLDER = "—";

/**
 * Ép giá trị cell về chuỗi hiển thị; trả về placeholder khi rỗng.
 */
export function displayValue(
  value: unknown,
  fallback: string = EMPTY_VALUE_PLACEHOLDER,
): string {
  return value ? String(value) : fallback;
}
