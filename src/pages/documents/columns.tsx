/** Định nghĩa columns cho Document resource. */
import { createCrudColumns } from "../../components";
import type { Document } from "../../types/document";
export const documentColumns = createCrudColumns<Document>("documents", [
  { dataIndex: "fileName", title: "Tên file", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "contentType", title: "Content type" },
]);
