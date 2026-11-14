import { describe, expect, it } from "vitest";
import { createPlazaStudyGeometry, createStudyPathCurve, createStudyPathGeometry } from "./plaza-study-geometry";
import { collectMapColliders, PUBLIC_PLAZA_MAP_CONFIG } from "@/lib/world/map-config";
import { resolveCircleAabbCollision } from "@/lib/world/physics";
import { PLAZA_STUDY_MAP_CONFIG } from "@/lib/world/plaza-study-config";
import { STUDY_PATHS, STUDY_PAVILIONS } from "@/lib/world/plaza-study-layout";
import { studyGroundHeight, STUDY_CONNECTORS, studyConnectorHeight } from "@/lib/world/plaza-study-terrain";
import { createInitialPlayerState, stepPlayerKinematics } from "@/lib/world/physics";
import { STUDY_LECTURE_SEATS, STUDY_COLONNADES, studyColonnadePosts } from "@/lib/world/plaza-study-architecture";

describe("walkable Plaza layout study", () => {
  const config = PLAZA_STUDY_MAP_CONFIG;
  const colliders = collectMapColliders(config);
  function obstaclesAt(x: number, z: number) {
    const floor=studyGroundHeight(x,z)??0;
    return colliders.filter(c => {
      const result = resolveCircleAabbCollision(x, z, config.player.radius, c, floor);
      return Math.hypot(result.x - x, result.z - z) > .001;
    }).map(c => c.id);
  }

  it("keeps spawn, pavilion interiors and every path centerline clear for the avatar", () => {
    expect(obstaclesAt(config.spawn.position[0], config.spawn.position[2])).toEqual([]);
    for (const p of STUDY_PAVILIONS) expect(obstaclesAt(p.x, p.z)).toEqual([]);
    const conflicts: string[] = [];
    STUDY_PATHS.forEach((path, index) => {
      const curve = createStudyPathCurve(path.points);
      const count = Math.ceil(curve.getLength() * 4);
      for (let i = 0; i <= count; i++) {
        const p = curve.getPointAt(i / count);
        for (const id of obstaclesAt(p.x, p.z)) conflicts.push(`path ${index}: ${id}`);
      }
    });
    expect([...new Set(conflicts)]).toEqual([]);
  });

  it("blocks the water, fountain and columns while retaining an open portal approach", () => {
    expect(obstaclesAt(28, 23).length).toBeGreaterThan(0);
    expect(obstaclesAt(0, 12)).toContain("study-fountain");
    const p = STUDY_PAVILIONS[0];
    expect(obstaclesAt(p.x + p.width * .38, p.z + p.depth * .38).length).toBeGreaterThan(0);
    expect(obstaclesAt(0, -9.8)).toEqual([]);
    expect(PUBLIC_PLAZA_MAP_CONFIG.plazaStudy).toBeUndefined();
    expect(collectMapColliders(PUBLIC_PLAZA_MAP_CONFIG).some(c => c.id === "plaza-fountain")).toBe(true);
    expect(colliders.some(c => c.id === "plaza-fountain")).toBe(false);
  });

  it("opens the new academy destinations while blocking their pools and structural columns", () => {
    for(const [x,z] of [[-23,42],[-28,33],[-35,-3],[-27,-11],[0,-21],[38.6,19],[0,48]]) {
      expect(obstaclesAt(x,z),`destination ${x},${z}`).toEqual([]);
    }
    for(const [x,z] of [[-28,28],[31.5,10],[-36.5,-3],[40.1,19],[-23,49.5]]) {
      expect(obstaclesAt(x,z).length,`solid ${x},${z}`).toBeGreaterThan(0);
    }
  });

  it("supports the lecture tiers and cloister foundations on one continuous terrace", () => {
    for(const s of STUDY_LECTURE_SEATS)expect(studyGroundHeight(s.x,s.z),`seat ${s.x},${s.z}`).toBe(0);
    for(const c of STUDY_COLONNADES)for(const p of studyColonnadePosts(c)) {
      expect(studyGroundHeight(p.x,p.z),c.id).toBe(studyGroundHeight(c.x,c.z));
    }
  });

  it("walks every stair/ramp both ways and supports all four destination heights", () => {
    expect(studyGroundHeight(0,12)).toBe(0);
    expect(studyGroundHeight(-25,-2)).toBe(4);
    expect(studyGroundHeight(-4,-21)).toBe(7);
    expect(studyGroundHeight(28,-5)).toBe(-2);
    for(const c of STUDY_CONNECTORS) {
      for(const reverse of [false,true])for(const side of [-.32,0,.32]) {
        const length=Math.hypot(c.to[0]-c.from[0],c.to[1]-c.from[1]);
        const ox=-(c.to[1]-c.from[1])/length*c.width*side,oz=(c.to[0]-c.from[0])/length*c.width*side;
        const start=reverse?c.to:c.from,end=reverse?c.from:c.to;
        const from=[start[0]+ox,start[1]+oz],to=[end[0]+ox,end[1]+oz];
        const p=createInitialPlayerState(config);
        p.x=from[0];p.z=from[1];p.y=studyConnectorHeight(c,reverse?1:0);p.isGrounded=true;
        const distance=Math.hypot(to[0]-from[0],to[1]-from[1]);
        const yaw=Math.atan2(-(to[0]-from[0]),-(to[1]-from[1]));
        const dt=.025, frames=Math.ceil(distance/config.player.walkSpeed/dt);
        for(let i=0;i<=20;i++)expect(obstaclesAt(from[0]+(to[0]-from[0])*i/20,from[1]+(to[1]-from[1])*i/20),`${c.id} lane ${side}`).toEqual([]);
        for(let i=0;i<frames;i++)stepPlayerKinematics(p,{forward:true,backward:false,left:false,right:false,sprint:false,jump:false},colliders,config.bounds,config.player,dt,yaw,studyGroundHeight);
        expect(Math.hypot(p.x-to[0],p.z-to[1]),`${c.id} reverse=${reverse} side=${side}`).toBeLessThan(.15);
        expect(p.y,`${c.id} elevation`).toBeCloseTo(reverse?c.fromY:c.toY,1);
      }
    }
  });

  it("keeps all route samples inside the summit without an unconnected ledge", () => {
    for(const [index,path] of STUDY_PATHS.entries()) {
      const curve=createStudyPathCurve(path.points),count=Math.ceil(curve.getLength()*10);
      let previous:number|null=null;
      for(let i=0;i<=count;i++) {
        const p=curve.getPointAt(i/count),height=studyGroundHeight(p.x,p.z);
        expect(height,`path ${index}: ${p.x},${p.z}`).not.toBeNull();
        if(previous!==null)expect(Math.abs(height!-previous),`path ${index}: sudden ledge`).toBeLessThan(.3);
        previous=height;
      }
    }
  });

  it("joins the diagonal bridge to the overlook across its full entrance width", () => {
    const c=STUDY_CONNECTORS.find(c=>c.id==="sky-bridge")!;
    const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
    for(const side of [-1.5,-.75,0,.75,1.5]) {
      const x=c.to[0]-dz/length*side,z=c.to[1]+dx/length*side;
      expect(studyGroundHeight(x+dx/length*.05,z+dz/length*.05),`bridge exit ${side}`).toBe(7);
      expect(studyGroundHeight(x-dx/length*.05,z-dz/length*.05),`bridge approach ${side}`).toBeCloseTo(7,1);
    }
  });

  it("faces paving upward and keeps static geometry finite in a small number of batches", () => {
    const path = createStudyPathGeometry(STUDY_PATHS[0].points, 4);
    try {
      const normals = path.getAttribute("normal");
      for (let i = 0; i < normals.count; i++) expect(normals.getY(i)).toBeGreaterThan(.99);
    } finally { path.dispose(); }
    const batches = createPlazaStudyGeometry();
    try {
      expect(batches.length).toBeLessThanOrEqual(7);
      let triangles = 0;
      for (const { geometry } of batches) {
        expect(Array.from(geometry.getAttribute("position").array).every(Number.isFinite)).toBe(true);
        triangles += geometry.getAttribute("position").count / 3;
      }
      expect(triangles).toBeLessThan(96000);
      const stone = batches.find(b=>b.material==="stone")!.geometry;
      const positions=stone.getAttribute("position"),normals=stone.getAttribute("normal");
      let outward=0, inward=0;
      for(let i=0;i<positions.count;i++)if(positions.getY(i)<-5) {
        const dot=positions.getX(i)*normals.getX(i)+(positions.getZ(i)-16)*normals.getZ(i);
        if(dot>1)outward++;else if(dot<-1)inward++;
      }
      expect(outward).toBeGreaterThan(0);
      expect(inward).toBe(0);
    } finally { batches.forEach(({ geometry }) => geometry.dispose()); }
  });
});
