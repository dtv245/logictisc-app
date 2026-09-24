/** Định nghĩa columns cho Document resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Document } from "@/types/document.types";
export const documentColumns = createCrudColumns<Document>("documents", [
  { dataIndex: "fileName", titleKey: "columns.documents.fileName", sorter: true },
  { dataIndex: "type", titleKey: "columns.documents.type", sorter: true },
  { dataIndex: "status", titleKey: "columns.documents.status", status: true, sorter: true },
  { dataIndex: "contentType", titleKey: "columns.documents.contentType" },
]);
