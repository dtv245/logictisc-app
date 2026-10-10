/** Flat CustomerView projection from the verified handoff; UI presentation does not add wire fields. */
export interface CustomerResponse {
  addressCity?: string | null;
  addressCountry?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  email?: string | null;
  id: string;
  isVatExempt: boolean;
  name: string;
  notes?: string | null;
  phone?: string | null;
  status: string;
  taxId?: string | null;
}

export type ApiCustomerStatus = string;
export type { CreateCustomerRequest } from "./handoff.generated";
// Customer PUT is a full request, not Partial/PATCH.
export type { CreateCustomerRequest as UpdateCustomerRequest } from "./handoff.generated";
