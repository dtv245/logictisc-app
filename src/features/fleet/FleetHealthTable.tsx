import { useTranslation } from "react-i18next";
import { BaseTable } from "@/table/BaseTable";
import type { FleetCoverage } from "@/types/fleetReport.dto";

export function FleetHealthTable({ coverage }: { coverage: FleetCoverage[] }) {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <BaseTable
        rowKey="truckId"
        queryResult={{}}
        tableProps={{
          dataSource: coverage,
          pagination: { pageSize: 20 },
          scroll: { x: "max-content" },
        }}
        columns={[
          { title: t("fleet.truckId"), dataIndex: "truckId" },
          ...(
            [
              "scopeSeconds",
              "membershipSeconds",
              "capacitySeconds",
              "productiveSeconds",
              "gapSeconds",
              "conflictSeconds",
              "eventCount",
            ] as const
          ).map((field) => ({
            title: t(`fleet.${field}`),
            dataIndex: field,
            render: (value: string | number | null) => value ?? "—",
          })),
        ]}
      />
    </div>
  );
}
