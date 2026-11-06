import { BulbOutlined, GlobalOutlined, RobotOutlined } from "@ant-design/icons";
import { Alert, Card, Col, Row, Segmented, Space, Switch, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { AiConfigModal } from "@/features/ai-dispatch/components/AiConfigModal";
import { useAiSettings } from "@/features/ai-dispatch/hooks/aiConfigStorage";

const THEME_STORAGE_KEY = "logistics_theme";
const LANGUAGE_STORAGE_KEY = "logistics_language";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { activeProviderConfig } = useAiSettings();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"; }
    catch { return false; }
  });

  const changeTheme = (enabled: boolean) => {
    setDark(enabled);
    window.dispatchEvent(new CustomEvent("app-theme-change", { detail: enabled }));
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: 1040 }}>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Space align="start">
              <GlobalOutlined aria-hidden />
              <div>
                <Typography.Title level={5} style={{ marginTop: 0 }}>{t("settings.language")}</Typography.Title>
                <Typography.Paragraph type="secondary">{t("settings.languageHelp")}</Typography.Paragraph>
                <Segmented
                  aria-label={t("settings.language")}
                  value={i18n.language.split("-")[0]}
                  options={[
                    { label: "Tiếng Việt", value: "vi" },
                    { label: "English", value: "en" },
                    { label: "日本語", value: "ja" },
                  ]}
                  onChange={(value) => {
                    const language = String(value);
                    void i18n.changeLanguage(language);
                    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* storage may be disabled */ }
                  }}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24}>
          <Card>
            <Space align="start">
              <BulbOutlined aria-hidden />
              <div>
                <Typography.Title level={5} style={{ marginTop: 0 }}>{t("settings.appearance")}</Typography.Title>
                <Typography.Paragraph type="secondary">{t("settings.appearanceHelp")}</Typography.Paragraph>
                <Space><Switch checked={dark} onChange={changeTheme} aria-label={t("settings.darkMode")} /><Typography.Text>{t("settings.darkMode")}</Typography.Text></Space>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24}>
          <Card
            title={<Space><RobotOutlined />{t("settings.ai")}</Space>}
            extra={<a href="#ai-config" onClick={(event) => { event.preventDefault(); setAiModalOpen(true); }}>{t("settings.configureAi")}</a>}
          >
            <Typography.Text strong>{activeProviderConfig.name}</Typography.Text>
            <Typography.Text type="secondary"> · {activeProviderConfig.model}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{t("settings.aiHelp")}</Typography.Paragraph>
          </Card>
        </Col>
      </Row>
      <Alert type="info" showIcon message={t("settings.suggestionsTitle")} description={t("settings.suggestions")} />
      <AiConfigModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </Space>
  );
}
