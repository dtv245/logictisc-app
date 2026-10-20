import React from "react";
import { ArrowLeftOutlined, PhoneOutlined } from "@ant-design/icons";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import type { Load } from "@/types/load.types";
import { useTranslation } from "react-i18next";

export interface ShipmentHeaderProps {
  load: Load;
  driverPhone?: string;
}

export const ShipmentHeader: React.FC<ShipmentHeaderProps> = ({ load, driverPhone }) => {
  const { t } = useTranslation();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history && window.history.length > 1) {
      window.history.back();
    } else if (typeof window !== "undefined") {
      window.location.assign("/loads");
    }
  };

  const customerName = load.customerName || load.customerId || t("loads.redesign.customerFallback");

  return (
    <div className="shipment-header" data-testid="shipment-header">
      {/* Left side: Back Button, Breadcrumb, Title */}
      <div className="shipment-header__left">
        <button
          type="button"
          className="shipment-header__back-btn"
          onClick={handleBack}
          aria-label={t("loads.redesign.back")}
          data-testid="shipment-back-btn"
        >
          <ArrowLeftOutlined />
        </button>

        <div>
          <div className="shipment-header__breadcrumb">
            {t("loads.redesign.breadcrumb")} / {customerName} / #{load.number}
          </div>
          <div className="shipment-header__title-row">
            <h1 className="shipment-header__title">
              {load.name ? `${load.name} #${load.number}` : `${t("loads.redesign.loadLabel")} #${load.number}`}
            </h1>
            <StatusTag label={load.status} tone={statusTone(load.status)} />
          </div>
        </div>
      </div>

      {/* Right side: Action Pills */}
      <div className="shipment-header__right">
        {driverPhone && (
          <a
            href={`tel:${driverPhone}`}
            className="shipment-header__pill-btn"
            style={{ textDecoration: "none" }}
          >
            <PhoneOutlined /> {t("loads.redesign.callDriver")}
          </a>
        )}

        {load.assignedTruckNumber && (
          <div className="shipment-header__pill-btn">
            🚛 {load.assignedTruckNumber}
          </div>
        )}

        {load.deliveryCostAmount != null && load.deliveryCostCurrency && (
          <div className="shipment-header__pill-btn shipment-header__pill-btn--success">
            💰 {Number(load.deliveryCostAmount).toLocaleString()} {load.deliveryCostCurrency}
          </div>
        )}
      </div>
    </div>
  );
};
