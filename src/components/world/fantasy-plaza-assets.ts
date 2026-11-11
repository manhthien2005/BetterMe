import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  OctahedronGeometry,
  Quaternion,
  Shape,
  Vector2,
  Vector3
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type PlazaAssetKind =
  | "fountain" | "tree" | "blossom" | "bench" | "pillar" | "signpost"
  | "lantern" | "rock" | "flowers" | "pavilion" | "gate";

export type PlazaAssetPart = {
  geometry: BufferGeometry;
  color: string;
  material: "stone" | "wood" | "foliage" | "metal" | "water" | "glow" | "cloth";
};

type Point = readonly [number, number, number];
type Material = PlazaAssetPart["material"];

const palette = {
  stone: "#d7d0b9",
  stoneLight: "#e8dfca",
  stoneShade: "#a7a596",
  rock: "#899185",
  rockLight: "#a5ad9a",
  wood: "#75543c",
  woodLight: "#9d7750",
  roof: "#455b72",
  roofEdge: "#718398",
  gold: "#bba16b",
  pine: "#53734f",
  pineLight: "#7b9462",
  pineDark: "#3d5c47",
  pink: "#e5a8c1",
  pinkLight: "#f3c5d0",
  lilac: "#a99bc9",
  water: "#5cb7ba",
  foam: "#b9dfe0",
  glow: "#ffe2a4",
  cloth: "#e1d9c0",
  purple: "#78668f"
};

class AssetBuilder {
  private batches = new Map<string, { color: string; material: Material; geometries: BufferGeometry[] }>();

  add(geometry: BufferGeometry, material: Material, color: string) {
    // Every batch has the same attributes; unindexed parts may have sharp carved edges.
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    part.deleteAttribute("uv");
    if (!part.getAttribute("normal")) part.computeVertexNormals();
    const key = `${material}:${color}`;
    const batch = this.batches.get(key) ?? { color, material, geometries: [] };
    batch.geometries.push(part);
    this.batches.set(key, batch);
  }

  finish(): PlazaAssetPart[] {
    return Array.from(this.batches.values(), ({ color, material, geometries }) => {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach((part) => part.dispose());
      if (!geometry) throw new Error("Incompatible plaza geometry attributes");
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      return { geometry, material, color };
    });
  }
}

function box(size: Point, center: Point) {
  return new BoxGeometry(...size).translate(...center);
}

function profile(points: readonly (readonly [number, number])[], sides = 16) {
  return new LatheGeometry(points.map(([radius, y]) => new Vector2(radius, y)), sides);
}

function beam(start: Point, end: Point, bottom: number, top = bottom, sides = 8) {
  const from = new Vector3(...start);
  const to = new Vector3(...end);
  const direction = to.clone().sub(from);
  return new CylinderGeometry(top, bottom, direction.length(), sides)
    .applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()))
    .translate(...from.add(to).multiplyScalar(0.5).toArray());
}

function meshFromFaces(vertices: number[], faces: number[], smooth = false) {
  const indexed = new BufferGeometry();
  indexed.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  indexed.setIndex(faces);
  if (smooth) {
    indexed.computeVertexNormals();
    return indexed;
  }
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}

function carvedPanel(points: readonly (readonly [number, number])[], depth: number) {
  const shape = new Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 1 })
    .translate(0, 0, -depth / 2);
}

/** A wind-shaped, scalloped foliage shelf, with a lifted crown and a thin irregular edge. */
function foliageShelf(center: Point, radiusX: number, height: number, radiusZ: number, seed: number) {
  const sides = 15;
  const vertices = [center[0] - radiusX * 0.12, center[1] + height, center[2]];
  for (let i = 0; i < sides; i += 1) {
    const angle = i / sides * Math.PI * 2;
    const scallop = 0.85 + 0.11 * Math.sin(i * 2.7 + seed) + 0.04 * Math.cos(i * 4.1);
    vertices.push(
      center[0] + Math.cos(angle) * radiusX * scallop,
      center[1] + height * (0.1 + 0.17 * Math.sin(i * 1.9 + seed)),
      center[2] + Math.sin(angle) * radiusZ * scallop
    );
  }
  const bottom = vertices.length / 3;
  vertices.push(center[0], center[1] - height * 0.35, center[2]);
  const faces: number[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = i + 1;
    const b = (i + 1) % sides + 1;
    faces.push(0, b, a, bottom, a, b);
  }
  return meshFromFaces(vertices, faces, true);
}

