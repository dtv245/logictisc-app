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
  taxBehavior: TaxBehavior;
  taxBreakdownJson?: unknown | null;
  notes?: string | null;
  dueDate?: Date | null;
  stripeInvoiceId?: string | null;
  sentAt?: Date | null;
  sentToEmail?: string | null;
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  loadId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  totalDistanceDriven?: number | null;
  totalHoursWorked?: number | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
  subscriptionId?: string | null;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
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
  amount: Money;
}

export interface InvoiceWithRelations extends Invoice {
  lineItems?: InvoiceLineItem[];
  load?: Load | null;
  customer?: Customer | null;
  employee?: Employee | null;
}
