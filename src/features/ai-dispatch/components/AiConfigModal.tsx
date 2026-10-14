/**
 * Modal Popup Cấu hình mô hình AI và API Key cho từng nhà cung cấp.
 * Hỗ trợ OpenAI, Google Gemini, Anthropic Claude, DeepSeek và Custom/Local LLM.
 */
import {
  ApiOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  ReloadOutlined,
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_AI_SETTINGS,
  type AiProviderConfig,
  type AiProviderId,
  type AiSettings,
} from "@/types/aiConfig.types";
import {
  testAiConnection,
  useAiSettings,
} from "../hooks/aiConfigStorage";
import "../styles/ai-dispatch.scss";

export interface AiConfigModalProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_ORDER: AiProviderId[] = [
  "openai",
  "gemini",
  "claude",
  "deepseek",
  "custom",
];

export function AiConfigModal({ open, onClose }: AiConfigModalProps) {
  const { settings, updateSettings } = useAiSettings();

  return open ? (
    <AiConfigModalContent settings={settings} updateSettings={updateSettings} onClose={onClose} />
  ) : null;
}

function AiConfigModalContent({
  settings,
  updateSettings,
  onClose,
}: {
  settings: AiSettings;
  updateSettings: (settings: AiSettings) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draftSettings, setDraftSettings] = useState<AiSettings>(settings);
  const [activeTab, setActiveTab] = useState<string>(settings.activeProvider);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    providerId: string;
    success: boolean;
    message: string;
  } | null>(null);

  const handleProviderConfigChange = (
    providerId: AiProviderId,
    field: keyof AiProviderConfig,
    value: unknown
  ) => {
    setDraftSettings((prev) => {
      const currentProvider = prev.providers[providerId];
      return {
        ...prev,
        providers: {
          ...prev.providers,
          [providerId]: {
            ...currentProvider,
            [field]: value,
          },
        },
      };
    });
  };

  const handleSetActiveProvider = (providerId: AiProviderId) => {
    setDraftSettings((prev) => ({
      ...prev,
      activeProvider: providerId,
    }));
  };

  const handleTestConnection = async (providerId: AiProviderId) => {
    const config = draftSettings.providers[providerId];
    if (!config) return;

    setTestingProvider(providerId);
    setTestResult(null);

    try {
      const res = await testAiConnection(providerId, config);
      setTestResult({
        providerId,
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        message.success(res.message);
      } else {
        message.error(res.message);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t("aiDispatch.connectionFailed");
      setTestResult({
        providerId,
        success: false,
        message: errMsg,
      });
      message.error(errMsg);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = () => {
    updateSettings(draftSettings);
    message.success(t("aiDispatch.configSaved"));
    onClose();
  };

  const handleReset = () => {
    setDraftSettings(DEFAULT_AI_SETTINGS);
    message.info(t("aiDispatch.resetSuccess"));
  };

  const renderProviderForm = (providerId: AiProviderId) => {
    const config = draftSettings.providers[providerId];
    if (!config) return null;

    const isCurrentActive = draftSettings.activeProvider === providerId;
    const hasKey = config.apiKey.trim().length > 0;
    const isTesting = testingProvider === providerId;

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Banner trạng thái của provider */}
        <div
          className="ai-config-provider-banner"
          style={{
            background: isCurrentActive ? "#f6ffed" : "#fafafa",
            border: `1px solid ${isCurrentActive ? "#b7eb8f" : "#f0f0f0"}`,
          }}
        >
          <Space align="start">
            <RobotOutlined style={{ fontSize: 20, color: isCurrentActive ? "#52c41a" : "#8c8c8c", marginTop: 2 }} />
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {config.name}
              </Typography.Text>
              <div style={{ marginTop: 2, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {isCurrentActive ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    {t("aiDispatch.activeBadge")}
                  </Tag>
                ) : (
                  <Tag color="default">{t("aiDispatch.provider")}</Tag>
                )}
                {providerId !== "custom" && (
                  <Tag color={hasKey ? "blue" : "warning"}>
                    {hasKey ? t("aiDispatch.providerConfigured") : t("aiDispatch.providerNotConfigured")}
                  </Tag>
                )}
              </div>
            </div>
          </Space>

          <Button
            type={isCurrentActive ? "primary" : "default"}
            size="small"
            onClick={() => handleSetActiveProvider(providerId)}
            disabled={isCurrentActive}
            className="ai-config-provider-banner__btn"
          >
            {isCurrentActive ? t("aiDispatch.activeBadge") : t("aiDispatch.setActiveAsDefault")}
          </Button>
        </div>

        {/* Form nhập thông số */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label={
                <Space>
                  <KeyOutlined />
                  <span>{t("aiDispatch.apiKey")}</span>
                </Space>
              }
              required={providerId !== "custom"}
              help={
                providerId === "custom"
                  ? "Tùy chọn đối với Local LLM / Ollama không yêu cầu xác thực."
                  : undefined
              }
            >
              <Input.Password
                placeholder={
                  providerId === "openai"
                    ? "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    : providerId === "gemini"
                    ? "AIzasyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    : providerId === "claude"
                    ? "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    : providerId === "deepseek"
                    ? "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    : "api-key (optional)"
                }
                value={config.apiKey}
                onChange={(e) =>
                  handleProviderConfigChange(providerId, "apiKey", e.target.value)
                }
                autoComplete="off"
                data-testid={`input-api-key-${providerId}`}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <RobotOutlined />
                  <span>{t("aiDispatch.modelName")}</span>
                </Space>
              }
              required
            >
              <Select
                value={config.model}
                onChange={(val) => handleProviderConfigChange(providerId, "model", val)}
                options={config.availableModels.map((m) => ({
                  value: m,
                  label: m,
                }))}
                style={{ width: "100%" }}
                data-testid={`select-model-${providerId}`}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <ApiOutlined />
                  <span>{t("aiDispatch.baseUrl")}</span>
                </Space>
              }
              required
            >
              <Input
                value={config.baseUrl}
                onChange={(e) =>
                  handleProviderConfigChange(providerId, "baseUrl", e.target.value)
                }
                placeholder="https://api.openai.com/v1"
                data-testid={`input-base-url-${providerId}`}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Nút Test Connection & Kết quả */}
        <div className="ai-config-test-row">
          <Button
            icon={<ApiOutlined />}
            loading={isTesting}
            onClick={() => handleTestConnection(providerId)}
            data-testid={`btn-test-connection-${providerId}`}
            className="ai-config-test-btn"
          >
            {t("aiDispatch.testConnection")}
          </Button>

          {testResult && testResult.providerId === providerId && (
            <Alert
              type={testResult.success ? "success" : "error"}
              showIcon
              message={testResult.message}
              className="ai-config-test-alert"
              style={{ flex: 1, padding: "4px 12px" }}
            />
          )}
        </div>
      </Space>
    );
  };

  const tabItems = [
    ...PROVIDER_ORDER.map((pid) => {
      const cfg = draftSettings.providers[pid];
      const isSelectedActive = draftSettings.activeProvider === pid;
      const isConfigured = pid === "custom" || (cfg && cfg.apiKey.trim().length > 0);

      return {
        key: pid,
        label: (
          <Space>
            <span>{cfg?.name.split(" ")[0]}</span>
            {isSelectedActive && (
              <Badge status="success" title={t("aiDispatch.activeBadge")} />
            )}
            {!isConfigured && (
              <Badge status="warning" title={t("aiDispatch.providerNotConfigured")} />
            )}
          </Space>
        ),
        children: renderProviderForm(pid),
      };
    }),
    {
      key: "advanced",
      label: (
        <Space>
          <SettingOutlined />
          <span>{t("aiDispatch.advancedSettings")}</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card size="small" title={t("aiDispatch.advancedSettings")}>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t("aiDispatch.temperature")}
                  help={t("aiDispatch.temperatureHelp")}
                >
                  <Row gutter={12} align="middle">
                    <Col span={16}>
                      <Slider
                        min={0.0}
                        max={1.0}
                        step={0.05}
                        value={draftSettings.temperature}
                        onChange={(val) =>
                          setDraftSettings((prev) => ({ ...prev, temperature: val }))
                        }
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        min={0.0}
                        max={1.0}
                        step={0.05}
                        value={draftSettings.temperature}
                        onChange={(val) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            temperature: typeof val === "number" ? val : 0.2,
                          }))
                        }
                        style={{ width: "100%" }}
                      />
                    </Col>
                  </Row>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={t("aiDispatch.maxTokens")}>
                  <InputNumber
                    min={256}
                    max={16384}
                    step={256}
                    value={draftSettings.maxTokens}
                    onChange={(val) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        maxTokens: typeof val === "number" ? val : 4096,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={t("aiDispatch.timeoutSeconds")}>
                  <InputNumber
                    min={5}
                    max={120}
                    value={draftSettings.timeoutSeconds}
                    onChange={(val) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        timeoutSeconds: typeof val === "number" ? val : 30,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={t("aiDispatch.activeProvider")}>
                  <Radio.Group
                    value={draftSettings.activeProvider}
                    onChange={(e) => handleSetActiveProvider(e.target.value)}
                  >
                    <Space direction="vertical">
                      {PROVIDER_ORDER.map((pid) => (
                        <Radio key={pid} value={pid}>
                          {draftSettings.providers[pid]?.name}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      destroyOnHidden
      className="ai-config-modal"
      title={
        <Space>
          <RobotOutlined style={{ color: "#1890ff" }} />
          <span>{t("aiDispatch.configTitle")}</span>
        </Space>
      }
      width="min(calc(100vw - 24px), 760px)"
      style={{ maxWidth: "calc(100vw - 24px)", top: 20 }}
      footer={[
        <Popconfirm
          key="reset"
          title={t("aiDispatch.resetConfirm")}
          onConfirm={handleReset}
          okText={t("common.confirm")}
          cancelText={t("common.cancel")}
        >
          <Button icon={<ReloadOutlined />} danger>
            {t("aiDispatch.resetDefault")}
          </Button>
        </Popconfirm>,
        <Button key="cancel" onClick={onClose}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleSave}
          data-testid="btn-save-ai-config"
        >
          {t("aiDispatch.saveConfig")}
        </Button>,
      ]}
    >
      <div className="ai-config-modal-body">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {t("aiDispatch.configSubtitle")}
        </Typography.Paragraph>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          tabBarStyle={{ overflowX: "auto", flexWrap: "nowrap" }}
        />
      </div>
    </Modal>
  );
}
