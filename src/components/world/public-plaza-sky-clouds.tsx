"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
  type Texture
} from "three";

export type PlazaCloudTextureId =
  | "cumulus-0"
  | "cumulus-1"
  | "cumulus-2"
  | "cumulus-3"
  | "layered-0"
  | "layered-1"
  | "layered-2"
  | "layered-3"
  | "distant-0"
  | "distant-1"
  | "distant-2"
  | "distant-3";

export type PlazaCloudDepthLayer = "hero" | "mid" | "distant";

export const PLAZA_V2_CLOUD_TEXTURE_PATHS: Readonly<
  Record<PlazaCloudTextureId, string>
> = {
  "cumulus-0": "/world/plaza/sky/v2/clouds/cumulus-0.png",
  "cumulus-1": "/world/plaza/sky/v2/clouds/cumulus-1.png",
  "cumulus-2": "/world/plaza/sky/v2/clouds/cumulus-2.png",
  "cumulus-3": "/world/plaza/sky/v2/clouds/cumulus-3.png",
  "layered-0": "/world/plaza/sky/v2/clouds/layered-0.png",
  "layered-1": "/world/plaza/sky/v2/clouds/layered-1.png",
  "layered-2": "/world/plaza/sky/v2/clouds/layered-2.png",
  "layered-3": "/world/plaza/sky/v2/clouds/layered-3.png",
  "distant-0": "/world/plaza/sky/v2/clouds/distant-0.png",
  "distant-1": "/world/plaza/sky/v2/clouds/distant-1.png",
  "distant-2": "/world/plaza/sky/v2/clouds/distant-2.png",
  "distant-3": "/world/plaza/sky/v2/clouds/distant-3.png"
};

const ALL_CLOUD_TEXTURE_IDS = Object.keys(
  PLAZA_V2_CLOUD_TEXTURE_PATHS
) as PlazaCloudTextureId[];

export interface PlazaV2CloudSpriteDef {
  id: string;
  textureId: PlazaCloudTextureId;
  layer: PlazaCloudDepthLayer;
  flipX?: boolean;
  position: [number, number, number];
  scale: [number, number, number];
  rollZ: number;
  /** Atmospheric blend toward local sky dome color (`0.10–0.18` hero, `0.22–0.32` mid, `0.40–0.55` distant). */
  skyBlend: number;
  /** Softens outer alpha silhouette (`1.0` hero, `1.12` mid, `1.28` distant). */
  edgeSoftness: number;
  /** Multiplier on global cloudOpacity (`0.96` hero, `0.88` mid, `0.78` distant). */
  opacityScale: number;
  minCloudCover: number;
  maxCloudCover?: number;
  renderOrder: number;
}

/**
 * Depth-layered 360° cloud composition for Public Plaza Sky Refinement V2:
 * - Uses 12 independent 512×512 textures (`cumulus-0..3`, `layered-0..3`, `distant-0..3`).
 * - Guarantees zero silhouette repetition within any single camera viewing direction.
 * - Arranges clouds into 3 atmospheric depth layers (`hero`, `mid`, `distant`) with
 *   progressive sky-color blending (`0.12–0.17` hero, `0.24–0.31` mid, `0.42–0.54` distant).
 */
