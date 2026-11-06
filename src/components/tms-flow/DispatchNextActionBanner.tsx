import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";

import type { ShipmentNextAction } from "@/hooks/tms-flow/useShipmentNextAction";

export interface DispatchNextActionBannerProps {
  action: ShipmentNextAction;
  onViewLoad: () => void;
  onReviewSuggestion: () => void;
}

export function DispatchNextActionBanner({
  action,
  onViewLoad,
  onReviewSuggestion,
}: DispatchNextActionBannerProps) {
  const { t } = useTranslation();

  if (action.kind === "none") {
    return (
      <Alert
        className="tms-next-action"
        description={t("tmsDispatch.nextAction.none")}
        message={t("tmsDispatch.nextAction.title")}
        showIcon
        type="success"
      />
    );
  }

  if (action.kind === "risk") {
    return (
      <Alert
        action={(
          <Button className="tms-control-button" onClick={onViewLoad} type="primary">
            {t("tmsDispatch.nextAction.viewDetails")}
          </Button>
        )}
        className="tms-next-action"
        description={t("tmsDispatch.nextAction.risk", { reason: action.reason })}
        message={t("tmsDispatch.nextAction.title")}
        showIcon
        type="warning"
      />
    );
  }

  if (action.kind === "approve-suggestion") {
    return (
      <Alert
        action={(
          <Button className="tms-control-button" onClick={onReviewSuggestion} type="primary">
            {t("tmsDispatch.nextAction.approve")}
          </Button>
        )}
        className="tms-next-action"
        description={t("tmsDispatch.nextAction.suggestionReady")}
        message={t("tmsDispatch.nextAction.title")}
        showIcon
        type="info"
      />
    );
  }

  return (
    <Alert
      action={(
        <Button className="tms-control-button" disabled>
          {t("tmsDispatch.nextAction.manualAssign")}
        </Button>
      )}
      className="tms-next-action"
      description={(
        <span>
          {t("tmsDispatch.nextAction.noSuggestion")}<br />
          {t("tmsDispatch.nextAction.manualAssignUnavailable")}
        </span>
      )}
      message={t("tmsDispatch.nextAction.title")}
      showIcon
      type="info"
    />
  );
}
