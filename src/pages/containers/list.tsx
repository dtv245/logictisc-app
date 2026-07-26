/** Hiển thị danh sách container bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Container } from "../../types/load";
import { containerColumns } from "./columns";
export const ContainerList = () => <ResourceListPage<Container> columns={containerColumns} resource="containers" />;
