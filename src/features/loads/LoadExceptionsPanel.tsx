import { Alert, Card } from "antd";
import { useTranslation } from "react-i18next";

export interface LoadExceptionsPanelProps {
  loadId: string;
}

export const LoadExceptionsPanel = ({ loadId }: LoadExceptionsPanelProps) => {
  const { t } = useTranslation();

  return (
    <Card
      title={t("loads.exceptions.title", "Exceptions & Incidents")}
      data-testid={`load-exceptions-panel-${loadId}`}
    >
      <Alert
        type="info"
        showIcon
        message={t(
          "loads.exceptions.pendingBackendTitle",
          "Exceptions Tracking Pending Backend Service",
        )}
        description={t(
          "loads.exceptions.pendingBackendDesc",
          "Dedicated load incident and exception reporting endpoints are not yet available in the backend API (BLOCKED_BACKEND). No active exceptions to display.",
        )}
        data-testid="exceptions-blocked-alert"
      />
    </Card>
  );
};
