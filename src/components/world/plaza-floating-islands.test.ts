import { describe, expect, it, vi } from "vitest";
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from "three";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import manifest from "../../../public/world/floating-islands/manifest.json";
import { createFloatingIsland, FLOATING_ISLAND_PLACEMENTS } from "./plaza-floating-islands";

describe("Plaza floating scenery", () => {
  it("recedes through near, middle and far layers, with the three-tier island below Plaza", () => {
    const find = (id: string) => FLOATING_ISLAND_PLACEMENTS.find(p => p.id === id)!;
    const distance = (id: string) => {
      const p = find(id).position;
      return Math.hypot(p[0], p[2] - 5.8);
    };
    expect(distance("thien-vien")).toBeGreaterThan(distance("thac-tang") * 1.8);
    expect(distance("song-dinh")).toBeGreaterThan(distance("nguyet-ho") * 2.3);
    for (const id of ["tan-may", "phong-dang"]) {
      expect(distance(id)).toBeLessThan(65);
      expect(distance(id)).toBeLessThan(distance("thac-tang") * .6);
    }
    expect(FLOATING_ISLAND_PLACEMENTS.every(p => p.position[2] < -24)).toBe(true);
    const tiers = find("thac-tang");
    const terrainTop = manifest.models.find(m => m.id === tiers.id)!.mainBoundsBlender[1][2];
    expect(tiers.position[1] + terrainTop * tiers.scale).toBeLessThan(0);
    expect(find("thien-vien").position[1] - tiers.position[1]).toBeGreaterThan(30);
  });

  it("uses each approved model once, unchanged", () => {
    expect(FLOATING_ISLAND_PLACEMENTS.map(p => p.id).sort()).toEqual(
      ["mach-nguon", ...manifest.models.map(m => m.id)].sort()
    );
    for (const placement of FLOATING_ISLAND_PLACEMENTS) {
      const expectedHash = manifest.models.find(m => m.id === placement.id)?.sha256
        ?? "7eb017b13db5ca909670d57f046db55a8994680c1c32682d0f29118710d2274b";
      expect(createHash("sha256").update(readFileSync(`public${placement.url}`)).digest("hex")).toBe(expectedHash);
    }
  });

  it("keeps full rotated bounds clear of Plaza with irregular height and near/far depth", () => {
    const worldBounds: Box3[] = [];
    for (const placement of FLOATING_ISLAND_PLACEMENTS) {
      const source = new Group();
      const model = manifest.models.find(m => m.id === placement.id);
      const b = model?.boundsBlender;
      const min = b ? new Vector3(b[0][0], b[0][2], -b[1][1]) : new Vector3(-26.776, -27.594, -12.68);
      const max = b ? new Vector3(b[1][0], b[1][2], -b[0][1]) : new Vector3(23.942, 14.86, 16.495);
      const geo = new BoxGeometry(...max.clone().sub(min).toArray());
      geo.translate(...max.clone().add(min).multiplyScalar(.5).toArray());
      source.add(new Mesh(geo, new MeshStandardMaterial()));
      const result = createFloatingIsland(source, placement);
      const bounds = new Box3().setFromObject(result.root);
      expect(bounds.max.z < -25 || bounds.min.z > 25 || bounds.min.x > 29 || bounds.max.x < -29).toBe(true);
      expect(worldBounds.every(other => !other.intersectsBox(bounds))).toBe(true);
      // Include every bounds corner plus the walkable radius and maximum camera orbit.
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        expect(Math.hypot(x, y, z) + Math.hypot(28, 24) + 20.5).toBeLessThan(420);
      }
      worldBounds.push(bounds);
      result.dispose();
    }
    expect(new Set(FLOATING_ISLAND_PLACEMENTS.map(p => p.position[1])).size).toBeGreaterThan(4);
    const distances = FLOATING_ISLAND_PLACEMENTS.map(p => Math.hypot(p.position[0], p.position[2] - 5.8));
    expect(Math.max(...distances) / Math.min(...distances)).toBeGreaterThan(1.35);
  });

  it("bakes source transforms, retains UV/color, shares batches and releases owned resources once", () => {
    const source = new Group(), geo = new BoxGeometry(), texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture });
    const a = new Mesh(geo, material), b = new Mesh(geo, material);
    a.position.x = 2; b.position.x = -2; source.add(a, b);
    const releaseGeo = vi.spyOn(geo, "dispose"), releaseMat = vi.spyOn(material, "dispose"), releaseTex = vi.spyOn(texture, "dispose");
    const result = createFloatingIsland(source, FLOATING_ISLAND_PLACEMENTS[0]);
    const near = result.root.children[0] as Mesh;
    expect(result.root.children.filter(child => child instanceof Mesh)).toHaveLength(1);
    expect(near.material).toBe(material);
    expect(near.geometry.getAttribute("uv").count).toBe(geo.getAttribute("uv").count * 2);
    near.geometry.computeBoundingBox();
    expect(near.geometry.boundingBox?.min.x).toBe(-2.5);
    expect(near.geometry.boundingBox?.max.x).toBe(2.5);
    expect(a.position.x).toBe(2);
    const releaseBatch = vi.spyOn(near.geometry, "dispose");
    result.dispose(); result.dispose();
    expect(releaseGeo).toHaveBeenCalledTimes(1);
    expect(releaseBatch).toHaveBeenCalledTimes(1);
    expect(releaseMat).toHaveBeenCalledTimes(1);
    expect(releaseTex).toHaveBeenCalledTimes(1);
  });
});
