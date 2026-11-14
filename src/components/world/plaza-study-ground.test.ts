import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPlazaStudyGeometry, createStudyPathGeometry } from "./plaza-study-geometry";
import { STUDY_CONNECTORS, STUDY_TERRACES, studyConnectorHeight, studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import { STUDY_PATHS } from "@/lib/world/plaza-study-layout";
import { createStudyConnectorGeometry, createStudyRockGeometry } from "./plaza-study-ground";

describe("finished plaza foundations",()=>{
  it("matches the physics surface across the full width of every connector",()=>{
    const material=new MeshBasicMaterial();
    try {
      for(const c of STUDY_CONNECTORS) {
        const geometry=createStudyConnectorGeometry(c),mesh=new Mesh(geometry,material);
        try {
          const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
          for(const t of [.037,.137,.31,.51,.77,.97])for(const side of [-.42,0,.42]) {
            const origin=new Vector3(c.from[0]+dx*t-dz/length*c.width*side,20,c.from[1]+dz*t+dx/length*c.width*side);
            const hit=new Raycaster(origin,new Vector3(0,-1,0)).intersectObject(mesh)[0];
            expect(hit,`${c.id} ${t} ${side}`).toBeDefined();
            if(c.id==="sky-bridge")expect(Math.abs(hit.point.y-studyConnectorHeight(c,t))).toBeLessThan(.005);
            else expect(hit.point.y).toBeCloseTo(studyConnectorHeight(c,t),4);
          }
        } finally {geometry.dispose();}
      }
    } finally {material.dispose();}
  });

  it("keeps the full connector mouth connected and free of an overlapping retaining cap",()=>{
    const batches=createPlazaStudyGeometry(),material=new MeshBasicMaterial();
    const meshes=batches.map(b=>new Mesh(b.geometry,material));
    try {
      for(const c of STUDY_CONNECTORS) {
        const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
        for(const side of [-.35,0,.35]) {
          const x=c.to[0]-dz/length*c.width*side,z=c.to[1]+dx/length*c.width*side;
          expect(studyGroundHeight(x+dx/length*.1,z+dz/length*.1),`${c.id} exit ${side}`).toBeCloseTo(c.toY,2);
        }
        if(c.id!=="sky-bridge") {
          const t=.99,origin=new Vector3(c.from[0]+dx*t,12,c.from[1]+dz*t);
          const hit=new Raycaster(origin,new Vector3(0,-1,0)).intersectObjects(meshes)[0];
          expect(hit.point.y,`${c.id} visible contact`).toBeLessThanOrEqual(studyConnectorHeight(c,t)+.04);
        }
      }
    } finally {batches.forEach(b=>b.geometry.dispose());material.dispose();}
  });

  it("continues exposed upper-terrace foundations down to the lower garden",()=>{
    const batches=createPlazaStudyGeometry(),material=new MeshBasicMaterial();
    const meshes=batches.map(b=>new Mesh(b.geometry,material));
    try {
      const a=STUDY_TERRACES[3].outline[3],b=STUDY_TERRACES[3].outline[4];
      const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      const outward=new Vector3(dz/length,0,-dx/length);
      const origin=new Vector3((a[0]+b[0])/2,-1,(a[1]+b[1])/2).addScaledVector(outward,.6);
      expect(new Raycaster(origin,outward.negate(),0,1).intersectObjects(meshes).length).toBeGreaterThan(0);
    } finally {batches.forEach(b=>b.geometry.dispose());material.dispose();}
  });

  it("closes the underside of the rock with outward-facing geometry",()=>{
    const geometry=createStudyRockGeometry(),material=new MeshBasicMaterial();
    try {
      const hit=new Raycaster(new Vector3(.2,-60,16.2),new Vector3(0,1,0)).intersectObject(new Mesh(geometry,material))[0];
      expect(hit).toBeDefined();expect(hit.point.y).toBeLessThan(-40);
      expect(hit.face!.normal.y).toBeLessThan(0);
    } finally {geometry.dispose();material.dispose();}
  });

  it("supports every grounded ramp and stair with a solid side down to the lower terrace",()=>{
    const batches=createPlazaStudyGeometry(),material=new MeshBasicMaterial();
    const meshes=batches.map(b=>new Mesh(b.geometry,material));
    try {
      for(const c of STUDY_CONNECTORS.filter(c=>c.id!=="sky-bridge")) {
        const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
        const x=c.from[0]+dx*.51,z=c.from[1]+dz*.51;
        const y=(Math.min(c.fromY,c.toY)+studyConnectorHeight(c,.51))/2;
        for(const side of [-1,1]) {
          const normal=new Vector3(-dz/length*side,0,dx/length*side);
          const origin=new Vector3(x,y,z).addScaledVector(normal,c.width/2+.15);
          const ray=new Raycaster(origin,normal.negate(),0,.3);
          expect(ray.intersectObjects(meshes,false).length,`${c.id} side ${side}`).toBeGreaterThan(0);
        }
      }
    } finally {batches.forEach(b=>b.geometry.dispose());material.dispose();}
  });

  it("joins the rock rim exactly to every corner of the lowest floor",()=>{
    const batches=createPlazaStudyGeometry();
    try {
      const positions=batches.find(b=>b.material==="stone")!.geometry.getAttribute("position");
      for(const [x,z] of STUDY_TERRACES[0].outline) {
        let closest=Infinity;
        for(let i=0;i<positions.count;i++)closest=Math.min(closest,Math.hypot(positions.getX(i)-x,positions.getY(i)+2.01,positions.getZ(i)-z));
        expect(closest,`rim ${x},${z}`).toBeLessThan(.001);
      }
    } finally {batches.forEach(b=>b.geometry.dispose());}
  });

  it("never stretches a path triangle across an abrupt terrace edge",()=>{
    for(const path of STUDY_PATHS.slice(0,-STUDY_CONNECTORS.length)) {
      const g=createStudyPathGeometry(path.points,path.width+.48);
      try {
        const p=g.getAttribute("position"),index=g.getIndex()!;
        for(let i=0;i<index.count;i+=3) {
          const ys=[0,1,2].map(j=>p.getY(index.getX(i+j)));
          expect(Math.max(...ys)-Math.min(...ys),`path ${path.points[0]}`).toBeLessThan(.3);
        }
      } finally {g.dispose();}
    }
  });
});
