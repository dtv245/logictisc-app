# LOGISTICSX — FRONTEND IMPLEMENTATION & UX SPECIFICATION

**File:** `plan-frontend.md`  
**Version:** 1.0 — Backend-Flow-Aligned Frontend Specification  
**Target:** React + TypeScript + Vite + Refine + Ant Design  
**Backend alignment:** current Spring Boot flow and `plan-convention-v3-implementation-ready.md`  
**Required audit before implementation:** `docs/frontend-context-current.md`

---

# 0. MỤC TIÊU

Frontend LogisticsX không được phát triển như tập hợp các màn CRUD rời rạc.

UI phải phản ánh đúng business flow backend:

```text
Customer
   ↓
Load
   ↓
Trip / Dispatch
   ↓
Driver Assignment
   ↓
Execution / Stops / Documents
   ↓
Expense / Maintenance / Accessorial
   ↓
Shipment Cost
   ↓
Revenue / Profitability
   ↓
Driver Settlement
   ↓
Payroll / Payslip / Payment
```

Song song:

```text
Load + Truck + Driver + HOS
+ Cost + Revenue
        ↓
Dispatch Optimization
```

và:

```text
Truck activity history
        ↓
Fleet Utilization / Fleet Health
        ↓
Executive Dashboard
```

Frontend phải làm rõ:
- current business state;
- action nào hợp lệ;
- action nào bị khóa;
- dependency nào chưa đủ;
- dữ liệu nào AVAILABLE/PARTIAL/UNAVAILABLE;
- quyền của user;
- backend blocker nếu có.

Frontend **không tự tính lại authoritative accounting/payroll/KPI** nếu backend đã có calculator/report endpoint.

---

# 1. SOURCE OF TRUTH

Ưu tiên:

1. `docs/frontend-context-current.md`
2. Runtime OpenAPI / backend controller contract
3. `plan-convention-v3-implementation-ready.md`
4. `plan-progress-summary.md`
5. Frontend source hiện tại
6. Existing tests
7. Tài liệu cũ chỉ dùng tham khảo

Nếu runtime khác plan:

```text
DO NOT GUESS
```

Đánh dấu:

```text
FRONTEND_CONTRACT_BLOCKED
```

Không tạo mock production để che backend thiếu.

---

# 2. ENGINEERING PRINCIPLES

## 2.1 Mỗi màn chỉ fetch dữ liệu của chính nó

Bắt buộc:

```text
Screen A mount
    -> chỉ fetch data Screen A cần

Screen B
    -> chưa fetch cho tới khi user mở Screen B
```

Không startup batch fetch:

```text
loads
trips
trucks
customers
invoices
settlements
payroll
reports
```

Không prefetch cross-screen chỉ để “cảm giác nhanh”.

---

## 2.2 Cache theo screen/resource

Dùng Refine/TanStack Query hiện tại.

Sau mutation:

```text
invalidate đúng resource/query liên quan
```

Không invalidate toàn bộ app nếu không cần.

---

## 2.3 Dùng Refine hooks trực tiếp

Ưu tiên:

```text
useTable
useList
useOne
useShow
useForm
useCreate
useUpdate
useDelete
useCustom
```

Không tạo wrapper generic chỉ để bọc Refine.

Custom hook chỉ tạo khi encapsulate business behavior thực:

```text
useSettlementActions
usePayrollWorkflow
useTripStopActions
useProfitabilityReport
```

---

## 2.4 Backend là source of truth cho business state

Frontend không:
- tự set arbitrary status;
- tự suy diễn PAID từ LOCKED;
- tự tính payroll tax;
- tự tính final profit;
- tự bỏ HOS infeasible;
- tự convert UNAVAILABLE thành 0.

---

# 3. TARGET SOURCE STRUCTURE

Sau khi audit xác minh repo, target structure ưu tiên ít level:

```text
src/
├── assets/
├── components/
├── hooks/
├── validators/
├── formatters/
├── constants/
├── providers/
├── routes/
├── pages/
├── features/
├── types/
├── locales/
├── styles/
├── test/
└── main.tsx
```

Không tạo thêm:

```text
/app
/core
/common
```

Nếu repo hiện tại còn các folder này:
- không xóa một lần;
- migrate theo usage;
- preserve behavior/tests;
- chuyển infrastructure hợp lý về `providers/`, `constants/`, `types/`, `hooks/`.