function rockGeometry(center: Point, size: Point, seed: number) {
  const vertices: number[] = [];
  const sides = 7;
  const layers = [0, 0.22, 0.78, 1];
  layers.forEach((layer, row) => {
    for (let i = 0; i < sides; i += 1) {
      const angle = i / sides * Math.PI * 2;
      const radius = [0.62, 1, 0.84, 0.4][row] * (0.88 + 0.1 * Math.sin(i * 2.8 + seed));
      vertices.push(
        center[0] + size[0] * (Math.cos(angle) * radius * 0.5 + layer * 0.07),
        center[1] + size[1] * layer,
        center[2] + size[2] * (Math.sin(angle) * radius * 0.5 - layer * 0.05)
      );
    }
  });
  const faces: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let i = 0; i < sides; i += 1) {
      const a = row * sides + i;
      const b = row * sides + (i + 1) % sides;
      faces.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  for (let i = 1; i < sides - 1; i += 1) {
    faces.push(0, i, i + 1, 21, 21 + i + 1, 21 + i);
  }
  return meshFromFaces(vertices, faces);
}

function blossomSpray(builder: AssetBuilder, center: Point, scale: number, color: string) {
  for (let i = 0; i < 5; i += 1) {
    const angle = i / 5 * Math.PI * 2;
    const petal = new OctahedronGeometry(1, 0)
      .scale(scale * 0.43, scale * 0.13, scale * 0.72)
      .translate(0, scale * 0.04, scale * 0.48)
      .rotateY(angle)
      .translate(...center);
    builder.add(petal, "foliage", color);
  }
  builder.add(new OctahedronGeometry(scale * 0.19).translate(...center), "foliage", palette.gold);
}

function addFountain(builder: AssetBuilder) {
  builder.add(profile([
    [0, 0], [1.62, 0], [1.7, 0.09], [1.7, 0.14], [1.57, 0.2],
    [1.51, 0.38], [1.57, 0.51], [1.65, 0.54], [1.65, 0.64],
    [1.43, 0.64], [1.39, 0.56], [1.39, 0.28], [0, 0.28]
  ], 12), "stone", palette.stone);
  builder.add(profile([[1.57, 0.2], [1.59, 0.22], [1.59, 0.27], [1.55, 0.29]], 12), "stone", palette.stoneShade);
  builder.add(new CylinderGeometry(1.4, 1.4, 0.035, 48).translate(0, 0.49, 0), "water", palette.water);
  const rocks: { center: Point; size: Point }[] = [
    { center: [-0.37, 0.43, -0.12], size: [1.06, 0.83, 0.9] },
    { center: [0.35, 0.43, -0.21], size: [0.93, 1.05, 0.88] },
    { center: [0.07, 1.06, -0.28], size: [0.89, 0.56, 0.6] },
    { center: [0.51, 0.43, 0.42], size: [0.7, 0.43, 0.65] },
    { center: [-0.59, 0.43, 0.45], size: [0.53, 0.38, 0.55] }
  ];
  rocks.forEach(({ center, size }, i) => builder.add(rockGeometry(center, size, i + 1), "stone", i % 2 ? palette.rock : palette.rockLight));
  for (const x of [-0.16, 0.09, 0.29]) {
    builder.add(beam([x, 1.34, 0.12], [x + 0.03, 0.52, 0.48], 0.025, 0.04, 5), "water", palette.foam);
  }
  for (let i = 0; i < 12; i += 1) {
    const angle = (i + 0.5) / 12 * Math.PI * 2;
    const relief = new OctahedronGeometry(1).scale(0.09, 0.13, 0.025)
      .translate(0, 0.39, 1.51).rotateY(angle);
    builder.add(relief, "metal", palette.gold);
  }
  builder.add(foliageShelf([-0.42, 1.58, -0.3], 0.49, 0.13, 0.3, 3), "foliage", palette.pine);
  builder.add(beam([-0.18, 1.46, -0.26], [-0.48, 1.71, -0.24], 0.05, 0.02), "wood", palette.wood);
}

