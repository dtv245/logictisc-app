import { ClearOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Row, Select, Space } from "antd";
import { useTranslation } from "react-i18next";

import type {
  SettlementFilterParams,
  SettlementStatus,
  SettlementType,
} from "@/types/settlement.dto";
import { useDrivers, usePayPeriods } from "./settlement.query";

export interface SettlementFiltersProps {
  filters: SettlementFilterParams;
  onFilterChange: (newFilters: SettlementFilterParams) => void;
  onReset: () => void;
}

const SETTLEMENT_STATUSES: SettlementStatus[] = [
  "CALCULATED",
  "VALIDATION_REQUIRED",
  "IN_REVIEW",
  "APPROVED",
  "LOCKED",
  "PAYMENT_SCHEDULED",
  "PAID",
  "REVERSED",
  "CANCELLED",
];

const SETTLEMENT_TYPES: SettlementType[] = [
  "ORIGINAL",
  "ADJUSTMENT",
  "REVERSAL",
];

export const SettlementFilters = ({
  filters,
  onFilterChange,
  onReset,
}: SettlementFiltersProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<SettlementFilterParams>();
  const { payPeriods, isLoading: isPayPeriodsLoading } = usePayPeriods();
  const { drivers, isLoading: isDriversLoading } = useDrivers();

  const handleValuesChange = (
    _: unknown,
    allValues: SettlementFilterParams
  ) => {
    onFilterChange(allValues);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <FilterOutlined />
          <span>{t("settlements.filters.title", "Filter Settlements")}</span>
        </Space>
      }
      extra={
        <Button
          icon={<ClearOutlined />}
          size="small"
          onClick={handleReset}
          type="text"
        >
          {t("common.reset", "Reset")}
        </Button>
      }
    >
      <Form
        form={form}
        initialValues={filters}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={8} md={8}>
            <Form.Item
              label={t("settlements.payPeriod", "Pay Period")}
              name="payPeriodId"
            >
              <Select
                allowClear
                loading={isPayPeriodsLoading}
                placeholder={t(
                  "settlements.filters.selectPayPeriod",
                  "Select Pay Period"
                )}
                options={payPeriods.map((period) => ({
                  label: `${period.periodCode} (${period.startDate} ~ ${period.endDate})`,
                  value: period.id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8} md={8}>
            <Form.Item
              label={t("settlements.driver", "Driver")}
              name="driverId"
            >
              <Select
                allowClear
                loading={isDriversLoading}
                placeholder={t(
                  "settlements.filters.selectDriver",
                  "Select Driver"
                )}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={drivers.map((driver) => ({
                  label: driver.fullName,
                  value: driver.id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8} md={8}>
            <Form.Item
              label={t("settlements.status", "Status")}
              name="status"
            >
              <Select
                allowClear
                placeholder={t(
                  "settlements.filters.selectStatus",
                  "Select Status"
                )}
                options={SETTLEMENT_STATUSES.map((status) => ({
                  label: t(
                    `settlements.statuses.${status.toLowerCase()}`,
                    status
                  ),
                  value: status,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8} md={8}>
            <Form.Item
              label={t("settlements.type", "Type")}
              name="settlementType"
            >
              <Select
                allowClear
                placeholder={t(
                  "settlements.filters.selectType",
                  "Select Type"
                )}
                options={SETTLEMENT_TYPES.map((type) => ({
                  label: t(
                    `settlements.types.${type.toLowerCase()}`,
                    type
                  ),
                  value: type,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};