export const PLAZA_V2_CLOUD_SPRITES: readonly PlazaV2CloudSpriteDef[] = [
  // ============================================================================
  // NORTH SECTOR (Spawn & North Look-up View: azimuth -55° .. +55°)
  // Zero repeated textureIds across the entire northern vista
  // ============================================================================

  // Clear-sky light framing (<= 23% cloud cover)
  {
    id: "v2-n-clear-nw-shoulder",
    textureId: "cumulus-3",
    layer: "mid",
    flipX: true,
    position: [-46.0, 9.4, -104.5],
    scale: [33.0, 20.5, 1],
    rollZ: 0.02,
    skyBlend: 0.24,
    edgeSoftness: 1.1,
    opacityScale: 0.9,
    minCloudCover: 0,
    maxCloudCover: 23,
    renderOrder: -9
  },
  {
    id: "v2-n-clear-ne-tail",
    textureId: "cumulus-1",
    layer: "mid",
    flipX: false,
    position: [47.0, 8.8, -104.0],
    scale: [35.0, 20.0, 1],
    rollZ: -0.02,
    skyBlend: 0.25,
    edgeSoftness: 1.1,
    opacityScale: 0.9,
    minCloudCover: 0,
    maxCloudCover: 23,
    renderOrder: -9
  },

  // Partly cloudy & above (>= 24% cloud cover): Hero + Mid + Distant depth hierarchy
  {
    id: "v2-nw-hero-tower",
    textureId: "cumulus-0",
    layer: "hero",
    flipX: false,
    position: [-38.0, 10.2, -106.5],
    scale: [37.0, 25.0, 1],
    rollZ: 0.02,
    skyBlend: 0.13,
    edgeSoftness: 1.0,
    opacityScale: 0.97,
    minCloudCover: 24,
    renderOrder: -8
  },
  {
    id: "v2-ne-hero-shoulder",
    textureId: "cumulus-3",
    layer: "hero",
    flipX: false,
    position: [43.0, 9.5, -105.0],
    scale: [39.0, 23.5, 1],
    rollZ: -0.02,
    skyBlend: 0.14,
    edgeSoftness: 1.0,
    opacityScale: 0.96,
    minCloudCover: 24,
    renderOrder: -8
  },
  {
    id: "v2-wnw-mid-bank",
    textureId: "layered-0",
    layer: "mid",
    flipX: false,
    position: [-72.0, 8.4, -88.0],
    scale: [38.0, 19.5, 1],
    rollZ: 0.025,
    skyBlend: 0.27,
    edgeSoftness: 1.12,
    opacityScale: 0.88,
    minCloudCover: 24,
    renderOrder: -9
  },
  {
    id: "v2-nne-mid-dissolve",
    textureId: "layered-3",
    layer: "mid",
    flipX: false,
    position: [66.0, 8.6, -93.0],
    scale: [35.0, 19.5, 1],
    rollZ: -0.025,
    skyBlend: 0.26,
    edgeSoftness: 1.12,
    opacityScale: 0.88,
    minCloudCover: 24,
    renderOrder: -9
  },
  {
    id: "v2-ene-mid-lenticular",
    textureId: "layered-2",
    layer: "mid",
    flipX: false,
    position: [88.0, 10.4, -74.0],
    scale: [34.0, 18.5, 1],
    rollZ: -0.03,
    skyBlend: 0.29,
    edgeSoftness: 1.14,
    opacityScale: 0.86,
    minCloudCover: 28,
    renderOrder: -9
  },
  {
    id: "v2-nnw-distant-horizon-bank",
    textureId: "distant-3",
    layer: "distant",
    flipX: false,
    position: [-56.0, 7.4, -102.0],
    scale: [40.0, 15.5, 1],
    rollZ: 0.015,
    skyBlend: 0.48,
    edgeSoftness: 1.28,
    opacityScale: 0.78,
    minCloudCover: 18,
    renderOrder: -10
  },
  {
    id: "v2-n-distant-feather",
    textureId: "distant-0",
    layer: "distant",
    flipX: false,
    position: [-42.0, 19.4, -107.0],
    scale: [36.0, 17.5, 1],
    rollZ: -0.02,
    skyBlend: 0.45,
    edgeSoftness: 1.26,
    opacityScale: 0.78,
    minCloudCover: 0,
    renderOrder: -10
  },
  {
    id: "v2-ne-distant-strands",
    textureId: "distant-3",
    layer: "distant",
    flipX: true,
    position: [28.0, 15.6, -112.0],
    scale: [38.0, 15.0, 1],
    rollZ: -0.015,
    skyBlend: 0.46,
    edgeSoftness: 1.26,
    opacityScale: 0.78,
    minCloudCover: 0,
    renderOrder: -10
  },
  {
    id: "v2-n-zenith-distant-puffs",
    textureId: "distant-1",
    layer: "distant",
    flipX: false,
    position: [-3.0, 21.8, -114.5],
    scale: [40.0, 18.5, 1],
    rollZ: 0.015,
    skyBlend: 0.5,
    edgeSoftness: 1.3,
    opacityScale: 0.76,
    minCloudCover: 16,
    renderOrder: -11
  },

  // ============================================================================
  // EAST / SOUTHEAST SECTOR (07:30 Morning Sun View: azimuth +65° .. +145°)
  // ============================================================================
  {
    id: "v2-e-hero-tail-cluster",
    textureId: "cumulus-1",
    layer: "hero",
    flipX: false,
    position: [112.0, 10.2, 6.0],
    scale: [40.0, 23.0, 1],
    rollZ: 0.02,
    skyBlend: 0.14,
    edgeSoftness: 1.0,
    opacityScale: 0.96,
    minCloudCover: 0,
    renderOrder: -8
  },
  {
    id: "v2-ese-mid-anvil",
    textureId: "layered-1",
    layer: "mid",
    flipX: false,
    position: [74.0, 9.6, 86.0],
    scale: [41.0, 22.5, 1],
    rollZ: -0.02,
    skyBlend: 0.25,
    edgeSoftness: 1.12,
    opacityScale: 0.89,
    minCloudCover: 16,
    renderOrder: -9
  },
  {
    id: "v2-ese-mid-broken-pair",
    textureId: "cumulus-2",
    layer: "mid",
    flipX: false,
    position: [98.0, 8.6, 56.0],
    scale: [34.0, 19.0, 1],
    rollZ: 0.02,
    skyBlend: 0.28,
    edgeSoftness: 1.14,
    opacityScale: 0.86,
    minCloudCover: 24,
    renderOrder: -9
  },
  {
    id: "v2-e-distant-feather",
    textureId: "distant-0",
    layer: "distant",
    flipX: true,
    position: [104.0, 21.5, 44.0],
    scale: [38.0, 18.5, 1],
    rollZ: -0.04,
    skyBlend: 0.45,
    edgeSoftness: 1.26,
    opacityScale: 0.8,
    minCloudCover: 0,
    renderOrder: -10
  },
  {
    id: "v2-ese-distant-horizon-bank",
    textureId: "distant-3",
    layer: "distant",
    flipX: false,
    position: [86.0, 7.2, 78.0],
    scale: [42.0, 15.0, 1],
    rollZ: 0.015,
    skyBlend: 0.52,
    edgeSoftness: 1.3,
    opacityScale: 0.76,
    minCloudCover: 20,
    renderOrder: -11
  },

  // ============================================================================
  // SOUTH SECTOR (12:15 Noon View: azimuth +145° .. +215°)
  // ============================================================================
  {
    id: "v2-sse-mid-tower",
    textureId: "cumulus-0",
    layer: "mid",
    flipX: true,
    position: [28.0, 9.8, 110.5],
    scale: [35.0, 22.5, 1],
    rollZ: 0.02,
    skyBlend: 0.25,
    edgeSoftness: 1.1,
    opacityScale: 0.88,
    minCloudCover: 0,
    renderOrder: -9
  },
  {
    id: "v2-s-mid-bank",
    textureId: "layered-0",
    layer: "mid",
    flipX: true,
    position: [-14.0, 8.4, 114.0],
    scale: [38.0, 18.5, 1],
    rollZ: -0.015,
    skyBlend: 0.29,
    edgeSoftness: 1.14,
    opacityScale: 0.86,
    minCloudCover: 18,
    renderOrder: -9
  },
  {
    id: "v2-ssw-hero-shoulder",
    textureId: "cumulus-3",
    layer: "hero",
    flipX: true,
    position: [-54.0, 10.0, 99.5],
    scale: [38.0, 23.0, 1],
    rollZ: -0.02,
    skyBlend: 0.15,
    edgeSoftness: 1.0,
    opacityScale: 0.95,
    minCloudCover: 0,
    renderOrder: -8
  },
  {
    id: "v2-s-distant-strands",
    textureId: "distant-2",
    layer: "distant",
    flipX: true,
    position: [12.0, 22.8, 115.0],
    scale: [38.0, 16.5, 1],
    rollZ: -0.18,
    skyBlend: 0.54,
    edgeSoftness: 1.32,
    opacityScale: 0.48,
    minCloudCover: 18,
    renderOrder: -10
  },

  // ============================================================================
  // WEST / SOUTHWEST SECTOR (15:30 Afternoon Sun View: azimuth +215° .. +305°)
  // ============================================================================
  {
    id: "v2-w-hero-tail-cluster",
    textureId: "cumulus-1",
    layer: "hero",
    flipX: true,
    position: [-112.0, 10.2, 8.0],
    scale: [40.0, 23.0, 1],
    rollZ: -0.02,
    skyBlend: 0.14,
    edgeSoftness: 1.0,
    opacityScale: 0.96,
    minCloudCover: 0,
    renderOrder: -8
  },
  {
    id: "v2-wsw-mid-broken-pair",
    textureId: "cumulus-2",
    layer: "mid",
    flipX: true,
    position: [-84.0, 9.4, 76.0],
    scale: [36.0, 20.5, 1],
    rollZ: 0.02,
    skyBlend: 0.25,
    edgeSoftness: 1.12,
    opacityScale: 0.89,
    minCloudCover: 18,
    renderOrder: -9
  },
  {
    id: "v2-wnw-mid-anvil",
    textureId: "layered-1",
    layer: "mid",
    flipX: true,
    position: [-102.0, 8.8, -46.0],
    scale: [38.0, 21.0, 1],
    rollZ: 0.02,
    skyBlend: 0.27,
    edgeSoftness: 1.12,
    opacityScale: 0.88,
    minCloudCover: 24,
    renderOrder: -9
  },
  {
    id: "v2-w-distant-horizon-bank",
    textureId: "distant-3",
    layer: "distant",
    flipX: true,
    position: [-106.0, 7.2, 38.0],
    scale: [42.0, 15.5, 1],
    rollZ: -0.015,
    skyBlend: 0.52,
    edgeSoftness: 1.3,
    opacityScale: 0.76,
    minCloudCover: 16,
    renderOrder: -11
  },
  {
    id: "v2-wsw-distant-feather",
    textureId: "distant-0",
    layer: "distant",
    flipX: false,
    position: [-94.0, 20.8, 66.0],
    scale: [38.0, 18.5, 1],
    rollZ: 0.035,
    skyBlend: 0.45,
    edgeSoftness: 1.26,
    opacityScale: 0.8,
    minCloudCover: 0,
    renderOrder: -10
  },
  {
    id: "v2-wnw-distant-puffs",
    textureId: "distant-1",
    layer: "distant",
    flipX: true,
    position: [-98.0, 18.5, -28.0],
    scale: [36.0, 17.5, 1],
    rollZ: -0.03,
    skyBlend: 0.48,
    edgeSoftness: 1.28,
    opacityScale: 0.78,
    minCloudCover: 22,
    renderOrder: -10
  },

  // ============================================================================
  // OVERCAST & RAIN HIGH-COVER CANOPY (>= 68% cloud cover)
  // ============================================================================
  {
    id: "v2-overcast-n-center-anvil",
    textureId: "layered-1",
    layer: "mid",
    flipX: false,
    position: [-2.0, 13.8, -112.5],
    scale: [48.0, 24.5, 1],
    rollZ: 0.01,
    skyBlend: 0.24,
    edgeSoftness: 1.12,
    opacityScale: 0.94,
    minCloudCover: 68,
    renderOrder: -8
  },
  {
    id: "v2-overcast-n-upper-dissolve",
    textureId: "layered-3",
    layer: "mid",
    flipX: true,
    position: [8.0, 23.0, -113.0],
    scale: [50.0, 26.0, 1],
    rollZ: -0.015,
    skyBlend: 0.28,
    edgeSoftness: 1.15,
    opacityScale: 0.92,
    minCloudCover: 76,
    renderOrder: -9
  },
  {
    id: "v2-overcast-e-veil",
    textureId: "layered-0",
    layer: "mid",
    flipX: true,
    position: [98.0, 16.5, 52.0],
    scale: [50.0, 24.0, 1],
    rollZ: 0.01,
    skyBlend: 0.26,
    edgeSoftness: 1.14,
    opacityScale: 0.92,
    minCloudCover: 72,
    renderOrder: -8
  },
  {
    id: "v2-overcast-w-veil",
    textureId: "layered-2",
    layer: "mid",
    flipX: false,
    position: [-98.0, 16.5, 52.0],
    scale: [50.0, 24.0, 1],
    rollZ: -0.01,
    skyBlend: 0.26,
    edgeSoftness: 1.14,
    opacityScale: 0.92,
    minCloudCover: 72,
    renderOrder: -8
  }
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Samples the exact Public Plaza sky dome color behind a cloud sprite at `(px, py, pz)`
 * so atmospheric depth blending (`uSkyBlend`) matches the local sky gradient and solar glow.
 */
export function sampleLocalSkyColorForCloud(params: {
  spritePosition: readonly [number, number, number];
  fogColor: Color;
  horizonColor: Color;
  midColor: Color;
  zenithColor: Color;
  sunGlowColor: Color;
  sunDirection: readonly [number, number, number];
  sunGlowStrength: number;
  outColor: Color;
}): Color {
  const {
    spritePosition,
    fogColor,
    horizonColor,
    midColor,
    zenithColor,
    sunGlowColor,
    sunDirection,
    sunGlowStrength,
    outColor
  } = params;

  const [px, py, pz] = spritePosition;
  const horiz = Math.hypot(px, pz) || 1;
  // Project sprite ray onto the sky dome surface (horiz radius ~124m, camera height ~2.4m)
  const worldRelY = (py - 2.4) * (124 / horiz);

  if (worldRelY < -0.2) {
    const tFog = smoothstep(-4.4, -0.2, worldRelY);
    outColor.copy(fogColor).lerp(horizonColor, tFog);
  } else if (worldRelY < 5.2) {
    const tMid = smoothstep(-0.2, 5.2, worldRelY);
    outColor.copy(horizonColor).lerp(midColor, tMid);
  } else {
    const tZenith = smoothstep(5.2, 15.8, worldRelY);
    outColor.copy(midColor).lerp(zenithColor, tZenith);
  }

  if (sunGlowStrength > 0.01 && worldRelY > -3.5) {
    const [sdx, sdy, sdz] = sunDirection;
    const sLen = Math.hypot(sdx, sdy, sdz) || 1;
    const nxSun = sdx / sLen;
    const nySun = sdy / sLen;
    const nzSun = sdz / sLen;

    const rayY = py - 2.4;
    const vLen = Math.hypot(px, rayY, pz) || 1;
    const vx = px / vLen;
    const vy = rayY / vLen;
    const vz = pz / vLen;
    const dotSun = clamp01(vx * nxSun + vy * nySun + vz * nzSun);
    if (dotSun > 0.02) {
      const horizonBand = 1 - smoothstep(-0.04, 0.44, Math.abs(vy - nySun));
      const glow =
        (Math.pow(dotSun, 5.0) * 0.34 +
          Math.pow(dotSun, 2.2) * horizonBand * 0.2) *
        sunGlowStrength;
      if (glow > 0.002) {
        outColor.lerp(sunGlowColor, clamp01(glow));
      }
    }
  }

  return outColor;
}

/**
 * Projects the world-space unit solar vector `sunDirection` into the cloud sprite's
 * screen-oriented tangent basis `(rightWorld, upWorld, forwardTowardCamera)`:
 * - `x > 0`: sun is to the right of the sprite (`vSpriteUv.x > 0.5`)
 * - `x < 0`: sun is to the left of the sprite (`vSpriteUv.x < 0.5`)
 * - `y > 0`: sun is above the sprite (`vSpriteUv.y > 0.5`)
 * - `z > 0`: sun is behind/beside the cloud illuminating its rim/forward face
 */
export function computeSpriteSpaceSunDirection(
  spritePosition: readonly [number, number, number],
  sunDirection: readonly [number, number, number],
  outVec: Vector3
): Vector3 {
  const [px, , pz] = spritePosition;
  const horiz = Math.hypot(px, pz) || 1;
  // Under rotation Y = atan2(-px, -pz), local +X in world space is (-pz/horiz, 0, px/horiz)
  const rightX = -pz / horiz;
  const rightZ = px / horiz;
  // Forward toward plaza/camera is (-px/horiz, 0, -pz/horiz), outward toward sky is (px/horiz, 0, pz/horiz)
  const outwardX = px / horiz;
  const outwardZ = pz / horiz;

  const [sdx, sdy, sdz] = sunDirection;
  const sunRight = sdx * rightX + sdz * rightZ;
  const sunUp = sdy;
  const sunOutward = sdx * outwardX + sdz * outwardZ;

  outVec.set(sunRight, sunUp, 0.35 + 0.65 * Math.max(-0.4, sunOutward)).normalize();
  return outVec;
}

/**
 * Creates a gently curved sky-tangent patch geometry for an individual 512×512 cloud texture.
 * Stores unflipped screen-space UV in attribute `aSpriteUv` so directional sun shading in
 * sprite space always matches world compass orientation even when `flipX = true`.
 */
export function createSingleCloudSpriteGeometry(flipX: boolean): BufferGeometry {
  const geo = new PlaneGeometry(1, 1, 10, 6);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const spriteUvAttr = uv.clone();
  geo.setAttribute("aSpriteUv", spriteUvAttr);

  const pad = 4 / 512;
  const uMin = pad;
  const uMax = 1 - pad;
  const vMin = pad;
  const vMax = 1 - pad;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const curveZ = -(x * x) * 0.042 - (y * y) * 0.018;
    pos.setZ(i, curveZ);

    const rawU = uv.getX(i);
    const rawV = uv.getY(i);
    spriteUvAttr.setXY(i, rawU, rawV);

    const mappedU = flipX
      ? uMax - rawU * (uMax - uMin)
      : uMin + rawU * (uMax - uMin);
    const mappedV = vMin + rawV * (vMax - vMin);
    uv.setXY(i, mappedU, mappedV);
  }

  pos.needsUpdate = true;
  uv.needsUpdate = true;
  spriteUvAttr.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const CLOUD_VERTEX_SHADER = /* glsl */ `
  attribute vec2 aSpriteUv;
  varying vec2 vTextureUv;
  varying vec2 vSpriteUv;

  void main() {
    vTextureUv = uv;
    vSpriteUv = aSpriteUv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const CLOUD_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uLocalSkyColor;
  uniform vec3 uCloudBodyColor;
  uniform vec3 uSunlitColor;
  uniform vec3 uBellyColor;
  uniform vec3 uSunDirSprite;
  uniform float uSkyBlend;
  uniform float uEdgeSoftness;
  uniform float uOpacity;
  uniform float uSunShadingStrength;

  varying vec2 vTextureUv;
  varying vec2 vSpriteUv;

  void main() {
    vec4 texel = texture2D(uMap, vTextureUv);
    if (texel.a <= 0.004) {
      discard;
    }

    // Centered sprite coordinates in [-1, 1] aligned with world compass tangent frame
    vec2 p = (vSpriteUv - 0.5) * 2.0;
    float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));

    // Smooth puff normal in sprite space combining horizontal slope, vertical height, and painted relief
    float nx = clamp(p.x * 1.25, -1.0, 1.0);
    float ny = clamp(p.y * 1.15 + (lum - 0.68) * 1.1, -1.0, 1.0);
    float nz = sqrt(max(0.14, 1.0 - nx * nx * 0.46 - ny * ny * 0.44));
    vec3 spriteNormal = normalize(vec3(nx, ny, nz));

    vec3 sunDir = normalize(uSunDirSprite);
    float sunDot = dot(spriteNormal, sunDir);
    float tangentSunDot = p.x * sunDir.x * 1.15 + p.y * sunDir.y * 0.95;

    // Directional solar warmth on the sun-facing slope & outer rim, soft cool shadow on the opposite/lower belly
    float sunSlope = smoothstep(-0.12, 0.62, tangentSunDot + (lum - 0.72) * 0.65) * uSunShadingStrength;
    float rimGlow = pow(clamp(1.0 - texel.a, 0.0, 1.0), 1.15) * smoothstep(0.02, 0.62, tangentSunDot) * uSunShadingStrength;
    float awaySide = 1.0 - smoothstep(-0.62, 0.22, tangentSunDot);
    float lowerBelly = 1.0 - smoothstep(-0.72, 0.18, p.y);
    float bellyShadow = clamp(awaySide * 0.66 + lowerBelly * 0.44 - sunSlope * 0.35, 0.0, 1.0) * (0.48 + 0.52 * uSunShadingStrength);

    vec3 baseRgb = texel.rgb * uCloudBodyColor;
    vec3 liftedSunRgb = pow(clamp(baseRgb, 0.0, 1.0), vec3(0.72)) * uSunlitColor;
    vec3 withBelly = mix(baseRgb, uBellyColor, clamp(bellyShadow * 0.64, 0.0, 0.68));
    vec3 directionalLit = mix(withBelly, liftedSunRgb, clamp(sunSlope * 0.62 + rimGlow * 0.58, 0.0, 0.88));

    // Atmospheric depth blending into local sky color at this cloud's altitude, stronger along wispy outer fringes
    float fringeFactor = pow(clamp(1.0 - texel.a, 0.0, 1.0), 1.35);
    float skyMix = clamp(uSkyBlend + fringeFactor * (0.22 + uSkyBlend * 0.58), 0.0, 0.88);
    vec3 finalRgb = mix(directionalLit, uLocalSkyColor, skyMix);

    float shapedAlpha = pow(clamp(texel.a, 0.0, 1.0), uEdgeSoftness) * uOpacity;
    gl_FragColor = vec4(finalRgb, shapedAlpha);
    #include <colorspace_fragment>
  }
`;

export function createPlazaCloudShaderMaterial(params: {
  map: Texture | null;
  skyBlend: number;
  edgeSoftness: number;
  opacity: number;
}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: CLOUD_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    fog: false,
    toneMapped: false,
    uniforms: {
      uMap: { value: params.map },
      uLocalSkyColor: { value: new Color("#43aafb") },
      uCloudBodyColor: { value: new Color("#ffffff") },
      uSunlitColor: { value: new Color("#fff8e4") },
      uBellyColor: { value: new Color("#7ea6d8") },
      uSunDirSprite: { value: new Vector3(0.5, 0.7, 0.5).normalize() },
      uSkyBlend: { value: params.skyBlend },
      uEdgeSoftness: { value: params.edgeSoftness },
      uOpacity: { value: params.opacity },
      uSunShadingStrength: { value: 0.82 }
    }
  });
}

