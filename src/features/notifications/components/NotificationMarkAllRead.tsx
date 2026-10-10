/** Confirmation describes the actual shared tenant scope rather than a private unread state. */
import { Alert, Space } from "antd";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { ApiHttpError } from "@/providers/api/httpError";
import { useNotificationActions } from "../useNotificationActions";
export function NotificationMarkAllRead() {
  const { t } = useTranslation(); const actions = useNotificationActions();
  if (!actions.canMarkAllRead) return null;
  return <Space direction="vertical" style={{ width: "100%" }}>
    {actions.error && <Alert type="error" showIcon message={actions.error.message} description={actions.error instanceof ApiHttpError ? `${actions.error.code}${actions.error.requestId ? ` / ${actions.error.requestId}` : ""}` : undefined} />}
    <ConfirmActionModal title={t("notifications.markAllAsRead")} triggerLabel={t("notifications.markAllAsRead")} triggerAriaLabel={t("notifications.markAllAsRead")}
      description={t("notifications.markConfirm")} disabled={actions.pending} onConfirm={actions.markAllRead} />
  </Space>;
}
