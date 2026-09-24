/**
 * `useDebouncedSearch` — trễ hoá giá trị tìm kiếm.
 *
 * Điều đáng test không phải "có setTimeout" mà là **giá trị nào được ghi, lúc nào**:
 * gõ liên tục chỉ được đẩy đúng một query, và giá trị đầu tiên phải có ngay từ render
 * đầu (nếu không, bảng sẽ bắn một query rỗng rồi mới bắn query thật).
 */

import { useDebouncedSearch } from "@hooks/useDebouncedSearch";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DELAY = 350;

/** Chạy đồng hồ giả bên trong `act` để React kịp xử lý state update. */
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const renderSearch = (initialValue: string, delayMs?: number) =>
  renderHook(
    ({ value }: { value: string }) =>
      delayMs === undefined
        ? useDebouncedSearch(value)
        : useDebouncedSearch(value, delayMs),
    { initialProps: { value: initialValue } },
  );

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedSearch", () => {
  it("trả ngay giá trị đầu vào ở render đầu, không trễ", () => {
    const { result } = renderSearch("L-1001");

    // `undefined` hoặc "" ở đây nghĩa là màn hình bắn một query rỗng trước query thật.
    expect(result.current).toBe("L-1001");
  });

  it("chỉ cập nhật sau khi hết hạn", () => {
    const { result, rerender } = renderSearch("a");

    rerender({ value: "ab" });
    advance(DELAY - 1);
    expect(result.current).toBe("a");

    advance(1);
    expect(result.current).toBe("ab");
  });

  it("gõ liên tục chỉ ghi giá trị cuối cùng", () => {
    const { result, rerender } = renderSearch("");

    rerender({ value: "a" });
    advance(100);
    rerender({ value: "ab" });
    advance(100);
    rerender({ value: "abc" });

    // Chưa lần hẹn nào đủ dài để thoát: cả "a" lẫn "ab" đều đã bị huỷ.
    expect(result.current).toBe("");

    advance(DELAY);
    expect(result.current).toBe("abc");
  });

  it("tôn trọng thời gian trễ truyền vào", () => {
    const { result, rerender } = renderSearch("a", 1000);

    rerender({ value: "b" });
    advance(DELAY);
    expect(result.current).toBe("a");

    advance(1000 - DELAY);
    expect(result.current).toBe("b");
  });

  it("huỷ hẹn còn treo khi unmount", () => {
    const { rerender, unmount } = renderSearch("a");

    rerender({ value: "ab" });
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    // Đếm timer chứ không chỉ "không ném lỗi": React 18 đã bỏ cảnh báo state update
    // trên component đã unmount, nên một assertion kiểu not.toThrow() sẽ xanh kể cả
    // khi cleanup bị xoá — tức là không kiểm tra được gì.
    expect(vi.getTimerCount()).toBe(0);
  });
});
