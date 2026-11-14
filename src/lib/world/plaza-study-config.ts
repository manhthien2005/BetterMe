import { PUBLIC_PLAZA_MAP_CONFIG } from "./map-config";
import { STUDY_BENCHES, STUDY_BOUNDS, STUDY_FOUNTAIN, STUDY_LAKE, STUDY_PAVILIONS, STUDY_TABLES, STUDY_TREES } from "./plaza-study-layout";
import type { Aabb2D, WorldMapConfig, WorldPropDefinition } from "./types";
import { studyGroundHeight } from "./plaza-study-terrain";
import { academyStairColliders } from "./plaza-study-stair";
import { skyBridgeColliders } from "./plaza-study-bridge";
import { readingPavilionColliders } from "./plaza-study-pavilion";
import { readingCloisterColliders } from "./plaza-study-cloister";
import { STUDY_CASCADE, STUDY_COLONNADES, STUDY_LECTURE_SEATS, STUDY_OBSERVATORY, STUDY_OBSERVATORY_POSTS, STUDY_REFLECTING_POOL, STUDY_STAIR_PLANTERS, studyColonnadePosts } from "./plaza-study-architecture";

const colliders: Aabb2D[] = [...academyStairColliders(), ...skyBridgeColliders(), ...readingPavilionColliders(), ...readingCloisterColliders()];
const box = (id: string, x: number, z: number, width: number, depth: number, height: number) => {
  const y = studyGroundHeight(x, z) ?? 0;
  colliders.push({ id, minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2, minY: y, maxY: y + height });
};
box("study-fountain", STUDY_FOUNTAIN[0], STUDY_FOUNTAIN[2], 4.8, 4.8, 2.8);
for (const p of STUDY_PAVILIONS) {
  if (p.id === "grand-pavilion") continue;
  for (const x of [-1, 1]) for (const z of [-1, 1]) box(`${p.id}-${x}-${z}`, p.x + x * p.width * .38, p.z + z * p.depth * .38, .65, .65, p.height);
  colliders.push({
    id: `${p.id}-roof`,
    minX: p.x - p.width * .65, maxX: p.x + p.width * .65,
    minZ: p.z - p.depth * .65, maxZ: p.z + p.depth * .65,
    minY: (studyGroundHeight(p.x,p.z) ?? 0) + p.height,
    maxY: (studyGroundHeight(p.x,p.z) ?? 0) + p.height + 3,
    cameraOnly: true, blockCamera: true
  });
}
STUDY_BENCHES.forEach((b, i) => {
  const alongX = Math.abs(Math.cos(b.yaw)) > .5;
  box(`study-bench-${i}`, b.x, b.z, alongX ? 3.2 : .85, alongX ? .85 : 3.2, 1);
});
STUDY_TREES.forEach(([x, z], i) => box(`study-tree-${i}`, x, z, .85, .85, 6));
STUDY_TABLES.forEach(({x,z},i)=>{
  box(`study-table-${i}`,x,z,2.4,1.4,.85);
  for(const side of [-1,1])box(`study-table-seat-${i}-${side}`,x,z+side*1.3,2.4,.5,.5);
});
for(const c of STUDY_COLONNADES) {
  if (c.id === "west-cloister" || c.id === "north-cloister") continue;
  studyColonnadePosts(c).forEach(({x,z},i)=>box(`${c.id}-post-${i}`,x,z,.6,.6,c.height));
  const floor=studyGroundHeight(c.x,c.z)??0;
  colliders.push({id:`${c.id}-roof`,minX:c.x-c.width/2-1,maxX:c.x+c.width/2+1,
    minZ:c.z-c.depth/2-1,maxZ:c.z+c.depth/2+1,minY:floor+c.height-.25,maxY:floor+c.height+1.8,
    cameraOnly:true,blockCamera:true});
}
STUDY_OBSERVATORY_POSTS.forEach(({x,z},i)=>box(`observatory-post-${i}`,x,z,.55,.55,STUDY_OBSERVATORY.height));
colliders.push({id:"observatory-roof",minX:-4.5,maxX:4.5,minZ:-25.5,maxZ:-16.5,
  minY:7+STUDY_OBSERVATORY.height-.3,maxY:7+STUDY_OBSERVATORY.height+4,cameraOnly:true,blockCamera:true});
for(const [i,s] of STUDY_LECTURE_SEATS.entries())box(`lecture-seat-${i}`,s.x,s.z,
  Math.abs(Math.cos(s.yaw))*s.width+Math.abs(Math.sin(s.yaw))*s.depth,
  Math.abs(Math.sin(s.yaw))*s.width+Math.abs(Math.cos(s.yaw))*s.depth,s.height);
for(const [i,p] of STUDY_STAIR_PLANTERS.entries())box(`stair-planter-${i}`,p.x,p.z,p.width,p.depth,p.height+.5);
const pool=STUDY_REFLECTING_POOL;
box("reflecting-pool",pool.x,pool.z,pool.width+.4,pool.depth+.4,.5);
for(const [i,c] of STUDY_CASCADE.entries())box(`cascade-${i}`,c.x,c.z,c.width,c.depth,c.height);
// AABB strips approximate the water's ellipse; the dry promenade remains outside it.
for (let row = 0; row < 11; row++) {
  const z = -10 + row * 2, edge = Math.max(0, Math.abs(z) - 1);
  const halfWidth = STUDY_LAKE.rx * Math.sqrt(1 - (edge / STUDY_LAKE.rz) ** 2);
  box(`study-lake-${row}`, STUDY_LAKE.x, STUDY_LAKE.z + z, halfWidth * 2, 2, .3);
}
const props: WorldPropDefinition[] = colliders.map(c => ({
  id: c.id, zoneId: "plaza", archetype: "wall", assetSlot: "study.massing",
  position: [(c.minX + c.maxX) / 2, 0, (c.minZ + c.maxZ) / 2],
  size: [c.maxX - c.minX, c.maxY ?? 1, c.maxZ - c.minZ],
  color: "#c8bea4", collider: c
}));

export const PLAZA_STUDY_MAP_CONFIG: WorldMapConfig = {
  ...PUBLIC_PLAZA_MAP_CONFIG,
  id: "plaza-layout-study-v3", plazaStudy: true, groundHeight: studyGroundHeight,
  title: "Học viện trên sống núi · Quần thể sân vườn 03", bounds: STUDY_BOUNDS,
  spawn: { position: [0, 0, 40], yaw: Math.PI }, props,
  zones: [{
    ...PUBLIC_PLAZA_MAP_CONFIG.zones[0],
    title: "Học viện trên sống núi", subtitle: "Bản 03 · Thư đình · Đài thiên văn · Giảng đường vườn · Thủy viên",
    description: "Khám phá sân đọc sách và đài thiên văn trên cao, giảng đường giữa vườn và hành lang ven hồ.",
    bounds: STUDY_BOUNDS
  }]
};
