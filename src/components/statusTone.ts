/**
 * Ánh xạ `<giá trị trạng thái> → StatusTone`.
 *
 * Vì sao là một bảng tra cứu dùng chung chứ không phải màu khai tại từng cột:
 * cùng một giá trị mang cùng một ý nghĩa ở mọi resource — `cancelled` của load,
 * của trip và của invoice đều là "kết thúc mà không đạt mục tiêu". Khai màu rải
 * rác ở 15 file columns thì sửa một chỗ là 14 chỗ còn lại lệch.
 *
 * Nguyên tắc xếp tone:
 * - `success`    — đã đạt đích.
 * - `processing` — đang trong luồng, chưa xong và chưa có gì sai.
 * - `warning`    — đang bị chặn hoặc đang chờ; còn cứu được, cần người để ý.
 * - `error`      — kết thúc mà **không** đạt mục tiêu.
 * - `neutral`    — chưa bắt đầu, hoặc không hoạt động; không tốt cũng không xấu.
 *
 * Giá trị lạ rơi về `neutral` chứ không ném lỗi: phần lớn trạng thái trong hệ
 * thống này là cột `text` tự do phía backend, không có enum ràng buộc, nên gặp
 * giá trị chưa biết là chuyện thường — ô đó vẫn phải hiện ra, chỉ là không tô màu.
 */

import type { StatusTone } from "./StatusTag";

/**
 * Khoá là chữ **thường**; `statusTone` tự chuẩn hoá trước khi tra.
 *
 * Mọi khoá ở đây đều phải có bản dịch trong `forms.options.*` — có test kiểm
 * điều đó, vì tô màu cho một giá trị không dịch được thì ô đó vẫn hiện enum thô.
 */
export const statusTones: Readonly<Record<string, StatusTone>> = {
  // success — đã đạt đích
  active: "success",
  available: "success",
  completed: "success",
  delivered: "success",
  paid: "success",
  succeeded: "success",

  // processing — đang trong luồng
  assigned: "processing",
  dispatched: "processing",
  in_transit: "processing",
  issued: "processing",
  picked_up: "processing",
  processing: "processing",

  // warning — đang chờ hoặc đang bị chặn
  maintenance: "warning",
  on_leave: "warning",
  partially_paid: "warning",
  pending: "warning",
  refunded: "warning",
  suspended: "warning",

  // error — kết thúc mà không đạt mục tiêu
  cancelled: "error",
  failed: "error",
  out_of_service: "error",
  terminated: "error",

  // neutral — chưa bắt đầu hoặc không hoạt động
  draft: "neutral",
  inactive: "neutral",
};

/**
 * Tone cho một giá trị trạng thái bất kỳ. Luôn trả về một tone.
 *
 * Chuẩn hoá hoa/thường vì backend không thống nhất: `LoadStatus.dbValue()` ghi chữ
 * thường, nhưng `DataSeeder` ghi `"Draft"`, `"Issued"`, `"Paid"` viết hoa, và
 * `InvoiceDispatchStatus.matches` phải dùng `equalsIgnoreCase` để bắt cả hai. Nếu
 * tra thẳng thì hoá đơn cũ sẽ không có màu, trong khi hoá đơn mới có.
 */
export const statusTone = (value: unknown): StatusTone => {
  if (typeof value !== "string") {
    return "neutral";
  }

  return statusTones[value.trim().toLowerCase()] ?? "neutral";
};
