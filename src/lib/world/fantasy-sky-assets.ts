export type FantasyCloudKind = "hero-cumulus" | "layered-bank" | "fine-wisp";

/** Sprite-local coordinates in [-1, 1], with +Y toward the cloud crown. */
export interface FantasyCloudLobe {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly weight: number;
}

export interface FantasyCloudShape {
  readonly id: string;
  readonly kind: FantasyCloudKind;
  readonly lobes: readonly FantasyCloudLobe[];
}

/** Soft density masses, not circles to draw as individual visible puffs. */
export const FANTASY_CLOUD_SHAPES = {
  "cumulus-tower": {
    id: "cumulus-tower", kind: "hero-cumulus", lobes: [
      { cx: -0.05, cy: -0.2, rx: 0.65, ry: 0.26, weight: 0.9 },
      { cx: -0.3, cy: 0.01, rx: 0.37, ry: 0.33, weight: 0.96 },
      { cx: -0.12, cy: 0.34, rx: 0.31, ry: 0.39, weight: 1 },
      { cx: -0.01, cy: 0.6, rx: 0.21, ry: 0.22, weight: 0.92 },
      { cx: 0.3, cy: 0.06, rx: 0.3, ry: 0.29, weight: 0.82 },
      { cx: 0.58, cy: -0.15, rx: 0.24, ry: 0.13, weight: 0.58 }
    ]
  },
  "cumulus-sail": {
    id: "cumulus-sail", kind: "hero-cumulus", lobes: [
      { cx: -0.04, cy: -0.16, rx: 0.76, ry: 0.21, weight: 0.92 },
      { cx: -0.45, cy: 0.02, rx: 0.3, ry: 0.27, weight: 0.94 },
      { cx: -0.16, cy: 0.21, rx: 0.35, ry: 0.4, weight: 1 },
      { cx: 0.14, cy: 0.39, rx: 0.25, ry: 0.28, weight: 0.98 },
      { cx: 0.35, cy: 0.13, rx: 0.24, ry: 0.28, weight: 0.82 },
      { cx: 0.66, cy: -0.12, rx: 0.2, ry: 0.1, weight: 0.48 }
    ]
  },
  "cumulus-islands": {
    id: "cumulus-islands", kind: "hero-cumulus", lobes: [
      { cx: -0.51, cy: -0.07, rx: 0.31, ry: 0.19, weight: 0.94 },
      { cx: -0.47, cy: 0.12, rx: 0.22, ry: 0.28, weight: 1 },
      { cx: -0.27, cy: 0.02, rx: 0.19, ry: 0.21, weight: 0.78 },
      { cx: 0.37, cy: -0.12, rx: 0.44, ry: 0.18, weight: 0.88 },
      { cx: 0.47, cy: 0.1, rx: 0.25, ry: 0.29, weight: 0.96 },
      { cx: 0.16, cy: -0.03, rx: 0.17, ry: 0.17, weight: 0.56 }
    ]
  },
  "bank-shelf": {
    id: "bank-shelf", kind: "layered-bank", lobes: [
      { cx: -0.12, cy: -0.11, rx: 0.77, ry: 0.17, weight: 0.84 },
      { cx: -0.49, cy: 0.04, rx: 0.25, ry: 0.22, weight: 0.8 },
      { cx: -0.08, cy: 0.09, rx: 0.39, ry: 0.19, weight: 0.92 },
      { cx: 0.31, cy: 0.14, rx: 0.27, ry: 0.2, weight: 0.83 },
      { cx: 0.64, cy: -0.04, rx: 0.22, ry: 0.12, weight: 0.58 }
    ]
  },
  "bank-taper": {
    id: "bank-taper", kind: "layered-bank", lobes: [
      { cx: -0.43, cy: -0.03, rx: 0.34, ry: 0.24, weight: 0.94 },
      { cx: -0.38, cy: 0.18, rx: 0.26, ry: 0.28, weight: 0.88 },
      { cx: -0.04, cy: -0.06, rx: 0.39, ry: 0.17, weight: 0.76 },
      { cx: 0.29, cy: -0.12, rx: 0.35, ry: 0.12, weight: 0.57 },
      { cx: 0.65, cy: -0.2, rx: 0.24, ry: 0.07, weight: 0.34 }
    ]
  },
  "bank-wave": {
    id: "bank-wave", kind: "layered-bank", lobes: [
      { cx: -0.56, cy: -0.13, rx: 0.29, ry: 0.13, weight: 0.7 },
      { cx: -0.26, cy: 0, rx: 0.32, ry: 0.22, weight: 0.88 },
      { cx: 0.04, cy: 0.16, rx: 0.26, ry: 0.26, weight: 0.98 },
      { cx: 0.33, cy: 0.02, rx: 0.29, ry: 0.17, weight: 0.76 },
      { cx: 0.64, cy: 0.15, rx: 0.23, ry: 0.09, weight: 0.48 }
    ]
  },
  "wisp-feather": {
    id: "wisp-feather", kind: "fine-wisp", lobes: [
      { cx: -0.5, cy: -0.21, rx: 0.34, ry: 0.12, weight: 0.46 },
      { cx: -0.2, cy: -0.08, rx: 0.38, ry: 0.14, weight: 0.59 },
      { cx: 0.12, cy: 0.09, rx: 0.35, ry: 0.13, weight: 0.53 },
      { cx: 0.41, cy: 0.24, rx: 0.29, ry: 0.08, weight: 0.36 },
      { cx: 0.66, cy: 0.35, rx: 0.22, ry: 0.05, weight: 0.22 },
      { cx: 0.11, cy: 0.34, rx: 0.28, ry: 0.06, weight: 0.24 }
    ]
  },
  "wisp-crosswind": {
    id: "wisp-crosswind", kind: "fine-wisp", lobes: [
      { cx: -0.55, cy: 0.15, rx: 0.3, ry: 0.07, weight: 0.3 },
      { cx: -0.24, cy: 0.08, rx: 0.39, ry: 0.1, weight: 0.49 },
      { cx: 0.15, cy: -0.04, rx: 0.4, ry: 0.11, weight: 0.54 },
      { cx: 0.58, cy: -0.17, rx: 0.3, ry: 0.06, weight: 0.28 },
      { cx: 0.13, cy: 0.27, rx: 0.44, ry: 0.06, weight: 0.25 }
    ]
  }
} as const satisfies Readonly<Record<string, FantasyCloudShape>>;

