/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Space, Switch, Tag, Tooltip } from "antd";
import { CloseCircleOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { BaseTable } from "@/table/BaseTable";
import type { FleetCoverage, FleetDecimal } from "@/types/fleetReport.dto";
import { formatSecondsToHoursMinutes } from "../utils/fleetDuration";

export { formatSecondsToHoursMinutes };

export interface FleetHealthTableProps {
  coverage: FleetCoverage[];
  truckMap?: Record<string, string>;
}

export function FleetHealthTable({ coverage, truckMap }: FleetHealthTableProps) {
  const { t } = useTranslation();
  const [onlyIssues, setOnlyIssues] = useState(false);

  const filteredCoverage = useMemo(() => {
    if (!onlyIssues) {
      return coverage;
    }
    return coverage.filter((row) => {
      const gap = Number(row.gapSeconds) || 0;
      const conflict = Number(row.conflictSeconds) || 0;
      return gap > 0 || conflict > 0;
    });
  }, [coverage, onlyIssues]);

  const columns: ColumnsType<FleetCoverage> = useMemo(
    () => [
      {
        title: t("fleet.licensePlate", { defaultValue: "Biển số" }),
        dataIndex: "truckId",
        key: "licensePlate",
        render: (_: unknown, record: FleetCoverage) => {
          const plate = record.licensePlate || (truckMap && truckMap[record.truckId]);
          if (plate) {
            return (
              <Tooltip title={record.truckId}>
                <span style={{ fontWeight: 600 }}>{plate}</span>
              </Tooltip>
            );
          }
          return <span style={{ fontVariantNumeric: "tabular-nums" }}>{record.truckId}</span>;
        },
      },
      {
        title: t("fleet.scopeSeconds"),
        dataIndex: "scopeSeconds",
        key: "scopeSeconds",
        align: "right",
        render: (value: FleetDecimal | null) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          return (
            <Tooltip title={rawSeconds}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
            </Tooltip>
          );
        },
      },
      {
        title: t("fleet.membershipSeconds"),
        dataIndex: "membershipSeconds",
        key: "membershipSeconds",
        align: "right",
        render: (value: FleetDecimal | null) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          return (
            <Tooltip title={rawSeconds}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
            </Tooltip>
          );
        },
      },
      {
        title: t("fleet.capacitySeconds"),
        dataIndex: "capacitySeconds",
        key: "capacitySeconds",
        align: "right",
        render: (value: FleetDecimal | null) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          return (
            <Tooltip title={rawSeconds}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
            </Tooltip>
          );
        },
      },
      {
        title: t("fleet.productiveSeconds"),
        dataIndex: "productiveSeconds",
        key: "productiveSeconds",
        align: "right",
        render: (value: FleetDecimal | null) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          return (
            <Tooltip title={rawSeconds}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
            </Tooltip>
          );
        },
      },
      {
        title: t("fleet.gapSeconds"),
        dataIndex: "gapSeconds",
        key: "gapSeconds",
        align: "right",
        render: (value: FleetDecimal | null, record: FleetCoverage) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          const hasGap = (Number(record.gapSeconds) || 0) > 0;
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                width: "100%",
              }}
            >
              {hasGap && (
                <Tag color="warning" icon={<WarningOutlined />} style={{ margin: 0 }}>
                  {t("fleet.missingDataTag", { defaultValue: "Thiếu dữ liệu" })}
                </Tag>
              )}
              <Tooltip title={rawSeconds}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: t("fleet.conflictSeconds"),
        dataIndex: "conflictSeconds",
        key: "conflictSeconds",
        align: "right",
        render: (value: FleetDecimal | null, record: FleetCoverage) => {
          const { formatted, rawSeconds } = formatSecondsToHoursMinutes(value, t);
          const hasConflict = (Number(record.conflictSeconds) || 0) > 0;
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                width: "100%",
              }}
            >
              {hasConflict && (
                <Tooltip
                  title={t("fleet.conflictExplanationTooltip", {
                    defaultValue:
                      "Khoảng thời gian xảy ra xung đột giữa các trạng thái hoặc với năng lực xe",
                  })}
                >
                  <Tag
                    color="error"
                    icon={<CloseCircleOutlined />}
                    style={{ margin: 0, cursor: "help" }}
                  >
                    {t("fleet.timeConflictTag", { defaultValue: "Xung đột thời gian" })}
                  </Tag>
                </Tooltip>
              )}
              <Tooltip title={rawSeconds}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: t("fleet.eventCount"),
        dataIndex: "eventCount",
        key: "eventCount",
        align: "right",
        render: (value: number | null) => (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {value !== null && value !== undefined ? value : "—"}
          </span>
        ),
      },
    ],
    [t, truckMap],
  );

  return (
    <div style={{ maxWidth: "100%", width: "100%" }}>
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Space>
          <Switch
            id="fleet-gap-conflict-filter"
            checked={onlyIssues}
            onChange={setOnlyIssues}
            aria-label={t("fleet.filterOnlyIssues", { defaultValue: "Chỉ xe có gap/conflict" })}
          />
          <label
            htmlFor="fleet-gap-conflict-filter"
            style={{ cursor: "pointer", fontSize: 13, fontWeight: 500, userSelect: "none" }}
          >
            {t("fleet.filterOnlyIssues", { defaultValue: "Chỉ xe có gap/conflict" })}
          </label>
          {onlyIssues && (
            <Tag color="processing" style={{ marginLeft: 4 }}>
              {t("fleet.filteredCount", {
                count: filteredCoverage.length,
                total: coverage.length,
                defaultValue: `${filteredCoverage.length}/${coverage.length} xe`,
              })}
            </Tag>
          )}
        </Space>
      </div>

      <div style={{ maxWidth: "100%", overflowX: "auto" }}>
        <BaseTable
          rowKey="truckId"
          queryResult={{}}
          isFiltered={onlyIssues}
          onResetFilters={() => setOnlyIssues(false)}
          tableProps={{
            dataSource: filteredCoverage,
            pagination: {
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            },
            scroll: { x: "max-content" },
          }}
          columns={columns}
        />
      </div>
    </div>
  );
}
