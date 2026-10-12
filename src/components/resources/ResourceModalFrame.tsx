/**
 * ResourceModalFrame — Khung modal chuẩn hóa dùng chung cho cả Create và Edit Resource.
 *
 * Tiêu chuẩn UX/a11y:
 * 1. Khung rộng 760px (720–800px), centered, fixed header và fixed footer.
 * 2. Mobile (<640px): Gần toàn màn hình (100% width, 100vh), 1 cột, padding chạm tối ưu.
 * 3. Body cuộn riêng biệt với max-height theo viewport (calc(100vh - 200px)).
 * 4. Tự động focus vào trường nhập đầu tiên khi mở modal.
 * 5. Khi đóng modal: Trả focus về nút kích hoạt (trigger button) tương ứng.
 * 6. Xử lý ESC an toàn: Đóng dropdown đang mở trước khi đóng modal.
 * 7. Mask click: Không đóng khi form đã sửa (chặn mất dữ liệu).
 * 8. Footer: Nút [Hủy] bên trái nút chính, nút Submit duy nhất bên phải có loading và chống double-submit.
 */

import { Button, Modal, Typography } from "antd";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface ResourceModalFrameProps {
  open?: boolean;
  onCancel: () => void;
  onOk?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
  formId?: string;
  triggerElement?: HTMLElement | null;
  maskClosable?: boolean;
  destroyOnHidden?: boolean;
  children: ReactNode;
  width?: number;
  className?: string;
  footer?: ReactNode;
}

export const ResourceModalFrame = ({
  open = false,
  onCancel,
  onOk,
  title,
  subtitle,
  okText,
  cancelText,
  confirmLoading = false,
  formId,
  triggerElement,
  maskClosable = false,
  destroyOnHidden = true,
  children,
  width = 860,
  className,
  footer,
}: ResourceModalFrameProps) => {
  const { t } = useTranslation();
  const resolvedCancelText = cancelText ?? t("actions.cancel", { defaultValue: "Hủy" });
  const resolvedOkText = okText ?? t("actions.save", { defaultValue: "Lưu" });
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(triggerElement ?? null);

  // Lưu lại phần tử kích hoạt nếu chưa được truyền tường minh
  useEffect(() => {
    if (open) {
      if (!triggerRef.current && document.activeElement instanceof HTMLElement) {
        triggerRef.current = document.activeElement;
      }
    }
  }, [open]);

  // a11y: Tự động focus vào input đầu tiên khi modal mở
  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        const firstInput = modalContainerRef.current?.querySelector<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
        );
        firstInput?.focus();
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // a11y: Trả focus về trigger sau khi modal đóng
  const handleAfterClose = useCallback(() => {
    if (triggerRef.current && typeof triggerRef.current.focus === "function") {
      triggerRef.current.focus();
    }
  }, []);

  // Xử lý phím Escape: Nếu có dropdown antd đang mở, đóng dropdown trước thay vì đóng modal
  const handleKeyDownCapture = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      const openDropdown = document.querySelector(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden), .ant-picker-dropdown:not(.ant-picker-dropdown-hidden)"
      );
      if (openDropdown) {
        e.stopPropagation();
      }
    }
  }, []);

  return (
    <Modal
      afterClose={handleAfterClose}
      centered
      className={`resource-form-modal ${className ?? ""}`}
      destroyOnHidden={destroyOnHidden}
      footer={null}
      maskClosable={maskClosable}
      onCancel={onCancel}
      open={open}
      title={null}
      width={width}
      wrapClassName="resource-form-modal-wrap"
    >
      <div
        className="resource-form-modal__content"
        onKeyDownCapture={handleKeyDownCapture}
        ref={modalContainerRef}
      >
        {/* Fixed Header: Tiêu đề + mô tả ngắn */}
        <div className="resource-form-modal__header">
          {typeof title === "string" ? (
            <Typography.Title className="resource-form-modal__title" level={4}>
              {title}
            </Typography.Title>
          ) : (
            <div className="resource-form-modal__title">{title}</div>
          )}
          {subtitle && (
            <Typography.Text className="resource-form-modal__subtitle" type="secondary">
              {subtitle}
            </Typography.Text>
          )}
        </div>

        {/* Scrollable Body: Cuộn riêng biệt theo viewport */}
        <div className="resource-form-modal__body">{children}</div>

        {/* Fixed Footer: Tùy biến hoặc nút Hủy/Submit mặc định */}
        {footer !== null && (
          <div className="resource-form-modal__footer">
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <Button
                  className="resource-form-modal__cancel-btn"
                  disabled={confirmLoading}
                  onClick={onCancel}
                >
                  {resolvedCancelText}
                </Button>
                <Button
                  className="resource-form-modal__submit-btn"
                  disabled={confirmLoading}
                  {...(formId ? { form: formId, htmlType: "submit" as const } : {})}
                  loading={confirmLoading}
                  onClick={onOk}
                  type="primary"
                >
                  {resolvedOkText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