export type FantasyCloudShapeId = keyof typeof FANTASY_CLOUD_SHAPES;

const CLOUD_FALLBACK_TEXTURE_IDS = {
  "cumulus-tower": "cumulus-0",
  "cumulus-sail": "cumulus-3",
  "cumulus-islands": "cumulus-2",
  "bank-shelf": "layered-0",
  "bank-taper": "layered-3",
  "bank-wave": "layered-2",
  "wisp-feather": "distant-0",
  "wisp-crosswind": "distant-2"
} as const;

/** Smooth bounded union; alpha is zero outside every lobe and at sprite borders. */
export function sampleFantasyCloudDensity(shape: FantasyCloudShape, x: number, y: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
  let uncovered = 1;
  for (const { cx, cy, rx, ry, weight } of shape.lobes) {
    const radius = Math.hypot((x - cx) / rx, (y - cy) / ry);
    const t = Math.max(0, Math.min(1, (1 - radius) / 0.7));
    uncovered *= 1 - weight * t * t * (3 - 2 * t);
  }
  return 1 - uncovered;
}

export interface FantasyCloudPlacement {
  readonly id: string;
  readonly shapeId: FantasyCloudShapeId;
  readonly textureId: (typeof CLOUD_FALLBACK_TEXTURE_IDS)[FantasyCloudShapeId];
  readonly layer: "hero" | "mid" | "distant";
  readonly position: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly rollZ: number;
  readonly opacity: number;
  readonly nightOpacity: number;
  readonly skyBlend: number;
  readonly minCloudCover: number;
}

