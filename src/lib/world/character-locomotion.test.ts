import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { Quaternion } from "three";
import { createLocomotionPlayer, loadLocomotionClips, parseLocomotionClips, type LocomotionBone } from "./character-locomotion";

const asset = () => parseLocomotionClips(JSON.parse(fs.readFileSync(
  "public/models/animations/locomotion.json", "utf8"
)));

describe("authored locomotion", () => {
  it("ships only two finite, closed humanoid clips with source provenance", () => {
    const data = asset();
    expect(Object.keys(data.clips)).toEqual(["walk", "run"]);
    expect(data.source.license).toBe("CC0-1.0");
    for (const clip of Object.values(data.clips)) {
      expect(clip.strideLength).toBeGreaterThan(0.5);
      for (const values of Object.values(clip.rotations)) {
        const first = new Quaternion().fromArray(values).normalize();
        const last = new Quaternion().fromArray(values, values.length - 4).normalize();
        expect(first.angleTo(last)).toBeLessThan(0.001);
        // Include the final segment into frame zero; closed endpoints alone can hide a snap.
        for (let i = 4; i < values.length; i += 4) {
          const before = new Quaternion().fromArray(values, i - 4).normalize();
          const after = new Quaternion().fromArray(values, i).normalize();
          expect(before.angleTo(after) / (clip.duration / clip.frameCount)).toBeLessThan(40);
        }
      }
    }
  });

  it("rejects corrupt clip data and lets network failures use the existing pose", async () => {
    expect(() => parseLocomotionClips({})).toThrow();
    const data = JSON.parse(fs.readFileSync("public/models/animations/locomotion.json", "utf8"));
    data.clips.walk.rotations.leftFoot[0] = null;
    expect(() => parseLocomotionClips(data)).toThrow();
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await loadLocomotionClips(fetcher);
    expect(result.ok).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses actual distance for cadence, with independent actor time and no root displacement", () => {
    const data = asset();
    const a = createLocomotionPlayer(data, data.source.hipsHeight);
    const b = createLocomotionPlayer(data, data.source.hipsHeight);
    for (let i = 0; i < 60; i++) a.sample({ kind: "walk", speed: 1 }, 1 / 60);
    for (let i = 0; i < 30; i++) b.sample({ kind: "walk", speed: 2 }, 1 / 60);
    expect(a.phase).toBeCloseTo(b.phase, 5);
    const stopped = a.phase;
    for (let i = 0; i < 60; i++) a.sample(undefined, 1 / 60);
    expect(a.phase).toBe(stopped);
    expect(a.sample(undefined, 1 / 60)).toBeNull();
    expect(b.sample({ kind: "walk", speed: 2 }, 1 / 60)?.rotations.leftFoot).toBeDefined();
    a.reset();
    expect(a.phase).toBe(0);
  });

  it.each([30, 60, 120])("fades to the existing idle and preserves swing articulation at %i Hz", hz => {
    const player = createLocomotionPlayer(asset(), 0.8);
    let previous: Quaternion | undefined;
    let movingRange = 0;
    for (let i = 0; i < hz * 2; i++) {
      const sample = player.sample({ kind: i < hz ? "walk" : "run", speed: i < hz ? 2.2 : 4 }, 1 / hz)!;
      const foot = sample.rotations.leftFoot;
      if (previous) {
        const change = previous.angleTo(foot);
        expect(change).toBeLessThan(0.6);
        movingRange += change;
      }
      previous = foot.clone();
      expect(Number.isFinite(sample.hipsOffsetY)).toBe(true);
    }
    expect(movingRange).toBeGreaterThan(1);
    for (let i = 0; i < hz; i++) player.sample(undefined, 1 / hz);
    expect(player.sample(undefined, 1 / hz)).toBeNull();
  });

  it.each(["walk", "run"] as const)("preserves authored gait/arms and does not accumulate posture while fading: %s", kind => {
    const data = asset(), before = JSON.stringify(data);
    const player = createLocomotionPlayer(data, data.source.hipsHeight);
    const clip = data.clips[kind];
    for (let i = 0; i < 180; i++) {
      const sample = player.sample({ kind, speed: kind === "run" ? 4 : 2.2 }, 1 / 60)!;
      if (i < 120) continue;
      const frame = player.phase * clip.frameCount, index = Math.floor(frame);
      for (const bone of Object.keys(clip.rotations) as LocomotionBone[]) {
        if (["chest", "upperChest", "neck", "head"].includes(bone)) continue;
        const expected = new Quaternion().fromArray(clip.rotations[bone], index * 4)
          .slerp(new Quaternion().fromArray(clip.rotations[bone], (index + 1) * 4), frame - index).normalize();
        expect(sample.rotations[bone].angleTo(expected), bone).toBeLessThan(1e-5);
      }
      const expectedHip = clip.hips[index] + (clip.hips[index + 1] - clip.hips[index]) * (frame - index);
      expect(sample.hipsOffsetY).toBeCloseTo(expectedHip, 7);
    }
    const sample = player.sample(undefined, 1 / 60)!;
    const head = sample.rotations.head.clone(), chest = sample.rotations.upperChest.clone();
    for (let i = 0; i < 6; i++) {
      const fading = player.sample(undefined, 1 / 60)!;
      expect(fading.rotations.head.angleTo(head)).toBeLessThan(1e-5);
      expect(fading.rotations.upperChest.angleTo(chest)).toBeLessThan(1e-5);
    }
    expect(JSON.stringify(data)).toBe(before);
    player.reset();
    expect(player.sample(undefined, 1 / 60)).toBeNull();
  });
});
