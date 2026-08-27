/**
 * Quản lý auth session trong memory và cung cấp refresh single-flight.
 *
 * HTTP layer chỉ cần gọi `getAccessToken` và `refreshAccessToken`; giới hạn
 * replay một request sau 401 vẫn thuộc trách nhiệm interceptor.
 */

import type { JwtRole } from "../permissions";
import type {
  AccessTokenVerifier,
  AuthIdentity,
  AuthSessionSnapshot,
  OidcGateway,
  OidcLoginResult,
  OidcUserSnapshot,
} from "./types";

const DEFAULT_REFRESH_SKEW_SECONDS = 60;

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

  private session: AuthSessionSnapshot | null = null;
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
  }

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
    this.setSession(null);
    this.initialized = true;
    await this.oidc.removeUser();
  };

  logout = async (): Promise<boolean> => {
    this.setSession(null);
    this.initialized = true;
    return this.oidc.logout();
  };

  private performBootstrap = async (): Promise<AuthSessionSnapshot | null> => {
    try {
      const user = await this.oidc.getUser();
      if (user) {
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