/** Compass convention matches solar-position.ts: +X east, -Z north, +Y up. */
function skyPosition(azimuthDeg: number, elevationDeg: number, radius: number): [number, number, number] {
  const azimuth = azimuthDeg * Math.PI / 180;
  const elevation = elevationDeg * Math.PI / 180;
  const horizontal = Math.cos(elevation) * radius;
  return [Math.sin(azimuth) * horizontal, Math.sin(elevation) * radius, -Math.cos(azimuth) * horizontal];
}

function cloud(
  id: string, shapeId: FantasyCloudShapeId, azimuth: number, elevation: number,
  width: number, height: number, rollZ = 0, minCloudCover = 0
): FantasyCloudPlacement {
  const kind = FANTASY_CLOUD_SHAPES[shapeId].kind;
  const hero = kind === "hero-cumulus";
  const wisp = kind === "fine-wisp";
  return {
    id, shapeId, textureId: CLOUD_FALLBACK_TEXTURE_IDS[shapeId],
    layer: hero ? "hero" : wisp ? "distant" : "mid",
    position: skyPosition(azimuth, elevation, hero ? 114 : wisp ? 121 : 118),
    scale: [width, height, 1], rollZ,
    opacity: hero ? 0.94 : wisp ? 0.56 : 0.8,
    nightOpacity: hero ? 0.22 : wisp ? 0.2 : 0.26,
    skyBlend: hero ? 0.13 : wisp ? 0.46 : 0.27,
    minCloudCover
  };
}

/** Six hero masses leave >180° clear; northern low sky stays open for aurora. */
export const FANTASY_CLOUD_PLACEMENTS: readonly FantasyCloudPlacement[] = [
  cloud("north-sail", "cumulus-sail", 33, 35, 36, 28, -0.04),
  cloud("east-tower", "cumulus-tower", 105, 27, 29, 33, 0.03),
  cloud("south-islands", "cumulus-islands", 167, 23, 43, 22),
  cloud("southwest-sail", "cumulus-sail", 224, 32, 39, 26, 0.02),
  cloud("west-tower", "cumulus-tower", 280, 25, 32, 30, -0.03),
  cloud("northwest-islands", "cumulus-islands", 331, 39, 40, 24, 0.04),
  cloud("northeast-shelf", "bank-shelf", 68, 15, 48, 22),
  cloud("southeast-taper", "bank-taper", 134, 13, 47, 23, 0.02),
  cloud("south-wave", "bank-wave", 196, 16, 49, 21),
  cloud("southwest-shelf", "bank-shelf", 252, 12, 45, 20, -0.02),
  cloud("northwest-taper", "bank-taper", 307, 14, 46, 21),
  cloud("north-wave", "bank-wave", 9, 10, 42, 18),
  cloud("high-east-feather", "wisp-feather", 81, 51, 45, 25, 0.1),
  cloud("high-south-crosswind", "wisp-crosswind", 181, 57, 48, 24, -0.06),
  cloud("high-west-feather", "wisp-feather", 263, 47, 43, 24, -0.08),
  cloud("high-north-crosswind", "wisp-crosswind", 358, 53, 46, 24, 0.04),
  cloud("overcast-north-shelf", "bank-shelf", 350, 28, 50, 26, 0, 65),
  cloud("overcast-east-wave", "bank-wave", 91, 36, 47, 25, -0.04, 65),
  cloud("overcast-south-taper", "bank-taper", 178, 42, 46, 26, 0.05, 78),
  cloud("overcast-west-crosswind", "wisp-crosswind", 271, 62, 45, 25, 0, 78)
];

export interface FantasySkyPalette {
  readonly zenithHex: string;
  readonly midHex: string;
  readonly horizonHex: string;
  readonly sunGlowHex: string;
  readonly cloudBodyHex: string;
  readonly cloudLightHex: string;
  readonly cloudShadowHex: string;
  readonly starHex: string;
  readonly auroraLowHex: string;
  readonly auroraHighHex: string;
}