Không tạo `/shared` mới nếu responsibility đã rõ ở component/hook/type/formatter/validator.

---

# 4. TYPES STRATEGY

`src/types/` chứa DTO/global contract type.

Ví dụ:

```text
types/
├── api.types.ts
├── auth.types.ts
├── metric.types.ts
├── load.dto.ts
├── trip.dto.ts
├── shipmentCost.dto.ts
├── profitability.dto.ts
├── settlement.dto.ts
├── payroll.dto.ts
├── rateRule.dto.ts
└── optimization.dto.ts
```

Feature có thể giữ view-specific types nhưng không copy lại backend DTO.

---

# 5. FEATURE CONVENTION

Không chia sâu nhiều level.

Ví dụ:

```text
features/settlements/
├── settlement.types.ts
├── settlement.api.ts
├── settlement.query.ts
├── settlement.columns.tsx
├── SettlementStatusTag.tsx
├── SettlementSummary.tsx
├── SettlementLinesTable.tsx
├── SettlementActions.tsx
└── SettlementForm.tsx
```

Không bắt buộc feature nào cũng có đủ các file.

---

# 6. GLOBAL REUSABLE COMPONENTS

Top-level `components/` chỉ chứa component thật sự reusable:

```text
AppHeader
AppLayout
AppSider
AsyncState
PageErrorState
EmptyState
MetricCard
MetricAvailabilityBadge
MetricUnavailable
MoneyText
PercentText
DistanceText
DurationText
StatusTag
AuditInfo
ConfirmActionButton
PermissionGuard
```

Business-specific component ở trong feature.

---

# 7. METRIC AVAILABILITY UI

Backend semantics:

```text
AVAILABLE
PARTIAL
UNAVAILABLE
NOT_APPLICABLE
```

## AVAILABLE
Hiển thị value bình thường.

## PARTIAL
Hiển thị value + warning “Dữ liệu chưa đầy đủ”, kèm `basis/reason`.

## UNAVAILABLE
Không render `0`, `0%`, `$0`.

Hiển thị:

```text
—
Chưa đủ dữ liệu
```

và reason.

## NOT_APPLICABLE
Hiển thị “Không áp dụng”.

---

# 8. GLOBAL BUSINESS NAVIGATION

Sidebar target:

```text
Tổng quan

Vận hành
├── Loads
├── Trips
├── Dispatch
├── Tracking
└── Exceptions

Đội xe
├── Trucks
├── Maintenance
├── Inspections
└── Fleet Health

Tài xế & Nhân sự
├── Drivers
├── Employees
├── HOS
└── Driver Performance

Tài chính
├── Invoices
├── Payments
├── Expenses
├── Shipment Costs
└── Profitability

Thù lao & Lương
├── Driver Settlements
├── Payroll Runs
└── Payslips

Định giá
├── Rate Rules
└── Accessorial Policies

Tối ưu điều phối
└── Optimization Runs

Khách hàng
├── Customers
└── Terminals

Hệ thống
├── Documents
├── Notifications
├── Messages
└── Profile
```

Menu phải dựa trên `AccessControlProvider`.

Unauthorized resource:
- không hiện menu;
- direct route vẫn guard;
- backend vẫn là authority cuối cùng.

---

# 9. ROUTE STRATEGY

Logical routes:

```text
/dashboard
/loads
/loads/:id
/trips
/trips/:id
/dispatch
/trucks
/trucks/:id
/drivers
/drivers/:id
/customers
/customers/:id
/finance/invoices
/finance/invoices/:id
/finance/payments
/finance/expenses
/finance/shipment-costs
/finance/profitability
/settlements
/settlements/:id
/payroll
/payroll/:id
/payslips/:id
/rates
/rates/:id
/optimization
/optimization/:id
/reports/fleet
```

Phải adapt với route convention runtime hiện tại.

Không rename route existing nếu không có redirect/migration plan.

---

# 10. LOAD LIST

Mục tiêu: vận hành nhìn nhanh load cần xử lý, không biến thành bảng 30 cột.

Columns ưu tiên:

```text
Load #
Customer
Origin → Destination
Pickup
Delivery
Status
Truck
Driver/Trip
Revenue summary nếu available
Exception indicator
Actions
```

