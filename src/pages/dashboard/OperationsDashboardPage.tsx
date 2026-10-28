import { OperationsDashboardView } from "@/features/dashboard/components/OperationsDashboardView";
import "@/pages/dashboard/OperationsDashboardPage.scss";

export const OperationsDashboardPage = () => {
  return (
    <div className="ops-page">
      <OperationsDashboardView />
    </div>
  );
};

export default OperationsDashboardPage;