export function usePlazaV2CloudResources(fallbackTexture: Texture | null) {
  const [loadedCount, setLoadedCount] = useState(0);
  const texturesRef = useRef<Map<PlazaCloudTextureId, Texture>>(new Map());

  const geometries = useMemo(
    () => ({
      normal: createSingleCloudSpriteGeometry(false),
      flipped: createSingleCloudSpriteGeometry(true)
    }),
    []
  );

  const spriteMaterials = useMemo(() => {
    const map = new Map<string, ShaderMaterial>();
    for (const sprite of PLAZA_V2_CLOUD_SPRITES) {
      map.set(
        sprite.id,
        createPlazaCloudShaderMaterial({
          map: fallbackTexture,
          skyBlend: sprite.skyBlend,
          edgeSoftness: sprite.edgeSoftness,
          opacity: sprite.opacityScale
        })
      );
    }
    return map;
  }, [fallbackTexture]);

  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();
    const loadedTextures: Texture[] = [];
    const texturesMap = texturesRef.current;

    for (const texId of ALL_CLOUD_TEXTURE_IDS) {
      const url = PLAZA_V2_CLOUD_TEXTURE_PATHS[texId];

      loader.load(
        url,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = SRGBColorSpace;
          tex.wrapS = ClampToEdgeWrapping;
          tex.wrapT = ClampToEdgeWrapping;
          tex.generateMipmaps = true;
          tex.minFilter = LinearMipmapLinearFilter;
          tex.magFilter = LinearFilter;
          tex.needsUpdate = true;

          loadedTextures.push(tex);
          texturesMap.set(texId, tex);

          for (const sprite of PLAZA_V2_CLOUD_SPRITES) {
            if (sprite.textureId === texId) {
              const mat = spriteMaterials.get(sprite.id);
              if (mat) {
                mat.uniforms.uMap.value = tex;
                mat.needsUpdate = true;
              }
            }
          }
          setLoadedCount((c) => c + 1);
        },
        undefined,
        () => {
          // Per-asset graceful fallback: keep `fallbackTexture` on failed sprite without breaking other clouds
        }
      );
    }

    return () => {
      cancelled = true;
      geometries.normal.dispose();
      geometries.flipped.dispose();
      spriteMaterials.forEach((mat) => mat.dispose());
      loadedTextures.forEach((tex) => tex.dispose());
      texturesMap.clear();
    };
  }, [geometries, spriteMaterials]);

  return {
    geometries,
    spriteMaterials,
    loadedCount,
    hasAnyCloudTexture: loadedCount > 0 || fallbackTexture !== null
  };
}

