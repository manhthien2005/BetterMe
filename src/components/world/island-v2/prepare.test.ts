import { afterEach, describe, expect, it, vi } from "vitest";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Object3D, PointLight, ShaderMaterial, Texture, Vector3 } from "three";
import { prepareIslandV2 } from "./prepare";

function triangle() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([2, 2, 4, 3, 0, 4, 2, 0, 5], 3));
  geometry.setAttribute("normal", new Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
  geometry.setAttribute("uv", new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 2));
  geometry.setAttribute("color", new Float32BufferAttribute([.1, .2, .3, .2, .3, .4, .3, .4, .5], 3));
  return geometry;
}

function placed() {
  const source = new Group();
  source.position.set(10, 4, -5);
  source.scale.setScalar(.5);
  source.rotation.y = Math.PI / 2;
  return source;
}

function anchor(kind: string) {
  const node = new Object3D();
  node.position.set(2, 3, 4);
  node.userData.effectKind = kind;
  return node;
}

afterEach(() => vi.restoreAllMocks());

describe("approved V2 island adapter", () => {
  it("bakes placement while preserving authored normals and vertex colors", () => {
    const source = placed(), material = new MeshStandardMaterial({ vertexColors: true });
    source.add(new Mesh(triangle(), material));
    const island = prepareIslandV2(source);
    const mesh = island.root.children.find(child => child instanceof Mesh) as Mesh;
    expect(new Vector3().fromBufferAttribute(mesh.geometry.getAttribute("position"), 0).toArray()).toEqual([12, 5, -6]);
    const normal = new Vector3().fromBufferAttribute(mesh.geometry.getAttribute("normal"), 0);
    expect(normal.x).toBeCloseTo(0); expect(normal.z).toBeCloseTo(-1);
    expect(mesh.geometry.getAttribute("color").getX(0)).toBeCloseTo(.1);
    expect(mesh.castShadow).toBe(false);
    expect(island.root.position.toArray()).toEqual([0, 0, 0]);
    island.dispose();
  });

  it("normalizes fall UVs and keeps each pool's transformed elevation and landing", () => {
    const source = placed(), material = new MeshStandardMaterial();
    for (const [land, y] of [["upper", 2], ["lower", -6]] as const) {
      const geometry = triangle();
      for (let i = 0; i < 3; i++) geometry.attributes.position.setY(i, y);
      const pool = new Mesh(geometry, material);
      pool.userData = { waterKind: "pool", landName: land };
      source.add(pool);
    }
    const fall = new Mesh(triangle(), material);
    fall.userData = { waterKind: "fall", landName: "upper", flowUvConvention: "lip 0, end 1", fallTermination: "pool" };
    source.add(fall);
    const shared: Mesh[] = [], island = prepareIslandV2(source, shared);
    const pools = shared.filter(mesh => mesh.userData.waterKind === "pool");
    expect(pools.map(pool => pool.userData.waterLevel)).toEqual([5, 1]);
    const preparedFall = shared.find(mesh => mesh.userData.waterKind === "fall")!;
    expect(preparedFall.geometry.attributes.uv.getY(0)).toBe(1);
    expect(preparedFall.geometry.attributes.uv.getY(1)).toBe(0);
    expect((preparedFall.material as ShaderMaterial).uniforms.poolLanding.value).toBe(1);
    expect(island.waters).toHaveLength(2);
    island.dispose(); expect(shared).toHaveLength(0);
  });

  it("keeps outward winding when a placement mirrors its source mesh", () => {
    const source = new Group(), geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    geometry.computeVertexNormals();
    source.scale.x = -1;
    source.add(new Mesh(geometry, new MeshStandardMaterial()));
    const island = prepareIslandV2(source), baked = (island.root.children[0] as Mesh).geometry;
    const vertices = [0, 1, 2].map(index => new Vector3().fromBufferAttribute(baked.attributes.position, baked.index!.getX(index)));
    const outward = vertices[1].sub(vertices[0]).cross(vertices[2].sub(vertices[0])).normalize();
    expect(outward.dot(new Vector3().fromBufferAttribute(baked.attributes.normal, 0))).toBeCloseTo(1);
    island.dispose();
  });

  it("keeps inverted grass wind UVs and two-sided volume normals on matte leaves", () => {
    const source = new Group(), material = new MeshStandardMaterial({ roughness: .2, metalness: .3, side: DoubleSide });
    material.name = "folded broad leaves";
    source.add(new Mesh(triangle(), material));
    const island = prepareIslandV2(source);
    const mesh = island.root.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
    expect(mesh.material.roughness).toBe(1); expect(mesh.material.metalness).toBe(0);
    expect(mesh.material.side).toBe(DoubleSide);
    expect(mesh.geometry.attributes.uv.getY(0)).toBe(0);
    expect(mesh.geometry.attributes.uv.getY(1)).toBe(1);
    const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>", fragmentShader: "#include <normal_fragment_begin>\n#include <lights_fragment_end>" } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
    mesh.material.onBeforeCompile(shader, {} as Parameters<MeshStandardMaterial["onBeforeCompile"]>[1]);
    expect(shader.uniforms.studyTime).toBe(island.clock);
    expect(shader.uniforms.studyDaylight).toBe(island.daylight);
    expect(shader.fragmentShader).toContain("normal *= faceDirection");
    island.dispose();
  });

  it("places scaled lamps and spray at their baked anchors and toggles night", () => {
    const source = placed(), lamp = anchor("lantern"), spray = anchor("waterfall-spray"), impact = anchor("waterfall-impact");
    lamp.scale.setScalar(.5);
    spray.userData.sprayLength = 12; spray.userData.fallWidth = 2.2;
    impact.userData.impactRadius = 2;
    source.add(lamp, spray, impact);
    const island = prepareIslandV2(source);
    const lights: PointLight[] = [];
    island.root.traverse(node => { if (node instanceof PointLight) lights.push(node); });
    expect(lights[0].position.toArray()).toEqual([12, 5.5, -6]);
    expect(lights[0].distance).toBeCloseTo(5.5);
    expect(lights[0].intensity).toBe(0);
    expect(lights[0].visible).toBe(false);
    island.effects.setNight(true);
    expect(lights[0].intensity).toBeCloseTo(26 * .25 ** 2);
    expect(lights[0].visible).toBe(true);
    expect(island.effects.state.systems.some(system => system.firefliesVisible)).toBe(true);
    const mist = island.root.getObjectByName("V17 waterfall drifting spray")!;
    expect(mist.position.toArray()).toEqual([12, 5.5, -6]);
    expect(mist.scale.toArray()).toEqual([.5, .75, .5]);
    expect(mist.quaternion.y).toBeCloseTo(Math.SQRT1_2);
    expect(island.effects.state.impacts).toBe(1);
    island.effects.setNight(false);
    expect(lights[0].intensity).toBe(0);
    expect(lights[0].visible).toBe(false);
    island.dispose(); island.dispose();
    expect(island.effects.state.systems.every(system => system.disposed)).toBe(true);
  });

  it("releases shared source resources once and retains textures until owner disposal", () => {
    const source = new Group(), geometry = triangle(), material = new MeshStandardMaterial(), texture = new Texture();
    material.map = texture;
    source.add(new Mesh(geometry, material), new Mesh(geometry, material));
    const geometryDispose = vi.spyOn(geometry, "dispose"), materialDispose = vi.spyOn(material, "dispose"), textureDispose = vi.spyOn(texture, "dispose");
    const island = prepareIslandV2(source);
    expect(geometryDispose).toHaveBeenCalledTimes(1); expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(textureDispose).not.toHaveBeenCalled();
    const mesh = island.root.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
    expect(mesh.material.map).toBe(texture);
    const generatedDispose = vi.spyOn(mesh.geometry, "dispose");
    island.dispose(); island.dispose();
    expect(textureDispose).toHaveBeenCalledTimes(1); expect(generatedDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
  });

  it("consumes pending source resources even when preparation fails midway", () => {
    const source = new Group(), good = triangle(), bad = triangle(), material = new MeshStandardMaterial(), texture = new Texture();
    material.map = texture;
    source.add(new Mesh(good, material), new Mesh(bad, material));
    const goodDispose = vi.spyOn(good, "dispose"), badDispose = vi.spyOn(bad, "dispose"), materialDispose = vi.spyOn(material, "dispose"), textureDispose = vi.spyOn(texture, "dispose");
    const part = triangle(), partDispose = vi.spyOn(part, "dispose");
    vi.spyOn(good, "clone").mockReturnValue(part);
    vi.spyOn(bad, "clone").mockImplementation(() => { throw new Error("invalid asset"); });
    expect(() => prepareIslandV2(source)).toThrow("invalid asset");
    for (const dispose of [goodDispose, badDispose, materialDispose, textureDispose, partDispose]) expect(dispose).toHaveBeenCalledTimes(1);
  });
});
