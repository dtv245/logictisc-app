/** Định nghĩa columns cho Conversation resource. */
import { createCrudColumns } from "../../components";
import type { Conversation } from "../../types/chat";
export const conversationColumns = createCrudColumns<Conversation>("conversations", [
  { dataIndex: "name", title: "Tên hội thoại", sorter: true },
  { dataIndex: "loadId", title: "Load" },
  { dataIndex: "isTenantChat", title: "Chat tenant" },
  { dataIndex: "lastMessageAt", title: "Tin nhắn cuối", sorter: true },
]);
