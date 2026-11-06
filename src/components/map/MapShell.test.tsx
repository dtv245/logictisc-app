import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapShell } from "./MapShell";

const state = vi.hoisted(() => ({
  supported: true,
  validation: { valid: true, token: "pk.test-token" } as {
    valid: boolean;
    token: string | null;
    reason?: "missing" | "secret_token_forbidden" | "invalid_prefix";
  },
  maps: [] as Array<{
    options: Record<string, unknown>;
    handlers: Map<string, (...args: unknown[]) => void>;
    canvas: EventTarget;
    remove: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    easeTo: ReturnType<typeof vi.fn>;
    addControl: ReturnType<typeof vi.fn>;
    isStyleLoaded: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("@/utils/tms-flow/mapbox", () => ({
  validateMapboxPublicToken: () => state.validation,
}));

vi.mock("mapbox-gl", () => {
  class MockMap {
    options: Record<string, unknown>;
    handlers = new Map<string, (...args: unknown[]) => void>();
    canvas = new EventTarget();
    remove = vi.fn();
    resize = vi.fn();
    easeTo = vi.fn();
    addControl = vi.fn();
    isStyleLoaded = vi.fn(() => true);

    constructor(options: Record<string, unknown>) {
      this.options = options;
      state.maps.push(this);
    }

    on(event: string, callback: (...args: unknown[]) => void) {
      this.handlers.set(event, callback);
      return this;
    }

    getCanvas = () => this.canvas as HTMLCanvasElement;

    off = vi.fn();
  }

  class MockNavigationControl {}

  return {
    default: {
      Map: MockMap,
      NavigationControl: MockNavigationControl,
      supported: () => state.supported,
    },
  };
});

describe("MapShell", () => {
  beforeEach(() => {
    state.maps.length = 0;
    state.supported = true;
    state.validation = { valid: true, token: "pk.test-token" };
  });

  it("renders map layers only after load and removes the map on unmount", async () => {
    const view = render(
      <MapShell leftTitle="Danh sách">
        <span>Map layer</span>
      </MapShell>,
    );

    expect(screen.queryByText("Map layer")).not.toBeInTheDocument();
    expect(state.maps).toHaveLength(1);
    expect(state.maps[0].options).toMatchObject({
      accessToken: "pk.test-token",
      center: [106.660172, 10.762622],
      minZoom: 4,
      pitch: 45,
    });
    expect(state.maps[0].addControl).toHaveBeenCalledWith(
      expect.anything(),
      "bottom-right",
    );

    state.maps[0].handlers.get("load")?.();
    expect(await screen.findByText("Map layer")).toBeInTheDocument();

    view.unmount();
    await act(async () => { await Promise.resolve(); });
    expect(state.maps[0].remove).toHaveBeenCalledOnce();
  });

  it("reuses its map during StrictMode effect replay and removes it after real unmount", async () => {
    const view = render(
      <StrictMode>
        <MapShell>
          <span>Loaded layer</span>
        </MapShell>
      </StrictMode>,
    );

    await waitFor(() => expect(state.maps).toHaveLength(1));
    expect(state.maps[0].remove).not.toHaveBeenCalled();

    view.unmount();
    await act(async () => { await Promise.resolve(); });
    expect(state.maps[0].remove).toHaveBeenCalledOnce();
  });

  it("shows the translated fallback when the public token is missing", () => {
    state.validation = { valid: false, token: null, reason: "missing" };

    render(<MapShell />);

    expect(screen.getByRole("status")).toHaveTextContent("Thiếu token bản đồ");
    expect(state.maps).toHaveLength(0);
  });

  it("shows the fallback when WebGL is unavailable", () => {
    state.supported = false;

    render(<MapShell />);

    expect(screen.getByRole("status")).toHaveTextContent("Chưa hiển thị được bản đồ");
    expect(state.maps).toHaveLength(0);
  });

  it("pauses map children on WebGL loss and restores them when the context returns", async () => {
    render(
      <MapShell>
        <span>Restored map layer</span>
      </MapShell>,
    );
    state.maps[0].handlers.get("load")?.();
    expect(await screen.findByText("Restored map layer")).toBeInTheDocument();

    const lostEvent = new Event("webglcontextlost", { cancelable: true });
    act(() => state.maps[0].canvas.dispatchEvent(lostEvent));

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Chưa hiển thị được bản đồ");
    expect(screen.queryByText("Restored map layer")).not.toBeInTheDocument();

    act(() => state.maps[0].canvas.dispatchEvent(new Event("webglcontextrestored")));
    expect(await screen.findByText("Restored map layer")).toBeInTheDocument();
  });
});
