/**
 * `useDiscardConfirm` — hỏi trước khi đóng bằng modal antd, không dùng `window.confirm`.
 *
 * Hai điều kiện khiến test này có nghĩa:
 *
 * 1. `useWarnAboutChange` được mock bằng `useState` **thật**, không phải object tĩnh:
 *    cơ chế đóng của hook dựa vào việc `setWarnWhen(false)` làm component render lại.
 *    Mock tĩnh sẽ khiến test xanh trong khi luồng thật thì hỏng.
 * 2. `close` giả lập đúng ngữ nghĩa closure của Refine — `useCallback` phụ thuộc
 *    `warnWhen`, nên bản cũ vẫn đọc giá trị cũ và gọi `window.confirm`. Nhờ vậy khẳng
 *    định "`window.confirm` không được gọi" mới bắt được lỗi gọi nhầm bản cũ.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { useDiscardConfirm } from "@hooks/useDiscardConfirm";
import { initializeAppI18n } from "@locales";
import { act, render, screen, waitFor } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { useCallback } from "react";
import { I18nextProvider } from "react-i18next";
import { useWarnAboutChange } from "@refinedev/core";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `useWarnAboutChange` thật đọc từ một context **dùng chung**, nên mọi nơi gọi nó đều
 * thấy cùng một giá trị. Mock bằng `useState` bên trong hook sẽ tạo ra một state riêng cho
 * mỗi lần gọi — hook tắt cờ của nó còn component vẫn thấy cờ bật, và test sẽ báo lỗi ở
 * chỗ không có lỗi thật. Store ngoài + `useSyncExternalStore` mới đúng ngữ nghĩa đó.
 */
const store = vi.hoisted(() => {
  let warnWhen = false;
  const listeners = new Set<() => void>();

  return {
    get: () => warnWhen,
    reset: (value: boolean) => {
      warnWhen = value;
    },
    set: (value: boolean) => {
      warnWhen = value;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});

vi.mock("@refinedev/core", async () => {
  const { useSyncExternalStore } = await import("react");

  return {
    useWarnAboutChange: () => ({
      setWarnWhen: store.set,
      warnWhen: useSyncExternalStore(store.subscribe, store.get, store.get),
      warnWhenUnsavedChanges: true,
    }),
  };
});

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  store.reset(false);
});

interface HarnessProps {
  /** Gọi khi `close` được gọi — tức lúc modal thật sự đóng. */
  onCloseCalled: () => void;
}

/**
 * `close` bắt chước `handleClose` của Refine: `useCallback` phụ thuộc `warnWhen`, và
 * `window.confirm` khi cờ còn bật. Bản cũ, đã đóng cứng `warnWhen === true`, vì thế vẫn
 * hỏi lại — đúng cái bẫy mà hook phải tránh.
 */
const Harness = ({ onCloseCalled }: HarnessProps) => {
  const { warnWhen } = useWarnAboutChange();
  const close = useCallback(() => {
    onCloseCalled();
    if (warnWhen) {
      window.confirm("Are you sure you want to leave? You have unsaved changes.");
    }
  }, [onCloseCalled, warnWhen]);

  const { onCancel } = useDiscardConfirm(close);

  return (
    <button onClick={onCancel} type="button">
      Đóng
    </button>
  );
};

const renderHarness = () => {
  const onCloseCalled = vi.fn();
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <AntdApp>
          <Harness onCloseCalled={onCloseCalled} />
        </AntdApp>
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

  return { confirmSpy, onCloseCalled };
};

/**
 * antd render tiêu đề của `Modal.confirm` **hai lần**: một ở `.ant-modal-title` của khung
 * modal và một ở `.ant-modal-confirm-title` của phần nội dung. Nên `getByText` báo
 * "multiple elements"; truy vấn theo role `dialog` là cách duy nhất vừa khớp một phần tử
 * vừa khẳng định đúng thứ cần khẳng định — có một hộp thoại mang tên đó.
 */
const dialog = () => screen.queryByRole("dialog", { name: "Bỏ thay đổi?" });

const click = (name: string) => {
  act(() => {
    screen.getByRole("button", { name }).click();
  });
};

describe("useDiscardConfirm", () => {
  it("đóng ngay khi form không có thay đổi chưa lưu", () => {
    store.reset(false);
    const { confirmSpy, onCloseCalled } = renderHarness();

    click("Đóng");

    expect(onCloseCalled).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("hỏi bằng modal antd, không phải `window.confirm`", async () => {
    store.reset(true);
    const { confirmSpy, onCloseCalled } = renderHarness();

    click("Đóng");

    expect(await screen.findByRole("dialog", { name: "Bỏ thay đổi?" })).toBeInTheDocument();
    // Điểm mấu chốt của cả hook: hộp thoại của trình duyệt không được xuất hiện.
    expect(confirmSpy).not.toHaveBeenCalled();
    // Chưa xác nhận thì modal chưa đóng.
    expect(onCloseCalled).not.toHaveBeenCalled();
  });

  it("không đóng khi người dùng chọn tiếp tục sửa", async () => {
    store.reset(true);
    const { onCloseCalled } = renderHarness();

    click("Đóng");
    await screen.findByRole("dialog", { name: "Bỏ thay đổi?" });
    click("Tiếp tục sửa");

    expect(onCloseCalled).not.toHaveBeenCalled();
  });

  it("đóng sau khi xác nhận, và lúc đóng cờ đã tắt nên không hỏi lại", async () => {
    store.reset(true);
    const { confirmSpy, onCloseCalled } = renderHarness();

    click("Đóng");
    await screen.findByRole("dialog", { name: "Bỏ thay đổi?" });
    click("Bỏ thay đổi");

    // Nếu hook gọi bản `close` cũ, `confirmSpy` sẽ bắt được `window.confirm` — đây chính
    // là lỗi mà effect trong hook tồn tại để tránh.
    await waitFor(() => {
      expect(onCloseCalled).toHaveBeenCalledTimes(1);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
