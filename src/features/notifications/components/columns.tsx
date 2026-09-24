/** Định nghĩa columns cho Notification resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Notification } from "@/types/notification.types";
export const notificationColumns = createCrudColumns<Notification>("notifications", [
  { dataIndex: "title", titleKey: "columns.notifications.title", sorter: true },
  { dataIndex: "isRead", titleKey: "columns.notifications.isRead", sorter: true },
  { dataIndex: "createdDate", titleKey: "columns.notifications.createdDate", sorter: true },
]);
