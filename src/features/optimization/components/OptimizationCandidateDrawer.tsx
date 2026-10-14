/** Immutable backend explanation. Score, contributions and ranks are never recomputed. */
import { useEffect, useMemo, lazy, Suspense } from "react";
import { Alert, Card, Descriptions, Drawer, Progress, Skeleton, Space, Table, Tabs, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/formatters/dateTime";
import type { OptimizationCandidate, OptimizationProvenance } from "@/types/optimization.dto";
import { RejectionCodeTag } from "./rejectionCodes";

const CandidateVisualizations = lazy(
  () => import("../visualizations/CandidateVisualizations"),
);

export interface OptimizationCandidateDrawerProps {
  candidate: OptimizationCandidate | null;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

export function OptimizationCandidateDrawer({
  candidate,
  onClose,
  triggerElement,
}: OptimizationCandidateDrawerProps) {
  const { t, i18n } = useTranslation();

  // Đóng bằng Esc và trả focus về nút đã mở
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && candidate) {
        onClose();
        setTimeout(() => {
          triggerElement?.focus();
        }, 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [candidate, onClose, triggerElement]);

  const score = candidate?.explanation.score;
  const policies = score?.policy;
  const hos = candidate?.explanation.hos?.value;
  const route = candidate?.explanation.evidence.route?.value;

  const componentEntries = useMemo(() => {
    if (!score?.components) return [];
    return Object.entries(score.components).map(([component, values]) => ({
      component,
      ...values,
    }));
  }, [score]);

  const curvesEntries = useMemo(() => {
    if (!policies?.curves) return [];
    return Object.entries(policies.curves);
  }, [policies]);

  return (
    <Drawer
      open={candidate != null}
      title={t("optimization.explain")}
      onClose={() => {
        onClose();
        setTimeout(() => {
          triggerElement?.focus();
        }, 50);
      }}
      afterOpenChange={(open) => {
        if (!open) {
          triggerElement?.focus();
        }
      }}
      width="min(840px, 100vw)"
      keyboard={true}
    >
      {candidate && (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Cảnh báo mã từ chối nếu có */}
          {candidate.rejectionCodes.map((code) => (
            <Alert
              key={code}
              type="error"
              message={t(`optimization.errors.${code}`, { defaultValue: code })}
              description={code}
            />
          ))}

          {/* Tóm tắt ứng viên & chính sách */}
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2 }}
            items={[
              {
                key: "candidate",
                label: t("optimization.candidateId"),
                children: (
                  <span className="tabular-nums" style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                    {candidate.id}
                  </span>
                ),
              },
              { key: "score", label: t("optimization.finalScore"), children: <span className="tabular-nums">{candidate.finalScore ?? "—"}</span> },
              ...(["utilityPolicy", "weightPolicy", "numericPolicy"] as const).map((key) => ({
                key,
                label: t(`optimization.${key}`),
                children: policies?.[key] ? `${policies[key].code} / ${policies[key].version}` : "—",
              })),
              {
                key: "hos",
                label: t("optimization.hosPolicy"),
                children: candidate.explanation.hos
                  ? `${candidate.explanation.hos.value.ruleSetCode} / ${candidate.explanation.hos.value.ruleSetVersion}`
                  : "—",
              },
              {
                key: "route",
                label: t("optimization.routePlan"),
                children: candidate.explanation.evidence.route
                  ? `${candidate.explanation.evidence.route.value.simulatedRoutePlanReference} / ${candidate.explanation.evidence.route.value.simulatedRoutePlanVersion}`
                  : "—",
              },
              {
                key: "rating",
                label: t("optimization.ratingSnapshotId"),
                children: (
                  <span style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                    {candidate.ratingSnapshotId ?? "—"}
                  </span>
                ),
              },
              {
                key: "costs",
                label: t("optimization.forecastCostIds"),
                children: (
                  <span style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                    {candidate.explanation.forecast?.forecastCostIds.join(", ") || "—"}
                  </span>
                ),
              },
            ]}
          />

          {/* 4 Tabs: Thành phần điểm, Đường cong utility, Chứng cứ nguồn gốc, Kiểm tra cứng */}
          <Tabs
            defaultActiveKey="components"
            destroyOnHidden={false}
            items={[
              {
                key: "components",
                label: t("optimization.scoreComponents", { defaultValue: "Thành phần điểm" }),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {score ? (
                      <>
                        {/* Bar chart ngang theo trọng số */}
                        {componentEntries.length > 0 && (
                          <Card size="small" title={t("optimization.scoreComponents")}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                              {componentEntries.map((comp) => {
                                const weightNum = comp.weight != null ? Number(comp.weight) : 0;
                                const weightPercent = Math.min(Math.max(Math.round(weightNum * 100), 0), 100);
                                return (
                                  <div key={comp.component} style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                      <Typography.Text strong>{comp.component}</Typography.Text>
                                      <Typography.Text type="secondary">
                                        {weightPercent}%
                                      </Typography.Text>
                                    </div>
                                    <Progress
                                      percent={weightPercent}
                                      strokeColor="#1677ff"
                                      showInfo={false}
                                    />
                                  </div>
                                );
                              })}
                            </Space>
                          </Card>
                        )}

                        {/* Bảng chi tiết thành phần điểm */}
                        <Table
                          rowKey="component"
                          pagination={false}
                          scroll={{ x: "max-content" }}
                          dataSource={componentEntries}
                          columns={[
                            { title: t("optimization.component"), dataIndex: "component" },
                            ...(["rawValue", "rawUnit", "normalizedUtility", "weight", "contribution"] as const).map(
                              (field) => ({
                                title: t(`optimization.${field}`),
                                dataIndex: field,
                                align: field === "rawUnit" ? "left" as const : "right" as const,
                                render: (value: string | number | null) => (value != null ? <span className="tabular-nums">{value}</span> : "—"),
                              })
                            ),
                          ]}
                        />
                      </>
                    ) : (
                      <Alert type="info" message={t("optimization.noScore")} />
                    )}
                  </Space>
                ),
              },
              {
                key: "curves",
                label: t("optimization.utilityCurves", { defaultValue: "Đường cong utility" }),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {curvesEntries.length > 0 ? (
                      curvesEntries.map(([curveKey, points]) => (
                        <Card key={curveKey} size="small" title={`Curve: ${curveKey}`}>
                          <Table
                            rowKey={(record) => `${record.raw}_${record.utility}`}
                            pagination={false}
                            size="small"
                            dataSource={points}
                            columns={[
                              {
                                title: t("optimization.rawValue"),
                                dataIndex: "raw",
                                render: (val) => String(val),
                              },
                              {
                                title: t("optimization.normalizedUtility"),
                                dataIndex: "utility",
                                render: (val) => String(val),
                              },
                            ]}
                          />
                        </Card>
                      ))
                    ) : (
                      <Alert
                        type="info"
                        message={t("optimization.noCurves", {
                          defaultValue: "Không có dữ liệu đường cong utility trong chính sách này.",
                        })}
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: "provenance",
                label: t("optimization.provenance", { defaultValue: "Chứng cứ nguồn gốc" }),
                children: (
                  <Table
                    rowKey="type"
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    dataSource={[
                      {
                        type: t("optimization.routePlan"),
                        evidence: candidate.explanation.evidence.route?.provenance,
                      },
                      {
                        type: t("optimization.hos"),
                        evidence: candidate.explanation.hos?.provenance,
                      },
                    ]}
                    columns={[
                      { title: t("optimization.component"), dataIndex: "type" },
                      {
                        title: t("optimization.evidenceReference"),
                        render: (_, row) =>
                          row.evidence
                            ? `${row.evidence.evidenceReference} / ${row.evidence.evidenceVersion}`
                            : "—",
                      },
                      {
                        title: t("optimization.source"),
                        render: (_, row) =>
                          row.evidence
                            ? `${row.evidence.source.type} / ${row.evidence.source.reference} / ${row.evidence.source.version}`
                            : "—",
                      },
                      ...(["observedAt", "expiresAt"] as const).map((field) => ({
                        title: t(`optimization.${field}`),
                        render: (_: unknown, row: { evidence: OptimizationProvenance | undefined }) => (
                          <span className="tabular-nums">
                            {formatDateTime(row.evidence?.[field], { locale: i18n.language })}
                          </span>
                        ),
                      })),
                    ]}
                  />
                ),
              },
              {
                key: "hardGates",
                label: t("optimization.hardGates", { defaultValue: "Kiểm tra cứng" }),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* Kết quả tổng thể */}
                    <Card size="small" title="Tính khả thi tổng thể (Feasibility)">
                      <Space>
                        <Tag color={candidate.feasible ? "success" : "error"} style={{ fontSize: 14, padding: "4px 8px" }}>
                          {candidate.feasible ? "KHẢ THI" : "KHÔNG KHẢ THI"}
                        </Tag>
                        {candidate.rejectionCodes.length > 0 && (
                          <Space wrap>
                            {candidate.rejectionCodes.map((c) => (
                              <RejectionCodeTag key={c} code={c} />
                            ))}
                          </Space>
                        )}
                      </Space>
                    </Card>

                    {/* Kiểm tra HOS */}
                    {hos && (
                      <Card size="small" title={`Kiểm tra HOS (${hos.ruleSetCode} v${hos.ruleSetVersion})`}>
                        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                          <Descriptions.Item label="Giờ lái (Drive)">
                            {hos.driveFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Giờ làm việc (Duty)">
                            {hos.dutyFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Nghỉ giải lao (Break)">
                            {hos.breakFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Chu kỳ tuần (Cycle)">
                            {hos.cycleFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Dịch vụ (Service)">
                            {hos.serviceFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Sẵn sàng tiếp theo (Next Available)">
                            {hos.nextAvailableFeasible ? <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>Vi phạm</Tag>}
                          </Descriptions.Item>
                          <Descriptions.Item label="Tỷ lệ dự trữ HOS tối thiểu">
                            {hos.minimumHosHeadroomRatio != null ? `${Number(hos.minimumHosHeadroomRatio) * 100}%` : "—"}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    )}

                    {/* Kiểm tra Deadhead & Điểm lấy hàng */}
                    {route && (
                      <Card size="small" title="Kiểm tra Deadhead & Lấy hàng">
                        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                          <Descriptions.Item label="Tới được điểm lấy hàng (Pickup Reachable)">
                            {route.pickupReachable ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>Đạt</Tag>
                            ) : (
                              <Tag color="error" icon={<CloseCircleOutlined />}>Không tới được</Tag>
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Cự ly chạy rỗng (Deadhead)">
                            {route.deadhead?.normalizedMiles != null
                              ? `${(Number(route.deadhead.normalizedMiles) * 1.609344).toFixed(1)} km (${route.deadhead.normalizedMiles} mi)`
                              : "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Cự ly chở hàng (Loaded miles)">
                            {route.loadAttributedLoadedMiles?.normalizedMiles != null
                              ? `${(Number(route.loadAttributedLoadedMiles.normalizedMiles) * 1.609344).toFixed(1)} km (${route.loadAttributedLoadedMiles.normalizedMiles} mi)`
                              : "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Giờ hẹn lấy hàng">
                            {formatDateTime(route.appointmentStart, { locale: i18n.language })}
                          </Descriptions.Item>
                          <Descriptions.Item label="Dự kiến đến điểm lấy hàng">
                            {formatDateTime(route.predictedArrivalAtPickup, { locale: i18n.language })}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    )}
                  </Space>
                ),
              },
              {
                key: "visualizations",
                label: t("optimization.visualizations"),
                children: (
                  <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
                    <CandidateVisualizations candidate={candidate} />
                  </Suspense>
                ),
              },
            ]}
          />
        </Space>
      )}
    </Drawer>
  );
}
