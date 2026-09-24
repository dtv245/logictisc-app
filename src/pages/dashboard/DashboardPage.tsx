/**
 * Executive Overview — màn hình điều hành của ban lãnh đạo.
 *
 * Mục tiêu: trong 30 giây trả lời được "công ty đang khỏe hay không, nếu không
 * thì vấn đề nằm ở đâu và nguyên nhân chính là gì".
 *
 * Trang này CỐ TÌNH mỏng: nó chỉ lắp ráp. Toàn bộ ngưỡng tham chiếu, luật sinh
 * kết luận và cách tính chỉ số nằm trong `src/features/executive/`.
 *
 * Mọi chỉ số đều tự khai báo nguồn dữ liệu. Chỉ số chưa có endpoint tổng hợp ở
 * backend sẽ hiển thị khung trống kèm lý do và tên endpoint còn thiếu — tuyệt
 * đối không hiện số ước lượng. Xem `executive.metrics.ts`.
 */

import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@components/PageHeader";
import { routes } from "@constants/routes";
import { AgingSection } from "@features/executive/components/AgingSection";
import { CustomerSection } from "@features/executive/components/CustomerSection";
import { ExecutiveFilterBar } from "@features/executive/components/ExecutiveFilterBar";
import { FinancialSection } from "@features/executive/components/FinancialSection";
import { InsightPanel } from "@features/executive/components/InsightPanel";
import { MetricCard } from "@features/executive/components/MetricCard";
import { MetricGroupSection } from "@features/executive/components/MetricGroupSection";
import { ReferenceLegend } from "@features/executive/components/ReferenceChip";
import { SectionCard } from "@features/executive/components/SectionCard";
import { DISPLAY_CURRENCY, DEFAULT_RANGE_MONTHS } from "@features/executive/executive.constants";
import { CUSTOMER_CONCENTRATION_THRESHOLD, TOP1_CONCENTRATION_THRESHOLD } from "@features/executive/executive.refs";
import { UNAVAILABLE_METRIC } from "@features/executive/executive.metrics";
import { useExecutiveData } from "@features/executive/executive.queries";
import type { FleetType } from "@features/executive/executive.refs";
import type { ExecutiveFilters } from "@/types/executive.types";
import "./DashboardPage.scss";

const INITIAL_FILTERS: ExecutiveFilters = {
  rangeMonths: DEFAULT_RANGE_MONTHS,
  region: "",
  businessUnit: "",
  fleetType: "",
  customerSegment: "",
  comparison: "previousPeriod",
};

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ExecutiveFilters>(INITIAL_FILTERS);

  // Bộ lọc "tất cả loại đội xe" nghĩa là không có ngưỡng ngành nào áp dụng
  // chung — chuyển thành `null` để lớp ngưỡng đánh dấu notApplicable.
  const fleetType = useMemo<FleetType | null>(
    () => (filters.fleetType === "" ? null : (filters.fleetType as FleetType)),
    [filters.fleetType],
  );

  const data = useExecutiveData(fleetType, filters.rangeMonths);

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  return (
    <Space direction="vertical" size="large" className="exec-page">
      <PageHeader
        description={t("executive.description")}
        extra={
          // Drill-down sang màn hình điều phối. Đây là đường duy nhất đi từ
          // "công ty đang thế nào" xuống "xe nào đang ở đâu" mà không cần đổi
          // màn hình mặc định của ban điều hành.
          <Button
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={() => navigate(routes.operations)}
            type="link"
          >
            {t("executive.cta.viewOperations")}
          </Button>
        }
        title={t("executive.title")}
      />

      <ExecutiveFilterBar
        businessUnitOptions={[]}
        customerSegmentOptions={[]}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        regionOptions={[]}
      />

      <ReferenceLegend />

      {/* 1. Chỉ số North Star */}
      <SectionCard
        question={t("executive.sections.northStar.question")}
        title={t("executive.sections.northStar.title")}
      >
        <div className="exec-metrics">
          {data.northStar.map((model) => (
            <MetricCard
              currency={DISPLAY_CURRENCY}
              emphasis
              key={model.definition.id}
              model={model}
            />
          ))}
        </div>
      </SectionCard>

      {/* 2. Kết luận nhanh */}
      <SectionCard
        question={t("executive.sections.insights.question")}
        title={t("executive.sections.insights.title")}
      >
        <InsightPanel
          awaitingData={data.awaitingData}
          insights={data.insights}
          isLoading={data.isLoading}
        />
        <Typography.Text className="exec-card__footnote" type="secondary">
          {t("executive.sections.insights.orderingNote")}
        </Typography.Text>
      </SectionCard>

      {/* 3. Tài chính */}
      <FinancialSection
        costCategories={data.costCategories}
        costPerMileTarget={
          data.definitions
            .find((definition) => definition.id === "costPerMile")
            ?.references.find(
              (reference) => reference.kind === "internalTarget",
            ) ?? null
        }
        currency={DISPLAY_CURRENCY}
        points={data.monthlyPoints}
        reasonKey={data.monthlyReasonKey}
        totalMiles={data.totalMiles}
      />

      {/* 4. Hiệu quả vận hành */}
      <MetricGroupSection
        currency={DISPLAY_CURRENCY}
        definitions={data.operationalDefinitions}
        question={t("executive.sections.operational.question")}
        readings={data.operationalReadings}
        title={t("executive.sections.operational.title")}
      />

      {/* 5. Sức khỏe đội xe */}
      <MetricGroupSection
        currency={DISPLAY_CURRENCY}
        definitions={data.fleetHealthDefinitions}
        question={t("executive.sections.fleetHealth.question")}
        readings={data.fleetHealthReadings}
        title={t("executive.sections.fleetHealth.title")}
      />

      {/* 6. Tập trung khách hàng */}
      <CustomerSection
        concentrationThreshold={CUSTOMER_CONCENTRATION_THRESHOLD}
        currency={DISPLAY_CURRENCY}
        hhi={data.concentration?.hhi ?? UNAVAILABLE_METRIC}
        reasonKey={data.concentrationReasonKey}
        rows={data.concentration?.rows ?? null}
        top1Share={data.concentration?.top1Share ?? UNAVAILABLE_METRIC}
        top1Threshold={TOP1_CONCENTRATION_THRESHOLD}
        top3Share={data.concentration?.top3Share ?? UNAVAILABLE_METRIC}
        top5Share={data.concentration?.top5Share ?? UNAVAILABLE_METRIC}
      />

      {/* 7. Tuổi nợ phải thu */}
      <AgingSection
        aging={data.aging}
        currency={DISPLAY_CURRENCY}
        reasonKey={data.agingReasonKey}
      />
    </Space>
  );
};
