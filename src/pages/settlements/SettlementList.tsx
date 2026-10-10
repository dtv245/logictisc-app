/** Settlement collection presentation; authoritative amounts remain per row/currency. */
import React, { useMemo, useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CalculateSettlementModal } from "@/features/settlements/CalculateSettlementModal";
import {
  createSettlementColumns,
} from "@/features/settlements/settlement.columns";
import { SettlementFilters } from "@/features/settlements/SettlementFilters";
import { useSettlements } from "@/features/settlements/settlement.query";
import { routes } from "@/constants/routes";
import type {
  DriverSettlementView,
  SettlementFilterParams,
} from "@/types/settlement.dto";

const { Title, Text } = Typography;

export const SettlementList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SettlementFilterParams>({});

  // Calculation Modal state
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Queries
  const { settlements, isLoading, isError, error, refetch } =
    useSettlements(filters);

  // Search filtering on top of server filters
  const filteredSettlements = useMemo(() => {
    if (!searchTerm.trim()) return settlements;
    const term = searchTerm.toLowerCase().trim();
    return settlements.filter((s) => {
      const matchNumber = s.settlementNumber.toLowerCase().includes(term);
      const matchDriver = s.driverName?.toLowerCase().includes(term);
      const matchPeriod = s.payPeriodCode?.toLowerCase().includes(term);
      return matchNumber || matchDriver || matchPeriod;
    });
  }, [settlements, searchTerm]);

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
    <div style={{ padding: 24 }}>
      <Card bordered={false}>
        {/* Header */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col>
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
          <Col>
            <Space>
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
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card size="small"><Statistic title={t("settlements.stats.totalSettlements", "Total Settlements")} value={filteredSettlements.length} prefix={<FileTextOutlined />} /></Card>
          </Col>
        </Row>

        {/* Filters */}
        <SettlementFilters
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          onReset={() => setFilters({})}
        />

        {/* Search */}
        <Row style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={8}>
            <Input
              placeholder={t(
                "settlements.searchPlaceholder",
                "Search by settlement #, driver, or pay period"
              )}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
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
        <Table<DriverSettlementView>
          rowKey="id"
          columns={columns}
          dataSource={filteredSettlements}
          loading={isLoading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
          scroll={{ x: "max-content" }}
          size="middle"
        />
      </Card>

      {/* Calculate Settlement Modal */}
      {isCalcModalOpen && <CanAccess resource="settlements" action="SETTLEMENT_CALCULATE">
      <CalculateSettlementModal
        open={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onSuccess={() => refetch()}
      />
      </CanAccess>}
    </div>
  );
};
