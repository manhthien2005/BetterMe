import { describe, expect, it } from "vitest";
import { Group, PerspectiveCamera } from "three";
import { positionStudyOverview } from "./plaza-study-overview";

describe("Plaza mountain overview camera", () => {
  it("moves the sky with the final camera even after a walking/map-switch frame", () => {
    const camera = new PerspectiveCamera(), sky = new Group();
    camera.position.set(0, 4, 51);sky.position.copy(camera.position);
    positionStudyOverview(camera, sky, 1440, 1000);
    expect(camera.position.toArray()).toEqual([88, 46, 176]);
    expect(sky.position.toArray()).toEqual([88, 0, 176]);
    sky.position.set(0, 0, 51);
    positionStudyOverview(camera, sky, 390, 844);
    expect(sky.position.x).toBe(camera.position.x);
    expect(sky.position.z).toBe(camera.position.z);
  });
});
