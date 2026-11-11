import {
  VRMExpressionPresetName,
  VRMHumanBoneName,
  VRMLoaderPlugin,
  VRMUtils,
  type VRM
} from "@pixiv/three-vrm";
import { Euler, Mesh, Quaternion, Vector3, type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  HUMANOID_BONE_KEYS,
  type CharacterExpressionWeights,
  type HumanoidBoneKey,
  type HumanoidPose
} from "@/lib/world/animation-state-machine";
import { validateVrmWebDistributionLicense } from "@/lib/world/character-assets";

export type VrmSpringTuningSummary = {
  readonly hairLongJoints: number;
  readonly hairShortJoints: number;
  readonly clothLowerJoints: number;
  readonly clothUpperJoints: number;
};

export type LoadedVrmCharacterRig = {
  readonly vrm: VRM;
  readonly scene: Object3D;
  readonly restHipsY: number;
  readonly loadTimeMs: number;
  readonly meshCount: number;
  readonly primitiveCount: number;
  readonly triangleCount: number;
  readonly humanoidBoneCount: number;
  readonly expressionNames: readonly string[];
  readonly springTuningSummary: VrmSpringTuningSummary;
  readonly licenseSummary: {
    readonly name: string;
    readonly version: string;
    readonly authors: readonly string[];
    readonly licenseUrl: string;
  };
};

export type VrmLoadOutcome =
  | { readonly ok: true; readonly rig: LoadedVrmCharacterRig }
  | { readonly ok: false; readonly reason: string; readonly loadTimeMs: number };

export type VrmBoneWorldSnapshot = {
  readonly head: readonly [number, number, number];
  readonly hips: readonly [number, number, number];
  readonly leftHand: readonly [number, number, number];
  readonly rightHand: readonly [number, number, number];
  readonly leftFoot: readonly [number, number, number];
  readonly rightFoot: readonly [number, number, number];
};

const BONE_NAME_MAP: Readonly<Record<HumanoidBoneKey, VRMHumanBoneName>> = {
  hips: VRMHumanBoneName.Hips,
  spine: VRMHumanBoneName.Spine,
  chest: VRMHumanBoneName.Chest,
  upperChest: VRMHumanBoneName.UpperChest,
  neck: VRMHumanBoneName.Neck,
  head: VRMHumanBoneName.Head,
  leftShoulder: VRMHumanBoneName.LeftShoulder,
  leftUpperArm: VRMHumanBoneName.LeftUpperArm,
  leftLowerArm: VRMHumanBoneName.LeftLowerArm,
  leftHand: VRMHumanBoneName.LeftHand,
  rightShoulder: VRMHumanBoneName.RightShoulder,
  rightUpperArm: VRMHumanBoneName.RightUpperArm,
  rightLowerArm: VRMHumanBoneName.RightLowerArm,
  rightHand: VRMHumanBoneName.RightHand,
  leftUpperLeg: VRMHumanBoneName.LeftUpperLeg,
  leftLowerLeg: VRMHumanBoneName.LeftLowerLeg,
  leftFoot: VRMHumanBoneName.LeftFoot,
  rightUpperLeg: VRMHumanBoneName.RightUpperLeg,
  rightLowerLeg: VRMHumanBoneName.RightLowerLeg,
  rightFoot: VRMHumanBoneName.RightFoot
};

const scratchEuler = new Euler(0, 0, 0, "XYZ");
const scratchQuat = new Quaternion();
const scratchVec3 = new Vector3();

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function inspectSceneGeometry(root: Object3D): {
  meshCount: number;
  primitiveCount: number;
  triangleCount: number;
} {
  let meshCount = 0;
  let primitiveCount = 0;
  let triangleCount = 0;

  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      meshCount += 1;
      primitiveCount += 1;
      const geom = obj.geometry;
      if (geom) {
        if (geom.index) {
          triangleCount += Math.floor(geom.index.count / 3);
        } else if (geom.attributes.position) {
          triangleCount += Math.floor(geom.attributes.position.count / 3);
        }
      }
    }
  });

  return { meshCount, primitiveCount, triangleCount };
}