Filters:

```text
search
status
customer
pickup range
delivery range
truck
dispatcher
source
```

Không fetch detail cho từng row.

---

# 11. LOAD CREATE / EDIT

Dùng modal/drawer nếu form gọn; dùng page nếu dài/phức tạp.

Sections:

```text
Basic
Customer
Origin
Destination
Pickup / Delivery commitments
Equipment / Capacity
Hazmat
Assignment
Notes
```

Validation lấy từ backend contract.

Không invent min/max.

---

# 12. LOAD DETAIL

Header:

```text
Load #
Status
Customer
Origin → Destination
Primary actions
```

Sections/tabs:

```text
Overview
Timeline
Trip / Assignment
Stops
Documents
Exceptions
Financial
```

`Financial` chỉ fetch khi tab được mở.

Không prefetch financial summary khi user chưa xem.

---

# 13. TRIP DETAIL

Sections:

```text
Trip overview
Truck
Driver assignments
Mileage
Stops
Loads
Execution timeline
```

Mileage tách rõ:

```text
Planned
Actual
Loaded
Empty
```

Không relabel legacy total distance thành actual nếu backend chưa xác nhận.

---

# 14. DRIVER ASSIGNMENT UX

Hiển thị history:

```text
Driver
Role
Effective from
Effective to
Status
```

Unassign:

```text
POST .../unassign
```

Không dùng hard delete.

Action confirm trước khi thực hiện.

---

# 15. TRIP STOP UX

State:

```text
PENDING
EN_ROUTE
ARRIVED
SERVICE_STARTED
SERVICE_COMPLETED
DEPARTED
```

Buttons theo state:

```text
ARRIVED -> Start service
SERVICE_STARTED -> Complete service
SERVICE_COMPLETED -> Depart
```

Không cho generic dropdown set status.

---

# 16. LOAD EVENT / TIMELINE

Timeline hiển thị:

```text
occurredAt
eventType
previousStatus -> newStatus
actor/source
location nếu có
note/document
```

Đây là audit timeline, không phải UI cho user POST arbitrary event.

---

# 17. ACCESSORIAL / DETENTION UX

Từ Load/Trip Stop detail, hiển thị:

```text
Dwell time
Free time
Chargeable time
Customer amount
Company cost
Driver pay
Approval status
Evidence/document
```

Ba money values phải tách rõ.

Không dùng một field “Amount”.

---

# 18. SHIPMENT COST LIST

Columns:

```text
Date
Load
Trip
Category
Cost Basis
Status
Source
Amount
Currency
Allocation
```

Filters:

```text
date range
load
trip
category
costBasis
status
sourceType
currency
```

Không trộn Cost Basis và workflow Status.

---

# 19. PROFITABILITY UI

Route:

```text
/finance/profitability
```

Filters:

```text
period
customer
truck
load
lane nếu backend hỗ trợ
currency
```

Top metrics:

```text
Revenue
Variable Cost
Allocated Fixed Cost
Contribution Margin
Allocated Profit
Margin %
RPM
CPM
Break-even loaded rate
```

Nếu classification chưa đủ, giữ PARTIAL/UNAVAILABLE.

---

# 20. PROFITABILITY BREAKDOWN

Bảng:

```text
Cost Category
Behavior
Amount
Share
Source
```

Behavior:

```text
VARIABLE
FIXED_ALLOCATABLE
EXCLUDED
UNCLASSIFIED
```

Nếu có `UNCLASSIFIED`, hiển thị warning rõ.

Frontend không tự classify lại cost.

---

# 21. DRIVER PAY POLICY UI

Route logical:

```text
/settlements/policies
```

List:

```text
Policy Code
Driver / Default
Pay Method
Mileage Basis
Revenue Basis
Currency
Effective From
Effective To
Version
Active
```

Historical policy không overwrite.

Action là:

```text
Create new version
```

---

# 22. SETTLEMENT LIST

Route:

```text
/settlements
```

Columns:

```text
Settlement #
Driver
Pay Period
Type
Status
Gross
Deductions
Reimbursements
Net
Currency
Last action
```

Types:

```text
ORIGINAL
ADJUSTMENT
REVERSAL
```

Filters:

```text
pay period
driver
status
type
currency
```

---

# 23. SETTLEMENT DETAIL

