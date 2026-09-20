import { createContext, useContext } from "react";

export interface ResourceActionContextType {
  showEdit: (id: string | number) => void;
  showView: (id: string | number) => void;
}

export const ResourceActionContext = createContext<ResourceActionContextType | null>(null);

export const useResourceAction = () => {
  const context = useContext(ResourceActionContext);
  return context; // May be null if not wrapped
};