export function updatePlazaV2CloudMaterials(params: {
  spriteMaterials: Map<string, ShaderMaterial>;
  fogColor: Color;
  horizonColor: Color;
  midColor: Color;
  zenithColor: Color;
  sunGlowColor: Color;
  cloudBodyColor: Color;
  sunDirection: readonly [number, number, number];
  sunGlowStrength: number;
  cloudOpacity: number;
  isNight: boolean;
  isRaining: boolean;
  weatherKind: string;
  scratchColorA: Color;
  scratchColorB: Color;
  scratchColorC: Color;
  scratchVec: Vector3;
}): void {
  const {
    spriteMaterials,
    fogColor,
    horizonColor,
    midColor,
    zenithColor,
    sunGlowColor,
    cloudBodyColor,
    sunDirection,
    sunGlowStrength,
    cloudOpacity,
    isNight,
    isRaining,
    weatherKind,
    scratchColorA,
    scratchColorB,
    scratchColorC,
    scratchVec
  } = params;

  // Warm sunlit crown/rim color and sky-harmonized cool belly color
  const lowSunWarmth = isNight ? 0 : clamp01((0.75 - sunDirection[1]) / 0.52);
  const sunlitColor = scratchColorB
    .copy(cloudBodyColor)
    .lerp(sunGlowColor, isNight ? 0.25 : 0.48 + lowSunWarmth * 0.34);
  if (!isNight) {
    sunlitColor.r = Math.min(1, sunlitColor.r * (1.03 + lowSunWarmth * 0.05));
    sunlitColor.g = Math.min(1, sunlitColor.g * (1.01 + lowSunWarmth * 0.01));
    sunlitColor.b = Math.max(0, sunlitColor.b * (0.98 - lowSunWarmth * 0.08));
  }

  const bellyColor = scratchColorC
    .copy(midColor)
    .lerp(zenithColor, 0.28)
    .lerp(cloudBodyColor, isNight ? 0.22 : 0.32);

  const sunShadingStrength = isNight
    ? 0.22
    : isRaining
      ? 0.26
      : weatherKind === "overcast"
        ? 0.36
        : 0.88;

  for (const sprite of PLAZA_V2_CLOUD_SPRITES) {
    const mat = spriteMaterials.get(sprite.id);
    if (!mat) continue;

    const localSky = sampleLocalSkyColorForCloud({
      spritePosition: sprite.position,
      fogColor,
      horizonColor,
      midColor,
      zenithColor,
      sunGlowColor,
      sunDirection,
      sunGlowStrength,
      outColor: scratchColorA
    });

    computeSpriteSpaceSunDirection(sprite.position, sunDirection, scratchVec);

    mat.uniforms.uLocalSkyColor.value.copy(localSky);
    mat.uniforms.uCloudBodyColor.value.copy(cloudBodyColor);
    mat.uniforms.uSunlitColor.value.copy(sunlitColor);
    mat.uniforms.uBellyColor.value.copy(bellyColor);
    mat.uniforms.uSunDirSprite.value.copy(scratchVec);
    mat.uniforms.uSkyBlend.value = sprite.skyBlend;
    mat.uniforms.uEdgeSoftness.value = sprite.edgeSoftness;
    mat.uniforms.uOpacity.value = clamp01(cloudOpacity * sprite.opacityScale);
    mat.uniforms.uSunShadingStrength.value = sunShadingStrength;
  }
}

