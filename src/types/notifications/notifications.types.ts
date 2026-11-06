/**
 * Chứa các kiểu dữ liệu thông báo trong ứng dụng và kết nối Telegram.
 */

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TelegramChatType = "private" | "group" | "supergroup" | "channel";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TelegramChatRole =
  | "driver"
  | "dispatcher"
  | "manager"
  | "customer";

/** Thông báo hiển thị cho người dùng trong ứng dụng. */
export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}

/** Chat Telegram được liên kết để nhận thông báo vận hành. */
export interface TelegramChat {
  id: string;
  chatId: number;
  chatType: TelegramChatType;
  role?: TelegramChatRole | null;
  userId?: string | null;
  username?: string | null;
  firstName?: string | null;
  groupTitle?: string | null;
  notificationsEnabled: boolean;
  connectedAt: string;
  lastInteractionAt?: string | null;
}
