import { describe, expect, it } from "vitest";
import { PUBLIC_PLAZA_MAP_CONFIG } from "./map-config";
import { createInitialPlayerState, stepPlayerKinematics } from "./physics";

describe("academy hop controls", () => {
  const cases = [30, 60, 120].flatMap(hz => [
    { hz, profile: "accepted flat-world hop", jumpSpeed: 4.8, minPeak: .5, maxPeak: .7 },
    { hz, profile: "current Plaza jump", jumpSpeed: PUBLIC_PLAZA_MAP_CONFIG.player.jumpSpeed, minPeak: 1.3, maxPeak: 1.6 }
  ]);
  it.each(cases)("responds immediately with no mid-air retrigger: $profile at $hz Hz", ({ hz, jumpSpeed, minPeak, maxPeak }) => {
    const map = { ...PUBLIC_PLAZA_MAP_CONFIG, player: { ...PUBLIC_PLAZA_MAP_CONFIG.player, jumpSpeed } };
    const player = createInitialPlayerState(map);
    let peak = 0, previousVelocity = 0, launches = 0;
    for (let i = 0; i < hz; i++) {
      stepPlayerKinematics(player, {
        forward: true, backward: false, left: false, right: false,
        sprint: true, jump: i < hz * .3
      }, [], map.bounds, map.player, 1 / hz);
      if (i === 0) {
        expect(player.y).toBeGreaterThan(0);
        expect(player.isGrounded).toBe(false);
      }
      if (player.velocityY > 0 && player.velocityY > previousVelocity) launches++;
      previousVelocity = player.velocityY;
      peak = Math.max(peak, player.y);
    }
    expect(launches).toBe(1);
    expect(peak).toBeGreaterThan(minPeak);
    expect(peak).toBeLessThan(maxPeak);
    expect(player.y).toBe(0);
    expect(player.isGrounded).toBe(true);
    expect(player.z).toBeCloseTo(map.spawn.position[2] - map.player.runSpeed, 5);
  });
});
