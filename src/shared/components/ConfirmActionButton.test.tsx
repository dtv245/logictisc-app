/**
 * Verifies confirmation rendering and single-flight mutation protection.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { enSharedMessages } from "../i18n/locales/en";
import { renderWithSharedProviders } from "../testing/renderWithSharedProviders";
import {
  ConfirmActionButton,
} from "./ConfirmActionButton";
import { runSingleFlight } from "./singleFlight";

describe("runSingleFlight", () => {
  it("reuses the active promise until the action settles", async () => {
    let complete: (() => void) | undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const active = { current: null as Promise<void> | null };

    const first = runSingleFlight(active, action);
    const second = runSingleFlight(active, action);

    expect(second).toBe(first);
    await Promise.resolve();
    expect(action).toHaveBeenCalledOnce();

    complete?.();
    await first;
    expect(active.current).toBeNull();
  });
});

describe("ConfirmActionButton", () => {
  it("confirms once and exposes pending state", async () => {
    let complete: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const triggerLabel = enSharedMessages.actions.confirm;
    const description = enSharedMessages.queryError.description;

    await renderWithSharedProviders(
      <ConfirmActionButton
        triggerAriaLabel={triggerLabel}
        triggerLabel={triggerLabel}
        title={enSharedMessages.queryError.title}
        description={description}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: triggerLabel }));
    expect(await screen.findByText(description)).toBeInTheDocument();

    const confirmButton = screen.getAllByRole("button", {
      name: enSharedMessages.actions.confirm,
    })[1];
    expect(confirmButton).toBeDefined();
    if (!confirmButton) {
      return;
    }

    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      enSharedMessages.confirm.pendingAnnouncement,
    );

    complete?.();
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
