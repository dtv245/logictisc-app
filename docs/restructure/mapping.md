# Ma trận Mapping Tái cấu trúc Thư mục (src/features/ -> Global Structure)

Tài liệu này xác định đích đến của từng file từ `src/features/` chuyển sang cấu trúc thư mục tầng toàn cục (`src/`).
Quy tắc mapping tuân thủ `AGENTS.md`. Các file chưa rõ quy tắc được đánh dấu `?` để xin ý kiến người dùng.

---

## 1. Bảng phân loại quy tắc (Mapping Rules)

| Loại file | Mẫu tên | Đích đến | Ghi chú |
|---|---|---|---|
| API Call | `*.api.ts`, `*.query.ts`, `*.queries.ts` | `src/api/<domain>/` | Hàm gọi API, React Query options |
| Custom Hooks | `use*.ts`, `use*.tsx` | `src/hooks/<domain>/` | Logic nghiệp vụ React hooks |
| Refine Resources | `*.resource.ts` | `src/resources/` | Khai báo resource cho Refine |
| TypeScript Types | `*.types.ts`, `types.ts` | `src/types/<domain>/` | Type/Interface thuần |
| Pages / Screens | `*Page.tsx`, `*List.tsx`, `*Show.tsx`, `*Create.tsx`, `*Edit.tsx` | `src/pages/<domain>/` | Trang màn hình mỏng |
| UI Components | `*.tsx` (còn lại) | `src/components/<domain>/` | Component tái sử dụng |
| Hàm thuần tiện ích | `*.ts` trong `utils/` | `src/utils/` | Hàm thuần không React, không API |
| Kiểm thử | `*.test.ts`, `*.test.tsx` | Nằm cạnh file được test | Co-located unit/integration tests |
| Khác / Chưa rõ | `config/`, `store/`, `layers/`, `.scss` | `?` | Cần người dùng phê duyệt |

---

## 2. Chi tiết Mapping theo từng Domain

### 2.1. Domain thử nghiệm ưu tiên: `accidents` (3 file - 0 import chéo)
- **Lý do chọn**: Domain độc lập hoàn toàn, không có feature nào khác import vào. Có đầy đủ 3 thành phần tiêu biểu (resource, type, component) để kiểm chứng quy trình tái cấu trúc.
- `src/features/accidents/accidents.resource.ts` -> `src/resources/accidents.resource.ts`
- `src/features/accidents/types.ts` -> `src/types/accidents/accidents.types.ts`
- `src/features/accidents/components/columns.tsx` -> `src/components/accidents/columns.tsx`
- `src/tests/features/accidents/accidentColumns.test.tsx` -> `src/components/accidents/columns.test.tsx`

---

### 2.2. Các Domain độc lập nhỏ (2 - 4 file)

#### `containers` (2 file)
- `src/features/containers/containers.resource.ts` -> `src/resources/containers.resource.ts`
- `src/features/containers/components/columns.tsx` -> `src/components/containers/columns.tsx`
- `src/tests/features/containers/containerColumns.test.tsx` -> `src/components/containers/columns.test.tsx`

#### `employees` (2 file)
- `src/features/employees/employees.resource.ts` -> `src/resources/employees.resource.ts`
- `src/features/employees/components/columns.tsx` -> `src/components/employees/columns.tsx`
- `src/tests/features/employees/employeeColumns.test.tsx` -> `src/components/employees/columns.test.tsx`

#### `maintenance` (2 file)
- `src/features/maintenance/maintenance.resource.ts` -> `src/resources/maintenance.resource.ts`
- `src/features/maintenance/components/columns.tsx` -> `src/components/maintenance/columns.tsx`
- `src/tests/features/maintenance/maintenanceColumns.test.tsx` -> `src/components/maintenance/columns.test.tsx`

