/**
 * Quản lý auth session trong memory và cung cấp refresh single-flight.
 *
 * HTTP layer chỉ cần gọi `getAccessToken` và `refreshAccessToken`; giới hạn
 * replay một request sau 401 vẫn thuộc trách nhiệm interceptor.
 */

import type { JwtRole } from "../../types/roles.types";
import type { LarkAuthLoginResponse } from "../../types/auth.types";
import { normalizeJwtRoles } from "../permissions/jwtRoles";
import type {
  AccessTokenVerifier,
  AuthIdentity,
  AuthSessionSnapshot,
  OidcGateway,
  OidcLoginResult,
  OidcUserSnapshot,
} from "../../types/authSession.types";

const DEFAULT_REFRESH_SKEW_SECONDS = 60;
const LARK_SESSION_STORAGE_KEY = "logistics_lark_session";

export class AuthSessionExpiredError extends Error {
  constructor() {
    super("AUTH_SESSION_EXPIRED");
    this.name = "AuthSessionExpiredError";
  }
}

export interface AuthSessionManagerOptions {
  readonly oidc: OidcGateway;
  readonly tokenVerifier: AccessTokenVerifier;
  readonly refreshSkewSeconds?: number;
  readonly nowEpochSeconds?: () => number;
  readonly storage?: Storage;
}

export type AuthSessionListener = (
  session: AuthSessionSnapshot | null,
) => void;

const chooseIdentityName = (user: OidcUserSnapshot): string =>
  user.profile.name ??
  user.profile.preferredUsername ??
  user.profile.email ??
  user.profile.subject;

export class AuthSessionManager {
  private readonly oidc: OidcGateway;
  private readonly tokenVerifier: AccessTokenVerifier;
  private readonly refreshSkewSeconds: number;
  private readonly nowEpochSeconds: () => number;
  private readonly storage?: Storage;

  private session: AuthSessionSnapshot | null = null;
  private isLarkSession = false;
  private initialized = false;
  private bootstrapInFlight: Promise<AuthSessionSnapshot | null> | null =
    null;
  private refreshInFlight: Promise<AuthSessionSnapshot> | null = null;
  private readonly listeners = new Set<AuthSessionListener>();

  constructor(options: AuthSessionManagerOptions) {
    this.oidc = options.oidc;
    this.tokenVerifier = options.tokenVerifier;
    this.refreshSkewSeconds =
      options.refreshSkewSeconds ?? DEFAULT_REFRESH_SKEW_SECONDS;
    this.nowEpochSeconds =
      options.nowEpochSeconds ?? (() => Math.floor(Date.now() / 1_000));
    this.storage =
      options.storage ??
      (typeof window !== "undefined" && window.sessionStorage
        ? window.sessionStorage
        : undefined);
  }

  establishLarkSession = async (
    larkLogin: LarkAuthLoginResponse,
  ): Promise<AuthSessionSnapshot> => {
    if (!larkLogin.accessToken || !larkLogin.accessToken.trim()) {
      throw new AuthSessionExpiredError();
    }

    const expiresIn =
      typeof larkLogin.expiresIn === "number" && larkLogin.expiresIn > 0
        ? larkLogin.expiresIn
        : 28800;
    const expiresAt = this.nowEpochSeconds() + expiresIn;
    const roles = normalizeJwtRoles(undefined, larkLogin.roles);

    const identity: AuthIdentity = {
      id: larkLogin.subject,
      name: larkLogin.email,
      email: larkLogin.email,
      tenantId: larkLogin.tenantId,
      roles,
    };

    const session: AuthSessionSnapshot = {
      accessToken: larkLogin.accessToken,
      expiresAt,
      tenantId: larkLogin.tenantId,
      roles,
      identity,
    };

    this.isLarkSession = true;
    this.persistLarkSession(session);
    this.setSession(session);
    this.initialized = true;
    return session;
  };

  startLogin = async (returnTo: string): Promise<void> => {
    await this.oidc.startLogin(returnTo);
  };

  completeLogin = async (
    callbackUrl?: string,
  ): Promise<OidcLoginResult> => {
    try {
      const result = await this.oidc.completeLogin(callbackUrl);
      await this.establishSession(result.user);
      this.initialized = true;

      return result;
    } catch (error) {
      await this.clearSession();
      throw error;
    }
  };