Header:

```text
Settlement #
Driver
Pay period
Status
Policy version
Net Pay
```

Summary:

```text
Mileage Pay
Load Pay
Percentage Pay
Hourly Pay
Accessorial Pay
Bonus
Reimbursement
Deduction
Gross
Net
```

Lines:

```text
Class
Type
Load/Trip
Quantity
Rate
Amount
Source
```

Tabs:

```text
Summary
Lines
Source Work
Audit
Adjustments
```

---

# 24. SETTLEMENT ACTION MATRIX

Frontend không gửi status tùy ý.

```text
DRAFT
 -> Calculate

CALCULATED
 -> Submit Review

VALIDATION_REQUIRED
 -> Resolve / Recalculate

IN_REVIEW
 -> Approve / Reject

APPROVED
 -> Lock

LOCKED
 -> Schedule Payment / Create Adjustment

PAID
 -> View only / Adjustment if allowed
```

Unauthorized action bị ẩn.

409/422 map sang domain feedback.

---

# 25. ADJUSTMENT UX

Không sửa settlement LOCKED trực tiếp.

Action:

```text
Create Adjustment
```

Form:

```text
Reason
Affected source/load/trip
Line class
Quantity
Rate
Amount
Document/evidence
```

Detail link chain:

```text
Original
Adjustment #1
Adjustment #2
Reversal
```

---

# 26. PAYROLL RUN LIST

Route:

```text
/payroll
```

Columns:

```text
Payroll #
Pay Period
Status
Driver Count
Gross
Tax
Deductions
Reimbursements
Net
Currency
Payment progress
```

Filters:

```text
period
status
currency
```

---

# 27. PAYROLL RUN DETAIL

Header:

```text
Payroll #
Period
Status
Currency
```

Summary:

```text
Drivers
Gross Pay
Tax
Deductions
Reimbursement
Net Pay
Paid
Failed
Pending
```

Tabs:

```text
Employees/Drivers
Validation
Payments
Audit
```

---

# 28. MULTI-JURISDICTION PAYROLL UX

Payroll UI generic theo khu vực:

```text
Country
Subdivision
Locality
Worker Classification
Policy Version
```

Không label cố định `State` cho mọi quốc gia.

Resolution provenance:

```text
Work override
Employee profile
Tenant default
```

Nếu backend trả `PAYROLL_JURISDICTION_NOT_CONFIGURED`:

```text
Không thể hoàn tất bảng lương
Chưa cấu hình khu vực tính lương cho tài xế này.
```

CTA theo quyền:

```text
Configure Payroll Profile
```

Không hiện tax = 0.

---

# 29. PAYROLL ACTION MATRIX

```text
DRAFT
 -> Calculate

CALCULATED
 -> Review

VALIDATION_REQUIRED
 -> Resolve issues

REVIEWED
 -> Approve

APPROVED
 -> Lock

LOCKED
 -> Schedule payments

PROCESSING_PAYMENT
 -> Monitor only

PAYMENT_FAILED
 -> Retry eligible payments / reconcile

PAID
 -> Read only
```

`LOCKED` không hiển thị badge “Đã thanh toán”.

---

# 30. PAYSLIP UX

Driver view:

```text
Pay period
Gross
Taxes
Deductions
Reimbursements
Net
Payment status
Issued at
```

Breakdown:

```text
Mileage
Loads
Hours
Accessorial
Bonus
Adjustment
```

Final payslip immutable.

Driver chỉ xem payslip của chính mình trừ role có quyền.

---

# 31. PAYMENT UX

States:

```text
PENDING
SCHEDULED
PROCESSING
SUCCEEDED
FAILED
RETRY_SCHEDULED
```

Không map LOCKED -> PAID.

Payment detail:

```text
provider
reference
scheduled
paid
failure code/message
retry action
```

Sensitive bank info phải mask.

---

# 32. RATE RULES UI

Route:

```text
/rates
```

Columns:

```text
Rule
Customer
Method
Base Rate
Min
Max
Currency
Effective Dates
Version
Active
```

Methods:

```text
FLAT
PER_MILE
PER_WEIGHT
TIERED
INDEX_BASED
```

Historical version không overwrite.

---

# 33. FSC UI

Policy:

```text
FLAT
PER_MILE
PERCENTAGE
INDEX_BASED_MPG
CUSTOM
```

