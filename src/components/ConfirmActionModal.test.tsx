import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionModal } from "./ConfirmActionModal";

const i18n = createInstance();
await i18n.use(initReactI18next).init({
  lng: "en",
  resources: {
    en: {
      translation: {
        actions: { cancel: "Cancel", confirm: "Confirm" },
        confirm: { pendingAnnouncement: "Action in progress" },
      },
    },
  },
  interpolation: { escapeValue: false },
});

function renderConfirmAction(onConfirm: () => Promise<void> | void) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <ConfirmActionModal
          triggerLabel="Approve"
          triggerAriaLabel="Approve action"
          title="Confirm action"
          description="This action will be sent to the service."
          onConfirm={onConfirm}
        />
      </ConfigProvider>
    </I18nextProvider>,
  );
}

describe("ConfirmActionModal", () => {
  it("keeps the dialog open and retryable after a rejected action", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Conflict"));
    renderConfirmAction(onConfirm);

    fireEvent.click(screen.getByRole("button", { name: "Approve action" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirm action" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(within(screen.getByRole("dialog", { name: "Confirm action" })).getByRole("button", { name: "Confirm" })).not.toBeDisabled();
    });
  });

  it("closes after the action succeeds", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderConfirmAction(onConfirm);

    const trigger = screen.getByRole("button", { name: "Approve action" });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Confirm action" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    // Ant Design retains the exiting dialog in the portal while its close
    // transition runs; the trigger becomes enabled once the dialog is closed.
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