#### `trucks` (3 file)
- `src/features/trucks/trucks.resource.ts` -> `src/resources/trucks.resource.ts`
- `src/features/trucks/components/columns.tsx` -> `src/components/trucks/columns.tsx`
- `src/features/trucks/components/TruckForm.tsx` -> `src/components/trucks/TruckForm.tsx`

#### `load-board` (3 file)
- `src/features/load-board/load-board.resource.ts` -> `src/resources/load-board.resource.ts`
- `src/features/load-board/types.ts` -> `src/types/load-board/load-board.types.ts`
- `src/features/load-board/components/columns.tsx` -> `src/components/load-board/columns.tsx`

#### `hos-eld` (3 file)
- `src/features/hos-eld/hos-eld.resource.ts` -> `src/resources/hos-eld.resource.ts`
- `src/features/hos-eld/types.ts` -> `src/types/hos-eld/hos-eld.types.ts`
- `src/features/hos-eld/components/columns.tsx` -> `src/components/hos-eld/columns.tsx`

#### `dvir` (3 file)
- `src/features/dvir/dvir.resource.ts` -> `src/resources/dvir.resource.ts`
- `src/features/dvir/types.ts` -> `src/types/dvir/dvir.types.ts`
- `src/features/dvir/components/columns.tsx` -> `src/components/dvir/columns.tsx`

#### `expenses` (3 file)
- `src/features/expenses/expenses.resource.ts` -> `src/resources/expenses.resource.ts`
- `src/features/expenses/types.ts` -> `src/types/expenses/expenses.types.ts`
- `src/features/expenses/components/columns.tsx` -> `src/components/expenses/columns.tsx`

#### `conversations` (3 file)
- `src/features/conversations/conversations.resource.ts` -> `src/resources/conversations.resource.ts`
- `src/features/conversations/types.ts` -> `src/types/conversations/conversations.types.ts`
- `src/features/conversations/components/columns.tsx` -> `src/components/conversations/columns.tsx`

#### `products` (4 file)
- `src/features/products/products.resource.ts` -> `src/resources/products.resource.ts`
- `src/features/products/types.ts` -> `src/types/products/products.types.ts`
- `src/features/products/components/columns.tsx` -> `src/components/products/columns.tsx`
- `src/features/products/components/form.tsx` -> `src/components/products/form.tsx`

#### `customers` (4 file)
- `src/features/customers/customers.resource.ts` -> `src/resources/customers.resource.ts`
- `src/features/customers/components/columns.tsx` -> `src/components/customers/columns.tsx`
- `src/features/customers/components/CustomerForm.tsx` -> `src/components/customers/CustomerForm.tsx`
- `src/features/customers/components/CustomerCreateModal.tsx` -> `src/components/customers/CustomerCreateModal.tsx`

#### `payslips` (4 file)
- `src/features/payslips/api/payslip.api.ts` -> `src/api/payslips/payslip.api.ts`
- `src/features/payslips/components/PayslipPaymentStatus.tsx` -> `src/components/payslips/PayslipPaymentStatus.tsx`
- `src/features/payslips/components/PayslipSummary.tsx` -> `src/components/payslips/PayslipSummary.tsx`
- `src/features/payslips/utils/payslip.snapshot.ts` -> `src/utils/payslip.snapshot.ts`

#### `shipment-costs` (1 file)
- `src/features/shipment-costs/components/ShipmentCostTable.tsx` -> `src/components/shipment-costs/ShipmentCostTable.tsx`

#### `accessorials` (2 file)
- `src/features/accessorials/hooks/useAccessorialApproval.ts` -> `src/hooks/accessorials/useAccessorialApproval.ts`
- `src/features/accessorials/components/AccessorialChargesTable.tsx` -> `src/components/accessorials/AccessorialChargesTable.tsx`

---

### 2.3. Các Domain trung bình (5 - 10 file)

