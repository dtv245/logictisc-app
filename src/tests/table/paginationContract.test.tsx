/** Keeps Ant Design render state valid when URL pagination is zero or NaN. */
import { render } from "@testing-library/react";
import { beforeAll, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { initializeAppI18n } from "@locales";
import { BaseTable } from "@table";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;
beforeAll(async () => { i18n=await initializeAppI18n({locale:"en",fallbackLocale:"en"}); });
it.each([0,-1,Number.NaN,Number.POSITIVE_INFINITY])("normalizes invalid Table current %s", current => {
  const warning=vi.spyOn(console,"error").mockImplementation(()=>{});
  try {
    render(<I18nextProvider i18n={i18n}><BaseTable columns={[]} queryResult={{}}
      tableProps={{dataSource:[],pagination:{current,pageSize:0,total:10}}} /></I18nextProvider>);
    expect(warning.mock.calls.flat().join(" ")).not.toContain("current should be positive");
  } finally { warning.mockRestore(); }
});
