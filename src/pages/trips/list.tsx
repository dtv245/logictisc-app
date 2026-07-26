/** Hiển thị danh sách hành trình bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Trip } from "../../types/trip";
import { tripColumns } from "./columns";
export const TripList = () => <ResourceListPage<Trip> columns={tripColumns} resource="trips" />;
