import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AiGap } from "@/api/ai/ai.types";
import { getFieldMapping } from "@/api/ai/fieldKeyMapping";
import { formatDateTime } from "@/formatters/dateTime";
import { routes } from "@/constants/routes";
import { CORE_VERSIONED_WRITES_RUNTIME_VERIFIED } from "@/components/resources/resourceCapabilities";
import { useLoadAiGaps } from "@/hooks/ai/useLoadAiGaps";

const { Text, Paragraph, Title } = Typography;

export interface LoadAiGapsSectionProps {
  loadId: string;
  onNavigateToField?: (fieldKey: string) => void;
}

export const LoadAiGapsSection = ({
  loadId,
  onNavigateToField,
}: LoadAiGapsSectionProps) => {
  const navigate = useNavigate();
  const {
    blockingGaps,
    warningGaps,
    aiState,
    nextRunAt,
    capabilities,
    isLoading,
    isError,
    error,
    dismissGap,
    isDismissing,
    rerunAi,
    isRerunning,
    retryAfterSeconds,
  } = useLoadAiGaps({ loadId });

  // State cho Modal bỏ qua gap
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [targetGap, setTargetGap] = useState<AiGap | null>(null);
  const [dismissForm] = Form.useForm<{ reason: string }>();
  const dismissReason = Form.useWatch("reason", dismissForm);
  const isDismissReasonValid = Boolean(dismissReason && dismissReason.trim().length >= 3);

  const handleOpenDismiss = (gap: AiGap) => {
    setTargetGap(gap);
    dismissForm.resetFields();
    setDismissModalOpen(true);
  };

  const handleConfirmDismiss = async () => {
    try {
      const values = await dismissForm.validateFields();
      if (!targetGap) return;
      await dismissGap({ gapId: targetGap.id, reason: values.reason });
      setDismissModalOpen(false);
      setTargetGap(null);
    } catch {
      // Form validation error
    }
  };

  // Xử lý cuộn và focus trường form
  const handleFillInformation = (gap: AiGap) => {
    const key = gap.fieldName || gap.fieldKey || "";
    const mapping = getFieldMapping(key);
    if (!mapping) return;

    if (onNavigateToField) {
      onNavigateToField(key);
      return;
    }

    // Kiểm tra xem phần tử form có trên trang hiện tại không
    const targetElement =
      document.getElementById(mapping.formField) ||
      document.querySelector(`[name="${mapping.formField}"]`) ||
      (mapping.sectionId ? document.getElementById(mapping.sectionId) : null);

    if (targetElement) {
      targetElement.scrollIntoView({ block: "center" });
      if ("focus" in targetElement && typeof (targetElement as HTMLElement).focus === "function") {
        (targetElement as HTMLElement).focus();
      }
    } else {
      if (!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED) return;

      // Chuyển hướng tới trang chỉnh sửa đơn hàng với tham số mà editor đọc.
      navigate(
        `${routes.resources.loads.edit.replace(":id", encodeURIComponent(loadId))}?focusField=${encodeURIComponent(mapping.formField)}`,
      );
    }
  };

  if (isLoading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" align="center" style={{ width: "100%", padding: 24 }}>
          <Spin size="large" />
          <Text type="secondary">Đang tải phân tích thông tin thiếu từ AI...</Text>
        </Space>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Không thể tải dữ liệu câu hỏi AI"
        description={(error as Error)?.message || "Vui lòng thử lại sau."}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div id="ai-gaps-section" data-testid="load-ai-gaps-section" style={{ marginBottom: 24 }}>
      {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && (
        <Alert
          type="info"
          showIcon
          message="Màn chỉnh sửa Load chưa khả dụng trong runtime hiện tại."
          style={{ marginBottom: 16 }}
        />
      )}
      {/* Banner trạng thái xử lý AI */}
      {(aiState === "debouncing" || aiState === "running") && (
        <Alert
          message={
            <Space>
              <Spin size="small" />
              <Text strong>
                {aiState === "debouncing"
                  ? "AI đang chờ đồng bộ dữ liệu sau chỉnh sửa (debounce 30-60 giây)..."
                  : "AI đang quét và phân tích thông tin đơn hàng..."}
              </Text>
              {nextRunAt && (
                <Text type="secondary">
                  (Dự kiến phân tích lại lúc: {formatDateTime(nextRunAt)})
                </Text>
              )}
            </Space>
          }
          type="warning"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Header khu vực AI Hỏi */}
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              🧠 AI Hỏi & Kiểm Tra Thông Tin (Data Gaps)
            </Title>
            <Badge
              count={blockingGaps.length}
              overflowCount={99}
              style={{ backgroundColor: blockingGaps.length > 0 ? "#ff4d4f" : "#52c41a" }}
              title="Số thông tin chặn"
            />
            {warningGaps.length > 0 && (
              <Badge
                count={warningGaps.length}
                overflowCount={99}
                style={{ backgroundColor: "#faad14" }}
                title="Số cảnh báo"
              />
            )}
          </Space>
        }
        extra={
          capabilities?.canRerun !== false && (
            <Tooltip
              title={
                retryAfterSeconds
                  ? `Vui lòng chờ ${retryAfterSeconds}s trước khi yêu cầu AI chạy lại`
                  : "Yêu cầu AI phân tích lại đơn hàng ngay lập tức"
              }
            >
              <Button
                icon={<ReloadOutlined spin={isRerunning} />}
                onClick={() => void rerunAi()}
                loading={isRerunning}
                disabled={Boolean(retryAfterSeconds) || isRerunning}
                data-testid="ai-rerun-button"
              >
                {retryAfterSeconds ? `Thử lại sau ${retryAfterSeconds}s` : "Chạy lại AI"}
              </Button>
            </Tooltip>
          )
        }
        style={{ marginBottom: 16 }}
      >
        {blockingGaps.length === 0 && warningGaps.length === 0 ? (
          <Empty
            description="Tuyệt vời! Đơn hàng đã đầy đủ thông tin hợp lệ, không có mâu thuẫn cần giải quyết."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {/* Nhóm 1: Thông tin chặn điều phối */}
            <Col xs={24} lg={12}>
              <Card
                type="inner"
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                    <Text strong style={{ color: "#cf1322" }}>
                      Thông tin chặn điều phối ({blockingGaps.length})
                    </Text>
                  </Space>
                }
                styles={{ body: { padding: 12 } }}
              >
                {blockingGaps.length === 0 ? (
                  <Empty
                    description="Không có thông tin chặn"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    {blockingGaps.map((gap) => {
                      const key = gap.fieldName || gap.fieldKey || "";
                      const mapping = getFieldMapping(key);
                      const label = gap.fieldLabel || gap.fieldName || gap.fieldKey;
                      const questionText = gap.questionNatural || gap.questionTemplate || gap.question;
                      const isNeedsHuman = String(gap.status).toUpperCase() === "NEEDS_HUMAN";
                      return (
                        <Card
                          key={gap.id}
                          size="small"
                          style={{
                            borderLeft: "4px solid #ff4d4f",
                            backgroundColor: "#fff2f0",
                          }}
                          data-testid={`gap-item-${gap.id}`}
                        >
                          <Space direction="vertical" style={{ width: "100%" }} size={4}>
                            <Flex justify="space-between" align="center">
                              <Text strong style={{ fontSize: 15 }}>
                                {label}
                              </Text>
                              <Space>
                                {isNeedsHuman && (
                                  <Tag color="magenta" icon={<UserOutlined />}>
                                    Cần người xử lý
                                  </Tag>
                                )}
                                <Tag color="error">Chặn</Tag>
                              </Space>
                            </Flex>

                            {/* Render text thuần để chống XSS */}
                            <Paragraph
                              style={{
                                margin: "6px 0",
                                color: "#262626",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {questionText}
                            </Paragraph>

                            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                              <Space size="middle" style={{ fontSize: 12, color: "#8c8c8c" }}>
                                <span>
                                  Đã hỏi: {gap.askCount}/{gap.maxAsks} lần
                                </span>
                                <span>
                                  <ClockCircleOutlined /> {formatDateTime(gap.lastAskedAt || gap.createdAt || "")}
                                </span>
                                {gap.assignedTo && (
                                  <span>
                                    <UserOutlined /> {gap.assignedTo}
                                  </span>
                                )}
                              </Space>

                              {/* Nút Điền thông tin chỉ hiện khi có file mapping */}
                              {mapping && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleFillInformation(gap)}
                                  disabled={!onNavigateToField && !CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                                  title={!onNavigateToField && !CORE_VERSIONED_WRITES_RUNTIME_VERIFIED ? "Màn chỉnh sửa Load chưa khả dụng trong runtime hiện tại." : undefined}
                                  data-testid={`fill-gap-btn-${gap.id}`}
                                >
                                  Điền thông tin
                                </Button>
                              )}
                            </Flex>
                          </Space>
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </Card>
            </Col>

            {/* Nhóm 2: Cảnh báo & khuyến nghị */}
            <Col xs={24} lg={12}>
              <Card
                type="inner"
                title={
                  <Space>
                    <MinusCircleOutlined style={{ color: "#faad14" }} />
                    <Text strong style={{ color: "#d48806" }}>
                      Cảnh báo & Khuyến nghị ({warningGaps.length})
                    </Text>
                  </Space>
                }
                styles={{ body: { padding: 12 } }}
              >
                {warningGaps.length === 0 ? (
                  <Empty
                    description="Không có cảnh báo"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    {warningGaps.map((gap) => {
                      const key = gap.fieldName || gap.fieldKey || "";
                      const mapping = getFieldMapping(key);
                      const label = gap.fieldLabel || gap.fieldName || gap.fieldKey;
                      const questionText = gap.questionNatural || gap.questionTemplate || gap.question;
                      const isNeedsHuman = String(gap.status).toUpperCase() === "NEEDS_HUMAN";
                      return (
                        <Card
                          key={gap.id}
                          size="small"
                          style={{
                            borderLeft: "4px solid #faad14",
                            backgroundColor: "#fffbe6",
                          }}
                          data-testid={`gap-item-${gap.id}`}
                        >
                          <Space direction="vertical" style={{ width: "100%" }} size={4}>
                            <Flex justify="space-between" align="center">
                              <Text strong style={{ fontSize: 15 }}>
                                {label}
                              </Text>
                              <Space>
                                {isNeedsHuman && (
                                  <Tag color="magenta" icon={<UserOutlined />}>
                                    Cần người xử lý
                                  </Tag>
                                )}
                                <Tag color="warning">Cảnh báo</Tag>
                              </Space>
                            </Flex>

                            {/* Render text thuần chống XSS */}
                            <Paragraph
                              style={{
                                margin: "6px 0",
                                color: "#262626",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {questionText}
                            </Paragraph>

                            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                              <Space size="middle" style={{ fontSize: 12, color: "#8c8c8c" }}>
                                <span>
                                  Đã hỏi: {gap.askCount}/{gap.maxAsks} lần
                                </span>
                                <span>
                                  <ClockCircleOutlined /> {formatDateTime(gap.lastAskedAt)}
                                </span>
                                {gap.assignedTo && (
                                  <span>
                                    <UserOutlined /> {gap.assignedTo}
                                  </span>
                                )}
                              </Space>

                              <Space>
                                <Button
                                  size="small"
                                  onClick={() => handleOpenDismiss(gap)}
                                  data-testid={`dismiss-gap-btn-${gap.id}`}
                                >
                                  Bỏ qua
                                </Button>
                                {mapping && (
                                  <Button
                                    type="default"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleFillInformation(gap)}
                                    data-testid={`fill-gap-btn-${gap.id}`}
                                  >
                                    Điền thông tin
                                  </Button>
                                )}
                              </Space>
                            </Flex>
                          </Space>
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      {/* Modal bỏ qua Gap (chỉ cho warning, lý do bắt buộc) */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>Bỏ qua cảnh báo thông tin</span>
          </Space>
        }
        open={dismissModalOpen}
        onOk={() => void handleConfirmDismiss()}
        onCancel={() => {
          setDismissModalOpen(false);
          setTargetGap(null);
        }}
        okText="Xác nhận bỏ qua"
        cancelText="Hủy"
        confirmLoading={isDismissing}
        okButtonProps={{ disabled: !isDismissReasonValid || isDismissing }}
        destroyOnClose
      >
        <Paragraph>
          Bạn có chắc chắn muốn bỏ qua câu hỏi về:{" "}
          <Text strong>{targetGap?.fieldLabel}</Text>?
        </Paragraph>
        <Form form={dismissForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do bỏ qua (bắt buộc)"
            rules={[
              { required: true, message: "Vui lòng nhập lý do bỏ qua cảnh báo này" },
              { min: 3, message: "Lý do phải có ít nhất 3 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Đã thỏa thuận riêng với khách hàng bằng văn bản..."
              maxLength={300}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
