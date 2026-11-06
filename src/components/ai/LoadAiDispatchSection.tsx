import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ForkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  TruckOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLayoutEffect, useState } from "react";
import type { AiDispatchCandidate } from "@/api/ai/ai.types";
import { formatDateTime } from "@/formatters/dateTime";
import { useLoadAiDispatch } from "@/hooks/ai/useLoadAiDispatch";

const { Text, Paragraph, Title } = Typography;

export interface LoadAiDispatchSectionProps {
  loadId: string;
}

export const LoadAiDispatchSection = ({ loadId }: LoadAiDispatchSectionProps) => {
  const { message } = App.useApp();
  const {
    dispatchState,
    rankingSource,
    expiresAt,
    isExpired,
    suggestions,
    capabilities,
    feasibilityError,
    clearFeasibilityError,
    isLoading,
    isError,
    error,
    refetch,
    runDispatch,
    isRunning,
    latestRunSummary,
    suggestedTruckNumber,
    approveSuggestion,
    isApproving,
    rejectSuggestion,
    isRejecting,
  } = useLoadAiDispatch({ loadId });

  // Dialog Approve State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<AiDispatchCandidate | null>(null);

  // Dialog Reject State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectForm] = Form.useForm<{ reason: string }>();
  useLayoutEffect(() => {
    if (rejectModalOpen) rejectForm.resetFields();
  }, [rejectModalOpen, rejectForm]);

  const handleRunDispatch = async () => {
    try {
      const result = await runDispatch();
      const summary = (result as { summary?: string } | undefined)?.summary;
      if (summary) {
        message.info(summary);
      } else {
        message.success("Đã hoàn tất yêu cầu điều phối AI.");
      }
    } catch (err) {
      const detail = (err as { message?: string })?.message;
      message.error(detail || "Không thể khởi chạy AI điều phối.");
    }
  };

  const handleOpenApprove = (candidate: AiDispatchCandidate) => {
    setSelectedCandidate(candidate);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedCandidate) return;
    try {
      await approveSuggestion(selectedCandidate.id);
      setApproveModalOpen(false);
      setSelectedCandidate(null);
    } catch {
      // Đã được xử lý trong hook useLoadAiDispatch (409, hết hạn...)
    }
  };

  const handleOpenReject = (candidate: AiDispatchCandidate) => {
    setSelectedCandidate(candidate);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedCandidate) return;
    try {
      const values = await rejectForm.validateFields();
      await rejectSuggestion({
        suggestionId: selectedCandidate.id,
        reason: values.reason,
      });
      setRejectModalOpen(false);
      setSelectedCandidate(null);
    } catch {
      // Form validation error
    }
  };

  if (dispatchState === "disabled") {
    return null;
  }

  if (isLoading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" align="center" style={{ width: "100%", padding: 24 }}>
          <Spin size="large" />
          <Text type="secondary">Đang tải gợi ý điều phối xe và tài xế từ AI...</Text>
        </Space>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Không thể tải gợi ý điều phối AI"
        description={(error as Error)?.message || "Đã xảy ra lỗi kết nối."}
        type="error"
        showIcon
        action={
          <Button size="small" icon={<ReloadOutlined />} onClick={() => void refetch()}>
            Thử lại
          </Button>
        }
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div id="ai-dispatch-section" data-testid="load-ai-dispatch-section" style={{ marginBottom: 24 }}>
      {/* Banner lỗi khả thi 409 FEASIBILITY_FAILED */}
      {feasibilityError && (
        <Alert
          message={
            <Space>
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              <Text strong style={{ color: "#cf1322" }}>
                {feasibilityError.message}
              </Text>
            </Space>
          }
          description={
            <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
              <Text>Lý do từ hệ thống kiểm chứng vận hành thực tế:</Text>
              <ul>
                {feasibilityError.reasons.map((r, idx) => (
                  <li key={idx}>
                    <Text type="secondary">{r}</Text>
                  </li>
                ))}
              </ul>
            </Space>
          }
          type="error"
          closable
          onClose={clearFeasibilityError}
          action={
            <Button size="small" type="primary" danger onClick={() => void refetch()}>
              Làm mới gợi ý
            </Button>
          }
          style={{ marginBottom: 16 }}
          data-testid="feasibility-failed-alert"
        />
      )}

      {/* Card chính của Khu vực AI Điều phối */}
      <Card
        title={
          <Space wrap>
            <Title level={5} style={{ margin: 0 }}>
              🚛 AI Điều Phối & Gợi Ý Ghép Xe (Dispatch Suggestions)
            </Title>
            <Tag color="purple" icon={<SafetyCertificateOutlined />}>
              Chế độ: Bán tự động (Human-in-the-Loop)
            </Tag>
            {rankingSource === "llm" ? (
              <Tag color="blue" icon={<ThunderboltOutlined />}>
                AI xếp hạng
              </Tag>
            ) : rankingSource === "optimization_fallback" ? (
              <Tag color="geekblue" icon={<ForkOutlined />}>
                Xếp hạng theo điểm tối ưu
              </Tag>
            ) : null}
          </Space>
        }
        extra={
          expiresAt && (
            <Space>
              <ClockCircleOutlined style={{ color: isExpired ? "#ff4d4f" : "#faad14" }} />
              <Text type={isExpired ? "danger" : "secondary"}>
                {isExpired
                  ? "Gợi ý đã hết hạn"
                  : `Hết hạn lúc: ${formatDateTime(expiresAt)}`}
              </Text>
              {isExpired && (
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={isRunning}
                  onClick={() => void handleRunDispatch()}
                >
                  Tính lại
                </Button>
              )}
            </Space>
          )
        }
        style={{ marginBottom: 16 }}
      >
        {/* Render theo từng dispatchState */}
        {dispatchState === "not_started" && (
          <Empty
            description="Chưa khởi chạy gợi ý điều phối cho đơn hàng này."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={isRunning}
              onClick={() => void handleRunDispatch()}
              data-testid="ai-run-dispatch-btn"
            >
              Yêu cầu AI phân tích gợi ý
            </Button>
          </Empty>
        )}

        {(dispatchState === "pending" || isRunning) && (
          <Space direction="vertical" align="center" style={{ width: "100%", padding: 32 }}>
            <Spin size="large" />
            <Text strong>Đang gửi yêu cầu điều phối…</Text>
            <Text type="secondary">
              Đang kiểm tra dữ liệu khả dụng…
            </Text>
          </Space>
        )}

        {dispatchState === "evidence_unavailable" && (
          <Alert
            message="Lượt chạy đã kết thúc nhưng chưa đủ bằng chứng điều phối"
            description={latestRunSummary || "Chưa có đủ dữ liệu đã xác thực để tạo đề xuất điều phối."}
            type="warning"
            showIcon
            action={
              capabilities.canRerun && (
                <Button size="small" loading={isRunning} onClick={() => void handleRunDispatch()}>
                  Chạy lại
                </Button>
              )
            }
            data-testid="ai-evidence-unavailable-alert"
          />
        )}

        {dispatchState === "assigned" && (
          <Alert
            message="Đơn hàng đã được gán"
            description={suggestedTruckNumber
              ? `Xe đang được gán: ${suggestedTruckNumber}.`
              : "Đơn hàng đã có xe được gán."}
            type="success"
            showIcon
            data-testid="ai-dispatch-assigned-alert"
          />
        )}

        {dispatchState === "blocked_by_gap" && (
          <Alert
            message="Chưa thể đề xuất điều phối vì Load thiếu dữ liệu bắt buộc"
            description="Bổ sung thông tin cần thiết cho Load rồi chạy lại điều phối."
            type="warning"
            showIcon
          />
        )}

        {dispatchState === "expired" && (
          <Alert
            message="Các gợi ý điều phối trước đây đã hết hạn hiệu lực"
            description="Hiện trạng đội xe, vị trí thực tế và giờ lái HOS của tài xế đã thay đổi. Vui lòng bấm Tính lại để AI lập danh sách mới nhất."
            type="warning"
            showIcon
            action={
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                loading={isRunning}
                onClick={() => void handleRunDispatch()}
              >
                Tính lại gợi ý mới
              </Button>
            }
          />
        )}

        {dispatchState === "failed" && (
          <Alert
            message="Không thể tạo gợi ý điều phối xe"
            description="Hệ thống tối ưu hoá gặp sự cố hoặc không tìm thấy xe tải phù hợp tiêu chí hàng hóa."
            type="error"
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={isRunning}
                onClick={() => void handleRunDispatch()}
              >
                Thử lại
              </Button>
            }
          />
        )}

        {dispatchState === "ready" && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {suggestions.length === 0 ? (
              <Empty
                description={
                  suggestedTruckNumber
                    ? `Đơn hàng đã được gán xe ${suggestedTruckNumber}. Không còn quyết định AI nào chờ duyệt.`
                    : "Chưa có đề xuất AI đang chờ duyệt. Hệ thống chỉ đưa ra gợi ý khi có đủ dữ liệu tuyến đường, HOS, ETA và chi phí đã xác thực."
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              suggestions.map((candidate) => {
                const statusUpper = String(candidate.status || "").toUpperCase();
                const isExecuted =
                  statusUpper === "EXECUTED" || statusUpper === "APPROVED";
                const isRejected = statusUpper === "REJECTED";
                const isPending =
                  statusUpper === "PENDING" || statusUpper === "SUGGESTED";

                const truckNumber = candidate.truckNumber || candidate.truckPlate || "Xe chưa gán";
                const displayScore = candidate.score == null
                  ? null
                  : candidate.score <= 1.0 && candidate.score > 0
                    ? Math.round(candidate.score * 100)
                    : candidate.score;

                const confidenceDisplay =
                  candidate.confidence ??
                  (candidate.confidenceScore != null
                    ? `${candidate.confidenceScore}%`
                    : "Cần xác minh");

                // Backend gửi metrics thô (tỷ suất, số dặm, số giờ), không gửi
                // điểm tiện ích đã chuẩn hoá. Không suy diễn điểm khi thiếu dữ
                // liệu — hiển thị "—" thay vì một con số bịa.
                const marginScore = candidate.utilities?.margin?.score ?? null;
                const marginDisplay =
                  candidate.utilities?.margin?.displayValue ??
                  (candidate.metrics?.expectedMarginRatio != null
                    ? `Tỷ suất: ${Math.round(candidate.metrics.expectedMarginRatio * 100)}%`
                    : undefined);

                const onTimeScore = candidate.utilities?.onTime?.score ?? null;
                const onTimeDisplay =
                  candidate.utilities?.onTime?.displayValue ??
                  (candidate.metrics?.onTimeProbability != null
                    ? `Xác suất: ${Math.round(candidate.metrics.onTimeProbability * 100)}%`
                    : undefined);

                const deadheadScore = candidate.utilities?.deadhead?.score ?? null;
                const deadheadDisplay =
                  candidate.utilities?.deadhead?.displayValue ??
                  (candidate.metrics?.deadheadMiles != null
                    ? `Chạy rỗng: ${candidate.metrics.deadheadMiles} dặm`
                    : undefined);

                const hosScore = candidate.utilities?.hos?.score ?? null;
                const hosDisplay =
                  candidate.utilities?.hos?.displayValue ??
                  (candidate.metrics?.hosRemainingHours != null
                    ? `Còn lại: ${candidate.metrics.hosRemainingHours}h lái xe`
                    : undefined);

                return (
                  <Card
                    key={candidate.id}
                    size="small"
                    style={{
                      border:
                        candidate.rank === 1
                          ? "2px solid #1677ff"
                          : "1px solid #d9d9d9",
                      backgroundColor: isExecuted ? "#f6ffed" : isRejected ? "#f5f5f5" : "#fff",
                      opacity: isRejected ? 0.75 : 1,
                    }}
                    data-testid={`dispatch-candidate-${candidate.id}`}
                  >
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                      {/* Tiêu đề ứng viên: Rank, Xe, Tài xế, Điểm */}
                      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Space size="middle" align="center">
                          <Tag
                            color={candidate.rank == null ? "default" : candidate.rank === 1 ? "gold" : "blue"}
                            style={{ fontSize: 14, padding: "2px 8px" }}
                          >
                            {candidate.rank == null ? "Chưa xếp hạng" : `Hạng #${candidate.rank}`}
                          </Tag>
                          <Space>
                            <TruckOutlined style={{ fontSize: 16 }} />
                            <Text strong style={{ fontSize: 15 }}>
                              {truckNumber}
                            </Text>
                          </Space>
                          <Space>
                            <UserOutlined />
                            <Text>{candidate.driverName}</Text>
                          </Space>
                        </Space>

                        <Space size="middle" align="center">
                          <Tooltip title="Độ tin cậy của thuật toán AI">
                            <Tag color="cyan">Tin cậy: {confidenceDisplay}</Tag>
                          </Tooltip>

                          <Tooltip title="Điểm tối ưu tổng hợp (0 - 100)">
                            <Tag
                              color={
                                displayScore == null
                                  ? undefined
                                  : displayScore >= 90
                                    ? "green"
                                    : displayScore >= 80
                                      ? "blue"
                                      : "warning"
                              }
                              style={{ fontSize: 14, fontWeight: "bold" }}
                            >
                              {displayScore == null
                                ? "Chưa đủ dữ liệu đánh giá"
                                : `Điểm: ${displayScore}/100`}
                            </Tag>
                          </Tooltip>

                          {isExecuted && <Tag color="success">Đã gán chuyến</Tag>}
                          {isRejected && <Tag color="default">Đã từ chối</Tag>}
                        </Space>
                      </Flex>

                      {/* Phân tích 4 tiện ích (Breakdown 4 Utilities) */}
                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          padding: "10px 14px",
                          borderRadius: 6,
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Text strong style={{ fontSize: 13, marginBottom: 8, display: "block" }}>
                          📊 Phân bổ điểm tiện ích (Utility Breakdown):
                        </Text>
                        <Row gutter={[16, 8]}>
                          {/* 1. Tiện ích Lợi nhuận (Margin) */}
                          <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: "100%" }} size={2}>
                              <Flex justify="space-between">
                                <Text style={{ fontSize: 12 }}>1. Biên lợi nhuận (Margin)</Text>
                                <Text strong style={{ fontSize: 12 }}>
                                  {marginScore != null ? `${marginScore}đ` : "—"}
                                </Text>
                              </Flex>
                              {marginScore != null && (
                                <Progress
                                  percent={marginScore}
                                  size="small"
                                  strokeColor="#52c41a"
                                  showInfo={false}
                                />
                              )}
                              {marginDisplay && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {marginDisplay}
                                </Text>
                              )}
                            </Space>
                          </Col>

                          {/* 2. Tiện ích Đúng giờ (On-time) */}
                          <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: "100%" }} size={2}>
                              <Flex justify="space-between">
                                <Text style={{ fontSize: 12 }}>2. Đúng giờ (On-time)</Text>
                                <Text strong style={{ fontSize: 12 }}>
                                  {onTimeScore != null ? `${onTimeScore}đ` : "—"}
                                </Text>
                              </Flex>
                              {onTimeScore != null && (
                                <Progress
                                  percent={onTimeScore}
                                  size="small"
                                  strokeColor="#1677ff"
                                  showInfo={false}
                                />
                              )}
                              {onTimeDisplay && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {onTimeDisplay}
                                </Text>
                              )}
                            </Space>
                          </Col>

                          {/* 3. Tiện ích Chạy rỗng (Deadhead) */}
                          <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: "100%" }} size={2}>
                              <Flex justify="space-between">
                                <Text style={{ fontSize: 12 }}>3. Chạy rỗng (Deadhead)</Text>
                                <Text strong style={{ fontSize: 12 }}>
                                  {deadheadScore != null ? `${deadheadScore}đ` : "—"}
                                </Text>
                              </Flex>
                              {deadheadScore != null && (
                                <Progress
                                  percent={deadheadScore}
                                  size="small"
                                  strokeColor="#faad14"
                                  showInfo={false}
                                />
                              )}
                              {deadheadDisplay && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {deadheadDisplay}
                                </Text>
                              )}
                            </Space>
                          </Col>

                          {/* 4. Tiện ích Giờ lái an toàn HOS */}
                          <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: "100%" }} size={2}>
                              <Flex justify="space-between">
                                <Text style={{ fontSize: 12 }}>4. Luật an toàn (HOS)</Text>
                                <Text strong style={{ fontSize: 12 }}>
                                  {hosScore != null ? `${hosScore}đ` : "—"}
                                </Text>
                              </Flex>
                              {hosScore != null && (
                                <Progress
                                  percent={hosScore}
                                  size="small"
                                  strokeColor="#722ed1"
                                  showInfo={false}
                                />
                              )}
                              {hosDisplay && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {hosDisplay}
                                </Text>
                              )}
                            </Space>
                          </Col>
                        </Row>
                      </div>

                      {/* Lý do AI xếp hạng (Render text thuần để bảo mật) */}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          💡 Lý do AI đề xuất:
                        </Text>
                        <Paragraph style={{ margin: "4px 0 0", color: "#333", whiteSpace: "pre-wrap" }}>
                          {candidate.reasoning}
                        </Paragraph>
                      </div>

                      {/* Nút hành động Approve / Reject */}
                      {isPending && (
                        <Flex justify="flex-end" align="center" gap={12}>
                          {capabilities?.canReject !== false && (
                            <Button
                              danger
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleOpenReject(candidate)}
                              disabled={isApproving || isRejecting}
                              data-testid={`reject-candidate-btn-${candidate.id}`}
                            >
                              Từ chối (Reject)
                            </Button>
                          )}

                          {capabilities?.canApprove !== false && (
                            <Tooltip
                              title={
                                isExpired
                                  ? "Gợi ý đã hết hạn, không thể phê duyệt"
                                  : "Phê duyệt sẽ gán xe và tạo chuyến hàng thực tế"
                              }
                            >
                              <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleOpenApprove(candidate)}
                                disabled={isExpired || isApproving || isRejecting}
                                loading={isApproving && selectedCandidate?.id === candidate.id}
                                data-testid={`approve-candidate-btn-${candidate.id}`}
                              >
                                Phê duyệt (Approve)
                              </Button>
                            </Tooltip>
                          )}
                        </Flex>
                      )}
                    </Space>
                  </Card>
                );
              })
            )}
          </Space>
        )}
      </Card>

      {/* Dialog Xác nhận Phê duyệt (Approve) */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            <span>Xác nhận phê duyệt điều phối</span>
          </Space>
        }
        open={approveModalOpen}
        onOk={() => void handleConfirmApprove()}
        onCancel={() => {
          setApproveModalOpen(false);
          setSelectedCandidate(null);
        }}
        okText="Xác nhận gán chuyến thật"
        cancelText="Hủy"
        confirmLoading={isApproving}
        okButtonProps={{ disabled: isApproving }}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Paragraph>
            Bạn có chắc chắn muốn phê duyệt phương án điều phối này cho đơn hàng #{loadId}?
          </Paragraph>
          <div style={{ backgroundColor: "#f6ffed", padding: 12, borderRadius: 6, border: "1px solid #b7eb8f" }}>
            <p style={{ margin: 0 }}>
              <strong>Xe tải chỉ định:</strong> {selectedCandidate?.truckNumber}
            </p>
            <p style={{ margin: "4px 0 0" }}>
              <strong>Tài xế nhận lệnh:</strong> {selectedCandidate?.driverName}
            </p>
          </div>
          <Alert
            message="Lưu ý vận hành:"
            description="Hành động này sẽ tạo chuyến vận tải (Trip) chính thức trên hệ thống và gửi thông báo gán việc tới tài xế."
            type="warning"
            showIcon
          />
        </Space>
      </Modal>

      {/* Dialog Từ chối (Reject) */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>Từ chối phương án điều phối</span>
          </Space>
        }
        open={rejectModalOpen}
        onOk={() => void handleConfirmReject()}
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedCandidate(null);
        }}
        okText="Gửi từ chối"
        cancelText="Hủy"
        confirmLoading={isRejecting}
        okButtonProps={{ disabled: isRejecting }}
        destroyOnHidden
      >
        <Paragraph>
          Vui lòng nêu lý do từ chối gợi ý xe <Text strong>{selectedCandidate?.truckNumber}</Text> để hệ thống AI học hỏi và điều chỉnh trọng số tối ưu.
        </Paragraph>
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối (bắt buộc, 3 - 500 ký tự)"
            rules={[
              { required: true, message: "Vui lòng nhập lý do từ chối" },
              { min: 3, message: "Lý do phải có ít nhất 3 ký tự" },
              { max: 500, message: "Lý do không được vượt quá 500 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Ví dụ: Xe này đang cần ưu tiên cho đơn hàng lạnh quan trọng hơn vào buổi chiều..."
              maxLength={500}
              showCount
            />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};