Với index:

```text
Index Source
Index Date
Current Fuel Price
Base Fuel Price
Contract MPG
Eligible Miles
Calculated FSC
```

Frontend không tự tính authoritative FSC.

---

# 34. DISPATCH OPTIMIZATION UI

Route:

```text
/optimization
```

Flow:

```text
Select scope
 -> Run optimization
 -> Candidate results
 -> Explain ranking
 -> Dispatcher accepts one
```

---

# 35. OPTIMIZATION CANDIDATE TABLE

Columns:

```text
Rank
Driver
Truck
Load
Feasible
Deadhead
ETA Pickup
ETA Delivery
HOS
Estimated Revenue
Estimated Cost
Estimated Margin
Score
```

Infeasible candidate có thể xem reason:

```text
HOS_CYCLE_LIMIT_EXCEEDED
CAPACITY_INSUFFICIENT
EQUIPMENT_MISMATCH
PICKUP_WINDOW_UNREACHABLE
TRUCK_UNAVAILABLE
```

---

# 36. OPTIMIZATION EXPLAINABILITY

Drawer:

```text
Final score

Deadhead
 raw
 normalized
 weight
 contribution

Margin
 raw
 normalized
 weight
 contribution

On-time
 ...

HOS
 ...
```

Không chỉ show final score.

---

# 37. OPTIMIZATION ACCEPT ACTION

Accept candidate:
- confirm;
- call backend command;
- invalidate optimization run + affected trip/load query;
- không optimistic-update assignment như success trước server response nếu backend command có nhiều invariant.

---

# 38. FLEET UTILIZATION UI

Route:

```text
/reports/fleet
```

Sections:

```text
Fleet Utilization
Loaded Miles
Deadhead
Unplanned Downtime
PM Compliance
Maintenance Cost / Mile
Breakdowns / 100k Miles
```

Historical metric chỉ show AVAILABLE nếu backend có history đủ.

Không suy ra utilization từ current truck status.

---

# 39. EXECUTIVE DASHBOARD PRINCIPLE

Dashboard là summary, không phải nơi fetch resource list rồi aggregate client-side.

Logical calls:

```text
executive summary
monthly financials
cost by category
fleet health
receivables
```

Không:

```text
fetch 100 loads
fetch 100 expenses
reduce()
```

để tạo company KPI.

---

# 40. DASHBOARD LAYOUT

## Executive Snapshot

```text
Revenue
Known/Actual Operating Cost
Profit / Contribution
Margin
OTD
Fleet Utilization
```

Card phải có availability, period, target/benchmark provenance nếu có.

## Financial Trend

Chart:

```text
Revenue
Operating Cost
Contribution Spread / Profit
```

Open period visual khác Closed nếu backend trả periodStatus.

## Cost Efficiency

```text
CPM
RPM
Fuel CPM
Maintenance CPM
Driver CPM
```

Không hiển thị Driver CPM available trước Settlement.

## Operations

```text
OTD
Loaded Miles
Deadhead
Exceptions
Average Delay
```

## Fleet Health

```text
Utilization
Downtime
PM Compliance
Maintenance CPM
Breakdowns/100k
```

## Receivables

```text
Outstanding
DSO
Aging buckets
```

Nếu backend đã trả aging buckets thì UI phải render.

---

# 41. DASHBOARD FETCH POLICY

Dashboard chỉ gọi report endpoints dashboard cần.

Không prefetch:

```text
Loads list
Trips list
Customers list
Settlement list
Payroll list
```

Focus/refetch chỉ áp dụng report query tương ứng.

---

# 42. FILTER CONVENTION

Report filters chỉ hiện khi backend hỗ trợ.

```text
DateRange
Currency
Customer
Truck
Driver
Status
```

Không tạo filter client-side trên một page subset rồi gọi đó là server report.

---

# 43. MONEY DISPLAY

Backend tính accounting authoritative.

Frontend:
- transport theo contract;
- format bằng formatter/Decimal.js nếu cần;
- không dùng binary floating point để tự tính authoritative total.

Money luôn gồm amount + currency.

Không format tất cả thành USD.

---

# 44. DATE / TIME DISPLAY

Timestamp absolute:
- parse đúng timezone;
- hiển thị theo product/user setting;
- tooltip full timestamp nếu cần.

