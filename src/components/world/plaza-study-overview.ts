import type { Camera, Object3D } from "three";

/** Final overview pose must also center the sky after the walking rig has run. */
export function positionStudyOverview(camera: Camera, sky: Object3D | undefined, width: number, height: number) {
  const fit = Math.max(1, 1.35 / (width / height));
  camera.position.set(88 * fit, 46 * fit, 16 + 160 * fit);
  camera.lookAt(-15, 18, -60);
  // After map swaps the sky's frame callback may see the walking camera first.
  // A stale center pushes the far dome beyond the camera range, leaving a hole.
  sky?.position.set(camera.position.x, 0, camera.position.z);
}
