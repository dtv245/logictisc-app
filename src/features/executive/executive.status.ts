/**
 * Quy đổi giá trị chỉ số thành mức trạng thái.
 *
 * Bốn mức, và mức "neutral" là bắt buộc phải có: khi không có ngưỡng đáng tin
 * để so, chỉ số phải hiển thị trung tính thay vì bị tô màu theo phỏng đoán.
 * Tô đỏ một chỉ số không có cơ sở so sánh là làm ban điều hành lo lắng vô căn cứ.
 */

import type { StatusLevel } from "@/types/executive.types";

export const resolveStatus = (
  actual: number | undefined,
  target: number | undefined,
  higherIsBetter: boolean,
  warnBandRatio?: number,
): StatusLevel => {
  if (
    actual === undefined ||
    target === undefined ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target) ||
    target === 0
  ) {
    return "neutral";
  }

  const meetsTarget = higherIsBetter ? actual >= target : actual <= target;
  if (meetsTarget) return "good";

  // Chưa đạt mục tiêu. Nếu còn trong biên cảnh báo thì là "warning", ra ngoài
  // biên mới là "critical" — để không phải mọi sai lệch nhỏ đều đỏ như nhau.
  if (warnBandRatio === undefined) return "critical";

  const deviation = Math.abs(actual - target) / Math.abs(target);
  return deviation <= warnBandRatio ? "warning" : "critical";
};
