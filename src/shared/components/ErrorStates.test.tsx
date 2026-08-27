/**
 * Verifies localized recovery states and injected navigation callbacks.
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { enSharedMessages } from "../i18n/locales/en";
import { renderWithSharedProviders } from "../testing/renderWithSharedProviders";
import {
  ConfigErrorState,
  ForbiddenState,
  NotFoundState,
} from "./ErrorStates";

describe("shared error states", () => {
  it("renders configuration details as safe text", async () => {
    const detail = "API base URL";
    await renderWithSharedProviders(
      <ConfigErrorState details={[detail]} />,
    );

    expect(
      screen.getByText(enSharedMessages.configError.title),
    ).toBeInTheDocument();
    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  it.each([
    [ForbiddenState, enSharedMessages.forbidden.title],
    [NotFoundState, enSharedMessages.notFound.title],
  ] as const)("provides recovery navigation for %s", async (State, title) => {
    const onGoHome = vi.fn();
    await renderWithSharedProviders(<State onGoHome={onGoHome} />);

    expect(screen.getByText(title)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: enSharedMessages.actions.goHome,
      }),
    );
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});
