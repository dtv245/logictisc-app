/** Settlement collection presentation; authoritative amounts remain per row/currency. */
import React, { useCallback, useMemo, useState } from "react";
import { CanAccess } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
} from "antd";
import {
  CalculatorOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/EmptyState";
import { CalculateSettlementModal } from "@/features/settlements/components/CalculateSettlementModal";
import {
  createSettlementColumns,
} from "@/features/settlements/components/settlement.columns";
import { SettlementFilters } from "@/features/settlements/components/SettlementFilters";
import { useSettlements } from "@/features/settlements/api/settlement.query";
import { routes } from "@/constants/routes";
import type {
  DriverSettlementView,
  SettlementFilterParams,
} from "@/types/settlement.dto";
import "./Settlements.scss";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";

const { Title, Text } = Typography;

export const SettlementList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const searchInput = searchParams.get("settlementSearch") ?? "";
  const debouncedSearchTerm = useDebouncedSearch(searchInput, 350);
  const current = normalizePage(Number(searchParams.get("settlementPage")));
  const pageSize = normalizePageSize(Number(searchParams.get("settlementPageSize") ?? DEFAULT_LIST_PAGE_SIZE));
  const filters = useMemo<SettlementFilterParams>(() => ({
    payPeriodId: searchParams.get("settlementPayPeriodId") || undefined,
    driverId: searchParams.get("settlementDriverId") || undefined,
    status: searchParams.get("settlementStatus") || undefined,
    settlementType: searchParams.get("settlementType") || undefined,
  }), [searchParams]);

  const updateUrl = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Calculation Modal state
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Queries
  const { settlements, isLoading, isFetching, isError, error, refetch } =
    useSettlements(filters);

  const handleFilterChange = useCallback((newFilters: SettlementFilterParams) => {
    updateUrl({
      settlementPayPeriodId: newFilters.payPeriodId,
      settlementDriverId: newFilters.driverId,
      settlementStatus: newFilters.status,
      settlementType: newFilters.settlementType,
      settlementPage: "1",
    });
  }, [updateUrl]);

  const resetFilters = useCallback(() => {
    updateUrl({
      settlementPayPeriodId: undefined,
      settlementDriverId: undefined,
      settlementStatus: undefined,
      settlementType: undefined,
      settlementPage: "1",
    });
  }, [updateUrl]);

  // Search filtering on top of server filters
  const filteredSettlements = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return settlements;
    const term = debouncedSearchTerm.toLowerCase().trim();
    return settlements.filter((s) => {
      const matchNumber = s.settlementNumber.toLowerCase().includes(term);
      const matchDriver = s.driverName?.toLowerCase().includes(term);
      const matchPeriod = s.payPeriodCode?.toLowerCase().includes(term);
      return matchNumber || matchDriver || matchPeriod;
    });
  }, [settlements, debouncedSearchTerm]);

  const columns = useMemo(
    () =>
      createSettlementColumns({
        t, locale: i18n.language,
        onView: (record: DriverSettlementView) =>
          navigate(routes.resources.settlements.show.replace(":id", encodeURIComponent(record.id))),
      }),
    [t, navigate, i18n.language]
  );

  return (
    <div className="settlements-container">
      <Card variant="borderless" className="settlement-card">
        {/* Header */}
        <Row
          justify="space-between"
          align="middle"
          gutter={[16, 16]}
          className="settlement-list__header"
        >
          <Col xs={24} md={12} className="settlement-list__header-title">
            <Title level={4} style={{ margin: 0 }}>
              {t("settlements.title", "Driver Settlements")}
            </Title>
            <Text type="secondary">
              {t(
                "settlements.listSubtitle",
                "Review, approve, and manage driver compensation calculations and settlements."
              )}
            </Text>
          </Col>
          <Col xs={24} md={12} className="settlement-list__header-actions">
            <Space wrap className="settlement-list__actions-space">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                {t("common.refresh", "Refresh")}
              </Button>
              <CanAccess resource="driver-pay-policies" action="POLICY_VIEW">
                <Link to={routes.resources.settlements.policies}>
                  <Button icon={<SettingOutlined />}>
                    {t("settlements.payPoliciesBtn", "Pay Policies")}
                  </Button>
                </Link>
              </CanAccess>
              <CanAccess resource="settlements" action="SETTLEMENT_CALCULATE">
                <Button
                  type="primary"
                  icon={<CalculatorOutlined />}
                  onClick={() => setIsCalcModalOpen(true)}
                >
                  {t("settlements.calculateBtn", "Calculate Settlement")}
                </Button>
              </CanAccess>
            </Space>
          </Col>
        </Row>

        {/* Quick Stats Summary */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic
                title={t("settlements.stats.totalSettlements", "Total Settlements")}
                value={filteredSettlements.length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <SettlementFilters
          key={JSON.stringify(filters)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
        />

        {/* Search */}
        <Row style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder={t(
                "settlements.searchPlaceholder",
                "Search by settlement #, driver, or pay period"
              )}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value;
                updateUrl({ settlementSearch: value.trim() || undefined, settlementPage: "1" });
              }}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
        </Row>

        {/* Error Alert */}
        {isError && (
          <Alert
            type="error"
            message={t("settlements.loadError", "Failed to load settlements")}
            description={error?.message}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Table */}
        <div className="settlement-table-wrapper">
          <Table<DriverSettlementView>
            rowKey="id"
            columns={columns}
            dataSource={filteredSettlements}
            loading={isFetching}
            pagination={{
              current,
              pageSize,
              total: filteredSettlements.length,
              ...createListPaginationConfig(t),
              onChange: (nextPage, nextPageSize) => {
                updateUrl({
                  settlementPage: String(nextPageSize === pageSize ? nextPage : 1),
                  settlementPageSize: String(nextPageSize),
                });
              },
            }}
            scroll={{ x: 1200 }}
            size="middle"
            locale={{
              emptyText: <EmptyState description={t("settlements.noSettlementsFound", "No settlements found")} />,
            }}
          />
        </div>
      </Card>

      {/* Calculate Settlement Modal */}
      {isCalcModalOpen && (
        <CanAccess resource="settlements" action="SETTLEMENT_CALCULATE">
          <CalculateSettlementModal
            open={isCalcModalOpen}
            onClose={() => setIsCalcModalOpen(false)}
            onSuccess={() => refetch()}
          />
        </CanAccess>
      )}
    </div>
  );
};
