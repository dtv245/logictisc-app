let accessToken: string | null = null;

/**
 * Access token is intentionally kept in module memory instead of Web Storage.
 * A page reload restores the session through the HttpOnly refresh-token cookie.
 */
export const tokenStore = {
  clear(): void {
    accessToken = null;
  },

  get(): string | null {
    return accessToken;
  },

  set(token: string): void {
    accessToken = token;
  },
};
