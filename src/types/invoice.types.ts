import type { Money } from "./common.types";
import type { Customer } from "./customer.types";
import type { Employee } from "./employee.types";
import type { Load } from "./load.types";
import type { InvoiceType, InvoiceStatus, TaxBehavior, InvoiceLineItemType } from "./invoice.dto";

export interface Invoice {
  id: string;
  number: number;
  type: InvoiceType;
  status: InvoiceStatus;
  taxBehavior?: TaxBehavior | string | null;
  taxBreakdownJson?: unknown | null;
  notes?: string | null;
  dueDate?: string | Date | null;
  stripeInvoiceId?: string | null;
  sentAt?: string | Date | null;
  sentToEmail?: string | null;
  subtotalAmount?: number | null;
  subtotalCurrency?: string | null;
  taxTotalAmount?: number | null;
  taxTotalCurrency?: string | null;
  totalAmount?: number | null;
  totalCurrency?: string | null;
  subtotal?: Money;
  taxTotal?: Money;
  total?: Money;
  loadId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  totalDistanceDriven?: number | null;
  totalHoursWorked?: number | null;
  approvedById?: string | null;
  approvedAt?: string | Date | null;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
  subscriptionId?: string | null;
  billingPeriodStart?: string | Date | null;
  billingPeriodEnd?: string | Date | null;
  createdAt?: string | Date;
  createdBy?: string | null;
  lastModifiedAt?: string | Date | null;
  lastModifiedBy?: string | null;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  type: InvoiceLineItemType;
  quantity: number;
  order: number;
  notes?: string | null;
  taxRatePercent: number;
  taxAmount: number;
  taxCode?: string | null;
  amountAmount?: number | null;
  amountCurrency?: string | null;
  amount?: Money;
}

export interface InvoiceWithRelations extends Invoice {
  customer?: Customer | null;
  employee?: Employee | null;
  load?: Load | null;
  lineItems?: InvoiceLineItem[];
}
