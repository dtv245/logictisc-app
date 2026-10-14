import { Alert, Button, Space, Table, Tabs, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { EmptyState } from "@/components/EmptyState";
import { financialAmount } from "@/features/profitability/utils/financialDisplay";
import type { OptimizationCandidate, OptimizationOutcome } from "@/types/optimization.dto";
import type { OptimizationActionsResult } from "./useOptimizationActions";
import { OptimizationCandidateDrawer } from "./OptimizationCandidateDrawer";
import { RejectionCodeTag } from "./rejectionCodes";

export function OptimizationCandidateTable({
  outcome,
  actions,
}: {
  outcome: OptimizationOutcome;
  actions: OptimizationActionsResult;
}) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<OptimizationCandidate | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const keys = useRef(new Map<string, string>());

  const keyFor = (id: string) => {
    let key = keys.current.get(id);
    if (!key) {
      key = crypto.randomUUID();
      keys.current.set(id, key);
    }
    return key;
  };

  const feasibleCandidates = useMemo(
    () =>
      outcome.candidates
        .filter((c) => c.feasible)
        .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    [outcome.candidates]
  );

  const infeasibleCandidates = useMemo(
    () => outcome.candidates.filter((c) => !c.feasible),
    [outcome.candidates]
  );

  if (outcome.candidates.length === 0) {
    return <EmptyState />;
  }

  const renderDeadhead = (row: OptimizationCandidate) => {
    const deadhead = row.explanation.evidence.route?.value.deadhead;
    if (!deadhead) return "—";
    if (deadhead.normalizedMiles != null) {
      const km = Number(deadhead.normalizedMiles) * 1.609344;
      return `${km.toFixed(1)} km (${deadhead.normalizedMiles} mi)`;
    }
    if (deadhead.originalUnit === "KILOMETER") {
      return `${deadhead.originalValue} km`;
    }
    return `${deadhead.originalValue} ${deadhead.originalUnit}`;
  };

  // Cột cho Tab Khả thi
  const feasibleColumns: ColumnsType<OptimizationCandidate> = [
    {
      title: t("optimization.rank"),
      dataIndex: "rank",
      width: 90,
      sorter: (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999),
      render: (value: number | null) =>
        value === 1 ? (
          <Tooltip title={t("optimization.rankOneTooltip", { defaultValue: "Ứng viên tối ưu nhất (Hạng 1)" })}>
            <Tag color="gold" style={{ fontWeight: 700, fontSize: 13, border: "1px solid #d4b106" }}>
              ★ 1
            </Tag>
          </Tooltip>
        ) : (
          value ?? "—"
        ),
    },
    {
      title: t("optimization.driverId"),
      dataIndex: "driverId",
      width: 160,
      render: (value: string) => <span style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>{value}</span>,
    },
    {
      title: t("optimization.truckId"),
      dataIndex: "truckId",
      width: 160,
      render: (value: string) => <span style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>{value}</span>,
    },
    {
      title: t("optimization.target"),
      width: 170,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>Load: {row.loadId}</span>
          <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>Trip: {row.tripId}</span>
        </Space>
      ),
    },
    {
      title: t("optimization.finalScore"),
      dataIndex: "finalScore",
      width: 120,
      align: "right",
      className: "tabular-nums text-right font-mono",
      sorter: (a, b) => Number(a.finalScore ?? 0) - Number(b.finalScore ?? 0),
      filters: [
        { text: "≥ 90", value: 90 },
        { text: "≥ 80", value: 80 },
        { text: "≥ 70", value: 70 },
        { text: "< 70", value: "below70" },
      ],
      onFilter: (value, record) => {
        const score = Number(record.finalScore ?? 0);
        if (value === "below70") return score < 70;
        return score >= Number(value);
      },
      render: (value: string | number | null) => (
        <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace", fontWeight: 600 }}>
          {value ?? "—"}
        </span>
      ),
    },
    {
      title: t("optimization.expectedRevenue"),
      width: 160,
      render: (_, row) =>
        financialAmount(row.explanation.forecast?.expectedRevenue, row.explanation.forecast?.currency, i18n.language),
    },
    {
      title: t("optimization.expectedVariableCost"),
      width: 160,
      render: (_, row) =>
        financialAmount(row.explanation.forecast?.expectedVariableCost, row.explanation.forecast?.currency, i18n.language),
    },
    {
      title: t("optimization.expectedContributionMargin"),
      width: 170,
      sorter: (a, b) =>
        Number(a.explanation.forecast?.expectedContributionMargin ?? 0) -
        Number(b.explanation.forecast?.expectedContributionMargin ?? 0),
      filters: [
        { text: "> 0", value: "positive" },
        { text: "≤ 0", value: "non-positive" },
      ],
      onFilter: (value, record) => {
        const margin = Number(record.explanation.forecast?.expectedContributionMargin ?? 0);
        return value === "positive" ? margin > 0 : margin <= 0;
      },
      render: (_, row) =>
        financialAmount(
          row.explanation.forecast?.expectedContributionMargin,
          row.explanation.forecast?.currency,
          i18n.language
        ),
    },
    {
      title: t("optimization.deadheadKm", { defaultValue: "Cự ly chạy rỗng (km)" }),
      width: 170,
      render: (_, row) => renderDeadhead(row),
    },
    {
      title: t("common.actions"),
      fixed: "right",
      width: 180,
      render: (_, candidate) => (
        <Space wrap>
          <Button
            onClick={(e) => {
              setTriggerElement(e.currentTarget);
              setSelected(candidate);
            }}
          >
            {t("optimization.explain")}
          </Button>
          {actions.canAccept(candidate) && (
            <ConfirmActionModal
              triggerLabel={t("optimization.accept")}
              triggerAriaLabel={t("optimization.acceptCandidate", { id: candidate.id })}
              title={t("optimization.accept")}
              description={
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Typography.Text>
                    {t("optimization.acceptConfirm", {
                      loadId: candidate.loadId,
                      tripId: candidate.tripId,
                      driverId: candidate.driverId,
                      truckId: candidate.truckId,
                    })}
                  </Typography.Text>
                  <Alert
                    type="warning"
                    showIcon
                    message={t("optimization.acceptConsequenceTitle", { defaultValue: "Hậu quả hành động" })}
                    description={t("optimization.acceptConsequence", {
                      defaultValue:
                        "Hệ thống sẽ khoá tài nguyên, tạo DriverAssignment và bản ghi này trở thành bất biến.",
                    })}
                  />
                </Space>
              }
              disabled={actions.pending}
              onConfirm={async () => {
                try {
                  await actions.execute({
                    action: "accept",
                    candidate,
                    payload: {
                      idempotencyKey: keyFor(candidate.id),
                      expectedInputFingerprint: candidate.inputFingerprint,
                    },
                  });
                } catch {
                  // The hook displays the failure. Close confirmation; an explicit retry keeps its replay key.
                }
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  // Cột cho Tab Không khả thi
  const infeasibleColumns: ColumnsType<OptimizationCandidate> = [
    {
      title: t("optimization.driverId"),
      dataIndex: "driverId",
      width: 160,
      render: (value: string) => <span style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>{value}</span>,
    },
    {
      title: t("optimization.truckId"),
      dataIndex: "truckId",
      width: 160,
      render: (value: string) => <span style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>{value}</span>,
    },
    {
      title: t("optimization.target"),
      width: 170,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>Load: {row.loadId}</span>
          <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>Trip: {row.tripId}</span>
        </Space>
      ),
    },
    {
      title: t("optimization.infeasibleReasons", { defaultValue: "Lý do không khả thi" }),
      dataIndex: "rejectionCodes",
      width: 240,
      render: (_, row: OptimizationCandidate) => (
        <Space wrap size={[4, 6]}>
          {row.rejectionCodes.map((code) => (
            <RejectionCodeTag key={code} code={code} />
          ))}
        </Space>
      ),
    },
    {
      title: t("optimization.deadheadKm", { defaultValue: "Cự ly chạy rỗng (km)" }),
      width: 170,
      render: (_, row) => renderDeadhead(row),
    },
    {
      title: t("optimization.expectedRevenue"),
      width: 160,
      render: (_, row) =>
        financialAmount(row.explanation.forecast?.expectedRevenue, row.explanation.forecast?.currency, i18n.language),
    },
    {
      title: t("optimization.expectedVariableCost"),
      width: 160,
      render: (_, row) =>
        financialAmount(row.explanation.forecast?.expectedVariableCost, row.explanation.forecast?.currency, i18n.language),
    },
    {
      title: t("optimization.expectedContributionMargin"),
      width: 170,
      render: (_, row) =>
        financialAmount(
          row.explanation.forecast?.expectedContributionMargin,
          row.explanation.forecast?.currency,
          i18n.language
        ),
    },
    {
      title: t("common.actions"),
      fixed: "right",
      width: 120,
      render: (_, candidate) => (
        <Button
          onClick={(e) => {
            setTriggerElement(e.currentTarget);
            setSelected(candidate);
          }}
        >
          {t("optimization.explain")}
        </Button>
      ),
    },
  ];

  if (outcome.candidates.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <Tabs
        defaultActiveKey="feasible"
        destroyOnHidden={false}
        items={[
          {
            key: "feasible",
            label: (
              <span>
                {t("optimization.feasible")} ({feasibleCandidates.length})
              </span>
            ),
            children: (
              <div className="optimization-table-container">
                <Table
                  rowKey="id"
                  dataSource={feasibleCandidates}
                  pagination={{ pageSize: 20, responsive: true }}
                  scroll={{ x: 1540 }}
                  locale={{ emptyText: <EmptyState /> }}
                  rowClassName={(record) => (record.rank === 1 ? "rank-one-highlight" : "")}
                  rowHoverable={true}
                  columns={feasibleColumns}
                />
              </div>
            ),
          },
          {
            key: "infeasible",
            label: (
              <span>
                {t("optimization.infeasible")} ({infeasibleCandidates.length})
              </span>
            ),
            forceRender: true,
            children: (
              <div className="optimization-table-container">
                <Table
                  rowKey="id"
                  dataSource={infeasibleCandidates}
                  pagination={{ pageSize: 20, responsive: true }}
                  scroll={{ x: 1510 }}
                  locale={{ emptyText: <EmptyState /> }}
                  columns={infeasibleColumns}
                />
              </div>
            ),
          },
        ]}
      />
      <OptimizationCandidateDrawer
        candidate={selected}
        onClose={() => setSelected(null)}
        triggerElement={triggerElement}
      />
    </>
  );
}
