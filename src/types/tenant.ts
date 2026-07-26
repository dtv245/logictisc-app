export interface Tenant {
  id: string;
  tenantKey: string;
  tenantName: string;
  logo?: string;
}

export interface SwitchTenantRequest {
  tenantKey: string;
}

export interface SwitchTenantResult extends BaseRecord {
  id?: string;
  tenantKey: string;
  tenantName?: string;
}
import type { BaseRecord } from "@refinedev/core";
