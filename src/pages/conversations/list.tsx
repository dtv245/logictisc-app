/** Hiển thị danh sách hội thoại bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Conversation } from "../../types/chat";
import { conversationColumns } from "./columns";
export const ConversationList = () => <ResourceListPage<Conversation> columns={conversationColumns} resource="conversations" />;