export const FANTASY_SKY_PALETTES: Readonly<Record<"day" | "sunset" | "night", FantasySkyPalette>> = {
  day: {
    zenithHex: "#2379d2", midHex: "#63b7ed", horizonHex: "#c6e5f3", sunGlowHex: "#fff2ce",
    cloudBodyHex: "#f0f6ff", cloudLightHex: "#fff9e9", cloudShadowHex: "#82a6ce",
    starHex: "#edf5ff", auroraLowHex: "#78d5bf", auroraHighHex: "#8b83d2"
  },
  sunset: {
    zenithHex: "#465b9a", midHex: "#aa8bb8", horizonHex: "#f7bb98", sunGlowHex: "#ffd19a",
    cloudBodyHex: "#d9b2c6", cloudLightHex: "#ffe1ad", cloudShadowHex: "#736d9d",
    starHex: "#f5efff", auroraLowHex: "#78d5bf", auroraHighHex: "#8b83d2"
  },
  night: {
    zenithHex: "#09142f", midHex: "#1c3159", horizonHex: "#47617b", sunGlowHex: "#a7c9e2",
    cloudBodyHex: "#62779b", cloudLightHex: "#b0c8e2", cloudShadowHex: "#293e63",
    starHex: "#e9f1ff", auroraLowHex: "#78d5bf", auroraHighHex: "#8b83d2"
  }
};

export interface FantasyStar {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly sizePx: number;
  readonly brightness: number;
  readonly twinkleAmplitude: number;
  readonly twinklePeriodSeconds: number;
  readonly twinklePhase: number;
}

/** Fixed workload; a local PRNG keeps mount order and global Math.random irrelevant. */
export function createFantasyStars(seed = 0x4e455053): readonly FantasyStar[] {
  let state = Number.isFinite(seed) ? seed >>> 0 : 0x4e455053;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
  return Array.from({ length: 96 }, (_, index): FantasyStar => {
    const azimuthDeg = (index * 137.507764 + random() * 19) % 360;
    const sinElevation = Math.sin(Math.PI / 18) + Math.pow(random(), 0.65) * 0.81;
    const bright = index % 8 === 0;
    return {
      id: `fantasy-star-${index}`,
      position: skyPosition(azimuthDeg, Math.asin(sinElevation) * 180 / Math.PI, 123),
      sizePx: bright ? 1.6 + random() * 0.4 : 0.8 + random() * 0.6,
      brightness: bright ? 0.84 + random() * 0.16 : 0.45 + random() * 0.35,
      twinkleAmplitude: index < 90 && index % 5 === 0 ? 0.06 + random() * 0.06 : 0,
      twinklePeriodSeconds: 6 + random() * 6,
      twinklePhase: random() * Math.PI * 2
    };
  });
}

// Original authoring paths for archival assets; see local recovery manifest.
const SOURCE_ROOT = "output/world-plaza-summit-2026-11-09/sky-refinement-v2/assets";

/** Source paths are workspace files, never browser URLs. Null means not published. */
export const FANTASY_SKY_SOURCE_ASSETS = {
  moon: {
    sourcePath: "scripts/assets/moon-lroc-color-2k.jpg",
    runtimePath: "/world/plaza/sky/v3/moon-lroc-color-2k.jpg",
    bytes: 457_942,
    sha256: "f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170",
    credit: "NASA's Scientific Visualization Studio / Ernie Wright (USRA), LRO / LROC / LOLA",
    sourceUrl: "https://svs.gsfc.nasa.gov/4720/", width: 2048, height: 1024
  },
  aurora: {
    sourcePath: `${SOURCE_ROOT}/aurora-ribbon-v1.png`, runtimePath: null,
    credit: "Sol / built-in ImageGen, BetterMe sky refinement v2, 2026-11-09",
    sourceUrl: null, width: 1536, height: 1024
  },
  star: {
    sourcePath: `${SOURCE_ROOT}/star-point-v1.png`, runtimePath: null,
    credit: "Sol / built-in ImageGen, BetterMe sky refinement v2, 2026-11-09",
    sourceUrl: null, width: 1254, height: 1254
  },
  sun: {
    sourcePath: `${SOURCE_ROOT}/sun-aureole-v2.png`, runtimePath: "/world/plaza/sky/v2/sun-aureole-v2.png",
    credit: "Sol / built-in ImageGen, BetterMe sky refinement v2, 2026-11-09",
    sourceUrl: null, width: 1254, height: 1254
  }
} as const;
