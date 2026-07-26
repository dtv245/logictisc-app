/** Định nghĩa columns cho Notification resource. */
import { createCrudColumns } from "../../components";
import type { Notification } from "../../types/notification";
export const notificationColumns = createCrudColumns<Notification>("notifications", [
  { dataIndex: "title", title: "Tiêu đề", sorter: true },
  { dataIndex: "isRead", title: "Đã đọc", sorter: true },
  { dataIndex: "createdDate", title: "Ngày tạo", sorter: true },
]);