Payroll `LocalDate` giữ date semantics, không shift vì timezone.

---

# 45. STATUS TAG CONVENTION

Một status → một semantic visual.

Group:

```text
neutral/draft
in progress
success/final
warning/review
error/failed
locked
voided
```

Không mỗi screen tự chọn màu khác cho cùng status.

---

# 46. LOADING / ERROR / EMPTY STATES

Phân biệt:

```text
LOADING
ERROR
EMPTY
UNAVAILABLE METRIC
NO PERMISSION
```

Không dùng một Empty state cho tất cả.

---

# 47. MUTATION UX

Mutation button:
- loading;
- disable duplicate click;
- success/error notification;
- scoped query invalidation;
- giữ form input nếu server validation fail.

Financial final actions:

```text
Approve
Lock
Post
Void
Pay
Retry
```

cần confirm modal mô tả consequence.

---

# 48. DOMAIN ERROR MAPPING

Map codes:

```text
CURRENCY_MISMATCH
SETTLEMENT_ALREADY_LOCKED
INVALID_SETTLEMENT_TRANSITION
PAYROLL_ALREADY_LOCKED
PAYROLL_JURISDICTION_NOT_CONFIGURED
PAYMENT_ALREADY_SUCCEEDED
HOS_INFEASIBLE
```

thành actionable message.

Không chỉ toast “Request failed”.

---

# 49. ACCESS CONTROL

Dùng existing `accessControlProvider`.

Logical capabilities:

```text
COST_VIEW
COST_APPROVE
SETTLEMENT_VIEW
SETTLEMENT_CALCULATE
SETTLEMENT_APPROVE
SETTLEMENT_LOCK
PAYROLL_VIEW
PAYROLL_CALCULATE
PAYROLL_APPROVE
PAYROLL_LOCK
PAYROLL_RECONCILE
RATE_VIEW
RATE_EDIT
OPTIMIZATION_RUN
OPTIMIZATION_ACCEPT
```

Nếu backend role model chưa có capability tương ứng, đánh dấu blocked; không invent frontend-only authorization.

---

# 50. RESPONSIVE / MOBILE

Desktop là primary management experience.

Mobile:
- wide table -> card/list;
- actions -> dropdown;
- detail -> vertical sections;
- modal không quá rộng;
- không ép split-pane nếu không đủ không gian.

Driver-facing screens như Stops/Payslips/Notifications ưu tiên mobile usability.

---

# 51. CRUD MODAL RULE

Create/Update dùng modal khi:
- khoảng <= 8–10 field;
- không có workflow phức tạp;
- không cần nhiều related context.

Dùng page/drawer khi:
- nhiều section;
- tabs;
- financial workflow;
- validation phức tạp.

Không ép mọi CRUD vào modal.

---

# 52. SCREEN ↔ ENDPOINT MATRIX

Sau audit phải tạo matrix thật:

| Screen | Read endpoint | Mutation endpoint | Permission | Fetch trigger |
|---|---|---|---|---|
| Load List | runtime `/api/loads` | — | load view | mount/focus |
| Load Detail | runtime `/api/loads/{id}` | actions | load view/edit | mount |
| Profitability | report endpoint | — | cost view | page/filter |
| Settlements | settlement endpoint | workflow actions | settlement | page/action |
| Payroll | payroll endpoint | workflow actions | payroll | page/action |
| Rates | rate endpoint | version actions | rate | page/action |
| Optimization | run endpoint | run/accept | optimization | explicit action |
| Fleet Report | fleet report endpoints | — | report view | page/filter |

Path cụ thể phải lấy từ runtime backend.

---

# 53. FRONTEND PHASES THEO BACKEND

## FE Phase 0 — Context Audit

Deliverable:

```text
docs/frontend-context-current.md
```

Không redesign.

## FE Phase 1 — Foundation Alignment

Mục tiêu:
- normalize DTO;
- central routes/constants;
- preserve providers;
- remove duplicate types;
- chuẩn metric availability;
- chuẩn Money/Status/AsyncState.

Không đổi tất cả folder trong một PR.

## FE Phase 2 — Existing Operations Flow

```text
Loads
Trips
Driver Assignment
Stops
Exceptions
Documents
Tracking
```

Map backend Phase 0–2.

