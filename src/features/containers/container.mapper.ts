import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { ContainerResponse } from "@/types/container.dto";
import type { Container } from "@/types/container.types";

export function mapContainerResponse(response: ContainerResponse): Container {
  return {
    ...response,
    loadedAt: toDateOrNull(response.loadedAt),
    deliveredAt: toDateOrNull(response.deliveredAt),
    returnedAt: toDateOrNull(response.returnedAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}
