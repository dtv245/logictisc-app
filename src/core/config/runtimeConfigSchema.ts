/**
 * Validate cấu hình runtime trước khi bất kỳ provider hay request nào được tạo.
 */

import { z } from "zod";

import type { RuntimeConfig } from "./types";

const absoluteHttpUrlSchema = z
  .url()
  .refine((value) => /^https?:\/\//u.test(value), {
    message: "must use an absolute http(s) URL",
  })
  .transform((value) => value.replace(/\/+$/u, ""));

const redirectUrlSchema = z.url().refine((value) => /^https?:\/\//u.test(value), {
  message: "must use an absolute http(s) URL",
});

export const runtimeConfigSchema = z
  .object({
    appName: z.string().trim().min(1),
    environment: z.string().trim().min(1),
    apiBaseUrl: absoluteHttpUrlSchema,
    requestTimeoutMs: z.number().int().min(1_000).max(120_000).default(15_000),
    identityBaseUrl: absoluteHttpUrlSchema,
    oauth: z.object({
      clientId: z.string().trim().min(1),
      redirectUri: redirectUrlSchema,
      postLogoutRedirectUri: redirectUrlSchema,
      scopes: z.array(z.string().trim().min(1)).min(1),
      audience: z.literal("logisticsx.api"),
      issuer: absoluteHttpUrlSchema,
      jwksUri: redirectUrlSchema,
      clockSkewSeconds: z.number().int().min(0).max(300).default(60),
    }),
    defaultLocale: z.enum(["en", "vi"]).default("vi"),
    featureFlags: z.record(z.string(), z.boolean()).default({}),
  })
  .strict();

export function parseRuntimeConfig(value: unknown): RuntimeConfig {
  return runtimeConfigSchema.parse(value);
}
