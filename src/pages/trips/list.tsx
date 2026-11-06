/** Hiển thị danh sách hành trình bằng Refine useTable kèm Popup tạo mới riêng theo hợp đồng Swagger. */
import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@components";
import { TripCreateModal } from "@/components/trips/TripCreateModal";
import type { Trip } from "@/types/trip.types";
import { tripColumns } from "@features/trips/components/columns";

export const TripList = () => (
  <ResourceListPage<Trip>
    columns={tripColumns}
    resource="trips"
    headerButtons={() => (
      <TripCreateModal
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
