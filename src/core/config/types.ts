/**
 * Mô tả cấu hình public được inject khi ứng dụng khởi động.
 *
 * Cấu hình chỉ chứa endpoint và feature flag, tuyệt đối không chứa secret.
 */

export type SupportedLocale = "en" | "vi";

export interface OAuthRuntimeConfig {
  audience: "logisticsx.api";
  clientId: string;
  clockSkewSeconds: number;
  issuer: string;
  jwksUri: string;
  postLogoutRedirectUri: string;
  redirectUri: string;
  scopes: string[];
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  appName: string;
  defaultLocale: SupportedLocale;
  environment: string;
  featureFlags: Readonly<Record<string, boolean>>;
  identityBaseUrl: string;
  oauth: OAuthRuntimeConfig;
  requestTimeoutMs: number;
}

export type RuntimeConfigErrorCode =
  | "CONFIG_FETCH_FAILED"
  | "CONFIG_INVALID"
  | "CONFIG_MISSING";

export class RuntimeConfigError extends Error {
  readonly code: RuntimeConfigErrorCode;
  readonly details: readonly string[];

  constructor(
    code: RuntimeConfigErrorCode,
    message: string,
    details: readonly string[] = [],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RuntimeConfigError";
    this.code = code;
    this.details = details;
  }
}
