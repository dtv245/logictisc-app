/**
 * ConfirmActionButton
 *
 * Opens an Ant Design context-aware confirmation modal and runs the confirmed
 * action at most once until its promise settles.
 */
import { App as AntdApp, Button, type ButtonProps } from "antd";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { SHARED_I18N_NAMESPACE } from "../i18n";
import { AccessibleAnnouncement } from "./AccessibleAnnouncement";
import { runSingleFlight } from "./singleFlight";

export interface ConfirmActionButtonProps {
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

export function ConfirmActionButton({
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
}: ConfirmActionButtonProps) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);
  // App.useApp keeps modal theme, locale and context aligned with the root
  // Ant Design App provider.
  const { modal } = AntdApp.useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const dialogOpenRef = useRef(false);
  const activePromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  // Async confirmation may finish after route navigation. Cleanup prevents its
  // completion callbacks from updating an unmounted trigger component.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resolvedConfirmLabel = confirmLabel ?? t("actions.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel");

  const handleOpen = () => {
    // The ref closes the same-render gap before disabled state reaches the
    // button, preventing rapid clicks from creating duplicate dialogs.
    if (dialogOpenRef.current) {
      return;
    }

    dialogOpenRef.current = true;
    setIsDialogOpen(true);

    const dialogRef: {
      current: ReturnType<typeof modal.confirm> | undefined;
    } = {
      current: undefined,
    };

    const setDialogPending = (pending: boolean) => {
      dialogRef.current?.update({
        cancelButtonProps: {
          "aria-label": resolvedCancelLabel,
          disabled: pending,
        },
        keyboard: !pending,
        maskClosable: !pending,
        okButtonProps: {
          "aria-label": resolvedConfirmLabel,
          danger,
          loading: pending,
        },
      });
    };

    const executeAction = () =>
      runSingleFlight(activePromiseRef, async () => {
        if (mountedRef.current) {
          setIsPending(true);
        }
        setDialogPending(true);

        try {
          await onConfirm();
        } catch (error: unknown) {
          onError?.(error);
          throw error;
        } finally {
          if (mountedRef.current) {
            setIsPending(false);
          }
          setDialogPending(false);
        }
      });

    dialogRef.current = modal.confirm({
      afterClose: () => {
        dialogOpenRef.current = false;
        if (mountedRef.current) {
          setIsDialogOpen(false);
          setIsPending(false);
        }
      },
      cancelButtonProps: {
        "aria-label": resolvedCancelLabel,
      },
      cancelText: resolvedCancelLabel,
      content: description,
      keyboard: true,
      maskClosable: true,
      okButtonProps: {
        "aria-label": resolvedConfirmLabel,
        danger,
      },
      okText: resolvedConfirmLabel,
      onCancel: () => {
        dialogOpenRef.current = false;
        if (mountedRef.current) {
          setIsDialogOpen(false);
        }
      },
      onOk: executeAction,
      title,
    });
  };

  return (
    <>
      <Button
        aria-label={triggerAriaLabel}
        danger={danger}
        disabled={disabled || isDialogOpen || isPending}
        loading={isPending}
        onClick={handleOpen}
        {...(buttonType ? { type: buttonType } : {})}
      >
        {triggerLabel}
      </Button>
      {isPending ? (
        <AccessibleAnnouncement
          message={t("confirm.pendingAnnouncement")}
        />
      ) : null}
    </>
  );
}
