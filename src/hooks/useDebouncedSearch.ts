/**
 * Trễ hoá giá trị ô tìm kiếm trước khi đưa vào query.
 *
 * Lý do tồn tại: gõ "abc" mà không debounce là 3 request, và request của "a" có thể
 * về **sau** request của "abc" — bảng hiện dữ liệu cũ. Repo đã có nửa còn lại của
 * lời giải ở `providers/api/latestRequest.ts` (huỷ response cũ theo key), nhưng nửa
 * này thì chưa: trước hook này, toàn bộ `src/` không có một `setTimeout` nào.
 *
 * Hai cơ chế bù nhau chứ không thay nhau: debounce **giảm số request**, coordinator
 * **chặn response đến muộn**. Vẫn cần cả hai kể cả khi đã debounce — request đầu tiên
 * vẫn có thể về sau request thứ hai nếu mạng chậm.
 *
 * Giá trị trả về được khởi tạo bằng chính `value` đầu vào (không phải `undefined`),
 * để lần render đầu không đẩy một query rỗng lên server.
 *
 * ```tsx
 * const [input, setInput] = useState("");
 * const search = useDebouncedSearch(input);
 * useTable({ resource: "loads", filters: { permanent: [{ field: "search", value: search }] } });
 * ```
 */

import { useEffect, useState } from "react";

/** 350ms — đủ để gõ xong một từ ngắn mà vẫn thấy phản hồi tức thì. */
export const DEFAULT_SEARCH_DEBOUNCE_MS = 350;

export const useDebouncedSearch = <TValue,>(
  value: TValue,
  delayMs: number = DEFAULT_SEARCH_DEBOUNCE_MS,
): TValue => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), Math.max(0, delayMs));
    // `value` đổi trước khi hết hạn nghĩa là người dùng còn đang gõ: huỷ hẹn cũ để
    // chỉ giá trị cuối cùng được ghi.
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
