/** Định nghĩa columns cho Conversation resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Conversation } from "@/types/chat.types";
export const conversationColumns = createCrudColumns<Conversation>("conversations", [
  { dataIndex: "name", titleKey: "columns.conversations.name", sorter: true },
  { dataIndex: "loadId", titleKey: "columns.conversations.loadId" },
  { dataIndex: "isTenantChat", titleKey: "columns.conversations.isTenantChat" },
  { dataIndex: "lastMessageAt", titleKey: "columns.conversations.lastMessageAt", sorter: true },
]);
