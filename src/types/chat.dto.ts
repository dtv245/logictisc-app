import type { ISODateTime } from "./api.types";

/**
 * Data Transfer Object (DTO) cho Messaging endpoints (`/api/messages/**`).
 * Khớp chính xác với Spring Boot `MessageController`, `ConversationResponse.java`, `MessageResponse.java`.
 */

export interface ConversationResponse {
  id: string;
  name?: string | null;
  loadId?: string | null;
  isTenantChat: boolean;
  createdAt: ISODateTime;
  lastMessageAt?: ISODateTime | null;
  participantIds: string[];
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string | null;
  content: string;
  sentAt: ISODateTime;
  isDeleted: boolean;
}

export interface CreateConversationRequest {
  name?: string | null;
  loadId?: string | null;
  isTenantChat: boolean;
  participantIds: string[];
}

export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  content: string;
}
