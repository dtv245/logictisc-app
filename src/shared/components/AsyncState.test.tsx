/**
 * Covers loading, error, empty and populated rendering for AsyncStateView.
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { enSharedMessages } from "../i18n/locales/en";
import { renderWithSharedProviders } from "../testing/renderWithSharedProviders";
import {
  AsyncStateView,
} from "./AsyncState";
import {
  resolveAsyncState,
  type AsyncState,
} from "./asyncStateModel";

const renderState = async (state: AsyncState<readonly string[]>) =>
  renderWithSharedProviders(
    <AsyncStateView
      state={state}
      children={(items) => <div>{items.join(",")}</div>}
    />,
  );

describe("AsyncStateView", () => {
  it("renders and announces loading", async () => {
    await renderState({ status: "loading" });

    expect(
      screen.getAllByText(enSharedMessages.asyncState.loading),
    ).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      enSharedMessages.asyncState.loading,
    );
  });

  it("renders an error recovery action", async () => {
    const onRetry = vi.fn();
    await renderWithSharedProviders(
      <AsyncStateView
        state={{ status: "error", error: new Error() }}
        onRetry={onRetry}
        children={() => null}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: enSharedMessages.actions.retry,
      }),
    );

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent(
      enSharedMessages.queryError.title,
    );
  });

  it("renders the localized empty state", async () => {
    await renderState({ status: "empty" });

    expect(
      screen.getByText(enSharedMessages.asyncState.emptyTitle, {
        selector: "strong",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enSharedMessages.asyncState.emptyDescription),
    ).toBeInTheDocument();
  });

  it("renders populated content", async () => {
    await renderState({ status: "populated", data: ["first", "second"] });

    expect(screen.getByText("first,second")).toBeInTheDocument();
  });
});

describe("resolveAsyncState", () => {
  it("derives empty and populated states without duplicating query data", () => {
    expect(
      resolveAsyncState({
        isLoading: false,
        data: [],
        isEmpty: (items: readonly string[]) => items.length === 0,
      }),
    ).toEqual({ status: "empty" });

    expect(
      resolveAsyncState({
        isLoading: false,
        data: ["item"],
        isEmpty: (items: readonly string[]) => items.length === 0,
      }),
    ).toEqual({ status: "populated", data: ["item"] });
  });
});
