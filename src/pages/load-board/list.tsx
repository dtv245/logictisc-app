/** Hiển thị danh sách Load Board bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { LoadBoardListing } from "@/types/load-board.types";
import { loadBoardColumns } from "@features/load-board/components/columns";
export const LoadBoardList = () => <ResourceListPage<LoadBoardListing> columns={loadBoardColumns} resource="load-board" />;
