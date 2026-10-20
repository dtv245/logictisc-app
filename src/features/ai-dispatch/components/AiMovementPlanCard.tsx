/**
 * Hiển thị chi tiết Kế hoạch di chuyển do AI đề xuất và cung cấp thao tác Duyệt / Từ chối kế hoạch.
 */
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  InfoCircleOutlined,
  RightCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { StatusTag } from "@/components/StatusTag";
import { formatDateTime } from "@/formatters/dateTime";
import { routes } from "@/constants/routes";
import type { AiMovementPlan, AiPlanStopType } from "@/features/ai-dispatch/types/ai-dispatch.types";
import type { AiDispatchActionsResult } from "../hooks/useAiDispatchActions";

import "../styles/ai-dispatch.scss";

interface Props {
  plan: AiMovementPlan | null;
  actions: AiDispatchActionsResult;
  onNavigateToRun?: () => void;
}

const getStopTypeTag = (type: AiPlanStopType, label: string) => {
  switch (type) {
    case "terminal_origin":
      return <Tag color="blue">{label}</Tag>;
    case "pickup":
      return <Tag color="geekblue">{label}</Tag>;
    case "rest_break":
      return <Tag color="orange">{label}</Tag>;
    case "delivery":
      return <Tag color="purple">{label}</Tag>;
    case "terminal_return":
      return <Tag color="cyan">{label}</Tag>;
    default:
      return <Tag>{label}</Tag>;
  }
};

