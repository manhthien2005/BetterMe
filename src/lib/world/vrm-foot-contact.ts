import { VRMHumanBoneName, type VRM } from "@pixiv/three-vrm";
import { Object3D, Quaternion, Vector3 } from "three";

import type { HumanoidPose } from "./animation-state-machine";

type Leg = {
  side: "left" | "right";
  upper: Object3D;
  lower: Object3D;
  foot: Object3D;
  rest: Vector3;
  flat: Quaternion;
  anchor: Vector3 | null;
  released: boolean;
  weight: number;
  lastPosition: Vector3;
  returnFrom: Vector3 | null;
  returnTime: number;
  correction: Vector3;
};

/** Support-relative visual IK. Anchors belong to one actor, never physics. */
export function createVrmFootContact(vrm: VRM) {
  const root = vrm.scene;
  root.updateWorldMatrix(true, true);
  const legs: Leg[] = [];
  for (const side of ["left", "right"] as const) {
    const upper = vrm.humanoid?.getNormalizedBoneNode(`${side}UpperLeg` as VRMHumanBoneName);
    const lower = vrm.humanoid?.getNormalizedBoneNode(`${side}LowerLeg` as VRMHumanBoneName);
    const foot = vrm.humanoid?.getNormalizedBoneNode(`${side}Foot` as VRMHumanBoneName);
    if (upper && lower && foot) {
      legs.push({
        side, upper, lower, foot,
        rest: root.worldToLocal(foot.getWorldPosition(new Vector3())),
        flat: root.getWorldQuaternion(new Quaternion()).invert()
          .multiply(foot.getWorldQuaternion(new Quaternion())),
        anchor: null, released: false, weight: 0,
        lastPosition: foot.getWorldPosition(new Vector3()), returnFrom: null, returnTime: 0,
        correction: new Vector3()
      });
    }
  }
  const previousRoot = new Vector3(), rootPosition = new Vector3();
  const rootRotation = new Quaternion(), previousRotation = new Quaternion();
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const direction = new Vector3(), pole = new Vector3(), knee = new Vector3();
  const from = new Vector3(), to = new Vector3(), velocity = new Vector3(), target = new Vector3();
  const rotation = new Quaternion(), parentRotation = new Quaternion(), worldRotation = new Quaternion();
  const upperBase = new Quaternion(), lowerBase = new Quaternion(), footBase = new Quaternion();
  const authoredFootWorld = new Quaternion();
  let initialized = false;
  let hadGait = false;
  let previousGroundY = 0;

  function reset() {
    for (const leg of legs) {
      leg.anchor = null;
      leg.released = false;
      leg.weight = 0;
      leg.returnFrom = null;
      leg.returnTime = 0;
      leg.correction.set(0, 0, 0);
    }
    initialized = false;
    hadGait = false;
  }

  function rotateLink(bone: Object3D, child: Object3D, destination: Vector3) {
    bone.getWorldPosition(a);
    child.getWorldPosition(b);
    from.subVectors(b, a).normalize();
    to.subVectors(destination, a).normalize();
    rotation.setFromUnitVectors(from, to);
    bone.getWorldQuaternion(worldRotation).premultiply(rotation);
    bone.parent!.getWorldQuaternion(parentRotation).invert();
    bone.quaternion.copy(parentRotation.multiply(worldRotation));
    bone.updateWorldMatrix(false, true);
  }

  function update(pose: HumanoidPose, dt: number) {
    if (pose.action?.state === "jump" || pose.action?.state === "fall") {
      reset();
      return;
    }
    root.updateWorldMatrix(true, true);
    root.getWorldPosition(rootPosition);
    root.getWorldQuaternion(rootRotation);
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.1) {
      reset();
      return;
    }
    const turning = initialized && rootRotation.angleTo(previousRotation) / dt > 0.8;
    const groundY = Number.isFinite(pose.footGroundY) ? pose.footGroundY! : 0;
    if (initialized && Math.abs(groundY - previousGroundY) > 1e-5) {
      for (const leg of legs) {
        leg.anchor = null;
        leg.returnFrom = null;
        leg.correction.set(0, 0, 0);
      }
    }
    previousGroundY = groundY;
    if (initialized && rootPosition.distanceTo(previousRoot) > 0.5) reset();
    velocity.copy(rootPosition).sub(previousRoot).divideScalar(dt);
    velocity.y = 0;
    if (!initialized) velocity.set(0, 0, 0);
    previousRoot.copy(rootPosition);
    previousRotation.copy(rootRotation);
    initialized = true;
    const speed = velocity.length();
    const gait = pose.footGait;
    const authored = pose.authoredFeet;

    for (const leg of legs) {
      const contact = pose.footContacts?.[leg.side] ?? false;
      if (gait || !contact) {
        leg.returnFrom = null;
      } else if (hadGait) {
        // Release from the last visible foot, not the uncorrected gait beneath IK.
        leg.returnFrom = leg.lastPosition.clone();
        leg.returnTime = 0;
      }
      // A gait anchor must not pin the final stride over the returning idle pose.
      if (!contact || (!gait && !authored)) {
        leg.anchor = null;
        leg.released = false;
      }
      // Turn-in-place releases the old world-space anchor; it can replant after the turn.
      if (turning) {
        leg.anchor = null;
        leg.released = true;
      } else if (speed < 0.12) {
        leg.released = false;
      }
      const active = authored ? true : !turning && !leg.released && (contact || Boolean(gait));
      leg.weight += (Number(active) - leg.weight) * (1 - Math.exp(-24 * dt));
      if (leg.weight < 0.001) continue;

      leg.upper.getWorldPosition(a);
      leg.lower.getWorldPosition(b);
      leg.foot.getWorldPosition(c);
      const l1 = a.distanceTo(b), l2 = b.distanceTo(c);
      if (l1 < 1e-5 || l2 < 1e-5) continue;
      target.copy(leg.rest);
      root.localToWorld(target);
      // Preserve the asset's ankle clearance above the current supporting terrace.
      const floorY = groundY + target.y - rootPosition.y;
      target.y = floorY;

      if (authored) {
        // Keep the clip's swing path and foot roll. Only correct bounded stance slip
        // and floor penetration; release a correction gradually after toe-off.
        leg.foot.getWorldQuaternion(authoredFootWorld);
        target.copy(c);
        if (contact && !turning && speed > 0.12 && authored.weight > 0.95) {
          leg.anchor ??= c.clone();
          target.copy(leg.anchor);
        } else {
          leg.anchor = null;
          target.addScaledVector(leg.correction, Math.exp(-24 * dt));
        }
        target.y = Math.max(floorY, target.y);
        leg.correction.subVectors(target, c).clampLength(0, 0.08);
        target.copy(c).addScaledVector(leg.correction, authored.weight);
      } else if (gait && speed > 0.12) {
        const phase = leg.side === "left" ? gait.leftPhase : gait.rightPhase;
        const stanceTime = gait.stance / gait.frequency;
        const halfStride = speed * stanceTime / 2;
        let offset: number;
        if (contact) {
          offset = halfStride - speed * phase / gait.frequency;
        } else {
          const t = Math.max(0, Math.min(1, (phase - gait.stance) / (1 - gait.stance)));
          const smooth = t * t * (3 - 2 * t);
          const tangent = -speed * (1 - gait.stance) / gait.frequency;
          // Hermite endpoints have zero WORLD velocity at both contact edges.
          offset = -halfStride + 2 * halfStride * smooth + tangent * (2 * t * t * t - 3 * t * t + t);
          target.y += gait.lift * Math.sin(Math.PI * t) ** 2;
        }
        direction.copy(velocity).normalize();
        target.addScaledVector(direction, offset);
      } else if (!contact) {
        target.copy(c);
      } else {
        target.x = c.x;
        target.z = c.z;
      }

      if (contact && active && gait) {
        leg.anchor ??= target.clone();
        target.copy(leg.anchor);
      }
      if (leg.returnFrom) {
        leg.returnTime += dt;
        const t = Math.min(1, leg.returnTime / 0.2);
        target.lerpVectors(leg.returnFrom, target, t * t * (3 - 2 * t));
        if (t === 1) leg.returnFrom = null;
      }
      const distance = a.distanceTo(target);
      if (distance > l1 + l2 + 0.15) {
        leg.anchor = null;
        leg.released = true;
        continue;
      }
      const d = Math.max(0.001, Math.min(l1 + l2 - 0.0001, distance));
      direction.subVectors(target, a).normalize();
      if (authored) pole.subVectors(b, a);
      else pole.set(0, 0, 1).applyQuaternion(rootRotation);
      pole.addScaledVector(direction, -pole.dot(direction));
      if (pole.lengthSq() < 1e-6) pole.set(1, 0, 0);
      pole.normalize();
      const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
      knee.copy(a).addScaledVector(direction, along)
        .addScaledVector(pole, Math.sqrt(Math.max(0, l1 * l1 - along * along)));

      upperBase.copy(leg.upper.quaternion);
      lowerBase.copy(leg.lower.quaternion);
      footBase.copy(leg.foot.quaternion);
      rotateLink(leg.upper, leg.lower, knee);
      rotateLink(leg.lower, leg.foot, target);
      leg.foot.parent!.getWorldQuaternion(parentRotation).invert();
      leg.foot.quaternion.copy(parentRotation.multiply(authored
        ? authoredFootWorld
        : worldRotation.copy(rootRotation).multiply(leg.flat)));
      leg.upper.quaternion.copy(upperBase.slerp(leg.upper.quaternion, leg.weight));
      leg.lower.quaternion.copy(lowerBase.slerp(leg.lower.quaternion, leg.weight));
      leg.foot.quaternion.copy(footBase.slerp(leg.foot.quaternion, leg.weight));
      leg.upper.updateWorldMatrix(false, true);
      leg.foot.getWorldPosition(leg.lastPosition);
    }
    hadGait = Boolean(gait);
  }
  return { update, reset };
}
