const ACTIVE_TENANT_KEY = "logictics.activeTenantKey";

const canUseSessionStorage = (): boolean => typeof window !== "undefined";

export const getActiveTenantKey = (): string | null => {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(ACTIVE_TENANT_KEY);
};

export const setActiveTenantKey = (tenantKey: string | undefined): void => {
  if (!canUseSessionStorage()) {
    return;
  }

  if (tenantKey) {
    window.sessionStorage.setItem(ACTIVE_TENANT_KEY, tenantKey);
    return;
  }

  window.sessionStorage.removeItem(ACTIVE_TENANT_KEY);
};

export const clearActiveTenantKey = (): void => {
  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem(ACTIVE_TENANT_KEY);
  }
};
