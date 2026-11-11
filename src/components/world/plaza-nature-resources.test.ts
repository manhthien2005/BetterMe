import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { createNatureInstances, disposeNatureResources } from "./plaza-nature-resources";

describe("Plaza owned model resources", () => {
  it("shares UV geometry/material across placements without mutating the source", () => {
    const scene = new Group();
    const geo = new BoxGeometry(), material = new MeshStandardMaterial({ map: new Texture() });
    scene.add(new Mesh(geo, material));
    const group = createNatureInstances(scene, [{ id: "a", model: "fern_02", variant: 0, position: [2, 0, 3], scale: [1, 2, 1], yaw: 1 }]);
    const mesh = group.children[0] as Mesh;
    expect(mesh.geometry).toBe(geo);
    expect(mesh.material).toBe(material);
    expect(mesh.geometry.getAttribute("uv")).toBeDefined();
    expect(scene.children[0].position.toArray()).toEqual([0, 0, 0]);
    disposeNatureResources(group);
  });
  it("disposes shared geometry, material and textures once per ownership scope", () => {
    const root = new Group(), geo = new BoxGeometry(), texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture, roughnessMap: texture });
    root.add(new Mesh(geo, material), new Mesh(geo, material));
    const g = vi.spyOn(geo, "dispose"), m = vi.spyOn(material, "dispose"), t = vi.spyOn(texture, "dispose");
    disposeNatureResources(root);
    expect(g).toHaveBeenCalledTimes(1); expect(m).toHaveBeenCalledTimes(1); expect(t).toHaveBeenCalledTimes(1);
  });
});
