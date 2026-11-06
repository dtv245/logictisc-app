/** Hiển thị danh sách load bằng Refine useTable kèm Popup tạo mới riêng theo hợp đồng Swagger. */
import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@/components/ResourceListPage";
import { LoadCreateModal } from "@/components/loads/LoadCreateModal";
import type { Load } from "@/types/loads/load.types";
import { loadColumns } from "@features/loads/components/columns";

export const LoadList = () => (
  <ResourceListPage<Load>
    columns={loadColumns}
    resource="loads"
    headerButtons={() => (
      <LoadCreateModal
        trigger={(show) => (
          <CreateButton
            onClick={(e) => {
              e.preventDefault();
              show();
            }}
          />
        )}
      />
    )}
  />
);
