import type { Camera, Group, Quaternion, Scene, Vector3, WebGLRenderer } from "three";

export type Clock = { value: number };
export type WaterKind = "pool" | "stream" | "fall";
export type IslandKind = WaterKind | "solid" | "leaf" | "grass" | "flower";
export type EffectKind = "lantern" | "waterfall-spray" | "shrub-fireflies" | "waterfall-impact";

export interface EffectAnchor {
  kind: EffectKind;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  worldScale: number;
  sprayLength?: number;
  fallWidth?: number;
  impactRadius?: number;
}

export interface SceneEffectsState {
  night: boolean;
  lamp: boolean;
  fireflies: number;
  firefliesVisible: boolean;
  lightIntensity: number;
  lightRange: number;
  shrubFireflies: number;
  shrubFirefliesVisible: number;
  spray: boolean;
  ribbons: number;
  points: number;
  disposed: boolean;
}

export interface IslandEffects {
  setNight(value: boolean): void;
  update(height: number): void;
  readonly state: { systems: SceneEffectsState[]; impacts: number };
  dispose(): void;
}

export interface WaterSurface {
  update(renderer: WebGLRenderer, scene: Scene, camera: Camera): void;
  dispose(): void;
}

export interface PreparedIslandV2 {
  root: Group;
  clock: Clock;
  daylight: Clock;
  effects: IslandEffects;
  waters: WaterSurface[];
  dispose(): void;
}
