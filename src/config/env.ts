import { z } from "zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default("Logictics"),
  VITE_API_BASE_URL: z.string().trim().url(),
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
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Cấu hình môi trường không hợp lệ: ${details}`);
}

const apiBaseUrl = parsedEnv.data.VITE_API_BASE_URL.replace(/\/$/, "");

export const env = {
  appName: parsedEnv.data.VITE_APP_NAME,
  apiBaseUrl,
  larkLoginUrl:
    parsedEnv.data.VITE_LARK_LOGIN_URL ?? `${apiBaseUrl}/auth/lark/login`,
  authLoginPath: parsedEnv.data.VITE_AUTH_LOGIN_PATH,
  authRefreshPath: parsedEnv.data.VITE_AUTH_REFRESH_PATH,
  authMePath: parsedEnv.data.VITE_AUTH_ME_PATH,
  authLogoutPath: parsedEnv.data.VITE_AUTH_LOGOUT_PATH,
  tenantSwitchPath: parsedEnv.data.VITE_TENANT_SWITCH_PATH,
  tenantHeaderName: parsedEnv.data.VITE_TENANT_HEADER_NAME,
} as const;
