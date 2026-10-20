import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Space, Tooltip } from "antd";
import {
  Bell,
  HelpCircle,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@hooks/useCurrentUser";
import { useCurrentTenant } from "@hooks/useCurrentTenant";
import { routes } from "@constants/routes";
import { Pill } from "./primitives";
import "./DashboardHeader.scss";

export interface DashboardHeaderProps {
  monitoringCount?: number;
  approvalsCount?: number;
  onRefresh?: () => void;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  monitoringCount,
  approvalsCount,
  className = "",
}) => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Keep the displayed shortcut in sync with the quick-search dialog.
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [searchOpen]);

  const now = dayjs();
  const hour = now.hour();
  let greeting = t("dashboard.opsView.greeting.morning");
  if (hour >= 12 && hour < 18) {
    greeting = t("dashboard.opsView.greeting.afternoon");
  } else if (hour >= 18) {
    greeting = t("dashboard.opsView.greeting.evening");
  }

  const userName = currentUser.data?.name || t("dashboard.opsView.greeting.nameFallback");
  const dateFormatted = new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language || "vi", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now.toDate());

  const handleSearch = (val: string) => {
    const search = val.trim();
    if (!search) return;
    setSearchOpen(false);
    const query = new URLSearchParams({
      current: "1",
      "filters[0][field]": "search",
      "filters[0][operator]": "contains",
      "filters[0][value]": search,
    });
    navigate(`${routes.resources.loads.list}?${query.toString()}`);
  };

  return (
    <header className={`ops-dashboard-header ${className}`}>
      {/* 1. Greeting Block */}
      <div className="ops-dashboard-header__greeting">
        <div className="ops-dashboard-header__date">{dateFormatted}</div>
        <h1 className="ops-dashboard-header__title">
          {greeting}, {userName}
        </h1>
        <p className="ops-dashboard-header__subtitle">
          {tenant?.tenantName ? `${tenant.tenantName} · ` : ""}
          {t("dashboard.opsView.subtitle")}
        </p>
      </div>

      {/* 2. Center Pill & Search */}
      <div className="ops-dashboard-header__center">
        <Pill
          className="ops-dashboard-header__pill"
          icon={<Sparkles size={14} />}
          onClick={() => navigate(routes.aiDispatch)}
          tone="ai"
        >
          {monitoringCount !== undefined && approvalsCount !== undefined
            ? t("dashboard.opsView.aiMonitoring", { monitoring: monitoringCount, approvals: approvalsCount })
            : t("dashboard.opsView.aiOpen")}
        </Pill>

        <Button
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          aria-label={t("dashboard.opsView.searchLabel")}
          className="ops-dashboard-header__search-trigger"
          onClick={() => setSearchOpen(true)}
          type="text"
        >
          <Search size={14} />
          <span>{t("dashboard.opsView.searchLabel")}...</span>
          <kbd>⌘K / Ctrl+K</kbd>
        </Button>
      </div>

      {/* 3. Header Actions */}
      <div className="ops-dashboard-header__actions">
        <Space size={8}>
          <Tooltip title={t("dashboard.opsView.createLoad")}>
            <Button
              className="ops-btn-primary"
              icon={<Plus size={15} style={{ marginRight: 4 }} />}
              onClick={() => navigate(routes.resources.loads.create)}
              type="primary"
            >
              {t("dashboard.opsView.createLoad")}
            </Button>
          </Tooltip>

          <Tooltip title={t("dashboard.opsView.notifications")}>
            <Button
              aria-label={t("dashboard.opsView.notifications")}
              className="ops-icon-btn"
              icon={<Bell size={16} />}
              onClick={() => navigate(routes.resources.notifications.list)}
            />
          </Tooltip>

          <Tooltip title={t("dashboard.opsView.help")}>
            <Button
              aria-label={t("dashboard.opsView.help")}
              className="ops-icon-btn"
              icon={<HelpCircle size={16} />}
              onClick={() => navigate(routes.diagnostics)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Quick search modal */}
      <Modal
        footer={null}
        keyboard
        onCancel={() => setSearchOpen(false)}
        open={searchOpen}
        title={t("dashboard.opsView.searchTitle")}
        width={520}
      >
        <Input.Search
          allowClear
          autoFocus
          enterButton={t("dashboard.opsView.searchButton")}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          placeholder={t("dashboard.opsView.searchPlaceholder")}
          size="large"
          value={searchQuery}
        />
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
          {t("dashboard.opsView.searchHelp")}
        </div>
      </Modal>
    </header>
  );
};
