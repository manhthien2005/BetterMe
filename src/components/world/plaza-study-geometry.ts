import {
  BoxGeometry, BufferGeometry, CatmullRomCurve3, CircleGeometry, Color,
  CylinderGeometry, DodecahedronGeometry, Float32BufferAttribute, RingGeometry, Shape, ShapeGeometry, Vector3
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { createFantasyPlazaAsset, type PlazaAssetKind, type PlazaAssetPart } from "./fantasy-plaza-assets";
import {
  STUDY_BENCHES, STUDY_FOUNTAIN, STUDY_LAKE, STUDY_PATHS, STUDY_PAVILIONS, STUDY_TABLES, STUDY_TREES
} from "@/lib/world/plaza-study-layout";
import type { Vec3Tuple } from "@/lib/world/types";
import { STUDY_CONNECTORS, STUDY_TERRACES, insideStudyPolygon, studyConnectorHeight, studyConnectorProgress, studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import { addPlazaAcademyArchitecture } from "./plaza-study-architecture";
import { createStudyConnectorGeometry, createStudyRockGeometry } from "./plaza-study-ground";
import { createAcademyStairDetails } from "./plaza-study-stair";
import { createSkyBridgeDetails } from "./plaza-study-bridge";
import { createReadingPavilion } from "./plaza-study-pavilion";

type Surface = PlazaAssetPart["material"];
export type StudyBatch = { material: Surface; geometry: BufferGeometry };

export function createStudyPathCurve(points: readonly (readonly [number, number])[]) {
  return new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), false, "centripetal");
}