#### `payments` (5 file)
- `src/features/payments/payments.resource.ts` -> `src/resources/payments.resource.ts`
- `src/features/payments/types.ts` -> `src/types/payments/payments.types.ts`
- `src/features/payments/api/paymentCommands.ts` -> `src/api/payments/paymentCommands.ts`
- `src/features/payments/components/columns.tsx` -> `src/components/payments/columns.tsx`
- `src/features/payments/components/PaymentCommandForm.tsx` -> `src/components/payments/PaymentCommandForm.tsx`

#### `rates` (4 file)
- `src/features/rates/api/rateRule.api.ts` -> `src/api/rates/rateRule.api.ts`
- `src/features/rates/components/FscPolicyFields.tsx` -> `src/components/rates/FscPolicyFields.tsx`
- `src/features/rates/components/FscPreview.tsx` -> `src/components/rates/FscPreview.tsx`
- `src/features/rates/components/RatingAcceptance.tsx` -> `src/components/rates/RatingAcceptance.tsx`

#### `invoices` (5 file)
- `src/features/invoices/invoices.resource.ts` -> `src/resources/invoices.resource.ts`
- `src/features/invoices/api/billingCommands.ts` -> `src/api/invoices/billingCommands.ts`
- `src/features/invoices/components/columns.tsx` -> `src/components/invoices/columns.tsx`
- `src/features/invoices/components/PrimaryInvoiceForm.tsx` -> `src/components/invoices/PrimaryInvoiceForm.tsx`
- `src/features/invoices/utils/invoiceMutability.ts` -> `src/utils/invoiceMutability.ts`

#### `profitability` (6 file)
- `src/features/profitability/api/profitability.api.ts` -> `src/api/profitability/profitability.api.ts`
- `src/features/profitability/components/ProfitabilityBreakdownTable.tsx` -> `src/components/profitability/ProfitabilityBreakdownTable.tsx`
- `src/features/profitability/components/ProfitabilityFilters.tsx` -> `src/components/profitability/ProfitabilityFilters.tsx`
- `src/features/profitability/components/ProfitabilityMetricCard.tsx` -> `src/components/profitability/ProfitabilityMetricCard.tsx`
- `src/features/profitability/components/ProfitabilitySummary.tsx` -> `src/components/profitability/ProfitabilitySummary.tsx`
- `src/features/profitability/index.ts` -> `?` (Xoá bỏ index barrel sau khi chuyển xong các import)

#### `terminals` (7 file)
- `src/features/terminals/terminals.resource.ts` -> `src/resources/terminals.resource.ts`
- `src/features/terminals/components/columns.tsx` -> `src/components/terminals/columns.tsx`
- `src/features/terminals/components/TerminalContainersTab.tsx` -> `src/components/terminals/TerminalContainersTab.tsx`
- `src/features/terminals/components/TerminalForm.tsx` -> `src/components/terminals/TerminalForm.tsx`
- `src/features/terminals/components/TerminalSelect.tsx` -> `src/components/terminals/TerminalSelect.tsx`
- `src/features/terminals/config/terminal.constants.ts` -> `src/constants/terminal.constants.ts` (hoặc `?`)
- `src/features/terminals/index.ts` -> `?` (Xoá bỏ index barrel sau khi chuyển sang import trực tiếp)

#### `fleet` (8 file)
- `src/features/fleet/api/fleetReport.api.ts` -> `src/api/fleet/fleetReport.api.ts`
- `src/features/fleet/components/FleetCharts.tsx` -> `src/components/fleet/FleetCharts.tsx`
- `src/features/fleet/components/FleetHealthTable.tsx` -> `src/components/fleet/FleetHealthTable.tsx`
- `src/features/fleet/components/FleetKpiGrid.tsx` -> `src/components/fleet/FleetKpiGrid.tsx`
- `src/features/fleet/components/FleetMetricCard.tsx` -> `src/components/fleet/FleetMetricCard.tsx`
- `src/features/fleet/utils/fleetDateRange.ts` -> `src/utils/fleetDateRange.ts`
- `src/features/fleet/utils/fleetDuration.ts` -> `src/utils/fleetDuration.ts`
- `src/features/fleet/utils/fleetMetricFormat.ts` -> `src/utils/fleetMetricFormat.ts`

