/**
 * Cấu hình chung cho mọi test file Vitest.
 *
 * Gồm ba phần: nạp custom matcher của jest-dom, dọn DOM sau mỗi test, và bù các
 * API trình duyệt mà jsdom không cài đặt nhưng Ant Design cần khi render.
 */

/**
 * Phải dùng entry "/vitest": entry mặc định của jest-dom gọi `expect.extend()`
 * dựa vào `expect` toàn cục (kiểu Jest), trong khi dự án không bật `globals`
 * và mọi test file đều import `expect` tường minh từ "vitest".
 */
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Cơ chế auto-cleanup của React Testing Library dựa vào một `afterEach` toàn
 * cục, chỉ tồn tại khi Vitest bật `globals`. Dự án không bật, nên nếu không
 * gọi tường minh ở đây thì DOM của test trước sẽ tích tụ vào `document.body`,
 * khiến các truy vấn `getByRole`/`getByText` ở test sau khớp nhiều phần tử và
 * ném "Found multiple elements".
 */
afterEach(() => {
  cleanup();
});

/**
 * jsdom không có `window.matchMedia`, trong khi Ant Design dùng nó cho
 * responsive breakpoints (`Grid.useBreakpoint`, `_util/responsiveObserver`).
 * Thiếu nó thì mọi component test render antd đều ném lỗi khi mount.
 *
 * Trả về một MediaQueryList tĩnh luôn `matches: false`, tức là mọi breakpoint
 * đều coi như không khớp — đủ để component mount; test nào cần hành vi theo
 * breakpoint cụ thể thì tự override trong chính test đó.
 */
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      const mediaQueryList: MediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      };

      return mediaQueryList;
    },
  });
}

/**
 * jsdom không có `ResizeObserver`. Ant Design dùng nó ở Table, Select và
 * Form để theo dõi kích thước phần tử; thiếu nó gây lỗi khi mount.
 *
 * Bản stub này không thực sự quan sát gì — chỉ cần thoả mãn vòng đời của antd.
 */
if (typeof window.ResizeObserver !== "function") {
  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: class ResizeObserverStub implements ResizeObserver {
      observe(): void {
        // Không quan sát thật: test không phụ thuộc kích thước phần tử.
      }

      unobserve(): void {
        // Không quan sát thật.
      }

      disconnect(): void {
        // Không quan sát thật.
      }
    },
  });
}