  /**
   * Cho query-cache boundary theo dõi thay đổi principal/tenant. Refresh cùng
   * principal không phát event để tránh xóa cache sau mỗi token rotation.
   */
  subscribe = (listener: AuthSessionListener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Bootstrap được gom single-flight để React StrictMode không đọc/validate
   * cùng một user hai lần khi provider được mount lại trong development.
   */
  bootstrap = async (): Promise<AuthSessionSnapshot | null> => {
    if (this.initialized) {
      return this.session;
    }

    if (!this.bootstrapInFlight) {
      const task = this.performBootstrap();
      this.bootstrapInFlight = task;

      const clearBootstrapTask = () => {
        if (this.bootstrapInFlight === task) {
          this.bootstrapInFlight = null;
        }
      };
      void task.then(clearBootstrapTask, clearBootstrapTask);
    }

    return this.bootstrapInFlight;
  };

  getSession = async (): Promise<AuthSessionSnapshot | null> => {
    const session = await this.bootstrap();
    if (!session) {
      return null;
    }

    if (
      session.expiresAt - this.nowEpochSeconds() <=
      this.refreshSkewSeconds
    ) {
      return this.refreshSession();
    }

    return session;
  };

  getAccessToken = async (): Promise<string | null> =>
    (await this.getSession())?.accessToken ?? null;

  /**
   * Mọi caller nhận cùng Promise refresh. Interceptor có thể dùng hàm này khi
   * gặp 401, nhưng chỉ interceptor mới quyết định request đã replay hay chưa.
   */
  refreshAccessToken = async (): Promise<string> =>
    (await this.refreshSession()).accessToken;

  getJwtRoles = async (): Promise<readonly JwtRole[]> =>
    (await this.getSession())?.roles ?? [];

  getIdentity = async (): Promise<AuthIdentity | null> =>
    (await this.getSession())?.identity ?? null;

  clearSession = async (): Promise<void> => {
    this.clearLarkSession();
    this.isLarkSession = false;
    this.setSession(null);
    this.initialized = true;
    await this.oidc.removeUser();
  };

  logout = async (): Promise<boolean> => {
    this.clearLarkSession();
    this.isLarkSession = false;
    this.setSession(null);
    this.initialized = true;
    return this.oidc.logout();
  };

  private persistLarkSession = (session: AuthSessionSnapshot): void => {
    try {
      this.storage?.setItem(LARK_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable or disabled
    }
  };

  private clearLarkSession = (): void => {
    try {
      this.storage?.removeItem(LARK_SESSION_STORAGE_KEY);
    } catch {
      // Storage unavailable or disabled
    }
  };

  private readSavedLarkSession = (): AuthSessionSnapshot | null => {
    try {
      const raw = this.storage?.getItem(LARK_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSessionSnapshot;
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.accessToken === "string" &&
        typeof parsed.expiresAt === "number" &&
        typeof parsed.tenantId === "string" &&
        Array.isArray(parsed.roles) &&
        typeof parsed.identity === "object" &&
        parsed.identity !== null
      ) {
        if (parsed.expiresAt - this.nowEpochSeconds() > this.refreshSkewSeconds) {
          return parsed;
        }
      }
      this.clearLarkSession();
      return null;
    } catch {
      this.clearLarkSession();
      return null;
    }
  };

  private performBootstrap = async (): Promise<AuthSessionSnapshot | null> => {
    try {
      const savedLark = this.readSavedLarkSession();
      if (savedLark) {
        this.isLarkSession = true;
        this.setSession(savedLark);
        this.initialized = true;
        return savedLark;
      }

      const user = await this.oidc.getUser();
      if (user) {
        this.isLarkSession = false;
        await this.establishSession(user);
      } else {
        this.setSession(null);
      }
      this.initialized = true;
      return this.session;
    } catch {
      // Token không hợp lệ (kể cả thiếu tenant) phải chặn bootstrap và xóa
      // toàn bộ session memory thay vì cho route protected flash.
      await this.clearSession();
      return null;
    }
  };

  private establishSession = async (
    user: OidcUserSnapshot,
  ): Promise<AuthSessionSnapshot> => {
    this.isLarkSession = false;
    this.clearLarkSession();

    if (!user.accessToken.trim()) {
      throw new AuthSessionExpiredError();
    }

    const verifiedToken = await this.tokenVerifier.verify(user.accessToken);
    if (
      verifiedToken.subject &&
      verifiedToken.subject !== user.profile.subject
    ) {
      // Chặn ghép OIDC identity của user A với access token của user B.
      throw new AuthSessionExpiredError();
    }

    const identity: AuthIdentity = {
      id: user.profile.subject,
      name: chooseIdentityName(user),
      ...(user.profile.picture
        ? { avatar: user.profile.picture }
        : {}),
      ...(user.profile.email ? { email: user.profile.email } : {}),
      tenantId: verifiedToken.tenantId,
      roles: verifiedToken.roles,
    };

    const session: AuthSessionSnapshot = {
      accessToken: user.accessToken,
      expiresAt: verifiedToken.expiresAt,
      tenantId: verifiedToken.tenantId,
      roles: verifiedToken.roles,
      identity,
    };

    this.setSession(session);
    return session;
  };

  private setSession = (nextSession: AuthSessionSnapshot | null): void => {
    const previousBoundary = this.session
      ? `${this.session.tenantId}\u0000${this.session.identity.id}`
      : null;
    const nextBoundary = nextSession
      ? `${nextSession.tenantId}\u0000${nextSession.identity.id}`
      : null;

    this.session = nextSession;

    if (previousBoundary !== nextBoundary) {
      for (const listener of this.listeners) {
        listener(nextSession);
      }
    }
  };

  private refreshSession = async (): Promise<AuthSessionSnapshot> => {
    if (!this.refreshInFlight) {
      const task = this.performRefresh();
      this.refreshInFlight = task;

      const clearRefreshTask = () => {
        if (this.refreshInFlight === task) {
          this.refreshInFlight = null;
        }
      };
      void task.then(clearRefreshTask, clearRefreshTask);
    }

    return this.refreshInFlight;
  };

  private performRefresh = async (): Promise<AuthSessionSnapshot> => {
    if (this.isLarkSession && this.session) {
      if (this.session.expiresAt - this.nowEpochSeconds() > 0) {
        return this.session;
      }
      await this.clearSession();
      throw new AuthSessionExpiredError();
    }

    try {
      const refreshedUser = await this.oidc.renewUser();
      this.initialized = true;
      return await this.establishSession(refreshedUser);
    } catch {
      await this.clearSession();
      throw new AuthSessionExpiredError();
    }
  };
}
