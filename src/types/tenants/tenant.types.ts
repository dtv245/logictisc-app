/**
 * Chứa các kiểu dữ liệu tenant và thao tác chuyển tenant.
 */

import type { BaseRecord } from "@refinedev/core";

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
