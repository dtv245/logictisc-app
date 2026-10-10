import { Button, Space, Table } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { EmptyState } from "@/components/EmptyState";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { formatDateTime } from "@/formatters/dateTime";
import type { OptimizationCandidate, OptimizationOutcome } from "@/types/optimization.dto";
import type { OptimizationActionsResult } from "./useOptimizationActions";
import { OptimizationCandidateDrawer } from "./OptimizationCandidateDrawer";
export function OptimizationCandidateTable({ outcome, actions }: { outcome: OptimizationOutcome; actions: OptimizationActionsResult }) {
  const { t, i18n } = useTranslation(); const [selected, setSelected] = useState<OptimizationCandidate | null>(null); const keys = useRef(new Map<string, string>());
  const keyFor = (id: string) => { let key = keys.current.get(id); if (!key) { key = crypto.randomUUID(); keys.current.set(id, key); } return key; };
  return <><Table rowKey="id" dataSource={outcome.candidates} pagination={{ pageSize: 20 }} scroll={{ x: "max-content" }} locale={{ emptyText: <EmptyState /> }} columns={[
    { title: t("optimization.rank"), dataIndex: "rank", render: (value: number | null) => value ?? "—" },
    ...(["driverId", "truckId", "loadId", "tripId"] as const).map((field) => ({ title: t(`optimization.${field}`), dataIndex: field })),
    { title: t("optimization.feasible"), render: (_, row) => <Space direction="vertical"><StatusTag tone={statusTone(row.feasible ? "FEASIBLE" : "INFEASIBLE")} label={t(row.feasible ? "optimization.feasible" : "optimization.infeasible")} />
      {row.rejectionCodes.map((code) => <span key={code}>{t(`optimization.errors.${code}`, { defaultValue: code })} ({code})</span>)}</Space> },
    { title: t("optimization.deadhead"), render: (_, row) => row.explanation.evidence.route?.value.deadhead.normalizedMiles ?? "—" },
    { title: t("optimization.etaPickup"), render: (_, row) => formatDateTime(row.explanation.evidence.route?.value.predictedArrivalAtPickup, { locale: i18n.language }) },
    { title: t("optimization.hos"), render: (_, row) => row.explanation.hos ? `${row.explanation.hos.value.ruleSetCode} / ${row.explanation.hos.value.ruleSetVersion}` : "—" },
    ...(["expectedRevenue", "expectedVariableCost", "expectedContributionMargin"] as const).map((field) => ({ title: t(`optimization.${field}`), render: (_: unknown, row: OptimizationCandidate) => financialAmount(row.explanation.forecast?.[field], row.explanation.forecast?.currency, i18n.language) })),
    { title: t("optimization.finalScore"), dataIndex: "finalScore", render: (value: string | number | null) => value ?? "—" },
    { title: t("common.actions"), render: (_, candidate) => <Space wrap>
      <Button onClick={() => setSelected(candidate)}>{t("optimization.explain")}</Button>
      {actions.canAccept(candidate) && <ConfirmActionModal triggerLabel={t("optimization.accept")} triggerAriaLabel={t("optimization.acceptCandidate", { id: candidate.id })}
        title={t("optimization.accept")} description={t("optimization.acceptConfirm", { loadId: candidate.loadId, tripId: candidate.tripId, driverId: candidate.driverId, truckId: candidate.truckId })} disabled={actions.pending}
        onConfirm={async () => {
          try { await actions.execute({ action: "accept", candidate, payload: { idempotencyKey: keyFor(candidate.id), expectedInputFingerprint: candidate.inputFingerprint } }); }
          catch {
            // The hook displays the failure. Close confirmation; an explicit retry keeps its replay key.
            // Terminal conflicts hide acceptance and require a new run instead.
          }
        }} />}
    </Space> },
  ]} /><OptimizationCandidateDrawer candidate={selected} onClose={() => setSelected(null)} /></>;
}