/** Upward-facing ribbon; shared curves also drive the walkability checks. */
export function createStudyPathGeometry(points: readonly (readonly [number, number])[], width: number, y = .018) {
  const curve = createStudyPathCurve(points);
  const segments = Math.ceil(curve.getLength() * 3);
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(i / segments);
    const t = curve.getTangentAt(i / segments);
    const centerY=studyGroundHeight(p.x,p.z)??-2;
    for (const side of [-1, 1]) {
      let distance=width/2;
      const onSurface=(d:number)=>{
        const height=studyGroundHeight(p.x-t.z*d*side,p.z+t.x*d*side);
        return height!==null&&Math.abs(height-centerY)<.005;
      };
      // Clip each edge to this terrace instead of draping a ribbon down a cliff.
      if(!onSurface(distance)) {
        let low=0,high=distance;
        for(let j=0;j<14;j++){const mid=(low+high)/2;if(onSurface(mid))low=mid;else high=mid;}
        distance=low;
      }
      const x=p.x-t.z*distance*side,z=p.z+t.x*distance*side;
      vertices.push(x,centerY+y,z);
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function roof(width: number, depth: number, height: number) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const levels = [[1, .22], [.83, 0], [.36, height * .8], [.08, height]];
  for (const [scale, y] of levels) {
    for (const [x, z] of [[-1, -1], [-1, 1], [1, 1], [1, -1]]) vertices.push(x * width * scale / 2, y, z * depth * scale / 2);
  }
  for (let row = 0; row < levels.length - 1; row++) {
    for (let i = 0; i < 4; i++) {
      const a = row * 4 + i, b = row * 4 + (i + 1) % 4;
      indices.push(a, b, b + 4, a, b + 4, a + 4);
    }
  }
  indices.push(12, 13, 14, 12, 14, 15);
  // An underside makes the mass legible when walking beneath the eaves.
  indices.push(3, 2, 1, 3, 1, 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Disposable polygon study, batched by surface rather than one draw per prop. */
export function createPlazaStudyGeometry(): StudyBatch[] {
  const batches = new Map<Surface, BufferGeometry[]>();
  const kit = new Map<PlazaAssetKind, PlazaAssetPart[]>();
  function add(source: BufferGeometry, material: Surface, hex: string, groundStyle=0) {
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    geometry.deleteAttribute("uv");
    const position = geometry.getAttribute("position");
    if(!geometry.hasAttribute("groundStyle"))geometry.setAttribute("groundStyle",new Float32BufferAttribute(new Float32Array(position.count).fill(groundStyle),1));
    const color = new Color(hex);
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) colors.set([color.r, color.g, color.b], i * 3);
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const list = batches.get(material) ?? [];
    list.push(geometry);
    batches.set(material, list);
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, material: Surface, color: string) {
    add(new BoxGeometry(w, h, d).translate(x, (studyGroundHeight(x,z)??0)+y, z), material, color);
  }
  function disc(x: number, z: number, rx: number, rz: number, y: number, material: Surface, color: string) {
    add(new CircleGeometry(1, 64).rotateX(-Math.PI / 2).scale(rx, 1, rz).translate(x, (studyGroundHeight(x,z)??0)+y, z), material, color,material==="stone"?1:0);
  }
  function ring(x: number, z: number, inner: number, outer: number, y: number, color: string) {
    add(new RingGeometry(inner, outer, 80).rotateX(-Math.PI / 2).translate(x, y, z), "stone", color);
  }
  function asset(kind: PlazaAssetKind, position: Vec3Tuple, scale: Vec3Tuple = [1, 1, 1], yaw = 0) {
    if (!kit.has(kind)) kit.set(kind, createFantasyPlazaAsset(kind));
    for (const part of kit.get(kind)!) add(part.geometry.clone().scale(...scale).rotateY(yaw).translate(position[0],position[1]+(studyGroundHeight(position[0],position[2])??0),position[2]), part.material, part.color);
  }

  function beam(a: Vec3Tuple,b: Vec3Tuple,width:number,height:number,color:string,material:Surface="stone",groundStyle=0) {
    const start=new Vector3(...a),end=new Vector3(...b),delta=end.clone().sub(start);
    const geometry=new BoxGeometry(width,height,delta.length());
    geometry.lookAt(delta.normalize());geometry.translate(...start.add(end).multiplyScalar(.5).toArray());
    add(geometry,material,color,groundStyle);
  }
  add(createStudyRockGeometry(),"stone","#697b79",3);
  // Architectural terraces sit on irregular rock; the central court stays broad.
  for (const [index, terrace] of STUDY_TERRACES.entries()) {
    const shape=new Shape();
    terrace.outline.forEach(([x,z],i)=>i===0?shape.moveTo(x,-z):shape.lineTo(x,-z));shape.closePath();
    add(new ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,terrace.height-.01,0),index>1?"stone":"foliage",index>1?"#c5c1ab":index===0?"#71866a":"#899b70",index>1?1:0);
    for(let edge=0;edge<terrace.outline.length;edge++) {
      const a=terrace.outline[edge],b=terrace.outline[(edge+1)%terrace.outline.length];
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/1.5);
      for(let i=0;i<steps;i++) {
        const t0=i/steps,t1=(i+1)/steps,tm=(t0+t1)/2;
        const x=a[0]+(b[0]-a[0])*tm,z=a[1]+(b[1]-a[1])*tm;
        const lowerHeight=(t:number)=>{
          for(let j=index-1;j>=0;j--)if(insideStudyPolygon(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,STUDY_TERRACES[j].outline))return STUDY_TERRACES[j].height;
          return -2;
        };
        const bottom=Math.min(lowerHeight(t0),lowerHeight(tm),lowerHeight(t1))-.05;
        const inOpening=STUDY_CONNECTORS.some(c=>studyConnectorProgress(x,z,{...c,width:c.width+1.2})!==null);
        const start:[number,number,number]=[a[0]+(b[0]-a[0])*t0,(bottom+terrace.height)/2,a[1]+(b[1]-a[1])*t0];
        const end:[number,number,number]=[a[0]+(b[0]-a[0])*t1,start[1],a[1]+(b[1]-a[1])*t1];
        // Openings remove the rail/coping, never the foundation beneath the landing.
        const buried=(studyGroundHeight(x,z)??-2)>terrace.height+.01;
        if(index>0&&!buried) {
          if(inOpening) {
            // A landing cap lies on the boundary; a thick box would protrude into the last tread.
            const wall=new BufferGeometry();
            wall.setAttribute("position",new Float32BufferAttribute([
              start[0],bottom,start[2],end[0],bottom,end[2],
              start[0],terrace.height,start[2],end[0],terrace.height,end[2]
            ],3));
            wall.setIndex([0,2,1,1,2,3]);wall.computeVertexNormals();add(wall,"stone","#aeb0a1",2);
          } else beam(start,end,.7,terrace.height-bottom,"#aeb0a1","stone",2);
        }
        if(!inOpening&&!buried) {
          if(index>0) {
            beam([start[0],bottom+.32,start[2]],[end[0],bottom+.32,end[2]],.85,.22,"#c5c1ab");
            if(i%4===0)add(new BoxGeometry(.8,terrace.height-bottom,.8).translate(x,(bottom+terrace.height)/2,z),"stone","#c5c1ab");
          }
          beam([start[0],terrace.height+.07,start[2]],[end[0],terrace.height+.07,end[2]],.85,.18,"#ded5bb");
          // Low edge rails keep views open. Skip edges buried beneath higher floors.
          if((studyGroundHeight(x,z)??-2)<=terrace.height+.01) {
            beam([start[0],terrace.height+.85,start[2]],[end[0],terrace.height+.85,end[2]],.09,.12,"#695647","wood");
            if(i%2===0)add(new BoxGeometry(.17,.9,.17).translate(x,terrace.height+.45,z),"wood","#695647");
          }
        }
      }
    }
  }
  // The connectors are drawn from the exact profile used by movement.
  for(const c of STUDY_CONNECTORS) {
    if(c.id==="sky-bridge") {
      for(const part of createSkyBridgeDetails())add(part.geometry,part.material,part.color);
      continue;
    }
    const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
    const nx=-dz/length,nz=dx/length,segments=c.stairs?24:Math.ceil(length*2);
    add(createStudyConnectorGeometry(c),"stone","#d2c7ac");
    if(c.id==="academy-stair") {
      for(const part of createAcademyStairDetails())add(part.geometry,part.material,part.color,part.groundStyle);
      continue;
    }
    for(let i=0;i<segments;i++) {
      const t0=i/segments,t1=(i+1)/segments;
      const y0=studyConnectorHeight(c,t0),y1=studyConnectorHeight(c,t1);
      const x0=c.from[0]+dx*t0,z0=c.from[1]+dz*t0,x1=c.from[0]+dx*t1,z1=c.from[1]+dz*t1;
      for(const side of [-1,1]) {
        const offset=side*(c.width/2+.1);
        beam([x0+nx*offset,y0+.86,z0+nz*offset],[x1+nx*offset,y1+.86,z1+nz*offset],.1,.14,"#6c5747","wood");
        if(i%4===0)add(new BoxGeometry(.2,.95,.2).translate(x0+nx*offset,y0+.475,z0+nz*offset),"wood","#725a47");
      }
    }
  }
  for (const path of STUDY_PATHS.slice(0,-STUDY_CONNECTORS.length)) {
    add(createStudyPathGeometry(path.points, path.width + .48, .009), "stone", "#b2b29d");
    add(createStudyPathGeometry(path.points, path.width), "stone", "#e0d8be",1);
  }

  // Public court: room to gather around water, with an open northward axis.
  disc(0, 12, 12.5, 12.5, .026, "stone", "#d6ccb2");
  ring(0, 12, 11.6, 12, .03, "#aaa996");
  ring(0, 12, 5.3, 5.42, .03, "#b0a17c");
  ring(0, 12, 3.05, 3.5, .031, "#ede2c8");
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    add(new BoxGeometry(.035, .008, 5.8).translate(0, .032, 8.5).rotateY(angle).translate(0, 0, 12), "stone", "#b5ad98");
  }
  asset("fountain", STUDY_FOUNTAIN, [1.35, 1.7, 1.35]);
  asset("gate", [0, 0, -9.8]);

  // Two open pavilions on different terraces, with flush thresholds.
  for (const p of STUDY_PAVILIONS) {
    if (p.id === "grand-pavilion") {
      for (const part of createReadingPavilion()) add(part.geometry, part.material, part.color);
      continue;
    }
    box(p.x, -.1, p.z, p.width + 2, .26, p.depth + 2, "stone", "#e2d7bb");
    box(p.x, .035, p.z, p.width, .02, p.depth, "stone", "#c4bca3");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = p.x + sx * p.width * .38, z = p.z + sz * p.depth * .38;
      box(x, .25, z, .65, .5, .65, "stone", "#dfd2b4");
      box(x, p.height / 2, z, .5, p.height, .5, "wood", "#695345");
      box(x, p.height - .3, z, 1.05, .32, 1.05, "wood", "#947657");
    }
    for (const side of [-1, 1]) {
      box(p.x, p.height - .15, p.z + side * p.depth * .38, p.width, .45, .4, "wood", "#6f5946");
      box(p.x + side * p.width * .38, p.height - .15, p.z, .4, .45, p.depth, "wood", "#6f5946");
    }
    const floor=studyGroundHeight(p.x,p.z)??0;
    add(roof(p.width * 1.3, p.depth * 1.3, 2).translate(p.x, floor+p.height, p.z), "stone", "#526a79");
    add(roof(p.width * .62, p.depth * .62, 1.25).translate(p.x, floor+p.height + 1.75, p.z), "stone", "#506879");
    for (const side of [-1, 1]) box(p.x, p.height + .15, p.z + side * p.depth * .65, p.width * 1.3, .12, .15, "metal", "#c0a775");
    // Repeated rafters and deep brackets make the main hall read as a built structure.
    for(let i=0;i<=12;i++)for(const side of [-1,1]) {
      const x=p.x+(i/12-.5)*p.width*1.2;
      beam([x,floor+p.height-.1,p.z+side*p.depth*.61],[x,floor+p.height-.1,p.z+side*p.depth*.35],.09,.12,"#947657","wood");
    }
    for(const sx of [-1,1])for(const sz of [-1,1]) {
      const x=p.x+sx*p.width*.38,z=p.z+sz*p.depth*.38;
      beam([x,floor+p.height-1.25,z],[x-sx*1.1,floor+p.height-.2,z],.2,.22,"#947657","wood");
      beam([x,floor+p.height-1.25,z],[x,floor+p.height-.2,z-sz*1.1],.2,.22,"#947657","wood");
    }
    add(new DodecahedronGeometry(.28).scale(1, 2.5, 1).translate(p.x, floor+p.height + 3.25, p.z), "metal", "#c5ad7e");
  }

  const lake = STUDY_LAKE;
  disc(lake.x, lake.z, lake.rx + .8, lake.rz + .8, .024, "stone", "#c5c7ab");
  disc(lake.x, lake.z, lake.rx, lake.rz, .033, "water", "#5b9d96");
  // Quiet water contours are massing cues, not a final animated water shader.
  for (const scale of [.66, .82]) add(new RingGeometry(scale, scale + .003, 80).rotateX(-Math.PI / 2).scale(lake.rx, 1, lake.rz).translate(lake.x, -1.963, lake.z), "water", "#a8d1b9");
  box(19.4, .025, 23, 2.1, .07, 7, "wood", "#b9a585");

  // Broad planting masses leave room for flower and butterfly assets later.
  for (const [x, z, rx, rz] of [[-15, 34, 3.8, 3], [-12, 46, 3, 2], [9, 35, 3, 2], [25, 45, 4, 2.5]]) {
    disc(x, z, rx + .45, rz + .45, .027, "stone", "#acb09a");
    disc(x, z, rx, rz, .035, "foliage", "#57754e");
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.4;
      add(new DodecahedronGeometry(1).scale(rx * .3, .35 + (i % 3) * .13, rz * .3).translate(x + Math.cos(angle) * rx * .57, (studyGroundHeight(x,z)??0)+.3, z + Math.sin(angle) * rz * .5), "foliage", i % 2 ? "#c9acc0" : "#a5b783");
    }
  }
  STUDY_TREES.forEach(([x, z, h], i) => {
    const floor=studyGroundHeight(x,z)??0;
    add(new CylinderGeometry(.2, .4, h * .7, 7).translate(x, floor+h * .35, z), "wood", "#76604b");
    const color = i % 3 === 1 ? "#d5b4cc" : i % 3 === 0 ? "#60826b" : "#829c75";
    add(new DodecahedronGeometry(1).scale(h * .43, h * .38, h * .39).translate(x, floor+h * .72, z), "foliage", color);
    add(new DodecahedronGeometry(1).scale(h * .28, h * .3, h * .28).translate(x + h * .23, floor+h * .65, z + .35), "foliage", color);
  });
  for (const b of STUDY_BENCHES) asset("bench", [b.x, 0, b.z], [1.5, 1, 1], b.yaw);
  for(const {x,z} of STUDY_TABLES) {
    box(x,.78,z,2.4,.14,1.4,"wood","#a78b62");
    for(const side of [-1,1]) {
      box(x+side*.85,.37,z,.2,.74,1,"wood","#6f5946");
      box(x,.44,z+side*1.3,2.4,.12,.5,"wood","#9b805d");
      for(const leg of [-1,1])box(x+leg*.85,.2,z+side*1.3,.18,.4,.4,"stone","#c8bea5");
    }
  }
  for (const [x, z] of [[-3.6, 39], [3.6, 39], [-4, 27], [4, 27], [-10, 3], [10, 3], [-18, 7], [-28, 7], [20, -8], [33, -8], [-15, -21], [15, -21], [-29, 31], [-18, 32], [15, 32], [29, 36]]) asset("lantern", [x, 0, z], [1.3, 1.3, 1.3]);
  addPlazaAcademyArchitecture(add,roof);

  for (const parts of kit.values()) parts.forEach(({ geometry }) => geometry.dispose());
  return Array.from(batches, ([material, geometries]) => {
    const geometry = mergeGeometries(geometries, false)!;
    geometries.forEach((part) => part.dispose());
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { material, geometry };
  });
}
