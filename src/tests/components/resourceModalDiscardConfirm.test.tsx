/**
 * Modal create/edit phải hỏi bằng modal antd, không phải `window.confirm`.
 *
 * `useModalForm` với `warnWhenUnsavedChanges: true` tự hỏi khi đóng — bằng
 * `window.confirm`, hộp thoại của trình duyệt. Test này khoá việc thay nó: bấm "Hủy" trên
 * form còn thay đổi chưa lưu thì phải hiện hộp thoại **của antd**, và `window.confirm`
 * không được gọi lần nào.
 *
 * `close` trong mock bắt chước `handleClose` của Refine (`useCallback` phụ thuộc
 * `warnWhen`, gọi `window.confirm` khi cờ bật). Nếu component gọi thẳng bản `close` đó
 * thay vì đi qua `useDiscardConfirm`, spy `window.confirm` sẽ bắt được ngay.
 *
 * Khác `useDiscardConfirm.test.tsx` ở chỗ ấy chỉ có **một** modal, còn ở đây modal form
 * và hộp thoại xác nhận cùng mở — nên không truy vấn được theo `role="dialog"` kèm tên.
 * Lý do nằm ở `confirmDialog` bên dưới.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceCreateModal } from "@components/ResourceCreateModal";
import { ResourceEditModal } from "@components/ResourceEditModal";
import { initializeAppI18n } from "@locales";
import { act, render, screen, waitFor } from "@testing-library/react";
import { App as AntdApp } from "antd";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/** Cùng lý do như `useDiscardConfirm.test.tsx`: một giá trị chung, không phải state riêng. */
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

/** Đếm số lần `close` của Refine được gọi — tức modal có thật sự đóng hay không. */
const closeCalls = vi.hoisted(() => ({ count: 0 }));

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

vi.mock("@refinedev/antd", async () => {
  const { Form: AntdForm } = await import("antd");
  const { useCallback, useSyncExternalStore } = await import("react");

  return {
    useSelect: () => ({ selectProps: {} }),
    useModalForm: () => {
      const [form] = AntdForm.useForm();
      const warnWhen = useSyncExternalStore(
        store.subscribe,
        store.get,
        store.get,
      );
      // `handleClose` của Refine đóng cứng `warnWhen` của lần render đã tạo ra nó.
      const close = useCallback(() => {
        closeCalls.count += 1;
        if (warnWhen) {
          window.confirm("Are you sure you want to leave? You have unsaved changes.");
        }
      }, [warnWhen]);

      return {
        close,
        form,
        formLoading: false,
        formProps: { form },
        modalProps: { open: true },
        show: () => {},
      };
    },
  };
});

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  store.reset(false);
  closeCalls.count = 0;
});

const modals: ReadonlyArray<{
  name: string;
  render: (onClose: () => void) => ReactNode;
}> = [
  {
    name: "ResourceCreateModal",
    render: () => (
      <ResourceCreateModal resource="loads" trigger={() => null} />
    ),
  },
  {
    name: "ResourceEditModal",
    render: (onClose) => (
      <ResourceEditModal id="1" onClose={onClose} resource="loads" visible />
    ),
  },
];

const openModal = (node: ReactNode) => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <AntdApp>{node}</AntdApp>
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

  return { confirmSpy };
};

const DISCARD_CONTENT = "Thay đổi bạn vừa nhập chưa được lưu. Đóng lại thì sẽ mất.";

/**
 * Hộp thoại xác nhận của antd, hoặc `null` khi chưa hiện.
 *
 * Vì sao không phải `screen.getByRole("dialog", { name: ... })` như ở
 * `useDiscardConfirm.test.tsx`: `rc-util`'s `useId` (rc-util/es/hooks/useId.js) trả về
 * **đúng chuỗi `"test-id"` cho mọi id** khi `NODE_ENV === "test"`. Ở đây có hai modal cùng
 * mở, nên hai tiêu đề cùng mang `id="test-id"` và `aria-labelledby` của cả hai đều trỏ vào
 * đó — tên truy cập được của hộp thoại xác nhận đọc nhầm thành tiêu đề của modal form
 * ("Thêm Chuyến hàng"), không bao giờ khớp "Bỏ thay đổi?". Trình duyệt thật không có
 * chuyện này: mỗi modal một `useId` riêng. Nên bám vào nội dung — thứ duy nhất chỉ hộp
 * thoại này có — rồi leo lên `[role="dialog"]`, và như vậy vẫn khẳng định được đúng điều
 * cần khẳng định: nó là một hộp thoại.
 */
