import {
  BoxGeometry, BufferGeometry, Color, Float32BufferAttribute,
  RingGeometry, CircleGeometry
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { createFantasyPlazaAsset, type PlazaAssetKind, type PlazaAssetPart } from "./fantasy-plaza-assets";
import { PLAZA_GARDEN_ASSETS } from "@/lib/world/plaza-landscape-layout";
import { PLAZA_RIM_LANTERNS } from "@/lib/world/plaza-nature-layout";
import type { Vec3Tuple } from "@/lib/world/types";

type Surface = PlazaAssetPart["material"];
export type LandscapeBatch = { geometry: BufferGeometry; material: Surface };

/** Merges the static kit by surface, retaining each part's authored color. */
export function createPlazaLandscapeGeometry(): LandscapeBatch[] {
  const batches = new Map<Surface, BufferGeometry[]>();
  const kit = new Map<PlazaAssetKind, PlazaAssetPart[]>();

  function add(source: BufferGeometry, material: Surface, hex: string) {
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    geometry.deleteAttribute("uv");
    const position = geometry.getAttribute("position");
    const tint = new Color(hex);
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const variation = 0.94 + Math.sin(position.getX(i) * 2.3 + position.getY(i) * 3.7 + position.getZ(i) * 1.8) * 0.06;
      colors.set([tint.r * variation, tint.g * variation, tint.b * variation], i * 3);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const list = batches.get(material) ?? [];
    list.push(geometry);
    batches.set(material, list);
  }

  function asset(kind: PlazaAssetKind, position: Vec3Tuple, scale: Vec3Tuple = [1, 1, 1], yaw = 0) {
    if (!kit.has(kind)) kit.set(kind, createFantasyPlazaAsset(kind));
    for (const part of kit.get(kind)!) {
      add(part.geometry.clone().scale(...scale).rotateY(yaw).translate(...position), part.material, part.color);
    }
  }

  // UV-preserving paving and natural ground are rendered by PlazaTexturedGround.
  add(new RingGeometry(1.72, 2.65, 64).rotateX(-Math.PI / 2).translate(0, 0.012, 0), "stone", "#b6b7aa");
  for (const radius of [2.55, 2.7]) {
    add(new RingGeometry(radius, radius + 0.035, 64).rotateX(-Math.PI / 2).translate(0, 0.018, 0), "metal", "#a79970");
  }

  asset("fountain", [0, 0, 0]);
  asset("signpost", [5, 0, 3.2]);
  asset("bench", [-6.2, 0, 8.2]);
  asset("bench", [6.2, 0, 8.2]);
  asset("pillar", [-6.2, 0, -5.8]);
  asset("pillar", [6.2, 0, -5.8]);
  asset("gate", [0, 0, -9.8]);

  for (const item of PLAZA_GARDEN_ASSETS) {
    if (item.kind === "planter") {
      const [x, , z] = item.position;
      add(new BoxGeometry(2.04, 0.38, 1.34).translate(x, 0.19, z), "stone", "#aaa995");
      add(new BoxGeometry(2.08, 0.1, 1.38).translate(x, 0.43, z), "stone", "#d9d2bb");
      add(new BoxGeometry(1.82, 0.04, 1.12).translate(x, 0.49, z), "foliage", "#45533c");
      for (const offset of [-0.45, 0.45]) asset("flowers", [x + offset, 0.5, z]);
    } else if (item.kind !== "tree") {
      asset(item.blossom ? "blossom" : item.kind, item.position, [item.scale, item.scale, item.scale], item.rotation);
    }
  }

  // Sink the stepped plinth so its top is flush with flat Y=0 physics.
  asset("pavilion", [-20, -0.6272, -6.3], [1.12, 1.12, 1.12], Math.PI / 2);
  add(new RingGeometry(2.05, 2.3, 48).rotateX(-Math.PI / 2).translate(18, .035, -3), "stone", "#a8b39a");
  add(new CircleGeometry(2.04, 48).rotateX(-Math.PI / 2).translate(18, .025, -3), "water", "#597f78");
  for (const position of PLAZA_RIM_LANTERNS) asset("lantern", position);
  for (const [x, z] of [[-18.4, 9], [18.5, 10], [-7.2, -16.5], [7.2, -16.5], [-2.5, 15.8], [2.8, 15.8]]) asset("flowers", [x, .03, z], [1.2, 1.2, 1.2], x);

  for (const parts of kit.values()) parts.forEach(({ geometry }) => geometry.dispose());
  return Array.from(batches, ([material, geometries]) => {
    const geometry = mergeGeometries(geometries, false)!;
    geometries.forEach((part) => part.dispose());
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { material, geometry };
  });
}
