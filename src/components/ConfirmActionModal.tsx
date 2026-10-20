/**
 * ConfirmActionModal
 *
 * Opens an accessible confirmation dialog and runs the confirmed action at
 * most once until its promise settles. A failed action keeps the dialog open
 * so the user can review the context and retry.
 */
import { Button, Modal, type ButtonProps } from "antd";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AccessibleAnnouncement } from "./AccessibleAnnouncement";
import { runSingleFlight } from "@utils/singleFlight";

export interface ConfirmActionModalProps {
  triggerLabel: ReactNode;
  triggerAriaLabel: string;
  title: ReactNode;
  description: ReactNode;
  onConfirm: () => Promise<void> | void;
  onError?: (error: unknown) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  disabled?: boolean;
  buttonType?: ButtonProps["type"];
}

export function ConfirmActionModal({
  triggerLabel,
  triggerAriaLabel,
  title,
  description,
  onConfirm,
  onError,
  confirmLabel,
  cancelLabel,
  danger = false,
  disabled = false,
  buttonType,
}: ConfirmActionModalProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const activePromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resolvedConfirmLabel = confirmLabel ?? t("actions.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel");

  const handleClose = () => {
    if (!isPending) setIsDialogOpen(false);
  };

  const handleConfirm = () => {
    void runSingleFlight(activePromiseRef, async () => {
      if (mountedRef.current) setIsPending(true);

      try {
        await onConfirm();
        if (mountedRef.current) setIsDialogOpen(false);
      } catch (error: unknown) {
        try {
          onError?.(error);
        } catch {
          // An error reporter must not prevent the user from retrying the action.
        }
      } finally {
        if (mountedRef.current) setIsPending(false);
      }
    });
  };

  return (
    <>
      <Button
        aria-label={triggerAriaLabel}
        danger={danger}
        disabled={disabled || isDialogOpen || isPending}
        loading={isPending}
        onClick={() => setIsDialogOpen(true)}
        {...(buttonType ? { type: buttonType } : {})}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={isDialogOpen}
        title={title}
        onCancel={handleClose}
        footer={[
          <Button
            key="cancel"
            aria-label={resolvedCancelLabel}
            onClick={handleClose}
            disabled={isPending}
          >
            {resolvedCancelLabel}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger={danger}
            aria-label={resolvedConfirmLabel}
            onClick={handleConfirm}
            loading={isPending}
            disabled={isPending}
          >
            {resolvedConfirmLabel}
          </Button>,
        ]}
        keyboard={!isPending}
        maskClosable={!isPending}
        closable={!isPending}
      >
        {description}
      </Modal>
      {isPending ? (
        <AccessibleAnnouncement message={t("confirm.pendingAnnouncement")} />
      ) : null}
    </>
  );
}
