import { Alert, Flex, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ProfileSummary } from "@/features/profile/ProfileSummary";

export const ProfilePage = () => {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();

  if (currentUser.isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 300, width: "100%" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (currentUser.isError || !currentUser.data) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
        <Alert
          description={t("queryError.description")}
          message={t("queryError.title")}
          showIcon
          type="error"
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {t("profile.title")}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          {t("profile.subtitle")}
        </Typography.Paragraph>
      </div>

      <ProfileSummary tenant={tenant} user={currentUser.data} />
    </div>
  );
};
