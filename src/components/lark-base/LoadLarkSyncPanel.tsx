import { Alert, Button, Card, Empty, Popconfirm, Space, Spin, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/ErrorStates";
import { formatDateTime } from "@/formatters/dateTime";
import { useLoadLarkSync } from "@/hooks/lark-base/useLoadLarkSync";

export function LoadLarkSyncPanel({ loadId }: { loadId: string }) {
  const { t, i18n } = useTranslation();
  const { access, canSync, query, mutation, sync } = useLoadLarkSync(loadId);
  if (access.isLoading) return <Spin />;
  if (!canSync) return <ForbiddenState />;
  const status = query.data;
  const labels: Record<string, string> = {
    NOT_SYNCED: t("larkBase.notSynced", "Chưa đồng bộ"),
    PENDING: t("larkBase.pending", "Chờ đồng bộ"),
    SYNCED: t("larkBase.synced", "Đã đồng bộ"),
    ERROR: t("larkBase.error", "Lỗi đồng bộ"),
    CONFLICT: t("larkBase.conflict", "Xung đột"),
    MISSING: t("larkBase.missing", "Mất ở Base"),
  };
  const error = mutation.error ?? query.error;
  const errorMessage = error instanceof Error ? error.message : undefined;
  const push = (recreate: boolean) => { void sync(recreate).catch(() => undefined); };
  return <Card title="Lark Base" data-testid="load-lark-sync-panel">
    <Space direction="vertical" style={{ width: "100%" }}>
      {query.isLoading && <Spin />}
      {errorMessage && <Alert type="error" showIcon message={errorMessage} />}
      {status?.lastError && <Alert type={status.state === "CONFLICT" ? "warning" : "error"} showIcon message={status.lastError} />}
      {status ? <>
        <Tag color={status.state === "SYNCED" ? "green" : status.state === "NOT_SYNCED" ? "default" : "orange"}>
          {labels[status.state] ?? status.state}
        </Tag>
        <Typography.Text>{t("larkBase.lastSynced", "Đồng bộ gần nhất")}: {formatDateTime(status.lastSyncedAt, { locale: i18n.language })}</Typography.Text>
      </> : !query.isLoading && !query.isError && <Empty description={t("larkBase.noData", "Chưa có trạng thái đồng bộ")} />}
      <Space>
        {status?.state === "MISSING" ? <Popconfirm
          title={t("larkBase.recreateConfirm", "Tạo lại record đã mất ở Base?")}
          onConfirm={() => push(true)}>
          <Button loading={mutation.isLoading}>{t("larkBase.recreate", "Đẩy lại record đã mất")}</Button>
        </Popconfirm> : <Button type="primary" loading={mutation.isLoading} disabled={query.isLoading || query.isError}
          onClick={() => push(false)}>{t("larkBase.push", "Đồng bộ sang Base")}</Button>}
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>{t("actions.retry", "Tải lại")}</Button>
      </Space>
    </Space>
  </Card>;
}