## FE Phase 3 — Cost & Profitability

```text
Shipment Costs
Accessorial
Profitability
Dashboard financial metrics
```

## FE Phase 4 — Driver Settlement

```text
Pay Policy
Settlement List
Settlement Detail
Workflow Actions
Adjustments
```

## FE Phase 5 — Payroll

```text
Payroll Run
Validation
Multi-jurisdiction
Payslip
Payments
Reconciliation
```

## FE Phase 6 — Rating

```text
Rate Rules
Policy Versions
FSC
Preview
```

## FE Phase 7 — Optimization

```text
Run Optimization
Candidate Ranking
Explainability
Accept
```

## FE Phase 8 — Fleet Reporting

```text
Historical Utilization
Fleet Health
Executive Dashboard completion
```

---

# 54. BACKEND DEPENDENCY HANDLING

Nếu backend task chưa complete:

Frontend có thể:
- define confirmed DTO;
- show unavailable state;
- hide action bằng feature flag nếu project có;
- component test với deterministic fixtures.

Không:
- call endpoint chưa tồn tại trong production;
- fabricate success;
- tính local để thay backend business engine.

---

# 55. FRONTEND TASK TEMPLATE

Mỗi task:

```text
FE-xxx Title

Business Goal
Backend dependency
Current frontend state
Scope
Out of Scope

Route
Screen
Components
DTO
API
Filters
Actions
Permissions

Loading
Empty
Error
Unavailable
Validation

Query/cache behavior
Mutation invalidation

Responsive behavior

Unit tests
E2E tests

Acceptance Criteria
```

---

# 56. EXAMPLE — FE-PROFIT-001

Backend dependency:

```text
BE-CALC-011 complete
```

Screen:

```text
/finance/profitability
```

Must display:

```text
Revenue
Variable Cost
Allocated Fixed Cost
Contribution Margin
Allocated Profit
Margin
```

Must not:
- recalc backend totals;
- convert UNAVAILABLE to zero;
- merge cost basis/status.

Test:
- available;
- partial;
- unavailable;
- zero revenue;
- currency error;
- filters;
- permission.

---

# 57. EXAMPLE — FE-SETTLEMENT-001

Backend:

```text
BE-CALC-014
```

Must support:

```text
ORIGINAL
ADJUSTMENT
REVERSAL
state-specific actions
immutable locked state
```

Không generic Edit sau LOCKED.

---

# 58. EXAMPLE — FE-PAYROLL-001

Backend:

```text
BE-CALC-015
```

Must show:

```text
jurisdiction
worker classification
policy availability
validation blockers
payment states
```

Must never show:

```text
LOCKED = PAID
```

---

# 59. TESTING STRATEGY

## Type-level

```bash
npm run typecheck
```

## Lint

```bash
npm run lint
```

## Unit/Component

Vitest cho:
- formatter;
- metric components;
- state action matrices;
- domain error mapping;
- forms;
- query behavior.

## E2E

Playwright critical flow:

```text
Login
→ Create/Open Load
→ Dispatch Trip
→ Driver execution state
→ Financial summary
```

Khi backend mature:

```text
Settlement
→ Approve
→ Lock
→ Payroll
→ Payslip
```

---

# 60. PERFORMANCE

Tránh:
- N+1 request theo row;
- fetch detail cho list item;
- startup batch fetch;
- oversized pageSize để aggregate KPI;
- unstable provider object gây rerender.

Ưu tiên:
- backend report aggregation;
- lazy detail/tab fetch;
- request cancellation;
- scoped query caching;
- virtualization chỉ khi dataset thực sự cần.

---

# 61. ACCESSIBILITY

Yêu cầu:
- icon-only action có tooltip/aria-label;
- status không truyền bằng màu duy nhất;
- modal/drawer keyboard usable;
- form errors attach đúng field.

---

# 62. I18N

Nếu project hiện dùng i18n:
- text mới dùng translation key;
- backend error code map sang key;
- fallback server message an toàn.

Không hard-code Vietnamese trực tiếp vào component mới nếu convention hiện tại là i18n.

---

# 63. DEFINITION OF DONE

Một frontend task chỉ DONE khi:

