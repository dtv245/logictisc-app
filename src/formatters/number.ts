/**
 * Chuẩn hóa số nguyên cho pagination và tham số URL.
 *
 * Các giá trị đến từ URL state hoặc query serializer có thể bị chỉnh tay
 * thành thập phân/chuỗi không hợp lệ, nên luôn parse an toàn rồi clamp
 * trong khoảng [minimum, maximum].
 */

/**
 * Cắt phần thập phân; trả về fallback khi không phải số hữu hạn.
 */
export const truncateToInteger = (
  value: number,
  fallback: number,
): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : fallback;

/**
 * Kẹp giá trị vào khoảng [minimum, maximum].
 */
export const clampInteger = (
  value: number,
  minimum: number,
  maximum: number,
): number => Math.min(maximum, Math.max(minimum, value));

/**
 * Parse giá trị URL state (số, chuỗi chữ số, hoặc rỗng) thành số nguyên
 * đã clamp; trả về fallback khi không parse được.
 */
export const parseClampedInteger = (
  value: string | number | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const parsed =
    typeof value === "number"
      ? Math.trunc(value)
      : value !== null && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clampInteger(parsed, minimum, maximum);
};
