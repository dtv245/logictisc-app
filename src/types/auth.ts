import type { Tenant } from "./tenant";

export interface CurrentUser {
  id: string;
  openId: string;
  unionId?: string;
  name: string;
  email?: string;
  avatar?: string;
  tenantKey?: string;
  tenantName?: string;
  tenants?: Tenant[];
  permissions?: string[];
}

export type LarkLoginParams =
  | { mode: "redirect" }
  | { mode: "callback" };

export const isLarkLoginParams = (value: unknown): value is LarkLoginParams => {
  if (typeof value !== "object" || value === null || !("mode" in value)) {
    return false;
  }

  const mode = Reflect.get(value, "mode");
  return mode === "redirect" || mode === "callback";
};