const MAX_SPRING_STABLE_DT = 0.085;
const TARGET_SPRING_SUBSTEP_DT = 1 / 60;

/**
 * Selectively tunes VRM 1.0 springbone chains by group (long back hair, short bangs/sidelocks,
 * lower clothing hem, and upper sleeves) while keeping spring simulation active and responsive.
 * Prevents world-space air drag (`center = null`) from lifting hair horizontally during walk/run
 * and adds missing damping to low-drag (`0.05`) clothing chains so hems settle smoothly on stop.
 */
export function tuneVrmSpringBones(vrm: VRM): VrmSpringTuningSummary {
  let hairLongJoints = 0;
  let hairShortJoints = 0;
  let clothLowerJoints = 0;
  let clothUpperJoints = 0;

  const joints = vrm.springBoneManager?.joints;
  if (!joints) {
    return {
      hairLongJoints,
      hairShortJoints,
      clothLowerJoints,
      clothUpperJoints
    };
  }

  for (const joint of joints) {
    const boneName = joint.bone?.name ?? "";
    const lower = boneName.toLowerCase();
    const settings = joint.settings;

    if (
      lower.includes("topsupperleg") ||
      lower.includes("skirt") ||
      lower.includes("coat") ||
      lower.includes("bottom")
    ) {
      settings.stiffness = 2.4;
      settings.dragForce = 0.22;
      settings.gravityPower = 0.35;
      settings.gravityDir.set(0, -1, 0);
      clothLowerJoints += 1;
    } else if (
      lower.includes("topsupperarm") ||
      lower.includes("sleeve") ||
      lower.includes("ribbon")
    ) {
      settings.stiffness = 2.5;
      settings.dragForce = 0.24;
      settings.gravityPower = 0.18;
      settings.gravityDir.set(0, -1, 0);
      clothUpperJoints += 1;
    } else if (lower.includes("hair")) {
      const match = /hair(\d+)_(\d+)/i.exec(boneName);
      const linkIdx = match ? Number(match[1]) : 1;
      const groupIdx = match ? Number(match[2]) : 5;
      const isLongBackChain = groupIdx >= 5 && groupIdx <= 10;

      if (isLongBackChain) {
        const t = Math.min(1, Math.max(0, (linkIdx - 1) / 5));
        settings.stiffness = 3.2 - t * 0.85;
        settings.dragForce = 0.24 + t * 0.05;
        settings.gravityPower = 1.45 + t * 0.2;
        settings.gravityDir.set(0, -1, 0);
        hairLongJoints += 1;
      } else {
        const t = Math.min(1, Math.max(0, (linkIdx - 1) / 3));
        settings.stiffness = 3.4 - t * 0.6;
        settings.dragForce = 0.28;
        settings.gravityPower = 0.75;
        settings.gravityDir.set(0, -1, 0);
        hairShortJoints += 1;
      }
    }
  }

  return {
    hairLongJoints,
    hairShortJoints,
    clothLowerJoints,
    clothUpperJoints
  };
}

/**
 * Synchronizes VRM world matrices (including any parent rig Group), resets all
 * springbone tails, and pre-settles gravity in-place so spawn, portal/space switch,
 * and tab resume start at exact gravity equilibrium with zero whip or drop bounce.
 */
export function resetCharacterVrmSprings(
  rig: LoadedVrmCharacterRig | null | undefined
): void {
  if (!rig) return;
  rig.scene.updateWorldMatrix(true, true);
  const sbm = rig.vrm.springBoneManager;
  if (!sbm) return;
  sbm.reset();
  for (let i = 0; i < 18; i += 1) {
    sbm.update(TARGET_SPRING_SUBSTEP_DT);
  }
}

/**
 * Prepares a parsed `@pixiv/three-vrm` instance for real-time 3D scene rendering
 * and validates its embedded distribution license metadata.
 */
