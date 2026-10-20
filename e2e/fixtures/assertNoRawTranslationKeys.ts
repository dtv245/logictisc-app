import { expect, type Page } from "@playwright/test";

const rawTranslationKey =
  /\b(?:dashboard|operations|opsView|loads|load|trips|aiDispatch|forms|resources|actions|navigation|filters|crud|common|fleet|settlements|payroll|notifications|documents|optimization|executive|dispatch|queryError|asyncState)\.[A-Za-z][\w.-]*/;

/** Prevent screenshot artifacts from hiding a missing locale entry. */
export async function expectNoRawTranslationKeys(page: Page): Promise<void> {
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(rawTranslationKey);
}
