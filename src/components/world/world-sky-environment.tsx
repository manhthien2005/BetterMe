"use client";

import { useFrame } from "@react-three/fiber";
import { PLAZA_SKY_SCALE } from "./plaza-horizon";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BufferAttribute,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type AmbientLight,
  type DirectionalLight,
  type Fog,
  type Group,
  type HemisphereLight,
  type Mesh,
  type MeshStandardMaterial,
  type Texture
} from "three";

import {
  PublicPlazaSkyClouds,
  updatePlazaV2CloudMaterials,
  usePlazaV2CloudResources
} from "@/components/world/public-plaza-sky-clouds";
import type { EffectiveEnvironmentSnapshot } from "@/lib/world/environment-model";
import { resolvePlazaCelestialRigPose } from "@/lib/world/solar-position";

interface StarPointDef {
  id: string;
  position: [number, number, number];
  size: number;
}

const PLAZA_NIGHT_STARS: readonly StarPointDef[] = [
  { id: "star-1", position: [-46, 14.5, -104], size: 0.45 },
  { id: "star-2", position: [-29, 17.4, -106], size: 0.42 },
  { id: "star-3", position: [-15, 15.2, -104], size: 0.48 },
  { id: "star-4", position: [-3.5, 18.6, -108], size: 0.4 },
  { id: "star-5", position: [10.5, 16.8, -106], size: 0.45 },
  { id: "star-6", position: [40.0, 17.5, -104], size: 0.44 },
  { id: "star-7", position: [-62.0, 14.6, -92], size: 0.38 },
  { id: "star-8", position: [64.0, 14.9, -92], size: 0.4 },
  { id: "star-9", position: [-22, 21.5, -108], size: 0.5 },
  { id: "star-10", position: [4.5, 22.2, -110], size: 0.54 },
  { id: "star-11", position: [30, 21.2, -108], size: 0.48 },
  { id: "star-12", position: [-74, 16.0, -76], size: 0.44 }
];

interface LegacyCloudClusterDef {
  id: string;
  basePosition: [number, number, number];
  scale: number;
  speed: number;
  minCloudCover: number;
}

const PERSONAL_WORLD_CLOUD_CLUSTERS: readonly LegacyCloudClusterDef[] = [
  { id: "cloud-1", basePosition: [-13.5, 0.85, -24], scale: 0.55, speed: 0.32, minCloudCover: 0 },
  { id: "cloud-2", basePosition: [13.5, 0.9, -24], scale: 0.58, speed: 0.26, minCloudCover: 0 },
  { id: "cloud-3", basePosition: [-7.5, 1.1, -25.5], scale: 0.5, speed: 0.35, minCloudCover: 18 },
  { id: "cloud-4", basePosition: [7.8, 1.05, -25.5], scale: 0.52, speed: 0.28, minCloudCover: 28 },
  { id: "cloud-5", basePosition: [-19.5, 1.15, -22.5], scale: 0.62, speed: 0.24, minCloudCover: 40 },
  { id: "cloud-6", basePosition: [19.5, 1.15, -22.5], scale: 0.6, speed: 0.3, minCloudCover: 55 },
  { id: "cloud-7", basePosition: [-11, 6.2, -30], scale: 1.05, speed: 0.27, minCloudCover: 68 },
  { id: "cloud-8", basePosition: [11, 6.5, -30], scale: 1.1, speed: 0.22, minCloudCover: 80 }
];

const PERSONAL_WORLD_NIGHT_STARS: readonly StarPointDef[] = [
  { id: "star-1", position: [-17, 1.15, -26], size: 0.16 },
  { id: "star-2", position: [-11.5, 1.35, -26.5], size: 0.14 },
  { id: "star-3", position: [-6.5, 1.25, -26], size: 0.17 },
  { id: "star-4", position: [6.5, 1.3, -26], size: 0.15 },
  { id: "star-5", position: [12, 1.18, -26.5], size: 0.16 },
  { id: "star-6", position: [17.5, 1.28, -26], size: 0.15 },
  { id: "star-7", position: [-14.5, 0.85, -25.5], size: 0.13 },
  { id: "star-8", position: [15, 0.9, -25.5], size: 0.14 },
  { id: "star-9", position: [-15, 12, -34], size: 0.28 },
  { id: "star-10", position: [0, 15, -36], size: 0.3 },
  { id: "star-11", position: [16, 13, -34], size: 0.26 },
  { id: "star-12", position: [0, 28, -24], size: 0.32 }
];

const SKY_DOME_RADIUS = 126;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Generates a pure-white RGB + organic alpha CanvasTexture (256x128) for fallback
 * high-altitude clouds and cirrus wisps while the cloud atlas is loading.
 */
function createHighCloudAlphaTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 256, 128);

  const lobes: readonly [number, number, number, number, number][] = [
    [96, 66, 56, 36, 0.82],
    [62, 72, 42, 26, 0.72],
    [138, 68, 52, 32, 0.76],
    [178, 76, 46, 22, 0.58],
    [212, 82, 34, 15, 0.36],
    [84, 48, 38, 26, 0.68],
    [122, 54, 34, 22, 0.6]
  ];

  for (const [cx, cy, rx, ry, peakAlpha] of lobes) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const grad = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1.0);
    grad.addColorStop(0, `rgba(255, 255, 255, ${peakAlpha})`);
    grad.addColorStop(0.55, `rgba(255, 255, 255, ${peakAlpha * 0.62})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft radial atmospheric sun halo CanvasTexture (256x256) with zero
 * hard edges, fading smoothly from a warm luminous corona at the center to 0 alpha at the rim.
 */
function createSunRadialGlowTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 256, 256);
  const grad = ctx.createRadialGradient(128, 128, 2, 128, 128, 126);
  grad.addColorStop(0.0, "rgba(255, 255, 252, 0.98)");
  grad.addColorStop(0.11, "rgba(255, 253, 244, 0.84)");
  grad.addColorStop(0.24, "rgba(255, 249, 230, 0.44)");
  grad.addColorStop(0.46, "rgba(255, 245, 216, 0.16)");
  grad.addColorStop(0.72, "rgba(255, 242, 208, 0.04)");
  grad.addColorStop(1.0, "rgba(255, 242, 208, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Updates vertex colors on the Public Plaza sky dome sphere using a 3-stop sky gradient:
 * - Base blends with `fogColor` below the horizon (`worldRelY < -0.2m`)
 * - Lower sky transitions from `horizonColor` (`#B4EDFD`) to `midColor` (`#43AAFB`) across `-0.2m .. +5.2m`
 * - Upper sky transitions from `midColor` (`#43AAFB`) to `zenithColor` (`#176AD9`) across `+5.2m .. +15.8m`
 * - Adds a localized directional solar glow (`sunGlowColor`) around `sunDirection` (`dotSun`).
 */
function updateSkyDomeGradientColors(
  geometry: SphereGeometry,
  fogColor: Color,
  horizonColor: Color,
  midColor: Color,
  zenithColor: Color,
  sunGlowColor: Color,
  sunDirection: readonly [number, number, number],
  sunGlowStrength: number,
  scratchColor: Color
): void {
  const posAttr = geometry.getAttribute("position");
  let colorAttr = geometry.getAttribute("color") as BufferAttribute | undefined;
  if (!colorAttr || colorAttr.count !== posAttr.count) {
    colorAttr = new BufferAttribute(new Float32Array(posAttr.count * 3), 3);
    geometry.setAttribute("color", colorAttr);
  }

  const [sdx, sdy, sdz] = sunDirection;
  const sLen = Math.hypot(sdx, sdy, sdz) || 1;
  const nxSun = sdx / sLen;
  const nySun = sdy / sLen;
  const nzSun = sdz / sLen;

  const colors = colorAttr.array as Float32Array;
  for (let i = 0; i < posAttr.count; i += 1) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const worldRelY = y * 0.72 - 4.6;

    if (worldRelY < -0.2) {
      const tFog = smoothstep(-4.4, -0.2, worldRelY);
      scratchColor.copy(fogColor).lerp(horizonColor, tFog);
    } else if (worldRelY < 5.2) {
      const tMid = smoothstep(-0.2, 5.2, worldRelY);
      scratchColor.copy(horizonColor).lerp(midColor, tMid);
    } else {
      const tZenith = smoothstep(5.2, 15.8, worldRelY);
      scratchColor.copy(midColor).lerp(zenithColor, tZenith);
    }

    if (sunGlowStrength > 0.01 && worldRelY > -3.5) {
      const rayY = worldRelY - 2.4;
      const vLen = Math.hypot(x, rayY, z) || 1;
      const vx = x / vLen;
      const vy = rayY / vLen;
      const vz = z / vLen;
      const dotSun = clamp01(vx * nxSun + vy * nySun + vz * nzSun);
      if (dotSun > 0.02) {
        const horizonBand = 1 - smoothstep(-0.04, 0.52, Math.abs(vy - nySun));
        const glow =
          (Math.pow(dotSun, 4.5) * 0.34 +
            Math.pow(dotSun, 2.0) * horizonBand * 0.22) *
          sunGlowStrength;
        if (glow > 0.002) {
          scratchColor.lerp(sunGlowColor, clamp01(glow));
        }
      }
    }

    const offset = i * 3;
    colors[offset] = scratchColor.r;
    colors[offset + 1] = scratchColor.g;
    colors[offset + 2] = scratchColor.b;
  }

  colorAttr.needsUpdate = true;
}