#### `notifications` (8 file)
- `src/features/notifications/notifications.resource.ts` -> `src/resources/notifications.resource.ts`
- `src/features/notifications/types.ts` -> `src/types/notifications/notifications.types.ts`
- `src/features/notifications/hooks/useNotificationActions.ts` -> `src/hooks/notifications/useNotificationActions.ts`
- `src/features/notifications/components/columns.tsx` -> `src/components/notifications/columns.tsx`
- `src/features/notifications/components/NotificationHeaderIcon.tsx` -> `src/components/notifications/NotificationHeaderIcon.tsx`
- `src/features/notifications/components/NotificationMarkAllRead.tsx` -> `src/components/notifications/NotificationMarkAllRead.tsx`
- `src/features/notifications/utils/notificationSound.ts` -> `src/utils/notificationSound.ts`
- `src/features/notifications/index.ts` -> `?` (Xoá sau khi chuyển xong callers)

#### `trips` (10 file)
- `src/features/trips/trips.resource.ts` -> `src/resources/trips.resource.ts`
- `src/features/trips/types.ts` -> `src/types/trips/trips.types.ts`
- `src/features/trips/api/tripExecution.api.ts` -> `src/api/trips/tripExecution.api.ts`
- `src/features/trips/components/columns.tsx` -> `src/components/trips/columns.tsx`
- `src/features/trips/components/TripDriverAssignments.tsx` -> `src/components/trips/TripDriverAssignments.tsx`
- `src/features/trips/components/TripMileageSummary.tsx` -> `src/components/trips/TripMileageSummary.tsx`
- `src/features/trips/components/TripStopActions.tsx` -> `src/components/trips/TripStopActions.tsx`
- `src/features/trips/components/TripStopsTimeline.tsx` -> `src/components/trips/TripStopsTimeline.tsx`
- `src/features/trips/hooks/useTripDriverAssignments.ts` -> `src/hooks/trips/useTripDriverAssignments.ts`
- `src/features/trips/hooks/useTripStopActions.ts` -> `src/hooks/trips/useTripStopActions.ts`

---

### 2.4. Các Domain lớn / phức tạp

#### `payroll` (12 file)
- `src/features/payroll/api/payroll.api.ts` -> `src/api/payroll/payroll.api.ts`
- `src/features/payroll/hooks/usePayrollActions.ts` -> `src/hooks/payroll/usePayrollActions.ts`
- `src/features/payroll/hooks/usePayrollPaymentActions.ts` -> `src/hooks/payroll/usePayrollPaymentActions.ts`
- `src/features/payroll/components/PayrollActions.tsx` -> `src/components/payroll/PayrollActions.tsx`
- `src/features/payroll/components/PayrollItemsTable.tsx` -> `src/components/payroll/PayrollItemsTable.tsx`
- `src/features/payroll/components/PayrollJurisdictionSummary.tsx` -> `src/components/payroll/PayrollJurisdictionSummary.tsx`
- `src/features/payroll/components/PayrollPaymentsPanel.tsx` -> `src/components/payroll/PayrollPaymentsPanel.tsx`
- `src/features/payroll/components/PayrollValidationPanel.tsx` -> `src/components/payroll/PayrollValidationPanel.tsx`
- `src/features/payroll/components/ReconcilePayrollPaymentModal.tsx` -> `src/components/payroll/ReconcilePayrollPaymentModal.tsx`
- `src/features/payroll/components/SchedulePayrollPaymentModal.tsx` -> `src/components/payroll/SchedulePayrollPaymentModal.tsx`
- `src/features/payroll/utils/paymentDisplay.ts` -> `src/utils/paymentDisplay.ts`
- `src/features/payroll/utils/payroll.snapshot.ts` -> `src/utils/payroll.snapshot.ts`

