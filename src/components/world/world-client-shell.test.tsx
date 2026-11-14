import { act, fireEvent, render, screen } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldClientShell } from "@/components/world/world-client-shell";
import type {
  CameraOrbitCommandBuffer,
  WorldSceneCallbacks
} from "@/components/world/world-scene";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { clearHcmcWeatherCacheForTests } from "@/lib/world/environment-weather";
import {
  clearHudR3fSampleForTests,
  createR3fFrameWindowAccumulator,
  handleR3fVisibilityChange,
  publishHudR3fSample,
  stepR3fFrameWindowAccumulator
} from "@/lib/world/performance-monitor";
import type { MovementInput, PersonalWorldOwnerState, WorldMapConfig } from "@/lib/world/types";

const bridge = vi.hoisted(() => ({
  callbacks: null as WorldSceneCallbacks | null,
  movementInputRef: null as MutableRefObject<MovementInput> | null,
  cameraCommandRef: null as MutableRefObject<CameraOrbitCommandBuffer> | null,
  config: null as WorldMapConfig | null,
  ownerState: null as PersonalWorldOwnerState | null,
  activeDialogueNpcId: null as string | null,
  activeDialogueLineIndex: null as number | null,
  interactionWaveTrigger: 0,
  environment: null as EffectiveEnvironmentSnapshot | null
}));

vi.mock("@/components/world/world-canvas", () => ({
  WorldCanvas: ({
    config,
    ownerState,
    callbacks,
    movementInputRef,
    cameraCommandRef,
    activeDialogueNpcId = null,
    activeDialogueLineIndex = null,
    interactionWaveTrigger = 0,
    environment = null
  }: {
    config: WorldMapConfig;
    ownerState: PersonalWorldOwnerState | null;
    callbacks: WorldSceneCallbacks;
    movementInputRef: MutableRefObject<MovementInput>;
    cameraCommandRef: MutableRefObject<CameraOrbitCommandBuffer>;
    activeDialogueNpcId?: string | null;
    activeDialogueLineIndex?: number | null;
    interactionWaveTrigger?: number;
    environment?: EffectiveEnvironmentSnapshot | null;
  }) => {
    bridge.config = config;
    bridge.ownerState = ownerState;
    bridge.callbacks = callbacks;
    bridge.movementInputRef = movementInputRef;
    bridge.cameraCommandRef = cameraCommandRef;
    bridge.activeDialogueNpcId = activeDialogueNpcId;
    bridge.activeDialogueLineIndex = activeDialogueLineIndex;
    bridge.interactionWaveTrigger = interactionWaveTrigger;
    bridge.environment = environment;

    return <div data-testid="world-canvas-stub" />;
  }
}));

const FIXED_INITIAL_NOW_MS = Date.parse("2026-11-07T07:30:00.000Z"); // 14:30 in Asia/Ho_Chi_Minh

