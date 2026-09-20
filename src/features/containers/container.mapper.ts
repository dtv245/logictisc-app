import type { ContainerResponse } from "@/types/container.dto";
import type { Container } from "@/types/container.types";

export function mapContainerResponse(response: ContainerResponse): Container {
  return {
    ...response,
    loadedAt: response.loadedAt ? new Date(response.loadedAt) : null,
    deliveredAt: response.deliveredAt ? new Date(response.deliveredAt) : null,
    returnedAt: response.returnedAt ? new Date(response.returnedAt) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}
