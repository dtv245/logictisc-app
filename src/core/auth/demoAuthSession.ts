/** Local-development authentication session backed by the API dev-auth profile. */

import type { LogisticsApiClient } from "../../types/apiClient.types";
import type { AuthIdentity } from "../../types/authSession.types";
import { normalizeJwtRoles } from "../permissions/jwtRoles";
import type { JwtRole } from "../../types/roles.types";
import type { PasswordLoginParams } from "../../types/auth.types";

interface DevAuthLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  subject: string;
  email: string;
  tenantId: string;
  roles: string[];
}

const isDevAuthLoginResponse = (
  value: unknown,
): value is DevAuthLoginResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<DevAuthLoginResponse>;
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.trim().length > 0 &&
    candidate.tokenType === "Bearer" &&
    typeof candidate.expiresIn === "number" &&
    candidate.expiresIn > 0 &&
    typeof candidate.subject === "string" &&
    candidate.subject.trim().length > 0 &&
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0 &&
    typeof candidate.tenantId === "string" &&
    candidate.tenantId.trim().length > 0 &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === "string")
  );
};

export class DemoAuthSession {
  private accessToken: string | null = null;
  private identity: AuthIdentity | null = null;
  private roles: readonly JwtRole[] = [];

  login = async (
    apiClient: LogisticsApiClient,
    credentials: PasswordLoginParams,
  ): Promise<void> => {
    const response = await apiClient.instance.post<unknown>(
      "/api/dev-auth/login",
      credentials,
      {
        logistics: { authentication: "none" },
      },
    );

    if (!isDevAuthLoginResponse(response.data)) {
      throw new Error("INVALID_DEV_AUTH_RESPONSE");
    }

    const roles = normalizeJwtRoles(undefined, response.data.roles);
    if (roles.length === 0) {
      throw new Error("DEV_AUTH_RESPONSE_HAS_NO_SUPPORTED_ROLE");
    }

    this.accessToken = response.data.accessToken;
    this.roles = roles;
    this.identity = {
      id: response.data.subject,
      email: response.data.email,
      name: "Quản trị viên Local",
      roles,
      tenantId: response.data.tenantId,
    };
  };

  isActive = (): boolean => this.accessToken !== null && this.identity !== null;

  getAccessToken = (): string | null => this.accessToken;

  refreshAccessToken = async (): Promise<string | null> => this.accessToken;

  getJwtRoles = async (): Promise<readonly JwtRole[]> => this.roles;

  getIdentity = (): AuthIdentity | null => this.identity;

  clearSession = async (): Promise<void> => {
    this.accessToken = null;
    this.identity = null;
    this.roles = [];
  };
}