export function PublicPlazaSkyClouds({
  cloudCoverPct,
  cloudsGroupRef,
  geometries,
  spriteMaterials
}: {
  cloudCoverPct: number;
  cloudsGroupRef: React.RefObject<Group | null>;
  geometries: { normal: BufferGeometry; flipped: BufferGeometry };
  spriteMaterials: Map<string, ShaderMaterial>;
}) {
  const visibleSprites = useMemo(() => {
    const threshold = Math.max(12, cloudCoverPct);
    return PLAZA_V2_CLOUD_SPRITES.filter(
      (sprite) =>
        sprite.minCloudCover <= threshold &&
        (sprite.maxCloudCover === undefined || threshold <= sprite.maxCloudCover)
    );
  }, [cloudCoverPct]);

  return (
    <group name="sky-cloud-clusters" ref={cloudsGroupRef}>
      {visibleSprites.map((sprite) => {
        const [px, py, pz] = sprite.position;
        const horizRadius = Math.hypot(px, pz) || 1;
        const yawY = Math.atan2(-px, -pz);
        const tiltX = Math.atan2(py - 4.0, horizRadius) * 0.65;
        const spriteGeo = sprite.flipX ? geometries.flipped : geometries.normal;
        const spriteMat = spriteMaterials.get(sprite.id);
        if (!spriteMat) return null;

        return (
          <group
            key={sprite.id}
            name={sprite.id}
            position={sprite.position}
            rotation={[0, yawY, 0]}
          >
            <mesh
              castShadow={false}
              geometry={spriteGeo}
              material={spriteMat}
              receiveShadow={false}
              renderOrder={sprite.renderOrder}
              rotation={[tiltX, 0, sprite.rollZ]}
              scale={sprite.scale}
            />
          </group>
        );
      })}
    </group>
  );
}
