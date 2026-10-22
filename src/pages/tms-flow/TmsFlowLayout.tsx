import { Button, Spin } from "antd";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { FlowDemoBanner } from "@/components/tms-flow/FlowDemoBanner";
import { TmsFlowTopbar } from "@/components/tms-flow/TmsFlowTopbar";
import { useTmsFlow } from "@/hooks/tms-flow/useTmsFlow";
import "@/styles/tms-flow.scss";

export function TmsFlowLayout() {
  const { state, reload, resetDemo } = useTmsFlow();
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    setResetting(true);
    void resetDemo().finally(() => setResetting(false));
  };

  if (state.status === "loading") {
    return (
      <div className="tms-flow tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Loading the TMS demo fixture…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="tms-flow tms-flow--centered">
        <div className="tms-panel" role="alert">
          <h1 className="tms-page__title">The demo could not load</h1>
          <p className="tms-muted">{state.error}</p>
          <Button icon={<RefreshCw size={15} aria-hidden="true" />} onClick={() => void reload()} type="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { snapshot } = state;

  return (
    <div className="tms-flow">
      <FlowDemoBanner onReset={handleReset} resetting={resetting} />
      <TmsFlowTopbar snapshot={snapshot} />
      <nav aria-label="TMS flow sections" className="tms-subnav">
        <NavLink className={({ isActive }) => `tms-subnav__link${isActive ? " is-active" : ""}`} end to="/tms">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `tms-subnav__link${isActive ? " is-active" : ""}`} to="/tms/dispatch">
          Dispatch
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