function addTree(builder: AssetBuilder, pink: boolean) {
  const trunk: Point[] = [[0, 0.03, 0], [-0.08, 1.1, 0.02], [0.04, 2.1, -0.05], [0.37, 3, -0.04], [0.17, 3.85, 0.06], [0.45, 4.72, 0]];
  for (let i = 0; i < trunk.length - 1; i += 1) {
    builder.add(beam(trunk[i], trunk[i + 1], 0.2 - i * 0.03, 0.17 - i * 0.03, 7), "wood", palette.wood);
  }
  for (let i = 0; i < 5; i += 1) {
    const angle = i / 5 * Math.PI * 2;
    builder.add(beam([Math.cos(angle) * 0.4, 0.055, Math.sin(angle) * 0.4], [0, 0.48, 0], 0.06, 0.1, 5), "wood", palette.wood);
  }
  const branches: { from: Point; elbow: Point; end: Point; radius: number }[] = [
    { from: trunk[2], elbow: [-0.65, 2.8, 0.12], end: [-1.28, 3.05, 0.34], radius: 0.88 },
    { from: trunk[3], elbow: [0.96, 3.16, 0.34], end: [1.35, 3.43, 0.48], radius: 0.8 },
    { from: trunk[3], elbow: [0.15, 3.34, -0.81], end: [-0.18, 3.56, -1.14], radius: 0.83 },
    { from: trunk[4], elbow: [-0.6, 3.95, 0.24], end: [-0.96, 4.18, 0.56], radius: 0.8 },
    { from: trunk[4], elbow: [0.85, 4.1, -0.12], end: [1.13, 4.38, -0.36], radius: 0.72 },
    { from: trunk[5], elbow: [0.32, 4.75, 0.15], end: [0.38, 4.94, 0.1], radius: 0.85 }
  ];
  branches.forEach(({ from, elbow, end, radius }, i) => {
    builder.add(beam(from, elbow, 0.12, 0.075, 6), "wood", palette.wood);
    builder.add(beam(elbow, end, 0.075, 0.028, 6), "wood", palette.woodLight);
    for (let j = 0; j < 7; j += 1) {
      const angle = j * 2.399 + i;
      const distance = j === 0 ? 0 : radius * 0.45;
      const center: Point = [end[0] + Math.cos(angle) * distance, end[1] + (j % 3) * 0.09, end[2] + Math.sin(angle) * distance * 0.7];
      const color = pink ? (j % 2 ? palette.pink : palette.pinkLight) : [palette.pine, palette.pineLight, palette.pineDark][j % 3];
      builder.add(foliageShelf(center, radius * 0.55, pink ? 0.24 : 0.14, radius * 0.44, i * 7 + j), "foliage", color);
      if (pink && j % 2 === 0) {
        blossomSpray(builder, [center[0], center[1] + 0.2, center[2] + 0.18], 0.1, palette.pinkLight);
      }
    }
  });
}

function roofY(x: number, z: number, halfWidth: number, halfDepth: number, eaveY: number, rise: number) {
  return eaveY + rise * (1 - Math.abs(z / halfDepth)) ** 1.5
    + 0.24 * Math.abs(x / halfWidth) ** 6 + 0.16 * Math.abs(z / halfDepth) ** 6;
}

