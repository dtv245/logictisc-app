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

  const now = dayjs();
  const hour = now.hour();
  let greeting = "Chào buổi sáng";
  if (hour >= 12 && hour < 18) {
    greeting = "Chào buổi chiều";
  } else if (hour >= 18) {
    greeting = "Chào buổi tối";
  }

  const userName = currentUser.data?.name || "Điều phối viên";
  const dateFormatted = now.format("dddd, DD/MM/YYYY");

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
          Theo dõi hành trình, trạng thái xe và các đề xuất điều phối tự động.
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
            ? `Giám sát ${monitoringCount} · ${approvalsCount} chờ duyệt`
            : "Mở AI Dispatch"}
        </Pill>

        <Button
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          aria-label="Tìm chuyến hàng, tài xế"
          className="ops-dashboard-header__search-trigger"
          onClick={() => setSearchOpen(true)}
          type="text"
        >
          <Search size={14} />
          <span>Tìm chuyến hàng, tài xế...</span>
          <kbd>⌘K / Ctrl+K</kbd>
        </Button>
      </div>

      {/* 3. Header Actions */}
      <div className="ops-dashboard-header__actions">
        <Space size={8}>
          <Tooltip title="Tạo đơn hàng vận chuyển mới">
            <Button
              className="ops-btn-primary"
              icon={<Plus size={15} style={{ marginRight: 4 }} />}
              onClick={() => navigate(routes.resources.loads.create)}
              type="primary"
            >
              Tạo đơn hàng
            </Button>
          </Tooltip>

          <Tooltip title="Thông báo hệ thống">
            <Button
              aria-label="Thông báo"
              className="ops-icon-btn"
              icon={<Bell size={16} />}
              onClick={() => navigate(routes.resources.notifications.list)}
            />
          </Tooltip>

          <Tooltip title="Trợ giúp & Tài liệu điều phối">
            <Button
              aria-label="Trợ giúp"
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
        onCancel={() => setSearchOpen(false)}
        open={searchOpen}
        title="Tìm kiếm nhanh toàn hệ thống"
        width={520}
      >
        <Input.Search
          allowClear
          autoFocus
          enterButton="Tìm"
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          placeholder="Nhập mã đơn hàng, biển số xe, tên tài xế..."
          size="large"
          value={searchQuery}
        />
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
          Gợi ý: Nhập mã đơn (VD: LD-), biển số xe hoặc bấm Enter để chuyển đến danh sách tìm kiếm.
        </div>
      </Modal>
    </header>
  );
};
