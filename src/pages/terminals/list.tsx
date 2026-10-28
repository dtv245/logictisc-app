import { CreateButton } from "@refinedev/antd";

import { ResourceListToolbar } from "@/components/ResourceListToolbar";
import { TerminalCardGrid } from "@/components/terminals/TerminalCardGrid";
import { useTerminalList } from "@/hooks/terminals/useTerminalList";

const TerminalList = () => {
  const {
    createAllowed,
    entityFilters,
    isFetching,
    isLoading,
    isMockPreview,
    listPagination,
    onRetry,
    queryError,
    refresh,
    resourceLabel,
    terminals,
    totalCount,
  } = useTerminalList();

  return (
    <div className="resource-list-card">
      <ResourceListToolbar
        controls={entityFilters.controls}
        filterValues={entityFilters.value}
        headerButtons={createAllowed ? <CreateButton /> : null}
        isFetching={isFetching}
        onFilterChange={entityFilters.setFilter}
        onFilterReset={entityFilters.reset}
        onRefresh={refresh}
        resource="terminals"
        resourceLabel={resourceLabel}
        totalCount={totalCount}
      />
      <TerminalCardGrid
        isLoading={isLoading}
        isMockPreview={isMockPreview}
        onRetry={onRetry}
        pagination={listPagination}
        queryError={queryError}
        terminals={terminals}
      />
    </div>
  );
};

export { TerminalList };
