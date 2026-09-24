/** Định nghĩa columns cho Load Board resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { LoadBoardListing } from "@/types/load-board.types";
export const loadBoardColumns = createCrudColumns<LoadBoardListing>("load-board", [
  { dataIndex: "externalListingId", titleKey: "columns.load-board.externalListingId", sorter: true },
  { dataIndex: "providerType", titleKey: "columns.load-board.providerType", sorter: true },
  { dataIndex: "status", titleKey: "columns.load-board.status", status: true, sorter: true },
  { dataIndex: "equipmentType", titleKey: "columns.load-board.equipmentType", sorter: true },
  { dataIndex: "expiresAt", titleKey: "columns.load-board.expiresAt", sorter: true },
]);
