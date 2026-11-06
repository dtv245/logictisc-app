/** Kiểm tra lịch và ước tính ETA cho form tạo Load (pure, không phụ thuộc React). */

export type DateInput = Date | string | number | null | undefined;

const asDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Giờ giao phải sau giờ lấy. Trả về thông điệp lỗi tiếng Việt hoặc `null`.
 * Bỏ trống một trong hai mốc thì không chặn (field ngày là tuỳ chọn ở BE).
 */
export const validateDeliveryAfterPickup = (
  pickup: DateInput,
  delivery: DateInput,
): string | null => {
  const pickupDate = asDate(pickup);
  const deliveryDate = asDate(delivery);
  if (!pickupDate || !deliveryDate) return null;
  return deliveryDate.getTime() > pickupDate.getTime()
    ? null
    : "Thời gian giao hàng phải sau thời gian lấy hàng";
};

/** Cộng số phút vào mốc thời gian; trả `null` nếu đầu vào không hợp lệ. */
export const addMinutes = (value: DateInput, minutes: number): Date | null => {
  const date = asDate(value);
  if (!date || !Number.isFinite(minutes)) return null;
  return new Date(date.getTime() + minutes * 60_000);
};

/** ETA giao hàng = giờ lấy hàng dự kiến + thời gian chạy OSRM. */
export const estimateDeliveryAt = (
  pickup: DateInput,
  durationMinutes: number | null | undefined,
): Date | null => {
  if (durationMinutes === null || durationMinutes === undefined) return null;
  return addMinutes(pickup, durationMinutes);
};

/** "2 giờ 15 phút" / "45 phút" — dùng cho panel tóm tắt. */
export const formatDurationMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return "—";
  }
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  if (hours === 0) return `${remaining} phút`;
  if (remaining === 0) return `${hours} giờ`;
  return `${hours} giờ ${remaining} phút`;
};
