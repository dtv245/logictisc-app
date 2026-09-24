import { createContext, useContext } from "react";

export interface ResourceActionContextType {
  showEdit: (id: string | number) => void;
  showView: (id: string | number) => void;
}

export const ResourceActionContext = createContext<ResourceActionContextType | null>(null);

/**
 * Trả về `null` khi component không nằm trong `ResourceActionContext.Provider`
 * (ví dụ bảng dùng ngoài `ResourceListPage`) — consumer phải tự kiểm tra.
 */
export const useResourceAction = (): ResourceActionContextType | null =>
  useContext(ResourceActionContext);
