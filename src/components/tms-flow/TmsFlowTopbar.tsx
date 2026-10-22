import { AutoComplete, Button, Popover } from "antd";
import { Bell, CircleHelp, Plus } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { TmsFlowSnapshot } from "@/types/tms-flow/tmsFlow.types";
import { DEMO_DATE_LABEL } from "@/utils/tms-flow/format";

export interface TmsFlowTopbarProps {
  snapshot: TmsFlowSnapshot;
}

export function TmsFlowTopbar({ snapshot }: TmsFlowTopbarProps) {
  const navigate = useNavigate();
  const openApprovals = snapshot.approvals.filter(
    (approval) => approval.state === "pending_approval" || approval.state === "under_review",
  ).length;

  const searchOptions = useMemo(
    () => [
      ...snapshot.shipments.map((shipment) => ({
        value: `shipment:${shipment.id}`,
        label: `${shipment.id} · ${shipment.customer} · ${shipment.origin} → ${shipment.destination}`,
      })),
      ...snapshot.drivers.map((driver) => ({
        value: `driver:${driver.name}`,
        label: `${driver.name} · Driver`,
      })),
    ],
    [snapshot.drivers, snapshot.shipments],
  );

  const handleSearchSelect = (value: string) => {
    if (value.startsWith("shipment:")) {
      navigate(`/tms/shipments/${value.slice("shipment:".length)}`);
      return;
    }
    navigate(`/tms/dispatch?q=${encodeURIComponent(value.replace("driver:", ""))}`);
  };

  return (
    <header className="tms-topbar">
      <div className="tms-topbar__identity">
        <span className="tms-topbar__date">{DEMO_DATE_LABEL}</span>
        <h1 className="tms-topbar__greeting">Good morning, Sarah</h1>
      </div>

      <AutoComplete
        aria-label="Search shipments or drivers"
        className="tms-topbar__search"
        data-testid="global-search"
        onSelect={handleSearchSelect}
        options={searchOptions}
        placeholder="Search shipment, customer, driver…"
      />

      <div className="tms-topbar__actions">
        <button className="tms-topbar__stat" onClick={() => navigate("/tms/dispatch")} type="button">
          <strong>{snapshot.kpis.active.toLocaleString("en-US")}</strong>
          <span>Monitoring</span>
        </button>
        <button
          className="tms-topbar__stat tms-topbar__stat--warning"
          onClick={() => navigate("/tms/dispatch?filter=approvals")}
          type="button"
        >
          <strong>{openApprovals}</strong>
          <span>Approvals</span>
        </button>
        <Button
          className="tms-topbar__new"
          data-testid="open-new-shipment"
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={() => navigate("/tms/shipments/new")}
          type="primary"
        >
          New shipment
        </Button>
        <Popover
          content={<p className="tms-topbar__popover">Demo notifications: 2 at-risk shipments and 1 route approval need attention.</p>}
          placement="bottomRight"
          title="Notifications"
          trigger="click"
        >
          <Button aria-label="Notifications" icon={<Bell size={16} aria-hidden="true" />} />
        </Popover>
        <Popover
          content={
            <p className="tms-topbar__popover">
              This is a fixture-backed UI demo. Use the banner to reset data. No backend call is made.
            </p>
          }
          placement="bottomRight"
          title="Demo help"
          trigger="click"
        >
          <Button aria-label="Help" icon={<CircleHelp size={16} aria-hidden="true" />} />
        </Popover>
      </div>
    </header>
  );
}