function PublicPlazaSkyEnvironment({
  environment
}: {
  environment: EffectiveEnvironmentSnapshot;
}) {
  const { lighting, plazaSun } = environment;

  const fogRef = useRef<Fog>(null);
  const skyRigGroupRef = useRef<Group>(null);
  const celestialGroupRef = useRef<Group>(null);
  const sunCoreMatRef = useRef<MeshBasicMaterial>(null);
  const sunHaloMatRef = useRef<MeshBasicMaterial>(null);
  const sunHaloMeshRef = useRef<Mesh>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const hemisphereRef = useRef<HemisphereLight>(null);
  const directionalRef = useRef<DirectionalLight>(null);
  const cloudsGroupRef = useRef<Group>(null);
  const reducedMotionRef = useRef(false);
  const sunAureoleTextureRef = useRef<Texture | null>(null);
  const lastCameraPosRef = useRef<[number, number, number]>([0, 2.45, 11.2]);

  const targetColors = useMemo(
    () => ({
      zenith: new Color(lighting.skyZenithHex),
      mid: new Color(lighting.skyMidHex),
      horizon: new Color(lighting.skyHorizonHex),
      fog: new Color(lighting.fogColorHex),
      ambient: new Color(lighting.ambientColorHex),
      hemiSky: new Color(lighting.hemisphereSkyHex),
      hemiGround: new Color(lighting.hemisphereGroundHex),
      directional: new Color(lighting.directionalColorHex),
      cloud: new Color(lighting.cloudColorHex),
      sunGlow: new Color(lighting.celestialEmissiveHex).lerp(
        new Color(lighting.skyHorizonHex),
        0.28
      )
    }),
    [
      lighting.ambientColorHex,
      lighting.celestialEmissiveHex,
      lighting.cloudColorHex,
      lighting.directionalColorHex,
      lighting.fogColorHex,
      lighting.hemisphereGroundHex,
      lighting.hemisphereSkyHex,
      lighting.skyHorizonHex,
      lighting.skyMidHex,
      lighting.skyZenithHex
    ]
  );

  // Night keeps its artistic moon trajectory; daytime/dusk uses HCMC NOAA solar direction
  const targetSunDirection = useMemo<readonly [number, number, number]>(() => {
    if (!environment.isNight && plazaSun) {
      return plazaSun.direction;
    }
    const [sx, sy, sz] = lighting.sunPosition;
    const len = Math.hypot(sx, sy, sz) || 1;
    return [sx / len, sy / len, sz / len];
  }, [environment.isNight, lighting.sunPosition, plazaSun]);

  const isCelestialVisible = useMemo(() => {
    if (environment.isNight) {
      return true;
    }
    if (plazaSun) {
      return plazaSun.elevationRad > 0;
    }
    return true;
  }, [environment.isNight, plazaSun]);

  const sunGlowStrength = useMemo(() => {
    if (environment.isNight) return 0.16;
    if (environment.isRaining) return 0.18;
    if (environment.weatherKind === "overcast") return 0.28;
    if (plazaSun && plazaSun.elevationRad <= -0.08) return 0.18;
    if (environment.dayPhase === "dusk") return 0.85;
    if (environment.dayPhase === "morning" || environment.dayPhase === "afternoon") return 0.68;
    return 0.48;
  }, [
    environment.dayPhase,
    environment.isNight,
    environment.isRaining,
    environment.weatherKind,
    plazaSun
  ]);

  const { sunCoreOpacity, sunHaloOpacity } = useMemo(() => {
    if (environment.isNight) {
      return {
        sunCoreOpacity: 1.0,
        sunHaloOpacity: environment.isRaining ? 0.14 : 0.34
      };
    }
    if (environment.isRaining) {
      return { sunCoreOpacity: 0.18, sunHaloOpacity: 0.2 };
    }
    if (environment.weatherKind === "overcast") {
      return { sunCoreOpacity: 0.42, sunHaloOpacity: 0.36 };
    }
    if (environment.weatherKind === "partly_cloudy") {
      return { sunCoreOpacity: 0.96, sunHaloOpacity: 0.82 };
    }
    return { sunCoreOpacity: 0.98, sunHaloOpacity: 0.88 };
  }, [environment.isNight, environment.isRaining, environment.weatherKind]);

  const currentSunDirRef = useRef<[number, number, number]>([
    targetSunDirection[0],
    targetSunDirection[1],
    targetSunDirection[2]
  ]);

  const currentSkyColorsRef = useRef({
    fog: new Color(lighting.fogColorHex),
    horizon: new Color(lighting.skyHorizonHex),
    mid: new Color(lighting.skyMidHex),
    zenith: new Color(lighting.skyZenithHex),
    cloud: new Color(lighting.cloudColorHex),
    cloudOpacity: lighting.cloudOpacity,
    sunGlow: new Color(lighting.celestialEmissiveHex).lerp(
      new Color(lighting.skyHorizonHex),
      0.28
    ),
    scratchA: new Color(),
    scratchB: new Color(),
    scratchC: new Color(),
    scratchVec: new Vector3()
  });

  const skyDomeGeometry = useMemo(() => {
    const geo = new SphereGeometry(SKY_DOME_RADIUS, 48, 32);
    updateSkyDomeGradientColors(
      geo,
      new Color(lighting.fogColorHex),
      new Color(lighting.skyHorizonHex),
      new Color(lighting.skyMidHex),
      new Color(lighting.skyZenithHex),
      new Color(lighting.celestialEmissiveHex),
      targetSunDirection,
      sunGlowStrength,
      new Color()
    );
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sunRadialGlowTexture = useMemo(() => createSunRadialGlowTexture(), []);
  const sunHaloPlaneGeometry = useMemo(() => new PlaneGeometry(26, 26), []);
  const highCloudAlphaTexture = useMemo(() => createHighCloudAlphaTexture(), []);

  const { geometries: cloudGeometries, spriteMaterials: cloudSpriteMaterials } =
    usePlazaV2CloudResources(highCloudAlphaTexture);

  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();
    loader.load(
      "/world/plaza/sky/v2/sun-aureole-v2.png",
      (loadedTex) => {
        if (cancelled) {
          loadedTex.dispose();
          return;
        }
        loadedTex.colorSpace = SRGBColorSpace;
        loadedTex.wrapS = ClampToEdgeWrapping;
        loadedTex.wrapT = ClampToEdgeWrapping;
        loadedTex.generateMipmaps = true;
        loadedTex.minFilter = LinearMipmapLinearFilter;
        loadedTex.magFilter = LinearFilter;
        loadedTex.needsUpdate = true;
        sunAureoleTextureRef.current = loadedTex;
        if (sunHaloMatRef.current) {
          sunHaloMatRef.current.map = loadedTex;
          sunHaloMatRef.current.needsUpdate = true;
        }
      },
      undefined,
      () => {
        // Fallback `sunRadialGlowTexture` remains active if `/world/plaza/sky/v2/sun-aureole-v2.png` fails
      }
    );

    return () => {
      cancelled = true;
      skyDomeGeometry.dispose();
      sunHaloPlaneGeometry.dispose();
      sunRadialGlowTexture?.dispose();
      highCloudAlphaTexture?.dispose();
      sunAureoleTextureRef.current?.dispose();
      sunAureoleTextureRef.current = null;
    };
  }, [
    highCloudAlphaTexture,
    skyDomeGeometry,
    sunHaloPlaneGeometry,
    sunRadialGlowTexture
  ]);

  useEffect(() => {
    if (!environment.isNight && sunHaloMatRef.current && sunAureoleTextureRef.current) {
      sunHaloMatRef.current.map = sunAureoleTextureRef.current;
      sunHaloMatRef.current.needsUpdate = true;
    }
  }, [environment.isNight]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Immediate gradient + depth-layered clouds + true-elevation sun/shadow-light update whenever target palette or solar direction changes
  useEffect(() => {
    const skyState = currentSkyColorsRef.current;
    skyState.fog.copy(targetColors.fog);
    skyState.horizon.copy(targetColors.horizon);
    skyState.mid.copy(targetColors.mid);
    skyState.zenith.copy(targetColors.zenith);
    skyState.cloud.copy(targetColors.cloud);
    skyState.cloudOpacity = lighting.cloudOpacity;
    skyState.sunGlow.copy(targetColors.sunGlow);
    currentSunDirRef.current[0] = targetSunDirection[0];
    currentSunDirRef.current[1] = targetSunDirection[1];
    currentSunDirRef.current[2] = targetSunDirection[2];

    updateSkyDomeGradientColors(
      skyDomeGeometry,
      skyState.fog,
      skyState.horizon,
      skyState.mid,
      skyState.zenith,
      skyState.sunGlow,
      currentSunDirRef.current,
      sunGlowStrength,
      skyState.scratchA
    );

    const rigPose = resolvePlazaCelestialRigPose({
      direction: currentSunDirRef.current,
      cameraPosition: lastCameraPosRef.current,
      isNight: environment.isNight
    });

    if (celestialGroupRef.current) {
      celestialGroupRef.current.position.set(
        rigPose.localPosition[0],
        rigPose.localPosition[1],
        rigPose.localPosition[2]
      );
      celestialGroupRef.current.visible = rigPose.visible && isCelestialVisible;
      celestialGroupRef.current.lookAt(
        lastCameraPosRef.current[0],
        lastCameraPosRef.current[1],
        lastCameraPosRef.current[2]
      );
    }

    if (directionalRef.current) {
      directionalRef.current.position.set(
        rigPose.shadowLightPosition[0],
        rigPose.shadowLightPosition[1],
        rigPose.shadowLightPosition[2]
      );
      directionalRef.current.target.position.set(0, 0, 0);
      directionalRef.current.target.updateMatrixWorld();
    }

    updatePlazaV2CloudMaterials({
      spriteMaterials: cloudSpriteMaterials,
      fogColor: skyState.fog,
      horizonColor: skyState.horizon,
      midColor: skyState.mid,
      zenithColor: skyState.zenith,
      sunGlowColor: skyState.sunGlow,
      cloudBodyColor: skyState.cloud,
      sunDirection: currentSunDirRef.current,
      sunGlowStrength,
      cloudOpacity: skyState.cloudOpacity,
      isNight: environment.isNight,
      isRaining: environment.isRaining,
      weatherKind: environment.weatherKind,
      scratchColorA: skyState.scratchA,
      scratchColorB: skyState.scratchB,
      scratchColorC: skyState.scratchC,
      scratchVec: skyState.scratchVec
    });
  }, [
    cloudSpriteMaterials,
    environment.isNight,
    environment.isRaining,
    environment.weatherKind,
    isCelestialVisible,
    lighting.cloudOpacity,
    skyDomeGeometry,
    sunGlowStrength,
    targetColors.cloud,
    targetColors.fog,
    targetColors.horizon,
    targetColors.mid,
    targetColors.sunGlow,
    targetColors.zenith,
    targetSunDirection
  ]);

  const initialRigPose = useMemo(
    () =>
      resolvePlazaCelestialRigPose({
        direction: targetSunDirection,
        cameraPosition: [0, 2.45, 11.2],
        isNight: environment.isNight
      }),
    [environment.isNight, targetSunDirection]
  );

  useFrame(({ scene, camera }, delta) => {
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const alpha = reducedMotionRef.current ? 1 : 1 - Math.exp(-4.5 * dt);

    lastCameraPosRef.current[0] = camera.position.x;
    lastCameraPosRef.current[1] = camera.position.y;
    lastCameraPosRef.current[2] = camera.position.z;

    if (skyRigGroupRef.current) {
      skyRigGroupRef.current.position.set(camera.position.x, 0, camera.position.z);
    }

    if (scene.background instanceof Color) {
      scene.background.lerp(targetColors.horizon, alpha);
    }
    if (fogRef.current) {
      fogRef.current.color.lerp(targetColors.fog, alpha);
      fogRef.current.near += (lighting.fogNear - fogRef.current.near) * alpha;
      fogRef.current.far += (lighting.fogFar - fogRef.current.far) * alpha;
    }

    const curDir = currentSunDirRef.current;
    const prevDx = curDir[0];
    const prevDy = curDir[1];
    const prevDz = curDir[2];
    curDir[0] += (targetSunDirection[0] - curDir[0]) * alpha;
    curDir[1] += (targetSunDirection[1] - curDir[1]) * alpha;
    curDir[2] += (targetSunDirection[2] - curDir[2]) * alpha;
    const dirLen = Math.hypot(curDir[0], curDir[1], curDir[2]) || 1;
    curDir[0] /= dirLen;
    curDir[1] /= dirLen;
    curDir[2] /= dirLen;
    const dirDelta =
      Math.abs(curDir[0] - prevDx) +
      Math.abs(curDir[1] - prevDy) +
      Math.abs(curDir[2] - prevDz);

    const rigPose = resolvePlazaCelestialRigPose({
      direction: curDir,
      cameraPosition: lastCameraPosRef.current,
      isNight: environment.isNight
    });

    if (celestialGroupRef.current) {
      celestialGroupRef.current.position.set(
        rigPose.localPosition[0],
        rigPose.localPosition[1],
        rigPose.localPosition[2]
      );
      celestialGroupRef.current.visible = rigPose.visible && isCelestialVisible;
      celestialGroupRef.current.lookAt(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
    }

    const skyState = currentSkyColorsRef.current;
    const prevR =
      skyState.zenith.r +
      skyState.mid.r +
      skyState.horizon.r +
      skyState.fog.r +
      skyState.sunGlow.r +
      skyState.cloud.r +
      skyState.cloudOpacity;
    skyState.fog.lerp(targetColors.fog, alpha);
    skyState.horizon.lerp(targetColors.horizon, alpha);
    skyState.mid.lerp(targetColors.mid, alpha);
    skyState.zenith.lerp(targetColors.zenith, alpha);
    skyState.cloud.lerp(targetColors.cloud, alpha);
    skyState.cloudOpacity += (lighting.cloudOpacity - skyState.cloudOpacity) * alpha;
    skyState.sunGlow.lerp(targetColors.sunGlow, alpha);
    const nextR =
      skyState.zenith.r +
      skyState.mid.r +
      skyState.horizon.r +
      skyState.fog.r +
      skyState.sunGlow.r +
      skyState.cloud.r +
      skyState.cloudOpacity;

    if (Math.abs(nextR - prevR) > 1e-4 || dirDelta > 1e-4) {
      updateSkyDomeGradientColors(
        skyDomeGeometry,
        skyState.fog,
        skyState.horizon,
        skyState.mid,
        skyState.zenith,
        skyState.sunGlow,
        curDir,
        sunGlowStrength,
        skyState.scratchA
      );

      updatePlazaV2CloudMaterials({
        spriteMaterials: cloudSpriteMaterials,
        fogColor: skyState.fog,
        horizonColor: skyState.horizon,
        midColor: skyState.mid,
        zenithColor: skyState.zenith,
        sunGlowColor: skyState.sunGlow,
        cloudBodyColor: skyState.cloud,
        sunDirection: curDir,
        sunGlowStrength,
        cloudOpacity: skyState.cloudOpacity,
        isNight: environment.isNight,
        isRaining: environment.isRaining,
        weatherKind: environment.weatherKind,
        scratchColorA: skyState.scratchA,
        scratchColorB: skyState.scratchB,
        scratchColorC: skyState.scratchC,
        scratchVec: skyState.scratchVec
      });
    }

    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetColors.ambient, alpha);
      ambientRef.current.intensity +=
        (lighting.ambientIntensity - ambientRef.current.intensity) * alpha;
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.color.lerp(targetColors.hemiSky, alpha);
      hemisphereRef.current.groundColor.lerp(targetColors.hemiGround, alpha);
      hemisphereRef.current.intensity +=
        (lighting.hemisphereIntensity - hemisphereRef.current.intensity) * alpha;
    }
    if (directionalRef.current) {
      const lowHorizonAttenuation = environment.isNight
        ? 1
        : 0.45 + 0.55 * smoothstep(0.0, 0.08, Math.max(0, curDir[1]));
      const targetDirIntensity = lighting.directionalIntensity * lowHorizonAttenuation;
      directionalRef.current.color.lerp(targetColors.directional, alpha);
      directionalRef.current.intensity +=
        (targetDirIntensity - directionalRef.current.intensity) * alpha;
      directionalRef.current.position.set(
        rigPose.shadowLightPosition[0],
        rigPose.shadowLightPosition[1],
        rigPose.shadowLightPosition[2]
      );
      directionalRef.current.target.position.set(0, 0, 0);
      directionalRef.current.target.updateMatrixWorld();
    }

    if (cloudsGroupRef.current) {
      // Subtle high-altitude lateral parallax when moving across the plaza, fixed world compass orientation
      cloudsGroupRef.current.position.set(
        -camera.position.x * 0.042,
        0,
        -(camera.position.z - 11.2) * 0.042
      );
      if (!reducedMotionRef.current) {
        cloudsGroupRef.current.rotation.y += dt * 0.0024;
      }
    }
  });

  return (
    <group name="world-sky-environment">
      <color args={[lighting.skyHorizonHex]} attach="background" />
      <fog
        args={[lighting.fogColorHex, lighting.fogNear, lighting.fogFar]}
        attach="fog"
        ref={fogRef}
      />

      {/* Soft Academy Lighting */}
      <ambientLight
        color={lighting.ambientColorHex}
        intensity={lighting.ambientIntensity}
        ref={ambientRef}
      />
      <hemisphereLight
        args={[
          lighting.hemisphereSkyHex,
          lighting.hemisphereGroundHex,
          lighting.hemisphereIntensity
        ]}
        ref={hemisphereRef}
      />
      <directionalLight
        castShadow
        color={lighting.directionalColorHex}
        intensity={lighting.directionalIntensity}
        position={initialRigPose.shadowLightPosition}
        ref={directionalRef}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-28}
        shadow-camera-far={95}
        shadow-camera-left={-28}
        shadow-camera-near={1}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Keep the sky behind the full mountain horizon. */}
      <group name="plaza-camera-sky-rig" ref={skyRigGroupRef} scale={PLAZA_SKY_SCALE}>
        {/* 1. 3-Stop Horizon-to-Mid-to-Zenith + Directional Sun-Glow Sky Dome */}
        <mesh
          geometry={skyDomeGeometry}
          name="sky-gradient-dome"
          position={[0, -4.6, 0]}
          renderOrder={-15}
          scale={[1, 0.72, 1]}
        >
          <meshBasicMaterial
            depthTest
            depthWrite={false}
            fog={false}
            side={BackSide}
            toneMapped={false}
            vertexColors
          />
        </mesh>

        {/* 2. Subtle Night & Dusk Stars */}
        {lighting.starOpacity > 0.05 ? (
          <group name="sky-night-stars">
            {PLAZA_NIGHT_STARS.map((star) => (
              <mesh key={star.id} position={star.position} renderOrder={-14}>
                <octahedronGeometry args={[star.size, 0]} />
                <meshBasicMaterial
                  color="#F8FAFC"
                  depthTest
                  depthWrite={false}
                  fog={false}
                  opacity={lighting.starOpacity}
                  toneMapped={false}
                  transparent
                />
              </mesh>
            ))}
          </group>
        ) : null}

        {/* 3. Celestial Body: Small Soft Sun Core (0.6-0.9 deg) + V2 Solar Aureole (Day/Dusk) or Cozy Moon (Night) */}
        <group
          name={environment.isNight ? "celestial-moon" : "celestial-sun"}
          position={initialRigPose.localPosition}
          ref={celestialGroupRef}
          scale={lighting.celestialScale}
          visible={initialRigPose.visible && isCelestialVisible}
        >
          <mesh renderOrder={-12}>
            <sphereGeometry args={[environment.isNight ? 2.8 : 0.88, 20, 20]} />
            <meshBasicMaterial
              color={lighting.celestialColorHex}
              depthTest
              depthWrite={false}
              fog={false}
              opacity={sunCoreOpacity}
              ref={sunCoreMatRef}
              toneMapped={false}
              transparent
            />
          </mesh>
          {environment.isNight ? (
            <mesh renderOrder={-13}>
              <sphereGeometry args={[4.8, 16, 16]} />
              <meshBasicMaterial
                color={lighting.celestialEmissiveHex}
                depthTest
                depthWrite={false}
                fog={false}
                opacity={sunHaloOpacity}
                toneMapped={false}
                transparent
              />
            </mesh>
          ) : (
            <mesh
              geometry={sunHaloPlaneGeometry}
              ref={sunHaloMeshRef}
              renderOrder={-13}
            >
              <meshBasicMaterial
                color={lighting.celestialEmissiveHex}
                depthTest
                depthWrite={false}
                fog={false}
                map={sunRadialGlowTexture ?? null}
                opacity={sunHaloOpacity}
                ref={sunHaloMatRef}
                side={DoubleSide}
                toneMapped={false}
                transparent
              />
            </mesh>
          )}
        </group>

        {/* 4. Depth-Layered V2 Sky Clouds (12 independent 512x512 textures + directional sun shading) */}
        <PublicPlazaSkyClouds
          cloudCoverPct={environment.cloudCoverPct}
          cloudsGroupRef={cloudsGroupRef}
          geometries={cloudGeometries}
          spriteMaterials={cloudSpriteMaterials}
        />
      </group>
    </group>
  );
}

