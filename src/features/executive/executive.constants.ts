/**
 * Hằng số riêng của màn hình Executive Overview.
 */

/**
 * Tiền tệ mà màn hình yêu cầu các endpoint tổng hợp tính toán.
 *
 * Đây là tham số `currency` gửi lên, không phải nhãn hiển thị: mọi response đều
 * echo lại đúng giá trị này ở trường `currency`, và mọi phép cộng ở backend chỉ
 * tính trên các dòng mang đúng loại tiền đó. Trộn nhiều loại tiền vào một con
 * số tổng là sai về bản chất kế toán, nên backend từ chối cộng thay vì tự quy
 * đổi — và giao diện cũng không tự quy đổi.
 *
 * Đặt là VND vì đó là loại tiền thật của tenant đang dùng: toàn bộ hoá đơn,
 * thanh toán và chi phí trong cơ sở dữ liệu đều bằng VND. Trước đây hằng số này
 * là "USD" trong khi dữ liệu chỉ có VND, nên mọi chỉ số tiền trả về
 * `NO_ROWS_IN_CURRENCY` và cả màn hình không có số nào. Đổi lại thành VND là
 * làm cho đơn vị yêu cầu khớp với đơn vị thật của dữ liệu — KHÔNG phải quy đổi
 * tiền tệ, và cũng không phải nới lỏng bộ lọc ở backend.
 *
 * Nếu sau này tenant thật sự hạch toán bằng loại tiền khác, đổi hằng số này là
 * đủ; không được cộng gộp hai loại tiền vào một con số tổng.
 */
export const DISPLAY_CURRENCY = "VND";

/** Số tháng mặc định của bộ lọc thời gian. */
export const DEFAULT_RANGE_MONTHS = 12;

/** Số tháng cho phép chọn ở bộ lọc thời gian. */
export const RANGE_MONTH_CHOICES = [3, 6, 12, 24] as const;

/**
 * Số khách hàng lớn nhất mà endpoint tập trung trả về.
 *
 * Chỉ ảnh hưởng số DÒNG hiển thị. `top1Share`, `top3Share`, `top5Share` và
 * `hhi` do backend tính trên toàn bộ khách hàng, nên đổi số này không làm đổi
 * các con số nằm cạnh bảng.
 */
export const CONCENTRATION_LIMIT = 10;
