import type { Money } from "./common.types";
import type { Customer } from "./customer.types";
import type { Employee } from "./employee.types";
import type { Load } from "./load.types";
import type { InvoiceResponse, InvoiceLineItemType } from "./invoice.dto";

export type Invoice = InvoiceResponse;

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
