/** Hiển thị danh sách container bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Container } from "@/types/container.types";
import { containerColumns } from "@features/containers/components/columns";
export const ContainerList = () => <ResourceListPage<Container> columns={containerColumns} resource="containers" />;