#### `loads` (13 file)
- `src/features/loads/loads.resource.ts` -> `src/resources/loads.resource.ts`
- `src/features/loads/types.ts` -> `src/types/loads/loads.types.ts`
- `src/features/loads/api/pickupBusinessDate.api.ts` -> `src/api/loads/pickupBusinessDate.api.ts`
- `src/features/loads/components/columns.tsx` -> `src/components/loads/columns.tsx`
- `src/features/loads/components/LoadDocumentsPanel.tsx` -> `src/components/loads/LoadDocumentsPanel.tsx`
- `src/features/loads/components/LoadExceptionsPanel.tsx` -> `src/components/loads/LoadExceptionsPanel.tsx`
- `src/features/loads/components/LoadFinancialPanel.tsx` -> `src/components/loads/LoadFinancialPanel.tsx`
- `src/features/loads/components/LoadFinancialSummary.tsx` -> `src/components/loads/LoadFinancialSummary.tsx`
- `src/features/loads/components/LoadForm.tsx` -> `src/components/loads/LoadForm.tsx`
- `src/features/loads/components/LoadOverviewPanel.tsx` -> `src/components/loads/LoadOverviewPanel.tsx`
- `src/features/loads/components/LoadTimelinePanel.tsx` -> `src/components/loads/LoadTimelinePanel.tsx`
- `src/features/loads/components/LoadTripPanel.tsx` -> `src/components/loads/LoadTripPanel.tsx`
- `src/features/loads/components/PickupBusinessDateForm.tsx` -> `src/components/loads/PickupBusinessDateForm.tsx`

#### `optimization` (11 file)
- `src/features/optimization/api/optimization.api.ts` -> `src/api/optimization/optimization.api.ts`
- `src/features/optimization/hooks/useOptimizationActions.ts` -> `src/hooks/optimization/useOptimizationActions.ts`
- `src/features/optimization/components/OptimizationCandidateDrawer.tsx` -> `src/components/optimization/OptimizationCandidateDrawer.tsx`
- `src/features/optimization/components/OptimizationCandidateTable.tsx` -> `src/components/optimization/OptimizationCandidateTable.tsx`
- `src/features/optimization/components/OptimizationError.tsx` -> `src/components/optimization/OptimizationError.tsx`
- `src/features/optimization/components/OptimizationRunForm.tsx` -> `src/components/optimization/OptimizationRunForm.tsx`
- `src/features/optimization/components/rejectionCodes.tsx` -> `src/components/optimization/rejectionCodes.tsx`
- `src/features/optimization/visualizations/CandidateHosTimeline.tsx` -> `src/components/optimization/CandidateHosTimeline.tsx`
- `src/features/optimization/visualizations/CandidateRouteMap.tsx` -> `src/components/optimization/CandidateRouteMap.tsx`
- `src/features/optimization/visualizations/CandidateVisualizations.tsx` -> `src/components/optimization/CandidateVisualizations.tsx`
- `src/features/optimization/visualizations/routeGeometry.ts` -> `src/utils/routeGeometry.ts` (hoặc `?`)

