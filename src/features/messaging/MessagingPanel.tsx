/** Internal conversation UI kept dormant until real principal/membership authorization is verified. */
import { useCan, useCustom, useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, List, Select, Space, Spin } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/ErrorStates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { normalizeHttpError, type ApiHttpError } from "@/providers/api/httpError";
import type { PagedResponse } from "@/types/api.types";
import type { ConversationView, MessageView } from "@/types/handoff.generated";
import { createMessagingCommands, messagingApi, messagingKeys, MESSAGING_RUNTIME_VERIFIED } from "./messaging.api";

export function MessagingPanel({ runtimeVerified = MESSAGING_RUNTIME_VERIFIED }: { runtimeVerified?: boolean }) {
  const { t } = useTranslation(); const user = useCurrentUser(); const { tenant } = useCurrentTenant(); const provider = useDataProvider(); const client = useQueryClient();
  const access = useCan({ resource: "messages", action: "read" }); const sendAccess = useCan({ resource: "messages", action: "send" });
  const [conversationId, setConversationId] = useState<string | undefined>(); const [page, setPage] = useState(1); const [messagePage, setMessagePage] = useState(1);
  const [form] = Form.useForm<{ content: string; name?: string }>(); const flight = useRef(false); const [pending, setPending] = useState(false); const [error, setError] = useState<ApiHttpError | null>(null);
  const scope = messagingKeys.scope(tenant?.tenantKey, user.data?.id, user.data?.employeeId);
  const enabled = runtimeVerified && Boolean(tenant?.tenantKey && user.data?.employeeId && access.data?.can);
  const conversations = useCustom<PagedResponse<ConversationView>, ApiHttpError>({ url: messagingApi.conversations, method: "get", config: { query: { employeeId: user.data?.employeeId, page, pageSize: 20 } }, errorNotification: false,
    queryOptions: { enabled, queryKey: [...scope, "conversations", page] } });
  const messages = useCustom<PagedResponse<MessageView>, ApiHttpError>({ url: messagingApi.messages, method: "get", config: { query: { conversationId, page: messagePage, pageSize: 50 } }, errorNotification: false,
    queryOptions: { enabled: enabled && Boolean(conversationId), queryKey: [...scope, "messages", conversationId, messagePage] } });
  if (!runtimeVerified) return <Alert type="warning" message={t("contractAlignment.runtimePending")} />;
  if (user.isLoading || access.isLoading) return <Spin />;
  if (!user.data?.employeeId) return <Alert type="warning" message={t("contractAlignment.employeeRequired")} />;
  if (!enabled) return <ForbiddenState />;
  const readError = conversations.error ?? messages.error;
  const shownError = error ?? readError;
  const execute = async (create: boolean) => {
    if (flight.current || !user.data || !sendAccess.data?.can) return;
    flight.current = true; setPending(true); setError(null);
    try {
      const commands = createMessagingCommands(provider().custom!, user.data); const values = await form.validateFields(create ? ["name"] : ["content"]);
      if (create) { const result = await commands.create({ name: values.name, isTenantChat: false }); setConversationId(result.id); setMessagePage(1); }
      else { if (!conversationId) return; await commands.send(conversationId, values.content); }
      form.resetFields(); await client.invalidateQueries({ queryKey: scope, refetchType: "active" });
    } catch (cause) { setError(normalizeHttpError(cause)); }
    finally { flight.current = false; setPending(false); }
  };
  return <Space direction="vertical" style={{ width: "100%" }}>
    {shownError && <Alert type="error" showIcon message={shownError.statusCode === 403 ? t("messaging.notMember") : shownError.message} />}
    <Select aria-label={t("messaging.conversation")} loading={conversations.isFetching} value={conversationId} onChange={(value) => { setConversationId(value); setMessagePage(1); setError(null); }}
      options={conversations.data?.data.items.map((row) => ({ value: row.id, label: row.name || row.id }))} />
    <Space><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("messaging.previous")}</Button><Button disabled={page >= (conversations.data?.data.totalPages ?? 0)} onClick={() => setPage(page + 1)}>{t("messaging.next")}</Button></Space>
    {conversationId && !readError && <><List loading={messages.isFetching} dataSource={messages.data?.data.items} locale={{ emptyText: t("messaging.empty") }} renderItem={(row) => <List.Item><strong>{row.senderName ?? row.senderId}</strong> {row.content}</List.Item>} />
      <Space><Button disabled={messagePage <= 1} onClick={() => setMessagePage(messagePage - 1)}>{t("messaging.previous")}</Button><Button disabled={messagePage >= (messages.data?.data.totalPages ?? 0)} onClick={() => setMessagePage(messagePage + 1)}>{t("messaging.next")}</Button></Space></>}
    <Form form={form} disabled={pending} layout="vertical">
      <Form.Item name="name" label={t("messaging.name")}><Input /></Form.Item><Button disabled={pending || !sendAccess.data?.can} onClick={() => void execute(true)}>{t("messaging.create")}</Button>
      <Form.Item name="content" label={t("messaging.content")} rules={[{ required: true, whitespace: true, max: 2000 }]}><Input.TextArea maxLength={2000} /></Form.Item>
      <Button loading={pending} disabled={pending || !conversationId || !sendAccess.data?.can || shownError?.statusCode === 403 || shownError?.statusCode === 0 || (shownError?.statusCode ?? 0) >= 500} onClick={() => void execute(false)}>{t("messaging.send")}</Button>
    </Form>
  </Space>;
}
