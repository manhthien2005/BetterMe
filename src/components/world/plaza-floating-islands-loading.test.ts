import { describe, expect, it, vi } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { loadFloatingIslands, FLOATING_ISLAND_PLACEMENTS } from "./plaza-floating-islands";

function pendingLoads() {
  const requests: { resolve: (gltf: GLTF) => void; reject: (error: Error) => void }[] = [];
  vi.spyOn(GLTFLoader.prototype, "loadAsync").mockImplementation(() => new Promise<GLTF>((resolve, reject) => requests.push({ resolve, reject })));
  return requests;
}
function fixture() {
  const scene = new Group(), geometry = new BoxGeometry(), material = new MeshStandardMaterial();
  scene.add(new Mesh(geometry, material));
  return { gltf: { scene } as GLTF, release: vi.spyOn(geometry, "dispose") };
}

async function drain(requests: ReturnType<typeof pendingLoads>, offset = 0) {
  const sources = [];
  for (let i = 0; i < FLOATING_ISLAND_PLACEMENTS.length; i++) {
    await vi.waitFor(() => expect(requests.length).toBeGreaterThan(offset + i));
    const source = fixture(); sources.push(source);
    requests[offset + i].resolve(source.gltf);
  }
  return sources;
}

describe("independent Plaza island loading", () => {
  it("keeps successful scenery when one asset fails, then disposes it once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const requests = pendingLoads(), parent = new Group();
    const decoder = vi.spyOn(GLTFLoader.prototype, "setMeshoptDecoder");
    const owned = loadFloatingIslands(parent);
    expect(requests).toHaveLength(2);
    expect(decoder).toHaveBeenCalledWith(MeshoptDecoder);
    requests[0].reject(new Error("unavailable"));
    const sources = [];
    for (let i = 1; i < FLOATING_ISLAND_PLACEMENTS.length; i++) {
      await vi.waitFor(() => expect(requests.length).toBeGreaterThan(i));
      const source = fixture(); sources.push(source); requests[i].resolve(source.gltf);
    }
    await owned.settled;
    expect(parent.userData.assetStatus).toBe("partial");
    expect(parent.children).toHaveLength(6);
    expect(owned.islands).toHaveLength(6);
    owned.dispose(); owned.dispose();
    expect(parent.children).toHaveLength(0);
    sources.forEach(source => expect(source.release).toHaveBeenCalledTimes(1));
    warn.mockRestore(); vi.restoreAllMocks();
  });

  it("releases late sources after unmount without attaching to a newer mount", async () => {
    const requests = pendingLoads(), parent = new Group();
    const previous = loadFloatingIslands(parent);
    previous.dispose();
    const current = loadFloatingIslands(parent);
    expect(requests).toHaveLength(4);
    const late = requests.slice(0, 2).map(() => fixture());
    requests.slice(0, 2).forEach((request, i) => request.resolve(late[i].gltf));
    await previous.settled;
    expect(parent.children).toHaveLength(0);
    expect(parent.userData.assetStatus).toBe("loading");
    late.forEach(source => expect(source.release).toHaveBeenCalledTimes(1));
    await drain(requests, 2);
    await current.settled;
    expect(parent.userData.assetStatus).toBe("ready");
    expect(parent.children).toHaveLength(7);
    current.dispose(); vi.restoreAllMocks();
  });
});
