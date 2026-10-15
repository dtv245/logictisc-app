import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  Col,
  Empty,
  Pagination,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FleetCoverage, FleetReport } from "@/types/fleetReport.dto";
import { formatSecondsToHoursMinutes } from "../utils/fleetDuration";

export interface FleetChartsProps {
  report: FleetReport;
  truckMap?: Record<string, string>;
}

const MILEAGE_COLORS = ["#10b981", "#f59e0b"];

export const FleetCharts: React.FC<FleetChartsProps> = ({ report, truckMap }) => {
  const { t } = useTranslation();
  const [truckPage, setTruckPage] = useState(1);
  const pageSize = 10;

  // 1. Data for Horizontal Bar Chart: % Utilization per vehicle
  const truckUtilizationData = useMemo(() => {
    return report.coverage.map((c: FleetCoverage) => {
      const cap = Number(c.capacitySeconds) || 0;
      const prod = Number(c.productiveSeconds) || 0;
      const util = cap > 0 ? Number(((prod / cap) * 100).toFixed(2)) : 0;
      const plate = c.licensePlate || (truckMap && truckMap[c.truckId]);
      const label = plate || c.truckId.slice(0, 8);
      const fullName = plate ? `${plate} (${c.truckId.slice(0, 8)})` : c.truckId;
      return {
        truckId: c.truckId,
        label,
        fullName,
        utilization: util,
        productiveSeconds: c.productiveSeconds,
        capacitySeconds: c.capacitySeconds,
        gapSeconds: c.gapSeconds,
        conflictSeconds: c.conflictSeconds,
        hasGap: (Number(c.gapSeconds) || 0) > 0,
        hasConflict: (Number(c.conflictSeconds) || 0) > 0,
      };
    });
  }, [report.coverage, truckMap]);

  // Paginated truck slice for large fleets
  const paginatedTrucks = useMemo(() => {
    const start = (truckPage - 1) * pageSize;
    return truckUtilizationData.slice(start, start + pageSize);
  }, [truckUtilizationData, truckPage]);

  // Dynamic height based on number of trucks displayed
  const barChartHeight = Math.max(220, paginatedTrucks.length * 36 + 40);

  // 2. Data for Donut Chart: Loaded vs Empty miles (only when real mileage data exists)
  const hasRealMileageData = useMemo(() => {
    const loaded = report.loadedMilesPercent;
    return (
      loaded?.availability === "AVAILABLE" &&
      loaded?.value !== null &&
      Number(loaded.value) >= 0
    );
  }, [report.loadedMilesPercent]);

  const mileageDonutData = useMemo(() => {
    if (!hasRealMileageData) return null;
    const loadedPercent = Number(report.loadedMilesPercent.value);
    const deadhead = report.deadheadPercent;
    const emptyPercent =
      deadhead?.availability === "AVAILABLE" && deadhead?.value !== null
        ? Number(deadhead.value)
        : Math.max(0, 100 - loadedPercent);

    return [
      {
        name: t("fleet.charts.loadedMiles", { defaultValue: "Dặm có hàng (Loaded)" }),
        value: loadedPercent,
      },
      {
        name: t("fleet.charts.emptyMiles", { defaultValue: "Dặm rỗng (Empty)" }),
        value: emptyPercent,
      },
    ];
  }, [hasRealMileageData, report.loadedMilesPercent, report.deadheadPercent, t]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {t("fleet.charts.title", { defaultValue: "Biểu đồ trực quan" })}
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {/* Horizontal Bar Chart: % Utilization per vehicle */}
        <Col xs={24} lg={hasRealMileageData ? 14 : 24}>
          <Card
            variant="outlined"
            title={t("fleet.charts.utilizationByTruck", { defaultValue: "% Mức sử dụng theo xe" })}
            extra={
              truckUtilizationData.length > pageSize && (
                <Pagination
                  size="small"
                  current={truckPage}
                  pageSize={pageSize}
                  total={truckUtilizationData.length}
                  onChange={setTruckPage}
                  showSizeChanger={false}
                />
              )
            }
          >
            {truckUtilizationData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
            ) : (
              <div style={{ width: "100%", height: barChartHeight }}>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 500, height: barChartHeight }}
                >
                  <BarChart
                    data={paginatedTrucks}
                    layout="vertical"
                    margin={{ top: 8, right: 32, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 11, fill: "#374151" }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0]?.payload;
                        if (!data) return null;
                        const prodFormatted = formatSecondsToHoursMinutes(
                          data.productiveSeconds,
                          t,
                        ).formatted;
                        const capFormatted = formatSecondsToHoursMinutes(
                          data.capacitySeconds,
                          t,
                        ).formatted;
                        return (
                          <div
                            style={{
                              background: "#fff",
                              padding: "8px 12px",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.fullName}</div>
                            <div>
                              {t("fleet.metrics.FLEET_UTILIZATION_PERCENT", {
                                defaultValue: "Hiệu suất sử dụng",
                              })}
                              : <strong>{data.utilization}%</strong>
                            </div>
                            <div>
                              {t("fleet.productiveSeconds")}: {prodFormatted}
                            </div>
                            <div>
                              {t("fleet.capacitySeconds")}: {capFormatted}
                            </div>
                            {data.hasGap && (
                              <div style={{ color: "#d97706", marginTop: 4 }}>
                                ⚠ {t("fleet.missingDataTag", { defaultValue: "Thiếu dữ liệu" })}
                              </div>
                            )}
                            {data.hasConflict && (
                              <div style={{ color: "#dc2626", marginTop: 2 }}>
                                ✖ {t("fleet.timeConflictTag", { defaultValue: "Xung đột thời gian" })}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="utilization" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {paginatedTrucks.map((entry) => {
                        let fill = "#1890ff";
                        if (entry.hasConflict) fill = "#ef4444";
                        else if (entry.hasGap) fill = "#f59e0b";
                        else if (entry.utilization >= 75) fill = "#10b981";
                        return <Cell key={entry.truckId} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Donut Chart: Loaded vs Empty Miles (rendered ONLY when real mileage data exists) */}
        {hasRealMileageData && mileageDonutData && (
          <Col xs={24} lg={10}>
            <Card
              variant="outlined"
              title={t("fleet.charts.loadedVsEmptyMiles", {
                defaultValue: "Tỷ trọng dặm có hàng vs dặm rỗng",
              })}
            >
              <div style={{ width: "100%", height: 260, position: "relative" }}>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 400, height: 260 }}
                >
                  <PieChart>
                    <Pie
                      data={mileageDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mileageDonutData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MILEAGE_COLORS[index % MILEAGE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val) => [`${val}%`, "Tỷ lệ"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center summary text */}
                <div
                  style={{
                    position: "absolute",
                    top: "44%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                    {report.loadedMilesPercent.value}%
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {t("fleet.charts.loadedMiles", { defaultValue: "Có hàng" })}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Gantt Timeline Section - Requirement 4 */}
      <Card
        variant="outlined"
        title={t("fleet.charts.ganttTitle", {
          defaultValue: "Tiến độ hoạt động theo xe (Gantt)",
        })}
      >
        <Alert
          type="info"
          showIcon
          message={t("fleet.charts.ganttMissingNotice", {
            defaultValue:
              "Chưa thể dựng biểu đồ Gantt: API GET /api/reports/fleet/utilization-history chưa trả về danh sách các khoảng thời gian sự kiện chi tiết (intervals/events).",
          })}
          description={
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>
                {t("fleet.charts.ganttMissingFieldsTitle", {
                  defaultValue: "Các trường còn thiếu từ API:",
                })}
              </Typography.Text>
              <ul style={{ margin: "6px 0 12px 18px", padding: 0 }}>
                <li>
                  <code>events</code> / <code>intervals</code>: Danh sách các khoảng thời gian sự
                  kiện diễn ra trong kỳ của từng xe.
                </li>
                <li>
                  <code>occurredAt</code> / <code>from</code> (hoặc <code>startTime</code>): Thời điểm
                  bắt đầu của từng khoảng thời gian (theo múi giờ <code>businessZoneId</code>:{" "}
                  {report.period?.businessZoneId || "UTC"}).
                </li>
                <li>
                  <code>validUntil</code> / <code>to</code> (hoặc <code>endTime</code>): Thời điểm kết
                  thúc của từng khoảng thời gian.
                </li>
                <li>
                  <code>classification</code>: Phân loại trạng thái của từng đoạn (
                  <code>PRODUCTIVE</code>, <code>NON_PRODUCTIVE</code>, <code>EXCLUDED</code>,{" "}
                  <code>GAP</code>, <code>CONFLICT</code>).
                </li>
              </ul>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                DTO <code>FleetHistory.Report</code> hiện tại chỉ cung cấp dữ liệu tổng hợp{" "}
                <code>coverage</code> (tổng số giây <code>scopeSeconds</code>,{" "}
                <code>membershipSeconds</code>, <code>capacitySeconds</code>,{" "}
                <code>productiveSeconds</code>, <code>gapSeconds</code>, <code>conflictSeconds</code>
                ). Tạm dừng dựng biểu đồ Gantt theo đúng yêu cầu đặc tả cho đến khi API cung cấp cấu
                trúc sự kiện chi tiết.
              </Typography.Paragraph>
            </div>
          }
        />

        {/* Legend kèm chữ theo đặc tả requirement 4 */}
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong style={{ fontSize: 13, marginRight: 12 }}>
            {t("fleet.charts.ganttLegend", { defaultValue: "Chú thích trạng thái" })}:
          </Typography.Text>
          <Space wrap size={[8, 8]}>
            <Tag color="#10b981">
              {t("fleet.charts.ganttProductive", { defaultValue: "Hoạt động (Productive)" })}
            </Tag>
            <Tag color="#f59e0b">
              {t("fleet.charts.ganttNonProductive", {
                defaultValue: "Không hoạt động (Non-productive)",
              })}
            </Tag>
            <Tag color="#9ca3af">
              {t("fleet.charts.ganttExcluded", { defaultValue: "Loại trừ (Excluded)" })}
            </Tag>
            <Tag
              style={{
                background: "transparent",
                backgroundImage:
                  "repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 4px, transparent 4px, transparent 8px)",
                borderColor: "#9ca3af",
                color: "#4b5563",
              }}
            >
              {t("fleet.charts.ganttGap", { defaultValue: "Thiếu dữ liệu (Gap)" })}
            </Tag>
            <Tag
              style={{
                background: "#fef2f2",
                borderColor: "#ef4444",
                borderWidth: 2,
                color: "#b91c1c",
              }}
            >
              {t("fleet.charts.ganttConflict", { defaultValue: "Xung đột (Conflict)" })}
            </Tag>
          </Space>
        </div>
      </Card>
    </Space>
  );
};
