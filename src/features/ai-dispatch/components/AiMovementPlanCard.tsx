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
import type { AiMovementPlan, AiPlanStopType } from "@/types/ai-dispatch.types";
import type { AiDispatchActionsResult } from "../useAiDispatchActions";

interface Props {
  plan: AiMovementPlan | null;
  actions: AiDispatchActionsResult;
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

export function AiMovementPlanCard({ plan, actions }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  if (!plan) {
    return (
      <Card bordered>
        <Empty description={t("aiDispatch.noPlanYet")} />
      </Card>
    );
  }

  const isProposed = plan.status === "proposed";
  const isApproved = plan.status === "approved";
  const isRejected = plan.status === "rejected";

  const handleApprove = async () => {
    await actions.approvePlan(plan.id, approveNote.trim() || undefined);
    setApproveModalVisible(false);
    setApproveNote("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await actions.rejectPlan(plan.id, rejectReason.trim());
    setRejectModalVisible(false);
    setRejectReason("");
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%", maxWidth: "100%" }}>
      {/* 1. Header & Status Bar */}
      <Card
        size="small"
        bordered
        title={
          <Space align="center" wrap>
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
          <Space wrap>
            {isProposed && (
              <>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  disabled={actions.pending}
                >
                  {t("aiDispatch.rejectPlan")}
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                  loading={actions.pending}
                >
                  {t("aiDispatch.approvePlan")}
                </Button>
              </>
            )}
            {isApproved && (
              <Button
                type="primary"
                icon={<RightCircleOutlined />}
                onClick={() => navigate(routes.resources.trips.list)}
              >
                {t("aiDispatch.viewTrip")}
              </Button>
            )}
          </Space>
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
          <Card size="small" bordered>
            <Statistic
              title={t("aiDispatch.totalDistance")}
              value={plan.totalDistanceMiles}
              suffix="miles"
              precision={0}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("aiDispatch.deadheadReduction")}: -{plan.deadheadReductionPercent}%
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered>
            <Statistic
              title={t("aiDispatch.estimatedMargin")}
              value={plan.estimatedMargin}
              prefix="$"
              valueStyle={{ color: "#3f8600" }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("aiDispatch.estimatedRevenue")}: ${plan.estimatedRevenue}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered>
            <Statistic
              title={t("aiDispatch.aiScore")}
              value={plan.aiConfidenceScore}
              suffix="/ 100"
              valueStyle={{ color: "#1890ff" }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Confidence & Feasibility
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered>
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
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <span>{t("aiDispatch.aiReasoning")}</span>
          </Space>
        }
      >
        <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-line" }}>
          {plan.aiReasoning}
        </Typography.Paragraph>
      </Card>

      {/* 5. Assigned Vehicle & Driver */}
      <Card
        size="small"
        bordered
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
              children: `${plan.truckNumber} (${plan.truckId.slice(0, 8)})`,
            },
            {
              key: "driver",
              label: t("aiDispatch.driver"),
              children: `${plan.driverName} (HOS: ${plan.hosRemainingHours}h)`,
            },
            {
              key: "load",
              label: t("aiDispatch.loadId"),
              children: `${plan.loadNumber} (${plan.loadId.slice(0, 8)})`,
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
        title={
          <Space>
            <CompassOutlined style={{ color: "#52c41a" }} />
            <span>{t("aiDispatch.routeTimeline")}</span>
          </Space>
        }
      >
        <Timeline
          style={{ marginTop: 16 }}
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
                style={{ marginBottom: 12 }}
                data-testid={`plan-stop-${stop.order}`}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Space align="center" wrap>
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      #{stop.order}
                    </Typography.Text>
                    {getStopTypeTag(stop.type, t(`aiDispatch.stopType.${stop.type}`))}
                    <Typography.Text strong>{stop.name}</Typography.Text>
                    <Typography.Text type="secondary">
                      📍 {stop.address}, {stop.city}
                    </Typography.Text>
                  </Space>
                  <Tag color="cyan">
                    {t("aiDispatch.distance")}: {stop.distanceFromLastStopMiles} mi
                  </Tag>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 8,
                    fontSize: 12,
                    color: "#595959",
                    paddingTop: 6,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.eta")}:</Typography.Text>{" "}
                    {formatDateTime(stop.plannedArrival, { locale: i18n.language })}
                  </div>
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.departure")}:</Typography.Text>{" "}
                    {formatDateTime(stop.plannedDeparture, { locale: i18n.language })}
                  </div>
                  <div>
                    <Typography.Text type="secondary">{t("aiDispatch.dwellTime")}:</Typography.Text>{" "}
                    {stop.dwellTimeMinutes} phút
                  </div>
                </div>

                {stop.instructions && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#1890ff" }}>
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
        onCancel={() => setApproveModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
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
        onCancel={() => setRejectModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
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
            />
          </Form.Item>
        </Space>
      </Modal>
    </Space>
  );
}
