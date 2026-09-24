/**
 * Parse và validate toàn bộ Vite environment variables.
 */

import { z } from "zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default("Logictics"),
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .url()
    .default("http://localhost:5173/api"),
  VITE_LARK_LOGIN_URL: z.string().trim().url().optional(),
  VITE_AUTH_LOGIN_PATH: z.string().trim().min(1).default("/auth/login"),
  VITE_AUTH_REFRESH_PATH: z.string().trim().min(1).default("/auth/refresh"),
  VITE_AUTH_ME_PATH: z.string().trim().min(1).default("/auth/me"),
  VITE_AUTH_LOGOUT_PATH: z.string().trim().min(1).default("/auth/logout"),
  VITE_TENANT_SWITCH_PATH: z
    .string()
    .trim()
    .min(1)
    .default("/auth/tenant/switch"),
  VITE_TENANT_HEADER_NAME: z
    .string()
    .trim()
    .min(1)
    .default("X-Tenant-Key"),
  VITE_DEMO_AUTH_ENABLED: z.enum(["true", "false"]).default("false"),
  VITE_DEMO_AUTH_USERNAME: z.string().trim().min(1).optional(),
  VITE_DEMO_AUTH_PASSWORD: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  // Fail fast trước khi render để lỗi deployment hiển thị đúng biến cấu hình,
  // thay vì phát sinh thành lỗi mạng khó truy vết ở một màn hình bất kỳ.
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Cấu hình môi trường không hợp lệ: ${details}`);
}

const apiBaseUrl = parsedEnv.data.VITE_API_BASE_URL.replace(/\/$/, "");
// Demo auth chỉ tồn tại ở dev và phải có đủ cả username/password. IIFE giữ
// nhánh lỗi ngay trong biểu thức để `demoAuth` có type object | null chính xác.
const demoAuth =
  import.meta.env.DEV && parsedEnv.data.VITE_DEMO_AUTH_ENABLED === "true"
    ? parsedEnv.data.VITE_DEMO_AUTH_USERNAME &&
      parsedEnv.data.VITE_DEMO_AUTH_PASSWORD
      ? {
          username: parsedEnv.data.VITE_DEMO_AUTH_USERNAME,
          password: parsedEnv.data.VITE_DEMO_AUTH_PASSWORD,
        }
      : (() => {
          throw new Error(
            "VITE_DEMO_AUTH_USERNAME và VITE_DEMO_AUTH_PASSWORD là bắt buộc khi bật demo auth.",
          );
        })()
    : null;

export const env = {
  appName: parsedEnv.data.VITE_APP_NAME,
  apiBaseUrl,
  demoAuth,
  larkLoginUrl:
    parsedEnv.data.VITE_LARK_LOGIN_URL ?? `${apiBaseUrl}/auth/lark/login`,
  authLoginPath: parsedEnv.data.VITE_AUTH_LOGIN_PATH,
  authRefreshPath: parsedEnv.data.VITE_AUTH_REFRESH_PATH,
  authMePath: parsedEnv.data.VITE_AUTH_ME_PATH,
  authLogoutPath: parsedEnv.data.VITE_AUTH_LOGOUT_PATH,
  tenantSwitchPath: parsedEnv.data.VITE_TENANT_SWITCH_PATH,
  tenantHeaderName: parsedEnv.data.VITE_TENANT_HEADER_NAME,
} as const;