/**
 * Pre-Moc-B sky & lighting branch preserved for `Personal World` while the
 * Moc-B sky/backdrop prototype remains scoped strictly to `Public Plaza`.
 */
function PersonalWorldSkyEnvironment({
  environment
}: {
  environment: EffectiveEnvironmentSnapshot;
}) {
  const { lighting } = environment;

  const fogRef = useRef<Fog>(null);
  const skyDomeMatRef = useRef<MeshBasicMaterial>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const hemisphereRef = useRef<HemisphereLight>(null);
  const directionalRef = useRef<DirectionalLight>(null);
  const cloudsGroupRef = useRef<Group>(null);
  const cloudMatRef = useRef<MeshStandardMaterial>(null);
  const reducedMotionRef = useRef(false);

  const targetColors = useMemo(
    () => ({
      zenith: new Color(lighting.skyZenithHex),
      horizon: new Color(lighting.skyHorizonHex),
      fog: new Color(lighting.fogColorHex),
      ambient: new Color(lighting.ambientColorHex),
      hemiSky: new Color(lighting.hemisphereSkyHex),
      hemiGround: new Color(lighting.hemisphereGroundHex),
      directional: new Color(lighting.directionalColorHex),
      cloud: new Color(lighting.cloudColorHex)
    }),
    [
      lighting.ambientColorHex,
      lighting.cloudColorHex,
      lighting.directionalColorHex,
      lighting.fogColorHex,
      lighting.hemisphereGroundHex,
      lighting.hemisphereSkyHex,
      lighting.skyHorizonHex,
      lighting.skyZenithHex
    ]
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const celestialWorldPos = useMemo<[number, number, number]>(() => {
    switch (environment.dayPhase) {
      case "morning":
        return [9.8, 1.15, -26];
      case "noon":
        return [8.2, 1.35, -26.5];
      case "afternoon":
        return [-8.8, 1.2, -26];
      case "dusk":
        return [-10.5, 0.95, -25.5];
      case "night":
      default:
        return [9.2, 1.2, -26];
    }
  }, [environment.dayPhase]);

  useFrame(({ scene }, delta) => {
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const alpha = reducedMotionRef.current ? 1 : 1 - Math.exp(-4.5 * dt);

    if (scene.background instanceof Color) {
      scene.background.lerp(targetColors.horizon, alpha);
    }
    if (fogRef.current) {
      fogRef.current.color.lerp(targetColors.fog, alpha);
      fogRef.current.near += (lighting.fogNear - fogRef.current.near) * alpha;
      fogRef.current.far += (lighting.fogFar - fogRef.current.far) * alpha;
    }
    if (skyDomeMatRef.current) {
      skyDomeMatRef.current.color.lerp(targetColors.zenith, alpha);
    }
    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetColors.ambient, alpha);
      ambientRef.current.intensity +=
        (lighting.ambientIntensity - ambientRef.current.intensity) * alpha;
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.color.lerp(targetColors.hemiSky, alpha);
      hemisphereRef.current.groundColor.lerp(targetColors.hemiGround, alpha);
      hemisphereRef.current.intensity +=
        (lighting.hemisphereIntensity - hemisphereRef.current.intensity) * alpha;
    }
    if (directionalRef.current) {
      directionalRef.current.color.lerp(targetColors.directional, alpha);
      directionalRef.current.intensity +=
        (lighting.directionalIntensity - directionalRef.current.intensity) * alpha;
    }
    if (cloudMatRef.current) {
      cloudMatRef.current.color.lerp(targetColors.cloud, alpha);
      cloudMatRef.current.opacity +=
        (lighting.cloudOpacity - cloudMatRef.current.opacity) * alpha;
    }

    if (cloudsGroupRef.current && !reducedMotionRef.current) {
      cloudsGroupRef.current.rotation.y += dt * 0.008;
    }
  });

  const visibleClouds = useMemo(() => {
    const threshold = Math.max(12, environment.cloudCoverPct);
    return PERSONAL_WORLD_CLOUD_CLUSTERS.filter(
      (cluster) => cluster.minCloudCover <= threshold
    );
  }, [environment.cloudCoverPct]);

  return (
    <group name="world-sky-environment">
      <color args={[lighting.skyHorizonHex]} attach="background" />
      <fog
        args={[lighting.fogColorHex, lighting.fogNear, lighting.fogFar]}
        attach="fog"
        ref={fogRef}
      />

      {/* Upper Zenith Sky Dome blending into Horizon Fog */}
      <mesh position={[0, -6, 0]} scale={[1, 0.68, 1]}>
        <sphereGeometry args={[108, 24, 16]} />
        <meshBasicMaterial
          color={lighting.skyZenithHex}
          depthWrite={false}
          ref={skyDomeMatRef}
          side={BackSide}
        />
      </mesh>

      {/* Soft Academy Lighting */}
      <ambientLight
        color={lighting.ambientColorHex}
        intensity={lighting.ambientIntensity}
        ref={ambientRef}
      />
      <hemisphereLight
        args={[
          lighting.hemisphereSkyHex,
          lighting.hemisphereGroundHex,
          lighting.hemisphereIntensity
        ]}
        ref={hemisphereRef}
      />
      <directionalLight
        castShadow
        color={lighting.directionalColorHex}
        intensity={lighting.directionalIntensity}
        position={lighting.sunPosition}
        ref={directionalRef}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-28}
        shadow-camera-far={75}
        shadow-camera-left={-28}
        shadow-camera-near={1}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Celestial Body: Sun (Day/Dusk) or Cozy Moon (Night) */}
      <group
        name={environment.isNight ? "celestial-moon" : "celestial-sun"}
        position={celestialWorldPos}
        scale={lighting.celestialScale}
      >
        <mesh>
          <sphereGeometry args={[environment.isNight ? 0.85 : 1.05, 20, 20]} />
          <meshStandardMaterial
            color={lighting.celestialColorHex}
            emissive={lighting.celestialEmissiveHex}
            emissiveIntensity={environment.isNight ? 0.95 : 1.1}
            fog={false}
            roughness={0.2}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[environment.isNight ? 1.3 : 1.6, 16, 16]} />
          <meshBasicMaterial
            color={lighting.celestialEmissiveHex}
            depthWrite={false}
            fog={false}
            opacity={environment.isRaining ? 0.12 : 0.28}
            transparent
          />
        </mesh>
      </group>

      {/* Subtle Night & Dusk Stars */}
      {lighting.starOpacity > 0.05 ? (
        <group name="sky-night-stars">
          {PERSONAL_WORLD_NIGHT_STARS.map((star) => (
            <mesh key={star.id} position={star.position}>
              <octahedronGeometry args={[star.size, 0]} />
              <meshBasicMaterial
                color="#F8FAFC"
                depthWrite={false}
                fog={false}
                opacity={lighting.starOpacity}
                transparent
              />
            </mesh>
          ))}
        </group>
      ) : null}

      {/* Soft Low-Poly Cloud Clusters */}
      <group name="sky-cloud-clusters" ref={cloudsGroupRef}>
        {visibleClouds.map((cluster) => (
          <group
            key={cluster.id}
            position={cluster.basePosition}
            scale={cluster.scale}
          >
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[2.6, 1]} />
              <meshStandardMaterial
                color={lighting.cloudColorHex}
                opacity={lighting.cloudOpacity}
                ref={cluster.id === "cloud-1" ? cloudMatRef : undefined}
                roughness={0.95}
                transparent
              />
            </mesh>
            <mesh position={[2.1, -0.3, 0.4]}>
              <dodecahedronGeometry args={[1.95, 1]} />
              <meshStandardMaterial
                color={lighting.cloudColorHex}
                opacity={lighting.cloudOpacity}
                roughness={0.95}
                transparent
              />
            </mesh>
            <mesh position={[-2.0, -0.4, -0.3]}>
              <dodecahedronGeometry args={[1.85, 1]} />
              <meshStandardMaterial
                color={lighting.cloudColorHex}
                opacity={lighting.cloudOpacity}
                roughness={0.95}
                transparent
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function WorldSkyEnvironment({
  environment,
  isPersonalSpace = false
}: {
  environment: EffectiveEnvironmentSnapshot;
  isPersonalSpace?: boolean;
}) {
  if (isPersonalSpace) {
    return <PersonalWorldSkyEnvironment environment={environment} />;
  }
  return <PublicPlazaSkyEnvironment environment={environment} />;
}
