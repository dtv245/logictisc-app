/** Định nghĩa columns cho Load Board resource. */
import { createCrudColumns } from "../../components";
import type { LoadBoardListing } from "../../types/load-board";
export const loadBoardColumns = createCrudColumns<LoadBoardListing>("load-board", [
  { dataIndex: "externalListingId", title: "Listing ID", sorter: true },
  { dataIndex: "providerType", title: "Nhà cung cấp", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "equipmentType", title: "Thiết bị", sorter: true },
  { dataIndex: "expiresAt", title: "Hết hạn", sorter: true },
]);
