/** Read-only authored policy: backend V1 supports INDEX_BASED_MPG only. */
import { Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { financialAmount } from "@/features/profitability/financialDisplay";
import type { IndexBasedFscPolicy } from "@/types/rateRule.dto";

export function FscPolicyFields({ policy }: { policy: IndexBasedFscPolicy }) {
  const { t, i18n } = useTranslation();
  return <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
    { key: "method", label: t("rating.fscMethod"), children: t("rating.indexBasedMpg") },
    { key: "basis", label: t("rating.mileageBasis"), children: policy.mileageBasis },
    { key: "provider", label: t("rating.indexProvider"), children: policy.indexProvider },
    { key: "region", label: t("rating.indexRegion"), children: policy.indexRegion },
    { key: "age", label: t("rating.maxIndexAgeDays"), children: policy.maxIndexAgeDays ?? "—" },
    { key: "mpg", label: t("rating.contractMpg"), children: policy.contractMpg ?? "—" },
    { key: "price", label: t("rating.baseFuelPrice"), children: financialAmount(policy.baseFuelPrice, policy.priceCurrency, i18n.language) },
    { key: "unit", label: t("rating.priceUnit"), children: policy.priceUnit },
  ]} />;
}
