/**
 * Chứa các kiểu dữ liệu hội thoại, tin nhắn và trạng thái đã đọc.
 */

import type { Employee } from "./employee";
import type { Load } from "./load";

/** Hội thoại giữa các nhân viên hoặc liên quan đến một chuyến hàng. */
export interface Conversation {
  id: string;
  name?: string | null;
  loadId?: string | null;
  isTenantChat: boolean;
  createdAt: string;
  lastMessageAt?: string | null;
}

/** Tin nhắn được gửi trong một hội thoại. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

/** Thành viên tham gia một hội thoại. */
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  employeeId: string;
  joinedAt: string;
  lastReadAt?: string | null;
  isMuted: boolean;
}

/** Biên nhận xác định ai đã đọc một tin nhắn. */
export interface MessageReadReceipt {
  id: string;
  messageId: string;
  readById: string;
  readAt: string;
}

/** Hội thoại kèm load, thành viên và tin nhắn. */
export interface ConversationWithRelations extends Conversation {
  load?: Load | null;
  participants?: ConversationParticipant[];
  messages?: Message[];
}

/** Tin nhắn kèm người gửi và danh sách biên nhận đã đọc. */
export interface MessageWithRelations extends Message {
  sender?: Employee;
  readReceipts?: MessageReadReceipt[];
}