```text
[ ] backend contract confirmed
[ ] route integrated
[ ] access control correct
[ ] screen fetches only own data
[ ] no cross-screen prefetch
[ ] loading state
[ ] error state
[ ] empty state
[ ] unavailable state if metric
[ ] server validation handled
[ ] query invalidation scoped
[ ] responsive usable
[ ] i18n respected
[ ] typecheck pass
[ ] lint pass
[ ] unit/component test pass
[ ] relevant E2E pass
[ ] no existing screen regression
```

---

# 64. RELEASE ORDER

```text
Frontend Audit
   ↓
Foundation alignment
   ↓
Load / Trip execution
   ↓
Shipment Cost / Profitability
   ↓
Driver Settlement
   ↓
Payroll
   ↓
Rate Rules
   ↓
Optimization
   ↓
Fleet / Executive reporting completion
```

Không xây Payroll UI chỉ vì schema tồn tại nếu logic backend chưa ready.

Không coi Optimization complete chỉ bằng mock score.

---

# 65. PROGRESS FILE

Tạo:

```text
docs/plan-frontend-progress.md
```

Format:

```text
Phase
Task
Status
Backend Dependency
Frontend Files
Endpoint
Tests
Blocker
Next
```

Statuses:

```text
NOT_STARTED
BLOCKED_BACKEND
IN_PROGRESS
READY_FOR_REVIEW
DONE
```

---

# 66. IMPLEMENTATION START RULE

AI/dev triển khai plan phải:

1. đọc `docs/frontend-context-current.md`;
2. đọc backend progress;
3. tạo Screen → Endpoint Matrix;
4. đánh dấu feature backend đã READY;
5. bắt đầu feature đầu tiên đủ dependency;
6. không làm lại màn DONE nếu contract/tests còn đúng;
7. sau mỗi task update `docs/plan-frontend-progress.md`.

---

# 67. BACKEND FLOW MAPPING

```text
BACKEND PHASE 0–2
Semantic + execution foundation
        ↓
FE:
Load / Trip / Assignment / Stops / Timeline

BACKEND PHASE 3
Shipment Cost + Accessorial + Profitability
        ↓
FE:
Cost ledger / Detention / Profitability

BACKEND PHASE 4
Driver Settlement
        ↓
FE:
Pay policy / Settlement / Adjustment

BACKEND PHASE 5
Payroll
        ↓
FE:
Payroll / Jurisdiction / Payslip / Payment

BACKEND PHASE 6
Rating
        ↓
FE:
Rate rules / FSC

BACKEND PHASE 7
Optimization
        ↓
FE:
Candidate ranking / Explainability / Accept

BACKEND PHASE 8
Fleet utilization
        ↓
FE:
Fleet health / Historical utilization / Executive KPI
```

---

# 68. FINAL PRODUCT FLOW

Manager / Dispatcher:

```text
Dashboard
   ↓
Load
   ↓
Trip
   ↓
Driver + Truck
   ↓
Stops / Execution
   ↓
Delivery
```

Finance:

```text
Delivered Load
   ↓
Invoice / Payment
   ↓
Expense / Shipment Cost
   ↓
Profitability
```

Payroll:

```text
Driver Work
   ↓
Settlement
   ↓
Review / Lock
   ↓
Payroll
   ↓
Payslip
   ↓
Payment
```

Pricing:

```text
Customer
   ↓
Rate Rule
   ↓
FSC / Accessorial
   ↓
Quote / Invoice input
```

Optimization:

```text
Load
+ Driver
+ Truck
+ HOS
+ Cost
+ Margin
   ↓
Candidate Ranking
   ↓
Explain
   ↓
Dispatcher Accept
```

Navigation, screen design và action phải làm các flow trên dễ nhìn thấy và dễ thao tác.

---

# 69. FINAL PRINCIPLE

Frontend phải là biểu hiện trung thực của domain state backend.

Nếu backend nói:

```text
UNAVAILABLE
```

frontend phải nói:

```text
Chưa đủ dữ liệu
```

Nếu backend nói:

```text
LOCKED
```

frontend phải khóa edit.

Nếu backend nói:

```text
PAYMENT_FAILED
```

frontend phải hiển thị failure/retry flow.

Nếu backend nói:

```text
HOS_INFEASIBLE
```

frontend không được cho dispatcher accept candidate như bình thường.

---

**END — LOGISTICSX FRONTEND IMPLEMENTATION & UX SPECIFICATION**
