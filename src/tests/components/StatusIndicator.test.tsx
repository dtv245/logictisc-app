/**
 * Verifies status meaning is exposed through text and an accessible role.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { enSharedMessages } from "@locales/locales/en";
import { renderWithSharedProviders } from "@test/renderWithSharedProviders";
import { StatusIndicator } from "@components/StatusIndicator";

describe("StatusIndicator", () => {
  it("uses the supplied translated label instead of color alone", async () => {
    const label = enSharedMessages.confirm.pendingAnnouncement;
    await renderWithSharedProviders(
      <StatusIndicator label={label} tone="processing" />,
    );

    expect(screen.getByRole("status", { name: label })).toHaveTextContent(label);
  });
});
