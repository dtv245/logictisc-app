import React from "react";
import "./ShipmentDetail.scss";
import type { Load } from "@/types/load.types";
import { ShipmentHeroCard } from "./ShipmentHeroCard";
import { ShipmentLoadPlanCard } from "./ShipmentLoadPlanCard";
import { ShipmentDocumentsCard } from "./ShipmentDocumentsCard";
import { ShipmentAgentCard } from "./ShipmentAgentCard";
import { ShipmentGapsCard } from "./ShipmentGapsCard";
import { ShipmentTimelineCard } from "./ShipmentTimelineCard";

export interface ShipmentDetailViewProps {
  load: Load;
}

export const ShipmentDetailView: React.FC<ShipmentDetailViewProps> = ({ load }) => {
  const loadId = load?.id ? String(load.id) : "";

  return (
    <div className="shipment-detail-container" data-testid="load-overview-panel">
      {/* Main Two-Column Layout */}
      <div className="shipment-layout">
        {/* Left Column (~65%) */}
        <div className="shipment-layout__main">
          {/* Hero Card with SVG Truck & Progress Track */}
          <ShipmentHeroCard load={load} />

          {/* Subgrid: Load Plan & Documents */}
          <div className="shipment-subgrid">
            <ShipmentLoadPlanCard load={load} />
            <ShipmentDocumentsCard load={load} />
          </div>
        </div>

        {/* Right Column (~35%) */}
        <div className="shipment-layout__side">
          {/* AI Route Agent / Dispatch Card */}
          <ShipmentAgentCard loadId={loadId} />

          {/* AI Gaps Checklist Card */}
          <ShipmentGapsCard loadId={loadId} />

          {/* Shipment Timeline Card */}
          <ShipmentTimelineCard loadId={loadId} />
        </div>
      </div>
    </div>
  );
};
