/**
 * Chứa các kiểu dữ liệu hóa đơn, thanh toán và chi phí.
 */

import type {
  Address,
  AuditableEntity,
  Money,
} from "./common";
import type { Customer } from "./customer";
import type { Employee } from "./employee";
import type { Load } from "./load";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type InvoiceType =
  | "customer"
  | "payroll"
  | "subscription"
  | "credit_note";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type InvoiceStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "paid"
  | "overdue"
  | "void";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TaxBehavior = "exclusive" | "inclusive";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type InvoiceLineItemType =
  | "freight"
  | "fuel_surcharge"
  | "detention"
  | "accessorial"
  | "tax"
  | "adjustment";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ExpenseType = "general" | "truck" | "repair";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ExpenseCategory =
  | "fuel"
  | "maintenance"
  | "repair"
  | "toll"
  | "parking"
  | "insurance"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type QuantityUnit = "each" | "gallon" | "liter" | "mile" | "hour";

/** Hóa đơn khách hàng, lương hoặc subscription. */
export interface Invoice extends AuditableEntity {
  id: string;
  number: number;
  type: InvoiceType;
  status: InvoiceStatus;
  taxBehavior: TaxBehavior;
  taxBreakdownJson?: unknown | null; // TODO: định nghĩa shape cụ thể khi biết rõ payload.
  notes?: string | null;
  dueDate?: string | null;
  stripeInvoiceId?: string | null;
  sentAt?: string | null;
  sentToEmail?: string | null;
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  loadId?: string | null;
  customerId?: string | null;
  employeeId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  totalDistanceDriven?: number | null;
  totalHoursWorked?: number | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
  subscriptionId?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
}

/** Một dòng chi tiết cấu thành hóa đơn. */
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  type: InvoiceLineItemType;
  quantity: number;
  order: number;
  notes?: string | null;
  taxRatePercent: number;
  /** Tiền thuế của dòng; schema không có cột currency riêng. */
  taxAmount: number;
  taxCode?: string | null;
  amount: Money;
}

/** Khoản thanh toán được ghi nhận cho một hóa đơn. */
export interface Payment extends AuditableEntity {
  id: string;
  status: PaymentStatus;
  stripePaymentMethodId?: string | null;
  tenantId: string;
  description?: string | null;
  stripePaymentIntentId?: string | null;
  referenceNumber?: string | null;
  recordedByUserId?: string | null;
  recordedAt?: string | null;
  invoiceId?: string | null;
  amount: Money;
  billingAddress: Address;
}

/** Liên kết công khai có thời hạn để thanh toán hóa đơn. */
export interface PaymentLink extends AuditableEntity {
  id: string;
  token: string;
  invoiceId: string;
  expiresAt: string;
  isActive: boolean;
  createdByUserId: string;
  accessCount: number;
  lastAccessedAt?: string | null;
}

/** Khoản chi phí vận hành, xe tải hoặc sửa chữa. */
export interface Expense extends AuditableEntity {
  id: string;
  number: number;
  type: ExpenseType;
  status: ExpenseStatus;
  vendorName?: string | null;
  expenseDate: string;
  receiptBlobPath?: string | null;
  notes?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  amount: Money;
  truckId?: string | null;
  vendorAddress?: string | null;
  vendorPhone?: string | null;
  repairDescription?: string | null;
  estimatedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  category?: ExpenseCategory | null;
  truckExpenseTruckId?: string | null;
  truckExpenseCategory?: ExpenseCategory | null;
  odometerReading?: number | null;
  quantity?: number | null;
  quantityUnit?: QuantityUnit | null;
}

/** Hóa đơn kèm chủ thể và các dòng chi tiết thường được tải cùng. */
export interface InvoiceWithRelations extends Invoice {
  lineItems?: InvoiceLineItem[];
  load?: Load | null;
  customer?: Customer | null;
  employee?: Employee | null;
}

/** Thanh toán kèm hóa đơn liên quan. */
export interface PaymentWithRelations extends Payment {
  invoice?: Invoice | null;
}

/** Chi phí kèm xe tải liên quan. */
export interface ExpenseWithRelations extends Expense {
  truck?: Truck | null;
  truckExpenseTruck?: Truck | null;
}