export function AiMovementPlanCard({ plan, actions, onNavigateToRun }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  if (!plan) {
    return (
      <Card bordered className="ai-plan-card">
        <Empty description={t("aiDispatch.noPlanYet")}>
          {onNavigateToRun && (
            <Button
              type="primary"
              onClick={onNavigateToRun}
              style={{ minHeight: 40, marginTop: 8 }}
            >
              {t("aiDispatch.runTitle")}
            </Button>
          )}
        </Empty>
      </Card>
    );
  }

  const isProposed = plan.status === "proposed";
  const isApproved = plan.status === "approved";
  const isRejected = plan.status === "rejected";
  const tripDetailRoute = plan.tripId
    ? routes.resources.trips.show.replace(":id", encodeURIComponent(plan.tripId))
    : null;

  const handleApprove = async () => {
    try {
      await actions.approvePlan(plan.id, approveNote.trim() || undefined);
      setApproveModalVisible(false);
      setApproveNote("");
    } catch {
      // Keep the confirmation and note available when the command fails.
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await actions.rejectPlan(plan.id, rejectReason.trim());
      setRejectModalVisible(false);
      setRejectReason("");
    } catch {
      // Keep the reason available when the command fails.
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%", maxWidth: "100%" }}>
      {/* 1. Header & Status Bar */}
      <Card
        size="small"
        bordered
        className="ai-plan-card"
        title={
          <Space align="center" wrap className="ai-plan-card__status-wrap">
            <RobotOutlined style={{ color: "#1890ff", fontSize: 18 }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              {t("aiDispatch.planTitle")}
            </Typography.Text>
            <StatusTag
              tone={isApproved ? "success" : isRejected ? "error" : "warning"}
              label={
                isApproved
                  ? t("aiDispatch.statusApproved")
                  : isRejected
                  ? t("aiDispatch.statusRejected")
                  : t("aiDispatch.statusProposed")
              }
            />
          </Space>
        }
        extra={
          <div className="ai-plan-card__actions">
            {isProposed && actions.canApprove && (
              <>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  disabled={actions.pending}
                  data-testid="btn-reject-movement-plan"
                >
                  {t("aiDispatch.rejectPlan")}
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                  loading={actions.pending}
                  data-testid="btn-approve-movement-plan"
                >
                  {t("aiDispatch.approvePlan")}
                </Button>
              </>
            )}
            {isApproved && tripDetailRoute && (
              <Button
                type="primary"
                icon={<RightCircleOutlined />}
                onClick={() => navigate(tripDetailRoute)}
                data-testid="btn-view-trip"
                aria-label={t("aiDispatch.viewTrip")}
              >
                {t("aiDispatch.viewTrip")}
              </Button>
            )}
          </div>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t("aiDispatch.planSubtitle")}
        </Typography.Paragraph>
      </Card>

      {/* 2. Notifications if Approved or Rejected */}
      {isApproved && (
        <Alert
          type="success"
          showIcon
          message={t("aiDispatch.approveSuccess")}
          description={
            plan.approvedAt
              ? `${t("aiDispatch.statusApproved")} lúc ${formatDateTime(plan.approvedAt, { locale: i18n.language })}`
              : undefined
          }
        />
      )}
      {isApproved && !plan.tripId && (
        <Alert
          type="info"
          showIcon
          message={t("aiDispatch.tripLinkUnavailable")}
        />
      )}
      {isRejected && (
        <Alert
          type="error"
          showIcon
          message={t("aiDispatch.rejectTitle")}
          description={plan.rejectionReason}
        />
      )}

      {/* 3. KPI Predictions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered className="ai-kpi-card">
            <Statistic
              title={t("aiDispatch.totalDistance")}
              value={plan.totalDistanceMiles ?? undefined}
              suffix="miles"
              precision={0}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("aiDispatch.deadheadReduction")}: -{plan.deadheadReductionPercent}%
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered className="ai-kpi-card">
            <Statistic
              title={t("aiDispatch.estimatedMargin")}
              value={plan.estimatedMargin ?? undefined}
              prefix="$"
              valueStyle={{ color: "#3f8600" }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("aiDispatch.estimatedRevenue")}: ${plan.estimatedRevenue}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered className="ai-kpi-card">
            <Statistic
              title={t("aiDispatch.aiScore")}
              value={plan.aiConfidenceScore ?? undefined}
              suffix="/ 100"
              valueStyle={{ color: "#1890ff" }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Confidence & Feasibility
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered className="ai-kpi-card">
            <Statistic
              title={t("aiDispatch.hosCompliance")}
              value={t("aiDispatch.compliant")}
              valueStyle={{ color: "#52c41a", fontSize: 20 }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("aiDispatch.remainingHos")}: {plan.hosRemainingHours}h
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* 4. AI Reasoning & Analysis */}
      <Card
        size="small"
        bordered
        className="ai-plan-card"
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <span>{t("aiDispatch.aiReasoning")}</span>
          </Space>
        }
      >
        <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-line", wordBreak: "break-word" }}>
          {plan.aiReasoning}
        </Typography.Paragraph>
      </Card>

      {/* 5. Assigned Vehicle & Driver */}
      <Card
        size="small"
        bordered
        className="ai-plan-card"
        title={t("aiDispatch.assignedVehicleDriver")}
      >
        <Descriptions
          size="small"
          bordered
          column={{ xs: 1, sm: 2, md: 4 }}
          items={[
            {
              key: "truck",
              label: t("aiDispatch.truck"),
              children: (
                <span style={{ wordBreak: "break-word" }}>
                  {plan.truckNumber} ({plan.truckId.slice(0, 8)})
                </span>
              ),
            },
            {
              key: "driver",
              label: t("aiDispatch.driver"),
              children: (
                <span style={{ wordBreak: "break-word" }}>
                  {plan.driverName} (HOS: {plan.hosRemainingHours}h)
                </span>
              ),
            },
            {
              key: "load",
              label: t("aiDispatch.loadId"),
              children: (
                <span style={{ wordBreak: "break-word" }}>
                  {plan.loadNumber} ({plan.loadId.slice(0, 8)})
                </span>
              ),
            },
            {
              key: "duration",
              label: t("aiDispatch.departure"),
              children: `${plan.estimatedDurationHours} hours`,
            },
          ]}
        />
      </Card>

      {/* 6. Route & Movement Stops Timeline */}
      <Card
        size="small"
        bordered
        className="ai-plan-card"
        title={
          <Space>
            <CompassOutlined style={{ color: "#52c41a" }} />
            <span>{t("aiDispatch.routeTimeline")}</span>
          </Space>
        }
      >
        <Timeline
          className="ai-plan-timeline"
          items={plan.stops.map((stop) => ({
            color:
              stop.type === "pickup"
                ? "blue"
                : stop.type === "delivery"
                ? "purple"
                : stop.type === "rest_break"
                ? "orange"
                : "green",
            children: (
              <Card
                size="small"
                className="ai-plan-stop-card"
                data-testid={`plan-stop-${stop.order}`}
              >
                <div className="ai-plan-stop-card__header">
                  <div className="ai-plan-stop-card__title-group">
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      #{stop.order}
                    </Typography.Text>
                    {getStopTypeTag(stop.type, t(`aiDispatch.stopType.${stop.type}`))}
                    <Typography.Text strong className="ai-plan-stop-card__name">
                      {stop.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="ai-plan-stop-card__address">
                      📍 {stop.address}, {stop.city}
                    </Typography.Text>
                  </div>
                  <Tag color="cyan" className="ai-plan-stop-card__distance">
                    {t("aiDispatch.distance")}: {stop.distanceFromLastStopMiles} mi
                  </Tag>
                </div>

                <div className="ai-plan-stop-card__meta">
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.eta")}:</Typography.Text>{" "}
                    <span>{formatDateTime(stop.plannedArrival, { locale: i18n.language })}</span>
                  </div>
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.departure")}:</Typography.Text>{" "}
                    <span>{formatDateTime(stop.plannedDeparture, { locale: i18n.language })}</span>
                  </div>
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.dwellTime")}:</Typography.Text>{" "}
                    <span>{stop.dwellTimeMinutes} phút</span>
                  </div>
                </div>

                {stop.instructions && (
                  <div className="ai-plan-stop-card__instructions">
                    ℹ️ {stop.instructions}
                  </div>
                )}
              </Card>
            ),
          }))}
        />
      </Card>

      {/* Approve Modal */}
      <Modal
        open={approveModalVisible}
        title={t("aiDispatch.approveConfirmTitle")}
        okText={t("aiDispatch.approvePlan")}
        cancelText={t("actions.cancel")}
        confirmLoading={actions.pending}
        onOk={handleApprove}
        onCancel={() => {
          if (!actions.pending) setApproveModalVisible(false);
        }}
        cancelButtonProps={{ disabled: actions.pending }}
        closable={!actions.pending}
        keyboard={!actions.pending}
        width="min(calc(100vw - 32px), 520px)"
        centered
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {actions.error && <Alert type="error" showIcon message={actions.error.message} />}
          <Typography.Paragraph>
            {t("aiDispatch.approveConfirmMessage")}
          </Typography.Paragraph>
          <Descriptions
            size="small"
            bordered
            column={1}
            items={[
              { key: "truck", label: t("aiDispatch.truck"), children: plan.truckNumber },
              { key: "driver", label: t("aiDispatch.driver"), children: plan.driverName },
              { key: "distance", label: t("aiDispatch.totalDistance"), children: `${plan.totalDistanceMiles} miles` },
            ]}
          />
          <Form.Item label={t("aiDispatch.approveNote")}>
            <Input.TextArea
              rows={2}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder={t("aiDispatch.approveNotePlaceholder")}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Space>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectModalVisible}
        title={t("aiDispatch.rejectTitle")}
        okText={t("aiDispatch.rejectPlan")}
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
        cancelText={t("actions.cancel")}
        confirmLoading={actions.pending}
        onOk={handleReject}
        onCancel={() => {
          if (!actions.pending) setRejectModalVisible(false);
        }}
        cancelButtonProps={{ disabled: actions.pending }}
        closable={!actions.pending}
        keyboard={!actions.pending}
        width="min(calc(100vw - 32px), 520px)"
        centered
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {actions.error && <Alert type="error" showIcon message={actions.error.message} />}
          <Form.Item
            label={t("aiDispatch.rejectReason")}
            required
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("aiDispatch.rejectReasonPlaceholder")}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Space>
      </Modal>
    </Space>
  );
}
