import React, { useMemo } from "react";
import { Alert, Card, Empty, Space, Tag, Typography } from "antd";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OptimizationCandidate } from "@/types/optimization.dto";

export interface CandidateHosTimelineProps {
  candidate: OptimizationCandidate | null;
}

export const CandidateHosTimeline: React.FC<CandidateHosTimelineProps> = ({
  candidate,
}) => {
  const { t } = useTranslation();

  const hos = candidate?.explanation?.hos?.value;

  const calculation = useMemo(() => {
    if (!hos) return null;

    const ruleSetCode = hos.ruleSetCode || "US_FMCSA_PROPERTY";
    const ruleSetVersion = hos.ruleSetVersion || "1";

    // Xác định giới hạn giờ lái theo luật HOS (mặc định 11h cho xe tải chở hàng US FMCSA)
    const maxHours =
      hos.maxDrivingHours && hos.maxDrivingHours > 0
        ? Number(hos.maxDrivingHours)
        : ruleSetCode.includes("10")
          ? 10.0
          : ruleSetCode.includes("12")
            ? 12.0
            : 11.0;

    const headroomRatio =
      hos.minimumHosHeadroomRatio != null
        ? Number(hos.minimumHosHeadroomRatio)
        : null;

    let usedHours: number;
    let remainingHours: number;

    if (hos.usedDrivingHours != null && hos.remainingDrivingHours != null) {
      usedHours = Math.max(0, Number(hos.usedDrivingHours));
      remainingHours = Math.max(0, Number(hos.remainingDrivingHours));
    } else if (headroomRatio != null) {
      remainingHours = Math.max(0, Number((maxHours * Math.max(0, headroomRatio)).toFixed(2)));
      usedHours = Math.max(0, Number((maxHours - remainingHours).toFixed(2)));
    } else {
      usedHours = 0;
      remainingHours = maxHours;
    }

    const warningThresholdPct = 80; // Mốc cảnh báo 80% thời gian tối đa
    const warningThresholdHours = Number(((maxHours * warningThresholdPct) / 100).toFixed(1));

    // Đánh giá trạng thái vi phạm / cảnh báo / an toàn
    const isViolation =
      hos.driveFeasible === false ||
      hos.dutyFeasible === false ||
      hos.cycleFeasible === false ||
      remainingHours <= 0;

    const isWarning =
      !isViolation &&
      (headroomRatio != null
        ? headroomRatio < 0.2
        : usedHours >= warningThresholdHours || remainingHours <= 2.0);

    const isSafe = !isViolation && !isWarning;

    return {
      ruleSetCode,
      ruleSetVersion,
      maxHours,
      usedHours,
      remainingHours,
      headroomRatio,
      warningThresholdPct,
      warningThresholdHours,
      isViolation,
      isWarning,
      isSafe,
      driveFeasible: hos.driveFeasible,
      dutyFeasible: hos.dutyFeasible,
      breakFeasible: hos.breakFeasible,
      cycleFeasible: hos.cycleFeasible,
      nextAvailableFeasible: hos.nextAvailableFeasible,
    };
  }, [hos]);

  // Khi không có dữ liệu HOS trong DTO: Hiển thị Empty với lý do cụ thể, KHÔNG vẽ biểu đồ rỗng.
  if (!calculation) {
    return (
      <Card
        data-testid="candidate-hos-timeline-empty"
        bordered
        style={{ width: "100%", background: "#f8fafc" }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small" style={{ width: "100%", textAlign: "left" }}>
              <Typography.Title level={5} style={{ margin: 0, color: "#0f172a" }}>
                {t("optimization.hosMissingTitle")}
              </Typography.Title>
              <Alert
                type="info"
                showIcon
                message={t("optimization.hosMissingDesc")}
                description="Trường explanation.hos trong DTO hiện đang null hoặc không có dữ liệu đánh giá feasibility từ backend HOS subsystem."
                style={{ marginTop: 8 }}
              />
            </Space>
          }
        />
      </Card>
    );
  }

  const {
    ruleSetCode,
    ruleSetVersion,
    maxHours,
    usedHours,
    remainingHours,
    headroomRatio,
    warningThresholdPct,
    warningThresholdHours,
    isViolation,
    isWarning,
    isSafe,
    driveFeasible,
    dutyFeasible,
    breakFeasible,
    cycleFeasible,
    nextAvailableFeasible,
  } = calculation;

  const usedPercentage = Math.min(100, Math.max(0, (usedHours / maxHours) * 100));
  const remainingPercentage = Math.min(
    100 - usedPercentage,
    Math.max(0, (remainingHours / maxHours) * 100),
  );

  // Accessible descriptive summary for screen-readers
  const ariaDescription = `Đã sử dụng ${usedHours.toFixed(1)} giờ trên tổng ${maxHours} giờ tối đa theo luật ${ruleSetCode}. Còn lại ${remainingHours.toFixed(1)} giờ. ${
    isViolation
      ? "Trạng thái: Vi phạm giới hạn HOS."
      : isWarning
        ? "Trạng thái: Cảnh báo sắp hết giờ lái xe an toàn."
        : "Trạng thái: An toàn trong giới hạn quy định."
  }`;

  return (
    <Card
      data-testid="candidate-hos-timeline"
      role="region"
      aria-label={t("optimization.hosTimeline")}
      bordered
      style={{ width: "100%", background: "#ffffff" }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Header thông tin luật HOS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: "#0f172a" }}>
              {t("optimization.hosRuleSetLabel")}: {ruleSetCode} (v{ruleSetVersion})
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
              {t("optimization.hosMaxHours")}: {maxHours.toFixed(1)}h / ca lái xe
            </Typography.Text>
          </div>

          <Space size={6} wrap>
            <Tag color={driveFeasible ? "success" : "error"} icon={driveFeasible ? <ShieldCheck size={13} style={{ marginRight: 3, verticalAlign: "middle" }} /> : <ShieldAlert size={13} style={{ marginRight: 3, verticalAlign: "middle" }} />}>
              {t("optimization.hosDriveFeasible")}: {driveFeasible ? t("optimization.feasible") : t("optimization.infeasible")}
            </Tag>
            <Tag color={dutyFeasible ? "success" : "error"}>
              {t("optimization.hosDutyFeasible")}: {dutyFeasible ? t("optimization.feasible") : t("optimization.infeasible")}
            </Tag>
            <Tag color={breakFeasible ? "success" : "error"}>
              {t("optimization.hosBreakFeasible")}: {breakFeasible ? t("optimization.feasible") : t("optimization.infeasible")}
            </Tag>
            <Tag color={cycleFeasible ? "success" : "error"}>
              {t("optimization.hosCycleFeasible")}: {cycleFeasible ? t("optimization.feasible") : t("optimization.infeasible")}
            </Tag>
            {nextAvailableFeasible != null && (
              <Tag color={nextAvailableFeasible ? "cyan" : "volcano"}>
                Next: {nextAvailableFeasible ? t("optimization.feasible") : t("optimization.infeasible")}
              </Tag>
            )}
          </Space>
        </div>

        {/* Thông báo tình trạng cảnh báo / vi phạm với chữ mô tả kèm màu (a11y) */}
        {isViolation && (
          <Alert
            data-testid="hos-alert-violation"
            type="error"
            showIcon
            icon={<AlertCircle size={20} />}
            message={
              <Typography.Text strong style={{ color: "#991b1b" }}>
                {t("optimization.hosViolationTitle")}
              </Typography.Text>
            }
            description={t("optimization.hosViolationDesc", {
              ruleSet: ruleSetCode,
              remaining: remainingHours.toFixed(1),
            })}
          />
        )}

        {isWarning && (
          <Alert
            data-testid="hos-alert-warning"
            type="warning"
            showIcon
            icon={<AlertTriangle size={20} />}
            message={
              <Typography.Text strong style={{ color: "#92400e" }}>
                {t("optimization.hosWarningTitle")}
              </Typography.Text>
            }
            description={t("optimization.hosWarningDesc", {
              headroom: ((headroomRatio ?? 0.15) * 100).toFixed(0),
              remaining: remainingHours.toFixed(1),
            })}
          />
        )}

        {isSafe && (
          <Alert
            data-testid="hos-alert-safe"
            type="success"
            showIcon
            icon={<CheckCircle2 size={20} />}
            message={
              <Typography.Text strong style={{ color: "#166534" }}>
                {t("optimization.hosSafeTitle")}
              </Typography.Text>
            }
            description={t("optimization.hosSafeDesc", {
              ruleSet: ruleSetCode,
              headroom: ((headroomRatio ?? 0.5) * 100).toFixed(0),
              remaining: remainingHours.toFixed(1),
            })}
          />
        )}

        {/* Thanh ngang Timeline HOS */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: "#1e40af" }}>
              <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              {t("optimization.hosUsedHours")}: {usedHours.toFixed(1)}h ({usedPercentage.toFixed(0)}%)
            </span>
            <span
              style={{
                fontWeight: 600,
                color: isViolation ? "#dc2626" : isWarning ? "#b45309" : "#047857",
              }}
            >
              <Shield size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              {t("optimization.hosRemainingHours")}: {remainingHours.toFixed(1)}h ({remainingPercentage.toFixed(0)}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={t("optimization.hosTimeline")}
            aria-valuemin={0}
            aria-valuemax={maxHours}
            aria-valuenow={usedHours}
            aria-valuetext={ariaDescription}
            style={{
              position: "relative",
              width: "100%",
              height: 38,
              borderRadius: 8,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* Phân đoạn 1: Giờ đã dùng */}
            <div
              style={{
                width: `${usedPercentage}%`,
                height: "100%",
                background: "#2563eb", // Xanh dương đậm độ tương phản cao
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                padding: "0 6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "width 0.3s ease",
              }}
              title={`${t("optimization.hosUsedHours")}: ${usedHours.toFixed(1)}h`}
            >
              {usedPercentage >= 15 ? `${usedHours.toFixed(1)}h (${usedPercentage.toFixed(0)}%)` : ""}
            </div>

            {/* Phân đoạn 2: Giờ còn lại */}
            <div
              style={{
                width: `${remainingPercentage}%`,
                height: "100%",
                background: isViolation ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isWarning ? "#451a03" : "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                padding: "0 6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "width 0.3s ease",
              }}
              title={`${t("optimization.hosRemainingHours")}: ${remainingHours.toFixed(1)}h`}
            >
              {remainingPercentage >= 15 ? `${remainingHours.toFixed(1)}h` : ""}
            </div>

            {/* Mốc cảnh báo 80% (Warning threshold marker) */}
            <div
              style={{
                position: "absolute",
                left: `${warningThresholdPct}%`,
                top: 0,
                bottom: 0,
                width: 2,
                borderLeft: "2px dashed #991b1b",
                zIndex: 5,
              }}
              title={`${t("optimization.hosWarningMilestone")}: ${warningThresholdHours}h (${warningThresholdPct}%)`}
            />
          </div>

          {/* Nhãn mốc cảnh báo phía dưới thanh */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 22,
              marginTop: 4,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            <div style={{ position: "absolute", left: 0 }}>0h</div>
            <div
              style={{
                position: "absolute",
                left: `${warningThresholdPct}%`,
                transform: "translateX(-50%)",
                color: "#b45309",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 2,
                whiteSpace: "nowrap",
              }}
            >
              <AlertTriangle size={12} />
              <span>{t("optimization.hosWarningMilestone")} ({warningThresholdHours}h)</span>
            </div>
            <div style={{ position: "absolute", right: 0 }}>{maxHours.toFixed(1)}h</div>
          </div>
        </div>

        {/* Bảng chi tiết thông số hỗ trợ đọc rõ ràng (a11y) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 12,
            padding: 12,
            borderRadius: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("optimization.hosUsedHours")}
            </Typography.Text>
            <Typography.Title level={5} style={{ margin: 0, color: "#1e40af" }}>
              {usedHours.toFixed(1)}h
            </Typography.Title>
          </div>

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("optimization.hosRemainingHours")}
            </Typography.Text>
            <Typography.Title
              level={5}
              style={{
                margin: 0,
                color: isViolation ? "#dc2626" : isWarning ? "#b45309" : "#047857",
              }}
            >
              {remainingHours.toFixed(1)}h
            </Typography.Title>
          </div>

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("optimization.hosMaxHours")}
            </Typography.Text>
            <Typography.Title level={5} style={{ margin: 0, color: "#334155" }}>
              {maxHours.toFixed(1)}h
            </Typography.Title>
          </div>

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("optimization.hosHeadroomRatio")}
            </Typography.Text>
            <Typography.Title level={5} style={{ margin: 0, color: "#0f172a" }}>
              {headroomRatio != null ? `${(headroomRatio * 100).toFixed(1)}%` : "—"}
            </Typography.Title>
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default CandidateHosTimeline;