export function prepareLoadedVrm(vrm: VRM, loadTimeMs: number): VrmLoadOutcome {
  const meta = vrm.meta;
  const metaRecord = meta as unknown as {
    name?: string;
    version?: string;
    authors?: string[];
    licenseUrl?: string;
    avatarPermission?: string;
    allowRedistribution?: boolean;
  };

  const licenseCheck = validateVrmWebDistributionLicense({
    avatarPermission: metaRecord.avatarPermission,
    allowRedistribution: metaRecord.allowRedistribution,
    licenseUrl:
      metaRecord.licenseUrl ??
      (meta.metaVersion === "0" ? "https://vrm.dev/licenses/1.0/" : undefined)
  });

  if (!licenseCheck.valid) {
    return {
      ok: false,
      reason: licenseCheck.reason ?? "VRM license validation failed.",
      loadTimeMs
    };
  }

  VRMUtils.removeUnnecessaryVertices(vrm.scene);
  VRMUtils.combineSkeletons(vrm.scene);

  // VRM 0.x models face -Z by default; rotate them to match VRM 1.0 (+Z forward)
  if (meta.metaVersion === "0") {
    VRMUtils.rotateVRM0(vrm);
  }

  vrm.scene.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;
    }
  });

  const springTuningSummary = tuneVrmSpringBones(vrm);
  vrm.scene.updateWorldMatrix(true, true);
  vrm.springBoneManager?.reset();

  const hipsNode = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Hips);
  const restHipsY = hipsNode ? hipsNode.position.y : 0;

  const { meshCount, primitiveCount, triangleCount } = inspectSceneGeometry(vrm.scene);
  const humanoidBoneCount = Object.keys(vrm.humanoid?.humanBones ?? {}).length;
  const expressionNames = vrm.expressionManager
    ? vrm.expressionManager.expressions.map((expr) => expr.expressionName)
    : [];

  return {
    ok: true,
    rig: {
      vrm,
      scene: vrm.scene,
      restHipsY,
      loadTimeMs,
      meshCount,
      primitiveCount,
      triangleCount,
      humanoidBoneCount,
      expressionNames,
      springTuningSummary,
      licenseSummary: {
        name: metaRecord.name ?? "VRM Avatar",
        version: metaRecord.version ?? meta.metaVersion,
        authors: metaRecord.authors ?? [],
        licenseUrl: metaRecord.licenseUrl ?? "https://vrm.dev/licenses/1.0/"
      }
    }
  };
}

/**
 * Loads a `.vrm` character model from a URL using `GLTFLoader` + `VRMLoaderPlugin`.
 * Never throws; returns `{ ok: false, reason, loadTimeMs }` on failure so callers
 * can safely render a fallback avatar.
 */
export async function loadCharacterVrm(url: string): Promise<VrmLoadOutcome> {
  const start = nowMs();

  try {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(url);
    const loadTimeMs = Math.max(1, Math.round(nowMs() - start));
    const vrm = gltf.userData.vrm as VRM | undefined;

    if (!vrm || !vrm.humanoid) {
      return {
        ok: false,
        reason: `Loaded asset "${url}" does not contain a valid VRM humanoid rig.`,
        loadTimeMs
      };
    }

    return prepareLoadedVrm(vrm, loadTimeMs);
  } catch (error) {
    const loadTimeMs = Math.max(1, Math.round(nowMs() - start));
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: `Failed to load VRM from "${url}": ${message}`,
      loadTimeMs
    };
  }
}

/**
 * Applies a blended `HumanoidPose` and facial `CharacterExpressionWeights`
 * to a loaded VRM rig in deterministic order:
 * 1. Parent/root world matrices synced (`updateWorldMatrix(true, false)`).
 * 2. Normalized humanoid bones & expressions applied.
 * 3. `vrm.update(subDt)` runs ONCE per frame (humanoid -> constraints -> materials -> spring step 1),
 *    with springbone-only substeps on 30-45 Hz frames and clean spring reset after abnormal stalls.
 */
