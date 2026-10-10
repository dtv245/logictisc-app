/** Immutable backend explanation. Score, contributions and ranks are never recomputed. */
import { Alert, Descriptions, Drawer, Space, Table } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/formatters/dateTime";
import type { OptimizationCandidate, OptimizationProvenance } from "@/types/optimization.dto";
export function OptimizationCandidateDrawer({ candidate, onClose }: { candidate: OptimizationCandidate | null; onClose: () => void }) {
  const { t, i18n } = useTranslation(); const score = candidate?.explanation.score;
  const policies = score?.policy;
  return <Drawer open={candidate != null} title={t("optimization.explain")} onClose={onClose} width="min(760px, 100vw)">
    {candidate && <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {candidate.rejectionCodes.map((code) => <Alert key={code} type="error" message={t(`optimization.errors.${code}`, { defaultValue: code })} description={code} />)}
      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
        { key: "candidate", label: t("optimization.candidateId"), children: candidate.id },
        { key: "score", label: t("optimization.finalScore"), children: candidate.finalScore ?? "—" },
        ...(["utilityPolicy", "weightPolicy", "numericPolicy"] as const).map((key) => ({ key, label: t(`optimization.${key}`), children: policies?.[key] ? `${policies[key].code} / ${policies[key].version}` : "—" })),
        { key: "hos", label: t("optimization.hosPolicy"), children: candidate.explanation.hos ? `${candidate.explanation.hos.value.ruleSetCode} / ${candidate.explanation.hos.value.ruleSetVersion}` : "—" },
        { key: "route", label: t("optimization.routePlan"), children: candidate.explanation.evidence.route ? `${candidate.explanation.evidence.route.value.simulatedRoutePlanReference} / ${candidate.explanation.evidence.route.value.simulatedRoutePlanVersion}` : "—" },
        { key: "rating", label: t("optimization.ratingSnapshotId"), children: candidate.ratingSnapshotId ?? "—" },
        { key: "costs", label: t("optimization.forecastCostIds"), children: candidate.explanation.forecast?.forecastCostIds.join(", ") || "—" },
      ]} />
      {score ? <Table rowKey="component" pagination={false} scroll={{ x: "max-content" }} dataSource={Object.entries(score.components ?? {}).map(([component, values]) => ({ component, ...values }))} columns={[
        { title: t("optimization.component"), dataIndex: "component" },
        ...(["rawValue", "rawUnit", "normalizedUtility", "weight", "contribution"] as const).map((field) => ({ title: t(`optimization.${field}`), dataIndex: field, render: (value: string | number | null) => value ?? "—" })),
      ]} /> : <Alert type="info" message={t("optimization.noScore")} />}
      <Table rowKey="type" pagination={false} scroll={{ x: "max-content" }} dataSource={[
        { type: t("optimization.routePlan"), evidence: candidate.explanation.evidence.route?.provenance },
        { type: t("optimization.hos"), evidence: candidate.explanation.hos?.provenance },
      ]} columns={[
        { title: t("optimization.component"), dataIndex: "type" },
        { title: t("optimization.evidenceReference"), render: (_, row) => row.evidence ? `${row.evidence.evidenceReference} / ${row.evidence.evidenceVersion}` : "—" },
        { title: t("optimization.source"), render: (_, row) => row.evidence ? `${row.evidence.source.type} / ${row.evidence.source.reference} / ${row.evidence.source.version}` : "—" },
        ...(["observedAt", "expiresAt"] as const).map((field) => ({ title: t(`optimization.${field}`), render: (_: unknown, row: { evidence: OptimizationProvenance | undefined }) => formatDateTime(row.evidence?.[field], { locale: i18n.language }) })),
      ]} />
    </Space>}
  </Drawer>;
}
