/**
 * Chứa các kiểu dữ liệu đăng nhập và người dùng hiện tại.
 */

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

export interface PasswordLoginParams {
  username: string;
  password: string;
}

export type LarkLoginParams =
  | { mode: "redirect" }
  | { mode: "callback" };

export type LoginParams = PasswordLoginParams | LarkLoginParams;

export const isPasswordLoginParams = (
  value: unknown,
): value is PasswordLoginParams => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const username = Reflect.get(value, "username");
  const password = Reflect.get(value, "password");
  return (
    typeof username === "string" &&
    username.trim().length > 0 &&
    typeof password === "string" &&
    password.length > 0
  );
};

export const isLarkLoginParams = (value: unknown): value is LarkLoginParams => {
  if (typeof value !== "object" || value === null || !("mode" in value)) {
    return false;
  }
  const mode = Reflect.get(value, "mode");
  return mode === "redirect" || mode === "callback";
};