const confirmDialog = () =>
  screen.queryByText(DISCARD_CONTENT)?.closest('[role="dialog"]') ?? null;

const waitForConfirmDialog = async () => {
  await screen.findByText(DISCARD_CONTENT);
  return confirmDialog();
};

const click = (name: string) => {
  act(() => {
    screen.getByRole("button", { name }).click();
  });
};

/** Nhãn nút huỷ lấy từ locale antd của app. */
const clickCancel = () => click("Hủy");

describe.each(modals)("$name — xác nhận bỏ thay đổi", ({ render: renderModal }) => {
  it("hỏi bằng modal antd khi form còn thay đổi chưa lưu", async () => {
    store.reset(true);
    const { confirmSpy } = openModal(renderModal(vi.fn()));

    clickCancel();

    expect(await waitForConfirmDialog()).toBeInTheDocument();
    // Điểm mấu chốt: không có hộp thoại nào của trình duyệt.
    expect(confirmSpy).not.toHaveBeenCalled();
    // Chưa xác nhận thì modal chưa đóng. `closeCalls` là tín hiệu dùng chung được cho cả
    // hai modal; `onClose` của `ResourceCreateModal` không có ý nghĩa vì nó không nhận.
    expect(closeCalls.count).toBe(0);
  });

  it("không đóng khi người dùng chọn tiếp tục sửa", async () => {
    store.reset(true);
    openModal(renderModal(vi.fn()));

    clickCancel();
    await waitForConfirmDialog();
    click("Tiếp tục sửa");

    expect(closeCalls.count).toBe(0);
  });

  it("đóng sau khi xác nhận, không hỏi lại bằng hộp thoại trình duyệt", async () => {
    store.reset(true);
    const { confirmSpy } = openModal(renderModal(vi.fn()));

    clickCancel();
    await waitForConfirmDialog();
    click("Bỏ thay đổi");

    await waitFor(() => {
      expect(closeCalls.count).toBe(1);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("đóng thẳng, không hỏi, khi form không có thay đổi", () => {
    store.reset(false);
    const { confirmSpy } = openModal(renderModal(vi.fn()));

    clickCancel();

    expect(confirmDialog()).toBeNull();
    expect(confirmSpy).not.toHaveBeenCalled();
    // Vẫn phải đóng thật, không phải nuốt mất thao tác của người dùng.
    expect(closeCalls.count).toBe(1);
  });
});

/**
 * `ResourceEditModal` nhận `onClose` từ cha, còn `ResourceCreateModal` thì không — nên
 * việc báo cho cha phải khẳng định riêng, không nhét vào vòng `describe.each` ở trên.
 *
 * Đây là lỗi có thật đã sửa: trước kia `onClose()` chạy vô điều kiện trong `onCancel`, nên
 * huỷ hộp thoại xác nhận vẫn làm modal cha đóng.
 */
describe("ResourceEditModal — báo cho cha khi đóng", () => {
  it("không gọi `onClose` khi người dùng còn muốn sửa tiếp", async () => {
    store.reset(true);
    const onClose = vi.fn();
    openModal(
      <ResourceEditModal id="1" onClose={onClose} resource="loads" visible />,
    );

    clickCancel();
    await waitForConfirmDialog();
    expect(onClose).not.toHaveBeenCalled();

    click("Tiếp tục sửa");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("gọi `onClose` đúng một lần sau khi xác nhận bỏ thay đổi", async () => {
    store.reset(true);
    const onClose = vi.fn();
    openModal(
      <ResourceEditModal id="1" onClose={onClose} resource="loads" visible />,
    );

    clickCancel();
    await waitForConfirmDialog();
    click("Bỏ thay đổi");

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
