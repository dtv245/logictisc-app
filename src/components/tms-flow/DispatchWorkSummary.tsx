import { AlertTriangle, Sparkles, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface DispatchWorkSummaryProps {
  atRiskCount?: number;
  atRiskIsLowerBound?: boolean;
  unassignedCount?: number;
  unassignedIsLowerBound?: boolean;
  pendingApprovalCount?: number;
  onAtRisk: () => void;
  onUnassigned: () => void;
  onPendingApprovals: () => void;
}

export function DispatchWorkSummary({
  atRiskCount,
  atRiskIsLowerBound = false,
  unassignedCount,
  unassignedIsLowerBound = false,
  pendingApprovalCount,
  onAtRisk,
  onUnassigned,
  onPendingApprovals,
}: DispatchWorkSummaryProps) {
  const { t } = useTranslation();
  const cards = [
    {
      key: "at-risk",
      icon: <AlertTriangle aria-hidden="true" size={18} />,
      label: t("tmsDispatch.summary.atRisk"),
      count: atRiskCount,
      isLowerBound: atRiskIsLowerBound,
      onClick: onAtRisk,
    },
    {
      key: "unassigned",
      icon: <Truck aria-hidden="true" size={18} />,
      label: t("tmsDispatch.summary.unassigned"),
      count: unassignedCount,
      isLowerBound: unassignedIsLowerBound,
      onClick: onUnassigned,
    },
    {
      key: "approvals",
      icon: <Sparkles aria-hidden="true" size={18} />,
      label: t("tmsDispatch.summary.pendingApprovals"),
      count: pendingApprovalCount,
      isLowerBound: false,
      onClick: onPendingApprovals,
    },
  ];

  return (
    <div className="tms-work-summary" aria-label={t("tmsDispatch.summary.label")}>
      {cards.map((card) => (
        <button
          className="tms-work-summary__card"
          data-testid={`dispatch-summary-${card.key}`}
          key={card.key}
          onClick={card.onClick}
          type="button"
        >
          <span className="tms-work-summary__icon">{card.icon}</span>
          <span className="tms-work-summary__content">
            <strong>{card.label}</strong>
            {card.count === undefined ? null : (
              <span>
                {card.isLowerBound
                  ? t("tmsDispatch.summary.atLeast", { count: card.count })
                  : t("tmsDispatch.summary.count", { count: card.count })}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
