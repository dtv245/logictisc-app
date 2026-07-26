/** Hiển thị danh sách tài liệu bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Document } from "../../types/document";
import { documentColumns } from "./columns";
export const DocumentList = () => <ResourceListPage<Document> columns={documentColumns} resource="documents" />;
