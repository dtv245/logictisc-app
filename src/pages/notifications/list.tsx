/** Hiển thị danh sách thông báo bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Notification } from "../../types/notification";
import { notificationColumns } from "./columns";
export const NotificationList = () => <ResourceListPage<Notification> columns={notificationColumns} resource="notifications" />;
