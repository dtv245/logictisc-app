export type AsyncStatus = "idle" | "pending" | "success" | "error";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}
