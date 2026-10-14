/** Translates stable API codes and safe params; legacy messages remain a fallback. */
import i18n, { type TFunction } from "i18next";
import type { ErrorParams } from "@/types/api.types";

export function resolveApiErrorMessage(
  code: string,
  params: ErrorParams = {},
  fallback: string = code,
  t: TFunction = i18n.t.bind(i18n),
  kind: "codes" | "fields" = "codes",
): string {
  for (const key of [`apiErrors.${kind}.${code}`, `contractErrors.${code}`]) {
    const translated = t(key, { ...params, defaultValue: "" });
    if (typeof translated === "string" && translated && translated !== key && !/\{\{[^}]+\}\}/.test(translated)) return translated;
  }
  return fallback;
}
