import { ResourceListPage } from "@components";
import type { Document } from "@/types/document.types";
import { documentColumns } from "@features/documents/components/columns";
import { DocumentUploadModal } from "@features/documents/DocumentUploadModal";

export const DocumentList = () => (
  <ResourceListPage<Document>
    columns={documentColumns}
    headerButtons={<DocumentUploadModal />}
    resource="documents"
  />
);
