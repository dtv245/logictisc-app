/** Hiển thị danh sách thông báo bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Notification } from "@/types/notification.types";
import { notificationColumns } from "@features/notifications/components/columns";
export const NotificationList = () => <ResourceListPage<Notification> columns={notificationColumns} resource="notifications" />;
