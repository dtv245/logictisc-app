/**
 * `useDiscardConfirm` — hỏi trước khi đóng form còn thay đổi chưa lưu, bằng modal antd.
 *
 * Vì sao cần: `useModalForm` với `warnWhenUnsavedChanges: true` tự hỏi khi đóng, nhưng
 * nó hỏi bằng `window.confirm` — hộp thoại của trình duyệt, không phải của antd. Nó
 * không theo theme, không theo ngôn ngữ của app, và trông như một trang web lạ đang cảnh
 * báo người dùng.
 *
 * Refine không có API để thay hộp thoại đó (`UnsavedWarnContext` không được export), nên
 * cách duy nhất là **chặn ở `onCancel` của `Modal`** và tự hỏi. Cờ `warnWhen` thì vẫn
 * đọc từ Refine qua `useWarnAboutChange`: nhờ vậy "form có thay đổi chưa lưu hay không"
 * vẫn do Refine quyết định — nó biết cả những chỗ khó mà tự đếm rất dễ sai (reset sau
 * khi lưu thành công, `autoSave`, đổi giá trị rồi đổi lại về như cũ).
 *
 * ## Vì sao phải đóng qua effect mà không gọi thẳng trong `onOk`
 *
 * `close` của Refine là `useCallback` phụ thuộc `warnWhen`, nên bản mà ta đang giữ
 * **đóng cứng `warnWhen === true`**. Gọi nó ngay trong `onOk` — dù đã `setWarnWhen(false)`
 * — vẫn chạy đúng bản cũ và bật lại `window.confirm`. Nên `onOk` chỉ tắt cờ rồi đánh dấu
 * "đang chờ", và việc đóng được giao cho effect bên dưới: nó chạy **sau** lần render mà
 * `close` đã là bản mới với `warnWhen === false`.
 *
 * Cờ "đang chờ" là `useRef` chứ không `useState`: nó không tham gia vào nội dung render,
 * và `setWarnWhen(false)` đã đủ để kích hoạt lần render mà effect cần. Dùng `useState` ở
 * đây vừa thừa vừa vướng rule `react-hooks/set-state-in-effect`.
 */

import { useWarnAboutChange } from "@refinedev/core";
import { App } from "antd";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface DiscardConfirmApi {
  /** Gắn vào `onCancel` của `Modal` — đè lên `modalProps.onCancel` của Refine. */
  onCancel: () => void;
}

/**
 * @param onClose Handler đóng thật của Refine (`modalProps.onCancel`, cũng chính là
 *   `close` mà `useModalForm` trả về).
 */
export const useDiscardConfirm = (onClose: () => void): DiscardConfirmApi => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { setWarnWhen, warnWhen } = useWarnAboutChange();
  const awaitingClose = useRef(false);

  useEffect(() => {
    // Còn `warnWhen` nghĩa là lần render này `onClose` vẫn là bản cũ, còn hỏi lại.
    if (!awaitingClose.current || warnWhen) {
      return;
    }
    awaitingClose.current = false;
    onClose();
  }, [onClose, warnWhen]);

  const onCancel = useCallback(() => {
    if (!warnWhen) {
      onClose();
      return;
    }

    modal.confirm({
      cancelText: t("crud.discardCancel"),
      content: t("crud.discardContent"),
      okButtonProps: { danger: true },
      okText: t("crud.discardOk"),
      onOk: () => {
        awaitingClose.current = true;
        setWarnWhen(false);
      },
      title: t("crud.discardTitle"),
    });
  }, [modal, onClose, setWarnWhen, t, warnWhen]);

  return { onCancel };
};
