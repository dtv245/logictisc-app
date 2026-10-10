import { UserOutlined } from "@ant-design/icons";
import { Avatar, Card, Descriptions, Flex, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { ProfileSummaryProps } from "./profile.types";

export const ProfileSummary = ({ user, tenant }: ProfileSummaryProps) => {
  const { t } = useTranslation();

  const tenantName = tenant?.tenantName ?? user.tenantName ?? "—";
  const tenantKey = tenant?.tenantKey ?? user.tenantKey ?? "—";
  const tenantId = user.tenantId ?? tenant?.id ?? "—";

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Flex align="center" gap="middle">
          <Avatar
            icon={!user.avatar && <UserOutlined />}
            size={64}
            src={user.avatar}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : undefined}
          </Avatar>
          <Flex vertical style={{ flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {user.name}
            </Typography.Title>
            <Typography.Text type="secondary">
              {user.email ?? t("profile.userId") + `: ${user.id}`}
            </Typography.Text>
            {tenantName !== "—" && (
              <div style={{ marginTop: 4 }}>
                <Tag color="geekblue">{tenantName}</Tag>
              </div>
            )}
          </Flex>
        </Flex>
      </Card>

      <Card title={t("profile.personalInfo")}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 2 }}
          size="middle"
        >
          <Descriptions.Item label={t("profile.name")}>
            {user.name}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.email")}>
            {user.email ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.userId")}>
            {user.id}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.openId")}>
            {user.openId ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.employeeId")}>
            {user.employeeId ?? "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t("profile.tenantInfo")}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="middle"
        >
          <Descriptions.Item label={t("profile.tenantName")}>
            {tenantName}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.tenantKey")}>
            {tenantKey}
          </Descriptions.Item>
          <Descriptions.Item label={t("profile.tenantId")}>
            {tenantId}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t("profile.rolesAndPermissions")}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
              {t("profile.roles")}
            </Typography.Text>
            {user.roles && user.roles.length > 0 ? (
              <Space wrap size={[0, 8]}>
                {user.roles.map((role) => (
                  <Tag color="blue" key={role}>
                    {role}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">
                {t("profile.noRoles")}
              </Typography.Text>
            )}
          </div>

          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
              {t("profile.permissions")}
            </Typography.Text>
            {user.permissions && user.permissions.length > 0 ? (
              <Space wrap size={[0, 8]}>
                {user.permissions.map((permission) => (
                  <Tag color="cyan" key={permission}>
                    {permission}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">
                {t("profile.noPermissions")}
              </Typography.Text>
            )}
          </div>
        </Space>
      </Card>
    </Space>
  );
};
