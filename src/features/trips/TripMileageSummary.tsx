import { Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

export interface TripMileageSummaryProps {
  plannedDistanceMiles?: number | null;
  actualDistanceMiles?: number | null;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  legacyTotalDistance?: number | null;
}

const formatMiles = (
  miles: number | null | undefined,
  unavailableLabel: string,
): { value: string; isAvailable: boolean } => {
  if (miles === null || miles === undefined || !Number.isFinite(Number(miles))) {
    return { value: unavailableLabel, isAvailable: false };
  }
  return {
    value: `${Number(miles).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} mi`,
    isAvailable: true,
  };
};

export const TripMileageSummary = ({
  plannedDistanceMiles,
  actualDistanceMiles,
  loadedMiles,
  emptyMiles,
  legacyTotalDistance,
}: TripMileageSummaryProps) => {
  const { t } = useTranslation();
  const unavailableText = t("trips.mileage.unavailable", "N/A");

  const planned = formatMiles(plannedDistanceMiles, unavailableText);
  const actual = formatMiles(actualDistanceMiles, unavailableText);
  const loaded = formatMiles(loadedMiles, unavailableText);
  const empty = formatMiles(emptyMiles, unavailableText);

  return (
    <Card
      title={t("trips.mileage.title", "Mileage & Distance")}
      style={{ marginBottom: 16 }}
      data-testid="trip-mileage-summary"
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title={t("trips.mileage.plannedDistance", "Planned Distance")}
            value={planned.value}
            valueStyle={{
              color: planned.isAvailable ? undefined : "#8c8c8c",
              fontSize: 20,
            }}
            data-testid="mileage-planned"
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t("trips.mileage.actualDistance", "Actual Distance")}
            value={actual.value}
            valueStyle={{
              color: actual.isAvailable ? "#1890ff" : "#8c8c8c",
              fontSize: 20,
            }}
            data-testid="mileage-actual"
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t("trips.mileage.loadedMiles", "Loaded Miles")}
            value={loaded.value}
            valueStyle={{
              color: loaded.isAvailable ? "#52c41a" : "#8c8c8c",
              fontSize: 20,
            }}
            data-testid="mileage-loaded"
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t("trips.mileage.emptyMiles", "Empty Miles (Deadhead)")}
            value={empty.value}
            valueStyle={{
              color: empty.isAvailable ? "#fa8c16" : "#8c8c8c",
              fontSize: 20,
            }}
            data-testid="mileage-empty"
          />
        </Col>
      </Row>

      {legacyTotalDistance !== null &&
        legacyTotalDistance !== undefined &&
        Number.isFinite(Number(legacyTotalDistance)) && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #f0f0f0" }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t("trips.mileage.legacyNote", "Legacy Route Distance")}:{" "}
              <Tag color="default">
                {Number(legacyTotalDistance).toLocaleString()} mi
              </Tag>
            </Typography.Text>
          </div>
        )}
    </Card>
  );
};
