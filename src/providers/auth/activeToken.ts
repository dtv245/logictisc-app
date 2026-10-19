/**
 * Shared token bridge so non-Refine HTTP clients (such as AI Gap and Dispatch API transports)
 * can access the active authentication Bearer token without coupling to React hook context.
 */

let activeToken: string | null = null;

export function setActiveAccessToken(token: string | null): void {
  activeToken = token;
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      if (token) {
        window.sessionStorage.setItem("logistics_active_token", token);
      } else {
        window.sessionStorage.removeItem("logistics_active_token");
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
}

export function getActiveAccessToken(): string | null {
  if (activeToken) return activeToken;
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      return window.sessionStorage.getItem("logistics_active_token");
    } catch {
      return null;
    }
  }
  return null;
}
