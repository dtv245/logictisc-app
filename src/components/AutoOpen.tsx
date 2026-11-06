import { useEffect, useRef } from "react";

/**
 * Gọi `show()` một lần sau khi modal vừa được mount.
 *
 * Dùng cho các modal dùng `trigger` callback (`useModalForm`) khi modal chỉ
 * được mount theo nhu cầu — tránh mount form Refine ngay từ đầu trang.
 */
export function AutoOpen({ show }: { show: () => void }) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    show();
  }, [show]);

  return null;
}