export function applyPoseToVrm(
  rig: LoadedVrmCharacterRig,
  pose: HumanoidPose,
  expressions: CharacterExpressionWeights,
  dtSeconds: number
): void {
  const rawDt = Number.isFinite(dtSeconds) ? Math.max(dtSeconds, 0) : 0;
  const poseDt = Math.min(rawDt, 0.1);
  const slerpAlpha = poseDt > 0 ? 1 - Math.exp(-52 * poseDt) : 1;
  const { vrm } = rig;
  const humanoid = vrm.humanoid;

  // Ensure parent Group transform (position + yaw) is reflected in matrixWorld before spring step
  rig.scene.updateWorldMatrix(true, false);

  if (humanoid) {
    for (const key of HUMANOID_BONE_KEYS) {
      const boneName = BONE_NAME_MAP[key];
      const node = humanoid.getNormalizedBoneNode(boneName);
      if (!node) continue;

      const [rx, ry, rz] = pose.bones[key];
      scratchEuler.set(rx, ry, rz, "XYZ");
      scratchQuat.setFromEuler(scratchEuler);
      node.quaternion.slerp(scratchQuat, slerpAlpha);
    }

    const hipsNode = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips);
    if (hipsNode) {
      const targetY = rig.restHipsY + pose.hipsOffsetY;
      hipsNode.position.y += (targetY - hipsNode.position.y) * slerpAlpha;
    }
  }

  const expr = vrm.expressionManager;
  if (expr) {
    expr.setValue(VRMExpressionPresetName.Blink, expressions.blink);
    expr.setValue(VRMExpressionPresetName.Happy, expressions.happy);
    expr.setValue(VRMExpressionPresetName.Relaxed, expressions.relaxed);
    expr.setValue(VRMExpressionPresetName.Surprised, expressions.surprised);
    expr.setValue(VRMExpressionPresetName.Aa, expressions.aa);
  }

  if (rawDt <= 0) {
    vrm.update(0);
    return;
  }

  if (rawDt > MAX_SPRING_STABLE_DT) {
    vrm.update(TARGET_SPRING_SUBSTEP_DT);
    resetCharacterVrmSprings(rig);
    return;
  }

  const substeps = Math.min(3, Math.max(1, Math.ceil(rawDt / TARGET_SPRING_SUBSTEP_DT)));
  const subDt = rawDt / substeps;
  vrm.update(subDt);
  for (let step = 1; step < substeps; step += 1) {
    vrm.springBoneManager?.update(subDt);
  }
}

/**
 * Reads world-space positions of key humanoid bones for automated animation
 * verification and browser QA telemetry.
 */
export function sampleVrmBoneWorldPositions(vrm: VRM): VrmBoneWorldSnapshot {
  vrm.scene.updateMatrixWorld(true);

  const readBone = (boneName: VRMHumanBoneName): readonly [number, number, number] => {
    const node =
      vrm.humanoid?.getRawBoneNode(boneName) ??
      vrm.humanoid?.getNormalizedBoneNode(boneName);
    if (!node) return [0, 0, 0];
    node.getWorldPosition(scratchVec3);
    return [
      Math.round(scratchVec3.x * 1000) / 1000,
      Math.round(scratchVec3.y * 1000) / 1000,
      Math.round(scratchVec3.z * 1000) / 1000
    ];
  };

  return {
    head: readBone(VRMHumanBoneName.Head),
    hips: readBone(VRMHumanBoneName.Hips),
    leftHand: readBone(VRMHumanBoneName.LeftHand),
    rightHand: readBone(VRMHumanBoneName.RightHand),
    leftFoot: readBone(VRMHumanBoneName.LeftFoot),
    rightFoot: readBone(VRMHumanBoneName.RightFoot)
  };
}

/** Safely releases GPU geometries, materials, and textures owned by a VRM instance. */
export function disposeCharacterVrm(vrm: VRM | null | undefined): void {
  if (!vrm) return;
  VRMUtils.deepDispose(vrm.scene);
}
