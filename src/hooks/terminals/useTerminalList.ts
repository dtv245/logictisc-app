import { useTable } from "@refinedev/antd";
import { useCan } from "@refinedev/core";
import type { PaginationConfig } from "antd/es/pagination";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useEntityFilters } from "@/hooks/useEntityFilters";
import type { ApiError } from "@/types/api.types";
import type { Terminal } from "@/types/terminal.types";
import { DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE } from "@/utils/querySerializer";
import { formatTerminalAddress } from "@/utils/terminals/formatTerminalAddress";
import { terminalPreviewData } from "./terminalPreviewData";

export const useTerminalList = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isMockPreview = import.meta.env.DEV && searchParams.get("preview") === "mock";

  const {
    filters,
    setCurrent,
    setFilters,
    tableProps,
    tableQueryResult,
  } = useTable<Terminal, ApiError>({
    pagination: {
      mode: "server",
      current: DEFAULT_LIST_PAGE,
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
    queryOptions: { enabled: !isMockPreview },
    resource: "terminals",
    syncWithLocation: true,
  });

  const entityFilters = useEntityFilters("terminals", {
    filters,
    setCurrent,
    setFilters,
  });

  const { data: createAccess } = useCan({
    action: "create",
    resource: "terminals",
    queryOptions: { enabled: !isMockPreview },
  });

  const mockTerminals = useMemo(() => {
    if (!isMockPreview) return [];

    const search = entityFilters.value.search?.trim().toLocaleLowerCase();
    const type = entityFilters.value.type;
    const countryCode = entityFilters.value.countryCode?.toLocaleUpperCase();

    return terminalPreviewData.filter((terminal) => {
      const address = formatTerminalAddress(terminal);
      const matchesSearch = !search ||
        [terminal.name, terminal.code, terminal.countryCode, address]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search);
      const matchesType = !type || terminal.type === type;
      const matchesCountry = !countryCode || terminal.countryCode === countryCode;
      return matchesSearch && matchesType && matchesCountry;
    });
  }, [entityFilters.value, isMockPreview]);

  const terminals = isMockPreview
    ? mockTerminals
    : ((tableProps.dataSource ?? []) as Terminal[]);
  const isLoading = !isMockPreview && tableQueryResult.isLoading;
  const totalCount = isMockPreview
    ? terminals.length
    : (tableQueryResult.data?.total ?? terminals.length);
  const listPagination: false | PaginationConfig = isMockPreview || !tableProps.pagination
    ? false
    : {
        current: tableProps.pagination.current,
        pageSize: tableProps.pagination.pageSize,
        total: tableProps.pagination.total,
        onChange: (page: number) => setCurrent(page),
      };

  return {
    createAllowed: !isMockPreview && createAccess?.can === true,
    entityFilters,
    isFetching: !isMockPreview && tableQueryResult.isFetching,
    isLoading,
    isMockPreview,
    listPagination,
    onRetry: () => void tableQueryResult.refetch(),
    queryError: tableQueryResult.error,
    refresh: isMockPreview ? undefined : () => void tableQueryResult.refetch(),
    resourceLabel: t("resources.terminals"),
    terminals,
    totalCount,
  };
};