describe("WorldClientShell (V0.2)", () => {
  it("pauses walking in the overview and restores the study after visiting personal space", async () => {
    render(<WorldClientShell plazaStudy userEmail="study@betterme.vn" initialNowMs={FIXED_INITIAL_NOW_MS} />);
    await screen.findByTestId("world-canvas-stub");
    expect(screen.getByRole("heading", { name: "Núi quanh Plaza" })).toBeTruthy();
    expect(screen.getByText("16 cụm núi · 3 lớp cảnh quan")).toBeTruthy();
    expect(bridge.config?.plazaStudy).toBe(true);
    expect(bridge.environment?.mode).toBe("preview");
    expect(bridge.environment?.dayPhase).toBe("noon");
    fireEvent.keyDown(window, { code: "KeyW" });
    expect(bridge.movementInputRef?.current.forward).toBe(false);
    fireEvent.keyUp(window, { code: "KeyW" });
    fireEvent.click(screen.getByRole("button", { name: "Đi bộ" }));
    fireEvent.keyDown(window, { code: "KeyW" });
    expect(bridge.movementInputRef?.current.forward).toBe(true);
    fireEvent.keyUp(window, { code: "KeyW" });
    act(() => bridge.callbacks?.onNearbyPortalChange("portal-to-personal-world"));
    fireEvent.keyDown(window, { code: "KeyE" });
    expect(bridge.config?.spaceId).toBe("personal_world");
    expect(bridge.config?.plazaStudy).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Về Quảng trường Chung" }));
    expect(bridge.config?.plazaStudy).toBe(true);
    expect(bridge.config?.spawn.position).toEqual([0, 0, 40]);
  });
  beforeEach(() => {
    clearHcmcWeatherCacheForTests();
    clearHudR3fSampleForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            current: {
              time: "2026-11-07T14:30",
              interval: 900,
              temperature_2m: 31,
              relative_humidity_2m: 72,
              weather_code: 2,
              cloud_cover: 45,
              precipitation: 0
            },
            daily: {
              time: ["2026-11-07", "2026-11-08"],
              sunrise: ["2026-11-07T05:48", "2026-11-08T05:49"],
              sunset: ["2026-11-07T17:27", "2026-11-08T17:27"]
            }
          }),
          { status: 200 }
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearHcmcWeatherCacheForTests();
    clearHudR3fSampleForTests();
  });

  it("starts in Public Plaza, transitions via Portal (E) into Personal World (Home/Garden/Library), and handles NPC dialogue", async () => {
    render(
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={FIXED_INITIAL_NOW_MS}
      />
    );

    expect(await screen.findByTestId("world-canvas-stub")).toBeTruthy();
    const main = screen.getByRole("main", { name: "Không gian 3D Reading Quest" });
    expect(main.getAttribute("data-space-id")).toBe("public_plaza");
    expect(main.getAttribute("data-owner-id")).toBe("user-scholar-1");
    expect(screen.getByRole("heading", { name: "Quảng trường Chung" })).toBeTruthy();

    // Physical KeyW + ShiftLeft + Space (Jump) work even when Vietnamese Telex produces key="ư".
    fireEvent.keyDown(window, { code: "KeyW", key: "ư" });
    fireEvent.keyDown(window, { code: "ShiftLeft", key: "Shift" });
    fireEvent.keyDown(window, { code: "Space", key: " " });
    expect(bridge.movementInputRef?.current).toEqual({
      forward: true,
      backward: false,
      left: false,
      right: false,
      sprint: true,
      jump: true
    });

    // Window blur clears stuck keys safely.
    fireEvent(window, new Event("blur"));
    expect(bridge.movementInputRef?.current.forward).toBe(false);
    expect(bridge.movementInputRef?.current.sprint).toBe(false);
    expect(bridge.movementInputRef?.current.jump).toBe(false);

    // Approach Portal to Personal World in Public Plaza and press E to travel.
    act(() => {
      bridge.callbacks?.onNearbyPortalChange("portal-to-personal-world");
    });
    expect(
      screen.getByRole("button", { name: "Vào Không gian Cá nhân (E)" })
    ).toBeTruthy();

    fireEvent.keyDown(window, { code: "KeyE", key: "e" });

    // Now inside Personal World owned by user-scholar-1
    expect(main.getAttribute("data-space-id")).toBe("personal_world");
    expect(bridge.ownerState?.ownerUserId).toBe("user-scholar-1");
    expect(screen.getByText(/Chủ sở hữu: scholar@betterme\.vn/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nhà riêng Cá nhân" })).toBeTruthy();

    // Visit Personal Garden and then Personal Library + approach Librarian Minh.
    act(() => {
      bridge.callbacks?.onZoneChange("personal_garden");
    });
    expect(screen.getByRole("heading", { name: "Khu vườn Cá nhân" })).toBeTruthy();

    act(() => {
      bridge.callbacks?.onZoneChange("personal_library");
      bridge.callbacks?.onNearbyNpcChange("npc-librarian-minh");
    });
    expect(screen.getByRole("heading", { name: "Thư viện Cá nhân" })).toBeTruthy();
    expect(screen.getByText("E — Tương tác")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trò chuyện (E)" })).toBeTruthy();

    // Press E to open dialogue panel and trigger character wave (interact) state.
    fireEvent.keyDown(window, { code: "KeyE", key: "e" });
    const dialog = screen.getByRole("dialog", { name: /Hội thoại cùng Thủ thư Minh/ });
    expect(dialog).toBeTruthy();
    expect(main.getAttribute("data-animation-state")).toBe("interact");
    expect(bridge.activeDialogueNpcId).toBe("npc-librarian-minh");
    expect(bridge.activeDialogueLineIndex).toBe(0);
    expect(bridge.interactionWaveTrigger).toBeGreaterThan(0);
    expect(screen.getByText(/Chào mừng bạn về với Thư viện Cá nhân/)).toBeTruthy();

    // Press E to advance to line 2.
    fireEvent.keyDown(window, { code: "KeyE", key: "e" });
    expect(screen.getByText(/Không gian Cá nhân này thuộc quyền sở hữu của riêng bạn/)).toBeTruthy();
    expect(bridge.activeDialogueLineIndex).toBe(1);

    // Press Escape to close dialogue immediately and return character to normal idle gameplay state.
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(main.getAttribute("data-animation-state")).toBe("idle");
    expect(bridge.activeDialogueNpcId).toBeNull();
    expect(bridge.activeDialogueLineIndex).toBeNull();
  });

  it("accumulates right-mouse drag orbit, wheel zoom, and KeyR camera reset while ignoring HUD pointer events", async () => {
    render(
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={FIXED_INITIAL_NOW_MS}
      />
    );
    await screen.findByTestId("world-canvas-stub");
    const main = screen.getByRole("main", { name: "Không gian 3D Reading Quest" });

    // Right mouse drag on the 3D viewport rotates yaw and pitch.
    fireEvent.mouseDown(main, { button: 2, clientX: 400, clientY: 300 });
    fireEvent.mouseMove(main, { clientX: 480, clientY: 260 });
    fireEvent.mouseUp(main, { button: 2 });

    expect(bridge.cameraCommandRef?.current.deltaYaw).toBeLessThan(0);
    expect(bridge.cameraCommandRef?.current.deltaPitch).toBeLessThan(0);

    // Mouse wheel on 3D viewport zooms camera.
    fireEvent.wheel(main, { deltaY: -100 });
    expect(bridge.cameraCommandRef?.current.deltaZoom).toBeLessThan(0);

    // Wheel event inside HUD does not zoom the 3D camera.
    const previousZoom = bridge.cameraCommandRef?.current.deltaZoom ?? 0;
    const hudSection = screen.getByLabelText("Khu vực hiện tại");
    fireEvent.wheel(hudSection, { deltaY: 120 });
    expect(bridge.cameraCommandRef?.current.deltaZoom).toBe(previousZoom);

    // Pressing R requests camera reset.
    fireEvent.keyDown(window, { code: "KeyR", key: "r" });
    expect(bridge.cameraCommandRef?.current.resetRequested).toBe(true);
  });

  it("auto-closes open dialogue if the player walks away from the NPC", async () => {
    render(
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={FIXED_INITIAL_NOW_MS}
      />
    );
    await screen.findByTestId("world-canvas-stub");

    act(() => {
      bridge.callbacks?.onNearbyNpcChange("npc-steward-khoa");
    });
    fireEvent.keyDown(window, { code: "KeyE", key: "e" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    act(() => {
      bridge.callbacks?.onPlayerMoveTick(0, 0, 8, false, true);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resets active animation state and open dialogue cleanly when switching between Public Plaza and Personal World", async () => {
    render(
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={FIXED_INITIAL_NOW_MS}
      />
    );
    await screen.findByTestId("world-canvas-stub");
    const main = screen.getByRole("main", { name: "Không gian 3D Reading Quest" });

    act(() => {
      bridge.callbacks?.onNearbyNpcChange("npc-steward-khoa");
    });
    fireEvent.keyDown(window, { code: "KeyE", key: "e" });
    expect(main.getAttribute("data-animation-state")).toBe("interact");
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Switch space via HUD button while waving/in dialogue -> resets cleanly to idle & closes dialogue
    fireEvent.click(screen.getByRole("button", { name: "Vào Không gian Cá nhân" }));
    expect(main.getAttribute("data-space-id")).toBe("personal_world");
    expect(main.getAttribute("data-animation-state")).toBe("idle");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(bridge.activeDialogueNpcId).toBeNull();
  });

  it("renders HCMC Environment V1 HUD, applies Preview Mode presets & simulated weather in parity with 3D Canvas, and restores live state via 'Trở về thực tế'", async () => {
    render(
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={FIXED_INITIAL_NOW_MS}
      />
    );
    await screen.findByTestId("world-canvas-stub");
    const main = screen.getByRole("main", { name: "Không gian 3D Reading Quest" });

    // Environment HUD & Performance HUD are visible in live mode with Open-Meteo attribution
    const envHud = screen.getByTestId("world-environment-hud");
    expect(envHud.getAttribute("data-environment-mode")).toBe("live");
    expect(screen.getByText("TP.HCM")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open-Meteo" })).toBeTruthy();
    expect(bridge.environment?.mode).toBe("live");

    const perfHud = screen.getByTestId("world-performance-hud");
    expect(perfHud).toBeTruthy();
    expect(perfHud.getAttribute("data-sample-state")).toBe("pending");
    expect(screen.getByTestId("perf-fps-value").textContent).toBe("— FPS");
    expect(screen.getByTestId("perf-frametime-value").textContent).toBe("— ms");

    // Open Performance popover and verify telemetry sections
    fireEvent.click(perfHud);
    expect(
      await screen.findByRole("heading", { name: "Hiệu suất 3D & Web" })
    ).toBeTruthy();
    expect(screen.getByText("Nhịp vòng R3F (Frame Loop)")).toBeTruthy();
    expect(screen.queryByText("FPS thấp nhất (Rolling)")).toBeNull();
    expect(screen.getByText("WebGL Renderer (Three.js)")).toBeTruthy();
    expect(screen.getByText("Bộ nhớ & Hiển thị Web")).toBeTruthy();

    // Open "Xem thử môi trường" popover
    const previewTrigger = screen.getByRole("button", { name: "Xem thử môi trường" });
    fireEvent.click(previewTrigger);

    expect(
      await screen.findByRole("heading", { name: "Xem thử môi trường TP.HCM" })
    ).toBeTruthy();

    // Select Night preset ("Đêm (20:30)"), Spring preset ("Xuân (Th4)"), and Rain ("Có mưa")
    fireEvent.click(screen.getByRole("button", { name: "Đêm (20:30)" }));
    fireEvent.click(screen.getByRole("button", { name: "Xuân (Th4)" }));
    fireEvent.click(screen.getByRole("button", { name: "Có mưa" }));

    // HUD and 3D Canvas receive the exact same preview snapshot
    expect(screen.getByTestId("environment-preview-badge").textContent).toBe("Đang xem thử");
    expect(main.getAttribute("data-environment-mode")).toBe("preview");
    expect(main.getAttribute("data-day-phase")).toBe("night");
    expect(main.getAttribute("data-season")).toBe("spring");
    expect(main.getAttribute("data-weather-kind")).toBe("rain");

    expect(bridge.environment?.isPreview).toBe(true);
    expect(bridge.environment?.time24h).toBe("20:30");
    expect(bridge.environment?.dayPhase).toBe("night");
    expect(bridge.environment?.season).toBe("spring");
    expect(bridge.environment?.weatherKind).toBe("rain");
    expect(bridge.environment?.isRaining).toBe(true);

    // Click "Trở về thực tế" to exit Preview Mode and restore live state
    const exitButtons = screen.getAllByRole("button", { name: /Trở về thực tế/ });
    fireEvent.click(exitButtons[0]);

    expect(screen.queryByTestId("environment-preview-badge")).toBeNull();
    expect(main.getAttribute("data-environment-mode")).toBe("live");
    expect(bridge.environment?.mode).toBe("live");
    expect(bridge.environment?.isPreview).toBe(false);
  });

  it("hydrates cleanly across a minute boundary (15:18:59.950Z -> 15:19:00.050Z) with a pending forecast, matching 22:18 on initial hydrate and advancing to 22:19 on mount without recoverable errors", async () => {
    const ssrNowMs = Date.parse("2026-11-08T15:18:59.950Z"); // 22:18:59.950 in Asia/Ho_Chi_Minh
    const hydrateNowMs = Date.parse("2026-11-08T15:19:00.050Z"); // 22:19:00.050 in Asia/Ho_Chi_Minh

    // Pending forecast that never resolves during initial mount
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );

    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(ssrNowMs);

    const element = (
      <WorldClientShell
        authenticatedUser={{
          userId: "user-scholar-1",
          email: "scholar@betterme.vn"
        }}
        initialNowMs={ssrNowMs}
      />
    );

    const serverHtml = renderToString(element);
    expect(serverHtml).toContain("22:18");

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Advance clock across minute boundary before client hydration
    dateNowSpy.mockReturnValue(hydrateNowMs);

    const recoverableErrors: unknown[] = [];
    const seenHydrationTimes: string[] = [];
    const observer = new MutationObserver(() => {
      const currentText =
        container.querySelector('[data-testid="environment-time-24h"]')?.textContent ?? "";
      if (currentText && seenHydrationTimes.at(-1) !== currentText) {
        seenHydrationTimes.push(currentText);
      }
    });
    const initialDomText =
      container.querySelector('[data-testid="environment-time-24h"]')?.textContent ?? "";
    if (initialDomText) {
      seenHydrationTimes.push(initialDomText);
    }
    observer.observe(container, { childList: true, characterData: true, subtree: true });

    let root: ReturnType<typeof hydrateRoot> | null = null;

    try {
      await act(async () => {
        root = hydrateRoot(container, element, {
          onRecoverableError: (err) => {
            recoverableErrors.push(err);
          }
        });
      });

      expect(recoverableErrors).toEqual([]);
      expect(seenHydrationTimes[0]).toBe("22:18");
      const timeNode = container.querySelector('[data-testid="environment-time-24h"]');
      expect(timeNode?.textContent).toBe("22:19");
      expect(seenHydrationTimes).toEqual(["22:18", "22:19"]);

      // Wait for dynamic WorldCanvas stub to mount and confirm unified snapshot across HUD & Canvas
      await screen.findByTestId("world-canvas-stub");
      expect(bridge.environment?.time24h).toBe("22:19");

      // Even while forecast is still pending/slow, switching spaces uses the shared snapshot
      const switchBtn = container.querySelector(
        'button[aria-label="Vào Không gian Cá nhân"], button'
      );
      expect(switchBtn).toBeTruthy();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Vào Không gian Cá nhân" }));
      });
      expect(bridge.environment?.time24h).toBe("22:19");
    } finally {
      observer.disconnect();
      if (root) {
        await act(async () => {
          root?.unmount();
        });
      }
      container.remove();
      dateNowSpy.mockRestore();
    }
  });

  it("shows '—' on the Performance HUD before samples arrive, reflects slow visible intervals (>=250ms) once a 1s R3F window completes, and clears/skips the resume gap on visibilitychange", async () => {
    vi.useFakeTimers();
    const baseNow = Date.parse("2026-11-08T08:00:00.000Z");
    vi.setSystemTime(baseNow);

    try {
      render(
        <WorldClientShell
          authenticatedUser={{
            userId: "user-scholar-1",
            email: "scholar@betterme.vn"
          }}
          initialNowMs={baseNow}
        />
      );

      const perfHud = screen.getByTestId("world-performance-hud");
      expect(perfHud.getAttribute("data-sample-state")).toBe("pending");
      expect(screen.getByTestId("perf-fps-value").textContent).toBe("— FPS");
      expect(screen.getByTestId("perf-frametime-value").textContent).toBe("— ms");

      // Simulate PlayerRig.useFrame accumulating 30 normal frames (20ms) + 2 slow visible frames (300ms each >= 250ms)
      const acc = createR3fFrameWindowAccumulator();
      for (let i = 0; i < 30; i += 1) {
        stepR3fFrameWindowAccumulator(acc, 0.02, baseNow + i * 20, false);
      }
      stepR3fFrameWindowAccumulator(acc, 0.3, baseNow + 900, false);
      const sample = stepR3fFrameWindowAccumulator(acc, 0.3, baseNow + 1_200, false);
      expect(sample?.fps).toBe(27);
      expect(sample?.frameTimeMs).toBe(37.5);
      publishHudR3fSample(sample);

      await act(async () => {
        vi.advanceTimersByTime(1_000);
      });

      expect(perfHud.getAttribute("data-sample-state")).toBe("ready");
      expect(perfHud.getAttribute("data-fps")).toBe("27");
      expect(screen.getByTestId("perf-fps-value").textContent).toBe("27 FPS");
      expect(screen.getByTestId("perf-frametime-value").textContent).toBe("37.5 ms");

      // Simulate tab hidden & resume: window is cleared, HUD resets to '— FPS', and first interval after resume is skipped
      handleR3fVisibilityChange(acc);
      publishHudR3fSample(acc.lastPublishedSample);
      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(perfHud.getAttribute("data-sample-state")).toBe("pending");
      expect(screen.getByTestId("perf-fps-value").textContent).toBe("— FPS");
      expect(screen.getByTestId("perf-frametime-value").textContent).toBe("— ms");

      // First interval after resume (e.g. 4.5s background gap) is skipped
      expect(stepR3fFrameWindowAccumulator(acc, 4.5, baseNow + 6_000, false)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
