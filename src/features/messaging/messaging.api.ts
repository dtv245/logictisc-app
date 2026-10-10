/** Principal-bound messaging paths/keys; no participant administration or read-receipt API exists. */
import type { DataProvider } from "@refinedev/core";
import type { ConversationView, MessageView, CreateConversationRequest, SendMessageRequest } from "@/types/handoff.generated";
import type { CurrentUser } from "@/types/auth.types";
import type { PagedResponse } from "@/types/api.types";

export const MESSAGING_RUNTIME_VERIFIED = false;
export const messagingApi = {
  conversations: "/api/messages/conversations",
  conversation: (id: string) => `/api/messages/conversations/${encodeURIComponent(id)}`,
  messages: "/api/messages",
  unread: "/api/messages/unread-count",
};
export const messagingKeys = {
  scope: (tenant: string | undefined, subject: string | undefined, employee: string | undefined) => ["messaging", tenant, subject, employee] as const,
};
export function createMessagingCommands(custom: NonNullable<DataProvider["custom"]>, identity: CurrentUser) {
  const employeeId = identity.employeeId;
  const requireEmployee = () => { if (!employeeId) throw new Error("MESSAGING_EMPLOYEE_REQUIRED"); };
  return {
    conversations: async (page = 1, pageSize = 20): Promise<PagedResponse<ConversationView>> => {
      requireEmployee(); return (await custom<PagedResponse<ConversationView>>({ url: messagingApi.conversations, method: "get", query: { employeeId, page, pageSize } })).data;
    },
    unread: async () => { requireEmployee(); return (await custom({ url: messagingApi.unread, method: "get", query: { employeeId } })).data; },
    create: async (input: CreateConversationRequest): Promise<ConversationView> => {
      requireEmployee();
      if (input.isTenantChat && !identity.roles?.includes("ADMIN")) throw new Error("FORBIDDEN");
      const payload: CreateConversationRequest = { isTenantChat: input.isTenantChat, ...(input.name === undefined ? {} : { name: input.name }), ...(input.loadId === undefined ? {} : { loadId: input.loadId }) };
      return (await custom<ConversationView>({ url: messagingApi.conversations, method: "post", payload })).data;
    },
    send: async (conversationId: string, content: string): Promise<MessageView> => {
      requireEmployee(); if (!content.trim() || content.length > 2000) throw new Error("MESSAGE_CONTENT_INVALID");
      const payload: Omit<SendMessageRequest, "senderId"> = { conversationId, content };
      return (await custom<MessageView>({ url: messagingApi.messages, method: "post", payload })).data;
    },
  };
}
