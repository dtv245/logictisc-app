/** Định nghĩa columns cho Notification resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Notification } from "@/types/notification.types";
export const notificationColumns = createCrudColumns<Notification>("notifications", [
  { dataIndex: "title", titleKey: "columns.notifications.title" },
  { dataIndex: "isRead", titleKey: "columns.notifications.isRead" },
  { dataIndex: "createdDate", titleKey: "columns.notifications.createdDate" },
]);
