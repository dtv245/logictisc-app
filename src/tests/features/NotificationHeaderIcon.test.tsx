import { describe, expect, it, vi } from "vitest";

import { NotificationHeaderIcon } from "@/features/notifications/components/NotificationHeaderIcon";
import { playNotificationSound } from "@/features/notifications/notificationSound";

describe("NotificationHeaderIcon & Audio Sound", () => {
  it("exports NotificationHeaderIcon component and playNotificationSound helper", () => {
    expect(NotificationHeaderIcon).toBeDefined();
    expect(typeof NotificationHeaderIcon).toBe("function");
    expect(typeof playNotificationSound).toBe("function");
  });

  it("safely handles playNotificationSound when AudioContext is missing or restricted", () => {
    expect(() => playNotificationSound()).not.toThrow();
  });

  it("plays notification sound using AudioContext when available", () => {
    const startMock = vi.fn();
    const stopMock = vi.fn();
    const connectMock = vi.fn();
    const setValueAtTimeMock = vi.fn();
    const exponentialRampToValueAtTimeMock = vi.fn();

    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: "sine",
          frequency: { setValueAtTime: setValueAtTimeMock },
          connect: connectMock,
          start: startMock,
          stop: stopMock,
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: setValueAtTimeMock,
            exponentialRampToValueAtTime: exponentialRampToValueAtTimeMock,
          },
          connect: connectMock,
        };
      }
    }

    vi.stubGlobal("AudioContext", FakeAudioContext);

    playNotificationSound();

    expect(startMock).toHaveBeenCalledTimes(2);
    expect(stopMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});