function addRoof(builder: AssetBuilder, width: number, depth: number, eaveY: number, rise: number) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const xSteps = 16;
  const zSteps = 12;
  const vertices: number[] = [];
  const faces: number[] = [];
  for (let row = 0; row <= zSteps; row += 1) {
    const z = -halfDepth + row / zSteps * depth;
    for (let col = 0; col <= xSteps; col += 1) {
      const x = -halfWidth + col / xSteps * width;
      vertices.push(x, roofY(x, z, halfWidth, halfDepth, eaveY, rise), z);
    }
  }
  for (let row = 0; row < zSteps; row += 1) {
    for (let col = 0; col < xSteps; col += 1) {
      const a = row * (xSteps + 1) + col;
      const b = a + xSteps + 1;
      faces.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  builder.add(meshFromFaces(vertices, faces, true), "stone", palette.roof);
  const undersideVertices = vertices.map((value, index) => index % 3 === 1 ? value - 0.08 : value);
  const undersideFaces: number[] = [];
  for (let i = 0; i < faces.length; i += 3) {
    undersideFaces.push(faces[i], faces[i + 2], faces[i + 1]);
  }
  builder.add(meshFromFaces(undersideVertices, undersideFaces, true), "wood", palette.wood);
  // Visible curved tile seams and fascia carry the roof silhouette from ground level.
  for (let col = 0; col <= xSteps; col += 1) {
    const x = -halfWidth + col / xSteps * width;
    for (let row = 0; row < zSteps; row += 1) {
      const za = -halfDepth + row / zSteps * depth;
      const zb = za + depth / zSteps;
      builder.add(beam(
        [x, roofY(x, za, halfWidth, halfDepth, eaveY, rise) + 0.015, za],
        [x, roofY(x, zb, halfWidth, halfDepth, eaveY, rise) + 0.015, zb],
        0.022, 0.022, 5
      ), "stone", palette.roofEdge);
    }
  }
  for (const z of [-halfDepth, halfDepth]) {
    for (let col = 0; col < xSteps; col += 1) {
      const xa = -halfWidth + col / xSteps * width;
      const xb = xa + width / xSteps;
      builder.add(beam(
        [xa, roofY(xa, z, halfWidth, halfDepth, eaveY, rise) - 0.035, z],
        [xb, roofY(xb, z, halfWidth, halfDepth, eaveY, rise) - 0.035, z],
        0.06, 0.06, 6
      ), "wood", palette.woodLight);
    }
  }
  for (let col = 0; col < xSteps; col += 1) {
    const xa = -halfWidth + col / xSteps * width;
    const xb = xa + width / xSteps;
    builder.add(beam(
      [xa, roofY(xa, 0, halfWidth, halfDepth, eaveY, rise) + 0.055, 0],
      [xb, roofY(xb, 0, halfWidth, halfDepth, eaveY, rise) + 0.055, 0],
      0.065, 0.065, 6
    ), "metal", palette.gold);
  }
}

function addBanner(builder: AssetBuilder, x: number, top: number, z: number, width: number, height: number) {
  const banner = carvedPanel([
    [-width / 2, 0], [width / 2, 0], [width / 2, -height + 0.18], [0, -height], [-width / 2, -height + 0.18]
  ], 0.025).translate(x, top, z);
  builder.add(banner, "cloth", palette.cloth);
  builder.add(carvedPanel([[-width * 0.31, -0.06], [width * 0.31, -0.06], [width * 0.31, -height + 0.21], [0, -height + 0.08], [-width * 0.31, -height + 0.21]], 0.01).translate(x, top, z + 0.019), "cloth", palette.purple);
  builder.add(new OctahedronGeometry(1).scale(width * 0.16, width * 0.24, 0.018).translate(x, top - height * 0.42, z + 0.035), "metal", palette.gold);
  builder.add(beam([x - width * 0.6, top + 0.025, z], [x + width * 0.6, top + 0.025, z], 0.025), "metal", palette.gold);
}

function addGate(builder: AssetBuilder) {
  for (const x of [-1.8, 1.8]) {
    builder.add(box([0.9, 0.14, 0.9], [x, 0.07, 0]), "stone", palette.stoneShade);
    builder.add(box([0.74, 0.37, 0.74], [x, 0.325, 0]), "stone", palette.stone);
    builder.add(box([0.81, 0.1, 0.81], [x, 0.56, 0]), "stone", palette.stoneLight);
    builder.add(beam([x, 0.61, 0], [x, 3.58, 0], 0.24, 0.2, 8), "wood", palette.wood);
    for (const y of [0.73, 3.16, 3.48]) {
      builder.add(box([0.48, 0.07, 0.48], [x, y, 0]), "metal", palette.gold);
    }
    addBanner(builder, x, 3.08, 0.3, 0.46, 1.7);
    builder.add(beam([x, 3.31, 0], [x > 0 ? 1.25 : -1.25, 3.78, 0], 0.1, 0.08, 6), "wood", palette.woodLight);
  }
  builder.add(box([4.45, 0.21, 0.55], [0, 3.48, 0]), "wood", palette.wood);
  const arch: [number, number][] = [];
  for (let i = 0; i <= 12; i += 1) {
    const x = -2.24 + i / 12 * 4.48;
    arch.push([x, 3.64 + 0.29 * (1 - (x / 2.24) ** 2)]);
  }
  for (let i = 12; i >= 0; i -= 1) {
    const x = -2.24 + i / 12 * 4.48;
    arch.push([x, 3.81 + 0.22 * (1 - (x / 2.24) ** 2)]);
  }
  builder.add(carvedPanel(arch, 0.48), "wood", palette.woodLight);
  addRoof(builder, 4.7, 1.5, 4.04, 0.55);
  builder.add(new OctahedronGeometry(1).scale(0.14, 0.2, 0.06).translate(0, 3.74, 0.3), "metal", palette.gold);
}

function addPavilion(builder: AssetBuilder) {
  builder.add(box([5.25, 0.16, 4.2], [0, 0.08, 0]), "stone", palette.stoneShade);
  builder.add(box([5.02, 0.24, 4.02], [0, 0.28, 0]), "stone", palette.stone);
  builder.add(box([4.78, 0.16, 3.8], [0, 0.48, 0]), "stone", palette.stoneLight);
  for (const x of [-1.96, 1.96]) {
    for (const z of [-1.48, 1.48]) {
      builder.add(box([0.56, 0.28, 0.56], [x, 0.7, z]), "stone", palette.stone);
      builder.add(beam([x, 0.84, z], [x, 4.23, z], 0.16, 0.14), "wood", palette.wood);
      builder.add(box([0.5, 0.15, 0.5], [x, 3.91, z]), "wood", palette.woodLight);
      builder.add(beam([x, 3.45, z], [x * 0.7, 4.16, z], 0.08, 0.06), "wood", palette.woodLight);
      builder.add(beam([x, 3.45, z], [x, 4.16, z * 0.6], 0.08, 0.06), "wood", palette.woodLight);
    }
    builder.add(box([0.2, 0.27, 3.65], [x, 4.11, 0]), "wood", palette.wood);
    addBanner(builder, x, 3.57, 1.51, 0.46, 1.55);
  }
  for (const z of [-1.48, 1.48]) builder.add(box([4.62, 0.27, 0.21], [0, 4.12, z]), "wood", palette.wood);
  for (const x of [-1.96, 1.96]) {
    builder.add(box([0.12, 0.12, 2.76], [x, 1.26, 0]), "wood", palette.woodLight);
    for (let i = -3; i <= 3; i += 1) builder.add(box([0.07, 0.55, 0.07], [x, 0.99, i * 0.35]), "wood", palette.wood);
  }
  addRoof(builder, 5.9, 4.8, 4.27, 1.15);
  builder.add(new OctahedronGeometry(1).scale(0.1, 0.18, 0.1).translate(0, 5.69, 0), "metal", palette.gold);
}

function addLantern(builder: AssetBuilder, pillar = false) {
  const stemTop = pillar ? 2.7 : 0.64;
  const radius = pillar ? 0.48 : 0.25;
  builder.add(profile([[0, 0], [radius, 0], [radius, 0.08], [radius * 0.8, 0.13], [radius * 0.65, 0.17], [radius * 0.46, 0.23], [radius * 0.4, stemTop - 0.1], [radius * 0.72, stemTop], [0, stemTop]], 8), "stone", palette.stone);
  const chamberHeight = pillar ? 0.48 : 0.34;
  const chamberRadius = pillar ? 0.29 : 0.16;
  builder.add(box([chamberRadius * 2, 0.09, chamberRadius * 2], [0, stemTop + 0.035, 0]), "stone", palette.stoneLight);
  builder.add(box([chamberRadius * 1.35, chamberHeight * 0.76, chamberRadius * 1.35], [0, stemTop + chamberHeight * 0.55, 0]), "glow", palette.glow);
  for (const x of [-chamberRadius * 0.8, chamberRadius * 0.8]) {
    for (const z of [-chamberRadius * 0.8, chamberRadius * 0.8]) {
      builder.add(box([0.045, chamberHeight, 0.045], [x, stemTop + chamberHeight * 0.5, z]), "stone", palette.stoneShade);
    }
  }
  const capBottom = stemTop + chamberHeight;
  const capRadius = pillar ? 0.53 : 0.29;
  builder.add(profile([[0, capBottom], [capRadius, capBottom], [capRadius, capBottom + 0.06], [capRadius * 0.55, capBottom + 0.17], [0.055, capBottom + 0.24], [0, capBottom + 0.24]], 4).rotateY(Math.PI / 4), "stone", palette.roof);
  builder.add(new OctahedronGeometry(pillar ? 0.1 : 0.065).translate(0, capBottom + 0.28, 0), "metal", palette.gold);
}

function addBench(builder: AssetBuilder) {
  for (const x of [-0.73, 0.73]) {
    builder.add(carvedPanel([[-0.19, 0], [0.19, 0], [0.14, 0.13], [0.08, 0.32], [0.17, 0.43], [-0.17, 0.43], [-0.08, 0.32], [-0.14, 0.13]], 0.59).translate(x, 0, 0), "stone", palette.stone);
    builder.add(beam([x, 0.38, -0.28], [x, 0.83, -0.34], 0.05), "wood", palette.wood);
  }
  for (let i = 0; i < 4; i += 1) builder.add(box([2.12, 0.075, 0.115], [0, 0.455, -0.21 + i * 0.14]), "wood", i % 2 ? palette.wood : palette.woodLight);
  for (const y of [0.66, 0.81]) builder.add(box([2.08, 0.11, 0.07], [0, y, -0.33]), "wood", palette.woodLight);
  for (const x of [-0.97, 0.97]) builder.add(new OctahedronGeometry(1).scale(0.025, 0.045, 0.012).translate(x, 0.81, -0.286), "metal", palette.gold);
}

function addSignpost(builder: AssetBuilder) {
  builder.add(profile([[0, 0], [0.23, 0], [0.23, 0.1], [0.16, 0.22], [0.11, 0.25], [0, 0.25]], 6), "stone", palette.stone);
  builder.add(beam([0, 0.2, 0], [0, 1.93, 0], 0.07, 0.055), "wood", palette.wood);
  const arrow = carvedPanel([[-0.35, 0.11], [0.22, 0.11], [0.41, 0], [0.22, -0.11], [-0.35, -0.11]], 0.08);
  builder.add(arrow.translate(0, 1.68, 0), "wood", palette.woodLight);
  builder.add(carvedPanel([[-0.35, 0.11], [0.22, 0.11], [0.41, 0], [0.22, -0.11], [-0.35, -0.11]], 0.08).rotateY(Math.PI / 2).translate(0, 1.32, 0), "cloth", palette.purple);
  builder.add(new OctahedronGeometry(1).scale(0.08, 0.13, 0.08).translate(0, 2.03, 0), "metal", palette.gold);
  builder.add(new OctahedronGeometry(1).scale(0.05, 0.07, 0.015).translate(-0.13, 1.68, 0.05), "metal", palette.gold);
}

function addFlowers(builder: AssetBuilder) {
  for (let i = 0; i < 9; i += 1) {
    const angle = i * 2.399;
    const radius = 0.09 + (i % 3) * 0.12;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = 0.24 + (i % 3) * 0.07;
    builder.add(beam([x * 0.8, 0.012, z * 0.8], [x, height, z], 0.012, 0.008, 4), "foliage", palette.pine);
    builder.add(foliageShelf([x, 0.1, z], 0.12, 0.035, 0.07, i), "foliage", palette.pineLight);
    blossomSpray(builder, [x, height, z], 0.095, i % 2 ? palette.pinkLight : palette.lilac);
  }
}

/** Original static geometry. The caller owns every returned geometry and its disposal. */
export function createFantasyPlazaAsset(kind: PlazaAssetKind): PlazaAssetPart[] {
  const builder = new AssetBuilder();
  switch (kind) {
    case "fountain": addFountain(builder); break;
    case "tree": addTree(builder, false); break;
    case "blossom": addTree(builder, true); break;
    case "bench": addBench(builder); break;
    case "pillar": addLantern(builder, true); break;
    case "signpost": addSignpost(builder); break;
    case "lantern": addLantern(builder); break;
    case "rock": builder.add(rockGeometry([0, 0, 0], [1, 0.7, 1], 4), "stone", palette.rockLight); break;
    case "flowers": addFlowers(builder); break;
    case "pavilion": addPavilion(builder); break;
    case "gate": addGate(builder); break;
  }
  return builder.finish();
}
