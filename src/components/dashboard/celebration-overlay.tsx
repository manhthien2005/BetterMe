import type { CSSProperties } from "react";

/**
 * The all-done celebration: gentle fireworks that bloom over the hero the
 * moment every habit for the day is complete, then fade. Purely positive —
 * never a comment on what's undone (invariant 1, no-guilt).
 *
 * The bursts are decorative (aria-hidden) and vanish entirely under
 * prefers-reduced-motion (globals.css `.firework`/`.firework-glow` →
 * display:none). A polite, name-free live region carries the good news to
 * assistive tech, and the companion's own "all done" reaction stays visible
 * regardless of motion settings.
 */

const CELEBRATION_MESSAGE = "Tuyệt vời — cả khu vườn hôm nay đã được chăm đủ! 🌸";

const PALETTE = ["#F6C6CE", "#FFD98E", "#7FB069", "#A9C6E8", "#F2B04C", "#C94F6D"];

const BURSTS = [
  { top: "30%", left: "26%", delay: 0 },
  { top: "20%", left: "52%", delay: 160 },
  { top: "32%", left: "74%", delay: 300 }
] as const;

const PARTICLES_PER_BURST = 10;

export function CelebrationOverlay({ show }: { show: boolean }) {
  return (
    <>
      <p aria-live="polite" className="sr-only" role="status">
        {show ? CELEBRATION_MESSAGE : ""}
      </p>

      {show ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          data-testid="celebration-fireworks"
        >
          {BURSTS.map((burst, burstIndex) => (
            <div key={burstIndex}>
              <span
                className="firework-glow absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  top: burst.top,
                  left: burst.left,
                  background:
                    "radial-gradient(circle, rgba(255,217,142,0.55), rgba(246,198,206,0.25) 45%, transparent 72%)"
                }}
              />
              {Array.from({ length: PARTICLES_PER_BURST }).map((_, particleIndex) => {
                const angle = (particleIndex / PARTICLES_PER_BURST) * Math.PI * 2;
                const distance = 48 + (particleIndex % 3) * 13;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;

                return (
                  <span
                    className="firework"
                    key={particleIndex}
                    style={
                      {
                        "--fw-top": burst.top,
                        "--fw-left": burst.left,
                        "--fw-dx": `${dx.toFixed(1)}px`,
                        "--fw-dy": `${dy.toFixed(1)}px`,
                        "--fw-clr": PALETTE[(burstIndex * PARTICLES_PER_BURST + particleIndex) % PALETTE.length],
                        "--fw-delay": `${burst.delay + particleIndex * 18}ms`
                      } as CSSProperties
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
