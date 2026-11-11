import { Box3, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import {
  createFantasyPlazaAsset,
  type PlazaAssetKind,
  type PlazaAssetPart
} from "./fantasy-plaza-assets";

const kinds: PlazaAssetKind[] = [
  "fountain", "tree", "blossom", "bench", "pillar", "signpost",
  "lantern", "rock", "flowers", "pavilion", "gate"
];

function dispose(parts: PlazaAssetPart[]) {
  parts.forEach(({ geometry }) => geometry.dispose());
}

function bounds(parts: PlazaAssetPart[]) {
  const box = new Box3();
  parts.forEach(({ geometry }) => box.union(geometry.boundingBox!));
  return box;
}

describe("fantasy plaza assets", () => {
  it.each(kinds)("%s emits finite, renderable geometry with valid bounds and normals", (kind) => {
    const parts = createFantasyPlazaAsset(kind);
    expect(parts.length).toBeGreaterThan(0);
    const materialKeys = new Set<string>();
    for (const { geometry, color, material } of parts) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(materialKeys.has(`${material}:${color}`)).toBe(false);
      materialKeys.add(`${material}:${color}`);
      const positions = geometry.getAttribute("position");
      const normals = geometry.getAttribute("normal");
      expect(positions.count).toBeGreaterThan(2);
      expect(normals.count).toBe(positions.count);
      expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
      expect(Array.from(normals.array).every(Number.isFinite)).toBe(true);
      let shortestNormal = Infinity;
      let longestNormal = 0;
      for (let i = 0; i < normals.count; i += 1) {
        const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        shortestNormal = Math.min(shortestNormal, length);
        longestNormal = Math.max(longestNormal, length);
      }
      expect(shortestNormal).toBeGreaterThan(0.95);
      expect(longestNormal).toBeLessThan(1.05);
      const index = geometry.getIndex();
      expect((index?.count ?? positions.count) % 3).toBe(0);
      if (index) {
        expect(Array.from(index.array).every((value) => value >= 0 && value < positions.count)).toBe(true);
      }
      expect(geometry.boundingBox?.isEmpty()).toBe(false);
      expect(geometry.boundingSphere?.radius).toBeGreaterThan(0);
    }
    dispose(parts);
  });

  it.each(kinds)("%s is deterministic but gives the caller independent buffers", (kind) => {
    const first = createFantasyPlazaAsset(kind);
    const second = createFantasyPlazaAsset(kind);
    expect(first.length).toBe(second.length);
    first.forEach((part, index) => {
      const other = second[index];
      expect(part.color).toBe(other.color);
      expect(part.material).toBe(other.material);
      // Vitest's negated toBe still probes deep equality for diagnostics on large buffers.
      expect(part.geometry === other.geometry).toBe(false);
      const positions = part.geometry.getAttribute("position");
      const otherPositions = other.geometry.getAttribute("position");
      expect(positions.array === otherPositions.array).toBe(false);
      expect(positions.array.length).toBe(otherPositions.array.length);
      // Deep matchers make the large roof buffers time out under concurrent test load.
      expect(positions.array.every((value, offset) => Object.is(value, otherPositions.array[offset]))).toBe(true);
    });
    first[0].geometry.translate(100, 0, 0);
    expect(bounds(second).max.x).toBeLessThan(10);
    dispose(first);
    dispose(second);
  });

  it.each([
    ["fountain", 3.44, 2.1, 3.44],
    ["bench", 2.2, 0.9, 0.9],
    ["pillar", 1.1, 3.6, 1.1],
    ["signpost", 0.9, 2.2, 0.9],
    ["lantern", 0.6, 1.35, 0.6],
    ["rock", 1.05, 0.75, 1.05],
    ["flowers", 1.1, 0.5, 1.1],
    ["pavilion", 6.2, 6.2, 5.2]
  ] as const)("%s fits its placement envelope", (kind, width, height, depth) => {
    const parts = createFantasyPlazaAsset(kind);
    const box = bounds(parts);
    const size = box.getSize(new Vector3());
    expect(box.min.y).toBeGreaterThanOrEqual(-0.001);
    expect(box.max.y).toBeLessThanOrEqual(height + 0.001);
    expect(size.x).toBeLessThanOrEqual(width + 0.001);
    expect(size.z).toBeLessThanOrEqual(depth + 0.001);
    expect(size.y).toBeGreaterThan(height * 0.5);
    dispose(parts);
  });

  it.each(["tree", "blossom"] as const)("%s keeps foliage above the player's path", (kind) => {
    const parts = createFantasyPlazaAsset(kind);
    const box = bounds(parts);
    expect(box.min.y).toBeGreaterThanOrEqual(-0.001);
    expect(box.max.y).toBeLessThanOrEqual(5.5);
    let maxRadius = 0;
    let trunkRadius = 0;
    let foliageFloor = Infinity;
    for (const { geometry, material } of parts) {
      const positions = geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i += 1) {
        const radius = Math.hypot(positions.getX(i), positions.getZ(i));
        maxRadius = Math.max(maxRadius, radius);
        if (material === "foliage") foliageFloor = Math.min(foliageFloor, positions.getY(i));
        if (positions.getY(i) < 1.8) trunkRadius = Math.max(trunkRadius, radius);
      }
    }
    expect(maxRadius).toBeLessThanOrEqual(2.4);
    expect(foliageFloor).toBeGreaterThan(2.2);
    expect(trunkRadius).toBeLessThanOrEqual(0.5);
    dispose(parts);
  });

  it("keeps the gate passage and the low pillar geometry inside existing colliders", () => {
    const parts = createFantasyPlazaAsset("gate");
    for (const { geometry } of parts) {
      const positions = geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        if (y < 3.3) {
          expect(Math.abs(x)).toBeGreaterThanOrEqual(1.35 - 0.001);
          expect(Math.abs(x)).toBeLessThanOrEqual(2.25 + 0.001);
          expect(Math.abs(z)).toBeLessThanOrEqual(0.45 + 0.001);
        }
      }
    }
    dispose(parts);
  });

  it("keeps the complete unique kit below 40000 triangles", () => {
    let triangles = 0;
    for (const kind of kinds) {
      const parts = createFantasyPlazaAsset(kind);
      triangles += parts.reduce((sum, { geometry }) =>
        sum + (geometry.getIndex()?.count ?? geometry.getAttribute("position").count) / 3, 0);
      dispose(parts);
    }
    expect(triangles).toBeLessThan(40_000);
  });

  it("gives the pavilion roof an opaque underside from the walkable floor", () => {
    const parts = createFantasyPlazaAsset("pavilion");
    const material = new MeshBasicMaterial();
    const ray = new Raycaster(new Vector3(0.17, 3, 0.83), new Vector3(0, 1, 0), 0, 3);
    const hits = parts.flatMap(({ geometry }) => ray.intersectObject(new Mesh(geometry, material)));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some(({ point }) => point.y > 4.27 && point.y < 5.5)).toBe(true);
    material.dispose();
    dispose(parts);
  });
});