#### `settlements` (18 file)
- `src/features/settlements/api/driverPayPolicy.api.ts` -> `src/api/settlements/driverPayPolicy.api.ts`
- `src/features/settlements/api/driverPayPolicy.query.ts` -> `src/api/settlements/driverPayPolicy.query.ts`
- `src/features/settlements/api/settlement.api.ts` -> `src/api/settlements/settlement.api.ts`
- `src/features/settlements/api/settlement.keys.ts` -> `src/api/settlements/settlement.keys.ts`
- `src/features/settlements/api/settlement.query.ts` -> `src/api/settlements/settlement.query.ts`
- `src/features/settlements/api/settlementRevenue.api.ts` -> `src/api/settlements/settlementRevenue.api.ts`
- `src/features/settlements/hooks/useSettlementActions.ts` -> `src/hooks/settlements/useSettlementActions.ts`
- `src/features/settlements/components/CalculateSettlementModal.tsx` -> `src/components/settlements/CalculateSettlementModal.tsx`
- `src/features/settlements/components/CreateAdjustmentModal.tsx` -> `src/components/settlements/CreateAdjustmentModal.tsx`
- `src/features/settlements/components/DriverPayPolicyForm.tsx` -> `src/components/settlements/DriverPayPolicyForm.tsx`
- `src/features/settlements/components/DriverPayPolicyVersionHistory.tsx` -> `src/components/settlements/DriverPayPolicyVersionHistory.tsx`
- `src/features/settlements/components/SettlementActions.tsx` -> `src/components/settlements/SettlementActions.tsx`
- `src/features/settlements/components/SettlementAdjustments.tsx` -> `src/components/settlements/SettlementAdjustments.tsx`
- `src/features/settlements/components/SettlementAudit.tsx` -> `src/components/settlements/SettlementAudit.tsx`
- `src/features/settlements/components/settlement.columns.tsx` -> `src/components/settlements/settlement.columns.tsx`
- `src/features/settlements/components/SettlementFilters.tsx` -> `src/components/settlements/SettlementFilters.tsx`
- `src/features/settlements/components/SettlementLinesTable.tsx` -> `src/components/settlements/SettlementLinesTable.tsx`
- `src/features/settlements/components/SettlementSummary.tsx` -> `src/components/settlements/SettlementSummary.tsx`

#### `executive` (22 file)
- `src/features/executive/api/executive.queries.ts` -> `src/api/executive/executive.queries.ts`
- `src/features/executive/hooks/useIntlLocale.ts` -> `src/hooks/executive/useIntlLocale.ts`
- `src/features/executive/types.ts` -> `src/types/executive/executive.types.ts`
- `src/features/executive/components/*` -> `src/components/executive/*`
- `src/features/executive/utils/*` -> `src/utils/*`
- `src/features/executive/config/executive.constants.ts` -> `?` (`src/constants/executive.constants.ts`?)
- `src/features/executive/config/executive.contract.ts` -> `?` (`src/constants/contracts.ts`?)
- `src/features/executive/config/executive.rules.ts` -> `?` (`src/utils/executive.rules.ts`?)

#### `map` (17 file)
- `src/features/map/types.ts` -> `src/types/map/map.types.ts`
- `src/features/map/hooks/useDeliveryPoints.ts` -> `src/hooks/map/useDeliveryPoints.ts`
- `src/features/map/hooks/useGeocode.ts` -> `src/hooks/map/useGeocode.ts`
- `src/features/map/hooks/useRoutes.ts` -> `src/hooks/map/useRoutes.ts`
- `src/features/map/components/*` -> `src/components/map/*`
- `src/features/map/lib/polyline.ts` -> `src/utils/polyline.ts`
- `src/features/map/lib/geo.ts` -> `src/utils/geo.ts`
- `src/features/map/lib/h3.ts` -> `src/utils/h3.ts`
- `src/features/map/layers/*` -> `?` (`src/components/map/layers/*`?)
- `src/features/map/store/*` -> `?` (`src/stores/mapStore.ts`?)

---

## 3. Danh sách mục cần người dùng duyệt (`?`)
1. **Config và Contracts (`executive.contract.ts`, `terminal.constants.ts`)**: Nên gom về `src/constants/` hay `src/config/`?
2. **Layer và Store của `map` (`src/features/map/layers/`, `store/`)**: Nên tổ chức thành `src/components/map/layers/` và `src/stores/`?
3. **Các file barrel `index.ts` hiện có (`notifications`, `terminals`, `profitability`)**: Xoá bỏ hoàn toàn và chuyển hết sang import trực tiếp bằng `@/` theo Rule 4.
