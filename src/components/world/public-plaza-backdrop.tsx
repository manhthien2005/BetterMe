"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace
} from "three";

import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { PLAZA_HALF_EXTENTS } from "@/lib/world/plaza-nature-layout";
import { createDistantIslandGeometry, DISTANT_ISLANDS } from "./plaza-horizon";
import { PublicPlazaMountains } from "./public-plaza-mountains";

// The cloud deck stays below Thác Tầng's lowest basin, while its inner edge hugs the summit.
export const PLAZA_MIST_VALLEY_DROP = 26;

export interface BackdropPartSpec {
  geo: BufferGeometry;
  position: [number, number, number];
  scale?: [number, number, number];
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  color?: [number, number, number];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Merges static BufferGeometries (both indexed and non-indexed) into a single
 * draw call with per-part and vertical-gradient vertex colors and transformed normals.
 */
export function mergeStaticBackdropGeometries(
  parts: readonly BackdropPartSpec[],
  verticalGradient?: {
    minY: number;
    maxY: number;
    bottomRgb: [number, number, number];
    topRgb: [number, number, number];
  }
): BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const pos = parts[i].geo.getAttribute("position");
    const idx = parts[i].geo.getIndex();
    totalVerts += pos.count;
    totalIndices += idx ? idx.count : pos.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  const IndexArray = totalVerts > 65535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(totalIndices);

  let vertCursor = 0;
  let idxCursor = 0;

  for (let p = 0; p < parts.length; p += 1) {
    const {
      geo,
      position,
      scale = [1, 1, 1],
      rotationX = 0,
      rotationY = 0,
      rotationZ = 0,
      color = [1, 1, 1]
    } = parts[p];
    const [tx, ty, tz] = position;
    const [sx, sy, sz] = scale;

    const cx = Math.cos(rotationX);
    const sxRot = Math.sin(rotationX);
    const cy = Math.cos(rotationY);
    const syRot = Math.sin(rotationY);
    const cz = Math.cos(rotationZ);
    const szRot = Math.sin(rotationZ);

    const pos = geo.getAttribute("position");
    const norm = geo.getAttribute("normal");
    const srcColor = geo.getAttribute("color");
    const idx = geo.getIndex();

    for (let i = 0; i < pos.count; i += 1) {
      let x = pos.getX(i) * sx;
      let y = pos.getY(i) * sy;
      let z = pos.getZ(i) * sz;

      if (rotationZ !== 0) {
        const nx = x * cz - y * szRot;
        const ny = x * szRot + y * cz;
        x = nx;
        y = ny;
      }
      if (rotationX !== 0) {
        const ny = y * cx - z * sxRot;
        const nz = y * sxRot + z * cx;
        y = ny;
        z = nz;
      }
      if (rotationY !== 0) {
        const nx = x * cy + z * syRot;
        const nz = -x * syRot + z * cy;
        x = nx;
        z = nz;
      }

      const wx = x + tx;
      const wy = y + ty;
      const wz = z + tz;

      const out3 = (vertCursor + i) * 3;
      positions[out3] = wx;
      positions[out3 + 1] = wy;
      positions[out3 + 2] = wz;

      let wnx = 0;
      let wny = 1;
      let wnz = 0;
      if (norm) {
        let nx = norm.getX(i) / (sx || 1);
        let ny = norm.getY(i) / (sy || 1);
        let nz = norm.getZ(i) / (sz || 1);
        if (rotationZ !== 0) {
          const rnx = nx * cz - ny * szRot;
          const rny = nx * szRot + ny * cz;
          nx = rnx;
          ny = rny;
        }
        if (rotationX !== 0) {
          const rny = ny * cx - nz * sxRot;
          const rnz = ny * sxRot + nz * cx;
          ny = rny;
          nz = rnz;
        }
        if (rotationY !== 0) {
          const rnx = nx * cy + nz * syRot;
          const rnz = -nx * syRot + nz * cy;
          nx = rnx;
          nz = rnz;
        }
        const len = Math.hypot(nx, ny, nz) || 1;
        wnx = nx / len;
        wny = ny / len;
        wnz = nz / len;
      }
      normals[out3] = wnx;
      normals[out3 + 1] = wny;
      normals[out3 + 2] = wnz;

      let cr = color[0];
      let cg = color[1];
      let cb = color[2];
      if (srcColor) {
        cr *= srcColor.getX(i);
        cg *= srcColor.getY(i);
        cb *= srcColor.getZ(i);
      }

      // Strong facet contrast between sunlit top ledges (wny > 0.55) and steep vertical cliff walls
      const topShelfBoost = smoothstep(0.32, 0.82, wny);
      const sideFacet = 0.62 + 0.16 * Math.sin(wnx * 2.6 + wnz * 2.1);
      const facetShade = sideFacet * (1 - topShelfBoost) + 1.08 * topShelfBoost;
      cr *= facetShade;
      cg *= facetShade;
      cb *= facetShade;

      if (verticalGradient) {
        const t = smoothstep(verticalGradient.minY, verticalGradient.maxY, wy);
        const [br, bg, bb] = verticalGradient.bottomRgb;
        const [tr, tg, tb] = verticalGradient.topRgb;
        cr *= br + (tr - br) * t;
        cg *= bg + (tg - bg) * t;
        cb *= bb + (tb - bb) * t;
      }
      colors[out3] = clamp01(cr);
      colors[out3 + 1] = clamp01(cg);
      colors[out3 + 2] = clamp01(cb);
    }

    if (idx) {
      for (let j = 0; j < idx.count; j += 1) {
        indices[idxCursor + j] = idx.getX(j) + vertCursor;
      }
      idxCursor += idx.count;
    } else {
      for (let j = 0; j < pos.count; j += 1) {
        indices[idxCursor + j] = vertCursor + j;
      }
      idxCursor += pos.count;
    }

    vertCursor += pos.count;
  }

