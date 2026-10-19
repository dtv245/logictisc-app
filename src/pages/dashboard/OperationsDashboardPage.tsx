import { Alert, Switch } from "antd";
import { OperationsDashboardPreview } from "@/components/dashboard/OperationsDashboardPreview";
import { OperationsDashboardView } from "@/features/dashboard/components/OperationsDashboardView";
import { useOperationsPreview } from "@/hooks/dashboard/useOperationsPreview";
import "@/pages/dashboard/OperationsDashboardPage.scss";

export const OperationsDashboardPage = () => {
  const { isPreview, setPreviewEnabled } = useOperationsPreview();

  return (
    <div className="ops-page">
      <Alert
        className="ops-preview-controls"
        showIcon
        type={isPreview ? "warning" : "info"}
        message={isPreview ? "Đang xem dữ liệu mẫu Operations" : "Xem thử Operations với dữ liệu mẫu"}
        description={isPreview
          ? "Các số liệu, vị trí xe và đề xuất chỉ dùng để xem thử giao diện."
          : "Bật dữ liệu mẫu để khám phá KPI, chuyến hàng, bản đồ và lịch điều phối."}
        action={
          <Switch
            aria-label="Dữ liệu mẫu Operations"
            checkedChildren="Mẫu"
            unCheckedChildren="Thật"
            checked={isPreview}
            onChange={setPreviewEnabled}
          />
        }
      />
      {isPreview ? <OperationsDashboardPreview /> : <OperationsDashboardView />}
    </div>
  );
};

export default OperationsDashboardPage;
