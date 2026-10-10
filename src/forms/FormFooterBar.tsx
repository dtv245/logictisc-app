import { Button, Flex, type ButtonProps } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface FormFooterBarProps {
  saveButtonProps?: ButtonProps;
  onCancel?: () => void;
  saveText?: ReactNode;
  cancelText?: ReactNode;
  extra?: ReactNode;
  isLoading?: boolean;
}

/**
 * FormFooterBar — Thanh hành động dính đáy (Sticky footer) cho các form dài.
 * Tuân thủ quy tắc:
 * - 1 nút primary duy nhất (Lưu / Tạo)
 * - Nút Hủy phụ
 * - Nút nguy hiểm (nếu có) tách xa về bên trái
 */
export const FormFooterBar = ({
  saveButtonProps,
  onCancel,
  saveText,
  cancelText,
  extra,
  isLoading,
}: FormFooterBarProps) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "16px 24px",
        marginTop: 32,
        borderRadius: "8px 8px 0 0",
        borderTop: "1px solid #f0f0f0",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Flex align="center" justify="space-between" wrap="wrap" gap="middle">
        <div>{extra}</div>
        <Flex align="center" gap="small">
          {onCancel && (
            <Button onClick={onCancel} disabled={Boolean(isLoading || saveButtonProps?.loading)}>
              {cancelText ?? t("actions.cancel", "Hủy")}
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            {...saveButtonProps}
          >
            {saveText ?? saveButtonProps?.children ?? t("actions.save", "Lưu")}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};