  const merged = new BufferGeometry();
  merged.setAttribute("position", new BufferAttribute(positions, 3));
  merged.setAttribute("normal", new BufferAttribute(normals, 3));
  merged.setAttribute("color", new BufferAttribute(colors, 3));
  if (totalIndices > 0) {
    merged.setIndex(new BufferAttribute(indices, 1));
  }
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Builds a single watertight, continuous stepped cliff escarpment around the entire
 * 32.6m x 30.6m summit terrace (`hx = 16.25m`, `hz = 15.25m`).
 *
 * - Eliminates all cracks/gaps between cliff blocks when pitching the camera down at the rim.
 * - Alternates stepped rock shelves (`Ledge 1..3`) with steep vertical cliff drops (`Riser 1..4`)
 *   down to `y = -6.4m`.
 * - Modulates radial buttress spurs (`nhô ra / thụt vào`) around the perimeter so that each
 *   protruding spur exposes a dark, camera-facing (`-X/+Z` on East, `+X/+Z` on West) vertical
 *   rock wall visible directly from the locked spawn camera.
 */
function createContinuousPerimeterCliffGeometry(): BufferGeometry {
  const segs = 128;
  // Monotonically visible stepped mountain cliff profile from rim (out = 0.22m..18.5m, y = -0.03m..-6.20m).
  // Every ring r has strictly decreasing downward sightline slope from the rim camera so no upper ring
  // ever hides the descending rock face below it: the rock remains clearly readable for a vertical
  // stretch (y = -0.03m .. -1.78m) before gradually submerging into the staggered mist layers (-1.38m .. -2.88m).
  // Each profile entry: [radialOutreachMeters, baseElevationY, isVerticalRiserBottom, buttressAmp]
  const profiles: readonly [number, number, boolean, number][] = [
    [-0.25, -0.14, false, 0.0], // 0: Tucked strictly below and inside the 16.5 x 15.5 stone curb
    [0.22, -0.03, false, 0.06], // 1: Weathered outer rim stone lip (top of Riser 1)
    [1.15, -0.56, true, 0.16], // 2: Base of Riser 1 (steep dark slate rock drop right below the curb)
    [2.25, -0.76, false, 0.28], // 3: Ledge 1 stepped rock & moss shelf (100% clear above mist)
    [3.65, -1.48, true, 0.42], // 4: Base of Riser 2 (deep chiseled cliff wall where mist wisps begin)
    [5.2, -1.78, false, 0.56], // 5: Ledge 2 outer rock spur shelf (~35% veiled in soft upper mist)
    [7.2, -2.62, true, 0.72], // 6: Base of Riser 3 (~75% veiled in middle valley mist)
    [9.4, -3.15, false, 0.86], // 7: Deep Ledge 3 rock shelf (~94% veiled, fading into the cloud sea)
    [13.2, -4.65, true, 1.0], // 8: Base of Riser 4 (>99% submerged under all three mist layers)
    [18.5, -6.2, true, 1.1] // 9: Deep chasm precipice base anchored into the valley floor
  ];

  const ringCount = profiles.length;
  const vertCount = ringCount * (segs + 1);
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const indices: number[] = [];

  const hx0 = PLAZA_HALF_EXTENTS.x + .35;
  const hz0 = PLAZA_HALF_EXTENTS.z + .35;

  for (let r = 0; r < ringCount; r += 1) {
    const [outBase, yBase, isRiserBottom, buttressAmp] = profiles[r];

    for (let s = 0; s <= segs; s += 1) {
      const u = s / segs;
      const theta = u * Math.PI * 2;
      const dirX = Math.sin(theta);
      const dirZ = -Math.cos(theta);

      // Exact rectangle perimeter so Ring 0..1 never pokes inside the 32.6 x 30.6 walkable floor
      const normMax = Math.max(Math.abs(dirX), Math.abs(dirZ), 0.0001);
      const baseX = (dirX / normMax) * hx0;
      const baseZ = (dirZ / normMax) * hz0;

      // Deterministic jagged buttress ribs (spurs protruding + recessed gorges)
      const spurWave =
        Math.sin(theta * 12 + 0.35) * 0.54 +
        Math.cos(theta * 20 - 0.75) * 0.32 +
        Math.sin(theta * 32 + 1.2) * 0.16;

      // Prominent Northeast (+X, -Z) & Northwest (-X, -Z) cliff promontories visible in spawn frustum
      const isNorthEastShoulder =
        smoothstep(0.14, 0.76, dirX) * smoothstep(0.12, 0.85, -dirZ);
      const isNorthWestShoulder =
        smoothstep(0.15, 0.72, -dirX) * smoothstep(0.12, 0.78, -dirZ);
      const shoulderOutBoost =
        r >= 2 ? (isNorthEastShoulder * 1.85 + isNorthWestShoulder * 1.35) * (r / (ringCount - 1)) : 0;

      const out = r === 0 ? outBase : Math.max(0.15, outBase + spurWave * buttressAmp + shoulderOutBoost);
      const outDirLen = Math.hypot(baseX, baseZ) || 1;
      const outNx = baseX / outDirLen;
      const outNz = baseZ / outDirLen;

      const wx = baseX + outNx * out;
      const wz = baseZ + outNz * out;

      // Subtle rock crest lift on the NE right-of-portal outcrop (x = +7.5..+12.5m, outside walkable area)
      const rightOfPortalOutcrop =
        smoothstep(0.36, 0.52, dirX) *
        (1 - smoothstep(0.68, 0.84, dirX)) *
        smoothstep(0.58, 0.88, -dirZ);
      const outcropCrestLift =
        r >= 1 && r <= 4
          ? rightOfPortalOutcrop * (0.18 - (r - 1) * 0.04) * (0.6 + 0.4 * Math.max(0, spurWave))
          : 0;

      let wy = yBase + outcropCrestLift;
      if (r >= 2 && r <= 8) {
        const gorgeMod = spurWave < 0 ? spurWave * 0.16 : spurWave * 0.08;
        wy += gorgeMod;
      }

      const idx = (r * (segs + 1) + s) * 3;
      positions[idx] = wx;
      positions[idx + 1] = wy;
      positions[idx + 2] = wz;

      // Vertex color encoding: warm sunlit stone shelves vs dark slate vertical cliff risers & mossy clefts
      let cr = 0.78;
      let cg = 0.73;
      let cb = 0.67;

      if (r <= 1) {
        // Dark weathered rim coping stone separating cream plaza floor from cliff drop
        cr = 0.58;
        cg = 0.54;
        cb = 0.5;
      } else if (isRiserBottom) {
        // Steep cliff face / chasm riser (dark slate-umber shadow)
        const deepFactor = clamp01((r - 2) / 7);
        cr = 0.37 - deepFactor * 0.04;
        cg = 0.36 - deepFactor * 0.02;
        cb = 0.41 + deepFactor * 0.07;
      } else {
        // Stepped rock shelf: sunlit stone on spurs, mossy olive-green in recessed ledges
        const mossMix = smoothstep(-0.35, 0.28, -spurWave) * (r >= 3 ? 0.48 : 0.25);
        cr = 0.86 * (1 - mossMix) + 0.43 * mossMix;
        cg = 0.8 * (1 - mossMix) + 0.65 * mossMix;
        cb = 0.72 * (1 - mossMix) + 0.46 * mossMix;
      }

      // Deep submerged rings (r >= 7) blend toward cool atmospheric chasm slate
      if (r >= 7) {
        const mistBlend = smoothstep(6.5, 9.0, r);
        cr = cr * (1 - mistBlend * 0.45) + 0.68 * (mistBlend * 0.45);
        cg = cg * (1 - mistBlend * 0.45) + 0.75 * (mistBlend * 0.45);
        cb = cb * (1 - mistBlend * 0.45) + 0.86 * (mistBlend * 0.45);
      }

      colors[idx] = cr;
      colors[idx + 1] = cg;
      colors[idx + 2] = cb;
    }
  }

  for (let r = 0; r < ringCount - 1; r += 1) {
    for (let s = 0; s < segs; s += 1) {
      const a = r * (segs + 1) + s;
      const b = a + 1;
      const c = (r + 1) * (segs + 1) + s;
      const d = c + 1;
      // Right-handed outward/upward winding: (b - a) is +tangent, (c - a) is +radial outward
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a flared, stepped crag rock frustum (`r_top = 0.58 -> r_bottom = 1.38`) with
 * 4 chiseled strata steps so both its camera-facing side wall (from spawn) and its
 * descending outer slope (when pitching down at the rim) remain clearly readable.
 */
function createCliffSpurBlockGeometry(seed = 1.7): BufferGeometry {
  const geo = new CylinderGeometry(0.58, 1.38, 1.0, 9, 4, false);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const hNorm = clamp01(y + 0.5);
    const r = Math.hypot(x, z);
    const angle = Math.atan2(z, x);

    if (r > 0.05) {
      const strataStep = 1 + 0.06 * Math.sin(hNorm * Math.PI * 6);
      const facetNoise =
        1 +
        Math.sin(angle * 3 + seed) * 0.14 +
        Math.cos(angle * 5 - seed * 1.8) * 0.09 +
        Math.sin(hNorm * Math.PI * 3 + seed) * 0.05;
      const bevel = hNorm > 0.92 ? 0.9 : 1.0;
      pos.setX(i, x * facetNoise * strataStep * bevel);
      pos.setZ(i, z * facetNoise * strataStep * bevel);
    }

    // Dark chasm rock at bottom (0.44) -> mid slate cliff face (0.68) -> warm stone ledge top (1.02)
    const shade = 0.44 + smoothstep(0.0, 0.92, hNorm) * 0.58;
    colors[i * 3] = shade * 1.01;
    colors[i * 3 + 1] = shade * 0.98;
    colors[i * 3 + 2] = shade * 0.95;
  }

  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a radial-fading procedural sea-of-clouds mist texture (`512x512`) where:
 * - `u = x / 512` wraps seamlessly around the 360° perimeter (`RepeatWrapping`),
 * - `t = y / 511` maps radially from the cliff wall (`t = 0`, `alpha === 0`) out to the
 *   horizon rim (`t = 1`, `alpha === 0`) with `ClampToEdgeWrapping`.
 *
 * This guarantees zero hard white edge near the cliff face (`mật độ giảm dần gần mặt vách`)
 * and zero hard cutoff at the outer rim (`mật độ giảm dần ở rìa`), while creating soft
 * billowing cloud banks across the low valley (`t = 0.28..0.74`).
 */
function createValleyMistCanvasTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const width = 512;
  const height = 512;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof ctx.createImageData !== "function") return null;

  const img = ctx.createImageData(width, height);
  const data = img.data;
  const tau = Math.PI * 2;

  for (let iy = 0; iy < height; iy += 1) {
    const t = iy / (height - 1); // 0 = near cliff wall, 1 = outer horizon rim

    for (let ix = 0; ix < width; ix += 1) {
      const u = ix / width; // 0..1 periodic around perimeter

      // Organic cloud-tendril undulation along the cliff-side fade-in boundary
      const innerWave =
        0.032 * Math.sin(tau * 6 * u + 0.45) +
        0.022 * Math.cos(tau * 11 * u - 0.85) +
        0.014 * Math.sin(tau * 17 * u + 1.35);
      const innerStart = 0.014 + Math.max(0, innerWave);
      const innerEnd = 0.34 + innerWave * 1.15;
      const innerFade = smoothstep(innerStart, innerEnd, t);

      // Smooth density falloff toward the outer rim (t -> 1)
      const outerWave =
        0.028 * Math.sin(tau * 5 * u - 0.5) +
        0.02 * Math.cos(tau * 9 * u + 1.15);
      const outerFade = 1 - smoothstep(0.72 + outerWave, 0.98 + Math.min(0, outerWave), t);

      // Multi-scale sea-of-clouds billows inside the valley mist blanket
      const b1 =
        Math.sin(tau * 4 * u + t * 9.5 + 0.3) *
        Math.cos(tau * 3 * u - t * 7.2 + 0.8);
      const b2 =
        Math.sin(tau * 9 * u - t * 14.0 + 1.7) * 0.52 +
        Math.cos(tau * 13 * u + t * 11.0 - 0.6) * 0.48;
      const b3 =
        Math.sin(tau * 19 * u + t * 21.0 + 2.4) * 0.34 +
        Math.cos(tau * 7 * u + t * 16.5 - 1.9) * 0.66;

      const billowDensity = clamp01(0.88 + 0.12 * b1 + 0.08 * b2 + 0.04 * b3);
      const alpha = clamp01(innerFade * outerFade * billowDensity);

      // Subtle cloud-top highlight vs soft atmospheric trough tint
      const highlight = clamp01(0.5 + 0.32 * b1 + 0.22 * b2);
      const r = Math.round(234 + highlight * 21);
      const g = Math.round(242 + highlight * 13);
      const b = Math.round(251 + highlight * 4);

      const idx = (iy * width + ix) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(img, 0, 0);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export interface SoftAnnularMistSheetOptions {
  /** Radial outreach (meters outside the 32.6 x 30.6 terrace rim) where t = 0 (alpha = 0) starts */
  innerOut: number;
  /** Radial outreach (meters outside the terrace rim) where t = 1 (alpha = 0) ends */
  outerOut: number;
  /** Radial distance in meters over which mist fades from 0% to 100% over the descending cliff */
  fadeInMeters?: number;
  /** Base world Y elevation of the mist layer */
  baseY: number;
  /** Gentle drop from the cliff-side mist to the open valley. */
  valleyDrop?: number;
  /** Vertical 3D cloud-billow wave amplitude in the valley body */
  waveAmp: number;
  /** Phase offset (radians) so stacked mist sheets undulate independently */
  phase: number;
  segs?: number;
  radialRings?: number;
}

/**
 * Builds a continuous, rounded-perimeter annular mist ribbon around the summit cliff
 * with radial UV `v in [0, 1]` (`uv.y = v`) and perimeter UV `u in [0, 1]` (`uv.x = u`).
 *
 * Because `v = 0` starts right at the cliff wall (`innerOut`) where `createValleyMistCanvasTexture`
 * has `alpha = 0`, and `v` reaches `0.38` within `fadeInMeters` (`~5.5m`), the mist never clips
 * with a hard white seam against the rock face: instead, as the stepped cliff descends across
 * `out = 2.5m .. 10.5m`, the mist density smoothly increases above the deeper rock shelves until
 * the lower cliff (`out = 10.5m .. 18.5m`) is 100% submerged under the sea of clouds.
 */
export function createSoftAnnularMistSheetGeometry(
  options: SoftAnnularMistSheetOptions
): BufferGeometry {
  const {
    innerOut,
    outerOut,
    fadeInMeters = 5.6,
    baseY,
    valleyDrop = 0,
    waveAmp,
    phase,
    segs = 112,
    radialRings = 32
  } = options;

  const vertCount = (radialRings + 1) * (segs + 1);
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices: number[] = [];

  const hx0 = 16.35;
  const hz0 = 15.35;
  const totalSpan = Math.max(1, outerOut - innerOut);

  for (let r = 0; r <= radialRings; r += 1) {
    const rNorm = r / radialRings;
    // Concentrate radial rings near the cliff transition zone (dist = 0..10m)
    const t = Math.pow(rNorm, 1.55);
    const dist = totalSpan * t;
    const out = innerOut + dist;

    // Map dist in [0, fadeInMeters] to uvV in [0, 0.38] so mist reaches full cloud-sea density
    // right over the descending cliff before the cliff geometry terminates at out = 18.5m
    const uvV =
      dist <= fadeInMeters
        ? (dist / Math.max(0.5, fadeInMeters)) * 0.38
        : 0.38 + ((dist - fadeInMeters) / Math.max(1, totalSpan - fadeInMeters)) * 0.62;

    const waveEnvelope = smoothstep(0.06, 0.36, uvV) * (1 - smoothstep(0.74, 0.98, uvV));

    for (let s = 0; s <= segs; s += 1) {
      const u = s / segs;
      const theta = u * Math.PI * 2;
      const dirX = Math.sin(theta);
      const dirZ = -Math.cos(theta);

      // Smooth p-norm rectangle near the cliff (t = 0) blending to circular horizon at t = 1
      const pNorm = Math.pow(
        Math.pow(Math.abs(dirX), 8) + Math.pow(Math.abs(dirZ), 8),
        0.125
      );
      const rectX = (dirX / Math.max(pNorm, 0.0001)) * hx0;
      const rectZ = (dirZ / Math.max(pNorm, 0.0001)) * hz0;
      const rectLen = Math.hypot(rectX, rectZ) || 1;
      const outNx = rectX / rectLen;
      const outNz = rectZ / rectLen;

      // Blend outward normal from cliff-aligned normal (t = 0) to radial direction (t = 1)
      const dirBlend = smoothstep(0.0, 0.75, t);
      const nx = outNx * (1 - dirBlend) + dirX * dirBlend;
      const nz = outNz * (1 - dirBlend) + dirZ * dirBlend;
      const nLen = Math.hypot(nx, nz) || 1;

      const wx = rectX + (nx / nLen) * out;
      const wz = rectZ + (nz / nLen) * out;

      const billowWave =
        Math.sin(theta * 5 + uvV * 5.2 + phase) * 0.52 +
        Math.cos(theta * 9 - uvV * 7.4 - phase * 0.7) * 0.32 +
        Math.sin(theta * 14 + uvV * 9.8 + phase * 1.3) * 0.16;
      const wy = baseY - valleyDrop * smoothstep(6, 64, dist) + billowWave * waveAmp * waveEnvelope;

      const vIdx = r * (segs + 1) + s;
      const p3 = vIdx * 3;
      positions[p3] = wx;
      positions[p3 + 1] = wy;
      positions[p3 + 2] = wz;

      normals[p3] = 0;
      normals[p3 + 1] = 1;
      normals[p3 + 2] = 0;

      // Soft atmospheric blue-shadow near the cliff wall & troughs -> bright cloud crest in valley body
      const crestMix = smoothstep(-0.6, 0.65, billowWave) * waveEnvelope;
      const cliffShadowMix = smoothstep(0.0, 0.32, uvV);
      colors[p3] = (0.86 + 0.08 * cliffShadowMix) + 0.06 * crestMix;
      colors[p3 + 1] = (0.91 + 0.05 * cliffShadowMix) + 0.04 * crestMix;
      colors[p3 + 2] = 0.98 + 0.02 * crestMix;

      const u2 = vIdx * 2;
      uvs[u2] = u;
      uvs[u2 + 1] = clamp01(uvV);
    }
  }

  for (let r = 0; r < radialRings; r += 1) {
    for (let s = 0; s < segs; s += 1) {
      const a = r * (segs + 1) + s;
      const b = a + 1;
      const c = (r + 1) * (segs + 1) + s;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("normal", new BufferAttribute(normals, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.setAttribute("uv", new BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Public Plaza Summit Backdrop (`public_plaza` only).
 */
export function PublicPlazaSummitBackdrop({
  environment,
  plazaStudy = false
}: {
  environment: EffectiveEnvironmentSnapshot;
  plazaStudy?: boolean;
}) {
  const { lighting } = environment;

  const geometries = useMemo(() => {
    const continuousCliffWall = createContinuousPerimeterCliffGeometry();
    const unitCliffSpur = createCliffSpurBlockGeometry(1.7);
    const unitBox = new BoxGeometry(1, 1, 1);
    const unitCyl = new CylinderGeometry(0.24, 0.36, 1.8, 7);
    const unitCanopy = new SphereGeometry(1, 9, 7);

    // ─── 1. CONTINUOUS STEPPED CLIFF ESCARPMENT & CAMERA-FACING PROMONTORIES ───
    const cliffRockParts: BackdropPartSpec[] = [
      // Core summit foundation pedestal inside the 32.6 x 30.6 terrace
      { geo: unitBox, position: [0, -5.2, 0], scale: [56.2, 9.6, 48.2], color: [0.52, 0.49, 0.47] },
      // Watertight continuous stepped cliff perimeter (zero gaps at the rim)
      { geo: continuousCliffWall, position: [0, 0, 0], scale: [1, 1, 1], color: [1, 1, 1] }
    ];

    // Helper to add sculpted rocky buttresses with dark vertical side walls facing the spawn camera
    const addCameraFacingButtress = (
      x: number,
      z: number,
      topY: number,
      bottomY: number,
      sx: number,
      sz: number,
      rotY: number,
      rgb: [number, number, number]
    ) => {
      const h = Math.max(0.35, topY - bottomY);
      const centerY = (topY + bottomY) * 0.5;
      cliffRockParts.push({
        geo: unitCliffSpur,
        position: [x + Math.sign(x) * 15, centerY, z - 10],
        scale: [sx, h, sz],
        rotationY: rotY,
        color: rgb
      });
    };

    // Right / Northeast descending cliff promontory (x = +11.8..+20.5m, z = -7.5..-22.5m)
    // Directly inside the right third of the locked spawn camera frustum, matching plaza-dawn-approved.png!
    addCameraFacingButtress(14.6, -8.8, 0.24, -2.6, 1.35, 1.65, -0.28, [0.76, 0.71, 0.65]);
    addCameraFacingButtress(15.2, -11.4, 0.38, -3.2, 1.6, 1.9, -0.34, [0.74, 0.69, 0.63]);
    addCameraFacingButtress(15.6, -13.6, 0.46, -3.6, 1.8, 2.1, -0.38, [0.72, 0.67, 0.61]);
    addCameraFacingButtress(16.6, -15.4, 0.16, -4.2, 2.0, 2.2, -0.46, [0.64, 0.6, 0.56]);
    addCameraFacingButtress(17.8, -17.4, -0.28, -5.0, 2.3, 2.5, -0.54, [0.56, 0.53, 0.52]);
    addCameraFacingButtress(19.2, -19.8, -0.82, -5.6, 2.6, 2.8, -0.6, [0.49, 0.48, 0.5]);
    addCameraFacingButtress(13.2, -15.4, 0.22, -3.5, 1.65, 1.65, -0.28, [0.7, 0.65, 0.59]);
    addCameraFacingButtress(14.4, -17.4, -0.24, -4.4, 1.95, 1.95, -0.36, [0.58, 0.55, 0.53]);
    addCameraFacingButtress(15.8, -19.8, -0.86, -5.3, 2.25, 2.2, -0.44, [0.5, 0.49, 0.5]);
    addCameraFacingButtress(17.2, -22.4, -1.65, -5.8, 2.5, 2.5, -0.5, [0.46, 0.46, 0.49]);

    // Local stepped rock outcrop to the right of the portal (x = +7.8..+11.8m, z = -15.65..-21.5m),
    // strictly outside the walkable floor (z >= -15.0m) and keeping the x = 0..7m rim open.
    const rightOfPortalOutcropSpurs: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      [number, number, number]
    ][] = [
        [8.2, -15.65, 0.16, -2.2, 1.5, 1.3, -0.32, [0.7, 0.65, 0.59]],
        [10.4, -15.75, 0.22, -2.4, 1.6, 1.4, -0.36, [0.72, 0.67, 0.61]],
        [8.9, -17.4, -0.32, -3.2, 1.8, 1.65, -0.38, [0.6, 0.56, 0.53]],
        [11.2, -17.6, -0.26, -3.4, 1.9, 1.75, -0.42, [0.62, 0.58, 0.55]],
        [9.6, -19.5, -0.95, -4.2, 2.1, 1.95, -0.42, [0.52, 0.5, 0.5]],
        [11.8, -19.8, -0.88, -4.4, 2.2, 2.05, -0.46, [0.53, 0.51, 0.51]]
      ];
    for (const [x, z, topY, bottomY, sx, sz, rotY, rgb] of rightOfPortalOutcropSpurs) {
      addCameraFacingButtress(x, z, topY, bottomY, sx, sz, rotY, rgb);
    }

    // Left / Northwest descending cliff promontory (x = -11.5..-20.5m, z = -11.5..-22.0m)
    addCameraFacingButtress(-15.4, -13.8, 0.36, -3.4, 1.7, 1.95, 0.35, [0.74, 0.69, 0.63]);
    addCameraFacingButtress(-16.6, -15.6, 0.08, -4.2, 2.0, 2.2, 0.46, [0.62, 0.58, 0.55]);
    addCameraFacingButtress(-17.9, -17.8, -0.38, -5.0, 2.3, 2.4, 0.54, [0.54, 0.52, 0.52]);
    addCameraFacingButtress(-13.8, -15.8, 0.04, -3.8, 1.75, 1.65, 0.26, [0.66, 0.61, 0.56]);
    addCameraFacingButtress(-14.8, -18.2, -0.58, -4.6, 2.05, 1.95, 0.34, [0.55, 0.52, 0.51]);
    addCameraFacingButtress(-16.0, -20.8, -1.35, -5.4, 2.35, 2.25, 0.42, [0.48, 0.48, 0.5]);

    const nearCliffRockGeo = mergeStaticBackdropGeometries(cliffRockParts, {
      minY: -5.8,
      maxY: 0.45,
      bottomRgb: [0.58, 0.64, 0.76],
      topRgb: [1.0, 0.97, 0.92]
    });

    const islandParts: BackdropPartSpec[] = [];
    for (const [i, island] of DISTANT_ISLANDS.entries()) {
      const [x, y, z] = island.position;
      islandParts.push({
        geo: createDistantIslandGeometry(island.seed), position: island.position,
        scale: [island.width, island.height, island.depth], rotationY: island.yaw
      });
      for (let chip = 0; chip < 2; chip++) {
        islandParts.push({
          geo: createDistantIslandGeometry(island.seed + chip + 4),
          position: [x + (chip ? 1 : -1) * island.width * 0.88, y - island.height * (0.4 + chip * 0.3), z + island.depth * 0.3],
          scale: [island.width * 0.14, island.height * 0.2, island.depth * 0.18], rotationY: island.yaw + chip
        });
      }
      // A few crowns break the turf silhouette; no distant water or shadow passes.
      for (let tree = 0; tree < 3 + i % 3; tree++) {
        const offset = (tree - (2 + i % 3) / 2) * island.width * 0.28;
        const tx = x + Math.cos(island.yaw) * offset;
        const tz = z - Math.sin(island.yaw) * offset;
        const height = island.width * (0.23 + ((tree * 3 + i) % 5) * 0.035);
        const ground = y + island.height * .065;
        islandParts.push({geo: unitCyl, position: [tx, ground + height * 0.4, tz], scale: [height * 0.12, height * 0.5, height * 0.12], color: [0.22, 0.19, 0.16]});
        for (let crown = 0; crown < 3; crown++) {
          const angle = crown * 2.4 + tree;
          islandParts.push({geo: unitCanopy,
            position: [tx + Math.cos(angle) * height * .24, ground + height * (.84 + crown * .07), tz + Math.sin(angle) * height * .2],
            scale: [height * .45, height * (.32 + crown * .04), height * .36], color: [.1 + crown * .018, .26 + crown * .025, .12 + crown * .012]});
        }
      }
    }
    const distantIslandsGeo = mergeStaticBackdropGeometries(islandParts);
    islandParts.filter(part => part.geo !== unitCyl && part.geo !== unitCanopy).forEach(part => part.geo.dispose());

    // ─── 6. LOW VALLEY SEA OF CLOUDS & DISTANT MOUNTAIN MIST VEIL ───
    // All valley mist layers use soft annular ribbons with radial UV v in [0, 1] (`alpha === 0` at
    // both the cliff-side innerOut and horizon-side outerOut) and staggered elevations (-1.38m, -2.08m, -2.88m)
    // with fast 5.5m..6.2m cliff-proximity fade-ins so the descending rock face remains readable for
    // a vertical stretch before completely submerging into the sea of clouds well before Ring 9.
    const chasmFloorGeo = createSoftAnnularMistSheetGeometry({
      innerOut: 6.5,
      outerOut: 84.0,
      fadeInMeters: 6.0,
      baseY: -6.2,
      waveAmp: 0.0,
      phase: 0.0,
      segs: 72,
      radialRings: 6
    });
    const valleyMistSheetLowGeo = createSoftAnnularMistSheetGeometry({
      innerOut: 6.2,
      outerOut: 260,
      fadeInMeters: 5.2,
      baseY: -2.88,
      valleyDrop: PLAZA_MIST_VALLEY_DROP,
      waveAmp: 0.14,
      phase: 2.5
    });
    const valleyMistSheetUpperGeo = createSoftAnnularMistSheetGeometry({
      innerOut: 4.4,
      outerOut: 245,
      fadeInMeters: 5.6,
      baseY: -2.08,
      valleyDrop: PLAZA_MIST_VALLEY_DROP,
      waveAmp: 0.2,
      phase: 1.35
    });
    const seaOfCloudsBillowsGeo = createSoftAnnularMistSheetGeometry({
      innerOut: 2.5,
      outerOut: 230,
      fadeInMeters: 6.0,
      baseY: -1.38,
      valleyDrop: PLAZA_MIST_VALLEY_DROP,
      waveAmp: 0.24,
      phase: 0.35
    });
    const distantMistVeilGeo = createSoftAnnularMistSheetGeometry({
      innerOut: 75,
      outerOut: 980,
      fadeInMeters: 48,
      baseY: -26.5,
      waveAmp: 0.22,
      phase: 0.9,
      segs: 84,
      radialRings: 40
    });

    continuousCliffWall.dispose();
    unitCliffSpur.dispose();
    unitBox.dispose();
    unitCyl.dispose();
    unitCanopy.dispose();

    return {
      nearCliffRockGeo,
      distantIslandsGeo,
      chasmFloorGeo,
      valleyMistSheetLowGeo,
      valleyMistSheetUpperGeo,
      seaOfCloudsBillowsGeo,
      distantMistVeilGeo
    };
  }, []);

  const mistTexture = useMemo(() => createValleyMistCanvasTexture(), []);

  const materials = useMemo(() => {
    const cliffRockMat = new MeshStandardMaterial({
      color: new Color("#8A7D70"),
      emissive: new Color("#26252B"),
      emissiveIntensity: 0.14,
      roughness: 0.88,
      metalness: 0.04,
      vertexColors: true
    });
    // Atmospheric color is per depth band; the local 92m scene fog would erase them.
    const distantIslandsMat = new MeshStandardMaterial({ vertexColors: true, fog: false, roughness: 1 });
    const islandHaze = { value: new Color() };
    distantIslandsMat.userData.haze = islandHaze;
    distantIslandsMat.onBeforeCompile = shader => {
      shader.uniforms.islandHaze = islandHaze;
      shader.fragmentShader = `uniform vec3 islandHaze;\n` + shader.fragmentShader
        .replace("#include <colorspace_fragment>", `float distanceHaze = .12 + smoothstep(280.0, 800.0, length(vViewPosition)) * .4;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, islandHaze, distanceHaze);
          #include <colorspace_fragment>`);
    };
    distantIslandsMat.customProgramCacheKey = () => "plaza-distant-island-haze-v1";
    const chasmFloorMat = new MeshBasicMaterial({
      color: new Color("#B8CCE4"),
      fog: false
    });
    const valleyMistLowMat = new MeshBasicMaterial({
      color: new Color("#D4E3F5"),
      map: mistTexture ?? null,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      vertexColors: true,
      fog: false
    });
    const valleyMistUpperMat = new MeshBasicMaterial({
      color: new Color("#EBF3FC"),
      map: mistTexture ?? null,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      vertexColors: true,
      fog: false
    });
    const seaOfCloudsBillowsMat = new MeshBasicMaterial({
      color: new Color("#F2F7FE"),
      map: mistTexture ?? null,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      vertexColors: true,
      fog: false
    });
    const distantMistVeilMat = new MeshBasicMaterial({
      color: new Color("#E6EEF9"),
      map: mistTexture ?? null,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      vertexColors: true,
      fog: false
    });

    return {
      cliffRockMat,
      distantIslandsMat,
      chasmFloorMat,
      valleyMistLowMat,
      valleyMistUpperMat,
      seaOfCloudsBillowsMat,
      distantMistVeilMat
    };
  }, [mistTexture]);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo) => geo.dispose());
      Object.values(materials).forEach((mat) => mat.dispose());
      mistTexture?.dispose();
    };
  }, [geometries, materials, mistTexture]);

  const targetPalette = useMemo(() => {
    const fogCol = new Color(lighting.fogColorHex);
    const horizonCol = new Color(lighting.skyHorizonHex);
    const zenithCol = new Color(lighting.skyZenithHex);
    const cloudCol = new Color(lighting.cloudColorHex);

    const valleyMistUpper = cloudCol.clone().lerp(horizonCol, 0.34);
    const valleyMistLow = fogCol.clone().lerp(zenithCol, 0.26);
    const chasmBase = fogCol.clone().lerp(zenithCol, 0.38);

    const distantIslands = horizonCol.clone().lerp(new Color(lighting.skyMidHex), .7);
    const distantVeil = horizonCol.clone().lerp(cloudCol, 0.52);

    const atmosphericBounce = fogCol.clone().lerp(horizonCol, 0.45);
    const bounceIntensity = environment.isNight ? 0.14 : 0.18;

    const rainBoost = environment.isRaining ? 0.08 : 0;
    return {
      valleyMistUpper,
      valleyMistLow,
      chasmBase,
      distantIslands,
      distantVeil,
      atmosphericBounce,
      bounceIntensity,
      lowOpacity: (environment.isNight ? 0.44 : 0.52) + rainBoost,
      upperOpacity: (environment.isNight ? 0.24 : 0.28) + rainBoost,
      billowsOpacity: (environment.isNight ? 0.18 : 0.22) + rainBoost,
      veilOpacity: (environment.isNight ? 0.14 : 0.2) + rainBoost
    };
  }, [
    environment.isNight,
    environment.isRaining,
    lighting.cloudColorHex,
    lighting.fogColorHex,
    lighting.skyHorizonHex,
    lighting.skyMidHex,
    lighting.skyZenithHex
  ]);

  const materialsRef = useRef(materials);

  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  useEffect(() => {
    const mats = materialsRef.current;
    mats.chasmFloorMat.color.copy(targetPalette.chasmBase);
    mats.valleyMistLowMat.color.copy(targetPalette.valleyMistLow);
    mats.valleyMistLowMat.opacity = targetPalette.lowOpacity;
    mats.valleyMistUpperMat.color.copy(targetPalette.valleyMistUpper);
    mats.valleyMistUpperMat.opacity = targetPalette.upperOpacity;
    mats.seaOfCloudsBillowsMat.color.copy(targetPalette.valleyMistUpper);
    mats.seaOfCloudsBillowsMat.opacity = targetPalette.billowsOpacity;
    mats.distantIslandsMat.userData.haze.value.copy(targetPalette.distantIslands);
    mats.distantMistVeilMat.color.copy(targetPalette.distantVeil);
    mats.distantMistVeilMat.opacity = targetPalette.veilOpacity;
    mats.cliffRockMat.emissive.copy(targetPalette.atmosphericBounce);
    mats.cliffRockMat.emissiveIntensity = targetPalette.bounceIntensity * 0.65;
  }, [targetPalette]);

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const alpha = 1 - Math.exp(-4.5 * dt);
    const mats = materialsRef.current;
    mats.chasmFloorMat.color.lerp(targetPalette.chasmBase, alpha);
    mats.valleyMistLowMat.color.lerp(targetPalette.valleyMistLow, alpha);
    mats.valleyMistUpperMat.color.lerp(targetPalette.valleyMistUpper, alpha);
    mats.seaOfCloudsBillowsMat.color.lerp(targetPalette.valleyMistUpper, alpha);
    mats.distantIslandsMat.userData.haze.value.lerp(targetPalette.distantIslands, alpha);
    mats.distantMistVeilMat.color.lerp(targetPalette.distantVeil, alpha);
    mats.cliffRockMat.emissive.lerp(targetPalette.atmosphericBounce, alpha);
  });

  return (
    <group name="public-plaza-perimeter-backdrop">
      {/* 1. Deep chasm floor sealing the valley below the cliff bases */}
      <mesh
        geometry={geometries.chasmFloorGeo}
        material={materials.chasmFloorMat}
        name="plaza-valley-chasm-floor"
        position={[0, -76, 0]}
      />

      {/* 2. Continuous stepped summit cliff escarpment & camera-facing rocky promontories */}
      <mesh
        castShadow={false}
        geometry={geometries.nearCliffRockGeo}
        material={materials.cliffRockMat}
        name="plaza-summit-cliff-walls"
        visible={!plazaStudy}
        position={plazaStudy ? [0, 0, 16] : [0, 0, 0]}
        scale={plazaStudy ? [40 / 28, 1.7, 40 / 24] : [1, 1, 1]}
        receiveShadow
      />

      <PublicPlazaMountains environment={environment} />
      <mesh geometry={geometries.distantIslandsGeo} material={materials.distantIslandsMat}
        name="plaza-horizon-islands" userData={{ count: DISTANT_ISLANDS.length }} />

      {/* Mist hugs the cliff before descending below the low island terraces. */}
      <group name="plaza-valley-mist">
        {/* 11. Lower cloud blanket */}
        <mesh
          geometry={geometries.valleyMistSheetLowGeo}
          material={materials.valleyMistLowMat}
          name="plaza-valley-mist-low"
          renderOrder={1}
        />

        {/* 12. Middle cloud blanket */}
        <mesh
          geometry={geometries.valleyMistSheetUpperGeo}
          material={materials.valleyMistUpperMat}
          name="plaza-valley-mist-upper"
          renderOrder={2}
        />

        {/* 13. Upper billowing cloud veil */}
        <mesh
          geometry={geometries.seaOfCloudsBillowsGeo}
          material={materials.seaOfCloudsBillowsMat}
          name="plaza-valley-cloud-sea-billows"
          renderOrder={2}
        />

        {/* 14. Distant Mountain Mist Veil between mid & far mountain layers */}
        <mesh
          geometry={geometries.distantMistVeilGeo}
          material={materials.distantMistVeilMat}
          name="plaza-distant-mountain-mist-veil"
          renderOrder={3}
        />
      </group>
    </group>
  );
}
