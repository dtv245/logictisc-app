import { Button, Tag } from "antd";
import { useTranslation } from "react-i18next";

import type { TripStopExecution } from "@/types/tripExecution.types";
import { ALLOWED_NEXT_ACTIONS } from "./tripExecution.api";
import type { TripStopAction } from "./useTripStopActions";

export interface TripStopActionsProps {
  stop: TripStopExecution;
  onTransition: (action: TripStopAction, stopId: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export const TripStopActions = ({
  stop,
  onTransition,
  isSubmitting = false,
}: TripStopActionsProps) => {
  const { t } = useTranslation();
  const normalizedStatus = (stop.status || "PENDING").toUpperCase();
  const nextConfig = ALLOWED_NEXT_ACTIONS[normalizedStatus];

  if (normalizedStatus === "DEPARTED") {
    return (
      <Tag color="success" data-testid="stop-status-departed">
        {t("trips.execution.status.completed", "Completed")}
      </Tag>
    );
  }

  if (!nextConfig) {
    return null;
  }

  const { action } = nextConfig;

  const getButtonLabel = (act: TripStopAction): string => {
    switch (act) {
      case "arrive":
        return t("trips.execution.actions.arrive", "Arrive");
      case "startService":
        return t("trips.execution.actions.startService", "Start Service");
      case "completeService":
        return t("trips.execution.actions.completeService", "Complete Service");
      case "depart":
        return t("trips.execution.actions.depart", "Depart");
    }
  };

  const getButtonType = (act: TripStopAction): "primary" | "default" => {
    return act === "depart" ? "default" : "primary";
  };

  return (
    <Button
      type={getButtonType(action)}
      size="small"
      loading={isSubmitting}
      disabled={isSubmitting}
      onClick={() => void onTransition(action, stop.id)}
      data-testid={`stop-action-btn-${stop.id}`}
    >
      {getButtonLabel(action)}
    </Button>
  );
};
