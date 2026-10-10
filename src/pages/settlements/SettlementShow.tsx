/** Settlement workflow page; tab data is mounted only when opened and history is never editable. */
import { useCan, useCustom } from "@refinedev/core";
import { Button, Form, Input, Modal, Space, Spin, Tabs } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { routes } from "@/constants/routes";
import { isUuid } from "@/utils/uuid";
import type { DriverSettlementView } from "@/types/settlement.dto";
import type { ApiHttpError } from "@/providers/api/httpError";
import { SETTLEMENT_ENDPOINTS } from "@/features/settlements/settlement.api";
import { settlementKeys } from "@/features/settlements/settlement.keys";
import { useSettlementActions } from "@/features/settlements/useSettlementActions";
import { SettlementSummary } from "@/features/settlements/SettlementSummary";
import { SettlementLinesTable } from "@/features/settlements/SettlementLinesTable";
import { SettlementAudit } from "@/features/settlements/SettlementAudit";
import { SettlementActions } from "@/features/settlements/SettlementActions";
import { SettlementAdjustments } from "@/features/settlements/SettlementAdjustments";
import { CreateAdjustmentModal } from "@/features/settlements/CreateAdjustmentModal";

function SettlementDetail({ settlement }: { settlement: DriverSettlementView }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("summary");
  const [reverseOpen, setReverseOpen] = useState(false);
  const [form] = Form.useForm<{ reason: string }>();
  const actions = useSettlementActions(settlement);
  const onView = (id: string) => navigate(routes.resources.settlements.show.replace(":id", encodeURIComponent(id)));
  const items = [
    { key: "summary", label: t("finance.summary"), view: <SettlementSummary settlement={settlement} /> },
    { key: "lines", label: t("settlements.workflow.lines"), view: <SettlementLinesTable lines={settlement.lines ?? []} /> },
    { key: "source", label: t("settlements.workflow.sourceWork"), view: <SettlementLinesTable lines={settlement.lines ?? []} sourceOnly /> },
    { key: "adjustments", label: t("settlements.workflow.history"), view: <SettlementAdjustments settlement={settlement} onView={onView} /> },
    { key: "audit", label: t("settlements.workflow.audit"), view: <SettlementAudit settlement={settlement} /> },
  ];
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <PageHeader title={settlement.settlementNumber} extra={<Button onClick={() => navigate(routes.resources.settlements.list)}>{t("settlements.workflow.back")}</Button>} />
    <SettlementActions actions={actions} />
    <Space wrap>
      <CreateAdjustmentModal key={settlement.id} actions={actions} currency={settlement.currency} onCreated={onView} />
      {actions.canExecute("reversal") && <Button danger disabled={actions.pending} onClick={() => setReverseOpen(true)}>{t("settlements.workflow.reversal")}</Button>}
    </Space>
    <Tabs activeKey={tab} onChange={setTab} items={items.map((item) => ({ key: item.key, label: item.label, children: tab === item.key ? item.view : null }))} />
    {reverseOpen && <Modal open title={t("settlements.workflow.reversal")} confirmLoading={actions.pending} okText={t("actions.confirm")}
      cancelButtonProps={{ disabled: actions.pending }} maskClosable={!actions.pending} keyboard={!actions.pending} onCancel={() => { if (!actions.pending) setReverseOpen(false); }}
      onOk={async () => {
        try {
          const values = await form.validateFields();
          const result = await actions.execute({ action: "reversal", payload: { reason: values.reason.trim() } });
          if (result) { setReverseOpen(false); form.resetFields(); onView(result.id); }
        } catch { /* Validation is inline; normalized command error stays visible in SettlementActions. */ }
      }}>
      <p>{t("settlements.workflow.correctionNotice")}</p>
      <Form form={form} layout="vertical"><Form.Item label={t("finance.reason")} name="reason" rules={[{ required: true, whitespace: true, max: 300, message: t("settlements.workflow.reasonRequired") }]}><Input.TextArea maxLength={300} /></Form.Item></Form>
    </Modal>}
  </Space>;
}
export function SettlementShow() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "settlements", action: "SETTLEMENT_VIEW" });
  const query = useCustom<DriverSettlementView, ApiHttpError>({ url: SETTLEMENT_ENDPOINTS.get(id ?? ""), method: "get", errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && isUuid(id) && access.data?.can), queryKey: settlementKeys.detail(tenant?.tenantKey, id ?? "") } });
  if (!isUuid(id)) return <NotFoundState />;
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  if (!query.data?.data) return <EmptyState />;
  return <SettlementDetail key={`${tenant?.tenantKey}:${id}`} settlement={query.data.data} />;
}
